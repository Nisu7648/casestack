# 🚀 Render Backend Deployment Guide

## **Deploy LegalStack Backend to Render**

### **Prerequisites**
- ✅ GitHub repository with backend code
- ✅ Render account (free)
- ✅ PostgreSQL database created on Render

---

## **Step 1: Create Web Service**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `Nisu7648/casestack`
4. Configure the service:

### **Basic Settings:**
- **Name:** `legalstack-backend`
- **Region:** Same as your database
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npx prisma generate`
- **Start Command:** `npm start`

### **Plan:**
- **Free** (for testing)
- **Starter ($7/month)** (for production)

---

## **Step 2: Environment Variables**

Click **"Advanced"** → **"Add Environment Variable"**

### **Required Variables:**

```env
# Database
DATABASE_URL=<your-internal-database-url>

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=production

# CORS
ALLOWED_ORIGINS=https://your-frontend.onrender.com,https://legalstack.com
```

### **Optional Variables:**

```env
# Cloudinary (File Storage)
CLOUDINARY_URL=cloudinary://api_key:api_secret@duqemxgun

# SendGrid (Email)
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@legalstack.com

# Frontend URL
FRONTEND_URL=https://your-frontend.onrender.com

# Stripe (when ready)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

---

## **Step 3: Add Build Script**

Make sure `backend/package.json` has these scripts:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "build": "echo 'No build step needed for Node.js'",
    "postinstall": "prisma generate || echo 'Prisma generate skipped'",
    "migrate": "prisma migrate deploy"
  }
}
```

---

## **Step 4: Deploy**

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Generate Prisma client
   - Start the server

3. Watch the logs for:
   ```
   ✅ Server running on 0.0.0.0:5000
   ✅ Loaded: /api/auth
   ✅ Loaded: /api/cases
   ✅ Loaded: /api/documents
   ...
   🔥 Ready to accept requests!
   ```

---

## **Step 5: Run Database Migrations**

After first deployment:

### **Option A: Using Render Shell**
1. Go to your service → **"Shell"** tab
2. Run:
   ```bash
   npx prisma migrate deploy
   ```

### **Option B: Using Build Command**
Update build command to:
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

---

## **Step 6: Test Your API**

Your backend will be available at:
```
https://legalstack-backend.onrender.com
```

### **Test Endpoints:**

```bash
# Health check
curl https://legalstack-backend.onrender.com/health

# API info
curl https://legalstack-backend.onrender.com/

# Register user
curl -X POST https://legalstack-backend.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "firmName": "Test Law Firm",
    "country": "US"
  }'

# Login
curl -X POST https://legalstack-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

---

## **Step 7: Configure Custom Domain (Optional)**

1. Go to service → **"Settings"** → **"Custom Domain"**
2. Add your domain: `api.legalstack.com`
3. Update DNS records:
   ```
   Type: CNAME
   Name: api
   Value: legalstack-backend.onrender.com
   ```

---

## **Deployment Checklist**

### **Before Deployment:**
- ✅ Database created and accessible
- ✅ Environment variables ready
- ✅ Code pushed to GitHub
- ✅ Build/start commands configured

### **After Deployment:**
- ✅ Service is running (green status)
- ✅ Logs show no errors
- ✅ Health check returns 200
- ✅ Database migrations completed
- ✅ API endpoints responding
- ✅ Authentication working
- ✅ File upload working (Cloudinary)
- ✅ Email sending working (SendGrid)

---

## **Monitoring & Logs**

### **View Logs:**
1. Go to service → **"Logs"** tab
2. Filter by:
   - **Deploy logs** - Build and deployment
   - **Service logs** - Runtime logs
   - **Events** - Service events

### **Common Log Messages:**

**Success:**
```
✅ Server running on 0.0.0.0:5000
✅ Loaded: /api/auth
🔥 Ready to accept requests!
```

**Errors:**
```
❌ Failed to load auth routes
❌ Database connection failed
❌ Port already in use
```

