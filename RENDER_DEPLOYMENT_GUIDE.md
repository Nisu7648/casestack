# 🚀 **DEPLOY CASESTACK TO RENDER.COM - FREE TIER**

## ✅ **WHAT YOU'LL GET**

- ✅ Live CASESTACK instance (free)
- ✅ PostgreSQL database (free)
- ✅ HTTPS enabled automatically
- ✅ Custom domain support
- ✅ Auto-deploy on git push

**Cost: $0/month** (Free tier)

---

## 📋 **PREREQUISITES**

1. ✅ GitHub account (you have this)
2. ✅ Render.com account (create free at render.com)
3. ✅ Your GitHub repo: `Nisu7648/casestack`

---

## 🚀 **DEPLOYMENT STEPS (10 MINUTES)**

### **STEP 1: Create Render Account**

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with GitHub
4. Authorize Render to access your repos

---

### **STEP 2: Create PostgreSQL Database**

1. In Render Dashboard, click "New +"
2. Select "PostgreSQL"
3. Fill in:
   - **Name:** `casestack-db`
   - **Database:** `casestack`
   - **User:** `casestack_user`
   - **Region:** Oregon (US West)
   - **Plan:** Free
4. Click "Create Database"
5. **IMPORTANT:** Copy the "Internal Database URL" - you'll need this!

**Example URL:**
```
postgresql://casestack_user:password@dpg-xxxxx-a.oregon-postgres.render.com/casestack
```

---

### **STEP 3: Deploy Backend API**

1. Click "New +" → "Web Service"
2. Connect your GitHub repo: `Nisu7648/casestack`
3. Fill in:
   - **Name:** `casestack-backend`
   - **Region:** Oregon (US West)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Environment Variables** - Click "Advanced" and add:

```
DATABASE_URL = [paste your database URL from Step 2]
JWT_SECRET = casestack-super-secret-key-2024
NODE_ENV = production
PORT = 5000
```

5. Click "Create Web Service"
6. Wait 5-10 minutes for deployment
7. **Copy your backend URL:** `https://casestack-backend.onrender.com`

---

### **STEP 4: Deploy Frontend**

1. Click "New +" → "Static Site"
2. Connect your GitHub repo: `Nisu7648/casestack`
3. Fill in:
   - **Name:** `casestack-frontend`
   - **Branch:** `main`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`

4. **Environment Variables:**

```
VITE_API_URL = https://casestack-backend.onrender.com
```

5. Click "Create Static Site"
6. Wait 5-10 minutes for deployment
7. **Your live URL:** `https://casestack-frontend.onrender.com`

---

## ✅ **VERIFY DEPLOYMENT**

### **Test Backend:**
```bash
curl https://casestack-backend.onrender.com/health
```

**Expected response:**
```json
{"status": "ok", "timestamp": "2024-01-13T10:00:00.000Z"}
```

### **Test Frontend:**
Open in browser:
```
https://casestack-frontend.onrender.com
```

You should see the CASESTACK login page!

---

## 🔧 **TROUBLESHOOTING**

### **Problem: Backend won't start**

**Solution 1: Check logs**
1. Go to Render Dashboard
2. Click on `casestack-backend`
3. Click "Logs" tab
4. Look for errors

**Solution 2: Verify DATABASE_URL**
1. Go to `casestack-db` service
2. Copy "Internal Database URL"
3. Update `casestack-backend` environment variable

**Solution 3: Run migrations manually**
1. In backend service, go to "Shell" tab
2. Run:
```bash
npx prisma migrate deploy
```

---

### **Problem: Frontend shows blank page**

**Solution 1: Check API URL**
1. Go to `casestack-frontend` service
2. Verify `VITE_API_URL` is correct
3. Should be: `https://casestack-backend.onrender.com`

**Solution 2: Rebuild**
1. Click "Manual Deploy" → "Clear build cache & deploy"

---

### **Problem: Database connection error**

**Solution: Update connection string**
1. Render free tier databases sleep after inactivity
2. First request might be slow (15-30 seconds)
3. Subsequent requests will be fast

---

## 🎯 **INITIAL SETUP**

### **1. Create First User**

Open your frontend URL and sign up:
```
https://casestack-frontend.onrender.com
```

Fill in:
- First Name: Your Name
- Last Name: Your Last Name
- Email: your@email.com
- Password: (strong password)

### **2. Create Firm**

After login, you'll be redirected to firm setup:
- Firm Name: Your Firm Name
- Click "Create Firm"
- **Save your firm code!** (e.g., `FIRM-ABC123`)

### **3. Invite Team Members**

1. Go to "Team" page
2. Click "Invite User"
3. Enter email and select role
4. They'll receive invitation link

---

## 📊 **FREE TIER LIMITS**

### **What's Included (Free):**
- ✅ 750 hours/month (enough for 24/7)
- ✅ 512 MB RAM
- ✅ 1 GB PostgreSQL database
- ✅ HTTPS/SSL included
- ✅ Auto-deploy on push
- ✅ Custom domain support

### **Limitations:**
- ⚠️ Services sleep after 15 min inactivity
- ⚠️ First request after sleep: 15-30 seconds
- ⚠️ Subsequent requests: Fast
- ⚠️ Database: 1 GB storage
- ⚠️ 90 days data retention

### **When to Upgrade:**
- Need 24/7 uptime (no sleep)
- Need more storage
- Need faster performance
- Production use

**Paid plan: $7/month** (still cheaper than competitors!)

---

## 🔐 **SECURITY SETUP**

