import express from 'express'
import { prisma } from '../config/prisma'
import { z } from 'zod'

const router = express.Router()

const createBlogPostSchema = z.object({
  title: z.string().min(2),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  featuredImage: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isFeatured: z.boolean().default(false),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
})

const createCommentSchema = z.object({
  content: z.string().min(2),
  postId: z.string().min(1),
})

const normalizeStatus = (s: any): string => {
  const v = String(s ?? '').toLowerCase()
  if (v === 'published') return 'PUBLISHED'
  if (v === 'archived') return 'ARCHIVED'
  return 'DRAFT'
}

// GET /api/blog/published
router.get('/published', async (req, res) => {
  try {
    const { page = '1', limit = '10', category, search } = req.query
    const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 10)
    const skip = (pageNum - 1) * limitNum

    const where: any = { status: 'PUBLISHED' }
    if (category) where.category = String(category)
    if (search) {
      const s = String(search)
      where.OR = [
        { title: { contains: s, mode: 'insensitive' } },
        { excerpt: { contains: s, mode: 'insensitive' } },
        { content: { contains: s, mode: 'insensitive' } },
      ]
    }

    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
        include: {
          author: { include: { profile: true } },
          _count: { select: { comments: true } },
          images: { select: { url: true } },
        },
      }),
      prisma.blogPost.count({ where }),
    ])

    const parsed = posts.map((p: any) => ({
      ...p,
      tags: p.tags ? safeJson(p.tags, []) : [],
      images: (p.images ?? []).map((i: any) => i.url),
      author: {
        ...p.author,
        name: p.author?.profile?.fullName ?? p.author?.profile?.firstName ?? p.author?.email,
      },
    }))

    res.json({
      posts: parsed,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    console.error('Get published posts error:', error)
    res.status(500).json({ error: 'Failed to get blog posts' })
  }
})

// GET /api/blog/slug/:slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    const post = await prisma.blogPost.findFirst({
      where: { slug, status: 'PUBLISHED' },
      include: {
        author: { include: { profile: true } },
        comments: {
          where: { status: 'APPROVED' },
          orderBy: { createdAt: 'desc' },
          include: { user: { include: { profile: true } } },
        },
        images: { select: { url: true } },
      },
    })

    if (!post) return res.status(404).json({ error: 'Blog post not found' })

    await prisma.blogPost.update({
      where: { id: post.id },
      data: { views: { increment: 1 } },
    })

    const parsed = {
      ...post,
      tags: post.tags ? safeJson(post.tags, []) : [],
      images: (post.images ?? []).map((i) => i.url),
      author: {
        ...post.author,
        name: post.author?.profile?.fullName ?? post.author?.profile?.firstName ?? post.author?.email,
      },
    }

    res.json({ post: parsed })
  } catch (error) {
    console.error('Get blog post error:', error)
    res.status(500).json({ error: 'Failed to get blog post' })
  }
})

// GET /api/blog/featured
router.get('/featured', async (req, res) => {
  try {
    const { limit = '6' } = req.query
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 6)

    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED', isFeatured: true },
      take: limitNum,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: { include: { profile: true } },
        _count: { select: { comments: true } },
        images: { select: { url: true } },
      },
    })

    const parsed = posts.map((p: any) => ({
      ...p,
      tags: p.tags ? safeJson(p.tags, []) : [],
      images: (p.images ?? []).map((i: any) => i.url),
      author: {
        ...p.author,
        name: p.author?.profile?.fullName ?? p.author?.profile?.firstName ?? p.author?.email,
      },
    }))

    res.json({ posts: parsed })
  } catch (error) {
    console.error('Get featured posts error:', error)
    res.status(500).json({ error: 'Failed to get featured posts' })
  }
})

// GET /api/blog/trending
router.get('/trending', async (req, res) => {
  try {
    const { limit = '6' } = req.query
    const limitNum = Math.max(1, parseInt(String(limit), 10) || 6)

    const posts = await prisma.blogPost.findMany({
      where: { status: 'PUBLISHED' },
      take: limitNum,
      orderBy: { views: 'desc' },
      include: {
        author: { include: { profile: true } },
        _count: { select: { comments: true } },
        images: { select: { url: true } },
      },
    })

    const parsed = posts.map((p: any) => ({
      ...p,
      tags: p.tags ? safeJson(p.tags, []) : [],
      images: (p.images ?? []).map((i: any) => i.url),
      author: {
        ...p.author,
        name: p.author?.profile?.fullName ?? p.author?.profile?.firstName ?? p.author?.email,
      },
    }))

    res.json({ posts: parsed })
  } catch (error) {
    console.error('Get trending posts error:', error)
    res.status(500).json({ error: 'Failed to get trending posts' })
  }
})

// POST /api/blog (admin)
router.post('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    const data = createBlogPostSchema.parse(req.body)
    const slug = slugify(data.title)

    const existing = await prisma.blogPost.findUnique({ where: { slug } })
    if (existing) return res.status(400).json({ error: 'Post slug already exists' })

    const post = await prisma.blogPost.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        featuredImage: data.featuredImage,
        category: data.category,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        isFeatured: data.isFeatured,
        status: normalizeStatus(data.status),
        publishedAt: normalizeStatus(data.status) === 'PUBLISHED' ? new Date() : null,
        authorId: userId,
      },
    })

    res.status(201).json({ message: 'Blog post created successfully', post })
  } catch (error) {
    console.error('Create blog post error:', error)
    res.status(500).json({ error: 'Failed to create blog post' })
  }
})

// POST /api/blog/comments
router.post('/comments', async (req, res) => {
  try {
    const userId = (req as any).user?.id
    if (!userId) return res.status(401).json({ error: 'Invalid token' })

    const data = createCommentSchema.parse(req.body)

    const post = await prisma.blogPost.findUnique({ where: { id: data.postId } })
    if (!post) return res.status(404).json({ error: 'Blog post not found' })

    const comment = await prisma.blogComment.create({
      data: {
        postId: data.postId,
        userId,
        content: data.content,
        status: 'PENDING',
      },
    })

    res.status(201).json({ message: 'Comment submitted successfully', comment })
  } catch (error) {
    console.error('Create comment error:', error)
    res.status(500).json({ error: 'Failed to create comment' })
  }
})

export default router

function safeJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

