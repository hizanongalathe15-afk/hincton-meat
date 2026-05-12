"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fileUploadService = void 0;
// @ts-nocheck
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const cloudinary_1 = require("cloudinary");
class FileUploadService {
    constructor() {
        this.uploadDir = process.env.UPLOAD_DIR || './uploads';
        this.ensureUploadDirectory();
        this.initializeCloudinary();
    }
    async ensureUploadDirectory() {
        try {
            await promises_1.default.access(this.uploadDir);
        }
        catch {
            await promises_1.default.mkdir(this.uploadDir, { recursive: true });
        }
        // Create subdirectories
        const subdirs = ['products', 'profiles', 'documents', 'temp'];
        for (const subdir of subdirs) {
            const fullPath = path_1.default.join(this.uploadDir, subdir);
            try {
                await promises_1.default.access(fullPath);
            }
            catch {
                await promises_1.default.mkdir(fullPath, { recursive: true });
            }
        }
    }
    initializeCloudinary() {
        this.cloudinaryConfig = {
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        };
        cloudinary_1.v2.config(this.cloudinaryConfig);
    }
    getMulterConfig(options = {}) {
        const { maxSize = 10 * 1024 * 1024, // 10MB default
        allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], folder = 'general' } = options;
        const storage = multer_1.default.diskStorage({
            destination: async (req, file, cb) => {
                const uploadPath = path_1.default.join(this.uploadDir, folder);
                await promises_1.default.mkdir(uploadPath, { recursive: true });
                cb(null, uploadPath);
            },
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
                const ext = path_1.default.extname(file.originalname);
                cb(null, file.fieldname + '-' + uniqueSuffix + ext);
            }
        });
        const fileFilter = (req, file, cb) => {
            if (allowedTypes.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new Error(`File type ${file.mimetype} is not allowed`));
            }
        };
        return {
            storage,
            limits: {
                fileSize: maxSize
            },
            fileFilter
        };
    }
    getMiddleware(options = {}) {
        return (0, multer_1.default)(this.getMulterConfig(options));
    }
    async uploadToCloudinary(filePath, options = {}) {
        try {
            const { folder = 'hincton', generateThumbnails = true } = options;
            const result = await cloudinary_1.v2.uploader.upload(filePath, {
                folder,
                resource_type: 'auto',
                use_filename: true,
                unique_filename: true,
                overwrite: false,
                transformation: generateThumbnails ? [
                    { width: 800, height: 600, crop: 'limit', quality: 'auto' },
                    { width: 400, height: 300, crop: 'limit', quality: 'auto', format: 'webp' }
                ] : undefined
            });
            // Clean up local file after upload
            await promises_1.default.unlink(filePath);
            return {
                success: true,
                url: result.secure_url,
                publicId: result.public_id,
                filename: result.original_filename,
                size: result.bytes,
                mimeType: result.format
            };
        }
        catch (error) {
            console.error('Cloudinary upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Upload failed'
            };
        }
    }
    async uploadLocal(file, options = {}) {
        try {
            const { folder = 'general', isPublic = true } = options;
            const filename = file.filename;
            const filePath = file.path;
            // Get file info
            const stats = await promises_1.default.stat(filePath);
            const metadata = {
                originalName: file.originalname,
                filename,
                path: filePath,
                size: stats.size,
                mimeType: file.mimetype,
                uploadedAt: new Date(),
                folder,
                isPublic
            };
            // Save to database if user is authenticated
            // This would be handled in the controller with user info
            const publicUrl = this.getLocalUrl(filename, folder);
            return {
                success: true,
                url: publicUrl,
                filename,
                size: stats.size,
                mimeType: file.mimetype
            };
        }
        catch (error) {
            console.error('Local upload error:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Local upload failed'
            };
        }
    }
    async uploadFile(file, options = {}) {
        const useCloudinary = process.env.USE_CLOUDINARY === 'true';
        if (useCloudinary) {
            return this.uploadToCloudinary(file.path, options);
        }
        else {
            return this.uploadLocal(file, options);
        }
    }
    async deleteFile(publicId, isCloudinary = true) {
        try {
            if (isCloudinary) {
                const result = await cloudinary_1.v2.uploader.destroy(publicId);
                return result.result === 'ok';
            }
            else {
                // Local file deletion
                const filePath = path_1.default.join(this.uploadDir, publicId);
                await promises_1.default.unlink(filePath);
                return true;
            }
        }
        catch (error) {
            console.error('File deletion error:', error);
            return false;
        }
    }
    async generateThumbnail(imagePath, outputPath, width = 300, height = 300) {
        try {
            // This would require image processing library like sharp
            // For now, return the original path
            // In production, implement actual thumbnail generation
            const thumbnailName = `thumb_${path_1.default.basename(imagePath)}`;
            const thumbnailPath = path_1.default.join(path_1.default.dirname(outputPath), thumbnailName);
            // Copy file as placeholder (implement actual resizing in production)
            await promises_1.default.copyFile(imagePath, thumbnailPath);
            return thumbnailPath;
        }
        catch (error) {
            console.error('Thumbnail generation error:', error);
            return imagePath; // Return original if thumbnail fails
        }
    }
    getLocalUrl(filename, folder) {
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:5000';
        return `${baseUrl}/uploads/${folder}/${filename}`;
    }
    async validateImage(filePath) {
        try {
            const stats = await promises_1.default.stat(filePath);
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (stats.size > maxSize) {
                return {
                    isValid: false,
                    error: 'File size exceeds maximum limit of 10MB'
                };
            }
            // Basic file type validation
            const ext = path_1.default.extname(filePath).toLowerCase();
            const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
            if (!allowedExts.includes(ext)) {
                return {
                    isValid: false,
                    error: 'File type not allowed'
                };
            }
            return {
                isValid: true,
                metadata: {
                    size: stats.size,
                    extension: ext
                }
            };
        }
        catch (error) {
            return {
                isValid: false,
                error: 'File validation failed'
            };
        }
    }
    async cleanupTempFiles() {
        try {
            const tempDir = path_1.default.join(this.uploadDir, 'temp');
            const files = await promises_1.default.readdir(tempDir);
            const now = Date.now();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            for (const file of files) {
                const filePath = path_1.default.join(tempDir, file);
                const stats = await promises_1.default.stat(filePath);
                if (now - stats.mtime.getTime() > maxAge) {
                    await promises_1.default.unlink(filePath);
                }
            }
        }
        catch (error) {
            console.error('Temp file cleanup error:', error);
        }
    }
    async getFileStats() {
        try {
            const stats = {
                totalFiles: 0,
                totalSize: 0,
                fileTypes: {}
            };
            const scanDirectory = async (dirPath) => {
                const files = await promises_1.default.readdir(dirPath);
                for (const file of files) {
                    const filePath = path_1.default.join(dirPath, file);
                    const fileStat = await promises_1.default.stat(filePath);
                    if (fileStat.isDirectory()) {
                        await scanDirectory(filePath);
                    }
                    else {
                        stats.totalFiles++;
                        stats.totalSize += fileStat.size;
                        const ext = path_1.default.extname(file).toLowerCase();
                        stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
                    }
                }
            };
            await scanDirectory(this.uploadDir);
            return stats;
        }
        catch (error) {
            console.error('File stats error:', error);
            return {
                totalFiles: 0,
                totalSize: 0,
                fileTypes: {}
            };
        }
    }
    async optimizeImage(imagePath) {
        try {
            // This would require image optimization library
            // For now, return the original path
            // In production, implement actual optimization
            return imagePath;
        }
        catch (error) {
            console.error('Image optimization error:', error);
            return imagePath;
        }
    }
    getUploadLimits() {
        return {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowedTypes: [
                'image/jpeg',
                'image/png',
                'image/webp',
                'image/gif',
                'application/pdf',
                'text/plain'
            ],
            maxFiles: 10 // Maximum files per request
        };
    }
    async createUploadFolder(folderName) {
        try {
            const folderPath = path_1.default.join(this.uploadDir, folderName);
            await promises_1.default.mkdir(folderPath, { recursive: true });
            return true;
        }
        catch (error) {
            console.error('Folder creation error:', error);
            return false;
        }
    }
    async moveFile(sourcePath, destinationPath) {
        try {
            await promises_1.default.rename(sourcePath, destinationPath);
            return true;
        }
        catch (error) {
            console.error('File move error:', error);
            return false;
        }
    }
    async copyFile(sourcePath, destinationPath) {
        try {
            await promises_1.default.copyFile(sourcePath, destinationPath);
            return true;
        }
        catch (error) {
            console.error('File copy error:', error);
            return false;
        }
    }
}
exports.fileUploadService = new FileUploadService();
exports.default = exports.fileUploadService;
//# sourceMappingURL=fileUploadService.js.map