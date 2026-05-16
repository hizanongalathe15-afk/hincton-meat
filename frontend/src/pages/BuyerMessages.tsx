import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Trash2, Send, MessageSquare, User, Check, CheckCheck, Phone, Paperclip, Mail } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { chatApi } from '../services/buyerApi';
import { getApiHost } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSiteContent } from '../contexts/SiteContentContext';
import ConfirmationDialog from '../components/ui/ConfirmationDialog';
import LinkifiedText from '../components/ui/LinkifiedText';

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
  participantType: 'admin' | 'farmer' | 'support';
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isStarred: boolean;
  messages: Message[];
}

const BuyerMessages: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useSiteContent();
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
  const socketRef = useRef<Socket | null>(null);

  // Confirmation dialog states
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
    const socket = io(getApiHost(), { withCredentials: true });
    socketRef.current = socket;

    socket.emit('presence:join', { userId: user.id });
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

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user, navigate, selectedConversation?.id]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      socketRef.current?.emit('chat:join', selectedConversation.id);
      socketRef.current?.emit('presence:check', { userIds: [selectedConversation.participantId] });
    }
  }, [selectedConversation]);

  useEffect(() => {
    const ids = conversations.map((conversation) => conversation.participantId).filter(Boolean);
    if (ids.length) socketRef.current?.emit('presence:check', { userIds: ids });
  }, [conversations]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await chatApi.getConversations();
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      toast.error('Could not load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await chatApi.getConversationMessages(conversationId);
      setMessages(response.messages || []);
      
      // Mark messages as read
      await chatApi.markConversationAsRead(conversationId);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      toast.error('Could not load messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await chatApi.sendConversationMessage({
        conversationId: selectedConversation.id,
        content: newMessage.trim(),
        type: 'text'
      });

      const newMsg: Message = response.message;

      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');

      // Update conversation last message
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

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await chatApi.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
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
      await chatApi.deleteConversation(conversationId);
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

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'unread') return matchesSearch && conv.unreadCount > 0;
    if (filter === 'starred') return matchesSearch && conv.isStarred;
    return matchesSearch;
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const presenceMeta = (userId: string) => {
    const status = presence[userId] || 'offline';
    if (status === 'online') return { label: 'Online', className: 'bg-green-500' };
    if (status === 'away') return { label: 'Away', className: 'bg-yellow-400' };
    return { label: 'Offline', className: 'bg-gray-400' };
  };

  const supportPhoneHref = profile.brand.phoneHref || (profile.brand.phone ? `tel:${profile.brand.phone.replace(/\s+/g, '')}` : '');
  const supportEmailHref = profile.brand.emailHref || (profile.brand.email ? `mailto:${profile.brand.email}` : '');
  const whatsappDigits = (profile.brand.phoneHref || profile.brand.phone || '').replace(/\D/g, '');
  const whatsappPhone = whatsappDigits.startsWith('254') ? whatsappDigits : whatsappDigits.startsWith('0') ? `254${whatsappDigits.slice(1)}` : whatsappDigits;
  const whatsappHref = whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(`Hello ${profile.brand.name}, I need support from my buyer account.`)}` : '';

  const renderSupportActions = () => (
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <img src={profile.images.logo || profile.brand.logo} alt={profile.brand.name} className="h-12 w-12 rounded-full bg-white object-contain p-1" />
        <div>
          <p className="m-0 text-sm font-bold text-gray-950">{profile.brand.name} Support</p>
          <p className="m-0 text-xs text-gray-600">Message, call, email, or WhatsApp admin support.</p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {supportPhoneHref && (
          <a href={supportPhoneHref} className="glass-button inline-flex items-center justify-center gap-2 bg-red-600 px-3 py-2 text-sm font-bold text-white hover:text-white">
            <Phone className="h-4 w-4" />
            Call
          </a>
        )}
        {supportEmailHref && (
          <a href={supportEmailHref} className="glass-button inline-flex items-center justify-center gap-2 bg-white/75 px-3 py-2 text-sm font-bold text-gray-900 hover:text-red-700">
            <Mail className="h-4 w-4" />
            Email
          </a>
        )}
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="glass-button inline-flex items-center justify-center gap-2 bg-green-600 px-3 py-2 text-sm font-bold text-white hover:text-white">
            <Phone className="h-4 w-4" />
            WhatsApp
          </a>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="bg-white rounded-lg shadow-sm h-[calc(100vh-8rem)]">
          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h1 className="text-xl font-semibold text-gray-900 mb-4">Messages</h1>
                <div className="mb-4">
                  {renderSupportActions()}
                </div>
                
                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                {/* Filter */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilter('all')}
                    className={`flex-1 px-3 py-1 rounded-lg text-sm font-medium ${
                      filter === 'all' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilter('unread')}
                    className={`flex-1 px-3 py-1 rounded-lg text-sm font-medium ${
                      filter === 'unread' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Unread
                  </button>
                  <button
                    onClick={() => setFilter('starred')}
                    className={`flex-1 px-3 py-1 rounded-lg text-sm font-medium ${
                      filter === 'starred' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Starred
                  </button>
                </div>
              </div>

              {/* Conversations */}
              <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>No conversations found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredConversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        onClick={() => setSelectedConversation(conversation)}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          selectedConversation?.id === conversation.id ? 'bg-red-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative h-10 w-10 rounded-full bg-gray-200">
                            {conversation.participantAvatar ? (
                              <img src={conversation.participantAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-10 w-10 items-center justify-center">
                                <User className="w-5 h-5 text-gray-500" />
                              </div>
                            )}
                            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${presenceMeta(conversation.participantId).className}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-medium text-gray-900 truncate">
                                {conversation.participantName}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {formatTime(conversation.lastMessageTime)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {conversation.lastMessage}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">{presenceMeta(conversation.participantId).label}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-2">
                            {conversation.unreadCount > 0 && (
                              <span className="bg-red-600 text-white text-xs px-2 py-1 rounded-full">
                                {conversation.unreadCount}
                              </span>
                            )}
                            {conversation.participantType && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {conversation.participantType}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                starConversation(conversation.id);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Star className={`w-3 h-3 ${conversation.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteConversation(conversation.id);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Trash2 className="w-3 h-3 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-full bg-gray-200">
                          {selectedConversation.participantAvatar ? (
                            <img src={selectedConversation.participantAvatar} alt="" className="h-10 w-10 rounded-full object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center">
                              <User className="w-5 h-5 text-gray-500" />
                            </div>
                          )}
                          <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${presenceMeta(selectedConversation.participantId).className}`} />
                        </div>
                        <div>
                          <h2 className="font-semibold text-gray-900">
                            {selectedConversation.participantName}
                          </h2>
                          <p className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{presenceMeta(selectedConversation.participantId).label}</span>
                            {selectedConversation.participantPhone && (
                              <span className="inline-flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {selectedConversation.participantPhone}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {supportPhoneHref && (
                          <a href={supportPhoneHref} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-red-700" aria-label="Call support">
                            <Phone className="w-5 h-5" />
                          </a>
                        )}
                        {supportEmailHref && (
                          <a href={supportEmailHref} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 hover:text-red-700" aria-label="Email support">
                            <Mail className="w-5 h-5" />
                          </a>
                        )}
                        <button
                          onClick={() => starConversation(selectedConversation.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <Star className={`w-5 h-5 ${selectedConversation.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                        </button>
                        <button
                          onClick={() => handleDeleteConversation(selectedConversation.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                          <Trash2 className="w-5 h-5 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center text-gray-500 py-8">
                        <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                        <p>No messages yet</p>
                      </div>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.senderId === user?.id
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap"><LinkifiedText text={message.content} /></p>
                            {(message.attachments || []).map((attachment) => (
                              <a key={attachment.url} href={attachment.url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-2 text-sm underline">
                                <Paperclip className="h-4 w-4" />
                                {attachment.name || attachment.url}
                              </a>
                            ))}
                            <div className={`flex items-center justify-between mt-1 ${
                              message.senderId === user?.id ? 'text-red-100' : 'text-gray-500'
                            }`}>
                              <span className="text-xs">
                                {formatTime(message.timestamp)}
                              </span>
                              <div className="flex gap-1">
                                {message.senderId === user?.id && (
                                  message.isRead ? (
                                    <CheckCheck className="w-3 h-3" />
                                  ) : (
                                    <Check className="w-3 h-3" />
                                  )
                                )}
                                <button
                                  onClick={() => starMessage(message.id)}
                                  className="hover:opacity-70"
                                >
                                  <Star className={`w-3 h-3 ${message.isStarred ? 'fill-current' : ''}`} />
                                </button>
                                {message.canDelete !== false && (
                                  <button
                                    onClick={() => handleDeleteMessage(message.id)}
                                    className="hover:opacity-70"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    {typingUser && (
                      <div className="text-sm text-gray-500">{typingUser} is typing...</div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => {
                          setNewMessage(e.target.value);
                          socketRef.current?.emit('chat:typing', {
                            roomId: selectedConversation.id,
                            userId: user?.id,
                            name: user?.name || user?.email,
                            isTyping: Boolean(e.target.value.trim()),
                          });
                        }}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || sending}
                        className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="w-full max-w-md text-center">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>Select a conversation to start messaging</p>
                    <div className="mt-5 text-left">{renderSupportActions()}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
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
