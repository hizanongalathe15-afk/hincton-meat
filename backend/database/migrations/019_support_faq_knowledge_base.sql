-- ====================================================================
-- 019_support_faq_knowledge_base.sql
-- Support tickets enhancements, FAQ items, and Knowledge Base articles
-- ====================================================================

CREATE TABLE IF NOT EXISTS "faq_items" (
  "id" VARCHAR(30) PRIMARY KEY,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "category" VARCHAR(255),
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "keywords" TEXT,
  "views" INTEGER NOT NULL DEFAULT 0,
  "helpfulYes" INTEGER NOT NULL DEFAULT 0,
  "helpfulNo" INTEGER NOT NULL DEFAULT 0,
  "createdBy" VARCHAR(30),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "faq_items_category_idx" ON "faq_items"("category");
CREATE INDEX IF NOT EXISTS "faq_items_isActive_idx" ON "faq_items"("isActive");
CREATE INDEX IF NOT EXISTS "faq_items_sortOrder_idx" ON "faq_items"("sortOrder");

CREATE TABLE IF NOT EXISTS "knowledge_base_articles" (
  "id" VARCHAR(30) PRIMARY KEY,
  "title" VARCHAR(500) NOT NULL,
  "slug" VARCHAR(500) UNIQUE NOT NULL,
  "category" VARCHAR(255),
  "tags" TEXT,
  "excerpt" TEXT,
  "content" TEXT NOT NULL,
  "featuredImage" TEXT,
  "authorId" VARCHAR(30),
  "isPublished" BOOLEAN NOT NULL DEFAULT TRUE,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "views" INTEGER NOT NULL DEFAULT 0,
  "helpfulYes" INTEGER NOT NULL DEFAULT 0,
  "helpfulNo" INTEGER NOT NULL DEFAULT 0,
  "publishedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "knowledge_base_articles_slug_idx" ON "knowledge_base_articles"("slug");
CREATE INDEX IF NOT EXISTS "knowledge_base_articles_category_idx" ON "knowledge_base_articles"("category");
CREATE INDEX IF NOT EXISTS "knowledge_base_articles_isPublished_idx" ON "knowledge_base_articles"("isPublished");
CREATE INDEX IF NOT EXISTS "knowledge_base_articles_sortOrder_idx" ON "knowledge_base_articles"("sortOrder");
CREATE INDEX IF NOT EXISTS "knowledge_base_articles_createdAt_desc_idx" ON "knowledge_base_articles"("createdAt" DESC);

-- Support tickets enhancements
ALTER TABLE "support_tickets"
  ADD COLUMN IF NOT EXISTS "csatScore" INTEGER,
  ADD COLUMN IF NOT EXISTS "csatComment" TEXT,
  ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "attachments" JSONB;

ALTER TABLE "support_ticket_responses"
  ADD COLUMN IF NOT EXISTS "attachments" JSONB,
  ALTER COLUMN "message" TYPE TEXT;

CREATE INDEX IF NOT EXISTS "support_tickets_createdAt_desc_idx" ON "support_tickets"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "support_ticket_responses_createdAt_desc_idx" ON "support_ticket_responses"("createdAt" DESC);
