-- Sponsored products and advertising table
-- Created: 2024-01-13

-- Sponsored products table
CREATE TABLE IF NOT EXISTS sponsored_products (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    sponsorId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    imageUrl TEXT,
    targetUrl TEXT,
    position INTEGER DEFAULT 1, -- Position in sponsored list
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    budget REAL,
    spent REAL DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    ctr REAL DEFAULT 0, -- Click-through rate
    status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'PAUSED', 'EXPIRED'
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id),
    FOREIGN KEY (sponsorId) REFERENCES users(id)
);

-- Advertisements table
CREATE TABLE IF NOT EXISTS advertisements (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- 'BANNER', 'SIDEBAR', 'POPUP', 'NATIVE'
    content TEXT NOT NULL, -- HTML or JSON content
    imageUrl TEXT,
    targetUrl TEXT,
    position TEXT, -- Where to display ad
    dimensions TEXT, -- '300x250', '728x90', etc.
    startDate DATETIME NOT NULL,
    endDate DATETIME NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    ctr REAL DEFAULT 0,
    budget REAL,
    spent REAL DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE',
    isActive BOOLEAN DEFAULT TRUE,
    targetingRules TEXT, -- JSON format
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Ad impressions tracking
CREATE TABLE IF NOT EXISTS ad_impressions (
    id TEXT PRIMARY KEY,
    adId TEXT NOT NULL,
    userId TEXT, -- NULL for guest impressions
    sessionId TEXT,
    ipAddress TEXT,
    userAgent TEXT,
    pageUrl TEXT,
    viewedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (adId) REFERENCES advertisements(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Ad clicks tracking
CREATE TABLE IF NOT EXISTS ad_clicks (
    id TEXT PRIMARY KEY,
    adId TEXT NOT NULL,
    userId TEXT, -- NULL for guest clicks
    sessionId TEXT,
    ipAddress TEXT,
    userAgent TEXT,
    pageUrl TEXT,
    clickedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (adId) REFERENCES advertisements(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);
