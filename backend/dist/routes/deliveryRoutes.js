"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const deliveryController_1 = require("../controllers/deliveryController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin'), deliveryController_1.createDelivery);
router.get('/', auth_1.authenticate, deliveryController_1.getDeliveries);
router.get('/:id', auth_1.authenticate, deliveryController_1.getDeliveryById);
router.put('/:id/status', auth_1.authenticate, (0, auth_1.authorize)('admin'), deliveryController_1.updateDeliveryStatus);
router.patch('/:id/location', auth_1.authenticate, (0, auth_1.authorize)('admin'), deliveryController_1.updateLocation);
router.patch('/:id/rating', auth_1.authenticate, deliveryController_1.addCustomerRating);
exports.default = router;
//# sourceMappingURL=deliveryRoutes.js.map