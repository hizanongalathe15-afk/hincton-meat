import { Response, NextFunction } from 'express';
import axios from 'axios';
import { MPESA_CONFIG, getAccessToken } from '../config/mpesaConfig';
import { TransactionModel, ITransaction } from '../models/Transaction';
import { OrderModel } from '../models/Order';
import { AuthRequest } from '../middleware/auth';
import { OrderStatus } from '@prisma/client';

export const initiateSTKPush = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phoneNumber, amount, orderId } = req.body;

    if (!phoneNumber || !amount || !orderId) {
      return res.status(400).json({ message: 'Phone number, amount, and order ID are required' });
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.userId.toString() !== req.user!.id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const accessToken = await getAccessToken();
    
    const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, -4);
    const password = Buffer.from(
      `${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`
    ).toString('base64');

    const stkPayload = {
      BusinessShortCode: MPESA_CONFIG.shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Math.round(amount),
      PartyA: phoneNumber.replace(/^\+/, ''),
      PartyB: MPESA_CONFIG.shortcode,
      PhoneNumber: phoneNumber.replace(/^\+/, ''),
      CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: `ORDER-${orderId}`,
      TransactionDesc: `Payment for order ${orderId}`
    };

    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkPayload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const { CheckoutRequestID, MerchantRequestID } = response.data;

    const transaction = await TransactionModel.create({
      orderId: orderId,
      amount: amount,
      paymentMethod: 'MPESA',
      paymentReference: CheckoutRequestID,
      mpesaPhone: phoneNumber
    });

    res.json({
      message: 'STK push initiated successfully',
      checkoutRequestID: CheckoutRequestID,
      merchantRequestID: MerchantRequestID
    });

  } catch (error: any) {
    console.error('MPESA STK Push Error:', error.response?.data || error.message);
    next(error);
  }
};

export const mpesaCallback = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { Body } = req.body;
    
    if (Body.stkCallback && Body.stkCallback.CallbackMetadata) {
      const { CheckoutRequestID, ResultCode, ResultDesc } = Body.stkCallback;
      const metadata = Body.stkCallback.CallbackMetadata.Item;

      let transactionId = '';
      let receiptNumber = '';
      let phoneNumber = '';

      metadata.forEach((item: any) => {
        if (item.Name === 'MpesaReceiptNumber') receiptNumber = item.Value;
        if (item.Name === 'TransactionID') transactionId = item.Value;
        if (item.Name === 'PhoneNumber') phoneNumber = item.Value;
      });

      const transaction = await TransactionModel.findByTransactionId(CheckoutRequestID);

      if (transaction) {
        const updatedTransaction = await TransactionModel.update(transaction.id, {
          status: ResultCode === 0 ? 'COMPLETED' : 'FAILED',
          errorMessage: ResultDesc,
          mpesaReceipt: receiptNumber
        });
        
        if (ResultCode === 0) {
          const order = await OrderModel.findById(transaction.orderId);
          if (order) {
            await OrderModel.update(order.id, {
              status: OrderStatus.CONFIRMED
            });
          }
        }
      }
    }

    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('MPESA Callback Error:', error);
    res.json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
};

export const checkTransactionStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { checkoutRequestID } = req.params;

    const transaction = await TransactionModel.findByTransactionId(checkoutRequestID);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    
    res.json({
      status: transaction.status,
      transaction
    });
  } catch (error) {
    next(error);
  }
};

export const getUserTransactions = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    // Remove user query since Transaction model doesn't have user field
    // We'll filter by orderId instead if needed

    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const transactions = await TransactionModel.findAll(query)
      .then(transactions => transactions.slice(skip, skip + Number(limit)));

    const allTransactions = await TransactionModel.findAll(query);
    const total = allTransactions.length;

    res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};
