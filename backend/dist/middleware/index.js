"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderCreateSchema = exports.productUpdateSchema = exports.productCreateSchema = exports.passwordChangeSchema = exports.userUpdateSchema = exports.userLoginSchema = exports.userRegistrationSchema = exports.validateBody = exports.dbLogger = exports.performanceLogger = exports.securityLogger = exports.requestLogger = exports.RateLimitError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.ValidationError = exports.AppError = exports.notFoundHandler = exports.asyncHandler = exports.errorHandler = exports.validateDocumentFile = exports.validateImageFile = exports.productImageUpload = exports.documentUpload = exports.imageUpload = exports.createFileUpload = exports.securityMiddleware = exports.preventNoSqlInjection = exports.preventSqlInjection = exports.sanitizeInput = exports.apiCors = exports.productionCors = exports.developmentCors = exports.cors = exports.apiRateLimiter = exports.registrationRateLimiter = exports.passwordResetRateLimiter = exports.authRateLimiter = exports.createRateLimiter = exports.API_PERMISSIONS = exports.revokeApiKey = exports.generateApiKey = exports.requireApiKeyPermission = exports.authenticateApiKey = exports.requireAdmin = exports.authorize = exports.optionalAuthenticate = exports.authenticate = void 0;
exports.paginationSchema = exports.searchSchema = exports.paymentProcessSchema = exports.subscriptionUpdateSchema = exports.subscriptionCreateSchema = exports.couponUpdateSchema = exports.couponCreateSchema = exports.reviewUpdateSchema = exports.reviewCreateSchema = exports.categoryUpdateSchema = exports.categoryCreateSchema = exports.orderUpdateSchema = void 0;
// Authentication & Authorization
var auth_1 = require("./auth");
Object.defineProperty(exports, "authenticate", { enumerable: true, get: function () { return auth_1.authenticate; } });
Object.defineProperty(exports, "optionalAuthenticate", { enumerable: true, get: function () { return auth_1.optionalAuthenticate; } });
Object.defineProperty(exports, "authorize", { enumerable: true, get: function () { return auth_1.authorize; } });
var admin_1 = require("./admin");
Object.defineProperty(exports, "requireAdmin", { enumerable: true, get: function () { return admin_1.requireAdmin; } });
var apiKey_1 = require("./apiKey");
Object.defineProperty(exports, "authenticateApiKey", { enumerable: true, get: function () { return apiKey_1.authenticateApiKey; } });
Object.defineProperty(exports, "requireApiKeyPermission", { enumerable: true, get: function () { return apiKey_1.requireApiKeyPermission; } });
Object.defineProperty(exports, "generateApiKey", { enumerable: true, get: function () { return apiKey_1.generateApiKey; } });
Object.defineProperty(exports, "revokeApiKey", { enumerable: true, get: function () { return apiKey_1.revokeApiKey; } });
Object.defineProperty(exports, "API_PERMISSIONS", { enumerable: true, get: function () { return apiKey_1.API_PERMISSIONS; } });
// Rate Limiting
var rateLimiter_1 = require("./rateLimiter");
Object.defineProperty(exports, "createRateLimiter", { enumerable: true, get: function () { return rateLimiter_1.createRateLimiter; } });
Object.defineProperty(exports, "authRateLimiter", { enumerable: true, get: function () { return rateLimiter_1.authRateLimiter; } });
Object.defineProperty(exports, "passwordResetRateLimiter", { enumerable: true, get: function () { return rateLimiter_1.passwordResetRateLimiter; } });
Object.defineProperty(exports, "registrationRateLimiter", { enumerable: true, get: function () { return rateLimiter_1.registrationRateLimiter; } });
Object.defineProperty(exports, "apiRateLimiter", { enumerable: true, get: function () { return rateLimiter_1.apiRateLimiter; } });
// Security & Protection
var cors_1 = require("./cors");
Object.defineProperty(exports, "cors", { enumerable: true, get: function () { return cors_1.cors; } });
Object.defineProperty(exports, "developmentCors", { enumerable: true, get: function () { return cors_1.developmentCors; } });
Object.defineProperty(exports, "productionCors", { enumerable: true, get: function () { return cors_1.productionCors; } });
Object.defineProperty(exports, "apiCors", { enumerable: true, get: function () { return cors_1.apiCors; } });
var sanitizer_1 = require("./sanitizer");
Object.defineProperty(exports, "sanitizeInput", { enumerable: true, get: function () { return sanitizer_1.sanitizeInput; } });
Object.defineProperty(exports, "preventSqlInjection", { enumerable: true, get: function () { return sanitizer_1.preventSqlInjection; } });
Object.defineProperty(exports, "preventNoSqlInjection", { enumerable: true, get: function () { return sanitizer_1.preventNoSqlInjection; } });
Object.defineProperty(exports, "securityMiddleware", { enumerable: true, get: function () { return sanitizer_1.securityMiddleware; } });
var fileUpload_1 = require("./fileUpload");
Object.defineProperty(exports, "createFileUpload", { enumerable: true, get: function () { return fileUpload_1.createFileUpload; } });
Object.defineProperty(exports, "imageUpload", { enumerable: true, get: function () { return fileUpload_1.imageUpload; } });
Object.defineProperty(exports, "documentUpload", { enumerable: true, get: function () { return fileUpload_1.documentUpload; } });
Object.defineProperty(exports, "productImageUpload", { enumerable: true, get: function () { return fileUpload_1.productImageUpload; } });
Object.defineProperty(exports, "validateImageFile", { enumerable: true, get: function () { return fileUpload_1.validateImageFile; } });
Object.defineProperty(exports, "validateDocumentFile", { enumerable: true, get: function () { return fileUpload_1.validateDocumentFile; } });
// Error Handling
var errorHandler_1 = require("./errorHandler");
Object.defineProperty(exports, "errorHandler", { enumerable: true, get: function () { return errorHandler_1.errorHandler; } });
Object.defineProperty(exports, "asyncHandler", { enumerable: true, get: function () { return errorHandler_1.asyncHandler; } });
Object.defineProperty(exports, "notFoundHandler", { enumerable: true, get: function () { return errorHandler_1.notFoundHandler; } });
Object.defineProperty(exports, "AppError", { enumerable: true, get: function () { return errorHandler_1.AppError; } });
Object.defineProperty(exports, "ValidationError", { enumerable: true, get: function () { return errorHandler_1.ValidationError; } });
Object.defineProperty(exports, "NotFoundError", { enumerable: true, get: function () { return errorHandler_1.NotFoundError; } });
Object.defineProperty(exports, "UnauthorizedError", { enumerable: true, get: function () { return errorHandler_1.UnauthorizedError; } });
Object.defineProperty(exports, "ForbiddenError", { enumerable: true, get: function () { return errorHandler_1.ForbiddenError; } });
Object.defineProperty(exports, "ConflictError", { enumerable: true, get: function () { return errorHandler_1.ConflictError; } });
Object.defineProperty(exports, "RateLimitError", { enumerable: true, get: function () { return errorHandler_1.RateLimitError; } });
// Logging
var logger_1 = require("./logger");
Object.defineProperty(exports, "requestLogger", { enumerable: true, get: function () { return logger_1.requestLogger; } });
Object.defineProperty(exports, "securityLogger", { enumerable: true, get: function () { return logger_1.securityLogger; } });
Object.defineProperty(exports, "performanceLogger", { enumerable: true, get: function () { return logger_1.performanceLogger; } });
Object.defineProperty(exports, "dbLogger", { enumerable: true, get: function () { return logger_1.dbLogger; } });
// Validation
// NOTE: schemas are defined in ./validationSchemas. Keep this single source of truth to avoid duplicate identifiers.
var validation_1 = require("./validation");
Object.defineProperty(exports, "validateBody", { enumerable: true, get: function () { return validation_1.validateBody; } });
var validationSchemas_1 = require("./validationSchemas");
Object.defineProperty(exports, "userRegistrationSchema", { enumerable: true, get: function () { return validationSchemas_1.userRegistrationSchema; } });
Object.defineProperty(exports, "userLoginSchema", { enumerable: true, get: function () { return validationSchemas_1.userLoginSchema; } });
Object.defineProperty(exports, "userUpdateSchema", { enumerable: true, get: function () { return validationSchemas_1.userUpdateSchema; } });
Object.defineProperty(exports, "passwordChangeSchema", { enumerable: true, get: function () { return validationSchemas_1.passwordChangeSchema; } });
Object.defineProperty(exports, "productCreateSchema", { enumerable: true, get: function () { return validationSchemas_1.productCreateSchema; } });
Object.defineProperty(exports, "productUpdateSchema", { enumerable: true, get: function () { return validationSchemas_1.productUpdateSchema; } });
Object.defineProperty(exports, "orderCreateSchema", { enumerable: true, get: function () { return validationSchemas_1.orderCreateSchema; } });
Object.defineProperty(exports, "orderUpdateSchema", { enumerable: true, get: function () { return validationSchemas_1.orderUpdateSchema; } });
Object.defineProperty(exports, "categoryCreateSchema", { enumerable: true, get: function () { return validationSchemas_1.categoryCreateSchema; } });
Object.defineProperty(exports, "categoryUpdateSchema", { enumerable: true, get: function () { return validationSchemas_1.categoryUpdateSchema; } });
Object.defineProperty(exports, "reviewCreateSchema", { enumerable: true, get: function () { return validationSchemas_1.reviewCreateSchema; } });
Object.defineProperty(exports, "reviewUpdateSchema", { enumerable: true, get: function () { return validationSchemas_1.reviewUpdateSchema; } });
Object.defineProperty(exports, "couponCreateSchema", { enumerable: true, get: function () { return validationSchemas_1.couponCreateSchema; } });
Object.defineProperty(exports, "couponUpdateSchema", { enumerable: true, get: function () { return validationSchemas_1.couponUpdateSchema; } });
Object.defineProperty(exports, "subscriptionCreateSchema", { enumerable: true, get: function () { return validationSchemas_1.subscriptionCreateSchema; } });
Object.defineProperty(exports, "subscriptionUpdateSchema", { enumerable: true, get: function () { return validationSchemas_1.subscriptionUpdateSchema; } });
Object.defineProperty(exports, "paymentProcessSchema", { enumerable: true, get: function () { return validationSchemas_1.paymentProcessSchema; } });
Object.defineProperty(exports, "searchSchema", { enumerable: true, get: function () { return validationSchemas_1.searchSchema; } });
Object.defineProperty(exports, "paginationSchema", { enumerable: true, get: function () { return validationSchemas_1.paginationSchema; } });
//# sourceMappingURL=index.js.map