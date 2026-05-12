-- Abandoned cart recovery and analytics
-- Created: 2024-01-14

-- Abandoned carts table
CREATE TABLE IF NOT EXISTS abandoned_carts (
    id TEXT PRIMARY KEY,
    userId TEXT,
    sessionId TEXT, -- For guest carts
    email TEXT, -- Recovery email
    phone TEXT, -- Recovery phone
    totalItems INTEGER DEFAULT 0,
    totalValue REAL DEFAULT 0,
    lastActivityAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    recoverySent BOOLEAN DEFAULT FALSE,
    recoveryEmailSentAt DATETIME,
    recoveredAt DATETIME,
    status TEXT DEFAULT 'ABANDONED', -- 'ABANDONED', 'RECOVERED', 'EXPIRED'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Cart abandonment emails table
CREATE TABLE IF NOT EXISTS abandonment_emails (
    id TEXT PRIMARY KEY,
    cartId TEXT NOT NULL,
    templateType TEXT NOT NULL, -- '1_HOUR', '24_HOURS', '3_DAYS', '7_DAYS'
    subject TEXT NOT NULL,
    content TEXT NOT NULL,
    sentAt DATETIME,
    openedAt DATETIME,
    clickedAt DATETIME,
    recoveredAt DATETIME,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'DELIVERED', 'BOUNCED', 'FAILED'
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cartId) REFERENCES abandoned_carts(id)
);

-- Recovery tracking table
CREATE TABLE IF NOT EXISTS cart_recoveries (
    id TEXT PRIMARY KEY,
    cartId TEXT NOT NULL,
    userId TEXT, -- If recovered by registered user
    sessionId TEXT, -- If recovered by guest
    recoveryMethod TEXT NOT NULL, -- 'EMAIL', 'SMS', 'DIRECT_LINK'
    ipAddress TEXT,
    userAgent TEXT,
    recoveredAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    conversionValue REAL,
    FOREIGN KEY (cartId) REFERENCES abandoned_carts(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);
