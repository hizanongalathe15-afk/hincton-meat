"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTicketStatus = exports.assignHelpTicket = exports.getAllHelpTickets = exports.closeHelpTicket = exports.updateHelpTicket = exports.getHelpTicket = exports.getHelpTickets = exports.createHelpTicket = void 0;
const prisma_1 = require("../config/prisma");
const client_1 = require("@prisma/client");
/**
 * NOTE:
 * Your Prisma schema in this repo does NOT include `assignedTo` / `assignedToId`.
 * The previous helpController referenced those fields which caused TypeScript to fail.
 *
 * This version keeps help-ticket CRUD working (user, status, priority, category)
 * and removes unsupported admin assignment fields so the backend compiles.
 */
const createHelpTicket = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { title, description, category, priority = 'MEDIUM' } = req.body;
        const ticket = await prisma_1.prisma.supportTicket.create({
            data: {
                userId,
                subject: title,
                message: description,
                category,
                priority: priority,
                status: client_1.TicketStatus.OPEN
            },
            include: {
                user: {
                    include: {
                        profile: {
                            select: { fullName: true }
                        }
                    }
                }
            }
        });
        res.status(201).json({ ticket });
    }
    catch (error) {
        console.error('Create help ticket error:', error);
        res.status(500).json({ message: 'Server error while creating help ticket' });
    }
};
exports.createHelpTicket = createHelpTicket;
const getHelpTickets = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { page = 1, limit = 10, status, category } = req.query;
        const where = { userId };
        if (status)
            where.status = status;
        if (category)
            where.category = category;
        const tickets = await prisma_1.prisma.supportTicket.findMany({
            where,
            include: {
                user: {
                    include: {
                        profile: {
                            select: { fullName: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });
        const total = await prisma_1.prisma.supportTicket.count({ where });
        res.json({
            tickets,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get help tickets error:', error);
        res.status(500).json({ message: 'Server error while fetching help tickets' });
    }
};
exports.getHelpTickets = getHelpTickets;
const getHelpTicket = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { ticketId } = req.params;
        const ticket = await prisma_1.prisma.supportTicket.findFirst({
            where: {
                id: ticketId,
                userId
            },
            include: {
                user: {
                    include: {
                        profile: {
                            select: { fullName: true }
                        }
                    }
                }
            }
        });
        if (!ticket) {
            return res.status(404).json({ message: 'Help ticket not found' });
        }
        res.json({ ticket });
    }
    catch (error) {
        console.error('Get help ticket error:', error);
        res.status(500).json({ message: 'Server error while fetching help ticket' });
    }
};
exports.getHelpTicket = getHelpTicket;
const updateHelpTicket = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { ticketId } = req.params;
        const { title, description, category } = req.body;
        const ticket = await prisma_1.prisma.supportTicket.findFirst({
            where: {
                id: ticketId,
                userId
            }
        });
        if (!ticket) {
            return res.status(404).json({ message: 'Help ticket not found' });
        }
        const updatedTicket = await prisma_1.prisma.supportTicket.update({
            where: { id: ticketId },
            data: {
                subject: title,
                message: description,
                category
            },
            include: {
                user: {
                    include: {
                        profile: {
                            select: { fullName: true }
                        }
                    }
                }
            }
        });
        res.json({ ticket: updatedTicket });
    }
    catch (error) {
        console.error('Update help ticket error:', error);
        res.status(500).json({ message: 'Server error while updating help ticket' });
    }
};
exports.updateHelpTicket = updateHelpTicket;
const closeHelpTicket = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { ticketId } = req.params;
        const ticket = await prisma_1.prisma.supportTicket.findFirst({
            where: {
                id: ticketId,
                userId
            }
        });
        if (!ticket) {
            return res.status(404).json({ message: 'Help ticket not found' });
        }
        await prisma_1.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status: 'CLOSED' }
        });
        res.json({ message: 'Help ticket closed successfully' });
    }
    catch (error) {
        console.error('Close help ticket error:', error);
        res.status(500).json({ message: 'Server error while closing help ticket' });
    }
};
exports.closeHelpTicket = closeHelpTicket;
// Admin functions (assignment removed because Prisma schema doesn't support it)
const getAllHelpTickets = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, category, priority } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (category)
            where.category = category;
        if (priority)
            where.priority = priority;
        const tickets = await prisma_1.prisma.supportTicket.findMany({
            where,
            include: {
                user: {
                    include: {
                        profile: {
                            select: { fullName: true }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });
        const total = await prisma_1.prisma.supportTicket.count({ where });
        res.json({
            tickets,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get all help tickets error:', error);
        res.status(500).json({ message: 'Server error while fetching help tickets' });
    }
};
exports.getAllHelpTickets = getAllHelpTickets;
const assignHelpTicket = async (req, res) => {
    // Stub: schema does not support assignedTo/assignedToId.
    // Keep endpoint responsive.
    return res.status(501).json({ message: 'Help ticket assignment not implemented (schema missing assignedTo)' });
};
exports.assignHelpTicket = assignHelpTicket;
const updateTicketStatus = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status } = req.body;
        const ticket = await prisma_1.prisma.supportTicket.findUnique({
            where: { id: ticketId }
        });
        if (!ticket) {
            return res.status(404).json({ message: 'Help ticket not found' });
        }
        const updatedTicket = await prisma_1.prisma.supportTicket.update({
            where: { id: ticketId },
            data: { status },
            include: {
                user: {
                    include: {
                        profile: {
                            select: { fullName: true }
                        }
                    }
                }
            }
        });
        res.json({ ticket: updatedTicket });
    }
    catch (error) {
        console.error('Update ticket status error:', error);
        res.status(500).json({ message: 'Server error while updating ticket status' });
    }
};
exports.updateTicketStatus = updateTicketStatus;
//# sourceMappingURL=helpController.js.map