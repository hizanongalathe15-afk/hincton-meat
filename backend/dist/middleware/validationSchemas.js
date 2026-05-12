"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginationSchema = exports.searchSchema = exports.paymentProcessSchema = exports.subscriptionUpdateSchema = exports.subscriptionCreateSchema = exports.couponUpdateSchema = exports.couponCreateSchema = exports.reviewUpdateSchema = exports.reviewCreateSchema = exports.categoryUpdateSchema = exports.categoryCreateSchema = exports.orderUpdateSchema = exports.orderCreateSchema = exports.productUpdateSchema = exports.productCreateSchema = exports.passwordChangeSchema = exports.userUpdateSchema = exports.userLoginSchema = exports.userRegistrationSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// User validation schemas
exports.userRegistrationSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50).required(),
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required(),
    phone: joi_1.default.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    address: joi_1.default.object({
        street: joi_1.default.string().min(5).max(100).required(),
        city: joi_1.default.string().min(2).max(50).required(),
        state: joi_1.default.string().min(2).max(50).required(),
        zipCode: joi_1.default.string().min(3).max(20).required(),
        country: joi_1.default.string().min(2).max(50).required()
    }).optional()
});
exports.userLoginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().required()
});
exports.userUpdateSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50).optional(),
    phone: joi_1.default.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
    address: joi_1.default.object({
        street: joi_1.default.string().min(5).max(100).optional(),
        city: joi_1.default.string().min(2).max(50).optional(),
        state: joi_1.default.string().min(2).max(50).optional(),
        zipCode: joi_1.default.string().min(3).max(20).optional(),
        country: joi_1.default.string().min(2).max(50).optional()
    }).optional()
});
exports.passwordChangeSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required(),
    newPassword: joi_1.default.string()
        .min(8)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .required()
});
// Product validation schemas
exports.productCreateSchema = joi_1.default.object({
    name: joi_1.default.string().min(3).max(200).required(),
    description: joi_1.default.string().max(2000).optional(),
    price: joi_1.default.number().min(0).required(),
    sku: joi_1.default.string().min(3).max(100).required(),
    categoryId: joi_1.default.string().optional(),
    stockQuantity: joi_1.default.number().min(0).default(0),
    lowStockThreshold: joi_1.default.number().min(0).default(5),
    weight: joi_1.default.number().min(0).optional(),
    length: joi_1.default.number().min(0).optional(),
    width: joi_1.default.number().min(0).optional(),
    height: joi_1.default.number().min(0).optional(),
    brand: joi_1.default.string().max(100).optional(),
    isPublished: joi_1.default.boolean().default(false),
    isFeatured: joi_1.default.boolean().default(false),
    tags: joi_1.default.array().items(joi_1.default.string().max(50)).optional()
});
exports.productUpdateSchema = joi_1.default.object({
    name: joi_1.default.string().min(3).max(200).optional(),
    description: joi_1.default.string().max(2000).optional(),
    price: joi_1.default.number().min(0).optional(),
    sku: joi_1.default.string().min(3).max(100).optional(),
    categoryId: joi_1.default.string().optional(),
    stockQuantity: joi_1.default.number().min(0).optional(),
    lowStockThreshold: joi_1.default.number().min(0).optional(),
    weight: joi_1.default.number().min(0).optional(),
    length: joi_1.default.number().min(0).optional(),
    width: joi_1.default.number().min(0).optional(),
    height: joi_1.default.number().min(0).optional(),
    brand: joi_1.default.string().max(100).optional(),
    isPublished: joi_1.default.boolean().optional(),
    isFeatured: joi_1.default.boolean().optional(),
    tags: joi_1.default.array().items(joi_1.default.string().max(50)).optional()
});
// Order validation schemas
exports.orderCreateSchema = joi_1.default.object({
    items: joi_1.default.array().items(joi_1.default.object({
        productId: joi_1.default.string().required(),
        variantId: joi_1.default.string().optional(),
        quantity: joi_1.default.number().min(1).required()
    })).min(1).required(),
    shippingAddress: joi_1.default.object({
        street: joi_1.default.string().min(5).max(100).required(),
        city: joi_1.default.string().min(2).max(50).required(),
        state: joi_1.default.string().min(2).max(50).required(),
        zipCode: joi_1.default.string().min(3).max(20).required(),
        country: joi_1.default.string().min(2).max(50).required()
    }).required(),
    billingAddress: joi_1.default.object({
        street: joi_1.default.string().min(5).max(100).optional(),
        city: joi_1.default.string().min(2).max(50).optional(),
        state: joi_1.default.string().min(2).max(50).optional(),
        zipCode: joi_1.default.string().min(3).max(20).optional(),
        country: joi_1.default.string().min(2).max(50).optional()
    }).optional(),
    paymentMethod: joi_1.default.string().valid('mpesa', 'card', 'paypal', 'cash').required(),
    couponCode: joi_1.default.string().max(20).optional()
});
exports.orderUpdateSchema = joi_1.default.object({
    status: joi_1.default.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
    paymentStatus: joi_1.default.string().valid('unpaid', 'paid', 'failed', 'refunded').optional(),
    deliveryStatus: joi_1.default.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
    trackingNumber: joi_1.default.string().max(100).optional(),
    notes: joi_1.default.string().max(1000).optional()
});
// Category validation schemas
exports.categoryCreateSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50).required(),
    slug: joi_1.default.string().min(2).max(100).required(),
    description: joi_1.default.string().max(1000).optional(),
    image: joi_1.default.string().uri().optional(),
    icon: joi_1.default.string().uri().optional(),
    parentId: joi_1.default.string().optional(),
    sortOrder: joi_1.default.number().min(0).default(0),
    isActive: joi_1.default.boolean().default(true)
});
exports.categoryUpdateSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50).optional(),
    slug: joi_1.default.string().min(2).max(100).optional(),
    description: joi_1.default.string().max(1000).optional(),
    image: joi_1.default.string().uri().optional(),
    icon: joi_1.default.string().uri().optional(),
    parentId: joi_1.default.string().optional(),
    sortOrder: joi_1.default.number().min(0).optional(),
    isActive: joi_1.default.boolean().optional()
});
// Review validation schemas
exports.reviewCreateSchema = joi_1.default.object({
    productId: joi_1.default.string().required(),
    rating: joi_1.default.number().min(1).max(5).required(),
    title: joi_1.default.string().min(3).max(200).required(),
    comment: joi_1.default.string().min(10).max(2000).required(),
    orderId: joi_1.default.string().optional()
});
exports.reviewUpdateSchema = joi_1.default.object({
    rating: joi_1.default.number().min(1).max(5).optional(),
    title: joi_1.default.string().min(3).max(200).optional(),
    comment: joi_1.default.string().min(10).max(2000).optional()
});
// Coupon validation schemas
exports.couponCreateSchema = joi_1.default.object({
    code: joi_1.default.string().min(3).max(20).required().uppercase(),
    description: joi_1.default.string().max(500).optional(),
    discountType: joi_1.default.string().valid('percentage', 'fixed').required(),
    discountValue: joi_1.default.number().min(0).required(),
    minimumSpend: joi_1.default.number().min(0).optional(),
    maximumDiscount: joi_1.default.number().min(0).optional(),
    usageLimit: joi_1.default.number().min(1).optional(),
    usageLimitPerUser: joi_1.default.number().min(1).default(1),
    validFrom: joi_1.default.date().optional(),
    validUntil: joi_1.default.date().optional(),
    isActive: joi_1.default.boolean().default(true),
    stackable: joi_1.default.boolean().default(false),
    firstOrderOnly: joi_1.default.boolean().default(false)
});
exports.couponUpdateSchema = joi_1.default.object({
    description: joi_1.default.string().max(500).optional(),
    discountType: joi_1.default.string().valid('percentage', 'fixed').optional(),
    discountValue: joi_1.default.number().min(0).optional(),
    minimumSpend: joi_1.default.number().min(0).optional(),
    maximumDiscount: joi_1.default.number().min(0).optional(),
    usageLimit: joi_1.default.number().min(1).optional(),
    usageLimitPerUser: joi_1.default.number().min(1).optional(),
    validFrom: joi_1.default.date().optional(),
    validUntil: joi_1.default.date().optional(),
    isActive: joi_1.default.boolean().optional(),
    stackable: joi_1.default.boolean().optional(),
    firstOrderOnly: joi_1.default.boolean().optional()
});
// Subscription validation schemas
exports.subscriptionCreateSchema = joi_1.default.object({
    planId: joi_1.default.string().optional(),
    plan: joi_1.default.string().required(),
    deliveryFrequency: joi_1.default.string().valid('weekly', 'biweekly', 'monthly').required(),
    deliveryAddress: joi_1.default.string().min(10).max(500).required(),
    deliveryInstructions: joi_1.default.string().max(500).optional(),
    autoRenew: joi_1.default.boolean().default(true)
});
exports.subscriptionUpdateSchema = joi_1.default.object({
    planId: joi_1.default.string().optional(),
    deliveryFrequency: joi_1.default.string().valid('weekly', 'biweekly', 'monthly').optional(),
    deliveryAddress: joi_1.default.string().min(10).max(500).optional(),
    deliveryInstructions: joi_1.default.string().max(500).optional(),
    autoRenew: joi_1.default.boolean().optional(),
    status: joi_1.default.string().valid('active', 'paused', 'cancelled').optional()
});
// Payment validation schemas
exports.paymentProcessSchema = joi_1.default.object({
    orderId: joi_1.default.string().required(),
    paymentMethod: joi_1.default.string().valid('mpesa', 'card', 'paypal').required(),
    amount: joi_1.default.number().min(0).required(),
    currency: joi_1.default.string().valid('USD', 'KES', 'EUR', 'GBP').default('USD'),
    paymentDetails: joi_1.default.object().optional()
});
// Search and filter schemas
exports.searchSchema = joi_1.default.object({
    query: joi_1.default.string().min(2).max(100).optional(),
    category: joi_1.default.string().optional(),
    minPrice: joi_1.default.number().min(0).optional(),
    maxPrice: joi_1.default.number().min(0).optional(),
    brand: joi_1.default.string().optional(),
    sortBy: joi_1.default.string().valid('name', 'price', 'createdAt', 'rating', 'sales').default('createdAt'),
    sortOrder: joi_1.default.string().valid('asc', 'desc').default('desc'),
    page: joi_1.default.number().min(1).default(1),
    limit: joi_1.default.number().min(1).max(100).default(20)
});
// Pagination schema
exports.paginationSchema = joi_1.default.object({
    page: joi_1.default.number().min(1).default(1),
    limit: joi_1.default.number().min(1).max(100).default(20)
});
//# sourceMappingURL=validationSchemas.js.map