import React, { useMemo, useState, useEffect, useRef } from 'react'
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
import { getApiHost } from '../services/api'
import LinkifiedText from '../components/ui/LinkifiedText'
import { io, Socket } from 'socket.io-client'

interface Message {
  id: string
  text: string
  sender: 'user' | 'bot' | 'agent'
  timestamp: Date
  agentName?: string
}

interface SavedChatMessage {
  id: string
  roomId?: string
  sessionId?: string
  content?: string
  message?: string
  isFromUser?: boolean
  senderName?: string
  timestamp?: string
  createdAt?: string
}

interface LiveChatWidgetProps {
  isOpen?: boolean
  onToggle?: () => void
}

const defaultBrand = {
  name: 'Hincton',
  phone: '',
  email: '',
  phoneHref: '',
  emailHref: ''
}

const supportedLanguages = ['en', 'es', 'fr', 'sw'] as const
type SupportedLanguage = typeof supportedLanguages[number]

// Sentiment analysis for customer satisfaction
const detectSentiment = (text: string): 'positive' | 'negative' | 'neutral' => {
  const lower = text.toLowerCase()
  const negative = /(angry|frustrated|upset|horrible|terrible|worst|hate|bad|useless|broken|problem|issue|help|urgent|asap|please help)/i
  const positive = /(thank|great|amazing|excellent|perfect|good|happy|satisfied|resolved|solved|works|awesome)/i
  
  if (negative.test(lower)) return 'negative'
  if (positive.test(lower)) return 'positive'
  return 'neutral'
}

// Response cache to avoid recomputing
const responseCache = new Map<string, string>()

// Rate limiting tracker
const messageTimestamps: number[] = []
const MAX_MESSAGES = 5
const TIME_WINDOW = 30000 // 30 seconds

const isRateLimited = (): boolean => {
  const now = Date.now()
  messageTimestamps.push(now)
  
  // Remove old timestamps outside the window
  while (messageTimestamps.length > 0 && messageTimestamps[0] < now - TIME_WINDOW) {
    messageTimestamps.shift()
  }
  
  return messageTimestamps.length > MAX_MESSAGES
}

const detectLanguage = (text: string): SupportedLanguage => {
  const lower = text.toLowerCase()
  if (/\b(hola|gracias|por favor|buenos|buenas|ayuda|orden|pedido|cliente)\b/.test(lower)) return 'es'
  if (/\b(bonjour|salut|merci|svp|aide|commande|client|produit|ca va)\b/.test(lower)) return 'fr'
  if (/\b(jambo|habari|asante|karibu|msaada|vipi|uko|poa)\b/.test(lower)) return 'sw'
  return 'en'
}

