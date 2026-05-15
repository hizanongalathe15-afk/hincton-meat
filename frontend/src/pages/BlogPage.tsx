import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CalendarDays } from 'lucide-react'
import { useSiteContent } from '../contexts/SiteContentContext'
import { api, resolveMediaUrl } from '../services/api'

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt?: string
  content?: string
  featuredImage?: string
  category?: string
  publishedAt?: string
  createdAt: string
  isFeatured?: boolean
  images?: string[]
}

const BlogPage = () => {
  const { profile } = useSiteContent()
  const page = profile.pages.blog
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/blog/published', { params: { limit: 24 } })
      .then((response) => setPosts(response.data.posts || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="relative overflow-hidden bg-gray-950 px-4 py-20 text-white sm:px-6 lg:px-8">
        {page.image && <img src={resolveMediaUrl(page.image)} alt={page.title} className="absolute inset-0 h-full w-full object-cover opacity-45" />}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/30" />
        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-wide text-red-300">{profile.brand.tagline}</p>
          <h1 className="mt-4 text-5xl font-extrabold md:text-7xl">{page.title}</h1>
          <p className="mt-6 max-w-3xl text-xl leading-8 text-gray-100">{page.subtitle || page.body}</p>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {loading ? (
            <div className="text-gray-600">Loading posts...</div>
          ) : posts.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => {
                const image = post.featuredImage || post.images?.[0] || page.image
                return (
                  <article key={post.id} className="overflow-hidden rounded bg-white shadow-sm ring-1 ring-gray-200 transition hover:-translate-y-1 hover:shadow-lg">
                    {image && <img src={resolveMediaUrl(image)} alt={post.title} className="h-56 w-full object-cover" />}
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <CalendarDays className="h-4 w-4" />
                        {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                        {post.category && <span className="rounded bg-red-50 px-2 py-1 text-xs font-bold text-red-700">{post.category}</span>}
                      </div>
                      <h2 className="mt-4 text-2xl font-extrabold text-gray-950">{post.title}</h2>
                      <p className="mt-3 line-clamp-3 text-gray-700">{post.excerpt || post.content || ''}</p>
                      <Link to={`/blog/${post.slug}`} className="mt-5 inline-flex items-center gap-2 font-bold text-red-700 hover:text-red-800">
                        Read More
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className="rounded bg-white p-10 text-center text-gray-600 shadow-sm">No published posts yet.</div>
          )}
        </div>
      </section>
    </div>
  )
}

export default BlogPage
