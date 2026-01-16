# 🖥️ CASESTACK — ENTERPRISE UI SCREEN HIERARCHY

**Desktop-only | Consulting-grade | Big-4 safe**

Think SAP + internal Deloitte tool, not Notion.

---

## 🧭 GLOBAL UI STRUCTURE

### **Top Navigation (Persistent)**
- **Left:** Firm Name + Logo
- **Center:** Global Search Bar (always visible)
- **Right:** User Name + Role Badge + Logout

### **Left Sidebar (Primary Navigation)**
- Clients
- Engagements
- Reports
- Evidence
- Dossiers
- Audit Log
- Admin (role-restricted)

**No icons-only UI. Always text labels.**

---

## 🟦 SCREEN GROUP 1 — CLIENT INTELLIGENCE

### **1.1 Client List Screen**

**Purpose:** Historical memory

**Table Columns:**
- Client Name
- Industry
- Total Engagements
- Last Engagement Year
- Lead Partner
- Status

**Actions:**
- View Client
- Create New Engagement

**Filters:**
- Industry
- Status
- Partner
- Year Range

---

### **1.2 Client Detail Screen**

**This is a KEY SCREEN**

**Sections:**

**A. Client Overview (Read-Only)**
- Legal Name
- Unique Identifier
- Industry / Sector
- Country
- Risk Rating
- Relationship Status
- Created Date

**B. Engagement History (Table)**

**Columns:**
- Year
- Engagement Type
- Status
- Lead Partner
- Finalized Date
- Actions: View Report (read-only if final)

**C. Internal Notes (Partner-Only)**
- Key contacts
- Strategic notes
- Risk considerations

**This screen sells CASESTACK internally.**

---

## 🟦 SCREEN GROUP 2 — ENGAGEMENT & REPORT CORE

### **2.1 Engagement Creation Screen**

**Minimal, controlled inputs:**
- Client (search/select dropdown)
- Year (current year default)
- Engagement Type (dropdown)
- Lead Partner (dropdown)
- Lead Manager (dropdown)
- Lead Consultant (dropdown)

**Validation:**
- Cannot create duplicate draft engagement
- All fields required
- Auto-generates engagement number

**No optional junk.**

---

### **2.2 Engagement Overview Screen**

**High-trust overview:**

**Status Card:**
- Current Status (Draft/In Review/Final/Locked)
- Created Date
- Last Updated
- Days in Current Status

**Team:**
- Lead Partner
- Lead Manager
- Lead Consultant

**Timeline (Dates Only, No Gantt):**
- Created
- Submitted for Review
- Manager Approved
- Partner Approved
- Finalized
- Locked

**Primary Actions:**
- Open Report Workspace
- View Evidence
- View Audit Trail
- Finalize Engagement (Partner only)
- Unlock Engagement (Admin only, requires justification)

---

### **2.3 Report Workspace Screen (MOST IMPORTANT)**

**Layout:**

```
┌─────────────────────────────────────────────────────────────┐
│ Top Bar: Report Title | Status | Save | Submit for Review   │
├──────────────┬──────────────────────────┬───────────────────┤
│              │                          │                   │
│  Section     │   Active Section         │   Review          │
│  Index       │   Content Editor         │   Comments        │
│  (Left)      │   (Center - 60%)         │   Panel           │
│              │                          │   (Right)         │
│  • Scope     │   [Rich Text Editor]     │   Unresolved: 3   │
│  • Method    │                          │                   │
│  • Findings  │   Version: 2             │   [Comment 1]     │
│  • Observ.   │   Last Edit: User, Time  │   [Comment 2]     │
│  • Concl.    │                          │   [Comment 3]     │
│  • Recomm.   │   [Lock Section]         │                   │
│              │                          │   [Add Comment]   │
│              │                          │                   │
└──────────────┴──────────────────────────┴───────────────────┘
```

