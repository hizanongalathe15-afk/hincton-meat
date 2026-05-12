import { Response, NextFunction } from 'express';
import { OrderModel, IOrder } from '../models/Order';
import { ProductModel } from '../models/Product';
import { AuthRequest } from '../middleware/auth';
import { OrderStatus } from '@prisma/client';

export const createOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { items, deliveryAddress, paymentMethod, specialInstructions, orderNotes, phone, mpesaPhone } = req.body;

    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await ProductModel.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      if (product.stockQuantity < item.quantity) {
        return res.status(400).json({ message: `Product out of stock: ${product.name}` });
      }

      const itemTotal = Number(product.price) * item.quantity;
      totalAmount += itemTotal;

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
        weight: item.weight,
        unit: item.unit
      });

      // Stock management would be handled separately in a real implementation
    }

    const deliveryFee = calculateDeliveryFee(deliveryAddress);
    totalAmount += deliveryFee;

    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setHours(estimatedDeliveryTime.getHours() + 2);

    // Ensure phone number is included in shipping address
    const enhancedDeliveryAddress = {
      ...deliveryAddress,
      phone: phone || mpesaPhone || deliveryAddress.phone
    };

    const order = await OrderModel.create({
      orderNumber: `ORD-${Date.now()}`,
      userId: req.user!.id,
      items: orderItems,
      totalAmount,
      deliveryAddress: enhancedDeliveryAddress,
      deliveryFee,
      paymentMethod,
      specialInstructions,
      orderNotes,
      estimatedDeliveryTime,
      paymentStatus: 'PENDING',
      status: 'PENDING'
    } as any);


    res.status(201).json({
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

export const getOrders = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const query: any = {};
    if (req.user!.roles.includes('BUYER')) {
      query.userId = req.user!.id;
    }
    
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const orders = await OrderModel.findAll(query);

    res.json({
      orders: orders.slice(skip, skip + Number(limit)),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: orders.length,
        pages: Math.ceil(orders.length / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await OrderModel.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user!.roles.includes('BUYER') && order.userId !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    
    const order = await OrderModel.update(req.params.id, { status });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrder = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const order = await OrderModel.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (req.user!.role === 'buyer' && order.userId !== req.user!.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      return res.status(400).json({ message: 'Order cannot be cancelled at this stage' });
    }

    await OrderModel.update(req.params.id, { status: 'CANCELLED' });

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const orders = await OrderModel.findAll();
    
    const stats = orders.reduce((acc, order) => {
      const status = order.status;
      if (!acc[status]) {
        acc[status] = { count: 0, totalAmount: 0 };
      }
      acc[status].count += 1;
      acc[status].totalAmount += order.totalAmount;
      return acc;
    }, {} as any);

    const totalOrders = orders.length;
    const totalRevenue = orders
      .filter(order => order.status === 'DELIVERED')
      .reduce((sum, order) => sum + Number(order.totalAmount), 0);

    res.json({
      stats,
      totalOrders,
      totalRevenue
    });
  } catch (error) {
    next(error);
  }
};

function calculateDeliveryFee(address: any): number {
  return 150;
}
