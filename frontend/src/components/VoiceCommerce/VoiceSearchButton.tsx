import { useState, useCallback } from 'react'
import { Mic, MicOff, X } from 'lucide-react'
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition'

interface VoiceSearchButtonProps {
  onSearch: (query: string) => void
  onAddToCart?: (product: string, quantity: number) => void
  onNavigate?: (page: string) => void
  language?: string
}

const parseVoiceCommand = (text: string): { action: string; query: string; quantity?: number } => {
  const lower = text.toLowerCase().trim()

  // Navigation commands
  if (lower.includes('go to checkout') || lower.includes('checkout')) {
    return { action: 'navigate', query: '/checkout' }
  }
  if (lower.includes('go to cart') || lower.includes('my cart')) {
    return { action: 'navigate', query: '/cart' }
  }
  if (lower.includes("what's on sale") || lower.includes('deals') || lower.includes('offers')) {
    return { action: 'search', query: 'sale' }
  }

  // Add to cart commands
  const addMatch = lower.match(/add\s+(?:(\d+)\s*(?:kg|kgs|kilos|kilograms)?\s*(?:of)?)?(.+?)(?:\s+to\s+(?:my\s+)?cart|$)/)
  if (addMatch) {
    const quantity = addMatch[1] ? Number(addMatch[1]) : 1
    const product = addMatch[2].trim()
    return { action: 'add_to_cart', query: product, quantity }
  }

  // Show/search commands
  const showMatch = lower.match(/(?:show\s+me|find|search\s+for|get\s+me|i\s+want)\s+(.+)/)
  if (showMatch) {
    return { action: 'search', query: showMatch[1].trim() }
  }

  // Default: treat as search query
  return { action: 'search', query: text.trim() }
}

const VoiceSearchButton = ({ onSearch, onAddToCart, onNavigate, language = 'en-KE' }: VoiceSearchButtonProps) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [, setLastCommand] = useState('')

  const handleResult = useCallback((transcript: string, isFinal: boolean) => {
    if (!isFinal) return

    const command = parseVoiceCommand(transcript)
    setLastCommand(transcript)

    switch (command.action) {
      case 'navigate':
        onNavigate?.(command.query)
        break
      case 'add_to_cart':
        onAddToCart?.(command.query, command.quantity || 1)
        break
      case 'search':
      default:
        onSearch(command.query)
        break
    }
  }, [onSearch, onAddToCart, onNavigate])

  const { isListening, interimTranscript, isSupported, toggle, stop } = useVoiceRecognition({
    language,
    onResult: handleResult,
  })

  if (!isSupported) return null

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={toggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          relative grid h-10 w-10 place-items-center rounded-full transition-all duration-300
          ${isListening
            ? 'bg-red-600 text-white shadow-lg shadow-red-600/40'
            : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
          }
        `}
        aria-label={isListening ? 'Stop listening' : 'Voice search'}
      >
        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}

        {/* Pulse animation when listening */}
        {isListening && (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-red-600 opacity-30" />
            <span className="absolute -inset-1 animate-pulse rounded-full border-2 border-red-500/50" />
          </>
        )}
      </button>

      {/* Tooltip */}
      {showTooltip && !isListening && (
        <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white shadow-lg">
          Try: "Show me beef" or "Add ribeye to cart"
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}

      {/* Listening overlay with waveform */}
      {isListening && (
        <div className="absolute left-12 z-50 flex items-center gap-2 rounded-lg bg-gray-900/95 px-4 py-2 shadow-xl backdrop-blur">
          <div className="flex items-end gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 rounded-full bg-red-500"
                style={{
                  height: `${8 + Math.random() * 16}px`,
                  animation: `pulse 0.5s ease-in-out ${i * 0.1}s infinite alternate`,
                }}
              />
            ))}
          </div>
          <span className="text-sm text-gray-300">
            {interimTranscript || 'Listening...'}
          </span>
          <button onClick={stop} className="ml-2 rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

export default VoiceSearchButton
