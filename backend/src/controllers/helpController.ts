import { Request, Response } from 'express'
import { prisma } from '../config/prisma'
import { AuthRequest } from '../middleware/auth'
import { TicketPriority, TicketStatus } from '@prisma/client'

/**
 * NOTE:
 * Your Prisma schema in this repo does NOT include `assignedTo` / `assignedToId`.
 * The previous helpController referenced those fields which caused TypeScript to fail.
 *
 * This version keeps help-ticket CRUD working (user, status, priority, category)
 * and removes unsupported admin assignment fields so the backend compiles.
 */

export const createHelpTicket = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { title, description, category, priority = 'MEDIUM' } = req.body

    const ticket = await prisma.supportTicket.create({
      data: {
        userId,
        subject: title,
        message: description,
        category,
        priority: priority as TicketPriority,
        status: TicketStatus.OPEN
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
    })

    res.status(201).json({ ticket })
  } catch (error) {
    console.error('Create help ticket error:', error)
    res.status(500).json({ message: 'Server error while creating help ticket' })
  }
}

export const getHelpTickets = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { page = 1, limit = 10, status, category } = req.query

    const where: any = { userId }
    if (status) where.status = status
    if (category) where.category = category

    const tickets = await prisma.supportTicket.findMany({
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
    })

    const total = await prisma.supportTicket.count({ where })

    res.json({
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get help tickets error:', error)
    res.status(500).json({ message: 'Server error while fetching help tickets' })
  }
}

export const getHelpTicket = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { ticketId } = req.params

    const ticket = await prisma.supportTicket.findFirst({
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
    })

    if (!ticket) {
      return res.status(404).json({ message: 'Help ticket not found' })
    }

    res.json({ ticket })
  } catch (error) {
    console.error('Get help ticket error:', error)
    res.status(500).json({ message: 'Server error while fetching help ticket' })
  }
}

export const updateHelpTicket = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { ticketId } = req.params
    const { title, description, category } = req.body

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        userId
      }
    })

    if (!ticket) {
      return res.status(404).json({ message: 'Help ticket not found' })
    }

    const updatedTicket = await prisma.supportTicket.update({
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
    })

    res.json({ ticket: updatedTicket })
  } catch (error) {
    console.error('Update help ticket error:', error)
    res.status(500).json({ message: 'Server error while updating help ticket' })
  }
}

export const closeHelpTicket = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id
    const { ticketId } = req.params

    const ticket = await prisma.supportTicket.findFirst({
      where: {
        id: ticketId,
        userId
      }
    })

    if (!ticket) {
      return res.status(404).json({ message: 'Help ticket not found' })
    }

    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { status: 'CLOSED' }
    })

    res.json({ message: 'Help ticket closed successfully' })
  } catch (error) {
    console.error('Close help ticket error:', error)
    res.status(500).json({ message: 'Server error while closing help ticket' })
  }
}

// Admin functions (assignment removed because Prisma schema doesn't support it)
export const getAllHelpTickets = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10, status, category, priority } = req.query

    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category
    if (priority) where.priority = priority

    const tickets = await prisma.supportTicket.findMany({
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
    })

    const total = await prisma.supportTicket.count({ where })

    res.json({
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    })
  } catch (error) {
    console.error('Get all help tickets error:', error)
    res.status(500).json({ message: 'Server error while fetching help tickets' })
  }
}

export const assignHelpTicket = async (req: AuthRequest, res: Response) => {
  // Stub: schema does not support assignedTo/assignedToId.
  // Keep endpoint responsive.
  return res.status(501).json({ message: 'Help ticket assignment not implemented (schema missing assignedTo)' })
}

export const updateTicketStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { ticketId } = req.params
    const { status } = req.body

    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId }
    })

    if (!ticket) {
      return res.status(404).json({ message: 'Help ticket not found' })
    }

    const updatedTicket = await prisma.supportTicket.update({
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
    })

    res.json({ ticket: updatedTicket })
  } catch (error) {
    console.error('Update ticket status error:', error)
    res.status(500).json({ message: 'Server error while updating ticket status' })
  }
}

