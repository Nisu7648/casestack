# 🏛️ CASESTACK — ENTERPRISE BUILD MASTER SPECIFICATION

## 🎯 ROLE & AUTHORITY

**You are a principal enterprise software architect** who has built internal systems for Big-4 consulting firms (Deloitte, PwC, EY, KPMG) and global advisory companies (McKinsey, BCG, Bain).

**You understand:**
- Consulting workflows at scale
- Partner review hierarchies
- Audit defensibility requirements
- Regulatory compliance (SOX, GDPR, ISO)
- Long-term system design (10+ year lifecycle)
- Enterprise procurement processes

**You are building CASESTACK:**
- A desktop-first, enterprise consulting system
- Designed for internal adoption by Big-4 firms
- Built to replace legacy systems like SharePoint + Word + Email
- Must handle 10,000+ consultants per firm
- Must survive 10+ years of regulatory scrutiny

---

## 🔒 CORE PRODUCT PHILOSOPHY (NON-NEGOTIABLE)

### **1. System of Record, Not Productivity App**
- ✅ Source of truth for all consulting deliverables
- ✅ Permanent record of all work
- ✅ Audit trail for every change
- ❌ NOT a collaboration tool
- ❌ NOT a project management system
- ❌ NOT a productivity enhancer

### **2. No AI, No Automation Hype**
- ✅ Deterministic, predictable behavior
- ✅ Human-controlled workflows
- ✅ Explicit approvals
- ❌ NO AI-generated content
- ❌ NO automated decisions
- ❌ NO "smart" suggestions

### **3. No File Storage (Only References)**
- ✅ Evidence metadata and references
- ✅ Links to firm's existing storage (SharePoint, Box)
- ✅ Checksums for integrity verification
- ❌ NO file uploads
- ❌ NO document storage
- ❌ NO binary data

### **4. No Mobile Support**
- ✅ Desktop-first (Windows, Mac)
- ✅ Large screens for complex reports
- ✅ Keyboard shortcuts for power users
- ❌ NO mobile apps
- ❌ NO responsive design
- ❌ NO touch interfaces

### **5. No Consumer UX**
- ✅ Enterprise UI patterns
- ✅ Dense information display
- ✅ Keyboard-driven workflows
- ❌ NO animations
- ❌ NO gamification
- ❌ NO "delightful" interactions

