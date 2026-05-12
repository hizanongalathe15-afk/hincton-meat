-- Products table updates
-- Created: 2024-01-03

-- Add product categories and tags
ALTER TABLE products ADD COLUMN categories TEXT;
ALTER TABLE products ADD COLUMN tags TEXT;
ALTER TABLE products ADD COLUMN sku TEXT UNIQUE;
ALTER TABLE products ADD COLUMN barcode TEXT;
ALTER TABLE products ADD COLUMN brand TEXT;
ALTER TABLE products ADD COLUMN origin TEXT;
ALTER TABLE products ADD COLUMN storageConditions TEXT;
ALTER TABLE products ADD COLUMN expirationDate DATE;
ALTER TABLE products ADD COLUMN nutritionalInfo TEXT;

-- Create product categories table
CREATE TABLE IF NOT EXISTS product_categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    parentId TEXT,
    imageUrl TEXT,
    sortOrder INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parentId) REFERENCES product_categories(id)
);

-- Create product tags table
CREATE TABLE IF NOT EXISTS product_tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#000000',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create product-tag relationship table
CREATE TABLE IF NOT EXISTS product_tag_relations (
    productId TEXT NOT NULL,
    tagId TEXT NOT NULL,
    PRIMARY KEY (productId, tagId),
    FOREIGN KEY (productId) REFERENCES products(id),
    FOREIGN KEY (tagId) REFERENCES product_tags(id)
);