const translateText = (text: string, language: SupportedLanguage) => {
  if (language === 'en') return text

  const translations: Record<SupportedLanguage, Record<string, string>> = {
    en: {},
    es: {
      'Hello! Welcome to': 'Hola! Bienvenido a',
      'How can I help you today?': 'En que puedo ayudarte hoy?',
      'To track your order, please provide your order number. You can find it in your confirmation email or account dashboard.': 'Para rastrear su pedido, por favor proporcione su numero de pedido. Puede encontrarlo en su correo electronico de confirmacion o en su panel de control.',
      'I can help you with product details, availability, pricing, and nutritional information. What specific product are you interested in?': 'Puedo ayudarte con detalles del producto, disponibilidad, precios e informacion nutricional. Que producto especifico te interesa?',
      'I am sorry to hear about delivery issues. Let me help you resolve this. Please provide your order number and describe the problem.': 'Lamento escuchar sobre problemas de entrega. Dejame ayudarte a resolver esto. Por favor proporciona tu numero de pedido y describe el problema.',
      'I can assist with payment issues, M-PESA transactions, and billing questions. What specific payment concern do you have?': 'Puedo ayudarte con problemas de pago, transacciones M-PESA y preguntas de facturacion. Que preocupacion especifica de pago tienes?',
      'Our return policy allows returns within 24 hours for quality issues. Let me know your order number and reason for return.': 'Nuestra politica de devoluciones permite devoluciones dentro de las 24 horas por problemas de calidad. Dime tu numero de pedido y la razon de la devolucion.',
      'Use the WhatsApp button below to reach the admin directly. Your message here is also saved when you are signed in.': 'Usa el boton de WhatsApp a continuacion para contactar al administrador directamente. Tu mensaje aqui tambien se guarda cuando has iniciado sesion.',
      'Please call or email support using the contact options below.': 'Por favor, llama o envia un correo al soporte usando las opciones de contacto a continuacion.',
      'I understand your message and I can answer in English, Espanol, Francais, or Kiswahili.': 'Entiendo tu mensaje y puedo responder en English, Espanol, Francais o Kiswahili.',
      'Thank you for reaching out! Let me know how I can help.': 'Gracias por contactarnos! Dime como puedo ayudarte.',
      'Thank you. Your chat is saved for admin review. For urgent help, use WhatsApp below.': 'Gracias. Tu chat se guarda para revision del administrador. Para ayuda urgente, usa WhatsApp a continuacion.'
    },
    fr: {
      'Hello! Welcome to': 'Bonjour! Bienvenue chez',
      'How can I help you today?': 'Comment puis-je vous aider?',
      'To track your order, please provide your order number. You can find it in your confirmation email or account dashboard.': 'Pour suivre votre commande, veuillez fournir votre numero de commande. Vous pouvez le trouver dans votre e-mail de confirmation ou votre tableau de bord.',
      'I can help you with product details, availability, pricing, and nutritional information. What specific product are you interested in?': 'Je peux vous aider avec les details du produit, la disponibilite, les prix et les informations nutritionnelles. Quel produit specifique vous interesse?',
      'I am sorry to hear about delivery issues. Let me help you resolve this. Please provide your order number and describe the problem.': 'Je suis desole d entendre parler de problemes de livraison. Permettez-moi de vous aider a resoudre cela. Veuillez fournir votre numero de commande et decrire le probleme.',
      'I can assist with payment issues, M-PESA transactions, and billing questions. What specific payment concern do you have?': 'Je peux vous aider avec des problemes de paiement, des transactions M-PESA et des questions de facturation. Quelle preoccupation de paiement avez-vous?',
      'Our return policy allows returns within 24 hours for quality issues. Let me know your order number and reason for return.': 'Notre politique de retour permet les retours dans les 24 heures pour des problemes de qualite. Faites-moi savoir votre numero de commande et la raison du retour.',
      'Use the WhatsApp button below to reach the admin directly. Your message here is also saved when you are signed in.': 'Utilisez le bouton WhatsApp ci-dessous pour contacter directement l administrateur. Votre message ici est egalement enregistre lorsque vous etes connecte.',
      'Please call or email support using the contact options below.': 'Veuillez appeler ou envoyer un e-mail au support en utilisant les options de contact ci-dessous.',
      'I understand your message and I can answer in English, Espanol, Francais, or Kiswahili.': 'Je comprends votre message et je peux repondre en English, Espanol, Francais ou Kiswahili.',
      'Thank you for reaching out! Let me know how I can help.': 'Merci de nous avoir contactes! Dites-moi comment je peux vous aider.',
      'Thank you. Your chat is saved for admin review. For urgent help, use WhatsApp below.': 'Merci. Votre chat est enregistre pour examen de l administrateur. Pour une aide urgente, utilisez WhatsApp ci-dessous.'
    },
    sw: {
      'Hello! Welcome to': 'Habari! Karibu kwa',
      'How can I help you today?': 'Ninaweza kukusaidiaje leo?',
      'To track your order, please provide your order number. You can find it in your confirmation email or account dashboard.': 'Ili kufuatilia agizo lako, tafadhali toa nambari ya agizo lako. Unaweza kuipata kwenye barua pepe yako ya uthibitisho au dashibodi.',
      'I can help you with product details, availability, pricing, and nutritional information. What specific product are you interested in?': 'Ninaweza kukusaidia kwa maelezo ya bidhaa, upatikanaji, bei, na taarifa za lishe. Ni bidhaa gani maalum unayopendelea?',
      'I am sorry to hear about delivery issues. Let me help you resolve this. Please provide your order number and describe the problem.': 'Samahani kusikia kuhusu matatizo ya usafirishaji. Niruhusu nikusaidie kutatua hili. Tafadhali toa nambari ya agizo lako na elezea tatizo.',
      'I can assist with payment issues, M-PESA transactions, and billing questions. What specific payment concern do you have?': 'Ninaweza kukusaidia na masuala ya malipo, miamala ya M-PESA, na maswali ya bili. Je, una wasiwasi gani maalum wa malipo?',
      'Our return policy allows returns within 24 hours for quality issues. Let me know your order number and reason for return.': 'Sera yetu ya kurudisha inaruhusu kurudisha ndani ya saa 24 kwa matatizo ya ubora. Nijulishe nambari ya agizo lako na sababu ya kurudisha.',
      'Use the WhatsApp button below to reach the admin directly. Your message here is also saved when you are signed in.': 'Tumia kitufe cha WhatsApp hapa chini kumfikia msimamizi moja kwa moja. Ujumbe wako pia unaohifadhiwa unapokuwa umeingia.',
      'Please call or email support using the contact options below.': 'Tafadhali piga simu au tuma barua pepe kwa msaada ukitumia chaguzi za mawasiliano hapa chini.',
      'I understand your message and I can answer in English, Espanol, Francais, or Kiswahili.': 'Ninaelewa ujumbe wako na ninaweza kujibu kwa English, Espanol, Francais, au Kiswahili.',
      'Thank you for reaching out! Let me know how I can help.': 'Asante kwa kuwasiliana nasi! Nipe habari jinsi ninavyoweza kusaidia.',
      'Thank you. Your chat is saved for admin review. For urgent help, use WhatsApp below.': 'Asante. Gumzo lako linahifadhiwa kwa ukaguzi wa msimamizi. Kwa msaada wa dharura, tumia WhatsApp hapa chini.'
    }
  }

  const template = translations[language]
  if (!template) return text
  return Object.entries(template).reduce((result, [key, value]) => result.split(key).join(value), text)
}

