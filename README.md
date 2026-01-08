# 🚀 CaseStack - Professional Consulting Management Platform

**The all-in-one platform for consulting firms to manage cases, track time, collaborate with teams, and deliver exceptional client results.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)](https://www.typescriptlang.org/)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [API Documentation](#api-documentation)
- [Features Deep Dive](#features-deep-dive)
- [Roadmap](#roadmap)

---

## 🎯 Overview

CaseStack replaces **10+ tools** consultants typically use (Excel, Notion, Asana, Harvest, Smartsheet, etc.) with a single, integrated platform designed specifically for consulting workflows.

### **Problem We Solve**

Consulting firms struggle with:
- ❌ Data scattered across multiple tools
- ❌ Manual time tracking and budget updates
- ❌ No single source of truth for case status
- ❌ Difficult team collaboration
- ❌ Time-consuming reporting and analytics

### **Our Solution**

✅ **One Platform** for everything  
✅ **Auto-calculations** for budgets, progress, time  
✅ **Real-time collaboration** with activity feeds  
✅ **Workflow templates** for instant case setup  
✅ **Advanced analytics** with visual dashboards  
✅ **Risk management** with automated scoring  

---

## ✨ Key Features

### 🎨 **Case Canvas**
- Visual case management with drag-and-drop
- Auto-generated case numbers (CASE-2024-001)
- Client relationship management
- Team assignment and collaboration
- Budget tracking with real-time updates
- Progress calculation based on task completion

### ⏱️ **Time Tracking**
- One-click start/stop timer
- Automatic duration calculation
- Billable/non-billable tracking
- Task-level time entries
- Auto-updates case budgets
- Export for invoicing

### 📋 **Task Management**
- Tasks, deliverables, and milestones
- Subtasks with unlimited nesting
- Task dependencies (Gantt-style)
- Status tracking with auto-progress
- Comments and collaboration
- Assignee management

### 🔄 **Workflow Templates**
- Reusable project templates
- One-click case setup
- Pre-configured tasks and milestones
- Dependency automation
- Public template library
- Usage tracking

### 🎯 **Milestones**
- Visual timeline view
- Auto-status calculation
- Days until due tracking
- Completion tracking
- Owner assignment
- Delay alerts

### ⚠️ **Risk Management**
- Comprehensive risk register
- Probability × Impact scoring (1-16)
- Risk matrix visualization
- Mitigation planning
- Contingency tracking
- Risk lifecycle management

### 📊 **Analytics & Reporting**
- Dashboard with key metrics
- Case-specific insights
- Time analytics by user/case/day
- Budget utilization tracking
- Team performance metrics
- Data export (JSON/CSV)

### 👥 **Team Collaboration**
- Role-based access control
- Activity feed with real-time updates
- @mentions in comments
- Document management
- Team member assignments
- Permission management

---

## 🛠️ Tech Stack

### **Backend**
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 14+
- **ORM**: Prisma
- **Authentication**: JWT
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting

### **Frontend**
- **Framework**: React 18+
- **Language**: TypeScript 5+
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: Lucide React
- **HTTP Client**: Axios

---

## 🚀 Getting Started

### **Prerequisites**

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

### **Installation**

1. **Clone the repository**
```bash
git clone https://github.com/Nisu7648/casestack.git
cd casestack
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
DATABASE_URL="postgresql://user:password@localhost:5432/casestack"
JWT_SECRET="your-secret-key"
PORT=5000

# Run database migrations
npx prisma migrate dev

# Start backend server
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install

# Create .env file
cp .env.example .env

# Edit .env
VITE_API_URL=http://localhost:5000/api

# Start frontend development server
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

---

## 🏗️ Architecture

### **Database Schema**

```
Firm (Multi-tenant)
├── Users (Role-based)
├── Clients
│   └── Contacts
├── Cases
│   ├── Tasks
│   │   ├── Subtasks
│   │   ├── Comments
│   │   └── Time Entries
│   ├── Milestones
│   ├── Risks
│   ├── Dependencies
│   ├── Documents
│   ├── Case Activities
│   └── Custom Fields
└── Workflow Templates
```

### **API Structure**

```
/api
├── /auth          # Authentication
├── /users         # User management
├── /firms         # Firm settings
├── /clients       # Client management
├── /cases         # Case operations
├── /tasks         # Task management
├── /time          # Time tracking
├── /workflows     # Templates
├── /milestones    # Milestones
├── /risks         # Risk register
└── /analytics     # Reporting
```

---

## 📚 API Documentation

### **Authentication**

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### **Cases**

```http
GET    /api/cases              # List cases (with filters)
GET    /api/cases/:id          # Get case details
POST   /api/cases              # Create case
PUT    /api/cases/:id          # Update case
DELETE /api/cases/:id          # Delete case
GET    /api/cases/:id/activities  # Activity feed
```

### **Tasks**

```http
GET    /api/tasks/case/:caseId    # List tasks
POST   /api/tasks                 # Create task
PUT    /api/tasks/:id             # Update task
PATCH  /api/tasks/:id/status      # Update status
DELETE /api/tasks/:id             # Delete task
POST   /api/tasks/:id/comments    # Add comment
```

### **Time Tracking**

```http
GET    /api/time/active           # Get active timer
POST   /api/time/start            # Start timer
POST   /api/time/stop             # Stop timer
GET    /api/time/case/:caseId     # Get time entries
POST   /api/time                  # Manual entry
```

### **Workflows**

```http
GET    /api/workflows/templates   # List templates
POST   /api/workflows/templates   # Create template
POST   /api/workflows/apply       # Apply to case
GET    /api/workflows/case/:id    # Get workflow
```

### **Analytics**

```http
GET    /api/analytics/dashboard   # Dashboard metrics
GET    /api/analytics/case/:id    # Case analytics
GET    /api/analytics/time        # Time analytics
GET    /api/analytics/budget      # Budget analytics
GET    /api/analytics/team        # Team performance
POST   /api/analytics/export      # Export data
```

---

## 🎯 Features Deep Dive

### **1. Workflow Templates**

Create once, use forever. Apply templates to instantly set up cases with pre-configured tasks, milestones, and dependencies.

### **2. Risk Management**

Automated risk scoring (Probability × Impact = 1-16). Visual risk matrix with critical, high, medium, and low categories.

### **3. Auto-Calculations**

- Stop timer → Calculates duration → Updates budget → Updates task hours
- Complete task → Recalculates progress → Updates milestone status
- Add time entry → Updates case budget → Triggers alerts if >90%

### **4. Team Performance**

Track hours logged, revenue generated, task completion rates, and utilization across your entire team.

---

## 🗺️ Roadmap

### **Phase 1: Foundation** ✅
- [x] Authentication & Authorization
- [x] Case Management
- [x] Task Management
- [x] Time Tracking
- [x] Basic Analytics

### **Phase 2: Advanced Features** ✅
- [x] Workflow Templates
- [x] Milestones
- [x] Risk Management
- [x] Task Dependencies
- [x] Advanced Analytics
- [x] Data Export

### **Phase 3: Collaboration** 🚧
- [ ] Real-time notifications
- [ ] Email integration
- [ ] Slack integration
- [ ] Document versioning
- [ ] Client portal
- [ ] Mobile app

### **Phase 4: Intelligence** 📅
- [ ] AI-powered insights
- [ ] Predictive analytics
- [ ] Automated risk detection
- [ ] Smart task suggestions
- [ ] Budget forecasting

---

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Rate limiting on API endpoints
- SQL injection prevention (Prisma ORM)
- XSS protection (Helmet)
- CORS configuration

---

## 📝 License

This project is licensed under the MIT License.

---

## 🌟 Star History

If you find CaseStack useful, please consider giving it a star! ⭐

---

**Made for consultants, by consultants.** 🚀
