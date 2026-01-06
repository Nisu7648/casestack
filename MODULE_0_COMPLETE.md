# CaseStack - Module 0 Complete ✅

## 🎉 What's Been Built

### Backend (Node.js + Express + PostgreSQL)

**✅ Database Schema (Prisma ORM)**
- `Firm` entity with country and billing flag
- `User` entity with 5 roles (ADMIN, PARTNER, MANAGER, CONSULTANT, VIEWER)
- `ActivityLog` entity (immutable, append-only)

**✅ Authentication System**
- Email + password registration
- JWT-based authentication
- Secure password hashing (bcrypt)
- Token-based sessions (7-day expiry)

**✅ Role-Based Access Control (RBAC)**
- Middleware for authentication
- Role-based authorization
- Permission matrix for each role
- Route-level protection

**✅ Activity Logging (Immutable)**
- Automatic logging middleware
- Tracks: Who, What, When, Entity
- Denormalized user data for immutability
- IP address and user agent tracking
- CSV export functionality
- Only viewable by ADMIN/PARTNER

**✅ API Endpoints**
- Authentication: register, login, logout
- Users: CRUD operations with role checks
- Firm: view and update firm details
- Activity Logs: view, filter, export

**✅ Security Features**
- Helmet.js for HTTP headers
- CORS configuration
- Rate limiting (100 req/15min)
- SQL injection protection (Prisma)
- Input validation (express-validator)
- Centralized error handling

### Frontend (React + TypeScript + Vite)

**✅ Project Structure**
- Vite build system
- TypeScript configuration
- Tailwind CSS styling
- React Router v6
- Zustand state management
- React Query for data fetching

**✅ Authentication Flow**
- Login/Register pages
- Protected routes
- Persistent auth state
- Automatic token injection
- 401 redirect handling

**✅ API Client**
- Axios with interceptors
- Automatic token management
- Error handling
- Base URL configuration

## 📁 Project Structure

```
casestack/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── controllers/           # Business logic
│   │   │   ├── auth.controller.js
│   │   │   ├── user.controller.js
│   │   │   ├── firm.controller.js
│   │   │   └── activityLog.controller.js
│   │   ├── middleware/            # Auth, logging, errors
│   │   │   ├── auth.js
│   │   │   ├── activityLogger.js
│   │   │   └── errorHandler.js
│   │   ├── routes/                # API routes
│   │   │   ├── auth.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── firm.routes.js
│   │   │   └── activityLog.routes.js
│   │   └── server.js              # Express app
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/            # React components
│   │   ├── pages/                 # Page components
│   │   ├── stores/                # Zustand stores
│   │   │   └── authStore.ts
│   │   ├── lib/                   # Utilities
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── package.json
├── README.md
├── SETUP.md
└── .gitignore
```

## 🔐 Role Permissions Matrix

| Feature | ADMIN | PARTNER | MANAGER | CONSULTANT | VIEWER |
|---------|-------|---------|---------|------------|--------|
| View all reports | ✅ | ✅ | Team only | Own only | ✅ |
| Create reports | ✅ | ✅ | ✅ | ✅ | ❌ |
| Edit reports | ✅ | ✅ | ✅ | Own only | ❌ |
| Delete reports | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage users | ✅ | ✅ | Team only | ❌ | ❌ |
| Delete users | ✅ | ❌ | ❌ | ❌ | ❌ |
| View activity logs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Export data | ✅ | ✅ | ❌ | ❌ | ❌ |
| Firm settings | ✅ | ❌ | ❌ | ❌ | ❌ |

## 🚀 Quick Start

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your database credentials
npm run db:setup
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Visit: http://localhost:3000

## 📊 Database Schema

### Firms
```sql
- id: UUID (PK)
- name: String
- country: String
- billingEnabled: Boolean
- createdAt, updatedAt: DateTime
```

### Users
```sql
- id: UUID (PK)
- email: String (unique)
- password: String (hashed)
- firstName, lastName: String
- role: Enum (ADMIN, PARTNER, MANAGER, CONSULTANT, VIEWER)
- isActive: Boolean
- firmId: UUID (FK → Firms)
- createdAt, updatedAt, lastLoginAt: DateTime
```

### ActivityLogs
```sql
- id: UUID (PK)
- userId: UUID (FK → Users)
- userEmail, userName, userRole: String (denormalized)
- action: Enum (CREATE, UPDATE, DELETE, VIEW, EXPORT, LOGIN, LOGOUT)
- entity: String (e.g., "Report", "User")
- entityId: String (nullable)
- details: JSON
- timestamp: DateTime
- firmId: UUID (FK → Firms)
- ipAddress, userAgent: String
```

## 🔧 Tech Stack

**Backend:**
- Node.js 18+
- Express.js
- PostgreSQL 14+
- Prisma ORM
- JWT (jsonwebtoken)
- Bcrypt
- Helmet, CORS, Rate Limiting

**Frontend:**
- React 18
- TypeScript
- Vite
- React Router v6
- Zustand (state)
- React Query (data fetching)
- Tailwind CSS
- Axios

## 📝 API Examples

### Register
```bash
POST /api/auth/register
{
  "email": "admin@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "firmName": "Acme Consulting",
  "country": "India"
}
```

### Login
```bash
POST /api/auth/login
{
  "email": "admin@example.com",
  "password": "password123"
}
```

### Get Users (Protected)
```bash
GET /api/users
Authorization: Bearer <token>
```

### View Activity Logs (ADMIN/PARTNER only)
```bash
GET /api/activity-logs?page=1&limit=50
Authorization: Bearer <token>
```

## ✅ Module 0 Checklist

- [x] Firm entity with country and billing flag
- [x] User entity with 5 roles
- [x] Email + password authentication
- [x] JWT-based sessions
- [x] Role-based access control
- [x] Permission middleware
- [x] Immutable activity logging
- [x] Activity log viewing (ADMIN/PARTNER)
- [x] CSV export of logs
- [x] User CRUD operations
- [x] Firm management
- [x] Security hardening
- [x] Frontend structure
- [x] API client setup
- [x] Documentation

## 🎯 Next Modules

**Module 1: Client Management**
- Client entity
- Contact management
- Client portal

**Module 2: Case/Project Management**
- Case entity
- Task management
- Milestones

**Module 3: Time Tracking**
- Time entries
- Billable hours
- Timesheets

**Module 4: Invoicing & Billing**
- Invoice generation
- Payment tracking
- Expense management

## 📚 Documentation

- [SETUP.md](./SETUP.md) - Detailed setup instructions
- [README.md](./README.md) - Project overview

## 🔗 Repository

https://github.com/Nisu7648/casestack

---

**Module 0 Status: COMPLETE ✅**

Ready to proceed with Module 1 when you are!
