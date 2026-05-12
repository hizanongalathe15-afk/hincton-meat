-- Product analytics and metrics table
-- Created: 2024-01-12

-- Product view tracking
CREATE TABLE IF NOT EXISTS product_views (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    userId TEXT, -- NULL for guest views
    sessionId TEXT, -- For guest tracking
    ipAddress TEXT,
    userAgent TEXT,
    referrer TEXT,
    viewedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Product search tracking
CREATE TABLE IF NOT EXISTS product_searches (
    id TEXT PRIMARY KEY,
    searchTerm TEXT NOT NULL,
    userId TEXT, -- NULL for guest searches
    sessionId TEXT,
    resultsCount INTEGER DEFAULT 0,
    ipAddress TEXT,
    searchedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Product clicks tracking
CREATE TABLE IF NOT EXISTS product_clicks (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    userId TEXT, -- NULL for guest clicks
    sessionId TEXT,
    source TEXT, -- 'search', 'category', 'featured', 'recommendation'
    position INTEGER, -- Position in list
    clickedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Conversion tracking
CREATE TABLE IF NOT EXISTS conversions (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    userId TEXT, -- NULL for guest conversions
    sessionId TEXT,
    conversionType TEXT NOT NULL, -- 'ADD_TO_CART', 'PURCHASE', 'WISHLIST'
    orderValue REAL,
    sessionId TEXT,
    convertedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Popular products aggregation table
CREATE TABLE IF NOT EXISTS popular_products (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    viewCount INTEGER DEFAULT 0,
    purchaseCount INTEGER DEFAULT 0,
    addToCartCount INTEGER DEFAULT 0,
    wishlistCount INTEGER DEFAULT 0,
    score REAL DEFAULT 0, -- Calculated popularity score
    lastUpdated DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id)
);
