"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const middleware_1 = require("../middleware");
const router = (0, express_1.Router)();
// File validation routes - public but rate limited
router.post('/validate/image', middleware_1.authRateLimiter, controllers_1.FileUploadController.validateImage);
router.post('/validate/document', middleware_1.authRateLimiter, controllers_1.FileUploadController.validateDocument);
// Protected file upload routes - require authentication
router.use(middleware_1.authenticate);
// Image upload routes - stricter rate limiting
router.post('/images', middleware_1.authRateLimiter, controllers_1.FileUploadController.uploadImages);
router.post('/documents', middleware_1.authRateLimiter, controllers_1.FileUploadController.uploadDocuments);
router.post('/product-images', middleware_1.authRateLimiter, controllers_1.FileUploadController.uploadProductImages);
// File management routes - admin only
router.use(middleware_1.requireAdmin);
router.get('/file/:filename', middleware_1.apiRateLimiter, controllers_1.FileUploadController.getFile);
router.delete('/file/:filename', middleware_1.authRateLimiter, controllers_1.FileUploadController.deleteFile);
exports.default = router;
//# sourceMappingURL=fileUpload.js.map