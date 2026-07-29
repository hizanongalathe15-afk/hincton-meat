import { useEffect, useRef, useState } from 'react'
import { Mic, MicOff } from 'lucide-react'

type SpeechRecognitionAlternativeLike = { transcript: string }
type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<ArrayLike<SpeechRecognitionAlternativeLike>>
}
type SpeechRecognitionErrorEventLike = Event & { error: string }
type SpeechRecognitionLike = {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onstart: (() => void) | null
  onend: (() => void) | null
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor
    webkitSpeechRecognition?: SpeechRecognitionConstructor
  }
}

type VoiceSearchButtonProps = {
  onResult: (query: string) => void
  className?: string
}

const VoiceSearchButton = ({ onResult, className = '' }: VoiceSearchButtonProps) => {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const [supported, setSupported] = useState(false)
  const [listening, setListening] = useState(false)
  const [message, setMessage] = useState('Search by voice')

  useEffect(() => {
    setSupported(Boolean(window.SpeechRecognition || window.webkitSpeechRecognition))
    return () => recognitionRef.current?.abort()
  }, [])

  const beginListening = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) return

    const recognition = new Recognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = navigator.language || 'en-KE'
    recognition.onstart = () => {
      setListening(true)
      setMessage('Listening…')
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = (event) => {
      setListening(false)
      setMessage(event.error === 'not-allowed' ? 'Microphone permission was not allowed' : 'Voice search could not hear you')
    }
    recognition.onresult = (event) => {
      const query = event.results[0]?.[0]?.transcript.trim()
      if (query) {
        setMessage(`Searching for “${query}”`)
        onResult(query)
      }
    }
    recognitionRef.current = recognition
    recognition.start()
  }

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    beginListening()
  }

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={toggleListening}
      className={`absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full transition focus:outline-none focus:ring-2 focus:ring-red-400 ${listening ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-stone-500 hover:bg-red-50 hover:text-red-700'} ${className}`}
      aria-label={listening ? 'Stop voice search' : 'Search by voice'}
      aria-pressed={listening}
      title={message}
    >
      {listening && <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping" aria-hidden="true" />}
      {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      <span className="sr-only" aria-live="polite">{message}</span>
    </button>
  )
}

export default VoiceSearchButton
