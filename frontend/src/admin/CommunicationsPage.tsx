import { useEffect, useMemo, useRef, useState } from 'react'
import { Bell, CheckCircle2, Mail, Mail as MailIcon, Megaphone, MessageCircle, Phone, Send, Smartphone, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api, { getApiHost } from '../services/api'
import { contactMessagesApi, usersApi } from '../services/adminApi'
import LinkifiedText from '../components/ui/LinkifiedText'
import { io, Socket } from 'socket.io-client'

interface AdminUser {
  id: string
  name: string
  email: string
  role: 'admin' | 'customer'
}

interface ChatSession {
  sessionId: string
  unreadCount: number
  lastMessage?: { message?: string }
  user?: {
    email?: string
    username?: string
    profile?: { fullName?: string }
  }
}

interface ChatMessage {
  id: string
  message?: string
  content?: string
  isFromUser: boolean
  createdAt: string
  timestamp?: string
}

interface ContactMessage {
  id: string
  subject: string
  message: string
  status: string
  createdAt: string
  contactInfo?: {
    senderName?: string
    senderEmail?: string
    senderPhone?: string
  } | null
  user?: {
    email?: string
    profile?: { fullName?: string | null }
  } | null
  responses?: Array<{
    id: string
    message: string
    createdAt: string
    respondent?: {
      email?: string
      profile?: { fullName?: string | null }
    }
  }>
}

type ActiveTab = 'broadcast' | 'chat' | 'contact'
type Target = 'all' | 'users' | 'emails'
type MessageType = 'SYSTEM' | 'PROMOTION' | 'ACCOUNT'

const CommunicationsPage = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('broadcast')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [target, setTarget] = useState<Target>('all')
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [emails, setEmails] = useState('')
  const [type, setType] = useState<MessageType>('SYSTEM')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [actionUrl, setActionUrl] = useState('')
  const [channels, setChannels] = useState({ email: true, inApp: true, sms: false, whatsapp: false })
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const [chatLoading, setChatLoading] = useState(false)
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [reply, setReply] = useState('')

  const [contactLoading, setContactLoading] = useState(false)
  const [contactPage] = useState(1)
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([])
  const [selectedContactMessage, setSelectedContactMessage] = useState<ContactMessage | null>(null)
  const [contactReply, setContactReply] = useState('')
  const [lastInboxSync, setLastInboxSync] = useState<Date | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const selectedCount = useMemo(() => {
    if (target === 'all') return users.length
    if (target === 'users') return selectedUserIds.length
    return emails.split(',').map((email) => email.trim()).filter(Boolean).length
  }, [emails, selectedUserIds.length, target, users.length])

  const fetchUsers = async () => {
    try {
      const response = await usersApi.getUsers({ limit: 100 })
      const nextUsers = (response.users || []).map((user: any) => ({
        id: user.id,
        name: user.profile?.fullName || user.username || user.email,
        email: user.email,
        role: user.roles?.includes('ADMIN') ? 'admin' : 'customer',
      }))
      setUsers(nextUsers)
    } catch {
      toast.error('Could not load recipients')
    }
  }

  const fetchChatSessions = async () => {
    setChatLoading(true)
    try {
      const response = await api.get('/chat/sessions')
      const sessions = response.data.sessions || []
      setChatSessions(sessions)
      setLastInboxSync(new Date())
      if (!activeSessionId && sessions.length > 0) {
        setActiveSessionId(sessions[0].sessionId)
      }
    } catch {
      toast.error('Could not load support chats')
    } finally {
      setChatLoading(false)
    }
  }

  const fetchChatMessages = async (sessionId: string) => {
    if (!sessionId) return
    try {
      const response = await api.get(`/chat/sessions/${sessionId}/messages`)
      setChatMessages(response.data.messages || [])
      await api.put(`/chat/sessions/${sessionId}/read`)
      setChatSessions((current) => current.map((session) => session.sessionId === sessionId ? { ...session, unreadCount: 0 } : session))
    } catch {
      toast.error('Could not load chat messages')
    }
  }

  const fetchContactMessages = async () => {
    setContactLoading(true)
    try {
      const response = await contactMessagesApi.getAll(contactPage, 20, 'OPEN')
      const messages = response.messages || []
      setContactMessages(messages)
      setSelectedContactMessage((current) => messages.find((item: ContactMessage) => item.id === current?.id) || messages[0] || null)
      setLastInboxSync(new Date())
    } catch {
      toast.error('Could not load contact messages')
    } finally {
      setContactLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
    fetchChatSessions()
    fetchContactMessages()
  }, [])

  useEffect(() => {
    const socket = io(getApiHost(), { withCredentials: true })
    socketRef.current = socket

    socket.on('connect', () => {
      if (activeSessionId) socket.emit('chat:join', activeSessionId)
      fetchChatSessions()
      fetchContactMessages()
      if (activeSessionId) fetchChatMessages(activeSessionId)
    })

    socket.on('chat:session-updated', () => {
      fetchChatSessions()
    })

    socket.on('chat:message', (message: any) => {
      const roomId = message?.roomId || message?.sessionId
      if (!roomId) return

      if (roomId === activeSessionId) {
        setChatMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message])
        api.put(`/chat/sessions/${roomId}/read`).catch(() => undefined)
      }

      fetchChatSessions()
    })

    socket.on('contact:message-created', () => {
      fetchContactMessages()
    })

    socket.on('contact:message-updated', () => {
      fetchContactMessages()
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [activeSessionId])

  useEffect(() => {
    fetchChatMessages(activeSessionId)
    if (activeSessionId) socketRef.current?.emit('chat:join', activeSessionId)
  }, [activeSessionId])

  const toggleUser = (userId: string) => {
    setSelectedUserIds((current) => current.includes(userId) ? current.filter((id) => id !== userId) : [...current, userId])
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const enabledChannels = [
      channels.email ? 'email' : '',
      channels.inApp ? 'inApp' : '',
      channels.sms ? 'sms' : '',
      channels.whatsapp ? 'whatsapp' : '',
    ].filter(Boolean)

    if (enabledChannels.length === 0) {
      toast.error('Choose at least one channel')
      return
    }

    if (target === 'users' && selectedUserIds.length === 0) {
      toast.error('Select at least one user')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post('/admin/communications/send', {
        target,
        userIds: selectedUserIds,
        emails: emails.split(',').map((email) => email.trim()).filter(Boolean),
        channels: enabledChannels,
        type,
        subject,
        message,
        actionUrl,
      })
      setResult(response.data)
      toast.success('Communication processed')
    } catch {
      toast.error('Could not send communication')
    } finally {
      setIsLoading(false)
    }
  }

  const sendChatReply = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!activeSessionId || !reply.trim()) return

    try {
      await api.post('/chat/messages', {
        sessionId: activeSessionId,
        message: reply.trim(),
        from: 'admin',
      })
      setReply('')
      await fetchChatMessages(activeSessionId)
      await fetchChatSessions()
      toast.success('Reply sent')
    } catch {
      toast.error('Could not send reply')
    }
  }

  const sendContactReply = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedContactMessage || !contactReply.trim()) return

    try {
      await contactMessagesApi.respond(selectedContactMessage.id, contactReply.trim())
      setContactReply('')
      await fetchContactMessages()
      toast.success('Reply sent')
    } catch {
      toast.error('Could not send reply')
    }
  }

  const closeContactMessage = async (messageId: string) => {
    try {
      await contactMessagesApi.close(messageId)
      await fetchContactMessages()
      toast.success('Contact message closed')
    } catch {
      toast.error('Could not close message')
    }
  }

  const getContactInfo = (contactMessage: ContactMessage) => ({
    senderName: contactMessage.contactInfo?.senderName || contactMessage.user?.profile?.fullName || 'Customer',
    senderEmail: contactMessage.contactInfo?.senderEmail || contactMessage.user?.email || '',
    senderPhone: contactMessage.contactInfo?.senderPhone || '',
  })

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Communications</h2>
            <p className="text-gray-600">Send messages, manage support chats, and contact forms{lastInboxSync ? ` - live ${lastInboxSync.toLocaleTimeString()}` : ''}.</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
            <Users className="h-4 w-4" />
            {selectedCount} recipients
          </div>
        </div>

        <div className="mt-4 flex border-b border-gray-200">
          {[
            ['broadcast', 'Broadcast'],
            ['chat', 'Support Chat'],
            ['contact', 'Contact Messages'],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value as ActiveTab)}
              className={`px-4 py-2 text-sm font-semibold transition ${activeTab === value ? 'border-b-2 border-red-600 text-red-600' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'broadcast' && (
        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="space-y-6">
            <div className="bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-gray-900">Message</h3>
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select value={type} onChange={(event) => setType(event.target.value as MessageType)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500">
                      <option value="SYSTEM">System</option>
                      <option value="PROMOTION">Promotion</option>
                      <option value="ACCOUNT">Account</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Action URL</label>
                    <input value={actionUrl} onChange={(event) => setActionUrl(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" placeholder="https://example.com/offer" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject</label>
                  <input required value={subject} onChange={(event) => setSubject(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" placeholder="Delivery update, offer, or account notice" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea required rows={8} value={message} onChange={(event) => setMessage(event.target.value)} className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" placeholder="Write the customer message..." />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-gray-900">Recipients</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['all', 'All users'],
                  ['users', 'Selected users'],
                  ['emails', 'Raw emails'],
                ].map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setTarget(value as Target)} className={`rounded-lg border px-4 py-3 text-sm font-semibold transition ${target === value ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {target === 'emails' && (
                <textarea value={emails} onChange={(event) => setEmails(event.target.value)} className="mt-4 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-red-500 focus:ring-2 focus:ring-red-500" rows={4} placeholder="customer@example.com, buyer@example.com" />
              )}

              {target === 'users' && (
                <div className="mt-4 max-h-72 overflow-auto border border-gray-200">
                  {users.map((user) => (
                    <label key={user.id} className="flex cursor-pointer items-center justify-between border-b border-gray-100 px-4 py-3 last:border-b-0 hover:bg-gray-50">
                      <span>
                        <span className="block text-sm font-semibold text-gray-900">{user.name}</span>
                        <span className="block text-sm text-gray-500">{user.email}</span>
                      </span>
                      <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={() => toggleUser(user.id)} className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-gray-900">Channels</h3>
              <div className="space-y-3">
                <label className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <span className="flex items-center gap-3 font-semibold text-gray-800"><Mail className="h-5 w-5 text-red-600" /> Email</span>
                  <input type="checkbox" checked={channels.email} onChange={(event) => setChannels((current) => ({ ...current, email: event.target.checked }))} className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <span className="flex items-center gap-3 font-semibold text-gray-800"><Bell className="h-5 w-5 text-red-600" /> In-app</span>
                  <input type="checkbox" checked={channels.inApp} onChange={(event) => setChannels((current) => ({ ...current, inApp: event.target.checked }))} className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <span className="flex items-center gap-3 font-semibold text-gray-800"><Phone className="h-5 w-5 text-red-600" /> SMS</span>
                  <input type="checkbox" checked={channels.sms} onChange={(event) => setChannels((current) => ({ ...current, sms: event.target.checked }))} className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                </label>
                <label className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                  <span className="flex items-center gap-3 font-semibold text-gray-800"><Smartphone className="h-5 w-5 text-red-600" /> WhatsApp</span>
                  <input type="checkbox" checked={channels.whatsapp} onChange={(event) => setChannels((current) => ({ ...current, whatsapp: event.target.checked }))} className="h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                </label>
              </div>

              <button type="submit" disabled={isLoading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                <Send className="h-5 w-5" />
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>

            {result && (
              <div className="bg-white p-6 shadow-sm">
                <h3 className="mb-3 flex items-center gap-2 text-base font-semibold text-gray-900">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Result
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>In-app created: {result.summary?.inApp ?? 0}</p>
                  <p>Emails sent: {result.summary?.email ?? 0}</p>
                  <p>SMS sent: {result.summary?.sms ?? 0}</p>
                  <p>WhatsApp sent: {result.summary?.whatsapp ?? 0}</p>
                  <p>Skipped provider sends: {result.summary?.skipped ?? 0}</p>
                  {result.summary?.failed > 0 && <p className="text-red-600">Failed sends: {result.summary.failed}</p>}
                </div>
              </div>
            )}

          </aside>
        </form>
      )}

      {activeTab === 'chat' && (
        <section className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <div className="bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <MessageCircle className="h-5 w-5 text-red-600" />
                Support Inbox
              </h3>
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                {chatLoading ? 'Loading' : 'Live'}
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {chatSessions.length > 0 ? chatSessions.map((session) => {
                const customerName = session.user?.profile?.fullName || session.user?.username || session.user?.email || 'Customer'
                return (
                  <button
                    key={session.sessionId}
                    type="button"
                    onClick={() => setActiveSessionId(session.sessionId)}
                    className={`mb-2 w-full rounded-lg border p-3 text-left transition ${activeSessionId === session.sessionId ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-gray-900">{customerName}</span>
                      {session.unreadCount > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">{session.unreadCount}</span>}
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-600">{session.lastMessage?.message || 'No message text'}</p>
                  </button>
                )
              }) : (
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No saved chats yet. Logged-in customer chats will appear here.</p>
              )}
            </div>
          </div>

          <div className="flex min-h-[30rem] flex-col bg-white shadow-sm">
            <div className="border-b border-gray-200 p-5">
              <h3 className="text-base font-semibold text-gray-900">Chat Thread</h3>
              <p className="mt-1 text-sm text-gray-600">Reply to customers from the same saved support session.</p>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-5">
              {chatMessages.length > 0 ? chatMessages.map((chatMessage) => (
                <div key={chatMessage.id} className={`flex ${chatMessage.isFromUser ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[78%] rounded-lg px-4 py-3 text-sm shadow-sm ${chatMessage.isFromUser ? 'bg-white text-gray-900' : 'bg-red-600 text-white'}`}>
                    <p><LinkifiedText text={chatMessage.message || chatMessage.content || ''} /></p>
                    <p className={`mt-1 text-xs ${chatMessage.isFromUser ? 'text-gray-500' : 'text-red-100'}`}>
                      {new Date(chatMessage.createdAt || chatMessage.timestamp || '').toLocaleString()}
                    </p>
                  </div>
                </div>
              )) : (
                <div className="flex h-full items-center justify-center text-sm text-gray-500">
                  Select a support chat to view messages.
                </div>
              )}
            </div>

            <form onSubmit={sendChatReply} className="border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  disabled={!activeSessionId}
                  className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                  placeholder={activeSessionId ? 'Type an admin reply...' : 'Select a chat first'}
                />
                <button type="submit" disabled={!activeSessionId || !reply.trim()} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                  <Send className="h-4 w-4" />
                  Reply
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {activeTab === 'contact' && (
        <section className="grid gap-6 lg:grid-cols-[20rem_1fr]">
          <div className="bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
                <MailIcon className="h-5 w-5 text-red-600" />
                Contact Messages
              </h3>
              <span className="rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                {contactLoading ? 'Loading' : 'Live'}
              </span>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {contactMessages.length > 0 ? contactMessages.map((contactMessage) => {
                const contactInfo = getContactInfo(contactMessage)
                return (
                  <button
                    key={contactMessage.id}
                    type="button"
                    onClick={() => setSelectedContactMessage(contactMessage)}
                    className={`mb-2 w-full rounded-lg border p-3 text-left transition ${selectedContactMessage?.id === contactMessage.id ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-bold text-gray-900">{contactInfo.senderName}</span>
                      <span className={`rounded px-2 py-1 text-xs font-semibold ${contactMessage.status === 'OPEN' ? 'bg-yellow-100 text-yellow-800' : contactMessage.status === 'RESOLVED' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                        {contactMessage.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-gray-600">{contactMessage.subject}</p>
                    <p className="mt-1 text-xs text-gray-500">{contactInfo.senderEmail}</p>
                  </button>
                )
              }) : (
                <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">No contact messages yet.</p>
              )}
            </div>
          </div>

          <div className="flex min-h-[30rem] flex-col bg-white shadow-sm">
            {selectedContactMessage ? (
              <>
                <div className="border-b border-gray-200 p-5">
                  <h3 className="text-base font-semibold text-gray-900">{selectedContactMessage.subject}</h3>
                  <div className="mt-2 text-sm text-gray-600">
                    {(() => {
                      const contactInfo = getContactInfo(selectedContactMessage)
                      return (
                        <>
                          <p><strong>From:</strong> {contactInfo.senderName} {contactInfo.senderEmail ? `(${contactInfo.senderEmail})` : ''}</p>
                          {contactInfo.senderPhone && <p><strong>Phone:</strong> {contactInfo.senderPhone}</p>}
                        </>
                      )
                    })()}
                    <p><strong>Status:</strong> {selectedContactMessage.status}</p>
                  </div>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-5">
                  <div className="rounded-lg bg-white p-4">
                    <p className="text-sm text-gray-900 whitespace-pre-wrap"><LinkifiedText text={selectedContactMessage.message} /></p>
                    <p className="mt-2 text-xs text-gray-500">
                      {new Date(selectedContactMessage.createdAt).toLocaleString()}
                    </p>
                  </div>

                  {selectedContactMessage.responses && selectedContactMessage.responses.length > 0 && (
                    <div className="mt-4 space-y-3">
                      <p className="text-sm font-semibold text-gray-700">Responses:</p>
                      {selectedContactMessage.responses.map((response) => (
                        <div key={response.id} className="rounded-lg bg-red-50 p-4">
                          <p className="text-sm font-semibold text-gray-900">{response.respondent?.profile?.fullName || response.respondent?.email || 'Admin'}</p>
                          <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap"><LinkifiedText text={response.message} /></p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(response.createdAt).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedContactMessage.status !== 'RESOLVED' && (
                  <form onSubmit={sendContactReply} className="border-t border-gray-200 p-4">
                    <div className="flex gap-2">
                      <input
                        value={contactReply}
                        onChange={(event) => setContactReply(event.target.value)}
                        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-red-500 focus:ring-2 focus:ring-red-500"
                        placeholder="Type your reply..."
                      />
                      <button type="submit" disabled={!contactReply.trim()} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                        <Send className="h-4 w-4" />
                        Reply
                      </button>
                      <button type="button" onClick={() => closeContactMessage(selectedContactMessage.id)} className="inline-flex items-center gap-2 rounded-lg bg-gray-600 px-5 py-3 font-bold text-white transition hover:bg-gray-700">
                        Close
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Select a contact message to view details
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}

export default CommunicationsPage
