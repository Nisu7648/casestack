-- ============================================
-- DOCUMENT TEMPLATES
-- Pre-built templates for common documents
-- ============================================

CREATE TABLE "Template" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT,
  "content" TEXT NOT NULL,
  "variables" TEXT, -- JSON array of variable names
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "GeneratedDocument" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "caseId" TEXT,
  "templateId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "generatedBy" TEXT NOT NULL,
  "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE SET NULL,
  FOREIGN KEY ("templateId") REFERENCES "Template"("id") ON DELETE CASCADE,
  FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_template_firm" ON "Template"("firmId");
CREATE INDEX "idx_template_category" ON "Template"("category");
CREATE INDEX "idx_generated_doc_firm" ON "GeneratedDocument"("firmId");
CREATE INDEX "idx_generated_doc_case" ON "GeneratedDocument"("caseId");
