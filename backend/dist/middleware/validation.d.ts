import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
export declare const validateBody: (schema: Joi.ObjectSchema) => (req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
export declare const userRegistrationSchema: Joi.ObjectSchema<any>;
export declare const userLoginSchema: Joi.ObjectSchema<any>;
export declare const productSchema: Joi.ObjectSchema<any>;
export declare const orderSchema: Joi.ObjectSchema<any>;
//# sourceMappingURL=validation.d.ts.map