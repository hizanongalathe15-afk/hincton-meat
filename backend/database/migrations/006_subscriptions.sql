-- Subscriptions table
-- Created: 2024-01-06

CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL, -- 'MEAT_BOX', 'WEEKLY_DELIVERY'
    planName TEXT NOT NULL,
    price REAL NOT NULL,
    frequency TEXT, -- 'weekly', 'biweekly', 'monthly'
    deliveryDay TEXT, -- 'monday', 'tuesday', etc.
    deliveryTime TEXT,
    isPaused BOOLEAN DEFAULT FALSE,
    nextDeliveryDate DATETIME,
    status TEXT DEFAULT 'ACTIVE',
    preferences TEXT, -- JSON format for meat preferences
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Subscription items table
CREATE TABLE IF NOT EXISTS subscription_items (
    id TEXT PRIMARY KEY,
    subscriptionId TEXT NOT NULL,
    productId TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    customizations TEXT, -- JSON format
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);

-- Subscription deliveries table
CREATE TABLE IF NOT EXISTS subscription_deliveries (
    id TEXT PRIMARY KEY,
    subscriptionId TEXT NOT NULL,
    deliveryDate DATETIME NOT NULL,
    status TEXT DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'DELIVERED', 'MISSED'
    items TEXT, -- JSON format
    deliveryNotes TEXT,
    driverNotes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subscriptionId) REFERENCES subscriptions(id)
);