const createBotResponse = (lowerText: string, language: SupportedLanguage, whatsappHref: string) => {
  // Check cache first
  const cacheKey = `${lowerText}-${language}`
  if (responseCache.has(cacheKey)) {
    return responseCache.get(cacheKey)!
  }

  let response = ''

  // Greetings - engage fully as a reasoning being
  if (/\b(hi|hello|hey|good morning|good afternoon|good evening|welcome|hola|bonjour|salut|jambo|habari)\b/.test(lowerText)) {
    const greetings: Record<SupportedLanguage, string> = {
      en: 'Hello! I am here to help you with any questions about orders, products, payments, delivery, or returns. What brings you here today?',
      es: 'Hola! Estoy aqui para ayudarte con preguntas sobre pedidos, productos, pagos, entrega o devoluciones. Que te trae aqui hoy?',
      fr: 'Bonjour! Je suis ici pour vous aider avec vos questions sur les commandes, les produits, les paiements, la livraison ou les retours. Qu\'est-ce qui vous amene aujourd\'hui?',
      sw: 'Habari! Niko hapa kusaidia na maswali yako kuhusu maagizo, bidhaa, malipo, utoaji au kurudisha. Kuna nini kinachokukumbusha leo?'
    }
    response = greetings[language]
  }
  // Order tracking
  else if (/\b(order|orderno|order number|track|where|status|shipped)\b/.test(lowerText)) {
    response = translateText('To track your order, please provide your order number. You can find it in your confirmation email or account dashboard. Once I have it, I can tell you exactly where your order is and when it will arrive.', language)
  }
  // Product inquiries
  else if (/\b(product|product information|price|pricing|availability|nutrition|nutritional|ingredients|quality)\b/.test(lowerText)) {
    response = translateText('I can help you with detailed product information including specifications, pricing, availability, and nutritional facts. This helps me understand your needs better. Which product would you like to know more about?', language)
  }
  // Delivery issues
  else if (/\b(delivery|shipping|delivered|shipment|arrived|late|not received|missing)\b/.test(lowerText)) {
    response = translateText('I understand delivery issues can be frustrating. Let me help resolve this quickly. Please provide your order number and describe what happened. I will investigate and find a solution for you.', language)
  }
  // Payment issues
  else if (/\b(payment|mpesa|m-pesa|checkout|billing|paid|transaction|charge|card)\b/.test(lowerText)) {
    response = translateText('I can assist with any payment concerns including M-PESA transactions, card payments, and billing inquiries. What specific payment issue are you experiencing? I will help you resolve it.', language)
  }
  // Returns and refunds
  else if (/\b(return|refund|exchange|refunds|money back|quality)\b/.test(lowerText)) {
    response = translateText('Our return policy allows returns within 24 hours for quality issues. I want to make sure you are satisfied. Please tell me your order number and reason for return, and I will process this for you promptly.', language)
  }
  // Agent escalation
  else if (/\b(agent|admin|human|supervisor|manager|support|talk to|speak to)\b/.test(lowerText)) {
    response = translateText(whatsappHref
      ? 'I understand you need direct support. You can reach our admin team instantly via WhatsApp using the button below, or call or email using the contact options. I have saved all our conversation for them to review.'
      : 'I understand you need direct support. Please use the contact options below to reach our team directly. Your chat history is saved.', language)
  }
  // Satisfaction check - end of conversation
  else if (/\b(thanks|thank you|satisfied|resolved|fixed|solved|good|ok|okay|great|done|bye|goodbye)\b/.test(lowerText)) {
    const satisfactionMsgs: Record<SupportedLanguage, string> = {
      en: 'I am happy your issue is resolved! To ensure you had the best experience, may I ask: Did we meet your expectations today? Your feedback helps us improve. Feel free to reach out anytime you need assistance.',
      es: 'Me alegra que tu problema se haya resuelto! Para asegurar que tuviste la mejor experiencia, me gustaria preguntarte: Cumplimos con tus expectativas hoy? Tu comentario nos ayuda a mejorar. No dudes en comunicarte cuando necesites ayuda.',
      fr: 'Je suis heureux que votre probleme soit resolu! Pour assurer que vous avez eu la meilleure experience, puis-je vous demander: Avons-nous repondu a vos attentes aujourd\'hui? Vos commentaires nous aident a nous ameliorer. N\'hesitez pas a nous contacter si vous avez besoin.',
      sw: 'Ninfurahi kwamba tatizo lako limetatuliwa! Ili kuhakikisha kuwa na uzoefu mzuri, je, tunaweza kukuuliza: Je, tulitimiza matarajio yako leo? Maoni yako yanasaidia sana. Jitokeze wakati wowote unapohitaji msaada.'
    }
    response = satisfactionMsgs[language]
  }
  // Negative sentiment - priority escalation
  else if (detectSentiment(lowerText) === 'negative') {
    const apologyMsgs: Record<SupportedLanguage, string> = {
      en: 'I sincerely apologize for the frustration you are experiencing. Your satisfaction is our priority. I am here to resolve this for you. Please share more details so I can help immediately, or I can connect you directly with a manager.',
      es: 'Disculpa sinceramente la frustacion que experimentas. Tu satisfaccion es nuestra prioridad. Estoy aqui para resolver esto. Por favor comparte mas detalles para poder ayudarte inmediatamente, o puedo conectarte directamente con un gerente.',
      fr: 'Je suis sincerement desole de la frustration que vous ressentez. Votre satisfaction est notre priorite. Je suis ici pour resoudre cela pour vous. Veuillez partager plus de details pour que je puisse vous aider immediatement.',
      sw: 'Nisamahe kwa dhati kwa tawazo unayopatikana. Kuridhika kwako ni kipaumbele chetu. Niko hapa kusuluhisha hii kwa ajili yako. Tafadhali shiriki maelezo zaidi ili niweze kusaidia mara moja, au niweze kukuunganisha moja kwa moja na meneja.'
    }
    response = apologyMsgs[language]
  }
  // Default - reasoning and offering help
  else {
    const defaultMsgs: Record<SupportedLanguage, string> = {
      en: 'I understand your inquiry. I am processing your request and thinking through the best way to help you. If I cannot fully resolve this, I will connect you with a specialist. Could you provide a bit more detail about what you need?',
      es: 'Entiendo tu pregunta. Estoy procesando tu solicitud y pensando en la mejor manera de ayudarte. Si no puedo resolver completamente esto, te conectare con un especialista. Podrias proporcionar un poco mas de detalle sobre lo que necesitas?',
      fr: 'Je comprends votre question. Je traite votre demande et je reflechis a la meilleure facon de vous aider. Si je ne peux pas resoudre completement cela, je vous connecterai avec un specialiste. Pouvez-vous fournir un peu plus de details sur ce dont vous avez besoin?',
      sw: 'Ninaelewa swali lako. Niko katika mchakato wa ombi lako na nifikirini njia nzuri zaidi ya kukusaidia. Ikiwa siwezi kutatua hili kabisa, nitakuunganisha na mtaalam. Je, unaweza kutoa maelezo machache zaidi kuhusu kile ulichohitaji?'
    }
    response = defaultMsgs[language]
  }

  // Cache the response
  responseCache.set(cacheKey, response)
  return response
}

