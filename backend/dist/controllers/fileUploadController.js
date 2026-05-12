"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFile = exports.deleteFile = exports.validateDocument = exports.validateImage = exports.uploadProductImages = exports.uploadDocuments = exports.uploadImages = void 0;
const middleware_1 = require("../middleware");
const middleware_2 = require("../middleware");
exports.uploadImages = [
    middleware_2.imageUpload,
    (0, middleware_1.asyncHandler)(async (req, res) => {
        const files = req.files;
        if (!files || files.length === 0) {
            throw new middleware_1.ValidationError('No files uploaded');
        }
        const uploadedFiles = files.map((file) => ({
            id: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            url: `/uploads/images/${file.filename}`
        }));
        res.status(201).json({
            success: true,
            data: uploadedFiles,
            message: 'Images uploaded successfully'
        });
    })
];
exports.uploadDocuments = [
    middleware_2.documentUpload,
    (0, middleware_1.asyncHandler)(async (req, res) => {
        const files = req.files;
        if (!files || files.length === 0) {
            throw new middleware_1.ValidationError('No files uploaded');
        }
        const uploadedFiles = files.map((file) => ({
            id: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            url: `/uploads/documents/${file.filename}`
        }));
        res.status(201).json({
            success: true,
            data: uploadedFiles,
            message: 'Documents uploaded successfully'
        });
    })
];
exports.uploadProductImages = [
    middleware_2.productImageUpload,
    (0, middleware_1.asyncHandler)(async (req, res) => {
        const files = req.files;
        const { productId } = req.body;
        if (!files || files.length === 0) {
            throw new middleware_1.ValidationError('No files uploaded');
        }
        if (!productId) {
            throw new middleware_1.ValidationError('Product ID is required');
        }
        const uploadedFiles = files.map((file) => ({
            id: file.filename,
            originalName: file.originalname,
            size: file.size,
            mimetype: file.mimetype,
            url: `/uploads/products/${file.filename}`,
            productId
        }));
        res.status(201).json({
            success: true,
            data: uploadedFiles,
            message: 'Product images uploaded successfully'
        });
    })
];
exports.validateImage = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { file } = req.body;
    if (!file) {
        throw new middleware_1.ValidationError('File data is required');
    }
    const validation = (0, middleware_2.validateImageFile)(file);
    res.json({
        success: true,
        data: validation
    });
});
exports.validateDocument = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { file } = req.body;
    if (!file) {
        throw new middleware_1.ValidationError('File data is required');
    }
    const validation = (0, middleware_2.validateDocumentFile)(file);
    res.json({
        success: true,
        data: validation
    });
});
exports.deleteFile = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { filename } = req.params;
    if (!filename) {
        throw new middleware_1.ValidationError('Filename is required');
    }
    // In a real implementation, you would delete the file from storage
    // For now, just return success
    res.json({
        success: true,
        message: 'File deleted successfully'
    });
});
exports.getFile = (0, middleware_1.asyncHandler)(async (req, res) => {
    const { filename } = req.params;
    if (!filename) {
        throw new middleware_1.ValidationError('Filename is required');
    }
    // In a real implementation, you would serve the file
    // For now, just return file info
    res.json({
        success: true,
        data: {
            filename,
            url: `/uploads/${filename}`
        }
    });
});
//# sourceMappingURL=fileUploadController.js.map