---

## **Troubleshooting**

### **Issue: Build Failed**

**Error: "Cannot find module"**
```bash
# Check package.json dependencies
# Make sure all packages are listed
npm install
```

**Error: "Prisma generate failed"**
```bash
# Check prisma/schema.prisma
# Make sure DATABASE_URL is set
npx prisma generate
```

### **Issue: Service Won't Start**

**Error: "Port already in use"**
```javascript
// Make sure you're using process.env.PORT
const PORT = process.env.PORT || 5000;
```

**Error: "Database connection failed"**
```bash
# Check DATABASE_URL in environment variables
# Make sure it's the Internal Database URL
# Add ?sslmode=require if needed
```

### **Issue: API Returns 404**

**Check:**
1. Service is running (green status)
2. URL is correct: `https://legalstack-backend.onrender.com/api/...`
3. Routes are loaded (check logs)
4. CORS is configured correctly

### **Issue: CORS Errors**

Update `ALLOWED_ORIGINS`:
```env
ALLOWED_ORIGINS=https://your-frontend.onrender.com,https://legalstack.com
```

Or allow all (dev only):
```javascript
app.use(cors({ origin: '*' }));
```

---

## **Performance Optimization**

### **1. Enable Compression**
Already enabled in `src/index.js`:
```javascript
app.use(compression());
```

### **2. Add Caching**
```javascript
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300');
  next();
});
```

### **3. Database Connection Pooling**
```javascript
// In prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 10
}
```

### **4. Rate Limiting**
Already enabled in `src/index.js`:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
```

---

## **Scaling**

### **Free Plan Limitations:**
- Spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- 512 MB RAM
- Shared CPU

### **Upgrade to Starter ($7/month):**
- Always on (no spin-down)
- 512 MB RAM
- Shared CPU
- Better for production

### **Upgrade to Standard ($25/month):**
- 2 GB RAM
- Dedicated CPU
- Auto-scaling
- Best for high traffic

---

## **Security Best Practices**

### **1. Environment Variables**
- Never commit secrets to Git
- Use Render's environment variables
- Rotate secrets regularly

### **2. HTTPS**
- Render provides free SSL
- Always use HTTPS in production

### **3. Rate Limiting**
- Already configured (100 requests per 15 minutes)
- Adjust based on your needs

### **4. Input Validation**
- Already using express-validator
- Validate all user inputs

### **5. Authentication**
- JWT tokens with expiration
- Secure password hashing (bcrypt)

---

## **Continuous Deployment**

Render automatically deploys when you push to GitHub:

1. Make changes to code
2. Commit and push to `main` branch
3. Render detects changes
4. Automatically builds and deploys
5. Zero downtime deployment

### **Disable Auto-Deploy:**
1. Go to service → **"Settings"**
2. Toggle **"Auto-Deploy"** off
3. Deploy manually when ready

---

## **Backup & Rollback**

### **Rollback to Previous Version:**
1. Go to service → **"Events"** tab
2. Find previous successful deployment
3. Click **"Rollback"**

### **Manual Deployment:**
1. Go to service → **"Manual Deploy"**
2. Select branch
3. Click **"Deploy"**

---

## **Next Steps**

After backend is deployed:
1. ✅ Test all API endpoints
2. ✅ Verify database connection
3. ✅ Test file uploads (Cloudinary)
4. ✅ Test email sending (SendGrid)
5. ✅ Deploy frontend
6. ✅ Connect frontend to backend
7. ✅ End-to-end testing

---

## **Useful Links**

- **Render Dashboard:** https://dashboard.render.com/
- **Render Docs:** https://render.com/docs
- **Service URL:** https://legalstack-backend.onrender.com
- **Logs:** https://dashboard.render.com/web/[service-id]/logs
- **Metrics:** https://dashboard.render.com/web/[service-id]/metrics

---

**Backend deployment complete!** ✅  
**Next:** Deploy frontend to Render
