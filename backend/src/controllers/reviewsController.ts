import { Request, Response, NextFunction } from 'express'
import { asyncHandler, AppError, NotFoundError, ValidationError } from '../middleware'
import { prisma } from '../database'

export const getMyReviews = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  const reviews = await prisma.review.findMany({
    where: {
      userId,
      deletedAt: null
    },
    include: {
      product: {
        select: {
          name: true,
          productImages: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1, select: { url: true } }
        }
      },
      orderItem: { select: { productName: true, productImage: true } },
      images: {
        select: {
          url: true,
          sortOrder: true
        },
        orderBy: { sortOrder: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const formattedReviews = reviews.map(review => ({
    id: review.id,
    productId: review.productId,
    productName: review.product?.name || review.orderItem?.productName || 'Product',
    productImage: review.product?.productImages?.[0]?.url || review.orderItem?.productImage || '/hincton/hero-platter.jpg',
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
  }))

  res.json({
    success: true,
    reviews: formattedReviews
  })
})

export const getProductsToReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  const orders = await prisma.order.findMany({
    where: {
      userId,
      status: { in: ['DELIVERED', 'COMPLETED'] as any },
      deletedAt: null
    } as any,
    orderBy: { createdAt: 'desc' },
    include: {
      orderItems: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              productImages: {
                orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }],
                take: 1,
                select: { url: true }
              }
            }
          },
          review: { select: { id: true } }
        }
      }
    }
  })

  const productsToReview = []
  
  for (const order of orders) {
    for (const item of order.orderItems) {
      if (!item.productId || item.review) continue
      productsToReview.push({
        id: item.productId,
        orderItemId: item.id,
        name: item.product?.name || item.productName,
        image: item.product?.productImages?.[0]?.url || item.productImage || '/hincton/hero-platter.jpg',
        orderId: item.orderId,
        orderNumber: order.orderNumber || '',
        orderDate: order.createdAt.toISOString(),
        canReview: true,
        hasReviewed: false
      })
    }
  }

  res.json({
    success: true,
    products: productsToReview
  })
})

export const createReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const { productId, orderId, orderItemId, rating, title, content, images } = req.body
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  if (!productId || !rating || !title || !content) {
    throw new ValidationError('Missing required fields')
  }

  if (rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5')
  }

  let verifiedOrderItem: any = null
  if (orderItemId || orderId) {
    verifiedOrderItem = await prisma.orderItem.findFirst({
      where: {
        ...(orderItemId ? { id: orderItemId } : {}),
        ...(orderId ? { orderId } : {}),
        productId,
        order: {
          userId,
          status: { in: ['DELIVERED', 'COMPLETED'] as any },
          deletedAt: null,
        } as any,
      },
      include: { order: true },
    })
  }

  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      productId,
      ...(verifiedOrderItem ? { orderItemId: verifiedOrderItem.id } : {}),
      deletedAt: null
    }
  })

  if (existingReview) {
    throw new ValidationError('You have already reviewed this product')
  }

  // Create the review
  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      orderId: verifiedOrderItem?.orderId || orderId || null,
      orderItemId: verifiedOrderItem?.id || orderItemId || null,
      rating,
      title,
      comment: content,
      isVerifiedPurchase: Boolean(verifiedOrderItem),
      status: 'APPROVED'
    }
  })

  // Add review images if provided
  if (images && images.length > 0) {
    await prisma.reviewImage.createMany({
      data: images.map((url: string, index: number) => ({
        reviewId: review.id,
        url,
        sortOrder: index
      }))
    })
  }

  // Get the created review with images
  const createdReview = await prisma.review.findUnique({
    where: { id: review.id },
    include: {
      product: {
        select: {
          name: true,
          productImages: { orderBy: [{ isPrimary: 'desc' }, { sortOrder: 'asc' }], take: 1, select: { url: true } }
        }
      },
      images: {
        select: {
          url: true,
          sortOrder: true
        },
        orderBy: { sortOrder: 'asc' }
      }
    }
  })

  const aggregate = await prisma.review.aggregate({
    where: { productId, deletedAt: null, status: 'APPROVED' as any },
    _avg: { rating: true },
    _count: { rating: true }
  })
  await prisma.product.update({
    where: { id: productId },
    data: {
      averageRating: Number(aggregate._avg.rating || 0),
      totalReviews: aggregate._count.rating
    }
  }).catch((error) => console.error('Product rating aggregate update failed:', error))

  const formattedReview = {
    id: createdReview.id,
    productId: createdReview.productId,
    productName: createdReview.product?.name || 'Product',
    productImage: createdReview.product?.productImages?.[0]?.url || '/hincton/hero-platter.jpg',
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
  }

  res.status(201).json({
    success: true,
    review: formattedReview,
    message: 'Review submitted successfully'
  })
})

export const updateReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const reviewId = req.params.reviewId || req.params.id
  const { rating, title, content, images } = req.body
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  if (!rating || !title || !content) {
    throw new ValidationError('Missing required fields')
  }

  if (rating < 1 || rating > 5) {
    throw new ValidationError('Rating must be between 1 and 5')
  }

  const review = await prisma.review.findFirst({ where: { id: reviewId, userId, deletedAt: null } })
  if (!review) throw new NotFoundError('Review', reviewId)

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: { rating, title, comment: content, status: 'APPROVED' as any },
  })

  if (Array.isArray(images)) {
    await prisma.reviewImage.deleteMany({ where: { reviewId } })
    if (images.length) {
      await prisma.reviewImage.createMany({
        data: images.map((url: string, index: number) => ({ reviewId, url, sortOrder: index }))
      })
    }
  }

  const aggregate = await prisma.review.aggregate({
    where: { productId: review.productId, deletedAt: null, status: 'APPROVED' as any },
    _avg: { rating: true },
    _count: { rating: true }
  })
  await prisma.product.update({
    where: { id: review.productId },
    data: { averageRating: Number(aggregate._avg.rating || 0), totalReviews: aggregate._count.rating }
  })

  res.json({
    success: true,
    review: updatedReview,
    message: 'Review updated successfully'
  })
})

export const deleteReview = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const reviewId = req.params.reviewId || req.params.id
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  const review = await prisma.review.findFirst({ where: { id: reviewId, userId, deletedAt: null } })
  if (!review) throw new NotFoundError('Review', reviewId)
  await prisma.review.update({ where: { id: reviewId }, data: { deletedAt: new Date(), status: 'REMOVED' as any } })

  const aggregate = await prisma.review.aggregate({
    where: { productId: review.productId, deletedAt: null, status: 'APPROVED' as any },
    _avg: { rating: true },
    _count: { rating: true }
  })
  await prisma.product.update({
    where: { id: review.productId },
    data: { averageRating: Number(aggregate._avg.rating || 0), totalReviews: aggregate._count.rating }
  })

  res.json({
    success: true,
    message: 'Review deleted successfully'
  })
})

export const markHelpful = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id
  const reviewId = req.params.reviewId || req.params.id
  const { helpful } = req.body
  
  if (!userId) {
    throw new AppError('User authentication required', 401, 'UNAUTHORIZED')
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: helpful ? { helpfulCount: { increment: 1 } } : { notHelpfulCount: { increment: 1 } }
  })

  res.json({
    success: true,
    message: 'Review marked as helpful'
  })
})
