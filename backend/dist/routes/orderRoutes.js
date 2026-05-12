"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, (0, validation_1.validateBody)(validation_1.orderSchema), orderController_1.createOrder);
router.get('/', auth_1.authenticate, orderController_1.getOrders);
router.get('/stats', auth_1.authenticate, (0, auth_1.authorize)('admin'), orderController_1.getOrderStats);
router.get('/:id', auth_1.authenticate, orderController_1.getOrderById);
router.put('/:id/status', auth_1.authenticate, (0, auth_1.authorize)('admin'), orderController_1.updateOrderStatus);
router.patch('/:id/cancel', auth_1.authenticate, orderController_1.cancelOrder);
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map