-- Coupons and promotions table
-- Created: 2024-01-10

-- Coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'
    value REAL NOT NULL,
    minimumAmount REAL DEFAULT 0,
    maximumDiscount REAL,
    usageLimit INTEGER,
    usageCount INTEGER DEFAULT 0,
    userUsageLimit INTEGER DEFAULT 1, -- Per user limit
    applicableCategories TEXT, -- JSON array
    applicableProducts TEXT, -- JSON array
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Coupon usage tracking table
CREATE TABLE IF NOT EXISTS coupon_usage (
    id TEXT PRIMARY KEY,
    couponId TEXT NOT NULL,
    userId TEXT NOT NULL,
    orderId TEXT,
    discountAmount REAL NOT NULL,
    usedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (couponId) REFERENCES coupons(id),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (orderId) REFERENCES orders(id)
);

-- Promotions table
CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'BOGO', 'BULK_DISCOUNT', 'FLASH_SALE'
    conditions TEXT, -- JSON format
    discount TEXT, -- JSON format
    applicableProducts TEXT, -- JSON array
    applicableCategories TEXT, -- JSON array
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    bannerImage TEXT,
    priority INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
