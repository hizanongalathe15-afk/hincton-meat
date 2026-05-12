import { Request, Response, NextFunction } from 'express';
export declare const searchProducts: ((req: Request, res: Response, next: NextFunction) => void)[];
export declare const searchCategories: (req: Request, res: Response, next: NextFunction) => void;
export declare const getSearchSuggestions: (req: Request, res: Response, next: NextFunction) => void;
export declare const getPopularSearches: (req: Request, res: Response, next: NextFunction) => void;
export declare const getFilteredProducts: (req: Request, res: Response, next: NextFunction) => void;
export declare const getAutocompleteSuggestions: (req: Request, res: Response, next: NextFunction) => void;
export declare const advancedSearch: (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=searchController.d.ts.map