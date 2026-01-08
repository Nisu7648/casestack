# 🧹 CaseStack Cleanup Plan - Remove Project Management Bloat

## 🎯 Philosophy: Focus on Core Consulting Workflow

**CaseStack should be:**
- A professional consulting report platform
- NOT a project management tool
- NOT a time tracking system
- NOT a generic task manager

---

## ❌ FILES TO DELETE

### **Time Tracking (Not Essential)**
```
backend/src/routes/time.routes.js
backend/src/controllers/time.controller.js
backend/src/models/TimeEntry.js
frontend/src/pages/TimeTracking.tsx
frontend/src/components/TimeTracker.tsx
frontend/src/components/LiveTimer.tsx
```

### **Gantt Charts / Milestones (Project Management Fluff)**
```
backend/src/routes/milestones.routes.js
backend/src/controllers/milestone.controller.js
backend/src/models/Milestone.js
frontend/src/pages/Milestones.tsx
frontend/src/components/GanttChart.tsx
frontend/src/components/Timeline.tsx
frontend/src/components/MilestoneCard.tsx
```

### **Risk Scoring (Future Feature, Not MVP)**
```
backend/src/routes/risks.routes.js
backend/src/controllers/risk.controller.js
backend/src/models/Risk.js
frontend/src/pages/RiskManagement.tsx
frontend/src/components/RiskMatrix.tsx
frontend/src/components/RiskScoring.tsx
```

### **Workflow Templates (Generic Tasks)**
```
backend/src/routes/templates.routes.js
backend/src/controllers/template.controller.js
backend/src/models/Template.js
frontend/src/pages/Templates.tsx
frontend/src/components/TemplateLibrary.tsx
```

### **Task Management (Not Core to Consulting)**
```
backend/src/routes/tasks.routes.js
backend/src/controllers/task.controller.js
backend/src/models/Task.js
backend/src/models/Subtask.js
frontend/src/pages/Tasks.tsx
frontend/src/components/TaskList.tsx
frontend/src/components/TaskCard.tsx
frontend/src/components/SubtaskManager.tsx
```

### **Task Dependencies (Project Management)**
```
backend/src/routes/dependencies.routes.js
backend/src/controllers/dependency.controller.js
backend/src/models/Dependency.js
frontend/src/components/DependencyGraph.tsx
frontend/src/components/DependencyManager.tsx
```

### **Document Upload/Storage (Use Metadata Only)**
```
backend/src/routes/documents.routes.js
backend/src/controllers/document.controller.js
backend/src/middleware/upload.js
backend/src/utils/fileStorage.js
frontend/src/components/FileUpload.tsx
frontend/src/components/DocumentViewer.tsx
frontend/src/components/DocumentList.tsx
```

### **Calendar/Scheduling (Use External Tools)**
```
backend/src/routes/calendar.routes.js
backend/src/controllers/calendar.controller.js
backend/src/models/CalendarEvent.js
frontend/src/pages/Calendar.tsx
frontend/src/components/CalendarView.tsx
frontend/src/components/EventModal.tsx
```

### **Case Management (Redundant with Client + Engagement)**
```
backend/src/routes/cases.routes.js
backend/src/controllers/case.controller.js
backend/src/models/Case.js
frontend/src/pages/Cases.tsx
frontend/src/components/CaseCard.tsx
frontend/src/components/CaseDetails.tsx
```

### **Complex Analytics (Future Feature)**
```
backend/src/routes/analytics.routes.js
backend/src/controllers/analytics.controller.js
frontend/src/pages/Analytics.tsx
frontend/src/components/AdvancedCharts.tsx
frontend/src/components/DataVisualization.tsx
```

### **Notifications / @mentions (Nice-to-Have)**
```
backend/src/routes/notifications.routes.js
backend/src/controllers/notification.controller.js
backend/src/models/Notification.js
backend/src/services/notificationService.js
frontend/src/components/NotificationCenter.tsx
frontend/src/components/MentionInput.tsx
```

---

## ✅ FILES TO KEEP (Core Consulting Workflow)

### **Foundation**
```
backend/src/routes/auth.routes.js
backend/src/routes/users.routes.js
backend/src/controllers/auth.controller.js
backend/src/controllers/user.controller.js
backend/src/middleware/auth.js
backend/src/middleware/activityLogger.js
```

### **Client Management**
```
backend/src/routes/clients.routes.js
backend/src/controllers/client.controller.js
backend/src/models/Client.js
backend/src/models/ClientContact.js
backend/src/models/Engagement.js
frontend/src/pages/Clients.tsx
frontend/src/pages/ClientDetails.tsx
frontend/src/components/ClientForm.tsx
```

