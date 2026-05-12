"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCartSummary = exports.updateShippingInfo = exports.removeCoupon = exports.applyCoupon = exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const models_1 = require("../models");
const middleware_1 = require("../middleware");
exports.getCart = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-guest-session-id'];
    let cart;
    if (userId) {
        cart = await models_1.CartModel.findByUserId(userId);
    }
    else if (sessionId) {
        cart = await models_1.CartModel.findBySessionId(sessionId);
    }
    else {
        cart = null;
    }
    res.json({
        success: true,
        data: cart
    });
});
exports.addToCart = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-guest-session-id'];
    const { productId, variantId, quantity } = req.body;
    if (!productId || !quantity) {
        throw new middleware_1.ValidationError('Product ID and quantity are required');
    }
    if (quantity < 1) {
        throw new middleware_1.ValidationError('Quantity must be at least 1');
    }
    let cart;
    if (userId) {
        cart = await models_1.CartModel.findByUserId(userId);
    }
    else if (sessionId) {
        cart = await models_1.CartModel.findBySessionId(sessionId);
    }
    if (!cart) {
        // Create new cart
        const cartData = {
            items: [{
                    productId,
                    variantId,
                    quantity: Number(quantity)
                }]
        };
        if (userId) {
            cartData.userId = userId;
        }
        else {
            cartData.sessionId = sessionId;
        }
        cart = await models_1.CartModel.create(cartData);
    }
    else {
        // Add item to existing cart
        const updatedCart = await models_1.CartModel.addItem(cart.id, {
            productId,
            variantId,
            quantity: Number(quantity)
        });
        cart = updatedCart;
    }
    res.status(201).json({
        success: true,
        data: cart,
        message: 'Item added to cart successfully'
    });
});
exports.updateCartItem = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-guest-session-id'];
    const { itemId } = req.params;
    const { quantity } = req.body;
    if (!quantity || quantity < 1) {
        throw new middleware_1.ValidationError('Valid quantity is required');
    }
    let cart;
    if (userId) {
        cart = await models_1.CartModel.findByUserId(userId);
    }
    else if (sessionId) {
        cart = await models_1.CartModel.findBySessionId(sessionId);
    }
    if (!cart) {
        throw new middleware_1.NotFoundError('Cart');
    }
    const updatedCart = await models_1.CartModel.updateItem(itemId, {
        quantity: Number(quantity)
    });
    res.json({
        success: true,
        data: updatedCart,
        message: 'Cart item updated successfully'
    });
});
exports.removeFromCart = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { itemId } = req.params;
    const updatedCart = await models_1.CartModel.removeItem(itemId);
    res.json({
        success: true,
        data: updatedCart,
        message: 'Item removed from cart successfully'
    });
});
exports.clearCart = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-guest-session-id'];
    let cart;
    if (userId) {
        cart = await models_1.CartModel.findByUserId(userId);
    }
    else if (sessionId) {
        cart = await models_1.CartModel.findBySessionId(sessionId);
    }
    if (!cart) {
        throw new middleware_1.NotFoundError('Cart');
    }
    await models_1.CartModel.clearCart(cart.id);
    res.json({
        success: true,
        message: 'Cart cleared successfully'
    });
});
exports.applyCoupon = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-guest-session-id'];
    const { couponCode } = req.body;
    if (!couponCode) {
        throw new middleware_1.ValidationError('Coupon code is required');
    }
    let cart;
    if (userId) {
        cart = await models_1.CartModel.findByUserId(userId);
    }
    else if (sessionId) {
        cart = await models_1.CartModel.findBySessionId(sessionId);
    }
    if (!cart) {
        throw new middleware_1.NotFoundError('Cart');
    }
    const updatedCart = await models_1.CartModel.applyCoupon(cart.id, couponCode);
    res.json({
        success: true,
        data: updatedCart,
        message: 'Coupon applied to cart successfully'
    });
});
exports.removeCoupon = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-guest-session-id'];
    let cart;
    if (userId) {
        cart = await models_1.CartModel.findByUserId(userId);
    }
    else if (sessionId) {
        cart = await models_1.CartModel.findBySessionId(sessionId);
    }
    if (!cart) {
        throw new middleware_1.NotFoundError('Cart');
    }
    const updatedCart = await models_1.CartModel.removeCoupon(cart.id);
    res.json({
        success: true,
        data: updatedCart,
        message: 'Coupon removed from cart successfully'
    });
});
exports.updateShippingInfo = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-guest-session-id'];
    const { shippingAddress, shippingMethod } = req.body;
    let cart;
    if (userId) {
        cart = await models_1.CartModel.findByUserId(userId);
    }
    else if (sessionId) {
        cart = await models_1.CartModel.findBySessionId(sessionId);
    }
    if (!cart) {
        throw new middleware_1.NotFoundError('Cart');
    }
    const updatedCart = await models_1.CartModel.updateShippingInfo(cart.id, {
        shippingAddress,
        shippingMethod
    });
    res.json({
        success: true,
        data: updatedCart,
        message: 'Shipping information updated successfully'
    });
});
exports.getCartSummary = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const sessionId = req.headers['x-guest-session-id'];
    let cart;
    if (userId) {
        cart = await models_1.CartModel.findByUserId(userId);
    }
    else if (sessionId) {
        cart = await models_1.CartModel.findBySessionId(sessionId);
    }
    if (!cart) {
        return res.json({
            success: true,
            data: {
                items: [],
                subtotal: 0,
                tax: 0,
                shipping: 0,
                discount: 0,
                total: 0
            }
        });
    }
    const summary = await models_1.CartModel.getCartSummary(cart.id);
    res.json({
        success: true,
        data: summary
    });
});
//# sourceMappingURL=cartController.js.map