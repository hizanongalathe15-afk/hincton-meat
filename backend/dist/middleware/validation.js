"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderSchema = exports.productSchema = exports.userLoginSchema = exports.userRegistrationSchema = exports.validateBody = void 0;
const joi_1 = __importDefault(require("joi"));
const validateBody = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return res.status(400).json({ message: errorMessage });
        }
        next();
    };
};
exports.validateBody = validateBody;
exports.userRegistrationSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50).required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(8).required(),
    phone: joi_1.default.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    address: joi_1.default.object({
        street: joi_1.default.string().required(),
        city: joi_1.default.string().required(),
        state: joi_1.default.string().required(),
        zipCode: joi_1.default.string().required()
    }).optional()
});
exports.userLoginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required()
});
exports.productSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(100).required(),
    category: joi_1.default.string().valid('Beef', 'Chicken', 'Lamb', 'Goat', 'Pork', 'Turkey', 'Duck', 'Rabbit', 'Venison', 'Exotic').required(),
    subCategory: joi_1.default.string().min(1).required(),
    description: joi_1.default.string().min(10).max(1000).required(),
    price: joi_1.default.number().min(0).required(),
    originalPrice: joi_1.default.number().min(0).optional(),
    images: joi_1.default.array().items(joi_1.default.string().uri()).min(1).required(),
    weight: joi_1.default.object({
        min: joi_1.default.number().min(0).required(),
        max: joi_1.default.number().min(0).required(),
        unit: joi_1.default.string().valid('kg', 'g', 'lbs').default('kg')
    }).required(),
    inStock: joi_1.default.boolean().default(true),
    stockQuantity: joi_1.default.number().min(0).default(0),
    featured: joi_1.default.boolean().default(false),
    tags: joi_1.default.array().items(joi_1.default.string()).default([]),
    nutritionalInfo: joi_1.default.object({
        calories: joi_1.default.number().min(0),
        protein: joi_1.default.number().min(0),
        fat: joi_1.default.number().min(0),
        carbs: joi_1.default.number().min(0)
    }).optional(),
    storageInstructions: joi_1.default.string().required(),
    shelfLife: joi_1.default.string().required(),
    origin: joi_1.default.string().optional(),
    isHalal: joi_1.default.boolean().default(false),
    isOrganic: joi_1.default.boolean().default(false),
    discount: joi_1.default.object({
        percentage: joi_1.default.number().min(0).max(100).required(),
        validUntil: joi_1.default.date().required()
    }).optional()
});
exports.orderSchema = joi_1.default.object({
    items: joi_1.default.array().items(joi_1.default.object({
        product: joi_1.default.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
        quantity: joi_1.default.number().min(1).required(),
        weight: joi_1.default.number().min(0).required(),
        unit: joi_1.default.string().valid('kg', 'g', 'lbs').required()
    })).min(1).required(),
    deliveryAddress: joi_1.default.object({
        street: joi_1.default.string().required(),
        city: joi_1.default.string().required(),
        state: joi_1.default.string().required(),
        zipCode: joi_1.default.string().required()
    }).required(),
    paymentMethod: joi_1.default.string().valid('mpesa', 'cash', 'card').required(),
    specialInstructions: joi_1.default.string().optional(),
    orderNotes: joi_1.default.string().optional()
});
//# sourceMappingURL=validation.js.map