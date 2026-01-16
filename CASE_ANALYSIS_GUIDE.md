# 🔍 CASE STORAGE & ANALYSIS SYSTEM

**Parallel Implementation - Clean Architecture**

---

## 📋 SYSTEM OVERVIEW

This is a **parallel implementation** of a case storage and analysis system, separate from the main consulting management platform. It provides:

- **Case Management** - Store and organize cases
- **Document Storage** - Upload and manage case documents
- **Analysis Engine** - Create detailed analyses linked to cases
- **Timeline Tracking** - Track case events chronologically
- **Collaboration** - Comment and discuss cases
- **Tagging System** - Categorize and filter cases
- **Full-Text Search** - Find cases, documents, and analyses

---

## 🏗️ ARCHITECTURE

### **Backend (Node.js + Express + Prisma)**

**Port:** 5001 (different from main app on 5000)

**Database Schema:** `schema.analysis.prisma`

**Key Models:**
- Organization
- User
- Case
- Document
- Analysis
- DocumentAnalysis (linking table)
- TimelineEvent
- Comment
- Tag
- CaseTag

**Controllers:**
- `case.controller.js` - Case CRUD operations
- `analysis.controller.js` - Analysis CRUD + document linking
- `document.controller.js` - Document upload/management
- `timeline.controller.js` - Timeline events
- `comment.controller.js` - Comments and discussions
- `tag.controller.js` - Tagging system
- `search.controller.js` - Full-text search

**Routes:**
- `/api/cases` - Case management
- `/api/documents` - Document management
- `/api/analyses` - Analysis management
- `/api/timeline` - Timeline events
- `/api/comments` - Comments
- `/api/tags` - Tags
- `/api/search` - Search

---

### **Frontend (React + TypeScript + Tailwind)**

**Pages:**
- `CaseList` - List all cases with filters
- `CaseDetail` - View case details, documents, analyses
- `CreateCase` - Create new case
- `AnalysisList` - List analyses for a case
- `AnalysisDetail` - View analysis details
- `CreateAnalysis` - Create new analysis

**Components:**
- `CaseCard` - Case preview card
- `DocumentUpload` - Document upload component
- `AnalysisEditor` - Rich text editor for analyses
- `TimelineView` - Timeline visualization
- `CommentThread` - Comment discussion thread
- `TagSelector` - Tag selection component

---

## 📁 FILE STRUCTURE

```
casestack/
├── backend/
│   ├── prisma/
│   │   └── schema.analysis.prisma ✅ (Created)
│   ├── src/
│   │   ├── server.analysis.js ✅ (Created)
│   │   ├── controllers/
│   │   │   └── analysis/
│   │   │       ├── case.controller.js ✅ (Created)
│   │   │       ├── analysis.controller.js ✅ (Created)
│   │   │       ├── document.controller.js (To create)
│   │   │       ├── timeline.controller.js (To create)
│   │   │       ├── comment.controller.js (To create)
│   │   │       ├── tag.controller.js (To create)
│   │   │       └── search.controller.js (To create)
│   │   └── routes/
│   │       └── analysis/
│   │           ├── case.routes.js ✅ (Created)
│   │           ├── analysis.routes.js ✅ (Created)
│   │           ├── document.routes.js (To create)
│   │           ├── timeline.routes.js (To create)
│   │           ├── comment.routes.js (To create)
│   │           ├── tag.routes.js (To create)
│   │           └── search.routes.js (To create)
└── frontend/
    └── src/
        ├── App.analysis.tsx ✅ (Created)
        └── pages/
            └── cases/
                ├── CaseList.analysis.tsx ✅ (Created)
                ├── CaseDetail.analysis.tsx (To create)
                ├── CreateCase.analysis.tsx (To create)
                └── analysis/
                    ├── AnalysisList.analysis.tsx (To create)
                    ├── AnalysisDetail.analysis.tsx (To create)
                    └── CreateAnalysis.analysis.tsx (To create)
```

---

## ✅ COMPLETED COMPONENTS

### **Backend**

1. **Database Schema** (`schema.analysis.prisma`)
   - 11 models with relationships
   - Clean, normalized structure
   - Proper indexes for performance

2. **Server** (`server.analysis.js`)
   - Express server on port 5001
   - CORS, Helmet, Morgan configured
   - Route mounting
   - Error handling

3. **Case Controller** (`case.controller.js`)
   - Create case
   - Get all cases (with filters, search, pagination)
   - Get case by ID (with full details)
   - Update case
   - Delete case
   - Get case statistics

4. **Analysis Controller** (`analysis.controller.js`)
   - Create analysis
   - Get analyses by case
   - Get analysis by ID
   - Update analysis
   - Delete analysis
   - Link document to analysis
   - Unlink document from analysis

