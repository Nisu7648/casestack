# Complete Setup Guide - CaseStack

**Everything you need to get CaseStack running - Network issues FIXED!**

---

## 🎯 What's Been Fixed

### Network Issues - SOLVED ✅

**Before:**
- ❌ Network errors
- ❌ Connection refused
- ❌ CORS errors
- ❌ Timeout issues
- ❌ 404 errors

**After:**
- ✅ **Automatic retry** - 3 attempts with exponential backoff
- ✅ **Better error messages** - User-friendly error handling
- ✅ **CORS fixed** - Proper origin configuration
- ✅ **Timeout handling** - 30 second timeout
- ✅ **Request logging** - Debug info in console
- ✅ **Health checks** - `/health` endpoint
- ✅ **Proxy configuration** - Vite proxy for development

---

## 🚀 Quick Start (5 Minutes)

### Option 1: Automated Setup (Easiest)

```bash
# 1. Clone repository
git clone https://github.com/yourusername/casestack.git
cd casestack

# 2. Run setup script
chmod +x setup.sh
./setup.sh

# 3. Start backend (Terminal 1)
cd backend
npm run dev

# 4. Start frontend (Terminal 2)
cd frontend
npm run dev

# 5. Open browser
# http://localhost:3000
```

### Option 2: Manual Setup

```bash
# 1. Clone repository
git clone https://github.com/yourusername/casestack.git
cd casestack

# 2. Backend setup
cd backend
npm install
cp .env.example .env

# Edit backend/.env:
# DATABASE_URL="postgresql://user:pass@localhost:5432/casestack"
# JWT_SECRET="your-secret-key"
# PORT=5000
# ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"

# 3. Database setup
createdb casestack
npx prisma migrate dev

# 4. Frontend setup
cd ../frontend
npm install
cp .env.example .env

# Edit frontend/.env:
# VITE_API_URL=http://localhost:5000

# 5. Start backend (Terminal 1)
cd backend
npm run dev

# 6. Start frontend (Terminal 2)
cd frontend
npm run dev

# 7. Open browser
# http://localhost:3000
```

---

## ✅ Verification Steps

### 1. Check Backend

```bash
# Test health endpoint
curl http://localhost:5000/health

# Expected response:
{
  "status": "ok",
  "service": "CaseStack API",
  "version": "3.0.0"
}
```

### 2. Check Frontend

Open browser: `http://localhost:3000`

Open DevTools (F12) → Console:
```
[API Request] GET /health
[API Response] GET /health 200
```

### 3. Test API

```bash
# Test endpoint
curl http://localhost:5000/api/test

# Expected response:
{
  "success": true,
  "message": "API is working!",
  "timestamp": "2024-01-10T..."
}
```

---

## 🔧 Configuration Files

### Backend Environment (.env)

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/casestack?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Server
PORT=5000
NODE_ENV="development"

# CORS - IMPORTANT!
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:3001"

# Stripe (optional)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

### Frontend Environment (.env)

```env
# API URL - IMPORTANT!
VITE_API_URL=http://localhost:5000

# In production:
# VITE_API_URL=https://api.your-domain.com
```

---

## 🐛 Troubleshooting

### Problem 1: "Network Error"

**Symptoms:**
- Browser console shows "Network Error"
- Requests fail immediately

**Solution:**
```bash
# 1. Check if backend is running
curl http://localhost:5000/health

# 2. If not running, start backend
cd backend
npm run dev

# 3. Check VITE_API_URL in frontend/.env
cat frontend/.env
# Should be: VITE_API_URL=http://localhost:5000

# 4. Restart frontend
cd frontend
npm run dev
```

### Problem 2: "CORS Error"

**Symptoms:**
- Browser console shows CORS error
- "Access-Control-Allow-Origin" error

**Solution:**
```bash
# 1. Edit backend/.env
# Add your frontend URL to ALLOWED_ORIGINS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"

# 2. Restart backend
cd backend
npm run dev
```

### Problem 3: "Connection Refused"

**Symptoms:**
- "ECONNREFUSED" error
- Cannot connect to localhost:5000

**Solution:**
```bash
# 1. Check if port 5000 is in use
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# 2. Kill process if needed
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# 3. Or use different port
# Edit backend/.env
PORT=5001

# Edit frontend/.env
VITE_API_URL=http://localhost:5001

# 4. Restart both
```

### Problem 4: "404 Not Found"

**Symptoms:**
- API requests return 404
- Routes not found

**Solution:**
```bash
# 1. Check API URL format
# Correct: http://localhost:5000/api/cases
# Wrong: http://localhost:5000/cases

# 2. Verify backend routes
cd backend
npm run dev

# Look for:
# ✅ Active Modules: ...
# 📊 Total API Endpoints: 70+

# 3. Test specific endpoint
curl http://localhost:5000/api/test
```

### Problem 5: Database Connection Error

