import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middleware/auth';
import Redis from 'ioredis';

// Redis client for caching
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const CACHE_TTL = 300; // 5 minutes
const SEARCH_CACHE_TTL = 60; // 1 minute for searches

export const getOptimizedProducts = async (req: AuthRequest, res: Response, next: any) => {
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
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Create cache key
    const cacheKey = `products:${JSON.stringify({
      category, subCategory, minPrice, maxPrice, minWeight, maxWeight,
      featured, inStock, search, page, limit, sortBy, sortOrder
    })}`;

    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const where: any = {
      published: true // Only show published products
    };

    // Apply filters
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

    // Optimized search with full-text search
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { category: { contains: search as string, mode: 'insensitive' } },
        { subCategory: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    // Optimized ordering
    const orderBy: any = {};
    const validSortFields = ['createdAt', 'price', 'name', 'averageRating', 'stockQuantity'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'createdAt';
    orderBy[sortField] = sortOrder as 'asc' | 'desc';

    const skip = (Number(page) - 1) * Number(limit);

    // Optimized database query with minimal fields
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: Math.min(Number(limit), 100), // Cap at 100 for performance
        select: {
          id: true,
          name: true,
          price: true,
          comparePrice: true,
          category: true,
          isFeatured: true,
          stockStatus: true,
          stockQuantity: true,
          averageRating: true,
          totalReviews: true,
          weight: true,
          weightUnit: true,
          sku: true,
          brand: true,
          createdAt: true,
          productImages: {
            select: {
              url: true,
              sortOrder: true
            },
            orderBy: { sortOrder: 'asc' },
            take: 3 // Only get first 3 images
          }
        }
      }),
      prisma.product.count({ where })
    ]);

    const result = {
      products,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
        hasMore: skip + products.length < total
      },
      filters: {
        category,
        subCategory,
        minPrice,
        maxPrice,
        featured,
        inStock,
        search,
        sortBy,
        sortOrder
      }
    };

    // Cache the result
    const ttl = search ? SEARCH_CACHE_TTL : CACHE_TTL;
    await redis.setex(cacheKey, ttl, JSON.stringify(result));

    res.json(result);
  } catch (error) {
    next(error);
  }
};

// Cache invalidation helper
export const invalidateProductCache = async (productId?: string) => {
  const pattern = productId ? `products:*${productId}*` : 'products:*';
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
};

// Optimized product count by category
export const getProductCounts = async (req: AuthRequest, res: Response, next: any) => {
  try {
    const cacheKey = 'product:category_counts';
    const cached = await redis.get(cacheKey);
    
    if (cached) {
      return res.json(JSON.parse(cached));
    }

    const counts = await (prisma.product.groupBy as any)({
      by: ['category'],
      where: { isPublished: true },
      _count: true
    });

    const result = counts.map(item => ({
      category: item.category,
      count: item._count
    }));

    await redis.setex(cacheKey, CACHE_TTL * 2, JSON.stringify(result)); // Longer cache for counts

    res.json({ categories: result });
  } catch (error) {
    next(error);
  }
};
