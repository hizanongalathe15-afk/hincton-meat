"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const zod_1 = require("zod");
const router = express_1.default.Router();
const sendMessageSchema = zod_1.z.object({
    sessionId: zod_1.z.string().min(1),
    message: zod_1.z.string().min(1),
    // sender: user or admin
    from: zod_1.z.enum(['user', 'admin']).default('user'),
});
const getAuthUserId = (req) => req.user?.id ?? null;
const isAdmin = (req) => req.user?.roles?.some((role) => ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'].includes(role));
const getGuestSessionId = (req) => {
    const value = req.header('X-Guest-Session-Id');
    return typeof value === 'string' && value.trim().length >= 12 ? value.trim() : null;
};
const notifyAdminsOfCustomerMessage = async (sessionId, userId, message) => {
    const admins = await prisma_1.prisma.user.findMany({
        where: { roles: { hasSome: ['ADMIN', 'SUPER_ADMIN', 'SUPPORT'] } },
        select: { id: true },
    });
    if (admins.length === 0)
        return;
    await prisma_1.prisma.notification.createMany({
        data: admins.map((admin) => ({
            userId: admin.id,
            type: 'SYSTEM',
            title: 'New customer message',
            message: message.slice(0, 180),
            data: { sessionId, userId },
            actionUrl: '/admin/communications',
            channel: 'inApp',
        })),
    });
};
const notifyCustomerOfAdminReply = async (sessionId, userId, message) => {
    await prisma_1.prisma.notification.create({
        data: {
            userId,
            type: 'SYSTEM',
            title: 'Support replied',
            message: message.slice(0, 180),
            data: { sessionId },
            actionUrl: '/profile',
            channel: 'inApp',
        },
    });
};
const getOrCreateGuestChatUser = async (sessionId) => {
    const safeSession = sessionId.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 48);
    const email = `guest-${safeSession}@guest.hincton.local`;
    return prisma_1.prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            email,
            roles: ['BUYER'],
            profile: { create: { fullName: 'Guest Customer' } },
            security: { create: { is_active: true, isEmailVerified: false } },
        },
    });
};
router.post('/messages', async (req, res) => {
    try {
        const { sessionId, message, from } = sendMessageSchema.parse(req.body);
        const authUserId = getAuthUserId(req);
        const guestSessionId = getGuestSessionId(req);
        if (!authUserId && !guestSessionId)
            return res.status(400).json({ error: 'Missing guest session id' });
        if (from === 'admin' && !isAdmin(req)) {
            return res.status(403).json({ error: 'Admin access required' });
        }
        const existingSessionMessage = from === 'admin'
            ? await prisma_1.prisma.liveChatMessage.findFirst({
                where: { sessionId, isFromUser: true },
                orderBy: { createdAt: 'asc' },
                select: { userId: true },
            })
            : null;
        const guestUser = !authUserId && from === 'user' && guestSessionId ? await getOrCreateGuestChatUser(guestSessionId) : null;
        const finalUserId = from === 'admin' ? existingSessionMessage?.userId : authUserId || guestUser?.id;
        if (!finalUserId)
            return res.status(404).json({ error: 'Customer chat session not found' });
        const msg = await prisma_1.prisma.liveChatMessage.create({
            data: {
                sessionId,
                roomId: sessionId, // simple 1:1 mapping
                isFromUser: from === 'user',
                isRead: false,
                userId: finalUserId,
                adminId: from === 'admin' ? authUserId : null,
                message,
            },
            include: {
                user: { select: { id: true, username: true, email: true, profile: { select: { fullName: true, avatar: true } } } },
                admin: { select: { id: true, username: true, email: true, profile: { select: { fullName: true, avatar: true } } } },
            },
        });
        if (from === 'user') {
            notifyAdminsOfCustomerMessage(sessionId, finalUserId, message).catch((error) => {
                console.error('Admin chat notification error:', error);
            });
        }
        else if (from === 'admin') {
            notifyCustomerOfAdminReply(sessionId, finalUserId, message).catch((error) => {
                console.error('Customer chat notification error:', error);
            });
        }
        res.status(201).json({ message: 'Message sent', msg });
    }
    catch (error) {
        console.error('Send chat message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});
// Get messages by session
router.get('/sessions/:sessionId/messages', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const messages = await prisma_1.prisma.liveChatMessage.findMany({
            where: { sessionId, roomId: sessionId },
            include: {
                user: { select: { id: true, username: true, email: true, profile: { select: { fullName: true, avatar: true } } } },
                admin: { select: { id: true, username: true, email: true, profile: { select: { fullName: true, avatar: true } } } },
            },
            orderBy: { createdAt: 'asc' },
        });
        res.json({ sessionId, messages });
    }
    catch (error) {
        console.error('Get chat messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});
// Get all chat sessions for admin
router.get('/admin/sessions', async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        if (!isAdmin(req))
            return res.status(403).json({ error: 'Admin access required' });
        const messages = await prisma_1.prisma.liveChatMessage.findMany({
            where: { sessionId: { not: null } },
            include: {
                user: { select: { id: true, username: true, email: true, profile: { select: { fullName: true, avatar: true } } } },
                admin: { select: { id: true, username: true, email: true, profile: { select: { fullName: true, avatar: true } } } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const seen = new Set();
        const sessions = messages
            .filter((message) => {
            if (!message.sessionId || seen.has(message.sessionId))
                return false;
            seen.add(message.sessionId);
            return true;
        })
            .map((message) => ({
            sessionId: message.sessionId,
            createdAt: message.createdAt,
            lastMessage: message,
            user: message.user,
            unreadCount: messages.filter((item) => item.sessionId === message.sessionId && item.isFromUser && !item.isRead).length,
        }));
        res.json({ sessions });
    }
    catch (error) {
        console.error('Get admin chat sessions error:', error);
        res.status(500).json({ error: 'Failed to get sessions' });
    }
});
// Get user's chat sessions
router.get('/user/sessions', async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        const sessions = await prisma_1.prisma.liveChatMessage.findMany({
            where: { userId },
            select: {
                sessionId: true,
                createdAt: true,
                isRead: true,
            },
            distinct: ['sessionId'],
            orderBy: { createdAt: 'desc' },
        });
        res.json({ sessions });
    }
    catch (error) {
        console.error('Get user chat sessions error:', error);
        res.status(500).json({ error: 'Failed to get sessions' });
    }
});
// Mark messages as read
router.put('/sessions/:sessionId/read', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const userId = getAuthUserId(req);
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        await prisma_1.prisma.liveChatMessage.updateMany({
            where: {
                sessionId,
                ...(isAdmin(req)
                    ? { isFromUser: true }
                    : { userId, isFromUser: false }),
            },
            data: { isRead: true },
        });
        res.json({ message: 'Messages marked as read' });
    }
    catch (error) {
        console.error('Mark messages as read error:', error);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
});
// Edit message (users can edit their own messages within 10 minutes)
router.put('/messages/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const { newMessage } = zod_1.z.object({ newMessage: zod_1.z.string().min(1).max(1000) }).parse(req.body);
        const userId = getAuthUserId(req);
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        const message = await prisma_1.prisma.liveChatMessage.findUnique({
            where: { id: messageId },
        });
        if (!message)
            return res.status(404).json({ error: 'Message not found' });
        // Check if user can edit this message
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        if (message.isFromUser) {
            // User editing their own message
            if (message.userId !== userId) {
                return res.status(403).json({ error: 'Not authorized to edit this message' });
            }
            if (message.createdAt < tenMinutesAgo) {
                return res.status(403).json({ error: 'Can only edit messages within 10 minutes' });
            }
        }
        else {
            // Admin editing their own message
            if (!isAdmin(req) || message.adminId !== userId) {
                return res.status(403).json({ error: 'Not authorized to edit this message' });
            }
            if (message.createdAt < tenMinutesAgo) {
                return res.status(403).json({ error: 'Can only edit messages within 10 minutes' });
            }
        }
        // Store original message for audit
        const originalMessage = message.message || '';
        const updatedMessage = await prisma_1.prisma.liveChatMessage.update({
            where: { id: messageId },
            data: {
                message: newMessage,
                editedAt: new Date(),
                originalMessage: originalMessage
            }
        });
        res.json({
            message: 'Message updated successfully',
            updatedMessage: {
                id: updatedMessage.id,
                message: updatedMessage.message,
                editedAt: updatedMessage.editedAt
            }
        });
    }
    catch (error) {
        console.error('Edit message error:', error);
        if (error instanceof zod_1.z.ZodError) {
            return res.status(400).json({ error: 'Invalid message content', details: error.issues });
        }
        res.status(500).json({ error: 'Failed to edit message' });
    }
});
// Delete message (admin only)
router.delete('/messages/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = getAuthUserId(req);
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        const message = await prisma_1.prisma.liveChatMessage.findUnique({
            where: { id: messageId },
        });
        if (!message)
            return res.status(404).json({ error: 'Message not found' });
        // Only admin who sent the message or system admin can delete
        if (message.adminId !== userId) {
            return res.status(403).json({ error: 'Not authorized to delete this message' });
        }
        await prisma_1.prisma.liveChatMessage.delete({
            where: { id: messageId },
        });
        res.json({ message: 'Message deleted successfully' });
    }
    catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});
// New conversation endpoints
router.get('/conversations', async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        // For now, return mock data since conversation model doesn't exist
        const mockConversations = [
            {
                id: 'conv1',
                participantId: 'admin1',
                participantName: 'Support Team',
                participantAvatar: null,
                participantType: 'support',
                lastMessage: 'Hello! How can we help you today?',
                lastMessageTime: new Date().toISOString(),
                unreadCount: 0,
                isStarred: false,
                messages: []
            }
        ];
        res.json({ success: true, conversations: mockConversations });
    }
    catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});
