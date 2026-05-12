"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/register', (0, validation_1.validateBody)(validation_1.userRegistrationSchema), authController_1.register);
router.post('/login', (0, validation_1.validateBody)(validation_1.userLoginSchema), authController_1.login);
router.get('/profile', auth_1.authenticate, authController_1.getProfile);
router.put('/profile', auth_1.authenticate, authController_1.updateProfile);
router.put('/change-password', auth_1.authenticate, authController_1.changePassword);
exports.default = router;
//# sourceMappingURL=authRoutes.js.map