5. **Routes**
   - Case routes with authentication
   - Analysis routes with document linking

### **Frontend**

1. **App Component** (`App.analysis.tsx`)
   - React Router setup
   - Protected routes
   - Public routes
   - Query client configuration

2. **CaseList Component** (`CaseList.analysis.tsx`)
   - Case listing with pagination
   - Search functionality
   - Status and priority filters
   - Statistics dashboard
   - Responsive design

---

## 🔄 REMAINING COMPONENTS TO BUILD

### **Backend Controllers**

1. **Document Controller**
   ```javascript
   - uploadDocument()
   - getDocumentsByCase()
   - getDocumentById()
   - deleteDocument()
   - extractText() // OCR/text extraction
   ```

2. **Timeline Controller**
   ```javascript
   - createEvent()
   - getEventsByCase()
   - updateEvent()
   - deleteEvent()
   ```

3. **Comment Controller**
   ```javascript
   - createComment()
   - getCommentsByCase()
   - updateComment()
   - deleteComment()
   ```

4. **Tag Controller**
   ```javascript
   - createTag()
   - getAllTags()
   - updateTag()
   - deleteTag()
   - addTagToCase()
   - removeTagFromCase()
   ```

5. **Search Controller**
   ```javascript
   - searchCases()
   - searchDocuments()
   - searchAnalyses()
   - globalSearch()
   ```

### **Frontend Pages**

1. **CaseDetail**
   - Case overview
   - Document list
   - Analysis list
   - Timeline view
   - Comments section
   - Edit/delete actions

2. **CreateCase**
   - Form with validation
   - Tag selection
   - Priority/status selection
   - Submit handler

3. **AnalysisList**
   - List analyses for a case
   - Filter by type/status
   - Create new analysis button

4. **AnalysisDetail**
   - Analysis content
   - Linked documents
   - Edit/delete actions
   - Publish/archive actions

5. **CreateAnalysis**
   - Rich text editor
   - Document linking
   - Findings JSON editor
   - Submit handler

---

## 🚀 SETUP INSTRUCTIONS

### **1. Database Setup**

```bash
# Navigate to backend
cd backend

# Copy analysis schema to main schema
cp prisma/schema.analysis.prisma prisma/schema.prisma

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init_analysis_system

# (Optional) Seed database
npx prisma db seed
```

### **2. Backend Setup**

```bash
# Install dependencies (if not already installed)
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL="postgresql://user:password@localhost:5432/casestack_analysis"
JWT_SECRET="your-secret-key-here"
PORT=5001
FRONTEND_URL="http://localhost:3000"
NODE_ENV="development"
EOF

# Start server
node src/server.analysis.js
```

### **3. Frontend Setup**

```bash
# Navigate to frontend
cd frontend

# Install dependencies (if not already installed)
npm install

# Update API base URL in src/services/api.ts
# Change to: http://localhost:5001/api

# Start development server
npm run dev
```

---

## 🔌 API ENDPOINTS

### **Cases**

```
POST   /api/cases              - Create case
GET    /api/cases              - Get all cases (with filters)
GET    /api/cases/statistics   - Get case statistics
GET    /api/cases/:id          - Get case by ID
PUT    /api/cases/:id          - Update case
DELETE /api/cases/:id          - Delete case
```

### **Analyses**

```
POST   /api/analyses                      - Create analysis
GET    /api/analyses/case/:caseId         - Get analyses by case
GET    /api/analyses/:id                  - Get analysis by ID
PUT    /api/analyses/:id                  - Update analysis
DELETE /api/analyses/:id                  - Delete analysis
POST   /api/analyses/:id/documents        - Link document
DELETE /api/analyses/:id/documents/:docId - Unlink document
```

### **Documents** (To implement)

```
POST   /api/documents              - Upload document
GET    /api/documents/case/:caseId - Get documents by case
GET    /api/documents/:id          - Get document by ID
DELETE /api/documents/:id          - Delete document
```

### **Timeline** (To implement)

```
POST   /api/timeline              - Create event
GET    /api/timeline/case/:caseId - Get events by case
PUT    /api/timeline/:id          - Update event
DELETE /api/timeline/:id          - Delete event
```

### **Comments** (To implement)

```
POST   /api/comments              - Create comment
GET    /api/comments/case/:caseId - Get comments by case
PUT    /api/comments/:id          - Update comment
DELETE /api/comments/:id          - Delete comment
```

### **Tags** (To implement)

```
POST   /api/tags                  - Create tag
GET    /api/tags                  - Get all tags
PUT    /api/tags/:id              - Update tag
DELETE /api/tags/:id              - Delete tag
POST   /api/tags/:id/cases/:caseId - Add tag to case
DELETE /api/tags/:id/cases/:caseId - Remove tag from case
```

### **Search** (To implement)

