import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, resolveMediaUrl } from '../services/api'

type BlogPost = {
  title: string
  content?: string
  excerpt?: string
  featuredImage?: string
  images?: string[]
  category?: string
  publishedAt?: string
  createdAt: string
  author?: { name?: string }
}

const BlogPostPage = () => {
  const { slug } = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)

  useEffect(() => {
    if (!slug) return
    api.get(`/blog/slug/${slug}`)
      .then((response) => setPost(response.data.post))
      .catch(() => setPost(null))
  }, [slug])

  if (!post) return <div className="mx-auto max-w-4xl px-4 py-20 text-gray-600">Loading post...</div>

  const image = post.featuredImage || post.images?.[0]

  return (
    <article className="bg-white">
      {image && <img src={resolveMediaUrl(image)} alt={post.title} className="h-[28rem] w-full object-cover" />}
      <div className="mx-auto max-w-4xl px-4 py-14">
        <p className="text-sm font-bold uppercase tracking-wide text-red-700">{post.category || 'Blog'}</p>
        <h1 className="mt-3 text-5xl font-extrabold leading-tight text-gray-950">{post.title}</h1>
        <p className="mt-4 text-sm text-gray-500">
          {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
          {post.author?.name ? ` by ${post.author.name}` : ''}
        </p>
        {post.excerpt && <p className="mt-8 text-xl leading-8 text-gray-700">{post.excerpt}</p>}
        <div className="mt-10 whitespace-pre-line text-lg leading-9 text-gray-800">{post.content}</div>
      </div>
    </article>
  )
}

export default BlogPostPage
