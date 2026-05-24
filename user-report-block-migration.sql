-- Migration for User Reporting and Blocking

-- 1. Create Enum Types
-- For user_reports reason
DROP TYPE IF EXISTS "public"."enum_user_reports_reason" CASCADE;
CREATE TYPE "public"."enum_user_reports_reason" AS ENUM (
  'HARASSMENT',
  'SPAM',
  'INAPPROPRIATE_CONTENT',
  'OTHER'
);

-- For user_reports status
DROP TYPE IF EXISTS "public"."enum_user_reports_status" CASCADE;
CREATE TYPE "public"."enum_user_reports_status" AS ENUM (
  'PENDING',
  'RESOLVED',
  'DISMISSED'
);

-- 2. Create user_reports table
CREATE TABLE IF NOT EXISTS "user_reports" (
  "id" UUID PRIMARY KEY,
  "reporterId" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "reportedId" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "reason" "enum_user_reports_reason" NOT NULL,
  "description" TEXT NOT NULL,
  "status" "enum_user_reports_status" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Create user_blocks table
CREATE TABLE IF NOT EXISTS "user_blocks" (
  "id" UUID PRIMARY KEY,
  "blockerId" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "blockedId" UUID NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE ("blockerId", "blockedId")
);

-- 4. Add Indexes for performance
CREATE INDEX IF NOT EXISTS "user_reports_reporterId_idx" ON "user_reports" ("reporterId");
CREATE INDEX IF NOT EXISTS "user_reports_reportedId_idx" ON "user_reports" ("reportedId");
CREATE INDEX IF NOT EXISTS "user_blocks_blockerId_idx" ON "user_blocks" ("blockerId");
CREATE INDEX IF NOT EXISTS "user_blocks_blockedId_idx" ON "user_blocks" ("blockedId");