### **1. Change JWT Secret**

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update in Render:
1. Go to `casestack-backend`
2. Environment → `JWT_SECRET`
3. Paste new secret
4. Save changes

### **2. Enable CORS**

Already configured in `backend/src/index.js`:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://casestack-frontend.onrender.com',
  credentials: true
}));
```

### **3. Rate Limiting**

Already enabled:
- 100 requests per 15 minutes per IP
- Prevents abuse

---

## 🎨 **CUSTOM DOMAIN (Optional)**

### **Add Your Domain:**

1. Buy domain (e.g., casestack.com)
2. In Render Dashboard:
   - Go to `casestack-frontend`
   - Click "Settings" → "Custom Domain"
   - Add: `casestack.com` and `www.casestack.com`
3. Update DNS records:
   - Type: CNAME
   - Name: www
   - Value: casestack-frontend.onrender.com
4. Wait 5-10 minutes for SSL

---

## 📈 **MONITORING**

### **Check Service Health:**

**Backend:**
```
https://casestack-backend.onrender.com/health
```

**Database:**
- Go to Render Dashboard
- Click `casestack-db`
- View metrics

### **View Logs:**

1. Go to service in Render
2. Click "Logs" tab
3. Real-time logs appear

### **Set Up Alerts:**

1. Go to service settings
2. Enable "Deploy Notifications"
3. Add email or Slack webhook

---

## 🚀 **AUTO-DEPLOY SETUP**

Already configured! Every time you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render automatically:
1. Detects push
2. Builds new version
3. Runs migrations
4. Deploys
5. Sends notification

**Deploy time: 5-10 minutes**

---

## 💡 **OPTIMIZATION TIPS**

### **1. Keep Services Awake**

Free tier sleeps after 15 min. To keep awake:

**Option A: Cron Job (Free)**
Use cron-job.org to ping every 14 minutes:
```
https://casestack-backend.onrender.com/health
```

**Option B: Upgrade to Paid**
$7/month = no sleep

### **2. Database Optimization**

Add indexes (already done in migrations):
```sql
CREATE INDEX idx_case_firm ON "Case"("firmId");
CREATE INDEX idx_client_firm ON "Client"("firmId");
```

### **3. Enable Compression**

Already enabled in backend:
```javascript
app.use(compression());
```

---

## 📊 **USAGE MONITORING**

### **Track Your Usage:**

1. Render Dashboard → Billing
2. View:
   - Hours used
   - Database size
   - Bandwidth
   - Build minutes

### **Free Tier Limits:**
- 750 hours/month (enough for 1 service 24/7)
- 100 GB bandwidth
- 500 build minutes

---

## 🎯 **TESTING CHECKLIST**

After deployment, test:

- [ ] Can access frontend URL
- [ ] Can sign up new user
- [ ] Can create firm
- [ ] Can create case
- [ ] Can upload file
- [ ] Can create template
- [ ] Can create task
- [ ] Can create event
- [ ] Can view reports
- [ ] Can invite team member

---

## 🆘 **SUPPORT**

### **Render Support:**
- Docs: https://render.com/docs
- Community: https://community.render.com
- Status: https://status.render.com

### **CASESTACK Issues:**
- GitHub: https://github.com/Nisu7648/casestack/issues

---

## ✅ **SUCCESS CHECKLIST**

- [ ] Render account created
- [ ] Database created and running
- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] First user created
- [ ] Firm created
- [ ] Test case created
- [ ] All features working

---

## 🎉 **YOU'RE LIVE!**

**Your CASESTACK URLs:**
- Frontend: `https://casestack-frontend.onrender.com`
- Backend: `https://casestack-backend.onrender.com`
- Database: `dpg-xxxxx-a.oregon-postgres.render.com`

**Share with team:**
```
🚀 CASESTACK is now live!

Access: https://casestack-frontend.onrender.com
Firm Code: [your-firm-code]

Features:
✅ 16 advanced features
✅ AI document analysis
✅ WhatsApp integration
✅ Time tracking
✅ Invoice generation
✅ And much more!
```

---

## 💰 **COST BREAKDOWN**

### **Current (Free Tier):**
- Backend: $0/month
- Frontend: $0/month
- Database: $0/month
- **Total: $0/month** 🎉

### **When You Grow (Paid Tier):**
- Backend: $7/month
- Frontend: $0/month (static sites always free)
- Database: $7/month
- **Total: $14/month**

**Still 79% cheaper than Clio ($68/user)!**

---

## 🚀 **NEXT STEPS**

1. ✅ Test all features
2. ✅ Invite your team
3. ✅ Create test cases
4. ✅ Customize branding
5. ✅ Set up custom domain
6. ✅ Launch to clients!

**You now have a live, professional case management system!** 🎉

---

## 📞 **QUICK REFERENCE**

**Frontend URL:**
```
https://casestack-frontend.onrender.com
```

**Backend API:**
```
https://casestack-backend.onrender.com
```

**Health Check:**
```
https://casestack-backend.onrender.com/health
```

**Render Dashboard:**
```
https://dashboard.render.com
```

**Your GitHub Repo:**
```
https://github.com/Nisu7648/casestack
```

---

## 🎯 **DEPLOYMENT COMPLETE!**

You now have:
- ✅ Live CASESTACK instance
- ✅ 16 advanced features
- ✅ AI-powered automation
- ✅ Professional UI
- ✅ Secure & scalable
- ✅ **$0/month cost**

**Ready to test and show clients!** 🚀🔥
