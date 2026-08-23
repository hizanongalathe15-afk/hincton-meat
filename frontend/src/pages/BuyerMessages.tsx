import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Star, Trash2, Send, MessageSquare, User, Check, CheckCheck,
  Phone, Paperclip, Mail, MoreVertical, ShoppingBag, Settings, Smile, Home, ArrowLeft,
  BadgeCheck, Edit3, MapPin, Pencil, X, Loader2
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { chatApi, dmApi } from '../services/buyerApi';
import { getApiHost } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSiteContent } from '../contexts/SiteContentContext';
import { useTheme } from '../contexts/ThemeContext';
import { getChatPalette } from '../utils/chatTheme';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import LinkifiedText from '../components/ui/LinkifiedText';
import ThemeToggleButton from '../components/ui/ThemeToggleButton';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderPhone?: string;
  receiverId: string;
  content: string;
  attachments?: Array<{ url: string; name?: string; type?: string }>;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  canDelete?: boolean;
  canEdit?: boolean;
  deleted?: boolean;
  editedAt?: string;
  type: 'text' | 'system' | 'order_update' | 'attachment';
  orderId?: string;
  orderNumber?: string;
}

interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  participantPhone?: string;
  participantUsername?: string;
  participantType: 'admin' | 'farmer' | 'support' | 'dm';
  kind?: 'support' | 'dm';
  isOfficial?: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isStarred: boolean;
  messages: Message[];
}

interface DmUser {
  id: string;
  username?: string | null;
  name: string;
  avatar?: string | null;
  distanceKm?: number | null;
  locationLabel?: string | null;
  phoneMatch?: boolean;
}

