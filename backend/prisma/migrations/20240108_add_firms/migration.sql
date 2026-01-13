-- ============================================
-- FIRM/COMPANY SYSTEM
-- Multiple users under one firm with data isolation
-- ============================================

-- Create Firms table
CREATE TABLE "Firm" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmName" TEXT NOT NULL,
  "firmCode" TEXT NOT NULL UNIQUE,
  "industry" TEXT,
  "address" TEXT,
  "city" TEXT,
  "country" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "website" TEXT,
  "logo" TEXT,
  "subscriptionPlan" TEXT NOT NULL DEFAULT 'FREE',
  "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL',
  "subscriptionStartDate" DATETIME,
  "subscriptionEndDate" DATETIME,
  "maxUsers" INTEGER NOT NULL DEFAULT 5,
  "maxCases" INTEGER NOT NULL DEFAULT 50,
  "maxStorage" INTEGER NOT NULL DEFAULT 5368709120, -- 5GB in bytes
  "currentStorage" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- Add firmId to User table
ALTER TABLE "User" ADD COLUMN "firmId" TEXT;
ALTER TABLE "User" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "invitedBy" TEXT;
ALTER TABLE "User" ADD COLUMN "invitedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "joinedAt" DATETIME;

-- Add firmId to all main tables for data isolation
ALTER TABLE "Client" ADD COLUMN "firmId" TEXT NOT NULL;
ALTER TABLE "Case" ADD COLUMN "firmId" TEXT NOT NULL;
ALTER TABLE "Bundle" ADD COLUMN "firmId" TEXT NOT NULL;
ALTER TABLE "File" ADD COLUMN "firmId" TEXT NOT NULL;
ALTER TABLE "AuditLog" ADD COLUMN "firmId" TEXT NOT NULL;

-- Create FirmInvitation table
CREATE TABLE "FirmInvitation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'STAFF',
  "invitedBy" TEXT NOT NULL,
  "invitationToken" TEXT NOT NULL UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "expiresAt" DATETIME NOT NULL,
  "acceptedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("invitedBy") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create FirmSettings table
CREATE TABLE "FirmSettings" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL UNIQUE,
  "caseNumberPrefix" TEXT NOT NULL DEFAULT 'CASE',
  "caseNumberFormat" TEXT NOT NULL DEFAULT '{PREFIX}-{YEAR}-{NUMBER}',
  "fiscalYearStart" INTEGER NOT NULL DEFAULT 4, -- April
  "defaultCaseType" TEXT,
  "requireReview" BOOLEAN NOT NULL DEFAULT true,
  "requirePartnerApproval" BOOLEAN NOT NULL DEFAULT true,
  "autoArchiveAfterDays" INTEGER,
  "allowClientPortal" BOOLEAN NOT NULL DEFAULT false,
  "twoFactorRequired" BOOLEAN NOT NULL DEFAULT false,
  "passwordExpiryDays" INTEGER,
  "sessionTimeoutMinutes" INTEGER NOT NULL DEFAULT 480,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE
);

-- Create FirmBilling table
CREATE TABLE "FirmBilling" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "billingEmail" TEXT NOT NULL,
  "billingName" TEXT NOT NULL,
  "billingAddress" TEXT,
  "billingCity" TEXT,
  "billingCountry" TEXT,
  "billingPostcode" TEXT,
  "paymentMethod" TEXT,
  "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "lastPaymentDate" DATETIME,
  "nextPaymentDate" DATETIME,
  "amount" REAL,
  "currency" TEXT NOT NULL DEFAULT 'GBP',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX "idx_firm_code" ON "Firm"("firmCode");
CREATE INDEX "idx_user_firm" ON "User"("firmId");
CREATE INDEX "idx_client_firm" ON "Client"("firmId");
CREATE INDEX "idx_case_firm" ON "Case"("firmId");
CREATE INDEX "idx_bundle_firm" ON "Bundle"("firmId");
CREATE INDEX "idx_file_firm" ON "File"("firmId");
CREATE INDEX "idx_audit_firm" ON "AuditLog"("firmId");
CREATE INDEX "idx_invitation_email" ON "FirmInvitation"("email");
CREATE INDEX "idx_invitation_token" ON "FirmInvitation"("invitationToken");

-- Add foreign key constraints
ALTER TABLE "User" ADD FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE;
ALTER TABLE "Client" ADD FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE;
ALTER TABLE "Case" ADD FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE;
ALTER TABLE "Bundle" ADD FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE;
ALTER TABLE "File" ADD FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE;
ALTER TABLE "AuditLog" ADD FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE;
