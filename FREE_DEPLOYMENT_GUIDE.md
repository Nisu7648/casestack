# 🚀 FREE DEPLOYMENT GUIDE - CASESTACK

## 100% FREE hosting for Backend + Frontend + Database

---

## 🎯 **BEST FREE OPTIONS**

### **Option 1: Render.com (RECOMMENDED)** ⭐
- ✅ Free PostgreSQL database (90 days, then $7/month)
- ✅ Free web service (512MB RAM)
- ✅ Auto-deploy from GitHub
- ✅ Free SSL certificate
- ✅ No credit card required

### **Option 2: Fly.io**
- ✅ Free PostgreSQL (3GB storage)
- ✅ Free web service (256MB RAM)
- ✅ 3 free VMs
- ✅ Credit card required (but not charged)

### **Option 3: Koyeb**
- ✅ Free web service
- ✅ Auto-deploy from GitHub
- ✅ Free SSL
- ✅ No credit card required

---

## 🚀 **DEPLOY TO RENDER.COM (EASIEST)**

### **Step 1: Create Render Account**
1. Go to https://render.com
2. Click "Get Started"
3. Sign up with GitHub (no credit card needed)

### **Step 2: Create PostgreSQL Database**
1. Click "New +" → "PostgreSQL"
2. **Name:** `casestack-db`
3. **Database:** `casestack`
4. **User:** `casestack_user`
5. **Region:** Choose closest to you
6. **Plan:** Free
7. Click "Create Database"
8. **SAVE THE CONNECTION STRING** (Internal Database URL)

### **Step 3: Deploy Backend**
1. Click "New +" → "Web Service"
2. Connect your GitHub account
3. Select repository: `Nisu7648/casestack`
4. **Settings:**
   - **Name:** `casestack-backend`
   - **Region:** Same as database
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `node src/server.casestack.js`
   - **Plan:** Free

5. **Environment Variables** (click "Advanced" → "Add Environment Variable"):
   ```
   DATABASE_URL=<paste-internal-database-url-from-step-2>
   JWT_SECRET=casestack-super-secret-key-2024-change-this
   JWT_EXPIRES_IN=7d
   STORAGE_TYPE=local
   NODE_ENV=production
   PORT=5000
   ```

6. Click "Create Web Service"
7. Wait 5-10 minutes for deployment
8. **SAVE YOUR BACKEND URL:** `https://casestack-backend.onrender.com`

### **Step 4: Deploy Frontend to Vercel**
1. Go to https://vercel.com
2. Sign up with GitHub (free)
3. Click "Add New" → "Project"
4. Import `Nisu7648/casestack`
5. **Settings:**
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

6. **Environment Variables:**
   ```
   VITE_API_URL=https://casestack-backend.onrender.com
   ```

7. Click "Deploy"
8. Wait 2-3 minutes
9. **YOUR APP IS LIVE!** 🎉

---

## 🚀 **ALTERNATIVE: DEPLOY TO FLY.IO**

### **Step 1: Install Fly CLI**
```bash
# macOS/Linux
curl -L https://fly.io/install.sh | sh

# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex
```

### **Step 2: Login**
```bash
fly auth login
```

### **Step 3: Create fly.toml for Backend**
Create `backend/fly.toml`:
```toml
app = "casestack-backend"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "8080"
  NODE_ENV = "production"
  STORAGE_TYPE = "local"
  JWT_EXPIRES_IN = "7d"

[[services]]
  http_checks = []
  internal_port = 8080
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    restart_limit = 0
    timeout = "2s"
```

### **Step 4: Create PostgreSQL**
```bash
cd backend
fly postgres create --name casestack-db --region sjc
```

### **Step 5: Deploy Backend**
```bash
# Set secrets
fly secrets set JWT_SECRET=your-secret-key-here

# Attach database
fly postgres attach casestack-db

# Deploy
fly deploy
```

### **Step 6: Deploy Frontend to Vercel**
Same as Render option above.

---

## 🚀 **ALTERNATIVE: DEPLOY TO KOYEB**

### **Step 1: Create Koyeb Account**
1. Go to https://koyeb.com
2. Sign up with GitHub (free)

### **Step 2: Create PostgreSQL (Use Supabase Free)**
1. Go to https://supabase.com
2. Create free account
3. Create new project
4. Get connection string from Settings → Database