const BuyerMessages: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useSiteContent();
  const { theme } = useTheme();
  const pal = getChatPalette(theme);

  const hoverBg = (color: string) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = color; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.background = 'transparent'; },
  });

  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [sending, setSending] = useState(false);
  const [presence, setPresence] = useState<Record<string, 'online' | 'away' | 'offline'>>({});
  const [typingUser, setTypingUser] = useState('');
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [dmSearchQuery, setDmSearchQuery] = useState('');
  const [dmSearchResults, setDmSearchResults] = useState<DmUser[]>([]);
  const [dmSuggestions, setDmSuggestions] = useState<DmUser[]>([]);
  const [dmSearching, setDmSearching] = useState(false);
  const [editingMessage, setEditingMessage] = useState<{ id: string; text: string } | null>(null);
  const dmSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState({
    isOpen: false,
    type: 'message' as 'message' | 'conversation',
    id: '',
    title: '',
    message: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchConversations();
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;
    const socket = io(getApiHost(), { withCredentials: true, auth: { token: localStorage.getItem('token') } });
    socketRef.current = socket;

    socket.emit('presence:join');
    socket.on('presence:update', ({ userId, status }) => {
      if (userId) setPresence((current) => ({ ...current, [userId]: status || 'offline' }));
    });
    socket.on('presence:snapshot', (rows: Array<{ userId: string; status: 'online' | 'away' | 'offline' }>) => {
      setPresence((current) => rows.reduce((next, row) => ({ ...next, [row.userId]: row.status }), { ...current }));
    });
    socket.on('chat:typing', ({ roomId, name, isTyping }) => {
      if (roomId === selectedConversation?.id) setTypingUser(isTyping ? name || 'They' : '');
    });
    socket.on('chat:message', (message: Message) => {
      if (message?.receiverId === user.id || message?.senderId !== user.id) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      }
    });
    socket.on('dm:message', (message: any) => {
      if (!message || message.conversationId !== selectedConversation?.id) return;
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, mapDmMessage(message)]);
    });
    socket.on('dm:new', () => {
      fetchConversations();
    });
    socket.on('dm:message-edited', (message: any) => {
      setMessages((current) => current.map((item) => item.id === message?.id ? { ...item, content: message.text, editedAt: message.editedAt } : item));
    });
    socket.on('dm:message-deleted', ({ messageId }: any) => {
      setMessages((current) => current.map((item) => item.id === messageId ? { ...item, content: 'This message was deleted', deleted: true } : item));
    });
    socket.on('dm:typing', ({ conversationId, name, isTyping }: any) => {
      if (conversationId === selectedConversation?.id) setTypingUser(isTyping ? name || 'They' : '');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, navigate, selectedConversation?.id]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation);
      if (selectedConversation.kind === 'dm') {
        socketRef.current?.emit('dm:join', selectedConversation.id);
      } else {
        socketRef.current?.emit('chat:join', selectedConversation.id);
      }
      socketRef.current?.emit('presence:check', { userIds: [selectedConversation.participantId] });
      setTypingUser('');
      setEditingMessage(null);
    }
  }, [selectedConversation]);

  useEffect(() => {
    const ids = conversations.map((conversation) => conversation.participantId).filter(Boolean);
    if (ids.length) socketRef.current?.emit('presence:check', { userIds: ids });
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (showNewChat) loadDmSuggestions();
  }, [showNewChat]);

  const mapDmMessage = (m: any): Message => ({
    id: m.id,
    senderId: m.senderId,
    senderName: m.senderName,
    senderAvatar: m.senderAvatar,
    receiverId: '',
    content: m.deleted ? 'This message was deleted' : m.text,
    timestamp: m.createdAt,
    isRead: true,
    isStarred: false,
    deleted: Boolean(m.deleted),
    editedAt: m.editedAt,
    canDelete: m.senderId === user?.id && !m.deleted,
    canEdit: m.senderId === user?.id && !m.deleted,
    type: 'text',
  });

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const [supportResponse, dmResponse] = await Promise.all([
        chatApi.getConversations(),
        dmApi.getConversations().catch(() => ({ conversations: [] })),
      ]);
      const support = (supportResponse.conversations || []).map((conversation: Conversation) => ({ ...conversation, kind: 'support' as const }));
      const dm: Conversation[] = (dmResponse.conversations || []).map((conversation: any) => ({
        id: conversation.id,
        participantId: conversation.participantId,
        participantName: conversation.participantName,
        participantAvatar: conversation.participantAvatar,
        participantUsername: conversation.participantUsername,
        participantType: 'dm' as const,
        kind: 'dm' as const,
        isOfficial: Boolean(conversation.isOfficial),
        lastMessage: conversation.lastMessage ? (conversation.lastMessage.deleted ? 'Message deleted' : conversation.lastMessage.text) : '',
        lastMessageTime: conversation.lastMessage?.createdAt || conversation.updatedAt,
        unreadCount: conversation.unreadCount || 0,
        isStarred: false,
        messages: [],
      }));
      const merged = [...dm, ...support].sort((a, b) => {
        if (Boolean(a.isOfficial) !== Boolean(b.isOfficial)) return a.isOfficial ? -1 : 1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
      setConversations(merged);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Could not load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversation: Conversation) => {
    try {
      if (conversation.kind === 'dm') {
        const response = await dmApi.getMessages(conversation.id);
        setMessages((response.messages || []).map(mapDmMessage));
        await dmApi.markRead(conversation.id).catch(() => undefined);
        setConversations(prev => prev.map(conv => conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv));
      } else {
        const response = await chatApi.getConversationMessages(conversation.id);
        setMessages(response.messages || []);
        await chatApi.markConversationAsRead(conversation.id);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Could not load messages');
    }
  };

  const sendMessage = async () => {
    if (!selectedConversation) return;
    if (editingMessage) {
      await saveEdit();
      return;
    }
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      if (selectedConversation.kind === 'dm') {
        const response = await dmApi.sendMessage({
          conversationId: selectedConversation.id,
          text: newMessage.trim(),
        });
        const newMsg = mapDmMessage(response.message);
        setMessages(prev => prev.some((item) => item.id === newMsg.id) ? prev : [...prev, newMsg]);
      } else {
        const response = await chatApi.sendConversationMessage({
          conversationId: selectedConversation.id,
          content: newMessage.trim(),
          type: 'text'
        });
        const newMsg: Message = response.message;
        setMessages(prev => [...prev, newMsg]);
      }

      setNewMessage('');

      setConversations(prev => prev.map(conv =>
        conv.id === selectedConversation.id
          ? { ...conv, lastMessage: newMessage.trim(), lastMessageTime: new Date().toISOString() }
          : conv
      ));

    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Could not send message');
    } finally {
      setSending(false);
    }
  };

  const startEditMessage = (message: Message) => {
    setEditingMessage({ id: message.id, text: message.content });
    setNewMessage(message.content);
  };

  const cancelEdit = () => {
    setEditingMessage(null);
    setNewMessage('');
  };

  const saveEdit = async () => {
    if (!editingMessage || !newMessage.trim()) return;
    try {
      await dmApi.editMessage(editingMessage.id, newMessage.trim());
      setMessages(prev => prev.map(msg =>
        msg.id === editingMessage.id ? { ...msg, content: newMessage.trim(), editedAt: new Date().toISOString() } : msg
      ));
      setEditingMessage(null);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to edit message:', error);
      toast.error('Could not edit message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      if (selectedConversation?.kind === 'dm') {
        await dmApi.deleteMessage(messageId);
        setMessages(prev => prev.map(msg =>
          msg.id === messageId ? { ...msg, content: 'This message was deleted', deleted: true, canEdit: false, canDelete: false } : msg
        ));
      } else {
        await chatApi.deleteMessage(messageId);
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
      }
      toast.success('Message deleted');
    } catch (error) {
      console.error('Failed to delete message:', error);
      toast.error('Could not delete message');
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmDialog.type === 'message' && deleteConfirmDialog.id) {
      await handleDeleteMessage(deleteConfirmDialog.id);
    } else if (deleteConfirmDialog.type === 'conversation' && deleteConfirmDialog.id) {
      await handleDeleteConversation(deleteConfirmDialog.id);
    }
    setDeleteConfirmDialog({
      isOpen: false,
      type: 'message' as 'message' | 'conversation',
      id: '',
      title: '',
      message: ''
    });
  };

  const starMessage = async (messageId: string) => {
    try {
      await chatApi.starMessage(messageId);
      setMessages(prev => prev.map(msg =>
        msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
      ));
    } catch (error) {
      console.error('Failed to star message:', error);
      toast.error('Could not star message');
    }
  };

  const starConversation = async (conversationId: string) => {
    try {
      await chatApi.starConversation(conversationId);
      setConversations(prev => prev.map(conv =>
        conv.id === conversationId ? { ...conv, isStarred: !conv.isStarred } : conv
      ));
    } catch (error) {
      console.error('Failed to star conversation:', error);
      toast.error('Could not star conversation');
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const target = conversations.find(conv => conv.id === conversationId);
      if (target?.kind === 'dm') {
        await dmApi.deleteConversation(conversationId);
      } else {
        await chatApi.deleteConversation(conversationId);
      }
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Could not delete conversation');
    }
  };

  const handleDmSearchChange = (value: string) => {
    setDmSearchQuery(value);
    if (dmSearchTimer.current) clearTimeout(dmSearchTimer.current);
    const query = value.trim();
    if (query.length < 2) {
      setDmSearchResults([]);
      setDmSearching(false);
      return;
    }
    setDmSearching(true);
    dmSearchTimer.current = setTimeout(async () => {
      try {
        const response = await dmApi.searchUsers(query);
        setDmSearchResults(response.users || []);
      } catch (error) {
        console.error('Failed to search users:', error);
        setDmSearchResults([]);
      } finally {
        setDmSearching(false);
      }
    }, 350);
  };

  const loadDmSuggestions = async () => {
    try {
      const response = await dmApi.getSuggestions();
      setDmSuggestions(response.users || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const openDmWith = async (target: DmUser) => {
    try {
      const response = await dmApi.openConversation(target.id);
      const conversation: Conversation = {
        id: response.conversation.id,
        participantId: target.id,
        participantName: response.conversation.participantName || target.name,
        participantAvatar: response.conversation.participantAvatar || target.avatar || undefined,
        participantUsername: response.conversation.participantUsername || target.username || undefined,
        participantType: 'dm',
        kind: 'dm',
        isOfficial: Boolean(response.conversation.isOfficial),
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        isStarred: false,
        messages: [],
      };
      setConversations(prev => [conversation, ...prev.filter(conv => conv.id !== conversation.id)]);
      setSelectedConversation(conversation);
      setShowChatOnMobile(true);
      setShowNewChat(false);
      setDmSearchQuery('');
      setDmSearchResults([]);
    } catch (error) {
      console.error('Failed to open conversation:', error);
      toast.error('Could not open chat');
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === 'unread') return matchesSearch && conv.unreadCount > 0;
    if (filter === 'starred') return matchesSearch && conv.isStarred;
    return matchesSearch;
  });

  const formatChatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (isYesterday) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatMsgTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const presenceMeta = (userId: string) => {
    const status = presence[userId] || 'offline';
    if (status === 'online') return { label: 'online', className: 'bg-[#25d366]' };
    if (status === 'away') return { label: 'away', className: 'bg-[#dba35c]' };
    return { label: 'offline', className: 'bg-[#8696a0]' };
  };

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const supportPhoneHref = profile.brand.phoneHref || (profile.brand.phone ? `tel:${profile.brand.phone.replace(/\s+/g, '')}` : '');
  const supportEmailHref = profile.brand.emailHref || (profile.brand.email ? `mailto:${profile.brand.email}` : '');
  const whatsappDigits = (profile.brand.phoneHref || profile.brand.phone || '').replace(/\D/g, '');
  const whatsappPhone = whatsappDigits.startsWith('254') ? whatsappDigits : whatsappDigits.startsWith('0') ? `254${whatsappDigits.slice(1)}` : whatsappDigits;
  const whatsappHref = whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello ${profile.brand.name}, I need support from my buyer account.`)}` : '';

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: pal.bg }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: pal.accent }}></div>
      </div>
    );
  }

  const sidebarNavItems = [
    { icon: Home, label: 'Home', onClick: () => navigate('/') },
    { icon: MessageSquare, label: 'Chats', onClick: () => {}, active: true, badge: totalUnread },
    { icon: ShoppingBag, label: 'Orders', onClick: () => navigate('/orders') },
    { icon: User, label: 'Profile', onClick: () => navigate('/profile') },
    { icon: Settings, label: 'Settings', onClick: () => navigate('/profile?tab=settings') },
  ];

  const renderConversationItem = (conversation: Conversation) => {
    const isSelected = selectedConversation?.id === conversation.id;
    const pm = presenceMeta(conversation.participantId);

    return (
      <div
        key={conversation.id}
        onClick={() => { setSelectedConversation(conversation); setShowChatOnMobile(true); }}
        className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
        style={{ background: isSelected ? pal.selected : 'transparent' }}
        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = pal.hover; }}
        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
      >
        <div className="relative h-12 w-12 shrink-0">
          {conversation.participantAvatar ? (
            <img src={conversation.participantAvatar} alt="" className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: pal.raised }}>
              <User className="h-6 w-6" style={{ color: pal.textSec }} />
            </div>
          )}
          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 ${pm.className}`} style={{ borderColor: pal.list }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="flex min-w-0 items-center gap-1 text-sm font-normal" style={{ color: pal.text }}>
              <span className="truncate">{conversation.participantName}</span>
              {conversation.isOfficial && (
                <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: pal.accent }} />
              )}
            </h3>
            <span className="shrink-0 text-xs" style={{ color: conversation.unreadCount > 0 ? pal.accent : pal.textSec }}>
              {formatChatTime(conversation.lastMessageTime)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm" style={{ color: pal.textSec }}>
              {conversation.lastMessage}
            </p>
            <div className="flex shrink-0 items-center gap-1">
              {conversation.isStarred && (
                <Star className="h-3 w-3 fill-current" style={{ color: pal.textSec }} />
              )}
              {conversation.unreadCount > 0 && (
                <span
                  className="flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-xs font-medium"
                  style={{ background: pal.badge, color: pal.badgeText }}
                >
                  {conversation.unreadCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDmUserItem = (target: DmUser) => (
    <div
      key={target.id}
      onClick={() => openDmWith(target)}
      className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors"
      {...hoverBg(pal.hover)}
    >
      {target.avatar ? (
        <img src={target.avatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full" style={{ background: pal.raised }}>
          <User className="h-5 w-5" style={{ color: pal.textSec }} />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm" style={{ color: pal.text }}>{target.name}</p>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: pal.textSec }}>
          {target.username && <span className="truncate">@{target.username}</span>}
          {target.distanceKm != null ? (
            <span className="flex shrink-0 items-center gap-0.5">
              <MapPin className="h-3 w-3" /> {target.distanceKm} km away
            </span>
          ) : target.locationLabel ? (
            <span className="flex shrink-0 items-center gap-0.5">
              <MapPin className="h-3 w-3" /> {target.locationLabel}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderMessageBubble = (message: Message) => {
    const isSent = message.senderId === user?.id;
    const isDm = selectedConversation?.kind === 'dm';

    return (
      <div
        key={message.id}
        className={`group relative flex ${isSent ? 'justify-end' : 'justify-start'} mb-1`}
      >
        <div
          className={`absolute top-0 z-10 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 ${
            isSent ? 'right-full mr-1' : 'left-full ml-1'
          }`}
        >
          {!isDm && (
            <button
              onClick={() => starMessage(message.id)}
              className="rounded-full p-1 transition-colors"
              {...hoverBg(pal.hover)}
              title={message.isStarred ? 'Unstar' : 'Star'}
            >
              <Star className="h-4 w-4" style={{ color: message.isStarred ? pal.star : pal.textSec }} />
            </button>
          )}
          {isDm && message.canEdit && (
            <button
              onClick={() => startEditMessage(message)}
              className="rounded-full p-1 transition-colors"
              {...hoverBg(pal.hover)}
              title="Edit"
            >
              <Pencil className="h-4 w-4" style={{ color: pal.textSec }} />
            </button>
          )}
          {message.canDelete !== false && (
            <button
              onClick={() => setDeleteConfirmDialog({
                isOpen: true,
                type: 'message',
                id: message.id,
                title: 'Delete message',
                message: 'Are you sure you want to delete this message?'
              })}
              className="rounded-full p-1 transition-colors"
              {...hoverBg(pal.hover)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" style={{ color: pal.textSec }} />
            </button>
          )}
        </div>

        <div
          className="relative max-w-[65%] rounded-lg px-2 py-1.5 shadow-sm"
          style={{
            background: isSent ? pal.sent : pal.received,
            color: isSent ? pal.sentText : pal.receivedText,
          }}
        >
          <p className={`whitespace-pre-wrap break-words text-sm leading-snug ${message.deleted ? 'italic opacity-60' : ''}`}>
            <LinkifiedText text={message.content} />
          </p>
          {(message.attachments || []).map((attachment) => (
            <a
              key={attachment.url}
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center gap-2 text-sm underline opacity-90"
            >
              <Paperclip className="h-4 w-4" />
              {attachment.name || attachment.url}
            </a>
          ))}
          <div className="flex items-center justify-end gap-1 pt-0.5" style={{ color: pal.textSec }}>
            {message.editedAt && !message.deleted && (
              <span className="text-[10px]">edited</span>
            )}
            <span className="text-[10px]">{formatMsgTime(message.timestamp)}</span>
            {isSent && message.type !== 'text' ? null : isSent && (
              message.isRead
                ? <CheckCheck className="h-3.5 w-3.5" style={{ color: pal.check }} />
                : <Check className="h-3.5 w-3.5" />
            )}
            {message.isStarred && (
              <Star className="h-3 w-3 fill-current" style={{ color: pal.star }} />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: pal.bg, color: pal.text }}>
      {/* Icon Sidebar */}
      <div
        className="hidden md:flex w-[68px] shrink-0 flex-col items-center justify-between py-4"
        style={{ background: pal.sidebar, borderRight: `1px solid ${pal.border}` }}
      >
        <div className="flex flex-col items-center gap-3">
          {sidebarNavItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              title={item.label}
              className="relative rounded-lg p-2.5 transition-all"
              style={item.active ? { background: pal.selected } : {}}
              onMouseEnter={(e) => { if (!item.active) e.currentTarget.style.background = pal.hover; }}
              onMouseLeave={(e) => { if (!item.active) e.currentTarget.style.background = item.active ? pal.selected : 'transparent'; }}
            >
              <item.icon
                className="h-5 w-5"
                style={{ color: item.active ? pal.accent : pal.textSec }}
              />
              {item.badge && item.badge > 0 ? (
                <span
                  className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-bold"
                  style={{ background: pal.badge, color: pal.badgeText }}
                >
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-2">
          <ThemeToggleButton iconColor={pal.textSec} />
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              title="WhatsApp Support"
              className="rounded-lg p-2.5 transition-all"
              {...hoverBg(pal.hover)}
            >
              <Phone className="h-5 w-5" style={{ color: pal.textSec }} />
            </a>
          )}
          <div className="relative">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium"
                style={{ background: pal.accent, color: pal.accentText }}
              >
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </div>
            )}
            <span
              className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2"
              style={{ background: pal.badge, borderColor: pal.sidebar }}
            />
          </div>
        </div>
      </div>

      {/* Chat List Panel */}
      <div
        className={`flex w-full md:w-[400px] shrink-0 flex-col ${showChatOnMobile ? 'hidden md:flex' : 'flex'}`}
        style={{ background: pal.list, borderRight: `1px solid ${pal.border}` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold" style={{ color: pal.text }}>Chats</h1>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewChat(true)}
              className="rounded-lg p-2 transition-all"
              {...hoverBg(pal.hover)}
              title="New chat"
            >
              <Edit3 className="h-5 w-5" style={{ color: pal.textSec }} />
            </button>
            {supportEmailHref && (
              <a
                href={supportEmailHref}
                className="rounded-lg p-2 transition-all"
                {...hoverBg(pal.hover)}
                title="Email Support"
              >
                <Mail className="h-5 w-5" style={{ color: pal.textSec }} />
              </a>
            )}
            <ThemeToggleButton iconColor={pal.textSec} className="md:hidden" />
            <button className="rounded-lg p-2 transition-all" {...hoverBg(pal.hover)}>
              <MoreVertical className="h-5 w-5" style={{ color: pal.textSec }} />
            </button>
          </div>
        </div>

        {showNewChat ? (
          <>
            <div className="flex items-center gap-3 px-3 pb-2">
              <button
                onClick={() => { setShowNewChat(false); setDmSearchQuery(''); setDmSearchResults([]); }}
                className="rounded-lg p-1.5 transition-all"
                {...hoverBg(pal.hover)}
                title="Back to chats"
              >
                <ArrowLeft className="h-5 w-5" style={{ color: pal.textSec }} />
              </button>
              <h2 className="text-sm font-medium" style={{ color: pal.text }}>New chat</h2>
            </div>

            <div className="px-3 pb-2">
              <div className="flex items-center gap-3 rounded-lg px-3 py-1.5" style={{ background: pal.panel }}>
                <Search className="h-4 w-4 shrink-0" style={{ color: pal.textSec }} />
                <input
                  type="text"
                  placeholder="Search name, username or phone"
                  value={dmSearchQuery}
                  onChange={(e) => handleDmSearchChange(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: pal.text }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {dmSearching ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: pal.textSec }} />
                </div>
              ) : dmSearchQuery.trim().length >= 2 ? (
                dmSearchResults.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm" style={{ color: pal.textSec }}>No users found</p>
                ) : (
                  dmSearchResults.map(renderDmUserItem)
                )
              ) : (
                <>
                  <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide" style={{ color: pal.textSec }}>
                    People you may know
                  </p>
                  {dmSuggestions.length === 0 ? (
                    <p className="px-4 py-6 text-sm" style={{ color: pal.textSec }}>
                      No suggestions yet. Search by name, username or phone to find someone.
                    </p>
                  ) : (
                    dmSuggestions.map(renderDmUserItem)
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <>
        {/* Search */}
        <div className="px-3 pb-2">
          <div
            className="flex items-center gap-3 rounded-lg px-3 py-1.5"
            style={{ background: pal.panel }}
          >
            <Search className="h-4 w-4 shrink-0" style={{ color: pal.textSec }} />
            <input
              type="text"
              placeholder="Search or start a new chat"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: pal.text }}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 px-3 pb-2">
          {(['all', 'unread', 'starred'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="rounded-full px-3 py-1 text-xs font-medium capitalize transition-all"
              style={{
                background: filter === f ? pal.accent : pal.raised,
                color: filter === f ? pal.accentText : pal.textSec,
              }}
            >
              {f === 'starred' ? 'Favourites' : f}
              {f === 'unread' && totalUnread > 0 ? ` ${totalUnread}` : ''}
            </button>
          ))}
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <MessageSquare className="mb-3 h-10 w-10" style={{ color: pal.textSec }} />
              <p className="text-sm" style={{ color: pal.textSec }}>No conversations found</p>
            </div>
          ) : (
            <>
              {filteredConversations.map(renderConversationItem)}

              {/* Support card at bottom */}
              <div className="mt-1 border-t px-4 py-3" style={{ borderColor: pal.border }}>
                <div className="flex items-center gap-3">
                  <img
                    src={profile.images.logo || profile.brand.logo}
                    alt={profile.brand.name}
                    className="h-10 w-10 rounded-full bg-white object-contain p-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium" style={{ color: pal.text }}>
                      {profile.brand.name} Support
                    </p>
                    <p className="truncate text-xs" style={{ color: pal.textSec }}>
                      Message, call, email, or WhatsApp
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-2">
                  {supportPhoneHref && (
                    <a
                      href={supportPhoneHref}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all"
                      style={{ background: pal.raised, color: pal.text }}
                    >
                      <Phone className="h-3.5 w-3.5" /> Call
                    </a>
                  )}
                  {whatsappHref && (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noreferrer"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-all"
                      style={{ background: pal.accent, color: pal.accentText }}
                    >
                      <Phone className="h-3.5 w-3.5" /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
          </>
        )}
      </div>

      {/* Messages Area */}
      <div
        className={`flex-1 flex-col ${showChatOnMobile ? 'flex' : 'hidden md:flex'}`}
        style={{ background: pal.bg }}
      >
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ background: pal.panel, borderLeft: `1px solid ${pal.border}` }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowChatOnMobile(false)}
                  className="md:hidden rounded-lg p-1"
                >
                  <ArrowLeft className="h-5 w-5" style={{ color: pal.textSec }} />
                </button>
                <div className="relative h-10 w-10">
                  {selectedConversation.participantAvatar ? (
                    <img src={selectedConversation.participantAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full"
                      style={{ background: pal.raised }}
                    >
                      <User className="h-5 w-5" style={{ color: pal.textSec }} />
                    </div>
                  )}
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 ${presenceMeta(selectedConversation.participantId).className}`} style={{ borderColor: pal.panel }} />
                </div>
                <div>
                  <h2 className="flex items-center gap-1 text-sm font-medium" style={{ color: pal.text }}>
                    <span>{selectedConversation.participantName}</span>
                    {selectedConversation.isOfficial && (
                      <BadgeCheck className="h-4 w-4 shrink-0" style={{ color: pal.accent }} />
                    )}
                  </h2>
                  <p className="text-xs" style={{ color: pal.textSec }}>
                    {typingUser ? `${typingUser} is typing...` : presenceMeta(selectedConversation.participantId).label}
                    {selectedConversation.participantPhone && ` · ${selectedConversation.participantPhone}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {supportPhoneHref && (
                  <a
                    href={supportPhoneHref}
                    className="rounded-lg p-2 transition-all"
                    {...hoverBg(pal.hover)}
                    title="Call"
                  >
                    <Phone className="h-5 w-5" style={{ color: pal.textSec }} />
                  </a>
                )}
                {selectedConversation.kind !== 'dm' && (
                  <button
                    onClick={() => starConversation(selectedConversation.id)}
                    className="rounded-lg p-2 transition-all"
                    {...hoverBg(pal.hover)}
                    title="Star conversation"
                  >
                    <Star
                      className="h-5 w-5"
                      style={selectedConversation.isStarred
                        ? { color: pal.star, fill: pal.star }
                        : { color: pal.textSec }
                      }
                    />
                  </button>
                )}
                <button
                  onClick={() => setDeleteConfirmDialog({
                    isOpen: true,
                    type: 'conversation',
                    id: selectedConversation.id,
                    title: 'Delete conversation',
                    message: 'Are you sure you want to delete this conversation?'
                  })}
                  className="rounded-lg p-2 transition-all"
                  {...hoverBg(pal.hover)}
                  title="Delete conversation"
                >
                  <Trash2 className="h-5 w-5" style={{ color: pal.textSec }} />
                </button>
                <button className="rounded-lg p-2 transition-all" {...hoverBg(pal.hover)}>
                  <MoreVertical className="h-5 w-5" style={{ color: pal.textSec }} />
                </button>
              </div>
            </div>

            {/* Messages with wallpaper */}
            <div
              className="flex-1 overflow-y-auto px-4 py-4"
              style={{
                background: pal.bg,
                backgroundImage: `radial-gradient(circle, ${pal.wallpaper} 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            >
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div
                    className="mb-3 rounded-lg px-4 py-2 text-sm"
                    style={{ background: pal.raised, color: pal.text }}
                  >
                    Messages are end-to-end encrypted. No one outside of this chat can read them.
                  </div>
                  <p className="text-sm" style={{ color: pal.textSec }}>Say hi to start the conversation</p>
                </div>
              ) : (
                <>
                  <div className="mx-auto mb-3 w-fit rounded-lg px-3 py-1.5 text-xs" style={{ background: pal.raised, color: pal.textSec }}>
                    Messages are end-to-end encrypted
                  </div>
                  {messages.map(renderMessageBubble)}
                </>
              )}
              {typingUser && (
                <div className="flex justify-start">
                  <div className="rounded-lg px-3 py-2" style={{ background: pal.received }}>
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: pal.textSec, animationDelay: '0ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: pal.textSec, animationDelay: '150ms' }} />
                      <span className="h-2 w-2 animate-bounce rounded-full" style={{ background: pal.textSec, animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {editingMessage && (
              <div
                className="flex items-center justify-between px-4 py-1.5"
                style={{ background: pal.panel, borderTop: `1px solid ${pal.border}` }}
              >
                <span className="flex items-center gap-2 text-xs font-medium" style={{ color: pal.accent }}>
                  <Pencil className="h-3.5 w-3.5" /> Edit message
                </span>
                <button
                  onClick={cancelEdit}
                  className="rounded p-1 transition-all"
                  {...hoverBg(pal.hover)}
                  title="Cancel edit"
                >
                  <X className="h-4 w-4" style={{ color: pal.textSec }} />
                </button>
              </div>
            )}

            {/* Message Input */}
            <div
              className="flex items-end gap-2 px-4 py-3"
              style={{ background: pal.panel }}
            >
              <button className="shrink-0 rounded-full p-1.5 transition-all" {...hoverBg(pal.hover)}>
                <Smile className="h-6 w-6" style={{ color: pal.textSec }} />
              </button>
              <button className="shrink-0 rounded-full p-1.5 transition-all" {...hoverBg(pal.hover)}>
                <Paperclip className="h-6 w-6" style={{ color: pal.textSec }} />
              </button>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  if (selectedConversation.kind === 'dm') {
                    socketRef.current?.emit('dm:typing', {
                      conversationId: selectedConversation.id,
                      userId: user?.id,
                      name: user?.name || user?.email,
                      isTyping: Boolean(e.target.value.trim()),
                    });
                  } else {
                    socketRef.current?.emit('chat:typing', {
                      roomId: selectedConversation.id,
                      userId: user?.id,
                      name: user?.name || user?.email,
                      isTyping: Boolean(e.target.value.trim()),
                    });
                  }
                }}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message"
                className="flex-1 rounded-lg px-4 py-2.5 text-sm outline-none"
                style={{ background: pal.inputField, color: pal.text }}
              />
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || sending}
                className="shrink-0 rounded-full p-2.5 transition-all hover:opacity-80 disabled:opacity-30"
                style={{ background: pal.accent }}
              >
                <Send className="h-5 w-5" style={{ color: pal.accentText }} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div
              className="mb-4 flex h-20 w-20 items-center justify-center rounded-full"
              style={{ background: pal.raised }}
            >
              <MessageSquare className="h-10 w-10" style={{ color: pal.textSec }} />
            </div>
            <h2 className="mb-2 text-2xl font-light" style={{ color: pal.text }}>
              Hincton Meat Messages
            </h2>
            <p className="max-w-md text-sm" style={{ color: pal.textSec }}>
              Send and receive messages securely. Select a conversation from the left to start chatting with our support team.
            </p>
            <div
              className="mt-6 rounded-lg px-4 py-2 text-xs"
              style={{ background: pal.raised, color: pal.textSec }}
            >
              End-to-end encrypted
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmDialog.isOpen}
        onClose={() => setDeleteConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={deleteConfirmDialog.title}
        message={deleteConfirmDialog.message}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        icon="delete"
      />
    </div>
  );
};

export default BuyerMessages;
