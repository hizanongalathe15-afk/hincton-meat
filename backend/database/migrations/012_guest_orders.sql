-- Guest orders and cart management
-- Created: 2024-01-11

-- Guest users table
CREATE TABLE IF NOT EXISTS guest_users (
    id TEXT PRIMARY KEY,
    email TEXT,
    phone TEXT,
    firstName TEXT,
    lastName TEXT,
    sessionId TEXT UNIQUE NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    expiresAt DATETIME
);

-- Guest cart items table
CREATE TABLE IF NOT EXISTS guest_cart_items (
    id TEXT PRIMARY KEY,
    sessionId TEXT NOT NULL,
    productId TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    customizations TEXT, -- JSON format
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sessionId) REFERENCES guest_users(sessionId),
    FOREIGN KEY (productId) REFERENCES products(id)
);

-- Guest orders table
CREATE TABLE IF NOT EXISTS guest_orders (
    id TEXT PRIMARY KEY,
    sessionId TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    firstName TEXT,
    lastName TEXT,
    items TEXT NOT NULL, -- JSON format
    totalAmount REAL NOT NULL,
    status TEXT DEFAULT 'PENDING',
    deliveryAddress TEXT, -- JSON format
    deliveryInstructions TEXT,
    paymentMethod TEXT,
    paymentStatus TEXT DEFAULT 'PENDING',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sessionId) REFERENCES guest_users(sessionId)
);

-- Cart conversion tracking
CREATE TABLE IF NOT EXISTS cart_conversions (
    id TEXT PRIMARY KEY,
    sessionId TEXT,
    userId TEXT, -- When guest converts to registered user
    conversionType TEXT NOT NULL, -- 'REGISTER', 'ORDER', 'ABANDONED'
    conversionData TEXT, -- JSON format
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sessionId) REFERENCES guest_users(sessionId),
    FOREIGN KEY (userId) REFERENCES users(id)
);
