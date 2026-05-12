-- Complete database schema for Premium Meat Shop
-- This file represents the full database structure after all migrations

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT DEFAULT 'BUYER',
    phone TEXT,
    isVerified BOOLEAN DEFAULT FALSE,
    address TEXT,
    city TEXT,
    state TEXT,
    zipCode TEXT,
    latitude REAL,
    longitude REAL,
    emailVerificationToken TEXT,
    emailVerificationExpires DATETIME,
    passwordResetToken TEXT,
    passwordResetExpires DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Addresses table
CREATE TABLE addresses (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    street TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zipCode TEXT NOT NULL,
    latitude REAL,
    longitude REAL,
    isDefault BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Product categories table
CREATE TABLE product_categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    parentId TEXT,
    imageUrl TEXT,
    sortOrder INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parentId) REFERENCES product_categories(id)
);

-- Product tags table
CREATE TABLE product_tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    color TEXT DEFAULT '#000000',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    originalPrice REAL,
    category TEXT NOT NULL,
    subCategory TEXT,
    images TEXT,
    weight REAL,
    weightUnit TEXT,
    inStock BOOLEAN DEFAULT TRUE,
    featured BOOLEAN DEFAULT FALSE,
    categories TEXT,
    tags TEXT,
    sku TEXT UNIQUE,
    barcode TEXT,
    brand TEXT,
    origin TEXT,
    storageConditions TEXT,
    expirationDate DATE,
    nutritionalInfo TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Product-tag relationship table
CREATE TABLE product_tag_relations (
    productId TEXT NOT NULL,
    tagId TEXT NOT NULL,
    PRIMARY KEY (productId, tagId),
    FOREIGN KEY (productId) REFERENCES products(id),
    FOREIGN KEY (tagId) REFERENCES product_tags(id)
);

-- Orders table
CREATE TABLE orders (
    id TEXT PRIMARY KEY,
    orderNumber TEXT UNIQUE,
    userId TEXT NOT NULL,
    items TEXT,
    totalAmount REAL NOT NULL,
    status TEXT DEFAULT 'PENDING',
    trackingNumber TEXT,
    estimatedDelivery DATETIME,
    actualDelivery DATETIME,
    deliveryFee REAL DEFAULT 0,
    taxAmount REAL DEFAULT 0,
    discountAmount REAL DEFAULT 0,
    couponCode TEXT,
    notes TEXT,
    deliveryAddress TEXT,
    deliveryInstructions TEXT,
    paymentMethod TEXT,
    paymentStatus TEXT DEFAULT 'PENDING',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Order items table
CREATE TABLE order_items (
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

-- Order status history table
CREATE TABLE order_status_history (
    id TEXT PRIMARY KEY,
    orderId TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT,
    changedBy TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (orderId) REFERENCES orders(id)
);

-- Reviews table
CREATE TABLE reviews (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    productId TEXT NOT NULL,
    rating INTEGER NOT NULL,
    comment TEXT,
    helpful INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);

-- Wishlist table
CREATE TABLE wishlist_items (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    productId TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);

-- Cart items table
CREATE TABLE cart_items (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    productId TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (productId) REFERENCES products(id)
);

-- Notifications table
CREATE TABLE notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT,
    isRead BOOLEAN DEFAULT FALSE,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Additional tables for advanced features would be added here
-- Including affiliates, subscriptions, returns, live chat, blog, coupons, etc.
