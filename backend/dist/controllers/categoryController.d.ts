import { Request, Response, NextFunction } from 'express';
export declare const getCategories: (req: Request, res: Response, next: NextFunction) => void;
export declare const getCategory: (req: Request, res: Response, next: NextFunction) => void;
export declare const getCategoryBySlug: (req: Request, res: Response, next: NextFunction) => void;
export declare const getRootCategories: (req: Request, res: Response, next: NextFunction) => void;
export declare const getFeaturedCategories: (req: Request, res: Response, next: NextFunction) => void;
export declare const createCategory: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const updateCategory: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const deleteCategory: (req: Request, res: Response, next: NextFunction) => void;
export declare const getCategoryProducts: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=categoryController.d.ts.map