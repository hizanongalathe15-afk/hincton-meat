-- Performance optimizations for millions of products

-- 1. Add essential indexes (some already exist, but ensuring they're optimized)
CREATE INDEX IF NOT EXISTS idx_products_categoryid ON products ("categoryId");
CREATE INDEX IF NOT EXISTS idx_products_price ON products (price);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products ("isFeatured");
CREATE INDEX IF NOT EXISTS idx_products_published ON products ("isPublished");
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products ("createdAt");
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products (name);
CREATE INDEX IF NOT EXISTS idx_products_categoryid_price ON products ("categoryId", price);

-- 2. Full-text search index for better search performance
CREATE INDEX IF NOT EXISTS idx_products_search ON products USING gin (
  to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(brand, ''))
);

-- 3. Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_products_categoryid_featured ON products ("categoryId", "isFeatured");
CREATE INDEX IF NOT EXISTS idx_products_categoryid_published ON products ("categoryId", "isPublished");
CREATE INDEX IF NOT EXISTS idx_products_published_featured ON products ("isPublished", "isFeatured");
CREATE INDEX IF NOT EXISTS idx_products_stock_status ON products ("stockStatus");

-- 4. Partial indexes for better performance (only published products)
CREATE INDEX IF NOT EXISTS idx_products_active_published ON products ("createdAt", "isFeatured") 
WHERE "isPublished" = true;

CREATE INDEX IF NOT EXISTS idx_products_in_stock ON products ("categoryId", price)
WHERE "stockStatus" = 'in_stock';

-- 5. Indexes for sorting optimization
CREATE INDEX IF NOT EXISTS idx_products_rating_desc ON products ("averageRating" DESC);
CREATE INDEX IF NOT EXISTS idx_products_total_sold_desc ON products ("totalSold" DESC);
CREATE INDEX IF NOT EXISTS idx_products_created_desc ON products ("createdAt" DESC);

-- 6. Product images optimization
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images ("productId");
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON product_images ("productId", "sortOrder");

-- 7. Reviews optimization
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews ("productId");
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews ("createdAt");
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews ("rating");

-- 8. Partitioning strategy for very large tables (uncomment if needed)
-- This would require migrating existing data
/*
CREATE TABLE "Product_partitioned" (
  LIKE "Product" INCLUDING ALL
) PARTITION BY RANGE ("createdAt");

CREATE TABLE "Product_2024" PARTITION OF "Product_partitioned"
  FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');

CREATE TABLE "Product_2025" PARTITION OF "Product_partitioned"
  FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
*/
