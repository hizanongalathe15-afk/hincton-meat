-- Returns table
-- Created: 2024-01-07

CREATE TABLE IF NOT EXISTS returns (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    userId TEXT NOT NULL,
    productId TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    refundAmount REAL,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED', 'PROCESSED'
    refundMethod TEXT,
    restockItem BOOLEAN DEFAULT TRUE,
    adminNotes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES orders(id),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);

-- Return items table
CREATE TABLE IF NOT EXISTS return_items (
    id TEXT PRIMARY KEY,
    returnId TEXT NOT NULL,
    productId TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    condition TEXT, -- 'NEW', 'USED', 'DAMAGED'
    reason TEXT,
    images TEXT, -- JSON format
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (returnId) REFERENCES returns(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);
