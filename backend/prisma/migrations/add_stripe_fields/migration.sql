-- Add Stripe fields to Firm table
ALTER TABLE "firms" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "firms" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "firms" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;
ALTER TABLE "firms" ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT;
ALTER TABLE "firms" ADD COLUMN IF NOT EXISTS "subscriptionEndsAt" TIMESTAMP(3);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS "firms_stripeCustomerId_idx" ON "firms"("stripeCustomerId");
CREATE INDEX IF NOT EXISTS "firms_stripeSubscriptionId_idx" ON "firms"("stripeSubscriptionId");
