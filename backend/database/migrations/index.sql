-- Database migration index
-- This file tracks all migrations for the Premium Meat Shop database
-- Run migrations in order to properly set up the database schema

-- Migration order:
-- 001_init.sql - Initial database schema
-- 002_users.sql - User table updates with addresses and verification
-- 003_products.sql - Product categories, tags, and enhanced fields
-- 004_orders.sql - Order tracking, items, and status history
-- 005_affiliates.sql - Affiliate system
-- 006_subscriptions.sql - Subscription management
-- 007_returns.sql - Returns and refunds
-- 008_livechat.sql - Live chat and support system
-- 009_blog.sql - Blog and content management
-- 010_coupons.sql - Coupons and promotions
-- 012_guest_orders.sql - Guest orders and cart management
-- 013_product_metrics.sql - Product analytics and metrics
-- 013_sponsored_products.sql - Sponsored products and advertising
-- 015_abandoned_carts.sql - Cart abandonment recovery
-- 016_push_notifications.sql - Push notifications and mobile app
-- promos.sql - Additional promotional system

-- Migration tracking table (optional)
CREATE TABLE IF NOT EXISTS migration_history (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    version TEXT NOT NULL,
    appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    checksum TEXT,
    status TEXT DEFAULT 'APPLIED' -- 'PENDING', 'APPLIED', 'FAILED', 'ROLLED_BACK'
);

-- Instructions for running migrations:
-- 1. Run migrations in numerical order
-- 2. Track migration history in migration_history table
-- 3. Support rollback functionality
-- 4. Include data seeding after initial migration