router.get('/conversations/:conversationId/messages', async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { conversationId } = req.params;
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        // For now, return mock data
        const mockMessages = [
            {
                id: 'msg1',
                senderId: 'admin1',
                senderName: 'Support Team',
                senderAvatar: null,
                receiverId: userId,
                content: 'Hello! How can we help you today?',
                timestamp: new Date().toISOString(),
                isRead: false,
                isStarred: false,
                type: 'text',
                orderId: null,
                orderNumber: null
            }
        ];
        res.json({ success: true, messages: mockMessages });
    }
    catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
router.post('/conversations/message', async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        const { conversationId, content, type } = req.body;
        if (!content || !content.trim()) {
            return res.status(400).json({ error: 'Message content is required' });
        }
        // For now, return mock response
        const newMessage = {
            id: 'msg_' + Date.now(),
            senderId: userId,
            senderName: 'You',
            senderAvatar: null,
            receiverId: 'admin1',
            content: content.trim(),
            timestamp: new Date().toISOString(),
            isRead: false,
            isStarred: false,
            type: type || 'text',
            orderId: null,
            orderNumber: null
        };
        res.status(201).json({ success: true, message: newMessage });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});
router.put('/conversations/:conversationId/read', async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { conversationId } = req.params;
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        res.json({ success: true, message: 'Conversation marked as read' });
    }
    catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});
router.put('/messages/:messageId/star', async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { messageId } = req.params;
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        res.json({ success: true, message: 'Message starred status updated' });
    }
    catch (error) {
        console.error('Star message error:', error);
        res.status(500).json({ error: 'Failed to star message' });
    }
});
router.delete('/messages/:messageId', async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { messageId } = req.params;
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        res.json({ success: true, message: 'Message deleted successfully' });
    }
    catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ error: 'Failed to delete message' });
    }
});
router.put('/conversations/:conversationId/star', async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { conversationId } = req.params;
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        res.json({ success: true, message: 'Conversation starred status updated' });
    }
    catch (error) {
        console.error('Star conversation error:', error);
        res.status(500).json({ error: 'Failed to star conversation' });
    }
});
router.delete('/conversations/:conversationId', async (req, res) => {
    try {
        const userId = getAuthUserId(req);
        const { conversationId } = req.params;
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        res.json({ success: true, message: 'Conversation deleted successfully' });
    }
    catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({ error: 'Failed to delete conversation' });
    }
});
exports.default = router;
//# sourceMappingURL=chat.js.map