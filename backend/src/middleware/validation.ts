import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({ message: errorMessage });
    }
    
    next();
  };
};

export const userRegistrationSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  address: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required()
  }).optional()
});

export const userLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const productSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  category: Joi.string().valid('Beef', 'Chicken', 'Lamb', 'Goat', 'Pork', 'Turkey', 'Duck', 'Rabbit', 'Venison', 'Exotic').required(),
  subCategory: Joi.string().min(1).required(),
  description: Joi.string().min(10).max(1000).required(),
  price: Joi.number().min(0).required(),
  originalPrice: Joi.number().min(0).optional(),
  images: Joi.array().items(Joi.string().uri()).min(1).required(),
  weight: Joi.object({
    min: Joi.number().min(0).required(),
    max: Joi.number().min(0).required(),
    unit: Joi.string().valid('kg', 'g', 'lbs').default('kg')
  }).required(),
  inStock: Joi.boolean().default(true),
  stockQuantity: Joi.number().min(0).default(0),
  featured: Joi.boolean().default(false),
  tags: Joi.array().items(Joi.string()).default([]),
  nutritionalInfo: Joi.object({
    calories: Joi.number().min(0),
    protein: Joi.number().min(0),
    fat: Joi.number().min(0),
    carbs: Joi.number().min(0)
  }).optional(),
  storageInstructions: Joi.string().required(),
  shelfLife: Joi.string().required(),
  origin: Joi.string().optional(),
  isHalal: Joi.boolean().default(false),
  isOrganic: Joi.boolean().default(false),
  discount: Joi.object({
    percentage: Joi.number().min(0).max(100).required(),
    validUntil: Joi.date().required()
  }).optional()
});

export const orderSchema = Joi.object({
  items: Joi.array().items(
    Joi.object({
      product: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
      quantity: Joi.number().min(1).required(),
      weight: Joi.number().min(0).required(),
      unit: Joi.string().valid('kg', 'g', 'lbs').required()
    })
  ).min(1).required(),
  deliveryAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required()
  }).required(),
  paymentMethod: Joi.string().valid('mpesa', 'cash', 'card').required(),
  specialInstructions: Joi.string().optional(),
  orderNotes: Joi.string().optional()
});