**Sections (Strict Order):**
1. Scope
2. Methodology
3. Findings
4. Observations
5. Conclusions
6. Recommendations (optional)

**Rules Enforced by UI:**
- ✅ Locked sections visibly locked (grey background, lock icon)
- ✅ Review comments cannot be ignored (must resolve before approval)
- ✅ Finalized content is read-only
- ✅ Version history accessible per section
- ✅ Cannot submit with unresolved comments

**Section Editor Features:**
- Rich text formatting (bold, italic, lists, tables)
- Evidence linking (inline references)
- Version history (view previous versions)
- Lock/Unlock (Manager/Partner only)

**This screen must feel serious and restrictive.**

---

## 🟦 SCREEN GROUP 3 — EVIDENCE & TRACEABILITY

### **3.1 Evidence Reference Screen**

**Table Columns:**
- Reference Number (EVD-2024-001)
- File Name
- Source System (SharePoint, Google Drive, etc.)
- Linked Section
- Added By
- Date Added
- Status (Verified/Pending)

**Actions:**
- Add Reference (opens modal)
- View Reference Details
- Verify Evidence (Partner/Manager only)
- Link to Section

**Add Reference Modal:**
- File Name (text input)
- Source System (dropdown)
- Reference Path/URL (text input)
- Description (textarea)
- Evidence Type (dropdown)
- Link to Section (optional dropdown)

**NO upload buttons anywhere.**

---

## 🟦 SCREEN GROUP 4 — REVIEW & APPROVAL

### **4.1 Review Dashboard (Partner/Manager)**

**Sections:**

**A. Pending Reviews (Table)**
- Report Number
- Client
- Engagement Type
- Submitted By
- Submitted Date
- Days Pending
- Action: Review

**B. Unresolved Comments (Table)**
- Report Number
- Section
- Comment
- Author
- Date
- Action: View

**C. Reports Awaiting Sign-Off (Partner Only)**
- Report Number
- Client
- Manager Approved Date
- Days Waiting
- Action: Sign Off

---

### **4.2 Approval Screen**

**Shows:**

**A. Final Report Snapshot**
- Executive Summary
- All Sections (read-only preview)
- Word count per section

**B. Evidence Summary**
- Total Evidence Items
- Verified Count
- Pending Verification Count
- List of Evidence References

**C. Activity Summary**
- Key Events Timeline
- Total Edits
- Contributors
- Review History

**D. Comment Resolution Status**
- Total Comments
- Resolved Count
- Unresolved Count (must be 0 to approve)

**Action:**
- **Approve & Lock** (requires confirmation modal)
- **Request Changes** (requires comment)
- **Reject** (requires detailed justification)

**Approval Confirmation Modal:**
```
┌─────────────────────────────────────────────┐
│  Partner Sign-Off Required                  │
├─────────────────────────────────────────────┤
│                                             │
│  By approving this report, you acknowledge: │
│                                             │
│  ✓ All sections reviewed                   │
│  ✓ All comments resolved                   │
│  ✓ Evidence verified                       │
│  ✓ Report meets quality standards          │
│                                             │
│  This action is IRREVERSIBLE and will:     │
│  • Lock the report permanently             │
│  • Generate immutable audit record         │
│  • Enable dossier generation               │
│                                             │
│  [Acknowledgment Text Area - Required]     │
│                                             │
│  [Cancel]  [Confirm & Sign Off]            │
└─────────────────────────────────────────────┘
```

**This must feel ceremonial, not casual.**

---

## 🟦 SCREEN GROUP 5 — DOSSIER OUTPUT

### **5.1 Dossier Builder Screen**

**Select:**
- Report (dropdown or search)
- Include Evidence List (checkbox)
- Include Activity Log Summary (checkbox)

**Preview:**
- Table of Contents
- Sections Included
- Page Count Estimate
- File Size Estimate

**Action:**
- **Generate PDF** (button)
- **Download** (appears after generation)
- Auto-delete after session

