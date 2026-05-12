"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markHelpful = exports.deleteReview = exports.updateReview = exports.createReview = exports.getProductsToReview = exports.getMyReviews = void 0;
const middleware_1 = require("../middleware");
const database_1 = require("../database");
exports.getMyReviews = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    const reviews = await database_1.prisma.review.findMany({
        where: {
            userId,
            deletedAt: null
        },
        include: {
            images: {
                select: {
                    url: true,
                    sortOrder: true
                },
                orderBy: { sortOrder: 'asc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
    const formattedReviews = reviews.map(review => ({
        id: review.id,
        productId: review.productId,
        productName: 'Product Name', // Would need separate query to get product name
        productImage: '/placeholder.jpg', // Would need separate query to get product image
        rating: review.rating,
        title: review.title || '',
        content: review.comment || '',
        images: review.images.map(img => img.url),
        helpful: review.helpfulCount,
        notHelpful: review.notHelpfulCount,
        isVerifiedPurchase: review.isVerifiedPurchase,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
        status: review.status.toLowerCase(),
        orderId: review.orderId,
        orderNumber: '', // Would need separate query to get order number
        sellerResponse: review.vendorReply,
        canEdit: true // User can edit their own reviews
    }));
    res.json({
        success: true,
        reviews: formattedReviews
    });
});
exports.getProductsToReview = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    // Get completed orders that haven't been reviewed yet
    const orders = await database_1.prisma.order.findMany({
        where: {
            userId,
            status: 'DELIVERED',
            deletedAt: null
        },
        orderBy: { createdAt: 'desc' }
    });
    // Get order items for these orders
    const orderItems = await database_1.prisma.orderItem.findMany({
        where: {
            orderId: {
                in: orders.map(order => order.id)
            }
        },
        include: {
            product: {
                select: {
                    id: true,
                    name: true,
                    productImages: {
                        where: { isPrimary: true },
                        take: 1,
                        select: { url: true }
                    }
                }
            }
        }
    });
    // Get existing reviews to exclude already reviewed products
    const existingReviews = await database_1.prisma.review.findMany({
        where: {
            userId,
            deletedAt: null
        },
        select: {
            productId: true
        }
    });
    const reviewedProductIds = new Set(existingReviews.map(r => r.productId));
    const productsToReview = [];
    for (const item of orderItems) {
        if (!reviewedProductIds.has(item.productId)) {
            const order = orders.find(o => o.id === item.orderId);
            productsToReview.push({
                id: item.product.id,
                name: item.product.name,
                image: item.product.productImages[0]?.url || '/placeholder.jpg',
                orderId: item.orderId,
                orderNumber: order?.orderNumber || '',
                orderDate: order?.createdAt.toISOString() || '',
                canReview: true,
                hasReviewed: false
            });
        }
    }
    res.json({
        success: true,
        products: productsToReview
    });
});
exports.createReview = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { productId, orderId, rating, title, content, images } = req.body;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    if (!productId || !rating || !title || !content) {
        throw new middleware_1.ValidationError('Missing required fields');
    }
    if (rating < 1 || rating > 5) {
        throw new middleware_1.ValidationError('Rating must be between 1 and 5');
    }
    // Check if user has already reviewed this product
    const existingReview = await database_1.prisma.review.findFirst({
        where: {
            userId,
            productId,
            deletedAt: null
        }
    });
    if (existingReview) {
        throw new middleware_1.ValidationError('You have already reviewed this product');
    }
    // Create the review
    const review = await database_1.prisma.review.create({
        data: {
            userId,
            productId,
            orderId: orderId || null,
            rating,
            title,
            comment: content,
            status: 'PENDING'
        }
    });
    // Add review images if provided
    if (images && images.length > 0) {
        await database_1.prisma.reviewImage.createMany({
            data: images.map((url, index) => ({
                reviewId: review.id,
                url,
                sortOrder: index
            }))
        });
    }
    // Get the created review with images
    const createdReview = await database_1.prisma.review.findUnique({
        where: { id: review.id },
        include: {
            images: {
                select: {
                    url: true,
                    sortOrder: true
                },
                orderBy: { sortOrder: 'asc' }
            }
        }
    });
    const formattedReview = {
        id: createdReview.id,
        productId: createdReview.productId,
        productName: 'Product Name', // Would need separate query
        productImage: '/placeholder.jpg', // Would need separate query
        rating: createdReview.rating,
        title: createdReview.title || '',
        content: createdReview.comment || '',
        images: createdReview.images.map(img => img.url),
        helpful: createdReview.helpfulCount,
        notHelpful: createdReview.notHelpfulCount,
        isVerifiedPurchase: createdReview.isVerifiedPurchase,
        createdAt: createdReview.createdAt.toISOString(),
        updatedAt: createdReview.updatedAt.toISOString(),
        status: createdReview.status.toLowerCase(),
        orderId: createdReview.orderId,
        orderNumber: '', // Would need separate query
        sellerResponse: createdReview.vendorReply,
        canEdit: true
    };
    res.status(201).json({
        success: true,
        review: formattedReview,
        message: 'Review submitted successfully'
    });
});
exports.updateReview = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { reviewId } = req.params;
    const { rating, title, content, images } = req.body;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    if (!rating || !title || !content) {
        throw new middleware_1.ValidationError('Missing required fields');
    }
    if (rating < 1 || rating > 5) {
        throw new middleware_1.ValidationError('Rating must be between 1 and 5');
    }
    // For now, return mock response
    const updatedReview = {
        id: reviewId,
        rating,
        title,
        content,
        images: images || [],
        updatedAt: new Date().toISOString(),
        canEdit: true
    };
    res.json({
        success: true,
        review: updatedReview,
        message: 'Review updated successfully'
    });
});
exports.deleteReview = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { reviewId } = req.params;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    // For now, just return success
    res.json({
        success: true,
        message: 'Review deleted successfully'
    });
});
exports.markHelpful = (0, middleware_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { reviewId } = req.params;
    const { helpful } = req.body;
    if (!userId) {
        throw new middleware_1.AppError('User authentication required', 401, 'UNAUTHORIZED');
    }
    // For now, just return success
    res.json({
        success: true,
        message: 'Review marked as helpful'
    });
});
//# sourceMappingURL=reviewsController.js.map