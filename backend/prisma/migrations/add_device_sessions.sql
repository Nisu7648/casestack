-- ============================================
-- CASESTACK DEVICE SESSION MIGRATION
-- Add DeviceSession table for max 3 devices per user
-- ============================================

-- Create DeviceSession table
CREATE TABLE "DeviceSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceName" TEXT,
    "deviceType" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "token" TEXT NOT NULL UNIQUE,
    "refreshToken" TEXT UNIQUE,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "DeviceSession_userId_fkey" FOREIGN KEY ("userId") 
        REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for DeviceSession
CREATE INDEX "DeviceSession_userId_isActive_idx" ON "DeviceSession"("userId", "isActive");
CREATE INDEX "DeviceSession_token_idx" ON "DeviceSession"("token");
CREATE INDEX "DeviceSession_deviceId_idx" ON "DeviceSession"("deviceId");
CREATE INDEX "DeviceSession_expiresAt_idx" ON "DeviceSession"("expiresAt");

-- Add maxDevicesPerUser to FirmSettings
ALTER TABLE "FirmSettings" ADD COLUMN "maxDevicesPerUser" INTEGER NOT NULL DEFAULT 3;

-- Update AuditAction enum to include device-related actions
-- Note: This depends on your database. For PostgreSQL:
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DEVICE_REGISTERED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DEVICE_REMOVED';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DEVICE_LIMIT_EXCEEDED';

-- ============================================
-- CLEANUP SCRIPT (Run periodically via cron)
-- ============================================

-- Create function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_device_sessions()
RETURNS INTEGER AS $$
DECLARE
    affected_rows INTEGER;
BEGIN
    UPDATE "DeviceSession"
    SET "isActive" = false
    WHERE "isActive" = true
    AND "expiresAt" < NOW();
    
    GET DIAGNOSTICS affected_rows = ROW_COUNT;
    RETURN affected_rows;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check active sessions per user
-- SELECT 
--     u."email",
--     u."firstName",
--     u."lastName",
--     COUNT(ds."id") as "activeSessions"
-- FROM "User" u
-- LEFT JOIN "DeviceSession" ds ON u."id" = ds."userId" 
--     AND ds."isActive" = true 
--     AND ds."expiresAt" > NOW()
-- GROUP BY u."id", u."email", u."firstName", u."lastName"
-- ORDER BY "activeSessions" DESC;

-- Check device sessions for a specific user
-- SELECT 
--     "deviceName",
--     "deviceType",
--     "browser",
--     "os",
--     "ipAddress",
--     "lastActivityAt",
--     "createdAt",
--     "isActive"
-- FROM "DeviceSession"
-- WHERE "userId" = 'USER_ID_HERE'
-- ORDER BY "lastActivityAt" DESC;

-- ============================================
-- ROLLBACK (if needed)
-- ============================================

-- DROP TABLE IF EXISTS "DeviceSession" CASCADE;
-- ALTER TABLE "FirmSettings" DROP COLUMN IF EXISTS "maxDevicesPerUser";
-- DROP FUNCTION IF EXISTS cleanup_expired_device_sessions();
