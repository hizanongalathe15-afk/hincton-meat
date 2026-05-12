import { Request, Response, NextFunction } from 'express';
export interface FileUploadOptions {
    maxFileSize?: number;
    maxFiles?: number;
    allowedMimeTypes?: string[];
    destination?: string;
    requireAuth?: boolean;
}
export declare const createFileUpload: (options?: FileUploadOptions) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const imageUpload: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const documentUpload: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const productImageUpload: (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const validateImageFile: (file: Express.Multer.File) => {
    valid: boolean;
    error?: string;
};
export declare const validateDocumentFile: (file: Express.Multer.File) => {
    valid: boolean;
    error?: string;
};
//# sourceMappingURL=fileUpload.d.ts.map