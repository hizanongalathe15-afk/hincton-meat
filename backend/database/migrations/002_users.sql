-- Users table updates
-- Created: 2024-01-02

-- Add address fields to users table
ALTER TABLE users ADD COLUMN address TEXT;
ALTER TABLE users ADD COLUMN city TEXT;
ALTER TABLE users ADD COLUMN state TEXT;
ALTER TABLE users ADD COLUMN zipCode TEXT;
ALTER TABLE users ADD COLUMN latitude REAL;
ALTER TABLE users ADD COLUMN longitude REAL;

-- Create separate addresses table
CREATE TABLE IF NOT EXISTS addresses (
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

-- Add email verification fields
ALTER TABLE users ADD COLUMN emailVerificationToken TEXT;
ALTER TABLE users ADD COLUMN emailVerificationExpires DATETIME;
ALTER TABLE users ADD COLUMN passwordResetToken TEXT;
ALTER TABLE users ADD COLUMN passwordResetExpires DATETIME;
