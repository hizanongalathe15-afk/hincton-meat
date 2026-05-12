import multer from 'multer';
export interface UploadOptions {
    folder?: string;
    maxSize?: number;
    allowedTypes?: string[];
    isPublic?: boolean;
    generateThumbnails?: boolean;
}
export interface UploadResult {
    success: boolean;
    url?: string;
    publicId?: string;
    filename?: string;
    size?: number;
    mimeType?: string;
    error?: string;
}
export interface FileMetadata {
    originalName: string;
    filename: string;
    path: string;
    size: number;
    mimeType: string;
    uploadedAt: Date;
    uploadedBy?: string;
    folder?: string;
    isPublic: boolean;
}
declare class FileUploadService {
    private uploadDir;
    private cloudinaryConfig;
    constructor();
    private ensureUploadDirectory;
    private initializeCloudinary;
    private getMulterConfig;
    getMiddleware(options?: UploadOptions): multer.Multer;
    uploadToCloudinary(filePath: string, options?: UploadOptions): Promise<UploadResult>;
    uploadLocal(file: Express.Multer.File, options?: UploadOptions): Promise<UploadResult>;
    uploadFile(file: Express.Multer.File, options?: UploadOptions): Promise<UploadResult>;
    deleteFile(publicId: string, isCloudinary?: boolean): Promise<boolean>;
    generateThumbnail(imagePath: string, outputPath: string, width?: number, height?: number): Promise<string>;
    private getLocalUrl;
    validateImage(filePath: string): Promise<{
        isValid: boolean;
        error?: string;
        metadata?: any;
    }>;
    cleanupTempFiles(): Promise<void>;
    getFileStats(): Promise<{
        totalFiles: number;
        totalSize: number;
        fileTypes: Record<string, number>;
    }>;
    optimizeImage(imagePath: string): Promise<string>;
    getUploadLimits(): {
        maxFileSize: number;
        allowedTypes: string[];
        maxFiles: number;
    };
    createUploadFolder(folderName: string): Promise<boolean>;
    moveFile(sourcePath: string, destinationPath: string): Promise<boolean>;
    copyFile(sourcePath: string, destinationPath: string): Promise<boolean>;
}
export declare const fileUploadService: FileUploadService;
export default fileUploadService;
//# sourceMappingURL=fileUploadService.d.ts.map