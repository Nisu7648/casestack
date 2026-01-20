# LegalStack Deployment Guide

## 🚀 Quick Deploy

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Domain name (optional)

---

## 📦 Backend Deployment (Render.com)

### 1. Database Setup
```bash
# Create PostgreSQL database on Render.com or any provider
# Get your DATABASE_URL
```

### 2. Environment Variables
Create `.env` file:
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-super-secret-jwt-key-change-this
NODE_ENV=production
PORT=5000
```

### 3. Deploy to Render
1. Connect GitHub repo to Render
2. Create new Web Service
3. Build Command: `cd backend && npm install && npx prisma generate && npx prisma migrate deploy`
4. Start Command: `cd backend && npm start`
5. Add environment variables
6. Deploy!

### 4. Database Migration
```bash
cd backend
npx prisma migrate deploy
```

---

## 🎨 Frontend Deployment (Vercel/Netlify)

### 1. Environment Variables
Create `.env` file:
```env
VITE_API_URL=https://your-backend-url.onrender.com
```

### 2. Build
```bash
cd frontend
npm install
npm run build
```

### 3. Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

Or use Vercel dashboard:
1. Import GitHub repo
2. Set root directory to `frontend`
3. Add environment variable `VITE_API_URL`
4. Deploy!

---

## 🔧 Local Development

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your database URL
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with backend URL
npm run dev
```

---

## 📊 Features Checklist

### ✅ Completed
- [x] Authentication (Register, Login, JWT)
- [x] Firm Management
- [x] Case Management (CRUD + Workflow)
- [x] Client Management
- [x] Document Management (Upload/Download/Organize)
- [x] Billing & Time Tracking
- [x] Invoice Generation
- [x] Expense Tracking
- [x] Task Management
- [x] Calendar Events
- [x] Reports & Analytics
- [x] Client Portal
- [x] Search Functionality
- [x] Country-based Pricing (60+ countries)
- [x] Modern Landing Page
- [x] Professional UI/UX

### 🎯 Backend API Endpoints (80+)

#### Auth
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/verify` - Verify token

#### Firm
- POST `/api/firm/create` - Create firm
- GET `/api/firm/details` - Get firm details

#### Cases
- GET `/api/cases` - List cases
- POST `/api/cases` - Create case
- GET `/api/cases/:id` - Get case details
- PUT `/api/cases/:id` - Update case
- DELETE `/api/cases/:id` - Delete case
- POST `/api/cases/:id/submit` - Submit for review

#### Documents
- GET `/api/documents/case/:caseId` - List documents
- POST `/api/documents/upload` - Upload document
- GET `/api/documents/download/:id` - Download document
- PUT `/api/documents/:id` - Update document
- DELETE `/api/documents/:id` - Delete document
- POST `/api/documents/folders` - Create folder
- GET `/api/documents/search` - Search documents

#### Billing
- POST `/api/billing/time` - Create time entry
- GET `/api/billing/time/case/:caseId` - Get time entries
- PUT `/api/billing/time/:id` - Update time entry
- DELETE `/api/billing/time/:id` - Delete time entry
- POST `/api/billing/invoices` - Create invoice
- GET `/api/billing/invoices/:id` - Get invoice
- GET `/api/billing/invoices/case/:caseId` - List invoices
- PUT `/api/billing/invoices/:id/status` - Update invoice status
- POST `/api/billing/expenses` - Create expense
- GET `/api/billing/expenses/case/:caseId` - Get expenses

#### Client Portal
- POST `/api/client-portal/auth/register` - Client registration
- POST `/api/client-portal/auth/login` - Client login
- GET `/api/client-portal/dashboard` - Client dashboard
- GET `/api/client-portal/cases` - Client cases
- GET `/api/client-portal/cases/:id` - Case details
- GET `/api/client-portal/documents/:caseId` - Case documents
- POST `/api/client-portal/messages` - Send message

#### Pricing
- GET `/api/pricing/countries` - List all countries
- GET `/api/pricing/country/:country` - Get country pricing
- POST `/api/pricing/calculate` - Calculate price

---

## 🌍 Country-Based Pricing

LegalStack supports fair pricing for 60+ countries:

### Tier 1 (Premium) - $99/month
- United States, Canada, UK, Australia, Germany, France, etc.

### Tier 2 (Standard) - $69/month
- Spain, Italy, South Korea, Saudi Arabia, etc.

### Tier 3 (Emerging) - $49/month
- Brazil, Mexico, Turkey, Thailand, Malaysia, etc.

### Tier 4 (Developing) - $29/month
- India, Pakistan, Bangladesh, Nigeria, Kenya, etc.

---

## 🔒 Security Features

- JWT authentication
- Password hashing (bcrypt)
- CORS protection
- Rate limiting
- Helmet.js security headers
- SQL injection protection (Prisma)
- File upload validation
- Soft delete for data recovery

---

## 📱 Mobile Apps (Coming Soon)

- iOS app (React Native)
- Android app (React Native)
- Offline mode
- Push notifications

---

## 🎯 Roadmap

### Week 1 (Current)
- ✅ Backend complete
- ✅ Frontend UI
- ✅ Landing page
- 🎯 Testing & bug fixes

### Week 2-3
- Mobile apps
- Advanced features
- Performance optimization

### Week 4-6
- Beta testing
- Marketing
- Launch preparation

---

## 💰 Revenue Potential

### Conservative Estimates
- 100 firms × $49/month = $4,900/month
- 500 firms × $49/month = $24,500/month
- 1,000 firms × $49/month = $49,000/month

### Aggressive Growth
- Year 1: $50K-100K MRR
- Year 2: $200K-500K MRR
- Year 3: $1M+ MRR

---

## 🤝 Support

For deployment help:
- Email: support@legalstack.io
- Docs: https://docs.legalstack.io
- GitHub: https://github.com/Nisu7648/casestack

---

## 📄 License

Proprietary - All rights reserved

---

**Built with fairness in mind. Making legal tech accessible worldwide.** 🌍
