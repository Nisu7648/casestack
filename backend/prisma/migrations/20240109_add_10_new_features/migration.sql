-- ============================================
-- 10 NEW GAME-CHANGING FEATURES
-- ============================================

-- 1. AI DOCUMENT ANALYSIS
CREATE TABLE "DocumentAnalysis" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "extractedData" TEXT NOT NULL,
  "rawText" TEXT,
  "analyzedBy" TEXT NOT NULL,
  "confidence" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("analyzedBy") REFERENCES "User"("id") ON DELETE CASCADE
);

-- 2. EMAIL INTEGRATION
CREATE TABLE "EmailSync" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "caseId" TEXT,
  "emailProvider" TEXT NOT NULL,
  "emailAddress" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "fromAddress" TEXT NOT NULL,
  "toAddress" TEXT NOT NULL,
  "receivedAt" DATETIME NOT NULL,
  "syncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL
);

-- 3. WHATSAPP INTEGRATION
CREATE TABLE "WhatsAppMessage" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "caseId" TEXT,
  "clientPhone" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "sentBy" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL,
  FOREIGN KEY ("sentBy") REFERENCES "User"("id") ON DELETE SET NULL
);

-- 4. E-SIGNATURE
CREATE TABLE "Signature" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "documentId" TEXT NOT NULL,
  "signerName" TEXT NOT NULL,
  "signerEmail" TEXT NOT NULL,
  "signatureData" TEXT NOT NULL,
  "ipAddress" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "signedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE
);

-- 5. AUTOMATED WORKFLOWS
CREATE TABLE "Workflow" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "trigger" TEXT NOT NULL,
  "conditions" TEXT NOT NULL,
  "actions" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "WorkflowExecution" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workflowId" TEXT NOT NULL,
  "caseId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'RUNNING',
  "result" TEXT,
  "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("workflowId") REFERENCES "Workflow"("id") ON DELETE CASCADE,
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL
);

-- 6. TIME TRACKING
CREATE TABLE "TimeEntry" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "caseId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "hours" REAL NOT NULL,
  "rate" REAL NOT NULL,
  "amount" REAL NOT NULL,
  "isBillable" BOOLEAN NOT NULL DEFAULT true,
  "date" DATETIME NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE
);

-- 7. INVOICE GENERATION
CREATE TABLE "Invoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "clientId" TEXT NOT NULL,
  "caseId" TEXT,
  "invoiceNumber" TEXT NOT NULL UNIQUE,
  "amount" REAL NOT NULL,
  "tax" REAL NOT NULL DEFAULT 0,
  "total" REAL NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "dueDate" DATETIME,
  "paidAt" DATETIME,
  "notes" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE,
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL,
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "InvoiceItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceId" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "quantity" REAL NOT NULL DEFAULT 1,
  "rate" REAL NOT NULL,
  "amount" REAL NOT NULL,
  FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE
);

-- 8. DOCUMENT OCR
CREATE TABLE "OCRResult" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "fileId" TEXT NOT NULL,
  "extractedText" TEXT NOT NULL,
  "confidence" INTEGER NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'en',
  "processedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE
);

-- 9. DEADLINE REMINDERS
CREATE TABLE "Reminder" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "caseId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" DATETIME NOT NULL,
  "reminderDate" DATETIME NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "sentAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL
);

-- 10. CLIENT ONBOARDING
CREATE TABLE "OnboardingForm" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "fields" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdBy" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "OnboardingSubmission" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "formId" TEXT NOT NULL,
  "clientId" TEXT,
  "data" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("formId") REFERENCES "OnboardingForm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX "idx_document_analysis_firm" ON "DocumentAnalysis"("firmId");
CREATE INDEX "idx_email_sync_case" ON "EmailSync"("caseId");
CREATE INDEX "idx_whatsapp_case" ON "WhatsAppMessage"("caseId");
CREATE INDEX "idx_signature_case" ON "Signature"("caseId");
CREATE INDEX "idx_workflow_firm" ON "Workflow"("firmId");
CREATE INDEX "idx_time_entry_case" ON "TimeEntry"("caseId");
CREATE INDEX "idx_time_entry_user" ON "TimeEntry"("userId");
CREATE INDEX "idx_invoice_client" ON "Invoice"("clientId");
CREATE INDEX "idx_invoice_case" ON "Invoice"("caseId");
CREATE INDEX "idx_reminder_user" ON "Reminder"("userId");
CREATE INDEX "idx_reminder_due_date" ON "Reminder"("dueDate");
CREATE INDEX "idx_onboarding_form_firm" ON "OnboardingForm"("firmId");
