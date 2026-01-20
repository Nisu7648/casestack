# Quick Deploy Checklist - LegalStack

## ⚠️ HONEST STATUS
- Code written: ✅
- Tests written: ✅
- Tests RUN: ❌ (need database)
- Deployed: ❌
- Users: 0

## 🚀 Deploy Backend (Render.com) - 10 minutes

### 1. Create PostgreSQL Database
1. Go to https://render.com
2. Click "New +" → "PostgreSQL"
3. Name: `legalstack-db`
4. Plan: Free (for testing)
5. Click "Create Database"
6. **Copy the Internal Database URL**

### 2. Deploy Backend
1. Click "New +" → "Web Service"
2. Connect GitHub repo: `Nisu7648/casestack`
3. Settings:
   - **Name**: `legalstack-api`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. Environment Variables:
   ```
   DATABASE_URL=<paste-internal-database-url>
   JWT_SECRET=legalstack-super-secret-key-change-in-production-12345
   NODE_ENV=production
   PORT=5000
   ```

5. Click "Create Web Service"
6. Wait 5-10 minutes for deployment
7. **Copy the service URL** (e.g., https://legalstack-api.onrender.com)

### 3. Test Backend
```bash
# Health check
curl https://legalstack-api.onrender.com/health

# Should return:
# {"status":"ok","timestamp":"...","uptime":...}
```

## 🎨 Deploy Frontend (Vercel) - 5 minutes

### 1. Deploy to Vercel
1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import `Nisu7648/casestack`
4. Settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Environment Variables:
   ```
   VITE_API_URL=<paste-backend-url>
   ```
   Example: `VITE_API_URL=https://legalstack-api.onrender.com`

6. Click "Deploy"
7. Wait 2-3 minutes
8. **Copy the deployment URL** (e.g., https://legalstack.vercel.app)

### 2. Test Frontend
1. Open the Vercel URL in browser
2. Should see landing page
3. Click "Get Started"
4. Try to register a firm

## ✅ Post-Deployment Checklist

### Test These Features:
- [ ] Landing page loads
- [ ] Register new firm
- [ ] Login works
- [ ] Dashboard loads
- [ ] Create a case
- [ ] Upload a document (will fail - need file storage)
- [ ] Create time entry
- [ ] Generate invoice

### Expected Issues:
1. **Document upload will fail** - Need AWS S3 or local storage
2. **Email verification won't work** - Need SMTP setup
3. **Slow first load** - Render free tier sleeps after 15min

## 🐛 Known Issues (Be Honest)

### Will Work:
- ✅ Registration
- ✅ Login
- ✅ Case creation
- ✅ Time tracking
- ✅ Invoice generation
- ✅ Client management

### Will Fail:
- ❌ Document upload (no file storage configured)
- ❌ Email notifications (no SMTP)
- ❌ Google OAuth (not configured)
- ❌ Payment processing (no Stripe)

### Performance Issues:
- ⚠️ First load: 30-60 seconds (Render free tier wakes up)
- ⚠️ Subsequent loads: 2-5 seconds
- ⚠️ Database queries: Slow on free tier

## 📊 What This Proves

### ✅ Working:
- Backend API is live
- Frontend is deployed
- Database is connected
- Authentication works
- Core features functional

### ❌ Not Working:
- File uploads
- Email system
- Payment processing
- Mobile apps (don't exist)

## 💰 Cost

### Free Tier (Testing):
- Render PostgreSQL: Free
- Render Web Service: Free (sleeps after 15min)
- Vercel: Free
- **Total: $0/month**

### Paid Tier (Production):
- Render PostgreSQL: $7/month
- Render Web Service: $7/month
- Vercel Pro: $20/month
- **Total: $34/month**

## 🎯 Next Steps After Deploy

1. **Test everything** - Find bugs
2. **Fix critical bugs** - Make it stable
3. **Add file storage** - AWS S3 or Cloudinary
4. **Add email** - SendGrid or AWS SES
5. **Get beta users** - 5-10 law firms
6. **Collect feedback** - Fix issues
7. **Launch** - Start charging

## ⏱️ Realistic Timeline

- **Today**: Deploy (15 minutes)
- **Tomorrow**: Test & fix bugs (4-6 hours)
- **Day 3-5**: Add missing features (file storage, email)
- **Week 2**: Beta testing with real users
- **Week 3-4**: Fix feedback, polish
- **Week 5-6**: Launch & marketing
- **Month 2**: First paying customers

## 🚨 IMPORTANT

This is a **BETA deployment**. It will have bugs. It's not production-ready. But it PROVES the concept works.

**Don't promise customers it's perfect. Be honest about limitations.**

---

**Ready to deploy? Follow steps above. Takes 15 minutes total.** 🚀
