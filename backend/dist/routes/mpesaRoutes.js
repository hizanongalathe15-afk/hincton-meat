"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mpesaController_1 = require("../controllers/mpesaController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/stk-push', auth_1.authenticate, mpesaController_1.initiateSTKPush);
router.post('/callback', mpesaController_1.mpesaCallback);
router.get('/transaction/:checkoutRequestID', auth_1.authenticate, mpesaController_1.checkTransactionStatus);
router.get('/transactions', auth_1.authenticate, mpesaController_1.getUserTransactions);
exports.default = router;
//# sourceMappingURL=mpesaRoutes.js.map