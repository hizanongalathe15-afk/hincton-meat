import React, { useEffect, useMemo, useRef, useState } from 'react'
import { X, Gift, Sparkles, Loader2, CheckCircle2, PartyPopper } from 'lucide-react'
import toast from 'react-hot-toast'
import { featuresApi } from '../../services/featuresApi'

type SpinToWinModalProps = {
  isOpen: boolean
  onClose: () => void
}

type SpinSegment = {
  index: number
  label: string
  rewardType: 'POINTS' | 'DISCOUNT' | 'PRODUCT' | 'FREE_SHIPPING' | 'TRY_AGAIN'
  rewardValue?: number
  rewardCode?: string
  bg: string
  text: string
}

const DEFAULT_SEGMENTS: SpinSegment[] = [
  { index: 0, label: '50 pts', rewardType: 'POINTS', rewardValue: 50, bg: '#b91c1c', text: '#ffffff' },
  { index: 1, label: 'Try Again', rewardType: 'TRY_AGAIN', bg: '#f8fafc', text: '#334155' },
  { index: 2, label: '10% OFF', rewardType: 'DISCOUNT', rewardValue: 10, rewardCode: 'SPIN10', bg: '#f59e0b', text: '#ffffff' },
  { index: 3, label: '20 pts', rewardType: 'POINTS', rewardValue: 20, bg: '#fef3c7', text: '#92400e' },
  { index: 4, label: 'Free Ship', rewardType: 'FREE_SHIPPING', rewardCode: 'FREESHIP', bg: '#0ea5e9', text: '#ffffff' },
  { index: 5, label: 'Try Again', rewardType: 'TRY_AGAIN', bg: '#ecfdf5', text: '#047857' },
  { index: 6, label: '15% OFF', rewardType: 'DISCOUNT', rewardValue: 15, rewardCode: 'SPIN15', bg: '#d97706', text: '#ffffff' },
  { index: 7, label: '100 pts', rewardType: 'POINTS', rewardValue: 100, bg: '#16a34a', text: '#ffffff' },
]

const SEGMENT_ANGLE = 360 / 8

const mapResultToSegmentIndex = (result: any, segments: SpinSegment[]): number => {
  if (result?.segmentIndex != null) {
    const idx = Number(result.segmentIndex)
    if (!Number.isNaN(idx) && idx >= 0 && idx < segments.length) return idx
  }
  if (typeof result?.rewardType === 'string') {
    const found = segments.findIndex(s => s.rewardType === result.rewardType)
    if (found !== -1) return found
  }
  if (typeof result?.prize === 'string' && result.prize.toLowerCase().includes('discount')) {
    const discountIdx = segments.findIndex(s => s.rewardType === 'DISCOUNT')
    if (discountIdx !== -1) return discountIdx
  }
  return Math.floor(Math.random() * segments.length)
}