### **6. Data Ownership Stays with Firm**
- ✅ On-premise deployment option
- ✅ Private cloud (firm's AWS/Azure)
- ✅ Full data export at any time
- ❌ NO vendor lock-in
- ❌ NO shared infrastructure
- ❌ NO cross-firm data

### **7. Every Action Must Be Defensible Years Later**
- ✅ Immutable audit log
- ✅ Digital signatures
- ✅ Timestamp verification
- ✅ User attribution
- ✅ Before/after state capture
- ❌ NO action without audit trail

### **8. If It Increases Risk, Noise, or Complexity → Reject**
- ✅ Simple, predictable workflows
- ✅ Minimal configuration
- ✅ Clear responsibility chains
- ❌ NO optional features
- ❌ NO customization
- ❌ NO plugins

---

## 🏛️ ENTERPRISE POSITIONING

**CASESTACK exists for one reason:**

> To standardize how consulting work becomes a final, defensible report — across years, teams, and partners.

**Target Customers:**
- Big-4 accounting firms (Deloitte, PwC, EY, KPMG)
- Top-tier consulting firms (McKinsey, BCG, Bain)
- Global advisory firms (Accenture, Capgemini)
- Boutique consulting firms (500+ consultants)

**Replacement Targets:**
- SharePoint + Word + Email workflows
- Legacy document management systems
- Custom-built internal tools
- Manual review processes

**Value Proposition:**
- Standardized report structure
- Enforced review workflows
- Complete audit trail
- Partner-level control
- Regulatory compliance
- 10+ year data retention

---

## 🧩 COMPLETE MODULE ARCHITECTURE (ENTERPRISE LEVEL)

**Design Principles:**
- Each module is independent
- Each module is enforceable
- Each module is auditable
- Each module is replaceable without breaking others
- No circular dependencies
- Clear ownership boundaries

---

## 🟦 MODULE 1 — FIRM & GOVERNANCE LAYER

### **Purpose**
Establish enterprise ownership, isolation, and authority.

### **Responsibilities**
1. **Firm Entity**
   - Firm ID (immutable)
   - Firm name
   - Legal entity name
   - Registration number
   - Headquarters location

2. **Country (Pricing & Regulatory Context)**
   - Primary country
   - Operating countries
   - Regulatory jurisdictions
   - Tax jurisdictions

3. **Firm-Level Configuration**
   - Report numbering scheme
   - Evidence numbering scheme
   - Retention policies
   - Approval hierarchies
   - Digital signature requirements

4. **Legal Entity Metadata**
   - Legal structure
   - Regulatory licenses
   - Insurance policies
   - Compliance certifications

5. **Firm Isolation (Strict Multi-Tenant Boundary)**
   - Database-level isolation
   - Encryption at rest
   - Encryption in transit
   - Access logging

### **Governance Rules**

**Rule 1: Firm Isolation**
```
IF user.firmId != data.firmId THEN
  DENY ACCESS
  LOG VIOLATION
  ALERT SECURITY TEAM
END IF
```

**Rule 2: No Cross-Firm Visibility**
```
EVERY query MUST include firmId filter
EVERY API endpoint MUST validate firmId
EVERY report MUST be firm-scoped
```

**Rule 3: Soft Delete with Audit Trail**
```
DELETE operation:
  SET deleted = true
  SET deletedAt = NOW()
  SET deletedBy = currentUser
  LOG TO AUDIT
  NEVER physically delete
```

### **Data Model**
```prisma
model Firm {
  id                String   @id @default(cuid())
  
  // Identity
  name              String
  legalName         String
  registrationNumber String  @unique
  
  // Location
  country           String
  operatingCountries String[]
  
  // Configuration
  reportNumberPrefix String  @default("RPT")
  evidenceNumberPrefix String @default("EVD")
  retentionYears    Int      @default(10)
  
  // Compliance
  regulatoryLicenses Json?
  certifications    Json?
  
  // Relationships
  users             User[]
  clients           Client[]
  reports           Report[]
  auditLogs         AuditLog[]
  
  // Audit
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deleted           Boolean  @default(false)
  deletedAt         DateTime?
  deletedBy         String?
  
  @@index([country])
  @@index([deleted])
}
```

---

## 🟦 MODULE 2 — IDENTITY, ROLES & CONTROL

### **Purpose**
Establish strict role-based access control with explicit permissions.

### **Roles (Strict Hierarchy)**

**1. Admin**
- System configuration
- User management
- Audit log access
- Firm settings
- Cannot override Partner decisions

**2. Partner**
- Final approval authority
- Digital signature rights
- Report lock/unlock
- Audit log access
- Cannot be overridden

**3. Manager**
- Review reports
- Approve for Partner review
- Assign consultants
- Cannot finalize reports

**4. Consultant**
- Create reports
- Edit draft reports
- Submit for review
- Cannot approve own work

**5. Viewer**
- Read-only access
- View finalized reports
- View audit logs (own actions)
- Cannot edit anything

### **Permission Matrix**

| Action | Admin | Partner | Manager | Consultant | Viewer |
|--------|-------|---------|---------|------------|--------|
| Create Report | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit Draft | ✅ | ✅ | ✅ | ✅ | ❌ |
| Submit for Review | ✅ | ✅ | ✅ | ✅ | ❌ |
| Review Report | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve Report | ✅ | ✅ | ❌ | ❌ | ❌ |
| Sign Off (Final) | ✅ | ✅ | ❌ | ❌ | ❌ |
| Lock Report | ✅ | ✅ | ❌ | ❌ | ❌ |
| Unlock Report | ✅ | ✅ | ❌ | ❌ | ❌ |
| View Audit Log | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export Data | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ | ❌ |
| Configure Firm | ✅ | ❌ | ❌ | ❌ | ❌ |

### **Capabilities**

**1. Role-Based Permission Matrix**
```typescript
const PERMISSIONS = {
  ADMIN: [
    'system.configure',
    'users.manage',
    'audit.view',
    'reports.all',
    'data.export'
  ],
  PARTNER: [
    'reports.approve',
    'reports.sign',
    'reports.lock',
    'audit.view',
    'data.export'
  ],
  MANAGER: [
    'reports.review',
    'reports.assign',
    'consultants.manage'
  ],
  CONSULTANT: [
    'reports.create',
    'reports.edit_draft',
    'reports.submit'
  ],
  VIEWER: [
    'reports.view_final'
  ]
};
```

**2. Explicit Approval Rights**
```typescript
function canApprove(user: User, report: Report): boolean {
  // Must be Partner or Manager
  if (!['PARTNER', 'MANAGER'].includes(user.role)) {
    return false;
  }
  
  // Cannot approve own work
  if (report.leadConsultantId === user.id) {
    return false;
  }
  
  // Report must be in correct status
  if (report.status !== 'IN_REVIEW') {
    return false;
  }
  
  // Manager can only approve for Partner review
  if (user.role === 'MANAGER' && report.reviewLevel === 'PARTNER') {
    return false;
  }
  
  return true;
}
```

**3. Read-Only Enforcement**
```typescript
function enforceReadOnly(user: User, report: Report): void {
  // Locked reports are read-only for everyone except Partner
  if (report.status === 'LOCKED' && user.role !== 'PARTNER') {
    throw new Error('Report is locked');
  }
  
  // Finalized reports are read-only for Consultants
  if (report.status === 'FINAL' && user.role === 'CONSULTANT') {
    throw new Error('Report is finalized');
  }
  
  // Viewers can never edit
  if (user.role === 'VIEWER') {
    throw new Error('Viewer role cannot edit');
  }
}
```

### **No Implicit Permissions**
```typescript
// WRONG: Implicit permission based on relationship
if (report.teamMembers.includes(user.id)) {
  allowEdit();
}

// RIGHT: Explicit permission check
if (hasPermission(user, 'reports.edit', report)) {
  allowEdit();
}
```

### **Data Model**
```prisma
model User {
  id                String   @id @default(cuid())
  
  // Identity
  email             String   @unique
  password          String   // Hashed
  
  firstName         String
  lastName          String
  employeeId        String?  @unique
  
  // Role & Permissions
  role              UserRole
  permissions       String[] // Explicit permissions
  
  // Firm
  firmId            String
  firm              Firm     @relation(fields: [firmId], references: [id])
  
  // Status
  isActive          Boolean  @default(true)
  lastLoginAt       DateTime?
  
  // Digital Signature
  signatureHash     String?  // For Partner sign-off
  signatureCert     String?  // Digital certificate
  
  // Audit
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  deleted           Boolean  @default(false)
  deletedAt         DateTime?
  
  @@index([firmId])
  @@index([role])
  @@index([isActive])
}

enum UserRole {
  ADMIN
  PARTNER
  MANAGER
  CONSULTANT
  VIEWER
}
```

---

## 🟦 MODULE 3 — IMMUTABLE ACTIVITY & AUDIT LOG

### **Purpose**
This is non-optional and core to Big-4 adoption. Every action must be traceable, defensible, and permanent.

### **Requirements**

**1. Append-Only Logs**
```sql
-- Audit log table has NO UPDATE or DELETE permissions
GRANT INSERT ON audit_logs TO application_user;
GRANT SELECT ON audit_logs TO application_user;
REVOKE UPDATE ON audit_logs FROM application_user;
REVOKE DELETE ON audit_logs FROM application_user;
```

**2. No Edits, No Deletes**
- Once written, audit log entries are immutable
- No UPDATE statements allowed
- No DELETE statements allowed
- Database-level enforcement

**3. Captures Everything**
```typescript
interface AuditLogEntry {
  // Who
  userId: string;
  userRole: UserRole;
  userEmail: string;
  
  // What
  action: AuditAction;
  entity: string;
  entityId: string;
  
  // When
  timestamp: Date;
  
  // Where
  ipAddress: string;
  userAgent: string;
  location?: string;
  
  // State
  beforeState?: object;
  afterState?: object;
  stateHash?: string; // SHA-256 of state
  
  // Context
  metadata?: object;
  reason?: string; // For sensitive actions
  
  // Firm
  firmId: string;
}
```

**4. Actions Logged**
```typescript
enum AuditAction {
  // Authentication
  USER_LOGIN,
  USER_LOGOUT,
  USER_LOGIN_FAILED,
  
  // Report Lifecycle
  REPORT_CREATED,
  REPORT_UPDATED,
  REPORT_DELETED,
  REPORT_SUBMITTED,
  REPORT_REVIEWED,
  REPORT_APPROVED,
  REPORT_REJECTED,
  REPORT_FINALIZED,
  REPORT_LOCKED,
  REPORT_UNLOCKED,
  REPORT_SIGNED,
  
  // Sections
  SECTION_ADDED,
  SECTION_UPDATED,
  SECTION_DELETED,
  
  // Evidence
  EVIDENCE_ADDED,
  EVIDENCE_UPDATED,
  EVIDENCE_DELETED,
  EVIDENCE_VERIFIED,
  EVIDENCE_REJECTED,
  
  // Reviews
  REVIEW_CREATED,
  REVIEW_SUBMITTED,
  REVIEW_APPROVED,
  REVIEW_REJECTED,
  
  // Comments
  COMMENT_ADDED,
  COMMENT_UPDATED,
  COMMENT_DELETED,
  COMMENT_RESOLVED,
  
  // Users
  USER_CREATED,
  USER_UPDATED,
  USER_DEACTIVATED,
  USER_ROLE_CHANGED,
  
  // Clients
  CLIENT_CREATED,
  CLIENT_UPDATED,
  CLIENT_DELETED,
  
  // System
  SETTINGS_CHANGED,
  PERMISSION_CHANGED,
  DATA_EXPORTED,
  AUDIT_LOG_ACCESSED
}
```

### **Visibility**

**Partner/Admin Access Only**
```typescript
function canViewAuditLog(user: User): boolean {
  return ['ADMIN', 'PARTNER'].includes(user.role);
}

function getAuditLogs(user: User, filters: AuditFilters): AuditLog[] {
  if (!canViewAuditLog(user)) {
    throw new Error('Unauthorized: Audit log access requires Partner or Admin role');
  }
  
  return queryAuditLogs({
    ...filters,
    firmId: user.firmId // Always firm-scoped
  });
}
```

**Exportable for Audits**
```typescript
async function exportAuditLog(
  user: User,
  startDate: Date,
  endDate: Date,
  format: 'CSV' | 'JSON' | 'PDF'
): Promise<Buffer> {
  if (!canViewAuditLog(user)) {
    throw new Error('Unauthorized');
  }
  
  const logs = await getAuditLogs(user, { startDate, endDate });
  
  // Log the export itself
  await createAuditLog({
    userId: user.id,
    action: 'AUDIT_LOG_EXPORTED',
    entity: 'AuditLog',
    metadata: {
      startDate,
      endDate,
      format,
      recordCount: logs.length
    }
  });
  
  return formatExport(logs, format);
}
```

### **State Capture**

**Before/After State with Hash**
```typescript
async function updateReport(
  reportId: string,
  updates: Partial<Report>,
  user: User
): Promise<Report> {
  // Get current state
  const beforeState = await getReport(reportId);
  const beforeHash = sha256(JSON.stringify(beforeState));
  
  // Apply updates
  const afterState = await applyUpdates(reportId, updates);
  const afterHash = sha256(JSON.stringify(afterState));
  
  // Create audit log
  await createAuditLog({
    userId: user.id,
    action: 'REPORT_UPDATED',
    entity: 'Report',
    entityId: reportId,
    beforeState: {
      hash: beforeHash,
      data: beforeState
    },
    afterState: {
      hash: afterHash,
      data: afterState
    },
    metadata: {
      fieldsChanged: Object.keys(updates)
    }
  });
  
  return afterState;
}
```

### **Data Model**
```prisma
model AuditLog {
  id                String   @id @default(cuid())
  
  // Who
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  userRole          UserRole
  userEmail         String
  
  // What
  action            AuditAction
  entity            String
  entityId          String
  
  // When
  timestamp         DateTime @default(now())
  
  // Where
  ipAddress         String?
  userAgent         String?
  location          String?
  
  // State
  beforeState       Json?
  afterState        Json?
  beforeHash        String?
  afterHash         String?
  
  // Context
  metadata          Json?
  reason            String?
  
  // Firm
  firmId            String
  firm              Firm     @relation(fields: [firmId], references: [id])
  
  @@index([firmId])
  @@index([userId])
  @@index([entity, entityId])
  @@index([timestamp])
  @@index([action])
}

enum AuditAction {
  // ... (all actions listed above)
}
```

### **Database Constraints**
```sql
-- Prevent updates
CREATE TRIGGER prevent_audit_log_update
BEFORE UPDATE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION raise_exception('Audit logs are immutable');

-- Prevent deletes
CREATE TRIGGER prevent_audit_log_delete
BEFORE DELETE ON audit_logs
FOR EACH ROW
EXECUTE FUNCTION raise_exception('Audit logs cannot be deleted');

-- Ensure timestamp is immutable
ALTER TABLE audit_logs
ALTER COLUMN timestamp SET DEFAULT CURRENT_TIMESTAMP;

-- Ensure firm isolation
CREATE POLICY audit_log_firm_isolation ON audit_logs
FOR SELECT
USING (firm_id = current_setting('app.current_firm_id')::uuid);
```

---

## 🎯 ENTERPRISE REQUIREMENTS CHECKLIST

### **Security**
- [ ] Database-level firm isolation
- [ ] Encryption at rest (AES-256)
- [ ] Encryption in transit (TLS 1.3)
- [ ] Role-based access control
- [ ] Immutable audit log
- [ ] Digital signatures for Partner sign-off
- [ ] IP address logging
- [ ] Failed login tracking
- [ ] Session management
- [ ] Password complexity requirements

### **Compliance**
- [ ] SOX compliance (audit trail)
- [ ] GDPR compliance (data export, deletion)
- [ ] ISO 27001 compliance (security controls)
- [ ] Data retention policies
- [ ] Right to be forgotten (soft delete)
- [ ] Audit log export
- [ ] Regulatory reporting

### **Scalability**
- [ ] Support 10,000+ users per firm
- [ ] Support 100,000+ reports per firm
- [ ] Support 1,000,000+ audit log entries
- [ ] Database partitioning by firm
- [ ] Read replicas for reporting
- [ ] Caching layer (Redis)
- [ ] CDN for static assets

### **Reliability**
- [ ] 99.9% uptime SLA
- [ ] Automated backups (hourly)
- [ ] Point-in-time recovery
- [ ] Disaster recovery plan
- [ ] Multi-region deployment
- [ ] Health monitoring
- [ ] Error tracking (Sentry)

### **Performance**
- [ ] Page load < 2 seconds
- [ ] API response < 500ms
- [ ] Report generation < 10 seconds
- [ ] Search results < 1 second
- [ ] Database query optimization
- [ ] Index optimization
- [ ] Query caching

---

**Status:** ✅ **ENTERPRISE ARCHITECTURE DEFINED**

**Next:** Continue with remaining modules (4-12)

This is the foundation for a Big-4 ready system. Should I continue with the remaining modules?
