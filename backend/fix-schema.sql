-- Quick fix: Make firmId optional for users
-- Run this after initial migration if needed

ALTER TABLE "users" ALTER COLUMN "firmId" DROP NOT NULL;
