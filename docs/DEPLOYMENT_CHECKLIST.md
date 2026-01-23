# ✅ LegalStack Deployment Checklist

## **Complete Step-by-Step Deployment Guide**

---

## **PHASE 1: PRE-DEPLOYMENT** ⏱️ 30 minutes

### **1.1 Code Preparation**
- [ ] All code committed to GitHub
- [ ] No sensitive data in code (API keys, passwords)
- [ ] `.env.example` files updated
- [ ] Dependencies up to date (`npm audit fix`)
- [ ] Build works locally (`npm run build`)
- [ ] Tests passing (if any)

### **1.2 Documentation**
- [ ] README.md updated
- [ ] API documentation complete
- [ ] Environment variables documented
- [ ] Deployment guides created

### **1.3 Accounts Setup**
- [ ] Render account created
- [ ] GitHub repository accessible
- [ ] Cloudinary account ready
- [ ] SendGrid account ready (optional)
- [ ] Stripe account ready (optional)

---

## **PHASE 2: DATABASE SETUP** ⏱️ 15 minutes

### **2.1 Create PostgreSQL Database**
- [ ] Go to Render Dashboard
- [ ] Click "New +" → "PostgreSQL"
- [ ] Name: `legalstack-db`
- [ ] Region: Choose closest to users
- [ ] Plan: Free (or Starter $7/month)
- [ ] Click "Create Database"

### **2.2 Get Database Credentials**
- [ ] Copy Internal Database URL
- [ ] Copy External Database URL (for local dev)
- [ ] Save credentials securely

### **2.3 Test Database Connection**
```bash
# Test connection locally
psql <EXTERNAL_DATABASE_URL> -c "SELECT 1"
```
- [ ] Connection successful

---

## **PHASE 3: BACKEND DEPLOYMENT** ⏱️ 20 minutes

### **3.1 Create Web Service**
- [ ] Go to Render Dashboard
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub: `Nisu7648/casestack`
- [ ] Name: `legalstack-backend`
- [ ] Region: Same as database
- [ ] Branch: `main`
- [ ] Root Directory: `backend`
- [ ] Build Command: `npm install && npx prisma generate`
- [ ] Start Command: `npm start`
- [ ] Plan: Free (or Starter $7/month)

### **3.2 Set Environment Variables**
```env
DATABASE_URL=<internal-database-url>
JWT_SECRET=<generate-random-secret>
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=production
ALLOWED_ORIGINS=https://legalstack-frontend.onrender.com
CLOUDINARY_URL=cloudinary://api_key:api_secret@duqemxgun
SENDGRID_API_KEY=<your-key>
SENDGRID_FROM_EMAIL=noreply@legalstack.com
FRONTEND_URL=https://legalstack-frontend.onrender.com
```
- [ ] All required variables set
- [ ] Optional variables set (if available)

### **3.3 Deploy Backend**
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (~3-5 minutes)
- [ ] Check logs for errors
- [ ] Service status is "Live" (green)

### **3.4 Run Database Migrations**
```bash
# Option A: Using Render Shell
# Go to service → Shell tab
npx prisma migrate deploy

# Option B: Add to build command
# Build Command: npm install && npx prisma generate && npx prisma migrate deploy
```
- [ ] Migrations completed successfully
- [ ] Database tables created

### **3.5 Test Backend**
```bash
# Health check
curl https://legalstack-backend.onrender.com/health

# API info
curl https://legalstack-backend.onrender.com/

# Register test user
curl -X POST https://legalstack-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "firmName": "Test Firm",
    "country": "US"
  }'
```
- [ ] Health check returns 200
- [ ] API info shows correct data
- [ ] Registration works
- [ ] Welcome email sent (if SendGrid configured)

---

## **PHASE 4: FRONTEND DEPLOYMENT** ⏱️ 20 minutes

### **4.1 Update Frontend Configuration**

**Update `frontend/.env.production`:**
```env
VITE_API_URL=https://legalstack-backend.onrender.com
VITE_ENV=production
```
- [ ] Environment file created
- [ ] Backend URL correct

