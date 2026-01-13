-- ============================================
-- CALENDAR EVENTS
-- ============================================

CREATE TABLE "Event" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "caseId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "startTime" DATETIME NOT NULL,
  "endTime" DATETIME NOT NULL,
  "location" TEXT,
  "attendees" TEXT, -- JSON array of user IDs
  "reminderMinutes" INTEGER,
  "createdBy" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL,
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_event_firm" ON "Event"("firmId");
CREATE INDEX "idx_event_case" ON "Event"("caseId");
CREATE INDEX "idx_event_start" ON "Event"("startTime");

-- ============================================
-- CLIENT PORTAL
-- ============================================

CREATE TABLE "ClientUser" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "clientId" TEXT NOT NULL,
  "email" TEXT UNIQUE NOT NULL,
  "password" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "canViewCases" BOOLEAN NOT NULL DEFAULT true,
  "canUploadDocs" BOOLEAN NOT NULL DEFAULT true,
  "canDownloadDocs" BOOLEAN NOT NULL DEFAULT true,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastLogin" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE
);

CREATE TABLE "ClientMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "senderType" TEXT NOT NULL, -- 'CLIENT' or 'STAFF'
  "message" TEXT NOT NULL,
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_client_user_email" ON "ClientUser"("email");
CREATE INDEX "idx_client_user_client" ON "ClientUser"("clientId");
CREATE INDEX "idx_client_message_case" ON "ClientMessage"("caseId");
CREATE INDEX "idx_client_message_sender" ON "ClientMessage"("senderId");
