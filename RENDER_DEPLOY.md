# Deploy LegalStack to Render - Complete Guide

Deploy BOTH backend and frontend on Render.com (no Vercel needed).

## 🎯 What You'll Create

1. **PostgreSQL Database** - Store all data
2. **Backend Web Service** - API (Node.js + Express)
3. **Frontend Web Service** - UI (React + Vite)

**Total Cost: $0/month (Free tier)**

---

## 📋 Prerequisites

- GitHub account with `Nisu7648/casestack` repo
- Render.com account (free)

---

## 🚀 Step 1: Create PostgreSQL Database (3 minutes)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Settings:
   - **Name**: `legalstack-db`
   - **Database**: `legalstack`
   - **User**: `legalstack_user` (auto-generated)
   - **Region**: Choose closest to you
   - **Plan**: **Free**
4. Click **"Create Database"**
5. Wait 2-3 minutes for provisioning
6. **IMPORTANT**: Copy the **"Internal Database URL"** (starts with `postgresql://`)
   - Example: `postgresql://legalstack_user:xxx@dpg-xxx/legalstack`
   - You'll need this for backend

---

## 🔧 Step 2: Deploy Backend API (10 minutes)

1. Click **"New +"** → **"Web Service"**
2. Click **"Build and deploy from a Git repository"**
3. Connect your GitHub account if not connected
4. Select repository: **`Nisu7648/casestack`**
5. Click **"Connect"**

### Backend Configuration:

**Basic Settings:**
- **Name**: `legalstack-api`
- **Region**: Same as database
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: `Node`
- **Build Command**: 
  ```bash
  npm install && npx prisma generate && npx prisma migrate deploy
  ```
- **Start Command**: 
  ```bash
  npm start
  ```

**Instance Type:**
- **Plan**: **Free**

**Environment Variables** (Click "Add Environment Variable"):
```
DATABASE_URL=<paste-internal-database-url-from-step-1>
JWT_SECRET=legalstack-super-secret-key-change-in-production-2024
NODE_ENV=production
PORT=10000
```

**Advanced Settings:**
- **Auto-Deploy**: Yes (deploys on git push)
- **Health Check Path**: `/health`

6. Click **"Create Web Service"**
7. Wait 5-10 minutes for deployment
8. **COPY THE URL** when done (e.g., `https://legalstack-api.onrender.com`)

### Test Backend:
```bash
curl https://legalstack-api.onrender.com/health
# Should return: {"status":"ok",...}
```

---

## 🎨 Step 3: Deploy Frontend (10 minutes)

1. Click **"New +"** → **"Web Service"**
2. Select repository: **`Nisu7648/casestack`**
3. Click **"Connect"**

### Frontend Configuration:

**Basic Settings:**
- **Name**: `legalstack-app`
- **Region**: Same as backend
- **Branch**: `main`
- **Root Directory**: `frontend`
- **Runtime**: `Node`
- **Build Command**: 
  ```bash
  npm install && npm run build
  ```
- **Start Command**: 
  ```bash
  npm run preview -- --host 0.0.0.0 --port $PORT
  ```

**Instance Type:**
- **Plan**: **Free**

**Environment Variables**:
```
VITE_API_URL=<paste-backend-url-from-step-2>
```
Example: `VITE_API_URL=https://legalstack-api.onrender.com`

**Advanced Settings:**
- **Auto-Deploy**: Yes

4. Click **"Create Web Service"**
5. Wait 5-10 minutes for deployment
6. **COPY THE URL** when done (e.g., `https://legalstack-app.onrender.com`)

---

## ✅ Step 4: Test Everything

### 1. Test Backend Health:
```bash
curl https://legalstack-api.onrender.com/health
```
**Expected**: `{"status":"ok","timestamp":"...","uptime":...}`

### 2. Test Frontend:
Open in browser: `https://legalstack-app.onrender.com`
**Expected**: Landing page loads

### 3. Test Registration:
1. Click "Get Started"
2. Fill form:
   - Email: `test@example.com`
   - Password: `Test1234`
   - First Name: `Test`
   - Last Name: `User`
   - Firm Name: `Test Firm`
   - Country: `United States`
3. Click "Register"

**If registration fails with "firmId required":**
Run this SQL fix (see Step 5 below)

---

## 🔧 Step 5: Fix Schema (If Needed)

If registration fails with database error about `firmId`:

