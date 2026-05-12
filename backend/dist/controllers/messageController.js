"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMessage = exports.markAsRead = exports.getConversations = exports.sendMessage = exports.getMessages = void 0;
const prisma_1 = require("../config/prisma");
const getMessages = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { roomId } = req.params;
        const liveChatMessages = await prisma_1.prisma.liveChatMessage.findMany({
            where: {
                roomId
            },
            include: {
                user: {
                    include: {
                        profile: {
                            select: { fullName: true }
                        }
                    }
                },
                admin: {
                    include: {
                        profile: {
                            select: { fullName: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
        res.json({ liveChatMessages });
    }
    catch (error) {
        console.error('Get liveChatMessages error:', error);
        res.status(500).json({ message: 'Server error while fetching liveChatMessages' });
    }
};
exports.getMessages = getMessages;
const sendMessage = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { roomId, message } = req.body;
        const liveChatMessage = await prisma_1.prisma.liveChatMessage.create({
            data: {
                userId,
                roomId,
                message,
                isFromUser: true
            },
            include: {
                user: {
                    include: {
                        profile: {
                            select: { fullName: true }
                        }
                    }
                },
                admin: {
                    include: {
                        profile: {
                            select: { fullName: true }
                        }
                    }
                }
            }
        });
        res.status(201).json({ liveChatMessage });
    }
    catch (error) {
        console.error('Send liveChatMessage error:', error);
        res.status(500).json({ message: 'Server error while sending liveChatMessage' });
    }
};
exports.sendMessage = sendMessage;
const getConversations = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        // Get all unique conversations for the user (by roomId)
        const conversations = await prisma_1.prisma.liveChatMessage.findMany({
            where: {
                userId
            },
            include: {
                user: {
                    include: {
                        profile: {
                            select: { fullName: true }
                        }
                    }
                },
                admin: {
                    include: {
                        profile: {
                            select: { fullName: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        // Group by roomId and get latest message
        const conversationMap = new Map();
        conversations.forEach(liveChatMessage => {
            const roomId = liveChatMessage.roomId;
            if (!conversationMap.has(roomId)) {
                conversationMap.set(roomId, {
                    roomId,
                    lastMessage: liveChatMessage,
                    unreadCount: 0
                });
            }
            else {
                const conversation = conversationMap.get(roomId);
                if (conversation.lastMessage.createdAt < liveChatMessage.createdAt) {
                    conversation.lastMessage = liveChatMessage;
                }
                conversationMap.set(roomId, conversation);
            }
        });
        const uniqueConversations = Array.from(conversationMap.values());
        res.json({ conversations: uniqueConversations });
    }
    catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({ message: 'Server error while fetching conversations' });
    }
};
exports.getConversations = getConversations;
const markAsRead = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { messageId } = req.params;
        const liveChatMessage = await prisma_1.prisma.liveChatMessage.findFirst({
            where: {
                id: messageId,
                userId
            }
        });
        if (!liveChatMessage) {
            return res.status(404).json({ message: 'Message not found' });
        }
        await prisma_1.prisma.liveChatMessage.update({
            where: { id: messageId },
            data: { isRead: true }
        });
        res.json({ message: 'Message marked as read' });
    }
    catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Server error while marking message as read' });
    }
};
exports.markAsRead = markAsRead;
const deleteMessage = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { messageId } = req.params;
        const liveChatMessage = await prisma_1.prisma.liveChatMessage.findFirst({
            where: {
                id: messageId,
                userId
            }
        });
        if (!liveChatMessage) {
            return res.status(404).json({ message: 'Message not found' });
        }
        await prisma_1.prisma.liveChatMessage.delete({
            where: { id: messageId }
        });
        res.json({ message: 'Message deleted successfully' });
    }
    catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({ message: 'Server error while deleting message' });
    }
};
exports.deleteMessage = deleteMessage;
//# sourceMappingURL=messageController.js.map