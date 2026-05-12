"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const meatShopMessages_1 = require("../messages/meatShopMessages");
const router = express_1.default.Router();
router.get('/', (_req, res) => {
    res.json({
        messages: meatShopMessages_1.meatShopMessages,
    });
});
router.get('/:category/:key', (req, res) => {
    const { category, key } = req.params;
    const categoryMessages = meatShopMessages_1.meatShopMessages[category];
    const message = categoryMessages?.[key];
    if (!message) {
        return res.status(404).json({ error: 'Message not found' });
    }
    res.json((0, meatShopMessages_1.resolveMessage)(message, req.query));
});
exports.default = router;
//# sourceMappingURL=messages.js.map