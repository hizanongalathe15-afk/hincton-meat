import { useMemo, useState, useEffect, useRef } from 'react'
import { 
  MessageCircle, 
  X, 
  Send,
  Check,
  Minimize2,
  Maximize2,
  Phone,
  Mail
} from 'lucide-react'
import { useSiteContent } from '../contexts/SiteContentContext'
import { chatApi } from '../services/buyerApi'
import LinkifiedText from '../components/ui/LinkifiedText'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot' | 'agent'
  timestamp: Date
  agentName?: string
}

interface LiveChatWidgetProps {
  isOpen?: boolean
  onToggle?: () => void
}

const LiveChatWidget = ({ isOpen: initialIsOpen = false, onToggle }: LiveChatWidgetProps) => {
  const { profile } = useSiteContent()
  const brand = profile.brand
  const chatSessionId = useMemo(() => {
    const existing = localStorage.getItem('supportSessionId')
    if (existing) return existing
    const next = `support-${Date.now()}-${Math.random().toString(36).slice(2)}`
    localStorage.setItem('supportSessionId', next)
    return next
  }, [])
  const whatsappHref = useMemo(() => {
    const digits = (brand.phoneHref || brand.phone || '').replace(/\D/g, '')
    const phone = digits.startsWith('254') ? digits : digits.startsWith('0') ? `254${digits.slice(1)}` : digits
    const text = encodeURIComponent(`Hello ${brand.name}, I need help with an inquiry.`)
    return phone ? `https://wa.me/${phone}?text=${text}` : ''
  }, [brand.name, brand.phone, brand.phoneHref])
  const [isOpen, setIsOpen] = useState(initialIsOpen)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! Welcome to ${brand.name}. How can I help you today?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const quickReplies = [
    'Track my order',
    'Product information',
    'Delivery issues',
    'Payment help',
    'Returns & refunds',
    'Speak to agent'
  ]

  const agentResponses = {
    'track my order': 'To track your order, please provide your order number. You can find it in your confirmation email or account dashboard.',
    'product information': 'I can help you with product details, availability, pricing, and nutritional information. What specific product are you interested in?',
    'delivery issues': 'I\'m sorry to hear about delivery issues. Let me help you resolve this. Please provide your order number and describe the problem.',
    'payment help': 'I can assist with payment issues, M-PESA transactions, and billing questions. What specific payment concern do you have?',
    'returns & refunds': 'Our return policy allows returns within 24 hours for quality issues. Let me know your order number and reason for return.',
    'speak to agent': whatsappHref
      ? 'Use the WhatsApp button below to reach the admin directly. Your message here is also saved when you are signed in.'
      : 'Please call or email support using the contact options below.'
  }

  useEffect(() => {
    setMessages((current) => {
      if (current.length !== 1) return current
      return [{
        ...current[0],
        text: `Hello! Welcome to ${brand.name}. How can I help you today?`,
      }]
    })
  }, [brand.name])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleToggle = () => {
    const newIsOpen = !isOpen
    setIsOpen(newIsOpen)
    setIsMinimized(false)
    if (newIsOpen) {
      setUnreadCount(0)
    }
    onToggle?.()
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    chatApi.sendMessage({
      sessionId: chatSessionId,
      message: text.trim(),
      from: 'user',
    }).catch(() => {
      setMessages(prev => [...prev, {
        id: `${Date.now()}-save-error`,
        text: 'I could not save this chat to support right now. Please use WhatsApp for urgent help.',
        sender: 'bot',
        timestamp: new Date(),
      }])
    })

    setTimeout(() => {
      const lowerText = text.toLowerCase()
      const responseText = agentResponses[lowerText as keyof typeof agentResponses] || 
        'Thank you. Your chat is saved for admin review. For urgent help, use WhatsApp below.'
      
      const isAgentRequest = lowerText.includes('speak to agent') || lowerText.includes('human')
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: isAgentRequest ? 'agent' : 'bot',
        timestamp: new Date(),
        agentName: isAgentRequest ? 'Sarah - Customer Support' : undefined
      }

      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)

      if (!isOpen) {
        setUnreadCount(prev => prev + 1)
      }
    }, 1000 + Math.random() * 1000)
  }

  const handleQuickReply = (reply: string) => {
    handleSendMessage(reply)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage(inputValue)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-green-700"
            aria-label="Open WhatsApp inquiry"
          >
            <Phone className="h-5 w-5" />
          </a>
        )}
        <button
          onClick={handleToggle}
          className="relative bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 hover:scale-110"
          aria-label="Open customer support chat"
        >
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white rounded-lg shadow-2xl z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-400' : 'bg-gray-400'
            }`} />
          </div>
          <div>
            <div className="font-semibold">Customer Support</div>
            <div className="text-xs text-red-100">
              {isConnected ? 'Online' : 'Offline'} • {isConnected ? 'Chat or WhatsApp support' : 'We\'ll be back soon'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMinimize}
            className="p-1 hover:bg-red-700 rounded transition-colors"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-red-700 rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto h-[420px] bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div className={`max-w-[80%] ${
                  message.sender === 'user' ? 'order-2' : 'order-1'
                }`}>
                  <div className={`px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-red-600 text-white'
                      : message.sender === 'agent'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    {message.agentName && (
                      <div className="text-xs opacity-75 mb-1">{message.agentName}</div>
                    )}
                    <div className="text-sm"><LinkifiedText text={message.text} /></div>
                  </div>
                  <div className={`text-xs text-gray-500 mt-1 ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}>
                    {formatTime(message.timestamp)}
                    {message.sender === 'user' && <Check className="w-3 h-3 inline ml-1" />}
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies */}
          {messages.length === 1 && (
            <div className="px-4 pb-2">
              <div className="text-xs text-gray-600 mb-2">Quick replies:</div>
              <div className="flex flex-wrap gap-2">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => handleQuickReply(reply)}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                disabled={!isConnected}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || !isConnected}
                className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="px-4 pb-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex flex-wrap items-center gap-4">
                <a href={brand.phoneHref} className="flex items-center gap-1 hover:text-gray-700">
                  <Phone className="w-3 h-3" />
                  <span>{brand.phone}</span>
                </a>
                <a href={brand.emailHref} className="flex items-center gap-1 hover:text-gray-700">
                  <Mail className="w-3 h-3" />
                  <span>{brand.email}</span>
                </a>
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold text-green-700 hover:text-green-800">
                    <Phone className="w-3 h-3" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
              <div>Powered by {brand.name}</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default LiveChatWidget
