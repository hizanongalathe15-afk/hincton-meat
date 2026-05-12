"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateHash = exports.formatPhoneNumber = exports.validatePhoneNumber = exports.generateTransactionId = void 0;
const crypto_1 = __importDefault(require("crypto"));
const generateTransactionId = () => {
    return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();
};
exports.generateTransactionId = generateTransactionId;
const validatePhoneNumber = (phone) => {
    const phoneRegex = /^\+?(254|0)?[7]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
};
exports.validatePhoneNumber = validatePhoneNumber;
const formatPhoneNumber = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254') && cleaned.length === 12) {
        return cleaned;
    }
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        return '254' + cleaned.substring(1);
    }
    if (cleaned.startsWith('7') && cleaned.length === 9) {
        return '254' + cleaned;
    }
    return cleaned;
};
exports.formatPhoneNumber = formatPhoneNumber;
const calculateHash = (data) => {
    return crypto_1.default.createHash('sha256').update(data).digest('hex');
};
exports.calculateHash = calculateHash;
//# sourceMappingURL=mpesaUtils.js.map