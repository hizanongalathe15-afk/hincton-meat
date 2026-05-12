"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserTransactions = exports.checkTransactionStatus = exports.mpesaCallback = exports.initiateSTKPush = void 0;
const axios_1 = __importDefault(require("axios"));
const mpesaConfig_1 = require("../config/mpesaConfig");
const Transaction_1 = require("../models/Transaction");
const Order_1 = require("../models/Order");
const client_1 = require("@prisma/client");
const initiateSTKPush = async (req, res, next) => {
    try {
        const { phoneNumber, amount, orderId } = req.body;
        if (!phoneNumber || !amount || !orderId) {
            return res.status(400).json({ message: 'Phone number, amount, and order ID are required' });
        }
        const order = await Order_1.OrderModel.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (order.userId.toString() !== req.user.id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }
        const accessToken = await (0, mpesaConfig_1.getAccessToken)();
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, -4);
        const password = Buffer.from(`${mpesaConfig_1.MPESA_CONFIG.shortcode}${mpesaConfig_1.MPESA_CONFIG.passkey}${timestamp}`).toString('base64');
        const stkPayload = {
            BusinessShortCode: mpesaConfig_1.MPESA_CONFIG.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: phoneNumber.replace(/^\+/, ''),
            PartyB: mpesaConfig_1.MPESA_CONFIG.shortcode,
            PhoneNumber: phoneNumber.replace(/^\+/, ''),
            CallBackURL: mpesaConfig_1.MPESA_CONFIG.callbackUrl,
            AccountReference: `ORDER-${orderId}`,
            TransactionDesc: `Payment for order ${orderId}`
        };
        const response = await axios_1.default.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', stkPayload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        const { CheckoutRequestID, MerchantRequestID } = response.data;
        const transaction = await Transaction_1.TransactionModel.create({
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
    }
    catch (error) {
        console.error('MPESA STK Push Error:', error.response?.data || error.message);
        next(error);
    }
};
exports.initiateSTKPush = initiateSTKPush;
const mpesaCallback = async (req, res, next) => {
    try {
        const { Body } = req.body;
        if (Body.stkCallback && Body.stkCallback.CallbackMetadata) {
            const { CheckoutRequestID, ResultCode, ResultDesc } = Body.stkCallback;
            const metadata = Body.stkCallback.CallbackMetadata.Item;
            let transactionId = '';
            let receiptNumber = '';
            let phoneNumber = '';
            metadata.forEach((item) => {
                if (item.Name === 'MpesaReceiptNumber')
                    receiptNumber = item.Value;
                if (item.Name === 'TransactionID')
                    transactionId = item.Value;
                if (item.Name === 'PhoneNumber')
                    phoneNumber = item.Value;
            });
            const transaction = await Transaction_1.TransactionModel.findByTransactionId(CheckoutRequestID);
            if (transaction) {
                const updatedTransaction = await Transaction_1.TransactionModel.update(transaction.id, {
                    status: ResultCode === 0 ? 'COMPLETED' : 'FAILED',
                    errorMessage: ResultDesc,
                    mpesaReceipt: receiptNumber
                });
                if (ResultCode === 0) {
                    const order = await Order_1.OrderModel.findById(transaction.orderId);
                    if (order) {
                        await Order_1.OrderModel.update(order.id, {
                            status: client_1.OrderStatus.CONFIRMED
                        });
                    }
                }
            }
        }
        res.json({ ResultCode: 0, ResultDesc: 'Success' });
    }
    catch (error) {
        console.error('MPESA Callback Error:', error);
        res.json({ ResultCode: 1, ResultDesc: 'Failed' });
    }
};
exports.mpesaCallback = mpesaCallback;
const checkTransactionStatus = async (req, res, next) => {
    try {
        const { checkoutRequestID } = req.params;
        const transaction = await Transaction_1.TransactionModel.findByTransactionId(checkoutRequestID);
        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        res.json({
            status: transaction.status,
            transaction
        });
    }
    catch (error) {
        next(error);
    }
};
exports.checkTransactionStatus = checkTransactionStatus;
const getUserTransactions = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        // Remove user query since Transaction model doesn't have user field
        // We'll filter by orderId instead if needed
        const skip = (Number(page) - 1) * Number(limit);
        const query = {};
        if (status) {
            query.status = status;
        }
        const transactions = await Transaction_1.TransactionModel.findAll(query)
            .then(transactions => transactions.slice(skip, skip + Number(limit)));
        const allTransactions = await Transaction_1.TransactionModel.findAll(query);
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
    }
    catch (error) {
        next(error);
    }
};
exports.getUserTransactions = getUserTransactions;
//# sourceMappingURL=mpesaController.js.map