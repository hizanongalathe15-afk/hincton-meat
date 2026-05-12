// @ts-nocheck
import { prisma } from '../config/db';
import { ReturnStatus } from '@prisma/client';
import { notificationService } from './notification.service';
import { emitAgentDashboardUpdate, emitDataSync, getAgentStationCode } from '../config/realtime';

export const returnsService = {
  async getReturnDetails(id: string) {
    return prisma.returnRequest.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        order: {
          include: {
            pickupStation: true,
          },
        },
      },
    });
  },

  async createReturnRequest(userId: string, data: {
    orderId: string;
    items: Array<{
      orderItemId: string;
      quantity: number;
      reason: string;
      condition?: string;
    }>;
    reason: string;
    description?: string;
    preferredRefundMethod?: string;
  }) {
    const returnNumber = `RET-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    // Get the order with order items
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { 
        orderItems: true,
        user: true,
        pickupStation: true,
      }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    // Validate order belongs to user
    if (order.userId !== userId) {
      throw new Error('Unauthorized: This order does not belong to you');
    }
    
    // Calculate total refund amount - Convert Decimal to Number
    let totalRefundAmount = 0;
    for (const item of data.items) {
      const orderItem = order.orderItems.find(oi => oi.id === item.orderItemId);
      if (orderItem) {
        // Convert Decimal to Number using Number() or .toNumber()
        const unitPrice = Number(orderItem.unitPrice);
        totalRefundAmount += unitPrice * item.quantity;
      }
    }
    
    // Get the first order item for the relation (Prisma requires this)
    const firstOrderItemId = data.items[0]?.orderItemId;
    const firstOrderItem = order.orderItems.find(oi => oi.id === firstOrderItemId);
    
    // Create the return request
    const returnRequest = await prisma.returnRequest.create({
      data: {
        returnNumber,
        userId,
        orderId: data.orderId,
        reason: data.reason,
        reasonDetails: data.description || data.reason,
        quantity: data.items.reduce((sum, item) => sum + item.quantity, 0),
        refundAmount: totalRefundAmount,
        status: ReturnStatus.PENDING,
        orderItemId: firstOrderItemId,
        productId: firstOrderItem?.productId,
      },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        order: true,
        product: true,
        orderItem: true
      }
    });

    await notificationService.sendReturnRequestReceived(
      returnRequest.userId,
      returnRequest.returnNumber,
      order.orderNumber,
      order.user?.phone || null,
      order.user?.email || null
    );

    emitAgentDashboardUpdate({
      stationCode: order.pickupStation?.code || getAgentStationCode(order.user?.email),
      type: 'return_created',
      entity: 'return',
      data: {
        returnId: returnRequest.id,
        returnNumber: returnRequest.returnNumber,
        orderId: order.id,
        orderNumber: order.orderNumber,
        stationCode: order.pickupStation?.code || null,
      },
    });

    emitDataSync({
      entity: 'return',
      action: 'created',
      stationCode: order.pickupStation?.code || getAgentStationCode(order.user?.email),
      data: {
        returnId: returnRequest.id,
        returnNumber: returnRequest.returnNumber,
        orderId: order.id,
      },
    });
    
    return returnRequest;
  },

  async getReturns({ page, limit, status, userId, stationCode }: { page: number; limit: number; status?: string; userId?: string; stationCode?: string }) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;
    if (stationCode) {
      where.order = {
        pickupStation: {
          code: stationCode,
        },
      };
    }

    const [returns, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { 
            select: { 
              id: true, 
              email: true, 
              phone: true,
              profile: { 
                select: { 
                  firstName: true, 
                  lastName: true, 
                  fullName: true 
                } 
              } 
            } 
          },
          order: { 
            select: { 
              id: true, 
              orderNumber: true, 
              totalAmount: true,
              pickupStation: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            } 
          },
          product: { 
            select: { 
              id: true, 
              name: true,
              productImages: {
                select: { url: true, isPrimary: true },
                take: 1
              }
            } 
          }
        }
      }),
      prisma.returnRequest.count({ where })
    ]);

    const summaryWhere = stationCode
      ? {
          order: {
            pickupStation: {
              code: stationCode,
            },
          },
        }
      : {};

    const summary = {
      pending: await prisma.returnRequest.count({ where: { ...summaryWhere, status: 'PENDING' } }),
      approved: await prisma.returnRequest.count({ where: { ...summaryWhere, status: 'APPROVED' } }),
      rejected: await prisma.returnRequest.count({ where: { ...summaryWhere, status: 'REJECTED' } }),
      completed: await prisma.returnRequest.count({ where: { ...summaryWhere, status: 'COMPLETED' } })
    };

    return { returns, total, summary, page, totalPages: Math.ceil(total / limit) };
  },

  async getUserReturns(userId: string, { page = 1, limit = 10 }: { page?: number; limit?: number }) {
    const skip = (page - 1) * limit;
    
    const [returns, total] = await Promise.all([
      prisma.returnRequest.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          order: { 
            select: { 
              id: true, 
              orderNumber: true, 
              totalAmount: true 
            } 
          },
          product: { 
            select: { 
              id: true, 
              name: true,
              productImages: {
                select: { url: true, isPrimary: true },
                take: 1
              }
            } 
          }
        }
      }),
      prisma.returnRequest.count({ where: { userId } })
    ]);
    
    return { returns, total, page, totalPages: Math.ceil(total / limit) };
  },

  async getReturnById(id: string) {
    return await prisma.returnRequest.findUnique({
      where: { id },
      include: { 
        user: { 
          include: { profile: true } 
        },
        order: {
          include: {
            pickupStation: true,
          },
        },
        product: {
          include: { productImages: true }
        },
        orderItem: true
      }
    });
  },

  async updateReturnStatus(id: string, status: ReturnStatus, notes?: string) {
    const updated = await prisma.returnRequest.update({
      where: { id },
      data: { 
        status, 
        adminNotes: notes, 
        approvedAt: status === 'APPROVED' ? new Date() : undefined 
      }
    });

    const detailedReturn: any = await this.getReturnDetails(id);
    if (detailedReturn?.userId && detailedReturn.order) {
      const phone = detailedReturn.user?.phone || null;
      const email = detailedReturn.user?.email || null;

      if (status === 'APPROVED') {
        await notificationService.sendReturnApproved(
          detailedReturn.userId,
          detailedReturn.returnNumber,
          detailedReturn.order.orderNumber,
          phone,
          email
        );
      } else if (status === 'REJECTED') {
        await notificationService.sendReturnRejected(
          detailedReturn.userId,
          detailedReturn.returnNumber,
          detailedReturn.order.orderNumber,
          notes,
          phone,
          email
        );
      }
    }

    emitAgentDashboardUpdate({
      stationCode: detailedReturn?.order?.pickupStation?.code || getAgentStationCode(detailedReturn?.user?.email),
      type: 'return_status_updated',
      entity: 'return',
      data: {
        returnId: updated.id,
        returnNumber: detailedReturn?.returnNumber || null,
        status,
        orderNumber: detailedReturn?.order?.orderNumber || null,
        stationCode: detailedReturn?.order?.pickupStation?.code || null,
      },
    });

    emitDataSync({
      entity: 'return',
      action: 'status_updated',
      stationCode: detailedReturn?.order?.pickupStation?.code || getAgentStationCode(detailedReturn?.user?.email),
      data: {
        returnId: updated.id,
        returnNumber: detailedReturn?.returnNumber || null,
        status,
      },
    });

    return updated;
  },

  async approveReturn(id: string, refundAmount?: number) {
    const returnRequest = await prisma.returnRequest.findUnique({ 
      where: { id }, 
      include: { order: true } 
    });
    if (!returnRequest) throw new Error('Return request not found');
    
    // Convert Decimal to Number
    const orderTotal = returnRequest.order?.totalAmount ? Number(returnRequest.order.totalAmount) : 0;
    const finalRefundAmount = refundAmount || orderTotal;
    
    const updated = await prisma.returnRequest.update({
      where: { id },
      data: { 
        status: 'APPROVED', 
        refundAmount: finalRefundAmount, 
        approvedAt: new Date() 
      }
    });

    const detailedReturn: any = await this.getReturnDetails(id);
    if (detailedReturn?.userId && detailedReturn.order) {
      await notificationService.sendReturnApproved(
        detailedReturn.userId,
        detailedReturn.returnNumber,
        detailedReturn.order.orderNumber,
        detailedReturn.user?.phone || null,
        detailedReturn.user?.email || null
      );
    }

    emitAgentDashboardUpdate({
      stationCode: detailedReturn?.order?.pickupStation?.code || getAgentStationCode(detailedReturn?.user?.email),
      type: 'return_approved',
      entity: 'return',
      data: {
        returnId: updated.id,
        returnNumber: detailedReturn?.returnNumber || null,
        orderNumber: detailedReturn?.order?.orderNumber || null,
        stationCode: detailedReturn?.order?.pickupStation?.code || null,
        refundAmount: finalRefundAmount,
      },
    });

    emitDataSync({
      entity: 'return',
      action: 'approved',
      stationCode: detailedReturn?.order?.pickupStation?.code || getAgentStationCode(detailedReturn?.user?.email),
      data: {
        returnId: updated.id,
        returnNumber: detailedReturn?.returnNumber || null,
        refundAmount: finalRefundAmount,
      },
    });

    return updated;
  },

  async rejectReturn(id: string, reason: string) {
    const updated = await prisma.returnRequest.update({
      where: { id },
      data: { status: 'REJECTED', adminNotes: reason }
    });

    const detailedReturn: any = await this.getReturnDetails(id);
    emitAgentDashboardUpdate({
      stationCode: detailedReturn?.order?.pickupStation?.code || getAgentStationCode(detailedReturn?.user?.email),
      type: 'return_rejected',
      entity: 'return',
      data: {
        returnId: updated.id,
        returnNumber: detailedReturn?.returnNumber || null,
        orderNumber: detailedReturn?.order?.orderNumber || null,
        stationCode: detailedReturn?.order?.pickupStation?.code || null,
      },
    });

    emitDataSync({
      entity: 'return',
      action: 'rejected',
      stationCode: detailedReturn?.order?.pickupStation?.code || getAgentStationCode(detailedReturn?.user?.email),
      data: {
        returnId: updated.id,
        returnNumber: detailedReturn?.returnNumber || null,
      },
    });

    return updated;
  },

  async processRefund(id: string) {
    const returnRequest = await prisma.returnRequest.findUnique({ 
      where: { id }, 
      include: { order: true } 
    });
    if (!returnRequest) throw new Error('Return request not found');
    
    // Convert Decimal to Number
    const existingRefund = returnRequest.refundAmount ? Number(returnRequest.refundAmount) : 0;
    const orderTotal = returnRequest.order?.totalAmount ? Number(returnRequest.order.totalAmount) : 0;
    const refundAmount = existingRefund || orderTotal;
    
    const updated = await prisma.returnRequest.update({
      where: { id },
      data: { 
        status: 'COMPLETED', 
        refundAmount, 
        refundedAt: new Date(), 
        refundTransactionId: `REF-${Date.now()}` 
      }
    });

    const detailedReturn: any = await this.getReturnDetails(id);
    if (detailedReturn?.userId && detailedReturn.order) {
      await notificationService.sendRefundProcessed(
        detailedReturn.order.orderNumber,
        detailedReturn.user?.phone || null,
        detailedReturn.user?.email || null,
        refundAmount
      );
    }

    emitAgentDashboardUpdate({
      stationCode: detailedReturn?.order?.pickupStation?.code || getAgentStationCode(detailedReturn?.user?.email),
      type: 'return_refunded',
      entity: 'return',
      data: {
        returnId: updated.id,
        returnNumber: detailedReturn?.returnNumber || null,
        orderNumber: detailedReturn?.order?.orderNumber || null,
        stationCode: detailedReturn?.order?.pickupStation?.code || null,
        refundAmount,
      },
    });

    emitDataSync({
      entity: 'return',
      action: 'refunded',
      stationCode: detailedReturn?.order?.pickupStation?.code || getAgentStationCode(detailedReturn?.user?.email),
      data: {
        returnId: updated.id,
        returnNumber: detailedReturn?.returnNumber || null,
        refundAmount,
      },
    });

    return updated;
  },

  async cancelReturnRequest(id: string, userId: string) {
    const returnRequest = await prisma.returnRequest.findUnique({ where: { id } });
    if (!returnRequest) throw new Error('Return request not found');
    if (returnRequest.userId !== userId) throw new Error('Unauthorized');
    if (returnRequest.status !== 'PENDING') throw new Error('Cannot cancel a non-pending return request');
    
    return await prisma.returnRequest.update({
      where: { id },
      data: { status: 'CANCELLED' }
    });
  },

  async trackReturnStatus(id: string) {
    return await prisma.returnRequest.findUnique({
      where: { id },
      select: {
        id: true,
        returnNumber: true,
        status: true,
        reason: true,
        refundAmount: true,
        createdAt: true,
        approvedAt: true,
        refundedAt: true,
        adminNotes: true
      }
    });
  },

  async getReturnPolicy() {
    return { 
      allowedDays: 30,
      maxReturnItems: 10,
      restockingFee: 0,
      refundProcessingDays: 7
    };
  }
};
