import { Request, Response, NextFunction } from 'express';
export declare const uploadImages: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const uploadDocuments: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const uploadProductImages: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const validateImage: (req: Request, res: Response, next: NextFunction) => void;
export declare const validateDocument: (req: Request, res: Response, next: NextFunction) => void;
export declare const deleteFile: (req: Request, res: Response, next: NextFunction) => void;
export declare const getFile: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=fileUploadController.d.ts.map