void detectSentiment
void responseCache
void translateText
void createBotResponse

const LiveChatWidget = ({ isOpen: initialIsOpen = false, onToggle }: LiveChatWidgetProps) => {
  const { profile } = useSiteContent()
  const brand = profile?.brand || defaultBrand

  const chatSessionId = useMemo(() => {
    if (typeof window === 'undefined') return `support-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const existing = window.localStorage.getItem('supportSessionId')
    if (existing) return existing
    const next = `support-${Date.now()}-${Math.random().toString(36).slice(2)}`
    window.localStorage.setItem('supportSessionId', next)
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
      id: 'welcome',
      text: `Hello! Welcome to ${brand.name}. How can I help you today?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isConnected] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [language, setLanguage] = useState<SupportedLanguage>('en')
  const [agentTyping, setAgentTyping] = useState(false)
  const [satisfactionSent, setSatisfactionSent] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const socketRef = useRef<Socket | null>(null)
  const messageCountRef = useRef(0)

  const quickReplies = [
    'Track my order',
    'Product information',
    'Delivery issues',
    'Payment help',
    'Returns & refunds',
    'Speak to agent'
  ]

  const toWidgetMessage = (message: SavedChatMessage): Message => ({
    id: message.id,
    text: message.content || message.message || '',
    sender: message.isFromUser ? 'user' : 'agent',
    timestamp: new Date(message.timestamp || message.createdAt || Date.now()),
    agentName: message.isFromUser ? undefined : message.senderName || 'Customer Support'
  })

  useEffect(() => {
    if (!isOpen) return

    chatApi.getMessages(chatSessionId).then((response) => {
      const savedMessages = (response.messages || []).map(toWidgetMessage)
      if (!savedMessages.length) return

      setMessages((current) => {
        const greeting = current.filter((message) => message.sender === 'bot')
        const merged = [...greeting]
        for (const savedMessage of savedMessages) {
          if (!merged.some((message) => message.id === savedMessage.id)) {
            merged.push(savedMessage)
          }
        }
        return merged
      })
    }).catch(() => undefined)
  }, [chatSessionId, isOpen])

  useEffect(() => {
    const socket = io(getApiHost(), { withCredentials: true })
    socketRef.current = socket
    socket.emit('chat:join', chatSessionId)

    socket.on('chat:message', (message: SavedChatMessage) => {
      if ((message.roomId || message.sessionId) !== chatSessionId) return

      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) return current
        return [...current, toWidgetMessage(message)]
      })

      if (!isOpen || isMinimized) {
        setUnreadCount((count) => count + 1)
      }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [chatSessionId, isOpen, isMinimized])

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
      setUnreadCount(0)
    }
  }, [isOpen, isMinimized])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleToggle = () => {
    const nextOpen = !isOpen
    setIsOpen(nextOpen)
    setIsMinimized(false)
    if (nextOpen) {
      setUnreadCount(0)
    }
    onToggle?.()
  }

  const handleMinimize = () => {
    setIsMinimized((value) => !value)
  }

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    // Check rate limiting
    if (isRateLimited()) {
      setMessages((prev) => [...prev, {
        id: `${Date.now()}-ratelimit`,
        text: 'Please slow down. I want to give you thoughtful, quality responses. Take a moment and I\'ll be ready to help.',
        sender: 'bot',
        timestamp: new Date()
      }])
      return
    }

    const trimmed = text.trim()
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      text: trimmed,
      sender: 'user',
      timestamp: new Date()
    }

    setInputValue('')
    setMessages((prev) => [...prev, userMessage])
    messageCountRef.current += 1

    const nextLanguage = detectLanguage(trimmed)
    setLanguage(nextLanguage)

    try {
      await chatApi.sendMessage({
        sessionId: chatSessionId,
        message: trimmed,
        from: 'user'
      })
    } catch {
      setMessages((prev) => [...prev, {
        id: `${Date.now()}-error`,
        text: 'I could not save this chat right now. Please try again or use WhatsApp for urgent help.',
        sender: 'bot',
        timestamp: new Date()
      }])
    } finally {
      setIsTyping(false)
      setAgentTyping(false)
    }
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
          title="Open live customer support chat"
          className="relative bg-red-600 text-white p-4 rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 hover:scale-110"
          aria-label="Open live customer support chat"
        >
          <span className="sr-only">Open live customer support chat</span>
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
      <div className="bg-gradient-to-r from-red-600 to-red-500 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MessageCircle className="w-6 h-6" />
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-400' : 'bg-gray-400'
            }`} />
          </div>
          <div>
            <div className="font-semibold">{brand.name} Support</div>
            <div className="text-xs text-red-100">
              {isConnected ? 'Online' : 'Offline'} • {language.toUpperCase()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleMinimize}
            className="p-1 hover:bg-red-700 rounded transition-colors"
            aria-label={isMinimized ? 'Expand chat' : 'Minimize chat'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-red-700 rounded transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
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
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}>
                    {message.agentName && (
                      <div className="text-xs opacity-75 mb-1">{message.agentName}</div>
                    )}
                    <div className="text-sm whitespace-pre-wrap"><LinkifiedText text={message.text} /></div>
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

            {(isTyping || agentTyping) && (
              <div className="flex justify-start mb-4">
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex gap-1 items-center">
                    <span className="text-xs text-gray-500 mr-2">Thinking</span>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && !satisfactionSent && (
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
          
          {satisfactionSent && (
            <div className="px-4 pb-2">
              <div className="text-xs text-gray-600 mb-2">How was your experience?</div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleSendMessage('Yes, I am satisfied')
                    setSatisfactionSent(false)
                  }}
                  className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full hover:bg-green-200 transition-colors"
                >
                  Satisfied
                </button>
                <button
                  onClick={() => {
                    handleSendMessage('No, I need more help')
                    setSatisfactionSent(false)
                  }}
                  className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full hover:bg-red-200 transition-colors"
                >
                  Not yet
                </button>
              </div>
            </div>
          )}

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

          <div className="px-4 pb-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500 gap-3">
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