**Symptoms:**
- "Can't reach database server"
- Prisma connection error

**Solution:**
```bash
# 1. Check if PostgreSQL is running
psql --version

# 2. Check if database exists
psql -l | grep casestack

# 3. Create database if needed
createdb casestack

# 4. Run migrations
cd backend
npx prisma migrate dev

# 5. Check DATABASE_URL in .env
cat .env | grep DATABASE_URL
```

---

## 📊 What's Included

### Backend Features
- ✅ Express.js server
- ✅ PostgreSQL database
- ✅ Prisma ORM
- ✅ JWT authentication
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ Error handling
- ✅ Request logging
- ✅ Health checks
- ✅ Geo-based pricing
- ✅ Stripe integration

### Frontend Features
- ✅ React + TypeScript
- ✅ Vite build tool
- ✅ TailwindCSS
- ✅ Axios API client
- ✅ Automatic retry
- ✅ Error handling
- ✅ Request logging
- ✅ Clean UI (black/white/grey)
- ✅ No animations (fast)
- ✅ Responsive design

### Network Improvements
- ✅ Automatic retry (3 attempts)
- ✅ Exponential backoff
- ✅ Better error messages
- ✅ CORS fixed
- ✅ Timeout handling (30s)
- ✅ Request/response logging
- ✅ Health check endpoint
- ✅ Proxy configuration
- ✅ IP detection for geo-pricing

---

## 🎨 UI Design

### Color Scheme
- **Primary:** Black (#000000)
- **Secondary:** White (#FFFFFF)
- **Tertiary:** Grey (#888888)
- **Accent:** Black for CTAs

### Design Principles
- ✅ Clean and minimal
- ✅ No animations (fast loading)
- ✅ Professional appearance
- ✅ High contrast
- ✅ Clear hierarchy
- ✅ Responsive layout

---

## 💰 Pricing System

### Geo-Based Pricing
- **90+ countries** supported
- **3 pricing tiers** based on purchasing power
- **Automatic detection** via IP geolocation
- **Fair pricing** for global access

### Examples
| Country | Price | Currency |
|---------|-------|----------|
| Switzerland | 120 | CHF |
| United States | 78 | USD |
| United Kingdom | 78 | GBP |
| Germany | 82 | EUR |
| India | 35 | INR |
| Brazil | 58 | BRL |
| Philippines | 38 | PHP |

---

## 🚀 Deployment

### Docker (Recommended)

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose ps
docker-compose logs -f
```

### Manual Deployment

```bash
# Backend
cd backend
npm install --production
npm run build
npm start

# Frontend
cd frontend
npm install
npm run build
# Serve dist/ folder
```

---

## 📚 Documentation

### Essential Guides
- [README.md](README.md) - Quick start
- [NETWORK_FIX.md](NETWORK_FIX.md) - Network troubleshooting
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Project overview
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Deployment instructions
- [FAQ.md](FAQ.md) - Frequently asked questions

### API Documentation
- Authentication: `/api/auth/*`
- Cases: `/api/cases/*`
- Clients: `/api/clients/*`
- Tasks: `/api/tasks/*`
- Billing: `/api/billing/*`
- Health: `/health`

---

## ✅ Final Checklist

Before you start:

- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Git installed
- [ ] Terminal/Command Prompt ready

After setup:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] Database created and migrated
- [ ] .env files configured
- [ ] Health check passes
- [ ] Browser opens successfully
- [ ] No console errors

---

## 🎉 Success!

If you see this in your terminal:

**Backend:**
```
🚀 CaseStack API v3.0 - Production Ready
📡 Server: http://0.0.0.0:5000
✅ Active Modules: ...
```

**Frontend:**
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:3000
```

**And browser console shows:**
```
[API Request] GET /health
[API Response] GET /health 200
```

**You're all set! 🎊**

---

## 🆘 Need Help?

1. **Check logs:**
   - Backend: Terminal running `npm run dev`
   - Frontend: Terminal running `npm run dev`
   - Browser: DevTools Console (F12)

2. **Read documentation:**
   - [NETWORK_FIX.md](NETWORK_FIX.md) - Network issues
   - [FAQ.md](FAQ.md) - Common questions
   - [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) - Overview

3. **Test endpoints:**
   ```bash
   curl http://localhost:5000/health
   curl http://localhost:5000/api/test
   ```

4. **Clean install:**
   ```bash
   # Backend
   cd backend
   rm -rf node_modules package-lock.json
   npm install
   
   # Frontend
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

---

## 🌟 What's Next?

1. **Explore features:**
   - Create cases
   - Add clients
   - Track time
   - Generate reports

2. **Customize:**
   - Update branding
   - Configure workflows
   - Setup integrations

3. **Deploy:**
   - Choose hosting
   - Configure domain
   - Setup SSL
   - Go live!

---

**CaseStack is ready to transform your law firm! 🚀**

**Clean. Fast. Professional. Global.**