### **Step 3: Deploy Backend**
1. In Koyeb, click "Create App"
2. Select "GitHub"
3. Choose `Nisu7648/casestack`
4. **Settings:**
   - **Branch:** `main`
   - **Build command:** `cd backend && npm install && npx prisma generate`
   - **Run command:** `cd backend && node src/server.casestack.js`
   - **Port:** 5000

5. **Environment Variables:**
   ```
   DATABASE_URL=<supabase-connection-string>
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=7d
   STORAGE_TYPE=local
   NODE_ENV=production
   ```

6. Click "Deploy"

---

## 📦 **COMPLETE RENDER.COM DEPLOYMENT (COPY-PASTE)**

### **Backend Environment Variables:**
```env
DATABASE_URL=postgresql://casestack_user:password@dpg-xxxxx.oregon-postgres.render.com/casestack
JWT_SECRET=casestack-production-secret-2024-change-this-to-random-string
JWT_EXPIRES_IN=7d
STORAGE_TYPE=local
NODE_ENV=production
PORT=5000
```

### **Frontend Environment Variables (Vercel):**
```env
VITE_API_URL=https://casestack-backend.onrender.com
```

---

## ✅ **VERIFICATION STEPS**

### **1. Check Backend Health**
```bash
curl https://casestack-backend.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-09T...",
  "uptime": 123.45,
  "database": "connected"
}
```

### **2. Test Registration**
```bash
curl -X POST https://casestack-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@testfirm.com",
    "password": "SecurePass123!",
    "firstName": "Admin",
    "lastName": "User",
    "firmName": "Test Firm LLP",
    "country": "India"
  }'
```

### **3. Open Frontend**
Go to your Vercel URL: `https://casestack-xxxxx.vercel.app`

---

## 🎯 **RECOMMENDED SETUP (100% FREE)**

| Component | Platform | Cost | Limits |
|-----------|----------|------|--------|
| **Backend** | Render.com | FREE | 512MB RAM, sleeps after 15min inactivity |
| **Database** | Render PostgreSQL | FREE (90 days) | 1GB storage, then $7/month |
| **Frontend** | Vercel | FREE | Unlimited bandwidth |
| **Total** | | **$0/month** | Perfect for testing/demo |

---

## 🔧 **TROUBLESHOOTING**

### **Issue: Backend sleeps on Render free tier**
**Solution:** 
- Upgrade to paid ($7/month) for always-on
- Or use a cron job to ping every 10 minutes:
  ```bash
  # Add to crontab
  */10 * * * * curl https://casestack-backend.onrender.com/health
  ```

### **Issue: Database connection fails**
**Solution:**
- Check DATABASE_URL is correct
- Ensure database is in same region as backend
- Check database is not suspended

### **Issue: Frontend can't connect to backend**
**Solution:**
- Check VITE_API_URL is correct
- Ensure backend is deployed and running
- Check CORS settings in backend

---

## 💰 **COST BREAKDOWN**

### **Free Forever:**
- Vercel Frontend: FREE ✅
- Render Backend: FREE (with sleep) ✅
- Render Database: FREE for 90 days, then $7/month

### **Paid (Always-On):**
- Vercel Frontend: FREE ✅
- Render Backend: $7/month
- Render Database: $7/month
- **Total: $14/month** for production-ready hosting

---

## 🚀 **QUICK START COMMANDS**

### **Deploy Backend to Render:**
1. Create account: https://render.com
2. New PostgreSQL database
3. New Web Service from GitHub
4. Set environment variables
5. Deploy!

### **Deploy Frontend to Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
cd frontend
vercel --prod
```

---

## 📞 **SUPPORT**

If you face any issues:
1. Check Render logs: Dashboard → Service → Logs
2. Check Vercel logs: Dashboard → Deployments → View Logs
3. Test backend health endpoint
4. Check environment variables

---

## ✅ **DEPLOYMENT CHECKLIST**

- [ ] Render account created
- [ ] PostgreSQL database created
- [ ] Database connection string saved
- [ ] Backend deployed to Render
- [ ] Backend health check passes
- [ ] Vercel account created
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variables set
- [ ] Can access frontend URL
- [ ] Can register new firm
- [ ] Can login
- [ ] Can create case
- [ ] **CASESTACK IS LIVE!** 🎉

---

**CASESTACK - Free Deployment Guide**  
**Get your app live in 15 minutes. Zero cost.** 🚀💰
