-- Deal banners table for grouped clearance sections, hot deals, etc.
-- The orange/red headers in the screenshot like "Top Deals | Clearance Sale", "Clearance Deals | Phones & Accessories See All"
CREATE TABLE IF NOT EXISTS deal_banners (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subtitle TEXT,
    bannerColor TEXT DEFAULT '#FF5500',
    textColor TEXT DEFAULT '#FFFFFF',
    bannerImage TEXT,
    productIds TEXT, -- JSON array of product IDs
    categoryId TEXT,
    flashSaleId TEXT,
    seeAllUrl TEXT,
    seeAllLabel TEXT DEFAULT 'See All',
    sortOrder INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT TRUE,
    startDate DATETIME,
    endDate DATETIME,
    totalClicks INTEGER DEFAULT 0,
    totalImpressions INTEGER DEFAULT 0,
    createdBy TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (flashSaleId) REFERENCES flash_sales(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_deal_banners_active ON deal_banners(isActive);
CREATE INDEX IF NOT EXISTS idx_deal_banners_sort ON deal_banners(sortOrder);
CREATE INDEX IF NOT EXISTS idx_deal_banners_window ON deal_banners(startDate, endDate);
