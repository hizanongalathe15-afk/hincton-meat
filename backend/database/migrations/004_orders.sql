-- Orders table updates
-- Created: 2024-01-04

-- Add order tracking fields
ALTER TABLE orders ADD COLUMN orderNumber TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN trackingNumber TEXT;
ALTER TABLE orders ADD COLUMN estimatedDelivery DATETIME;
ALTER TABLE orders ADD COLUMN actualDelivery DATETIME;
ALTER TABLE orders ADD COLUMN deliveryFee REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN taxAmount REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN discountAmount REAL DEFAULT 0;
ALTER TABLE orders ADD COLUMN couponCode TEXT;
ALTER TABLE orders ADD COLUMN notes TEXT;

-- Create order items table
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    productId TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unitPrice REAL NOT NULL,
    totalPrice REAL NOT NULL,
    notes TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES orders(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);

-- Create order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    changedBy TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES orders(id)
);