### **Report Lifecycle**
```
backend/src/routes/reports.routes.js
backend/src/controllers/report.controller.js
backend/src/models/Report.js
backend/src/models/ReportSection.js
frontend/src/pages/Reports.tsx
frontend/src/pages/ReportEditor.tsx
frontend/src/components/ReportForm.tsx
frontend/src/components/SectionEditor.tsx
```

### **Evidence Management**
```
backend/src/routes/evidence.routes.js
backend/src/controllers/evidence.controller.js
backend/src/models/Evidence.js
frontend/src/pages/Evidence.tsx
frontend/src/components/EvidenceList.tsx
frontend/src/components/EvidenceForm.tsx
```

### **Review & Approval**
```
backend/src/routes/reviews.routes.js
backend/src/controllers/review.controller.js
backend/src/models/ReportComment.js
backend/src/models/ReportReview.js
frontend/src/pages/Reviews.tsx
frontend/src/components/CommentThread.tsx
frontend/src/components/ReviewForm.tsx
```

### **Dossier Generation**
```
backend/src/routes/dossier.routes.js
backend/src/controllers/dossier.controller.js
backend/src/utils/pdfGenerator.js
frontend/src/pages/DossierPreview.tsx
```

### **Search & Filter**
```
backend/src/routes/search.routes.js
backend/src/controllers/search.controller.js
frontend/src/components/GlobalSearch.tsx
frontend/src/components/SearchFilters.tsx
```

### **Audit Log**
```
backend/src/routes/audit.routes.js
backend/src/controllers/audit.controller.js
backend/src/models/ActivityLog.js
frontend/src/pages/AuditLog.tsx
frontend/src/components/AuditTimeline.tsx
```

---

## 🔄 SCHEMA CHANGES

### **Remove from Prisma Schema:**
```prisma
// DELETE THESE MODELS:
model Task { }
model Subtask { }
model TimeEntry { }
model Milestone { }
model Risk { }
model Dependency { }
model Template { }
model Document { }
model CalendarEvent { }
model Case { }
model Notification { }
```

### **Keep in Prisma Schema:**
```prisma
// KEEP THESE MODELS:
model Firm { }
model User { }
model Client { }
model ClientContact { }
model Engagement { }
model Report { }
model ReportSection { }
model Evidence { }
model ReportComment { }
model ReportReview { }
model ActivityLog { }
```

---

## 📊 IMPACT ANALYSIS

### **Before Cleanup:**
- Total Files: 280+
- Database Models: 30+
- API Endpoints: 120+
- Frontend Pages: 25+
- Frontend Components: 120+
- Lines of Code: 100,000+

### **After Cleanup:**
- Total Files: ~120 (57% reduction)
- Database Models: 15 (50% reduction)
- API Endpoints: ~50 (58% reduction)
- Frontend Pages: ~15 (40% reduction)
- Frontend Components: ~60 (50% reduction)
- Lines of Code: ~45,000 (55% reduction)

---

## 🎯 SIMPLIFIED ARCHITECTURE

### **Backend Structure (After Cleanup):**
```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── users.routes.js
│   │   ├── clients.routes.js
│   │   ├── reports.routes.js
│   │   ├── evidence.routes.js
│   │   ├── reviews.routes.js
│   │   ├── dossier.routes.js
│   │   ├── search.routes.js
│   │   └── audit.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── client.controller.js
│   │   ├── report.controller.js
│   │   ├── evidence.controller.js
│   │   ├── review.controller.js
│   │   ├── dossier.controller.js
│   │   ├── search.controller.js
│   │   └── audit.controller.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── activityLogger.js
│   └── utils/
│       └── pdfGenerator.js
└── prisma/
    └── schema.prisma (lean version)
```

### **Frontend Structure (After Cleanup):**
```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Clients.tsx
│   │   ├── ClientDetails.tsx
│   │   ├── Reports.tsx
│   │   ├── ReportEditor.tsx
│   │   ├── Evidence.tsx
│   │   ├── Reviews.tsx
│   │   ├── DossierPreview.tsx
│   │   ├── Search.tsx
│   │   └── AuditLog.tsx
│   ├── components/
│   │   ├── ClientForm.tsx
│   │   ├── ClientList.tsx
│   │   ├── ReportForm.tsx
│   │   ├── SectionEditor.tsx
│   │   ├── EvidenceList.tsx
│   │   ├── EvidenceForm.tsx
│   │   ├── CommentThread.tsx
│   │   ├── ReviewForm.tsx
│   │   ├── GlobalSearch.tsx
│   │   ├── SearchFilters.tsx
│   │   └── AuditTimeline.tsx
│   └── layouts/
│       └── MainLayout.tsx
```

