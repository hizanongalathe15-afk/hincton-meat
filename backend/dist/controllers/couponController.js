"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCouponStats = exports.applyCoupon = exports.validateCoupon = exports.deleteCoupon = exports.updateCoupon = exports.createCoupon = exports.getActiveCoupons = exports.getCouponByCode = exports.getCoupon = exports.getCoupons = void 0;
const models_1 = require("../models");
const middleware_1 = require("../middleware");
const middleware_2 = require("../middleware");
const validationSchemas_1 = require("../middleware/validationSchemas");
exports.getCoupons = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { page = 1, limit = 20, isActive, search } = req.query;
    const result = await models_1.CouponModel.findAll({
        page: Number(page),
        limit: Number(limit),
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        search: search
    });
    res.json({
        success: true,
        data: result.coupons,
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: result.total,
            pages: Math.ceil(result.total / Number(limit))
        }
    });
});
exports.getCoupon = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const coupon = await models_1.CouponModel.findById(id);
    if (!coupon) {
        throw new middleware_1.NotFoundError('Coupon', id);
    }
    res.json({
        success: true,
        data: coupon
    });
});
exports.getCouponByCode = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { code } = req.params;
    const coupon = await models_1.CouponModel.findByCode(code);
    if (!coupon) {
        throw new middleware_1.NotFoundError('Coupon', code);
    }
    res.json({
        success: true,
        data: coupon
    });
});
exports.getActiveCoupons = (0, middleware_1.asyncHandler)(async (req, res) => {
    const coupons = await models_1.CouponModel.getActiveCoupons();
    res.json({
        success: true,
        data: coupons
    });
});
exports.createCoupon = [
    (0, middleware_2.validateBody)(validationSchemas_1.couponCreateSchema),
    (0, middleware_1.asyncHandler)(async (req, res) => {
        const couponData = req.body;
        // Check if coupon with same code exists
        const existingCoupon = await models_1.CouponModel.findByCode(couponData.code);
        if (existingCoupon) {
            throw new middleware_1.ValidationError('Coupon with this code already exists');
        }
        const coupon = await models_1.CouponModel.create(couponData);
        res.status(201).json({
            success: true,
            data: coupon,
            message: 'Coupon created successfully'
        });
    })
];
exports.updateCoupon = [
    (0, middleware_2.validateBody)(validationSchemas_1.couponUpdateSchema),
    (0, middleware_1.asyncHandler)(async (req, res) => {
        const { id } = req.params;
        const updateData = req.body;
        const coupon = await models_1.CouponModel.findById(id);
        if (!coupon) {
            throw new middleware_1.NotFoundError('Coupon', id);
        }
        // If code is being updated, check for uniqueness
        if (updateData.code && updateData.code !== coupon.code) {
            const codeExists = await models_1.CouponModel.findByCode(updateData.code);
            if (codeExists) {
                throw new middleware_1.ValidationError('Coupon with this code already exists');
            }
        }
        const updatedCoupon = await models_1.CouponModel.update(id, updateData);
        res.json({
            success: true,
            data: updatedCoupon,
            message: 'Coupon updated successfully'
        });
    })
];
exports.deleteCoupon = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const coupon = await models_1.CouponModel.findById(id);
    if (!coupon) {
        throw new middleware_1.NotFoundError('Coupon', id);
    }
    await models_1.CouponModel.delete(id);
    res.json({
        success: true,
        message: 'Coupon deleted successfully'
    });
});
exports.validateCoupon = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { code, userId, cartTotal } = req.body;
    if (!code) {
        throw new middleware_1.ValidationError('Coupon code is required');
    }
    const validation = await models_1.CouponModel.validateCoupon(code, userId, cartTotal ? Number(cartTotal) : undefined);
    res.json({
        success: true,
        data: validation
    });
});
exports.applyCoupon = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { code, userId, cartTotal } = req.body;
    if (!code) {
        throw new middleware_1.ValidationError('Coupon code is required');
    }
    const validation = await models_1.CouponModel.validateCoupon(code, userId, cartTotal ? Number(cartTotal) : undefined);
    if (!validation.valid) {
        throw new middleware_1.ValidationError(validation.error || 'Invalid coupon');
    }
    // Increment usage count
    if (validation.coupon) {
        await models_1.CouponModel.incrementUsage(validation.coupon.id);
    }
    res.json({
        success: true,
        data: {
            valid: true,
            coupon: validation.coupon,
            discount: calculateDiscount(validation.coupon, cartTotal ? Number(cartTotal) : 0)
        },
        message: 'Coupon applied successfully'
    });
});
exports.getCouponStats = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { startDate, endDate } = req.query;
    const stats = await models_1.CouponModel.getCouponStats({
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
    });
    res.json({
        success: true,
        data: stats
    });
});
function calculateDiscount(coupon, cartTotal) {
    if (coupon.discountType === 'percentage') {
        return cartTotal * (Number(coupon.discountValue) / 100);
    }
    else if (coupon.discountType === 'fixed') {
        return Number(coupon.discountValue);
    }
    return 0;
}
//# sourceMappingURL=couponController.js.map