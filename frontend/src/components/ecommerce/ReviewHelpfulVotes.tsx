import React, { useCallback, useEffect, useState } from 'react'
import { ThumbsUp, ThumbsDown, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { featuresApi } from '../../services/featuresApi'

type ReviewHelpfulVotesProps = {
  reviewId: string
  initialHelpfulCount?: number
  initialNotHelpfulCount?: number
  compact?: boolean
}

type VoteState = 'helpful' | 'not-helpful' | null

const STORAGE_PREFIX = 'hincton:review-vote:'

const readLocalVote = (reviewId: string): VoteState => {
  try {
    const value = localStorage.getItem(`${STORAGE_PREFIX}${reviewId}`)
    if (value === 'helpful' || value === 'not-helpful') return value
    return null
  } catch {
    return null
  }
}

const writeLocalVote = (reviewId: string, vote: VoteState) => {
  try {
    const key = `${STORAGE_PREFIX}${reviewId}`
    if (vote) {
      localStorage.setItem(key, vote)
    } else {
      localStorage.removeItem(key)
    }
  } catch {
  }
}

const ReviewHelpfulVotes: React.FC<ReviewHelpfulVotesProps> = ({
  reviewId,
  initialHelpfulCount = 0,
  initialNotHelpfulCount = 0,
  compact = false,
}) => {
  const [helpful, setHelpful] = useState<number>(initialHelpfulCount)
  const [notHelpful, setNotHelpful] = useState<number>(initialNotHelpfulCount)
  const [userVote, setUserVote] = useState<VoteState>(null)
  const [voting, setVoting] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const local = readLocalVote(reviewId)
    if (local) {
      setUserVote(local)
    }
    setLoaded(true)
  }, [reviewId])

  const submitVote = useCallback(async (target: Exclude<VoteState, null>) => {
    if (!reviewId || voting) return

    const isTogglingSame = userVote === target

    setVoting(true)
    try {
      const isHelpful = target === 'helpful'
      const response = await featuresApi.voteReviewHelpful(reviewId, isHelpful)

      const serverHelpful = typeof response?.helpfulCount === 'number'
        ? response.helpfulCount
        : (helpful + (isHelpful && !isTogglingSame ? 1 : userVote === 'helpful' ? -1 : 0))
      const serverNotHelpful = typeof response?.notHelpfulCount === 'number'
        ? response.notHelpfulCount
        : (notHelpful + (!isHelpful && !isTogglingSame ? 1 : userVote === 'not-helpful' ? -1 : 0))

      setHelpful(Math.max(0, serverHelpful))
      setNotHelpful(Math.max(0, serverNotHelpful))

      if (isTogglingSame) {
        setUserVote(null)
        writeLocalVote(reviewId, null)
        toast.success('Vote removed')
      } else {
        setUserVote(target)
        writeLocalVote(reviewId, target)
        toast.success(response?.message || (isHelpful ? 'Thanks! Marked as helpful.' : 'Thanks for the feedback.'))
      }
    } catch (error) {
      toast.error('Could not record your vote. Please try again.')
    } finally {
      setVoting(false)
    }
  }, [reviewId, userVote, voting, helpful, notHelpful])

  const handleHelpfulClick = () => submitVote('helpful')
  const handleNotHelpfulClick = () => submitVote('not-helpful')

  const buttonBase =
    'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed'

  const helpfulActive = userVote === 'helpful'
  const notHelpfulActive = userVote === 'not-helpful'

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1 text-xs text-gray-500" aria-label={`${helpful} found this helpful, ${notHelpful} found this not helpful`}>
        <button
          type="button"
          onClick={handleHelpfulClick}
          disabled={voting || !loaded}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${
            helpfulActive ? 'bg-green-50 text-green-700' : 'hover:bg-gray-100 text-gray-600'
          }`}
          aria-pressed={helpfulActive}
          aria-label="Mark review as helpful"
        >
          {voting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : helpfulActive ? <Check className="w-3.5 h-3.5" /> : <ThumbsUp className="w-3.5 h-3.5" />}
          <span className="tabular-nums">{helpful}</span>
        </button>
        <span className="opacity-40">·</span>
        <button
          type="button"
          onClick={handleNotHelpfulClick}
          disabled={voting || !loaded}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition-colors ${
            notHelpfulActive ? 'bg-red-50 text-red-700' : 'hover:bg-gray-100 text-gray-600'
          }`}
          aria-pressed={notHelpfulActive}
          aria-label="Mark review as not helpful"
        >
          {notHelpfulActive ? <Check className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
          <span className="tabular-nums">{notHelpful}</span>
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-2">
        Was this review helpful?
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleHelpfulClick}
          disabled={voting || !loaded}
          aria-pressed={helpfulActive}
          className={`${buttonBase} ${
            helpfulActive
              ? 'bg-green-50 border-green-300 text-green-800 shadow-sm'
              : 'bg-white border-gray-200 text-gray-700 hover:border-green-300 hover:text-green-700 hover:bg-green-50'
          }`}
        >
          {voting ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : helpfulActive ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <ThumbsUp className="w-3.5 h-3.5" />
          )}
          Helpful
          <span className={`tabular-nums ${helpfulActive ? 'font-bold' : 'text-gray-500'}`}>({helpful})</span>
        </button>
        <button
          type="button"
          onClick={handleNotHelpfulClick}
          disabled={voting || !loaded}
          aria-pressed={notHelpfulActive}
          className={`${buttonBase} ${
            notHelpfulActive
              ? 'bg-red-50 border-red-300 text-red-800 shadow-sm'
              : 'bg-white border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-700 hover:bg-red-50'
          }`}
        >
          {notHelpfulActive ? <Check className="w-3.5 h-3.5" /> : <ThumbsDown className="w-3.5 h-3.5" />}
          Not helpful
          <span className={`tabular-nums ${notHelpfulActive ? 'font-bold' : 'text-gray-500'}`}>({notHelpful})</span>
        </button>
        {userVote && (
          <span className="text-[11px] text-gray-500">
            Click again to undo your vote.
          </span>
        )}
      </div>
    </div>
  )
}

export default ReviewHelpfulVotes
