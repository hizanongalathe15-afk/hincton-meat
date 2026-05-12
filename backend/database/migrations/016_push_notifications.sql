-- Push notifications and mobile app integration
-- Created: 2024-01-15

-- Push notification tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    platform TEXT NOT NULL, -- 'ios', 'android', 'web'
    deviceType TEXT, -- 'PHONE', 'TABLET', 'DESKTOP'
    appVersion TEXT,
    isActive BOOLEAN DEFAULT TRUE,
    lastUsedAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Push notifications table
CREATE TABLE IF NOT EXISTS push_notifications (
    id TEXT PRIMARY KEY,
    userId TEXT,
    tokenId TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON format for additional data
    imageUrl TEXT,
    actionUrl TEXT,
    actionType TEXT, -- 'OPEN_APP', 'OPEN_URL', 'DISMISS'
    priority TEXT DEFAULT 'NORMAL', -- 'LOW', 'NORMAL', 'HIGH', 'URGENT'
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'DELIVERED', 'FAILED', 'READ'
    sentAt DATETIME,
    deliveredAt DATETIME,
    readAt DATETIME,
    failureReason TEXT,
    retryCount INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (tokenId) REFERENCES push_tokens(id)
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL, -- 'ORDER_STATUS', 'PROMOTIONS', 'PRICE_ALERTS', 'NEWS'
    isEnabled BOOLEAN DEFAULT TRUE,
    quietHoursStart TIME, -- Start of quiet hours
    quietHoursEnd TIME, -- End of quiet hours
    categories TEXT, -- JSON array of allowed categories
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Notification campaigns table
CREATE TABLE IF NOT EXISTS notification_campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'PROMOTION', 'ANNOUNCEMENT', 'SURVEY'
    content TEXT NOT NULL, -- JSON format
    targetAudience TEXT, -- JSON format for targeting
    scheduledAt DATETIME,
    sentAt DATETIME,
    status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'COMPLETED', 'FAILED'
    totalRecipients INTEGER DEFAULT 0,
    deliveredCount INTEGER DEFAULT 0,
    readCount INTEGER DEFAULT 0,
    clickedCount INTEGER DEFAULT 0,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Campaign delivery table
CREATE TABLE IF NOT EXISTS campaign_deliveries (
    id TEXT PRIMARY KEY,
    campaignId TEXT NOT NULL,
    userId TEXT NOT NULL,
    tokenId TEXT,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'SENT', 'DELIVERED', 'FAILED'
    sentAt DATETIME,
    deliveredAt DATETIME,
    readAt DATETIME,
    clickedAt DATETIME,
    failureReason TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaignId) REFERENCES notification_campaigns(id),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (tokenId) REFERENCES push_tokens(id)
);
