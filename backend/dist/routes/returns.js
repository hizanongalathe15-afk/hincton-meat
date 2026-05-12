"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = require("../config/prisma");
const zod_1 = require("zod");
const router = express_1.default.Router();
// Prisma model: ReturnRequest (no Return items nested)
// We'll implement a minimal, schema-aligned return request flow.
const createReturnSchema = zod_1.z.object({
    orderId: zod_1.z.string().min(1),
    orderItemId: zod_1.z.string().optional(),
    productId: zod_1.z.string().optional(),
    variantId: zod_1.z.string().optional(),
    reason: zod_1.z.string().optional(),
    reasonDetails: zod_1.z.string().optional(),
    quantity: zod_1.z.number().int().positive().default(1),
});
router.post('/', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        const data = createReturnSchema.parse(req.body);
        const existingOrderItem = data.orderItemId
            ? await prisma_1.prisma.orderItem.findUnique({ where: { id: data.orderItemId } })
            : null;
        if (data.orderId && !existingOrderItem) {
            // still allow without orderItemId
            const order = await prisma_1.prisma.order.findUnique({ where: { id: data.orderId } });
            if (!order)
                return res.status(404).json({ error: 'Order not found' });
        }
        // Generate unique return number with format: RET-YYYYMMDD-XXXX
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const returnRequest = await prisma_1.prisma.returnRequest.create({
            data: {
                orderId: data.orderId,
                orderItemId: data.orderItemId,
                userId,
                productId: data.productId,
                variantId: data.variantId,
                reason: data.reason,
                reasonDetails: data.reasonDetails,
                quantity: data.quantity,
                status: 'PENDING',
                returnNumber: `RET-${dateStr}-${randomSuffix}`,
            },
        });
        res.status(201).json({ message: 'Return request created', returnRequest });
    }
    catch (error) {
        console.error('Create return error:', error);
        res.status(500).json({ error: 'Failed to create return request' });
    }
});
router.get('/mine', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Invalid token' });
        const requests = await prisma_1.prisma.returnRequest.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ requests });
    }
    catch (error) {
        console.error('Get my returns error:', error);
        res.status(500).json({ error: 'Failed to get returns' });
    }
});
exports.default = router;
//# sourceMappingURL=returns.js.map