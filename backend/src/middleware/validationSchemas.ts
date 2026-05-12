import Joi from 'joi'

// User validation schemas
export const userRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  address: Joi.object({
    street: Joi.string().min(5).max(100).required(),
    city: Joi.string().min(2).max(50).required(),
    state: Joi.string().min(2).max(50).required(),
    zipCode: Joi.string().min(3).max(20).required(),
    country: Joi.string().min(2).max(50).required()
  }).optional()
})

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
})

export const userUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  address: Joi.object({
    street: Joi.string().min(5).max(100).optional(),
    city: Joi.string().min(2).max(50).optional(),
    state: Joi.string().min(2).max(50).optional(),
    zipCode: Joi.string().min(3).max(20).optional(),
    country: Joi.string().min(2).max(50).optional()
  }).optional()
})

export const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .required()
})

// Product validation schemas
export const productCreateSchema = Joi.object({
  name: Joi.string().min(3).max(200).required(),
  description: Joi.string().max(2000).optional(),
  price: Joi.number().min(0).required(),
  sku: Joi.string().min(3).max(100).required(),
  categoryId: Joi.string().optional(),
  stockQuantity: Joi.number().min(0).default(0),
  lowStockThreshold: Joi.number().min(0).default(5),
  weight: Joi.number().min(0).optional(),
  length: Joi.number().min(0).optional(),
  width: Joi.number().min(0).optional(),
  height: Joi.number().min(0).optional(),
  brand: Joi.string().max(100).optional(),
  isPublished: Joi.boolean().default(false),
  isFeatured: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string().max(50)).optional()
})

export const productUpdateSchema = Joi.object({
  name: Joi.string().min(3).max(200).optional(),
  description: Joi.string().max(2000).optional(),
  price: Joi.number().min(0).optional(),
  sku: Joi.string().min(3).max(100).optional(),
  categoryId: Joi.string().optional(),
  stockQuantity: Joi.number().min(0).optional(),
  lowStockThreshold: Joi.number().min(0).optional(),
  weight: Joi.number().min(0).optional(),
  length: Joi.number().min(0).optional(),
  width: Joi.number().min(0).optional(),
  height: Joi.number().min(0).optional(),
  brand: Joi.string().max(100).optional(),
  isPublished: Joi.boolean().optional(),
  isFeatured: Joi.boolean().optional(),
  tags: Joi.array().items(Joi.string().max(50)).optional()
})

// Order validation schemas
export const orderCreateSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      productId: Joi.string().required(),
      variantId: Joi.string().optional(),
      quantity: Joi.number().min(1).required()
    })
  ).min(1).required(),
  shippingAddress: Joi.object({
    street: Joi.string().min(5).max(100).required(),
    city: Joi.string().min(2).max(50).required(),
    state: Joi.string().min(2).max(50).required(),
    zipCode: Joi.string().min(3).max(20).required(),
    country: Joi.string().min(2).max(50).required()
  }).required(),
  billingAddress: Joi.object({
    street: Joi.string().min(5).max(100).optional(),
    city: Joi.string().min(2).max(50).optional(),
    state: Joi.string().min(2).max(50).optional(),
    zipCode: Joi.string().min(3).max(20).optional(),
    country: Joi.string().min(2).max(50).optional()
  }).optional(),
  paymentMethod: Joi.string().valid('mpesa', 'card', 'paypal', 'cash').required(),
  couponCode: Joi.string().max(20).optional()
})

export const orderUpdateSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
  paymentStatus: Joi.string().valid('unpaid', 'paid', 'failed', 'refunded').optional(),
  deliveryStatus: Joi.string().valid('pending', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
  trackingNumber: Joi.string().max(100).optional(),
  notes: Joi.string().max(1000).optional()
})

// Category validation schemas
export const categoryCreateSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  slug: Joi.string().min(2).max(100).required(),
  description: Joi.string().max(1000).optional(),
  image: Joi.string().uri().optional(),
  icon: Joi.string().uri().optional(),
  parentId: Joi.string().optional(),
  sortOrder: Joi.number().min(0).default(0),
  isActive: Joi.boolean().default(true)
})

