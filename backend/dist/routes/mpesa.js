"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const zod_1 = require("zod");
const axios_1 = __importDefault(require("axios"));
const meatShopMessages_1 = require("../messages/meatShopMessages");
const router = express_1.default.Router();
const apiMessage = (message, values) => {
    const resolved = (0, meatShopMessages_1.resolveMessage)(message, values);
    return { ...resolved, error: resolved.message };
};
// Prisma model is Payment (not mpesaTransaction)
// We'll store mpesa details in Payment.
const initiatePaymentSchema = zod_1.z.object({
    phoneNumber: zod_1.z.string().min(8),
    amount: zod_1.z.number().positive(),
    orderId: zod_1.z.string().min(1),
    accountReference: zod_1.z.string().optional(),
});
const MPESA_CONFIG = {
    consumerKey: process.env.MPESA_CONSUMER_KEY || 'your_consumer_key',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'your_consumer_secret',
    shortcode: process.env.MPESA_SHORTCODE || '174379',
    passkey: process.env.MPESA_PASSKEY || 'your_passkey',
    callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://your-domain.com/api/mpesa/callback',
    environment: process.env.MPESA_ENV || 'sandbox',
};
async function getMpesaToken() {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
    const url = MPESA_CONFIG.environment === 'production'
        ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
        : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
    const response = await axios_1.default.get(url, {
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/json',
        },
    });
    return response.data.access_token;
}
const getGuestSessionId = (req) => {
    const value = req.header('X-Guest-Session-Id');
    return typeof value === 'string' && value.trim().length >= 12 ? value.trim() : null;
};
const normalizeMpesaPhone = (phone) => {
    const digits = phone.replace(/\D/g, '');
    if (/^0[17]\d{8}$/.test(digits))
        return `254${digits.slice(1)}`;
    if (/^254[17]\d{8}$/.test(digits))
        return digits;
    if (/^[17]\d{8}$/.test(digits))
        return `254${digits}`;
    return null;
};
const initiateMpesaPayment = async (req, res) => {
    try {
        const { phoneNumber, amount, orderId, accountReference } = initiatePaymentSchema.parse(req.body);
        const normalizedPhone = normalizeMpesaPhone(phoneNumber);
        if (!normalizedPhone) {
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.payment.invalidMpesaPhone));
        }
        const userId = req.user?.id;
        const guestSessionId = userId ? null : getGuestSessionId(req);
        if (!userId && !guestSessionId) {
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.system.sessionExpired));
        }
        const order = await prisma_1.prisma.order.findFirst({
            where: {
                id: orderId,
                deletedAt: null,
                ...(userId ? { userId } : guestSessionId ? { guestSessionId } : {}),
            },
            include: { payments: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        if (!order)
            return res.status(404).json(apiMessage(meatShopMessages_1.meatShopMessages.order.failedAttempt));
        if (Math.round(Number(order.totalAmount)) !== Math.round(amount)) {
            return res.status(400).json(apiMessage(meatShopMessages_1.meatShopMessages.payment.transactionLimit));
        }
        const existingPayment = order.payments[0];
        const payment = existingPayment
            ? await prisma_1.prisma.payment.update({
                where: { id: existingPayment.id },
                data: {
                    amount: amount,
                    currency: 'KES',
                    paymentMethod: 'MPESA',
                    paymentReference: accountReference || order.orderNumber,
                    status: 'PENDING',
                    mpesaPhone: normalizedPhone,
                },
            })
            : await prisma_1.prisma.payment.create({
                data: {
                    orderId,
                    userId,
                    amount: amount,
                    currency: 'KES',
                    paymentMethod: 'MPESA',
                    paymentReference: accountReference || order.orderNumber,
                    status: 'PENDING',
                    mpesaPhone: normalizedPhone,
                },
            });
        // If sandbox keys are not configured, return early (still API-valid)
        if (MPESA_CONFIG.consumerKey === 'your_consumer_key') {
            return res.json({
                ...(0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.payment.stkSent, { phone: phoneNumber }),
                checkoutRequestID: payment.id,
                payment: { id: payment.id, status: payment.status, paymentReference: payment.paymentReference },
            });
        }
        const token = await getMpesaToken();
        const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        const password = Buffer.from(`${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');
        const stkRequest = {
            BusinessShortCode: MPESA_CONFIG.shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Math.round(amount),
            PartyA: normalizedPhone,
            PartyB: MPESA_CONFIG.shortcode,
            PhoneNumber: normalizedPhone,
            CallBackURL: MPESA_CONFIG.callbackUrl,
            AccountReference: accountReference || `ORDER-${orderId}`,
            TransactionDesc: `Payment for order ${orderId}`,
            Remark: 'Hincton Meat Products',
        };
        const response = await axios_1.default.post(MPESA_CONFIG.environment === 'production'
            ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
            : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', stkRequest, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        const checkoutRequestID = response.data?.CheckoutRequestID;
        if (checkoutRequestID) {
            await prisma_1.prisma.payment.update({
                where: { id: payment.id },
                data: { mpesaReceipt: checkoutRequestID },
            });
        }
        res.json({
            ...(0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.payment.stkSent, { phone: phoneNumber }),
            checkoutRequestID,
            merchantRequestID: response.data?.MerchantRequestID,
            payment: { id: payment.id, status: payment.status, mpesaResponse: response.data },
        });
    }
    catch (error) {
        console.error('M-PESA initiate error:', error);
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.payment.mpesaUnavailable));
    }
};
router.post('/initiate', initiateMpesaPayment);
router.post('/stk-push', initiateMpesaPayment);
router.post('/callback', async (req, res) => {
    try {
        const body = req.body;
        const stkCallback = body?.Body?.stkCallback;
        const checkoutRequestId = stkCallback?.CheckoutRequestID;
        const resultCode = stkCallback?.ResultCode;
        const resultDesc = stkCallback?.ResultDesc;
        // Try match by paymentReference/accountReference if available, else skip order update
        const payment = checkoutRequestId
            ? await prisma_1.prisma.payment.findFirst({ where: { mpesaReceipt: checkoutRequestId } })
            : await prisma_1.prisma.payment.findFirst({ where: { status: 'PENDING' } });
        if (!payment)
            return res.status(404).json(apiMessage(meatShopMessages_1.meatShopMessages.payment.mpesaTimeout));
        await prisma_1.prisma.payment.update({
            where: { id: payment.id },
            data: {
                status: resultCode === 0 ? 'PAID' : 'FAILED',
                mpesaReceipt: checkoutRequestId,
                mpesaTransactionDate: new Date(),
                completedAt: resultCode === 0 ? new Date() : null,
            },
        });
        if (resultCode === 0) {
            await prisma_1.prisma.order.update({
                where: { id: payment.orderId },
                data: { paymentStatus: 'PAID', status: 'CONFIRMED' },
            });
        }
        res.json({ ResultCode: 0, ResultDesc: (0, meatShopMessages_1.resolveMessage)(meatShopMessages_1.meatShopMessages.payment.paymentSuccessful).message });
    }
    catch (error) {
        console.error('M-PESA callback error:', error);
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.payment.mpesaUnavailable));
    }
});
router.get('/transaction/:checkoutRequestID', async (req, res) => {
    try {
        const { checkoutRequestID } = req.params;
        const payment = await prisma_1.prisma.payment.findFirst({
            where: {
                OR: [
                    { id: checkoutRequestID },
                    { mpesaReceipt: checkoutRequestID },
                ],
            },
        });
        if (!payment)
            return res.status(404).json(apiMessage(meatShopMessages_1.meatShopMessages.payment.mpesaTimeout));
        const status = payment.status === 'PAID' ? 'COMPLETED' : payment.status;
        res.json({
            ...(0, meatShopMessages_1.resolveMessage)(status === 'COMPLETED' ? meatShopMessages_1.meatShopMessages.payment.paymentSuccessful : meatShopMessages_1.meatShopMessages.payment.waitingConfirmation),
            status,
            transaction: payment,
        });
    }
    catch (error) {
        console.error('M-PESA transaction status error:', error);
        res.status(500).json(apiMessage(meatShopMessages_1.meatShopMessages.payment.mpesaUnavailable));
    }
});
exports.default = router;
//# sourceMappingURL=mpesa.js.map