**Update `frontend/src/config/api.js`:**
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```
- [ ] API client configured
- [ ] Axios interceptors set up

### **4.2 Create Static Site**
- [ ] Go to Render Dashboard
- [ ] Click "New +" → "Static Site"
- [ ] Connect GitHub: `Nisu7648/casestack`
- [ ] Name: `legalstack-frontend`
- [ ] Branch: `main`
- [ ] Root Directory: `frontend`
- [ ] Build Command: `npm install && npm run build`
- [ ] Publish Directory: `dist` (or `build`)

### **4.3 Set Environment Variables**
```env
VITE_API_URL=https://legalstack-backend.onrender.com
VITE_ENV=production
```
- [ ] Variables set

### **4.4 Configure Redirects**

**Create `frontend/public/_redirects`:**
```
/*    /index.html   200
```
- [ ] Redirects file created
- [ ] Committed to GitHub

### **4.5 Deploy Frontend**
- [ ] Click "Create Static Site"
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Check logs for errors
- [ ] Site status is "Live" (green)

### **4.6 Test Frontend**
- [ ] Open https://legalstack-frontend.onrender.com
- [ ] Homepage loads correctly
- [ ] No console errors
- [ ] Assets loading (CSS, JS, images)

---

## **PHASE 5: END-TO-END TESTING** ⏱️ 30 minutes

### **5.1 Authentication Flow**
- [ ] Register new user
- [ ] Receive welcome email
- [ ] Login with credentials
- [ ] JWT token stored
- [ ] Redirected to dashboard
- [ ] Logout works
- [ ] Login again works

### **5.2 Case Management**
- [ ] Create new case
- [ ] View case details
- [ ] Update case
- [ ] Delete case
- [ ] Search cases
- [ ] Filter cases by status

### **5.3 Client Management**
- [ ] Add new client
- [ ] View client details
- [ ] Update client
- [ ] Delete client
- [ ] Search clients

### **5.4 Document Management**
- [ ] Upload single document
- [ ] Upload multiple documents
- [ ] Download document
- [ ] Preview document
- [ ] Delete document
- [ ] Files stored in Cloudinary

### **5.5 Time Tracking**
- [ ] Add time entry
- [ ] View time entries
- [ ] Update time entry
- [ ] Delete time entry
- [ ] Calculate totals

### **5.6 Billing & Invoicing**
- [ ] Create invoice
- [ ] Add invoice items
- [ ] Calculate totals
- [ ] Send invoice email
- [ ] Export invoice to PDF
- [ ] Mark invoice as paid

### **5.7 Advanced Features**
- [ ] Search across entities
- [ ] Bulk delete cases
- [ ] Export cases to CSV
- [ ] Export time entries to CSV
- [ ] View activity feed
- [ ] View notifications

---

## **PHASE 6: PERFORMANCE & SECURITY** ⏱️ 15 minutes

### **6.1 Performance**
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Images optimized
- [ ] Code minified
- [ ] Gzip compression enabled

### **6.2 Security**
- [ ] HTTPS enabled (automatic on Render)
- [ ] CORS configured correctly
- [ ] JWT tokens secure
- [ ] Passwords hashed (bcrypt)
- [ ] SQL injection protected (Prisma)
- [ ] XSS protection enabled
- [ ] Rate limiting active

### **6.3 Error Handling**
- [ ] 404 pages work
- [ ] 500 errors handled gracefully
- [ ] User-friendly error messages
- [ ] Errors logged properly

---

## **PHASE 7: MONITORING & LOGS** ⏱️ 10 minutes

### **7.1 Backend Monitoring**
- [ ] Check Render logs
- [ ] No critical errors
- [ ] Database connections stable
- [ ] API endpoints responding

### **7.2 Frontend Monitoring**
- [ ] Check browser console
- [ ] No JavaScript errors
- [ ] No network errors
- [ ] Assets loading correctly

### **7.3 Database Monitoring**
- [ ] Check database size
- [ ] Check connection count
- [ ] No slow queries
- [ ] Backups configured (if paid plan)

---

## **PHASE 8: CUSTOM DOMAIN (OPTIONAL)** ⏱️ 20 minutes

### **8.1 Backend Domain**
- [ ] Add custom domain: `api.legalstack.com`
- [ ] Update DNS: CNAME → `legalstack-backend.onrender.com`
- [ ] Wait for DNS propagation (~5-60 minutes)
- [ ] SSL certificate issued
- [ ] Test: https://api.legalstack.com/health

### **8.2 Frontend Domain**
- [ ] Add custom domain: `app.legalstack.com`
- [ ] Update DNS: CNAME → `legalstack-frontend.onrender.com`
- [ ] Wait for DNS propagation
- [ ] SSL certificate issued
- [ ] Test: https://app.legalstack.com

### **8.3 Update Environment Variables**
- [ ] Update `ALLOWED_ORIGINS` on backend
- [ ] Update `VITE_API_URL` on frontend
- [ ] Redeploy both services

---

## **PHASE 9: STRIPE INTEGRATION (WHEN READY)** ⏱️ 45 minutes

### **9.1 Stripe Setup**
- [ ] Create Stripe account
- [ ] Get API keys (test mode)
- [ ] Create products & prices
- [ ] Set up webhook endpoint

### **9.2 Backend Integration**
- [ ] Add Stripe SDK
- [ ] Create payment routes
- [ ] Implement subscription logic
- [ ] Handle webhooks
- [ ] Test payment flow

### **9.3 Frontend Integration**
- [ ] Add Stripe.js
- [ ] Create checkout page
- [ ] Create billing portal
- [ ] Test payment flow
- [ ] Test subscription management

---

## **PHASE 10: LAUNCH PREPARATION** ⏱️ 30 minutes

### **10.1 Final Checks**
- [ ] All features working
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security measures in place
- [ ] Documentation complete

### **10.2 Beta Testing**
- [ ] Invite 5-10 beta users
- [ ] Collect feedback
- [ ] Fix critical issues
- [ ] Improve UX based on feedback

### **10.3 Marketing Materials**
- [ ] Landing page ready
- [ ] Pricing page clear
- [ ] Screenshots/videos prepared
- [ ] Social media posts ready

### **10.4 Support Setup**
- [ ] Support email configured
- [ ] FAQ page created
- [ ] Help documentation ready
- [ ] Contact form working

---

## **LAUNCH DAY!** 🚀

### **Pre-Launch (1 hour before)**
- [ ] Final smoke test
- [ ] Check all services are live
- [ ] Monitor logs
- [ ] Prepare for traffic

### **Launch**
- [ ] Announce on social media
- [ ] Send email to beta users
- [ ] Post on Product Hunt (optional)
- [ ] Monitor for issues

### **Post-Launch (first 24 hours)**
- [ ] Monitor logs continuously
- [ ] Respond to user feedback
- [ ] Fix critical bugs immediately
- [ ] Track user signups
- [ ] Celebrate! 🎉

---

## **ONGOING MAINTENANCE**

### **Daily**
- [ ] Check error logs
- [ ] Monitor uptime
- [ ] Respond to support requests

### **Weekly**
- [ ] Review analytics
- [ ] Update dependencies
- [ ] Backup database
- [ ] Review user feedback

### **Monthly**
- [ ] Security audit
- [ ] Performance review
- [ ] Feature planning
- [ ] Cost optimization

---

## **TROUBLESHOOTING GUIDE**

### **Backend Issues**
```bash
# Check logs
# Render Dashboard → Service → Logs

# Common issues:
# 1. Database connection failed → Check DATABASE_URL
# 2. Port already in use → Use process.env.PORT
# 3. Module not found → npm install
# 4. Prisma errors → npx prisma generate
```

### **Frontend Issues**
```bash
# Check browser console
# Network tab for API calls

# Common issues:
# 1. API calls failing → Check VITE_API_URL
# 2. CORS errors → Update ALLOWED_ORIGINS on backend
# 3. 404 on refresh → Add _redirects file
# 4. Build failed → Check build command
```

### **Database Issues**
```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1"

# Common issues:
# 1. Connection timeout → Check firewall
# 2. SSL required → Add ?sslmode=require
# 3. Too many connections → Increase pool size
```

---

## **ESTIMATED TOTAL TIME**

- **Pre-deployment:** 30 minutes
- **Database setup:** 15 minutes
- **Backend deployment:** 20 minutes
- **Frontend deployment:** 20 minutes
- **Testing:** 30 minutes
- **Performance & security:** 15 minutes
- **Monitoring:** 10 minutes
- **Custom domain (optional):** 20 minutes

**Total:** ~2.5 hours (without Stripe)  
**With Stripe:** ~3.5 hours

---

## **SUCCESS CRITERIA**

✅ **Backend:**
- Service is live and responding
- Database connected
- All API endpoints working
- No critical errors in logs

✅ **Frontend:**
- Site is live and loading
- All pages accessible
- API calls successful
- No console errors

✅ **Features:**
- Authentication working
- CRUD operations functional
- File uploads working
- Emails sending
- Search working
- Export working

✅ **Performance:**
- Page load < 3 seconds
- API response < 500ms
- No memory leaks
- Stable under load

✅ **Security:**
- HTTPS enabled
- CORS configured
- Authentication secure
- Data encrypted

---

**Deployment complete!** 🎉  
**LegalStack is now LIVE!** 🚀

---

**Need help?** Check the individual deployment guides:
- `RENDER_DATABASE_SETUP.md`
- `RENDER_BACKEND_DEPLOY.md`
- `RENDER_FRONTEND_DEPLOY.md`