export const categoryUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  slug: Joi.string().min(2).max(100).optional(),
  description: Joi.string().max(1000).optional(),
  image: Joi.string().uri().optional(),
  icon: Joi.string().uri().optional(),
  parentId: Joi.string().optional(),
  sortOrder: Joi.number().min(0).optional(),
  isActive: Joi.boolean().optional()
})

// Review validation schemas
export const reviewCreateSchema = Joi.object({
  productId: Joi.string().required(),
  rating: Joi.number().min(1).max(5).required(),
  title: Joi.string().min(3).max(200).required(),
  comment: Joi.string().min(10).max(2000).required(),
  orderId: Joi.string().optional()
})

export const reviewUpdateSchema = Joi.object({
  rating: Joi.number().min(1).max(5).optional(),
  title: Joi.string().min(3).max(200).optional(),
  comment: Joi.string().min(10).max(2000).optional()
})

// Coupon validation schemas
export const couponCreateSchema = Joi.object({
  code: Joi.string().min(3).max(20).required().uppercase(),
  description: Joi.string().max(500).optional(),
  discountType: Joi.string().valid('percentage', 'fixed').required(),
  discountValue: Joi.number().min(0).required(),
  minimumSpend: Joi.number().min(0).optional(),
  maximumDiscount: Joi.number().min(0).optional(),
  usageLimit: Joi.number().min(1).optional(),
  usageLimitPerUser: Joi.number().min(1).default(1),
  validFrom: Joi.date().optional(),
  validUntil: Joi.date().optional(),
  isActive: Joi.boolean().default(true),
  stackable: Joi.boolean().default(false),
  firstOrderOnly: Joi.boolean().default(false)
})

export const couponUpdateSchema = Joi.object({
  description: Joi.string().max(500).optional(),
  discountType: Joi.string().valid('percentage', 'fixed').optional(),
  discountValue: Joi.number().min(0).optional(),
  minimumSpend: Joi.number().min(0).optional(),
  maximumDiscount: Joi.number().min(0).optional(),
  usageLimit: Joi.number().min(1).optional(),
  usageLimitPerUser: Joi.number().min(1).optional(),
  validFrom: Joi.date().optional(),
  validUntil: Joi.date().optional(),
  isActive: Joi.boolean().optional(),
  stackable: Joi.boolean().optional(),
  firstOrderOnly: Joi.boolean().optional()
})

// Subscription validation schemas
export const subscriptionCreateSchema = Joi.object({
  planId: Joi.string().optional(),
  plan: Joi.string().required(),
  deliveryFrequency: Joi.string().valid('weekly', 'biweekly', 'monthly').required(),
  deliveryAddress: Joi.string().min(10).max(500).required(),
  deliveryInstructions: Joi.string().max(500).optional(),
  autoRenew: Joi.boolean().default(true)
})

export const subscriptionUpdateSchema = Joi.object({
  planId: Joi.string().optional(),
  deliveryFrequency: Joi.string().valid('weekly', 'biweekly', 'monthly').optional(),
  deliveryAddress: Joi.string().min(10).max(500).optional(),
  deliveryInstructions: Joi.string().max(500).optional(),
  autoRenew: Joi.boolean().optional(),
  status: Joi.string().valid('active', 'paused', 'cancelled').optional()
})

// Payment validation schemas
export const paymentProcessSchema = Joi.object({
  orderId: Joi.string().required(),
  paymentMethod: Joi.string().valid('mpesa', 'card', 'paypal').required(),
  amount: Joi.number().min(0).required(),
  currency: Joi.string().valid('USD', 'KES', 'EUR', 'GBP').default('USD'),
  paymentDetails: Joi.object().optional()
})

// Search and filter schemas
export const searchSchema = Joi.object({
  query: Joi.string().min(2).max(100).optional(),
  category: Joi.string().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  brand: Joi.string().optional(),
  sortBy: Joi.string().valid('name', 'price', 'createdAt', 'rating', 'sales').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20)
})

// Pagination schema
export const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20)
})
