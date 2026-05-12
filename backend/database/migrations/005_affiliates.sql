-- Affiliates table
-- Created: 2024-01-05

CREATE TABLE IF NOT EXISTS affiliates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    company TEXT,
    website TEXT,
    commissionRate REAL DEFAULT 0.05,
    status TEXT DEFAULT 'PENDING',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Affiliate sales table
CREATE TABLE IF NOT EXISTS affiliate_sales (
    id TEXT PRIMARY KEY,
    affiliateId TEXT NOT NULL,
    orderId TEXT NOT NULL,
    commissionAmount REAL NOT NULL,
    status TEXT DEFAULT 'PENDING',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (affiliateId) REFERENCES affiliates(id),
    FOREIGN KEY (orderId) REFERENCES orders(id)
);

-- Affiliate payouts table
CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id TEXT PRIMARY KEY,
    affiliateId TEXT NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'PENDING',
    processedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (affiliateId) REFERENCES affiliates(id)
);