---

## 🚀 MIGRATION PLAN

### **Phase 1: Backup (Week 1)**
1. Create backup branch: `backup/full-version`
2. Tag current version: `v6.0-full`
3. Document all removed features

### **Phase 2: Backend Cleanup (Week 2)**
1. Delete non-MVP routes
2. Delete non-MVP controllers
3. Delete non-MVP models
4. Update Prisma schema
5. Run migrations
6. Update API documentation

### **Phase 3: Frontend Cleanup (Week 3)**
1. Delete non-MVP pages
2. Delete non-MVP components
3. Update routing
4. Update navigation
5. Update imports

### **Phase 4: Testing (Week 4)**
1. Test all core workflows
2. Fix broken imports
3. Update tests
4. Verify functionality

### **Phase 5: Documentation (Week 5)**
1. Update README
2. Update API docs
3. Update user guide
4. Create migration guide

---

## 📝 COMMUNICATION PLAN

### **For Existing Users:**
```
Subject: CaseStack MVP - Focused on What Matters

Dear CaseStack Users,

We're streamlining CaseStack to focus on what truly matters: 
professional consulting reports.

REMOVED (Available in separate tools):
- Time tracking → Use Harvest, Toggl
- Project management → Use Asana, Monday
- Document storage → Use Dropbox, SharePoint
- Calendar → Use Outlook, Google Calendar

KEEPING (Core consulting workflow):
✅ Client management
✅ Structured reports
✅ Evidence tracking
✅ Review & approval
✅ Professional deliverables
✅ Audit trail

This makes CaseStack:
- Simpler to use
- Faster to learn
- More focused
- Better at what it does

Questions? Contact support@casestack.io
```

---

## 🎯 FUTURE ROADMAP

### **Post-MVP (Optional Modules):**

**Phase 2 (If customers request):**
- Time tracking integration (not built-in)
- Document storage integration (not built-in)
- Calendar sync (not built-in)

**Phase 3 (Enterprise features):**
- Advanced analytics
- Custom workflows
- API access
- White-label

**Phase 4 (Ecosystem):**
- Integrations marketplace
- Third-party plugins
- Mobile app

---

## 💡 KEY PRINCIPLES

### **What We Learned:**
1. ❌ **Don't build features "just in case"**
   - 80% of features are never used
   - Complexity kills adoption
   - Focus beats breadth

2. ❌ **Don't copy competitors blindly**
   - Asana is for project management
   - CaseStack is for consulting reports
   - Different workflows, different tools

3. ❌ **Don't add complexity without validation**
   - Every feature has a cost
   - Maintenance burden
   - User confusion

4. ✅ **Focus on core workflow**
   - Do one thing really well
   - Be the best at that one thing
   - Everything else is noise

5. ✅ **Build what consultants actually need**
   - Talk to real consultants
   - Understand their pain
   - Solve real problems

6. ✅ **Keep it simple and professional**
   - Simple to learn
   - Simple to use
   - Professional output

---

## 🌟 SUCCESS METRICS

### **Before Cleanup:**
- Feature count: 320+
- User confusion: High
- Adoption time: 2 days
- Support tickets: Many
- Value proposition: Unclear

### **After Cleanup:**
- Feature count: ~120
- User confusion: Low
- Adoption time: 2 hours
- Support tickets: Few
- Value proposition: Crystal clear

---

## 🎯 FINAL VERDICT

**CaseStack MVP focuses on:**
1. Client management
2. Structured reports
3. Evidence tracking
4. Review & approval
5. Professional deliverables
6. Audit trail

**Everything else is removed or moved to future phases.**

**This is the path to product-market fit.** 🚀

---

## 📋 CLEANUP CHECKLIST

- [ ] Create backup branch
- [ ] Tag current version
- [ ] Delete time tracking files
- [ ] Delete Gantt/milestone files
- [ ] Delete risk management files
- [ ] Delete template files
- [ ] Delete task management files
- [ ] Delete dependency files
- [ ] Delete document storage files
- [ ] Delete calendar files
- [ ] Delete case management files
- [ ] Delete analytics files
- [ ] Delete notification files
- [ ] Update Prisma schema
- [ ] Run migrations
- [ ] Update frontend routing
- [ ] Update navigation
- [ ] Fix imports
- [ ] Test core workflows
- [ ] Update documentation
- [ ] Communicate changes
- [ ] Deploy MVP

---

**Status:** ✅ **READY FOR CLEANUP**

**Next Steps:**
1. Review cleanup plan
2. Get approval
3. Execute cleanup
4. Test thoroughly
5. Launch focused MVP

**The future of CaseStack is focused, simple, and professional.** 🎯
