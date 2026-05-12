import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export const getAllProducts = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const {
      category,
      subCategory,
      minPrice,
      maxPrice,
      minWeight,
      maxWeight,
      featured,
      inStock,
      search,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const where: any = {};

    if (category) where.category = category;
    if (subCategory) where.subCategory = subCategory;
    if (featured !== undefined) where.featured = featured === 'true';
    if (inStock !== undefined) where.inStock = inStock === 'true';

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice as string);
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
    }

    if (minWeight || maxWeight) {
      where.weight = {};
      if (minWeight) where.weight.gte = parseFloat(minWeight as string);
      if (maxWeight) where.weight.lte = parseFloat(maxWeight as string);
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { category: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const orderBy: any = {};
    orderBy[sortBy as string] = sortOrder as 'asc' | 'desc';

    const skip = (Number(page) - 1) * Number(limit);

    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: Number(limit),
      include: {
        reviews: true,
        productImages: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    const total = await prisma.product.count({ where });

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        reviews: true,
        productImages: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: 'Server error while fetching product' });
  }
};

export const createProduct = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const {
      name,
      category,
      subCategory,
      description,
      price,
      originalPrice,
      images,
      weight,
      stockQuantity,
      featured,
      tags,
      nutritionalInfo,
      storageInstructions,
      shelfLife,
      origin,
      isHalal,
      isOrganic,
      discount
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        sku: `SKU-${Date.now()}`,
        description,
        price: parseFloat(price),
        comparePrice: originalPrice ? parseFloat(originalPrice) : null,
        stockQuantity: parseInt(stockQuantity),
        isFeatured: featured || false
      },
      include: {
        reviews: true,
        productImages: true
      }
    });

    // Handle images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      const imageData = images.map((img: any, index: number) => ({
        url: img.url,
        alt: img.alt || `${name} image ${index + 1}`,
        sortOrder: img.sortOrder || index,
        isPrimary: img.isPrimary || (index === 0)
      }));

      await prisma.productImage.createMany({
        data: imageData.map(img => ({
          ...img,
          productId: product.id
        }))
      });

      // Re-fetch product with images
      const productWithImages = await prisma.product.findUnique({
        where: { id: product.id },
        include: {
          reviews: true,
          productImages: {
            orderBy: { sortOrder: 'asc' }
          }
        }
      });

      res.status(201).json({
        message: 'Product created successfully',
        product: productWithImages
      });
    } else {
      res.status(201).json({
        message: 'Product created successfully',
        product
      });
    }
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error while creating product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const existingProduct = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!existingProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const updateData: any = { ...req.body };
    
    // Convert price fields to numbers if they exist
    if (updateData.price) updateData.price = parseFloat(updateData.price);
    if (updateData.originalPrice) updateData.originalPrice = parseFloat(updateData.originalPrice);
    if (updateData.stockQuantity) updateData.stockQuantity = parseInt(updateData.stockQuantity);
    
    // Handle nested objects
    if (updateData.weight) {
      updateData.weight = {
        min: parseFloat(updateData.weight.min),
        max: parseFloat(updateData.weight.max),
        unit: updateData.weight.unit
      };
    }

    if (updateData.nutritionalInfo) {
      updateData.nutritionalInfo = {
        calories: parseFloat(updateData.nutritionalInfo.calories),
        protein: parseFloat(updateData.nutritionalInfo.protein),
        fat: parseFloat(updateData.nutritionalInfo.fat),
        carbs: parseFloat(updateData.nutritionalInfo.carbs)
      };
    }

    if (updateData.discount) {
      updateData.discount = {
        percentage: parseFloat(updateData.discount.percentage),
        validUntil: new Date(updateData.discount.validUntil)
      };
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        reviews: true,
        productImages: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    });

    // Handle images if provided
    if (updateData.images && Array.isArray(updateData.images)) {
      // Delete existing images
      await prisma.productImage.deleteMany({
        where: { productId: req.params.id }
      });

      // Create new images
      if (updateData.images.length > 0) {
        const imageData = updateData.images.map((img: any, index: number) => ({
          url: img.url,
          alt: img.alt || `${existingProduct.name} image ${index + 1}`,
          sortOrder: img.sortOrder || index,
          isPrimary: img.isPrimary || (index === 0)
        }));

        await prisma.productImage.createMany({
          data: imageData.map(img => ({
            ...img,
            productId: req.params.id
          }))
        });

        // Re-fetch product with new images
        const productWithImages = await prisma.product.findUnique({
          where: { id: req.params.id },
          include: {
            reviews: true,
            productImages: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        });

        res.json({
          message: 'Product updated successfully',
          product: productWithImages
        });
      } else {
        res.json({
          message: 'Product updated successfully',
          product
        });
      }
    } else {
      res.json({
        message: 'Product updated successfully',
        product
      });
    }
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error while updating product' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const product = await prisma.product.delete({
      where: { id: req.params.id }
    });

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error while deleting product' });
  }
};

export const getFeaturedProducts = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const products = await prisma.product.findMany({
      where: {
        isFeatured: true,
        stockStatus: 'in_stock'
      },
      take: 8,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        reviews: true
      }
    });

    res.json({ products });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ message: 'Server error while fetching featured products' });
  }
};

export const getProductsByCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { category } = req.params;
    const products = await prisma.product.findMany({
      where: { stockStatus: 'in_stock' },
      orderBy: { name: 'asc' }
    });

    res.json({ products });
  } catch (error) {
    next(error);
  }
};

export const updateStock = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { stockQuantity } = req.body;
    
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { stockQuantity }
    });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({
      message: 'Stock updated successfully',
      product
    });
  } catch (error) {
    next(error);
  }
};

export const searchProducts = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { q, category, page = 1, limit = 12 } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const query: any = {
      $text: { $search: q as string }
    };

    if (category) {
      query.category = category;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await prisma.product.findMany({
      where: query,
      skip,
      take: Number(limit)
    });

    const total = await prisma.product.count({ where: query });

    res.json({
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};