const SpinToWinModal: React.FC<SpinToWinModalProps> = ({ isOpen, onClose }) => {
  const [segments] = useState<SpinSegment[]>(DEFAULT_SEGMENTS)
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [winner, setWinner] = useState<SpinSegment | null>(null)
  const [resultPayload, setResultPayload] = useState<any>(null)
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const spinTimeoutRef = useRef<number | null>(null)
  const wheelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (spinTimeoutRef.current) window.clearTimeout(spinTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  const conicGradient = useMemo(() => {
    const stops = segments
      .map((seg, i) => {
        const start = i * SEGMENT_ANGLE
        const end = (i + 1) * SEGMENT_ANGLE
        return `${seg.bg} ${start}deg ${end}deg`
      })
      .join(', ')
    return `conic-gradient(from -22.5deg, ${stops})`
  }, [segments])

  const handlePlay = async () => {
    if (spinning || loading) return
    setWinner(null)
    setResultPayload(null)
    setLoading(true)
    let result: any = null

    try {
      result = await featuresApi.playSpinWin()
      setAttemptsRemaining(result?.remainingSpins != null ? Number(result.remainingSpins) : 0)
    } catch (error) {
      toast.error('Could not spin with the server. Using a local spin result.')
      result = { simulated: true }
    } finally {
      setLoading(false)
    }

    const winningIndex = mapResultToSegmentIndex(result, segments)
    const targetSegment = segments[winningIndex]

    const targetAngle = 360 - (winningIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2)
    const fullTurns = 5 + Math.floor(Math.random() * 3)
    const currentMod = ((rotation % 360) + 360) % 360
    const next = rotation + (fullTurns * 360) + ((targetAngle - currentMod + 360) % 360)

    setSpinning(true)
    setRotation(next)

    spinTimeoutRef.current = window.setTimeout(() => {
      setSpinning(false)
      setWinner(targetSegment)
      setResultPayload(result)
      const message = targetSegment.rewardType === 'TRY_AGAIN'
        ? 'Better luck next time!'
        : targetSegment.rewardType === 'POINTS'
          ? `You won ${targetSegment.rewardValue} loyalty points! 🎉`
          : targetSegment.rewardType === 'DISCOUNT'
            ? `You won ${targetSegment.label}! Use code ${targetSegment.rewardCode}`
            : `You won ${targetSegment.label}!`
      toast.custom(
        (t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-sm w-full bg-white shadow-2xl rounded-2xl flex items-start gap-3 p-4 border border-amber-100`}>
            <div className="shrink-0 p-2 rounded-full bg-amber-100 text-amber-600">
              <PartyPopper className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-gray-900">Spin Result</div>
              <div className="mt-1 text-sm text-gray-700">{message}</div>
            </div>
          </div>
        ),
        { duration: 5000 },
      )
    }, 5200)
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="spin-win-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={spinning ? undefined : onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-3xl bg-gradient-to-b from-amber-50 via-white to-red-50 shadow-2xl overflow-hidden border border-amber-200">
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-red-600 to-amber-500 opacity-90" />
        <div className="absolute top-0 inset-x-0 flex items-start justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/15 backdrop-blur-sm">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-white/80 font-semibold">Daily Reward</div>
              <h2 id="spin-win-title" className="text-lg font-extrabold text-white">Spin to Win</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={spinning}
            className="shrink-0 p-2 rounded-full bg-white/15 backdrop-blur-sm hover:bg-white/25 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close spin to win"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative pt-28 pb-6 px-6">
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-72 h-72 sm:w-80 sm:h-80">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-300 via-red-500 to-amber-400 blur-xl opacity-40" />
              <div className="absolute inset-0 rounded-full bg-white shadow-2xl p-3 ring-8 ring-white/50">
                <div
                  ref={wheelRef}
                  className="relative w-full h-full rounded-full overflow-hidden shadow-inner"
                  style={{
                    background: conicGradient,
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.25, 1)' : 'none',
                  }}
                >
                  {segments.map((seg, i) => {
                    const angle = i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2
                    return (
                      <div
                        key={i}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        style={{ transform: `rotate(${angle}deg)` }}
                      >
                        <div
                          className="absolute left-1/2 top-4 -translate-x-1/2 origin-bottom text-[11px] font-extrabold uppercase tracking-wider whitespace-nowrap"
                          style={{
                            color: seg.text,
                            textShadow: seg.bg === '#ffffff' || seg.bg === '#f8fafc' ? '0 1px 2px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.25)',
                            maxWidth: '7.5rem',
                          }}
                        >
                          {seg.label}
                        </div>
                      </div>
                    )
                  })}
                  {segments.map((_, i) => (
                    <div
                      key={`divider-${i}`}
                      className="absolute top-0 left-1/2 w-px h-1/2 bg-white/40 origin-bottom"
                      style={{ transform: `translateX(-50%) rotate(${i * SEGMENT_ANGLE}deg)` }}
                    />
                  ))}
                </div>
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white shadow-lg border-4 border-amber-400 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-amber-500" />
                </div>
              </div>
              <div className="absolute left-1/2 -top-2 -translate-x-1/2 w-0 h-0 border-x-[14px] border-x-transparent border-t-[26px] border-t-red-700 drop-shadow-md" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-5 text-sm text-gray-600">
            {attemptsRemaining != null && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-700">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {attemptsRemaining > 0 ? `${attemptsRemaining} spin${attemptsRemaining === 1 ? '' : 's'} left today` : 'No spins left today'}
              </div>
            )}
          </div>

          {winner && !spinning && (
            <div className={`mb-5 rounded-2xl border p-4 flex items-start gap-3 ${
              winner.rewardType === 'TRY_AGAIN'
                ? 'bg-slate-50 border-slate-200'
                : 'bg-gradient-to-r from-amber-50 to-red-50 border-amber-200'
            }`}>
              <div className={`shrink-0 p-2 rounded-xl ${
                winner.rewardType === 'TRY_AGAIN' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-600'
              }`}>
                {winner.rewardType === 'TRY_AGAIN' ? (
                  <Sparkles className="w-5 h-5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Your Prize</div>
                <div className="mt-0.5 font-extrabold text-gray-900 text-lg">{winner.label}</div>
                {winner.rewardCode && (
                  <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-white border border-amber-200 px-3 py-1.5">
                    <span className="text-xs text-gray-500">Code</span>
                    <span className="font-mono font-bold text-amber-700 tracking-wider">{winner.rewardCode}</span>
                  </div>
                )}
                {resultPayload?.message && (
                  <div className="mt-1 text-sm text-gray-600">{resultPayload.message}</div>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handlePlay}
              disabled={spinning || loading || (attemptsRemaining !== null && attemptsRemaining <= 0)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-3 text-base font-extrabold text-white shadow-xl shadow-red-600/25 transition-all"
            >
              {loading || spinning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {spinning ? 'Spinning…' : 'Preparing…'}
                </>
              ) : (
                <>
                  <Gift className="w-5 h-5" />
                  {winner ? 'Spin Again' : 'Tap to Spin'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={spinning}
              className="px-6 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpinToWinModal
