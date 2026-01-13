-- ============================================
-- TASK MANAGEMENT
-- Tasks, assignments, due dates, comments
-- ============================================

CREATE TABLE "Task" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "firmId" TEXT NOT NULL,
  "caseId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "assignedTo" TEXT,
  "assignedBy" TEXT NOT NULL,
  "dueDate" DATETIME,
  "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
  "status" TEXT NOT NULL DEFAULT 'TODO',
  "completedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  FOREIGN KEY ("firmId") REFERENCES "Firm"("id") ON DELETE CASCADE,
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE,
  FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL,
  FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "TaskComment" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "taskId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "comment" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "TaskChecklist" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "taskId" TEXT NOT NULL,
  "item" TEXT NOT NULL,
  "isCompleted" BOOLEAN NOT NULL DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE
);

CREATE INDEX "idx_task_firm" ON "Task"("firmId");
CREATE INDEX "idx_task_case" ON "Task"("caseId");
CREATE INDEX "idx_task_assigned" ON "Task"("assignedTo");
CREATE INDEX "idx_task_status" ON "Task"("status");
CREATE INDEX "idx_task_due" ON "Task"("dueDate");
CREATE INDEX "idx_task_comment_task" ON "TaskComment"("taskId");
CREATE INDEX "idx_task_checklist_task" ON "TaskChecklist"("taskId");
