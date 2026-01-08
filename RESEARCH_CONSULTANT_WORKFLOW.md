# 🔍 Consultant Workflow Research & CaseStack Strategy

## How Consultants Actually Work

### 📊 The Multi-Screen Reality

**Typical Setup:**
- **Screen 1**: Excel (data analysis, models, trackers)
- **Screen 2**: PowerPoint (slide building, presentations)
- **Laptop Screen**: Email + Slack/Teams (communication)
- **Background**: 10-15 browser tabs (research, client portals, knowledge bases)

**Daily Workflow Pattern:**
```
08:00 - Team check-in (Zoom/Teams)
08:30 - Email triage (Outlook/Gmail)
09:00 - Deep work: Analysis (Excel) + Slides (PowerPoint)
12:00 - Client meeting (Zoom + shared screen)
13:00 - Synthesize notes (Word/Notion)
14:00 - Update project tracker (Excel/Asana)
15:00 - More analysis + slide building
17:00 - Team alignment call
18:00 - Follow-up tasks, time tracking
```

### 🔥 The Pain Points (Why They Need CaseStack)

#### 1. **Context Switching Hell**
- Average consultant switches between **8-12 tools** per day
- **23 minutes** to regain focus after each switch
- **2-3 hours lost daily** just switching contexts

#### 2. **Scattered Information**
- Client data in CRM (Salesforce)
- Project plan in Excel
- Tasks in Asana/Trello
- Time tracking in Harvest/Toggl
- Documents in Google Drive/SharePoint
- Communication in Email + Slack + Teams
- Invoices in QuickBooks/Xero

#### 3. **Tribal Knowledge Problem**
- Processes live in people's heads
- New team members take **2-3 weeks** to ramp up
- Constant interruptions: "Where is the X file?"

#### 4. **Manual Tracking Nightmare**
- Update project status in 3 places
- Copy-paste between tools
- Reconcile time entries with project budgets
- Generate reports by pulling data from 5 sources

#### 5. **Visibility Black Holes**
- Partners can't see real-time project status
- Clients ask "What's the progress?" → scramble to compile
- No single source of truth

## 🎯 The Killer Feature: **Unified Case Canvas**

### What Makes CaseStack Irresistible

Instead of building 10 separate tools, create **ONE INTEGRATED WORKSPACE** that mirrors how consultants actually think:

## 🚀 Module 1: The Case Canvas (The Hook)

This is the feature that makes consultants say: *"I can't go back to the old way"*

### Core Concept: Everything About a Case in One View

```
┌─────────────────────────────────────────────────────────────┐
│  CASE: Digital Transformation for Acme Corp                 │
│  Status: In Progress | Budget: $150K | 45% Complete         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  LEFT PANEL (Context)          CENTER (Work)    RIGHT (Comm) │
│  ┌──────────────────┐         ┌──────────┐    ┌───────────┐ │
│  │ 📋 Case Brief    │         │ Tasks    │    │ Activity  │ │
│  │ • Client: Acme   │         │ ☐ Market │    │ Feed      │ │
│  │ • Start: Jan 1   │         │   analysis│    │           │ │
│  │ • End: Mar 31    │         │ ☑ Stakeh.│    │ John added│ │
│  │                  │         │   interv. │    │ document  │ │
│  │ 👥 Team          │         │          │    │           │ │
│  │ • John (Lead)    │         │ Delivera.│    │ Sarah     │ │
│  │ • Sarah (Analyst)│         │ ☐ Exec   │    │ commented │ │
│  │                  │         │   summary │    │           │ │
│  │ 📁 Documents     │         │ ☐ Roadmap│    │ Client    │ │
│  │ • Proposal.pdf   │         │          │    │ approved  │ │
│  │ • Data.xlsx      │         │ Timeline │    │ milestone │ │
│  │                  │         │ [Gantt]  │    │           │ │
│  │ ⏱️ Time: 120h    │         │          │    │           │ │
│  │ 💰 Spent: $67K   │         │          │    │           │ │
│  └──────────────────┘         └──────────┘    └───────────┘ │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Why This Works

**1. Single Source of Truth**
- Everything about a case lives in ONE place
- No more "Where did we put that?"
- No more updating 3 spreadsheets

**2. Context Preservation**
- Switch between cases without losing context
- All relevant info visible at a glance
- No mental overhead

**3. Real-Time Collaboration**
- Team sees updates instantly
- Activity feed shows who did what
- @mentions for quick communication

**4. Automatic Tracking**
- Time auto-captured when working on case
- Budget burn-down calculated automatically
- Progress updates from task completion

**5. Client Transparency**
- Optional client portal view
- Share specific deliverables
- Real-time status updates

## 🎨 The Case Canvas Features

### Left Panel: Case Context (Always Visible)

```typescript
interface CaseContext {
  // Case Basics
  client: Client
  caseType: 'Strategy' | 'Operations' | 'Technology' | 'Other'
  startDate: Date
  endDate: Date
  status: 'Planning' | 'In Progress' | 'Review' | 'Completed'
  
