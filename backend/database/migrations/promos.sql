-- Additional promotional tables
-- Created: 2024-01-16

-- Promo codes table (alternative to coupons)
CREATE TABLE IF NOT EXISTS promo_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    discountType TEXT NOT NULL, -- 'PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y'
    discountValue REAL NOT NULL,
    minPurchaseAmount REAL DEFAULT 0,
    maxDiscountAmount REAL,
    applicableProducts TEXT, -- JSON array
    applicableCategories TEXT, -- JSON array
    usageLimit INTEGER,
    usageCount INTEGER DEFAULT 0,
    userLimit INTEGER DEFAULT 1,
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Flash sales table
CREATE TABLE IF NOT EXISTS flash_sales (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    discountType TEXT NOT NULL, -- 'PERCENTAGE', 'FIXED_AMOUNT'
    discountValue REAL NOT NULL,
    applicableProducts TEXT, -- JSON array
    applicableCategories TEXT, -- JSON array
    startTime DATETIME NOT NULL,
    endTime DATETIME NOT NULL,
    isActive BOOLEAN DEFAULT TRUE,
    bannerText TEXT,
    bannerColor TEXT DEFAULT '#FF0000',
    maxUses INTEGER,
    currentUses INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bundle deals table
CREATE TABLE IF NOT EXISTS bundle_deals (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    products TEXT NOT NULL, -- JSON array of product IDs and quantities
    bundlePrice REAL NOT NULL,
    originalPrice REAL NOT NULL,
    savings REAL,
    maxQuantity INTEGER,
    currentStock INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    imageUrl TEXT,
    startTime DATETIME NOT NULL,
    endTime DATETIME NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty points table
CREATE TABLE IF NOT EXISTS loyalty_points (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    pointsType TEXT NOT NULL, -- 'EARNED', 'REDEEMED'
    source TEXT, -- 'PURCHASE', 'REVIEW', 'REFERRAL', 'BONUS'
    sourceId TEXT, -- Related order, review, etc. ID
    description TEXT,
    expiresAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Loyalty rewards table
CREATE TABLE IF NOT EXISTS loyalty_rewards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    pointsCost INTEGER NOT NULL,
    rewardType TEXT NOT NULL, -- 'DISCOUNT', 'FREE_PRODUCT', 'UPGRADE'
    rewardValue TEXT, -- JSON format
    imageUrl TEXT,
    isActive BOOLEAN DEFAULT TRUE,
    maxRedemptions INTEGER,
    currentRedemptions INTEGER DEFAULT 0,
    validFrom DATETIME,
    validUntil DATETIME,
    terms TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Loyalty redemptions table
CREATE TABLE IF NOT EXISTS loyalty_redemptions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    rewardId TEXT NOT NULL,
    pointsUsed INTEGER NOT NULL,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'
    redemptionCode TEXT,
    processedAt DATETIME,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (rewardId) REFERENCES loyalty_rewards(id)
);
