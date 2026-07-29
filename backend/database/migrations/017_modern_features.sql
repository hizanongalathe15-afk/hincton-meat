-- Modern e-commerce features consolidation migration
-- Created: 2026-07-25
-- Scope: newsletter, wishlist shares, review helpful (if missing), loyalty, spin-win,
--        printable return labels, back-in-stock notifications, social proof events,
--        A/B experiments, analytics CWV events, PWA install tracking.

-- Newsletter subscribers (double opt-in)
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    firstName TEXT,
    lastName TEXT,
    source TEXT DEFAULT 'WEBSITE', -- EXIT_INTENT, FOOTER, CHECKOUT, POPUP, IMPORT
    tags TEXT, -- comma-separated segments
    subscribed BOOLEAN DEFAULT TRUE,
    doubleOptInToken TEXT,
    doubleOptInAt DATETIME,
    unsubscribeToken TEXT,
    unsubscribedAt DATETIME,
    reason TEXT,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribed ON newsletter_subscribers(subscribed);

-- Shared wishlist tokens
CREATE TABLE IF NOT EXISTS wishlist_shares (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    wishlistId TEXT,
    token TEXT NOT NULL UNIQUE,
    title TEXT,
    recipientEmail TEXT,
    recipientName TEXT,
    publicViewCount INTEGER DEFAULT 0,
    itemAddedToCartCount INTEGER DEFAULT 0,
    expiresAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_token ON wishlist_shares(token);

-- Review helpful votes (separate many-to-many; supplements existing flag)
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id TEXT PRIMARY KEY,
    reviewId TEXT NOT NULL,
    userId TEXT NOT NULL,
    helpful BOOLEAN NOT NULL, -- true=helpful, false=not_helpful
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reviewId, userId),
    FOREIGN KEY (reviewId) REFERENCES product_reviews(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_review_helpful_review ON review_helpful_votes(reviewId);

-- Loyalty ledger (points in/out)
CREATE TABLE IF NOT EXISTS loyalty_points (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    points INTEGER NOT NULL,
    type TEXT NOT NULL, -- ORDER, REVIEW, REFERRAL, BIRTHDAY, SPIN_WIN, MANUAL, ADJUST, EXPIRE, REDEEM
    reason TEXT,
    referenceId TEXT, -- e.g., orderId
    expiresAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_loyalty_user ON loyalty_points(userId);

-- Loyalty badges
CREATE TABLE IF NOT EXISTS loyalty_badges (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    badgeCode TEXT NOT NULL, -- FIRST_ORDER, FREQUENT_BUYER, REVIEWER, AMBASSADOR, TOP_CUSTOMER
    title TEXT NOT NULL,
    description TEXT,
    earnedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(userId, badgeCode),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

-- Spin-to-win plays + prizes
CREATE TABLE IF NOT EXISTS spin_win_plays (
    id TEXT PRIMARY KEY,
    userId TEXT,
    email TEXT,
    phone TEXT,
    sessionId TEXT,
    segment TEXT DEFAULT 'DEFAULT',
    prizeCode TEXT NOT NULL, -- COUPON_10, COUPON_FREE_SHIP, LOYALTY_POINTS_50, NO_PRIZE
    prizeLabel TEXT,
    couponId TEXT,
    pointsAwarded INTEGER DEFAULT 0,
    status TEXT DEFAULT 'AWARDED', -- AWARDED, REDEEMED, EXPIRED, REVOKED
    redeemedAt DATETIME,
    expiresAt DATETIME,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (couponId) REFERENCES coupons(id) ON DELETE SET NULL
);

-- Return labels (printable)
CREATE TABLE IF NOT EXISTS return_labels (
    id TEXT PRIMARY KEY,
    returnRequestId TEXT NOT NULL UNIQUE,
    userId TEXT NOT NULL,
    orderId TEXT NOT NULL,
    trackingNumber TEXT,
    carrier TEXT,
    qrCodeData TEXT,
    pdfUrl TEXT,
    labelText TEXT NOT NULL,
    printedAt DATETIME,
    expiresAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (returnRequestId) REFERENCES return_requests(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
);

-- Back in stock alerts
CREATE TABLE IF NOT EXISTS back_in_stock_alerts (
    id TEXT PRIMARY KEY,
    productId TEXT NOT NULL,
    variantId TEXT,
    email TEXT,
    phone TEXT,
    userId TEXT,
    notifiedAt DATETIME,
    notificationStatus TEXT DEFAULT 'PENDING', -- PENDING, SENT, FAILED, CANCELED
    sentVia TEXT, -- EMAIL, SMS, BOTH
    expiresAt DATETIME,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (productId) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_bisa_product ON back_in_stock_alerts(productId);
CREATE INDEX IF NOT EXISTS idx_bisa_status ON back_in_stock_alerts(notificationStatus);

-- Social proof events (live purchase notifications, live viewers)
CREATE TABLE IF NOT EXISTS social_proof_events (
    id TEXT PRIMARY KEY,
    eventType TEXT NOT NULL, -- PURCHASE, VIEW, CART_ADD, REVIEW
    productId TEXT,
    city TEXT,
    country TEXT,
    customerInitials TEXT,
    quantity INTEGER DEFAULT 1,
    ipAddress TEXT,
    sessionId TEXT,
    userId TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_social_proof_type_time ON social_proof_events(eventType, createdAt);

-- A/B experiment assignments
CREATE TABLE IF NOT EXISTS ab_experiment_assignments (
    id TEXT PRIMARY KEY,
    experimentKey TEXT NOT NULL,
    variant TEXT NOT NULL,
    userId TEXT,
    sessionId TEXT NOT NULL,
    assignedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(experimentKey, sessionId),
    FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

-- Core Web Vitals telemetry
CREATE TABLE IF NOT EXISTS cwv_events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- LCP, FID, CLS, INP, TTFB, FCP
    value REAL NOT NULL,
    rating TEXT NOT NULL, -- good, needs-improvement, poor
    path TEXT,
    sessionId TEXT,
    userId TEXT,
    userAgent TEXT,
    connectionType TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cwv_name_time ON cwv_events(name, createdAt);

-- PWA install tracking
CREATE TABLE IF NOT EXISTS pwa_install_events (
    id TEXT PRIMARY KEY,
    userId TEXT,
    sessionId TEXT,
    platform TEXT,
    acceptedInstall BOOLEAN,
    dismissedAt DATETIME,
    installedAt DATETIME,
    ipAddress TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
