import { useState } from 'react'
import { 
  Calendar, 
  Clock,
  Heart,
  Share2,
  MessageCircle,
  ChefHat,
  TrendingUp,
  Bookmark,
  Eye
} from 'lucide-react'

interface BlogCardProps {
  post: {
    id: string
    title: string
    excerpt: string
    content: string
    image: string
    author: {
      name: string
      avatar: string
      bio: string
    }
    category: string
    tags: string[]
    readTime: number
    publishedAt: string
    views: number
    likes: number
    comments: number
    featured?: boolean
    trending?: boolean
  }
  onRead?: (postId: string) => void
  onLike?: (postId: string) => void
  onSave?: (postId: string) => void
  onShare?: (postId: string) => void
}

const BlogCard = ({ post, onRead, onLike, onSave, onShare }: BlogCardProps) => {
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  const handleLike = () => {
    setIsLiked(!isLiked)
    onLike?.(post.id)
  }

  const handleSave = () => {
    setIsSaved(!isSaved)
    onSave?.(post.id)
  }

  const handleShare = () => {
    setShowShareMenu(!showShareMenu)
    onShare?.(post.id)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  const getReadTimeColor = (readTime: number) => {
    if (readTime <= 5) return 'text-green-600'
    if (readTime <= 10) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
      post.featured ? 'ring-2 ring-red-500' : ''
    }`}>
      {/* Featured Badge */}
      {post.featured && (
        <div className="absolute top-4 left-4 z-10">
          <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
            FEATURED
          </span>
        </div>
      )}

      {/* Trending Badge */}
      {post.trending && (
        <div className="absolute top-4 right-4 z-10">
          <span className="bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            TRENDING
          </span>
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        <img
          src={post.image}
          alt={post.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Category Badge */}
        <div className="absolute bottom-4 left-4">
          <span className="bg-white/90 backdrop-blur-sm text-gray-900 text-xs font-semibold px-3 py-1 rounded-full">
            {post.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Author */}
        <div className="flex items-center gap-3 mb-4">
          <img
            src={post.author.avatar?.startsWith('http') ? post.author.avatar : `http://localhost:5000${post.author.avatar}`}
            alt={post.author.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <div className="font-semibold text-gray-900">{post.author.name}</div>
            <div className="text-sm text-gray-600">{post.author.bio}</div>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-red-600 transition-colors cursor-pointer">
          {post.title}
        </h3>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
              >
                #{tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="text-gray-500 text-xs">+{post.tags.length - 3} more</span>
            )}
          </div>
        )}

        {/* Meta Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.publishedAt)}</span>
            </div>
            <div className={`flex items-center gap-1 ${getReadTimeColor(post.readTime)}`}>
              <Clock className="w-4 h-4" />
              <span>{post.readTime} min read</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{post.views.toLocaleString()} views</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 text-sm transition-colors ${
                isLiked ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
              <span>{post.likes + (isLiked ? 1 : 0)}</span>
            </button>
            <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
              <MessageCircle className="w-4 h-4" />
              <span>{post.comments}</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className={`p-2 rounded-lg transition-colors ${
                isSaved
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Read Button */}
        <button
          onClick={() => onRead?.(post.id)}
          className="w-full mt-4 bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <ChefHat className="w-4 h-4" />
          Read Recipe
        </button>
      </div>

      {/* Share Menu */}
      {showShareMenu && (
        <div className="absolute top-full right-4 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 z-20">
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">
            Share on Facebook
          </button>
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">
            Share on Twitter
          </button>
          <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded">
            Copy Link
          </button>
        </div>
      )}
    </div>
  )
}

export default BlogCard
