-- Make firmId optional for users
ALTER TABLE "users" ALTER COLUMN "firmId" DROP NOT NULL;