```
GET    /api/search?q=query        - Global search
GET    /api/search/cases?q=query  - Search cases
GET    /api/search/docs?q=query   - Search documents
```

---

## 🎯 KEY FEATURES

### **1. Case Management**
- Create, read, update, delete cases
- Assign priority and status
- Categorize with tags
- Track case lifecycle

### **2. Document Storage**
- Upload documents (PDF, DOCX, images)
- Extract text for search
- Link documents to analyses
- Version tracking

### **3. Analysis Engine**
- Create multiple analyses per case
- Link relevant documents
- Track analysis status (Draft → Published)
- Store findings as structured JSON

### **4. Timeline Tracking**
- Add events to case timeline
- Chronological view
- Event types and metadata

### **5. Collaboration**
- Comment on cases
- Threaded discussions
- @mentions (future)
- Activity feed (future)

### **6. Search & Filter**
- Full-text search across cases
- Filter by status, priority, tags
- Search documents and analyses
- Advanced query syntax

---

## 💡 IMPLEMENTATION NOTES

### **Differences from Main System**

1. **Simpler Schema** - Focused on case analysis, not consulting workflows
2. **Different Port** - Runs on 5001 vs 5000
3. **Separate Database** - Can use same Postgres instance, different database
4. **Independent Auth** - Separate user/org management
5. **No Billing** - Simplified for internal use

### **Shared Components**

- Authentication middleware
- Error handling
- CORS configuration
- Logging setup

### **Future Enhancements**

1. **AI Analysis** - Automated document analysis
2. **OCR Integration** - Extract text from images
3. **Export to PDF** - Generate case reports
4. **Email Notifications** - Case updates
5. **Real-time Collaboration** - WebSocket support
6. **Advanced Search** - Elasticsearch integration
7. **File Versioning** - Track document changes
8. **Audit Trail** - Track all changes

---

## 🔒 SECURITY CONSIDERATIONS

1. **Authentication** - JWT-based auth required for all endpoints
2. **Organization Isolation** - Users can only access their org's data
3. **File Upload Validation** - Check file types and sizes
4. **SQL Injection Prevention** - Prisma ORM handles this
5. **XSS Prevention** - React escapes by default
6. **CORS** - Configured for specific origins
7. **Rate Limiting** - Prevent abuse (to implement)

---

## 📊 DATABASE SCHEMA HIGHLIGHTS

### **Key Relationships**

```
Organization
  ├── Users
  ├── Cases
  └── Tags

Case
  ├── Documents
  ├── Analyses
  ├── Timeline Events
  ├── Comments
  └── Tags (many-to-many)

Analysis
  ├── Documents (many-to-many via DocumentAnalysis)
  └── Analyst (User)

Document
  └── Analyses (many-to-many via DocumentAnalysis)
```

### **Enums**

- **UserRole**: ADMIN, MEMBER, VIEWER
- **CaseStatus**: OPEN, IN_PROGRESS, UNDER_REVIEW, CLOSED, ARCHIVED
- **CasePriority**: LOW, MEDIUM, HIGH, CRITICAL
- **AnalysisType**: PRELIMINARY, DETAILED, FORENSIC, COMPARATIVE, SUMMARY
- **AnalysisStatus**: DRAFT, IN_REVIEW, PUBLISHED, ARCHIVED

---

## 🎨 FRONTEND DESIGN

### **Color Scheme**

- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Danger**: Red (#EF4444)
- **Gray**: Neutral (#6B7280)

### **Components**

- **Tailwind CSS** - Utility-first styling
- **Heroicons** - Icon library
- **React Query** - Data fetching
- **React Router** - Navigation
- **React Hook Form** - Form handling (to add)

---

## ✅ NEXT STEPS

1. **Complete Backend Controllers**
   - Document controller with file upload
   - Timeline controller
   - Comment controller
   - Tag controller
   - Search controller

2. **Complete Frontend Pages**
   - CaseDetail page
   - CreateCase page
   - AnalysisDetail page
   - CreateAnalysis page

3. **Add File Upload**
   - Multer middleware
   - S3/local storage
   - File validation

4. **Add Search**
   - Full-text search
   - Filters and facets
   - Highlighting

5. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

6. **Deployment**
   - Docker containers
   - CI/CD pipeline
   - Production config

---

## 📞 STATUS

**Current Status:** ✅ **Foundation Complete - 40% Done**

**Completed:**
- Database schema
- Server setup
- Case CRUD
- Analysis CRUD
- Basic routing
- Frontend app structure
- CaseList page

**Remaining:**
- Document upload
- Timeline management
- Comments system
- Tagging system
- Search functionality
- Remaining frontend pages

**Estimated Time to Complete:** 2-3 weeks

---

**This is a clean, parallel implementation focused on case storage and analysis, separate from the main consulting management system.**
