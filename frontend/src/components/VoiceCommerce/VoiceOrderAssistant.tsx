import { useState, useCallback } from 'react'
import { Mic, MicOff, X, Send, Bot, User } from 'lucide-react'
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition'

interface VoiceOrderAssistantProps {
  isOpen: boolean
  onClose: () => void
  onSearch: (query: string) => void
  onAddToCart?: (product: string, quantity: number) => void
}

interface Message {
  role: 'assistant' | 'user'
  text: string
}

const VoiceOrderAssistant = ({ isOpen, onClose, onSearch, onAddToCart }: VoiceOrderAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Hi! I'm your voice ordering assistant. Tell me what you'd like to order. For example: 'I want 2kg of beef sirloin' or 'Show me chicken products'." },
  ])
  const [textInput, setTextInput] = useState('')

  const processCommand = useCallback((text: string) => {
    const lower = text.toLowerCase().trim()
    setMessages((prev) => [...prev, { role: 'user', text }])

    // Parse quantity
    const quantityMatch = lower.match(/(\d+)\s*(?:kg|kgs|kilos|kilograms|grams?|g)?\s*(?:of)?\s*/i)
    const quantity = quantityMatch ? Number(quantityMatch[1]) : 1

    // Add to cart pattern
    const addMatch = lower.match(/(?:i\s+want|i(?:'d)?\s+like|add|order|get\s+me)\s+(?:(\d+)\s*(?:kg|kgs|kilos|kilograms|grams?|g)?\s*(?:of)?)?(.+?)(?:\s+(?:delivered|to)\s+.*)?$/i)
    if (addMatch) {
      const qty = addMatch[1] ? Number(addMatch[1]) : quantity
      const product = addMatch[2].trim()
      onAddToCart?.(product, qty)
      setMessages((prev) => [...prev, { role: 'assistant', text: `Got it! Adding ${qty}kg of ${product} to your cart. Would you like anything else?` }])
      return
    }

    // Show/search pattern
    const showMatch = lower.match(/(?:show\s+me|find|search|what\s+(?:do\s+you\s+)?have|do\s+you\s+(?:have|sell))\s+(.+)/i)
    if (showMatch) {
      const query = showMatch[1].trim()
      onSearch(query)
      setMessages((prev) => [...prev, { role: 'assistant', text: `Searching for "${query}". You can see the results on the page now. Would you like to add anything to your cart?` }])
      return
    }

    // Fallback: search
    onSearch(text)
    setMessages((prev) => [...prev, { role: 'assistant', text: `Let me search for "${text}". You can also try saying "Add 2kg of beef to cart" to place an order.` }])
  }, [onSearch, onAddToCart])

  const handleVoiceResult = useCallback((transcript: string, isFinal: boolean) => {
    if (isFinal) {
      processCommand(transcript)
    }
  }, [processCommand])

  const { isListening, interimTranscript, isSupported, toggle } = useVoiceRecognition({
    language: 'en-KE',
    onResult: handleVoiceResult,
  })

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (textInput.trim()) {
      processCommand(textInput.trim())
      setTextInput('')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-gray-900 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-red-600">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Voice Order Assistant</p>
                <p className="text-xs text-gray-400">Speak or type your order</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="max-h-80 space-y-3 overflow-y-auto p-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${msg.role === 'assistant' ? 'bg-red-600/20 text-red-400' : 'bg-blue-600/20 text-blue-400'}`}>
                  {msg.role === 'assistant' ? <Bot className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                </div>
                <p className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.role === 'assistant' ? 'bg-white/5 text-gray-300' : 'bg-red-600/20 text-white'}`}>
                  {msg.text}
                </p>
              </div>
            ))}
            {interimTranscript && (
              <div className="flex gap-2">
                <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-600/20 text-blue-400">
                  <User className="h-3.5 w-3.5" />
                </div>
                <p className="rounded-xl bg-blue-600/10 px-3 py-2 text-sm italic text-gray-400">{interimTranscript}...</p>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-white/10 p-3">
            <form onSubmit={handleTextSubmit} className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your order..."
                className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-red-500"
              />
              {isSupported && (
                <button
                  type="button"
                  onClick={toggle}
                  className={`grid h-9 w-9 place-items-center rounded-lg transition ${isListening ? 'bg-red-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>
              )}
              <button type="submit" className="grid h-9 w-9 place-items-center rounded-lg bg-red-600 text-white transition hover:bg-red-700">
                <Send className="h-4 w-4" />
              </button>
            </form>
            <p className="mt-2 text-center text-[11px] text-gray-500">
              Try: "Show me beef", "Add 2kg of chicken breast to cart"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VoiceOrderAssistant
