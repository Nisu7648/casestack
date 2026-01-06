# CaseStack Setup Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/casestack?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:3000"
```

### 3. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:setup

# (Optional) Open Prisma Studio to view database
npm run db:studio
```

### 4. Start Backend Server

```bash
npm run dev
```

Backend will run on `http://localhost:5000`

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Create `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Frontend

```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Testing the Application

### 1. Register a New Firm

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "firmName": "Acme Consulting",
    "country": "India"
  }'
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'
```

### 3. Access Protected Routes

Use the token from login response:

```bash
curl http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Module 0 Features

✅ **Firm & User System**
- Firm entity with country and billing flag
- Users belong to one firm
- 5 roles: Admin, Partner, Manager, Consultant, Viewer

✅ **Authentication & Access**
- Email + password authentication
- JWT-based sessions
- Role-based access control (RBAC)
- Permission middleware

✅ **Activity Log (Immutable)**
- Every action logged automatically
- Tracks: Who, What, When, On which entity
- Append-only, non-editable
- Viewable by Partner/Admin only
- CSV export capability

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new firm + admin
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users` - List all users (Admin/Partner/Manager)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (Admin/Partner)
- `PUT /api/users/:id` - Update user (Admin/Partner)
- `DELETE /api/users/:id` - Delete user (Admin only)
- `PATCH /api/users/:id/deactivate` - Deactivate user
- `PATCH /api/users/:id/activate` - Activate user

### Firm
- `GET /api/firms/me` - Get current firm
- `PUT /api/firms/me` - Update firm (Admin only)
- `GET /api/firms/stats` - Get firm statistics

### Activity Logs
- `GET /api/activity-logs` - List all logs (Admin/Partner)
- `GET /api/activity-logs/user/:userId` - User's logs
- `GET /api/activity-logs/entity/:entity/:entityId` - Entity logs
- `GET /api/activity-logs/export` - Export logs as CSV

## Role Permissions

### ADMIN
- Full system access
- All CRUD operations
- Delete users
- Manage firm settings

### PARTNER
- View all reports
- View activity logs
- Manage users (create, update, deactivate)
- View firm data
- Export data

### MANAGER
- View team reports
- Manage team members
- Create and edit reports
- View clients

### CONSULTANT
- View own reports
- Create reports
- Edit own reports
- Track time
- View assigned clients

### VIEWER
- Read-only access
- View reports
- View clients

## Database Schema

### Firms Table
- id (UUID)
- name
- country
- billingEnabled
- timestamps

### Users Table
- id (UUID)
- email (unique)
- password (hashed)
- firstName, lastName
- role (enum)
- isActive
- firmId (FK)
- timestamps
- lastLoginAt

### Activity Logs Table
- id (UUID)
- userId, userEmail, userName, userRole (denormalized)
- action (enum)
- entity, entityId
- details (JSON)
- timestamp
- firmId (FK)
- ipAddress, userAgent

## Next Steps

Module 0 is complete! Ready for:
- Module 1: Client Management
- Module 2: Case/Project Management
- Module 3: Time Tracking
- Module 4: Invoicing & Billing

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U username -d casestack
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Prisma Issues
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Regenerate client
npx prisma generate
```