### Option A: Using Render Dashboard
1. Go to your database: `legalstack-db`
2. Click **"Connect"** → **"External Connection"**
3. Use any PostgreSQL client (pgAdmin, DBeaver, etc.)
4. Run this SQL:
```sql
ALTER TABLE "users" ALTER COLUMN "firmId" DROP NOT NULL;
```

### Option B: Using Render Shell
1. Go to backend service: `legalstack-api`
2. Click **"Shell"** tab
3. Run:
```bash
psql $DATABASE_URL -c 'ALTER TABLE "users" ALTER COLUMN "firmId" DROP NOT NULL;'
```

### Test Again:
Try registration again - should work now!

---

## 📊 Your Deployed Services

After completion, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| Database | Internal only | PostgreSQL data storage |
| Backend API | `https://legalstack-api.onrender.com` | REST API |
| Frontend | `https://legalstack-app.onrender.com` | User interface |

---

## ⚠️ Known Issues (Free Tier)

### 1. **Slow First Load (30-60 seconds)**
- Free tier services "sleep" after 15 minutes of inactivity
- First request wakes them up (slow)
- Subsequent requests are fast (2-5 seconds)

**Solution**: Upgrade to paid tier ($7/month per service) for always-on

### 2. **Database Expires in 90 Days**
- Free PostgreSQL databases expire after 90 days
- You'll get email warnings
- Backup your data before expiry

**Solution**: Upgrade to paid database ($7/month) for permanent storage

### 3. **Limited Resources**
- Free tier: 512MB RAM, 0.1 CPU
- May be slow with multiple users
- Good for testing, not production

**Solution**: Upgrade when you get real users

---

## 🐛 Troubleshooting

### Backend won't start:
1. Check logs in Render dashboard
2. Verify `DATABASE_URL` is correct
3. Check build command ran successfully
4. Verify migrations ran: `npx prisma migrate deploy`

### Frontend shows blank page:
1. Check browser console for errors
2. Verify `VITE_API_URL` is correct
3. Check if backend is running
4. Try hard refresh: `Ctrl+Shift+R`

### Registration fails:
1. Check backend logs
2. Run schema fix (Step 5)
3. Verify database connection
4. Check if migrations ran

### "Cannot connect to database":
1. Verify `DATABASE_URL` is the **Internal** URL (not External)
2. Check database is running
3. Verify backend and database are in same region

---

## 🎯 What Works vs What Doesn't

### ✅ Will Work:
- Registration
- Login
- Dashboard
- Case creation
- Client management
- Time tracking
- Invoice generation

### ❌ Won't Work (Yet):
- Document upload (no file storage configured)
- Email notifications (no SMTP)
- Payment processing (no Stripe)
- Google OAuth (not configured)

---

## 💰 Cost Breakdown

### Free Tier (Testing):
- PostgreSQL: Free (90 days)
- Backend: Free (sleeps after 15min)
- Frontend: Free (sleeps after 15min)
- **Total: $0/month**

### Paid Tier (Production):
- PostgreSQL: $7/month
- Backend: $7/month (always-on)
- Frontend: $7/month (always-on)
- **Total: $21/month**

---

## 🚀 Next Steps After Deployment

1. ✅ **Test all features** - Find bugs
2. 🔧 **Fix critical bugs** - Make it stable
3. 📁 **Add file storage** - AWS S3 or Cloudinary
4. 📧 **Add email** - SendGrid or AWS SES
5. 👥 **Get beta users** - 5-10 law firms
6. 📊 **Collect feedback** - Fix issues
7. 💰 **Launch** - Start charging

---

## 📝 Quick Reference

### Backend URL:
```
https://legalstack-api.onrender.com
```

### Frontend URL:
```
https://legalstack-app.onrender.com
```

### Health Check:
```bash
curl https://legalstack-api.onrender.com/health
```

### Test Registration:
```bash
curl -X POST https://legalstack-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "firstName": "Test",
    "lastName": "User",
    "firmName": "Test Firm",
    "country": "United States"
  }'
```

---

## 🎉 Success!

If you can:
1. ✅ Open frontend URL
2. ✅ See landing page
3. ✅ Register a user
4. ✅ Login successfully
5. ✅ See dashboard

**You're live! 🚀**

Now go find bugs and fix them. That's how you make it production-ready.

---

**Questions? Issues? Check logs in Render dashboard.**
