// Authentication & Authorization
export { authenticate, optionalAuthenticate, authorize, type AuthRequest } from './auth'
export { requireAdmin } from './admin'
export { authenticateApiKey, requireApiKeyPermission, generateApiKey, revokeApiKey, API_PERMISSIONS, type ApiKeyRequest } from './apiKey'

// Rate Limiting
export { 
  createRateLimiter,
  authRateLimiter,
  passwordResetRateLimiter,
  registrationRateLimiter,
  apiRateLimiter
} from './rateLimiter'

// Security & Protection
export { cors, developmentCors, productionCors, apiCors, type CorsOptions } from './cors'
export { sanitizeInput, rejectUnsafeKeys, preventSqlInjection, preventNoSqlInjection, securityMiddleware } from './sanitizer'
export { 
  createFileUpload,
  imageUpload,
  documentUpload,
  productImageUpload,
  validateImageFile,
  validateDocumentFile,
  type FileUploadOptions
} from './fileUpload'

// Error Handling
export { 
  errorHandler,
  asyncHandler,
  notFoundHandler,
  type ApiError,
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError
} from './errorHandler'

// Logging
export { requestLogger, securityLogger, performanceLogger, dbLogger } from './logger'

// Validation
// NOTE: schemas are defined in ./validationSchemas. Keep this single source of truth to avoid duplicate identifiers.
export { validateBody } from './validation'

export {
  userRegistrationSchema,
  userLoginSchema,
  userUpdateSchema,
  passwordChangeSchema,
  productCreateSchema,
  productUpdateSchema,
  orderCreateSchema,
  orderUpdateSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  reviewCreateSchema,
  reviewUpdateSchema,
  couponCreateSchema,
  couponUpdateSchema,
  subscriptionCreateSchema,
  subscriptionUpdateSchema,
  paymentProcessSchema,
  searchSchema,
  paginationSchema
} from './validationSchemas'