**Generation Process:**
```
┌─────────────────────────────────────────────┐
│  Generating Professional Dossier...         │
├─────────────────────────────────────────────┤
│                                             │
│  ████████████████░░░░░░░░░░░░  65%         │
│                                             │
│  Building cover page...                     │
│  Compiling report content...                │
│  Generating evidence list...                │
│  Creating approval page...                  │
│                                             │
└─────────────────────────────────────────────┘
```

**Download Screen:**
```
┌─────────────────────────────────────────────┐
│  Dossier Ready                              │
├─────────────────────────────────────────────┤
│                                             │
│  Report: RPT-2024-001                       │
│  Client: Acme Corporation                   │
│  File Size: 2.4 MB                          │
│  Pages: 47                                  │
│                                             │
│  [Download PDF]                             │
│                                             │
│  Note: This file will be deleted after      │
│  you close this window.                     │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🟦 SCREEN GROUP 6 — SEARCH & RETRIEVAL

### **6.1 Global Search Results**

**Search Bar:**
- Large, prominent
- Auto-suggest as you type
- Recent searches

**Tabbed Results:**
- Clients (count)
- Engagements (count)
- Reports (count)
- Evidence (count)

**Filters (Always Visible):**
- Year
- Status
- Partner
- Engagement Type
- Industry

**Results Table (per tab):**
- Relevant columns per entity type
- Highlight matching text
- Quick actions (View, Open)

**Speed > beauty.**

---

## 🟦 SCREEN GROUP 7 — AUDIT & COMPLIANCE

### **7.1 Activity Log Screen**

**Table Columns:**
- Timestamp
- User (Name + Role)
- Action (color-coded)
- Entity Type
- Entity ID
- Details (expandable)
- IP Address

**Filters:**
- Date Range
- User
- Action Type
- Entity Type

**Actions:**
- Export to CSV
- Export to PDF
- View Details (opens modal with before/after state)

**Read-only. Export allowed.**

**This is legal's favorite screen.**

**Detail Modal:**
```
┌─────────────────────────────────────────────┐
│  Audit Log Entry Details                    │
├─────────────────────────────────────────────┤
│                                             │
│  Timestamp: 2024-01-15 14:32:17 UTC        │
│  User: John Smith (PARTNER)                │
│  Action: REPORT_APPROVED                   │
│  Entity: Report RPT-2024-001               │
│  IP Address: 192.168.1.100                 │
│                                             │
│  Before State:                              │
│  {                                          │
│    "status": "IN_REVIEW",                  │
│    "reviewerId": null                      │
│  }                                          │
│                                             │
│  After State:                               │
│  {                                          │
│    "status": "FINAL",                      │
│    "reviewerId": "user_123",               │
│    "approvedAt": "2024-01-15T14:32:17Z"   │
│  }                                          │
│                                             │
│  State Hash (SHA-256):                      │
│  Before: a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4  │
│  After:  d8e9f1a2b3c4a5f6b7c8d9e0f1a2b3c4  │
│                                             │
│  [Close]                                    │
└─────────────────────────────────────────────┘
```

---

## 🟦 SCREEN GROUP 8 — ADMIN & GOVERNANCE

### **8.1 Firm Settings**

**Sections:**

**A. Firm Information**
- Legal Name (read-only after setup)
- Display Name
- Registration Number
- Country
- Operating Countries

**B. Retention Rules**
- Retention Years (default: 10)
- Archive After Years (default: 7)
- Delete After Years (null = never)

**C. Lock Policies**
- Require Partner Sign-Off (checkbox)
- Allow Manager Approval (checkbox)
- Require Comment Resolution (checkbox)

**D. Numbering Prefixes**
- Report Prefix (default: RPT)
- Evidence Prefix (default: EVD)
- Engagement Prefix (default: ENG)

---

### **8.2 User & Role Management**

**Table Columns:**
- Name
- Email
- Role
- Status (Active/Inactive)
- Last Login
- Actions

**Actions:**
- Add User
- Edit User
- Activate/Deactivate
- Reset Password
- View Audit Log

**Add/Edit User Modal:**
- First Name
- Last Name
- Email
- Employee ID
- Role (dropdown)
- Status (Active/Inactive)

**Role Dropdown:**
- Admin
- Partner
- Manager
- Consultant
- Viewer

---

## 💼 BIG-4 SALES NARRATIVE

**How CASESTACK is sold internally**

No startup pitch. This is how partners think.

---

## 🎯 CORE SALES POSITIONING

> **"CASESTACK is the internal system where consulting work becomes defensible output."**

Not productivity.  
Not collaboration.  
**Defensibility.**

---

## 🧠 THE BIG-4 PAIN (THEY WON'T SAY IT, BUT IT'S REAL)

1. **Work is recreated every year**
2. **Evidence lives across systems**
3. **Partner reviews are last-minute**
4. **Audit trail is manual**
5. **Knowledge leaves when people leave**

**CASESTACK attacks institutional memory loss.**

---

## 🧩 HOW CASESTACK FITS INTERNALLY

**CASESTACK sits:**
- AFTER analysis
- BEFORE client delivery
- ABOVE files
- BELOW ERP

**It does NOT replace:**
- Excel
- PowerPoint
- SharePoint

**It connects outcomes, not tools.**

---

## 🛡️ WHY RISK & LEGAL APPROVE IT

✅ No client data storage  
✅ No AI interference  
✅ Immutable audit logs  
✅ Locked final outputs  
✅ Clear approval chain  

**Low risk, high control.**

---

## 💰 WHY PRICING MAKES SENSE

**For a firm:**
- Consultant salary: ₹2–5L/month
- CASESTACK: ₹1,399/month
- **Cost of ONE mistake > annual license**

---

## 🦄 WHY THIS CAN SCALE TO UNICORN

1. **High switching cost**
2. **Deep workflow lock-in**
3. **Multi-year contracts**
4. **Country-based pricing**
5. **Invisible but critical software**

**These become quiet giants.**

---

## 🧠 INTERNAL BUYER MAPPING

| Role | Why they say yes |
|------|------------------|
| **Partner** | Control, reuse, defensibility |
| **Manager** | Faster reviews, less chaos |
| **Consultant** | Clear structure |
| **Legal** | Audit safety |
| **IT** | Low risk, no storage |

---

## 🧾 ONE-LINE CLOSE (POWERFUL)

> **"CASESTACK doesn't change how you think — it protects what you deliver."**

---

## 🎯 SALES OBJECTION HANDLING

### **Objection 1: "We already have SharePoint"**
**Response:** "SharePoint stores files. CASESTACK creates defensible records. Different purpose."

### **Objection 2: "This looks expensive"**
**Response:** "One audit failure costs more than 10 years of CASESTACK. This is insurance."

### **Objection 3: "Our consultants won't use it"**
**Response:** "They don't have a choice. Partners require it for sign-off. Adoption is enforced."

### **Objection 4: "What about customization?"**
**Response:** "No customization. That's the point. Standardization is the value."

### **Objection 5: "Can we try it first?"**
**Response:** "Yes. 3-month pilot with one practice area. Full audit trail from day one."

---

## 📊 PILOT PROGRAM STRUCTURE

**Phase 1: Setup (Week 1-2)**
- Firm configuration
- User onboarding (10-20 users)
- Training sessions

**Phase 2: Live Usage (Week 3-10)**
- 5-10 real engagements
- Daily support
- Weekly check-ins

**Phase 3: Evaluation (Week 11-12)**
- Partner review
- Legal review
- IT security review
- ROI analysis

**Success Metrics:**
- 100% audit trail coverage
- 80%+ user adoption
- 0 compliance violations
- Partner satisfaction score >8/10

---

**STATUS:** ✅ **UI HIERARCHY COMPLETE - READY FOR DESIGN**
