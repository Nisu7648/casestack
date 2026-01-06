# CaseStack

**Unified Consulting Workflow Platform**

CaseStack consolidates 10+ consulting tools into one clean system. Streamline client management, project tracking, time billing, and collaboration.

## 🏗️ Architecture

- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React + TypeScript + Tailwind CSS
- **Desktop**: Electron wrapper for cross-platform desktop app
- **Authentication**: JWT-based with role-based access control

## 🚀 Current Status

### Module 0 - Foundation ✅
- Firm & User System
- Role-based Authentication
- Immutable Activity Logging

## 📋 Roles & Permissions

- **Admin**: Full system access
- **Partner**: Firm-wide visibility, activity logs
- **Manager**: Team management, report oversight
- **Consultant**: Case work, time tracking
- **Viewer**: Read-only access

## 🛠️ Tech Stack

- Node.js 18+
- PostgreSQL 14+
- Express.js
- React 18
- TypeScript
- Electron
- Prisma ORM
- JWT Authentication

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/Nisu7648/casestack.git
cd casestack

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Setup database
cd ../backend
npm run db:setup

# Run development
npm run dev
```

## 🔐 Security

- Bcrypt password hashing
- JWT token authentication
- Role-based access control (RBAC)
- Immutable audit logging
- SQL injection protection via Prisma

## 📄 License

MIT License

## 👥 Contributors

Built with ❤️ for consultants worldwide
