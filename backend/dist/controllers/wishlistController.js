"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moveWishlistToCart = exports.clearWishlist = exports.checkWishlistStatus = exports.removeFromWishlist = exports.addToWishlist = exports.getWishlist = void 0;
const prisma_1 = require("../config/prisma");
const getWishlist = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { page = 1, limit = 12 } = req.query;
        // First find the user's wishlist
        const wishlist = await prisma_1.prisma.wishlist.findUnique({
            where: { userId }
        });
        if (!wishlist) {
            return res.json({
                wishlistItems: [],
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: 0,
                    pages: 0
                }
            });
        }
        const wishlistItems = await prisma_1.prisma.wishlistItem.findMany({
            where: { wishlistId: wishlist.id },
            include: {
                product: {
                    include: {
                        reviews: {
                            select: {
                                rating: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (Number(page) - 1) * Number(limit),
            take: Number(limit)
        });
        const total = await prisma_1.prisma.wishlistItem.count({ where: { wishlistId: wishlist.id } });
        res.json({
            wishlistItems,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                pages: Math.ceil(total / Number(limit))
            }
        });
    }
    catch (error) {
        console.error('Get wishlist error:', error);
        res.status(500).json({ message: 'Server error while fetching wishlist' });
    }
};
exports.getWishlist = getWishlist;
const addToWishlist = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { productId } = req.body;
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: productId }
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // Find or create user's wishlist
        let wishlist = await prisma_1.prisma.wishlist.findUnique({
            where: { userId }
        });
        if (!wishlist) {
            wishlist = await prisma_1.prisma.wishlist.create({
                data: {
                    userId,
                    name: 'Default'
                }
            });
        }
        // Check if already in wishlist
        const existingItem = await prisma_1.prisma.wishlistItem.findFirst({
            where: {
                wishlistId: wishlist.id,
                productId
            }
        });
        if (existingItem) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }
        const wishlistItem = await prisma_1.prisma.wishlistItem.create({
            data: {
                wishlistId: wishlist.id,
                productId,
                quantity: 1
            },
            include: {
                product: true
            }
        });
        res.status(201).json({ wishlistItem });
    }
    catch (error) {
        console.error('Add to wishlist error:', error);
        res.status(500).json({ message: 'Server error while adding to wishlist' });
    }
};
exports.addToWishlist = addToWishlist;
const removeFromWishlist = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { productId } = req.params;
        // Find the user's wishlist
        const wishlist = await prisma_1.prisma.wishlist.findUnique({
            where: { userId }
        });
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }
        const wishlistItem = await prisma_1.prisma.wishlistItem.findFirst({
            where: {
                wishlistId: wishlist.id,
                productId
            }
        });
        if (!wishlistItem) {
            return res.status(404).json({ message: 'Item not found in wishlist' });
        }
        await prisma_1.prisma.wishlistItem.delete({
            where: { id: wishlistItem.id }
        });
        res.json({ message: 'Item removed from wishlist' });
    }
    catch (error) {
        console.error('Remove from wishlist error:', error);
        res.status(500).json({ message: 'Server error while removing from wishlist' });
    }
};
exports.removeFromWishlist = removeFromWishlist;
const checkWishlistStatus = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { productIds } = req.body;
        // Find the user's wishlist
        const wishlist = await prisma_1.prisma.wishlist.findUnique({
            where: { userId }
        });
        if (!wishlist) {
            const wishlistStatus = productIds.map((productId) => ({
                productId,
                inWishlist: false
            }));
            return res.json({ wishlistStatus });
        }
        const wishlistItems = await prisma_1.prisma.wishlistItem.findMany({
            where: {
                wishlistId: wishlist.id,
                productId: {
                    in: productIds
                }
            }
        });
        const wishlistStatus = productIds.map((productId) => ({
            productId,
            inWishlist: wishlistItems.some(item => item.productId === productId)
        }));
        res.json({ wishlistStatus });
    }
    catch (error) {
        console.error('Check wishlist status error:', error);
        res.status(500).json({ message: 'Server error while checking wishlist status' });
    }
};
exports.checkWishlistStatus = checkWishlistStatus;
const clearWishlist = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        // Find the user's wishlist
        const wishlist = await prisma_1.prisma.wishlist.findUnique({
            where: { userId }
        });
        if (wishlist) {
            await prisma_1.prisma.wishlistItem.deleteMany({
                where: { wishlistId: wishlist.id }
            });
        }
        res.json({ message: 'Wishlist cleared successfully' });
    }
    catch (error) {
        console.error('Clear wishlist error:', error);
        res.status(500).json({ message: 'Server error while clearing wishlist' });
    }
};
exports.clearWishlist = clearWishlist;
const moveWishlistToCart = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { productIds } = req.body;
        // Find the user's wishlist
        const wishlist = await prisma_1.prisma.wishlist.findUnique({
            where: { userId }
        });
        if (!wishlist) {
            return res.status(404).json({ message: 'Wishlist not found' });
        }
        // Get wishlist items
        const wishlistItems = await prisma_1.prisma.wishlistItem.findMany({
            where: {
                wishlistId: wishlist.id,
                productId: {
                    in: productIds
                }
            },
            include: {
                product: true
            }
        });
        // Find or create user's cart
        let cart = await prisma_1.prisma.cart.findUnique({
            where: { userId }
        });
        if (!cart) {
            cart = await prisma_1.prisma.cart.create({
                data: {
                    userId,
                },
            });
        }
        // Add to cart (this would integrate with your existing cart system)
        const cartOperations = wishlistItems.map(async (item) => {
            // Check if already in cart
            const existingCartItem = await prisma_1.prisma.cartItem.findFirst({
                where: {
                    cartId: cart.id,
                    productId: item.productId
                }
            });
            if (existingCartItem) {
                // Update quantity
                return prisma_1.prisma.cartItem.update({
                    where: { id: existingCartItem.id },
                    data: {
                        quantity: existingCartItem.quantity + 1
                    }
                });
            }
            else {
                // Create new cart item
                return prisma_1.prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: item.productId,
                        quantity: 1
                    }
                });
            }
        });
        await Promise.all(cartOperations);
        // Remove from wishlist
        await prisma_1.prisma.wishlistItem.deleteMany({
            where: {
                wishlistId: wishlist.id,
                productId: {
                    in: productIds
                }
            }
        });
        res.json({
            message: 'Items moved to cart successfully',
            itemsMoved: wishlistItems.length
        });
    }
    catch (error) {
        console.error('Move wishlist to cart error:', error);
        res.status(500).json({ message: 'Server error while moving items to cart' });
    }
};
exports.moveWishlistToCart = moveWishlistToCart;
//# sourceMappingURL=wishlistController.js.map