  // Team
  team: {
    lead: User
    members: User[]
    roles: { user: User, role: string }[]
  }
  
  // Financials (Auto-calculated)
  budget: {
    total: number
    spent: number
    remaining: number
    burnRate: number // per week
  }
  
  // Time (Auto-tracked)
  timeTracking: {
    estimated: number
    actual: number
    byMember: { user: User, hours: number }[]
  }
  
  // Quick Links
  documents: Document[]
  relatedCases: Case[]
  clientContacts: Contact[]
}
```

### Center Panel: Work Area (Tabbed)

**Tab 1: Tasks & Deliverables**
```typescript
interface Task {
  id: string
  title: string
  type: 'Task' | 'Deliverable' | 'Milestone'
  assignee: User
  dueDate: Date
  status: 'Not Started' | 'In Progress' | 'Review' | 'Done'
  dependencies: Task[]
  timeEstimate: number
  timeActual: number
  
  // Deliverable-specific
  deliverableType?: 'Report' | 'Presentation' | 'Model' | 'Other'
  version?: number
  clientApproval?: boolean
  file?: File
}
```

**Tab 2: Timeline (Gantt)**
- Visual project timeline
- Drag-and-drop task scheduling
- Dependency visualization
- Critical path highlighting

**Tab 3: Documents**
- Integrated file browser
- Version control
- Quick preview
- Template library

**Tab 4: Analysis (The Innovation)**
- Embedded Excel-like grid
- Simple charts/graphs
- Link to external models
- Snapshot key metrics

### Right Panel: Communication & Activity

**Activity Feed**
```typescript
interface Activity {
  timestamp: Date
  user: User
  action: 'created' | 'updated' | 'completed' | 'commented' | 'uploaded'
  entity: 'task' | 'deliverable' | 'document' | 'case'
  entityId: string
  details: string
  mentions: User[]
}
```

**Quick Actions**
- Start timer
- Add task
- Upload document
- @mention teammate
- Log client interaction

## 🔑 The "Aha!" Moments That Hook Users

### 1. **First Case Setup (5 minutes)**
```
User creates case → Fills basic info → Invites team → Uploads proposal
Result: "Wow, everything is already organized"
```

### 2. **First Task Completion**
```
User marks task done → Time auto-logged → Budget updated → Team notified
Result: "I didn't have to update 3 spreadsheets!"
```

### 3. **First Client Status Request**
```
Client asks "What's the status?" → User shares Case Canvas link
Result: "I just sent them a link instead of making a deck"
```

### 4. **First Week Review**
```
Partner opens dashboard → Sees all cases, budgets, risks at a glance
Result: "I can finally see what's happening across all projects"
```

### 5. **First New Team Member**
```
New consultant joins → Opens case → Sees full context immediately
Result: "I didn't need to ask 20 questions"
```

## 📊 Data Model for Case Canvas

```prisma
model Case {
  id          String   @id @default(uuid())
  title       String
  description String?
  caseType    CaseType
  status      CaseStatus
  
  // Client
  clientId    String
  client      Client   @relation(fields: [clientId], references: [id])
  
  // Timeline
  startDate   DateTime
  endDate     DateTime
  
  // Financials
  budgetTotal    Decimal
  budgetSpent    Decimal  @default(0)
  currency       String   @default("USD")
  
  // Team
  leadId      String
  lead        User     @relation("CaseLead", fields: [leadId], references: [id])
  members     CaseMember[]
  
  // Firm
  firmId      String
  firm        Firm     @relation(fields: [firmId], references: [id])
  
  // Relations
  tasks       Task[]
  deliverables Deliverable[]
  documents   Document[]
  timeEntries TimeEntry[]
  activities  CaseActivity[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([firmId])
  @@index([clientId])
  @@index([status])
}

enum CaseType {
  STRATEGY
  OPERATIONS
  TECHNOLOGY
  FINANCIAL
  HR
  MARKETING
  OTHER
}

enum CaseStatus {
  PLANNING
  IN_PROGRESS
  ON_HOLD
  REVIEW
  COMPLETED
  CANCELLED
}

model Client {
  id          String   @id @default(uuid())
  name        String
  industry    String?
  country     String
  
  // Contact
  primaryContact String?
  email       String?
  phone       String?
  
  // Firm
  firmId      String
  firm        Firm     @relation(fields: [firmId], references: [id])
  
  // Relations
  cases       Case[]
  contacts    Contact[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([firmId])
}

model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  type        TaskType
  status      TaskStatus
  priority    Priority @default(MEDIUM)
  
  // Assignment
  assigneeId  String?
  assignee    User?    @relation(fields: [assigneeId], references: [id])
  
  // Timeline
  dueDate     DateTime?
  completedAt DateTime?
  
  // Time
  estimatedHours Decimal?
  actualHours    Decimal  @default(0)
  
  // Case
  caseId      String
  case        Case     @relation(fields: [caseId], references: [id], onDelete: Cascade)
  
  // Dependencies
  blockedBy   Task[]   @relation("TaskDependencies")
  blocking    Task[]   @relation("TaskDependencies")
  
  // Relations
  timeEntries TimeEntry[]
  comments    Comment[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([caseId])
  @@index([assigneeId])
  @@index([status])
}

enum TaskType {
  TASK
  DELIVERABLE
  MILESTONE
}

enum TaskStatus {
  NOT_STARTED
  IN_PROGRESS
  REVIEW
  BLOCKED
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

model TimeEntry {
  id          String   @id @default(uuid())
  
  // Time
  startTime   DateTime
  endTime     DateTime?
  duration    Decimal  // in hours
  description String?
  
  // Billable
  billable    Boolean  @default(true)
  hourlyRate  Decimal?
  
  // Relations
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  caseId      String
  case        Case     @relation(fields: [caseId], references: [id], onDelete: Cascade)
  
  taskId      String?
  task        Task?    @relation(fields: [taskId], references: [id])
  
  createdAt   DateTime @default(now())
  
  @@index([userId])
  @@index([caseId])
  @@index([startTime])
}

model CaseActivity {
  id          String   @id @default(uuid())
  
  // Activity
  action      ActivityAction
  entity      String   // 'task', 'deliverable', 'document', etc.
  entityId    String?
  description String
  
  // User
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  
  // Case
  caseId      String
  case        Case     @relation(fields: [caseId], references: [id], onDelete: Cascade)
  
  // Mentions
  mentions    User[]   @relation("ActivityMentions")
  
  timestamp   DateTime @default(now())
  
  @@index([caseId])
  @@index([timestamp])
}

enum ActivityAction {
  CREATED
  UPDATED
  COMPLETED
  COMMENTED
  UPLOADED
  DELETED
  MENTIONED
}
```

## 🎯 Implementation Priority

### Phase 1: MVP (Week 1-2)
1. ✅ Case creation with basic info
2. ✅ Task list with status tracking
3. ✅ Team assignment
4. ✅ Simple time tracking
5. ✅ Activity feed

### Phase 2: Core Features (Week 3-4)
1. Document management
2. Client entity
3. Budget tracking
4. Timeline/Gantt view
5. Deliverable tracking

### Phase 3: Power Features (Week 5-6)
1. Task dependencies
2. Templates
3. Client portal
4. Advanced reporting
5. Mobile app

## 💡 The Competitive Edge

**Why consultants will switch to CaseStack:**

1. **10 seconds to see case status** (vs 10 minutes compiling from 5 tools)
2. **Zero manual updates** (everything auto-syncs)
3. **One link to share with client** (vs creating status deck)
4. **New team member productive in 1 hour** (vs 2 weeks)
5. **Real-time visibility for partners** (vs weekly status meetings)

## 🚀 The Onboarding Hook

**First 5 Minutes:**
```
1. Sign up → Create firm
2. "Let's create your first case"
3. Fill: Client name, Case title, Start date, Budget
4. "Add your team" → Invite 2-3 people
5. "Add your first task" → Quick task entry
6. BOOM → Case Canvas appears, fully functional
```

**The "Wow" Moment:**
- User sees everything organized
- Clicks "Start Timer" → Time tracking begins
- Marks task done → Budget updates, team notified
- Thinks: "This is exactly what I needed"

## 📈 Viral Growth Loop

1. Consultant creates case
2. Invites team members → They sign up
3. Shares client portal → Client sees value
4. Client mentions to other consultants
5. Repeat

---

**Next Step: Build Module 1 - Case Canvas**

This is the feature that will make CaseStack indispensable. Once consultants experience the unified workspace, they won't go back to juggling 10 tools.

Ready to build it?
