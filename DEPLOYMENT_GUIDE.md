# 🚀 CASESTACK - DEPLOYMENT GUIDE

## ✅ **WHAT'S BEEN COMPLETED**

### **Backend (100% Complete)**
- ✅ Complete database schema (11 models)
- ✅ All 8 API modules (40+ endpoints)
- ✅ **File upload/download system** (S3 + Local storage)
- ✅ **Email notification system** (Submit, review, finalize)
- ✅ **PDF export system** (Audit-ready case export)
- ✅ Authentication & authorization
- ✅ Audit logging
- ✅ Role-based access control

### **Frontend (100% Complete)**
- ✅ All 9 screens built
- ✅ Complete routing
- ✅ Protected routes
- ✅ Persistent sidebar
- ✅ Role-based UI

### **Services (NEW - Just Added)**
- ✅ File Storage Service (S3 + Local with SHA-256)
- ✅ Email Service (Nodemailer with templates)
- ✅ PDF Export Service (PDFKit with audit trail)

---

## 📦 **INSTALLATION**

### **1. Backend Setup**

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run database migrations
npm run migrate

# Generate Prisma client
npm run generate

# Start server
npm run dev  # Development
npm start    # Production
```

### **2. Frontend Setup**

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
# Create .env file with:
# VITE_API_URL=http://localhost:5000

# Start development server
npm run dev

# Build for production
npm run build
```

---

## 🔧 **ENVIRONMENT CONFIGURATION**

### **Required Environment Variables**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/casestack

# JWT
JWT_SECRET=your-super-secret-key

# File Storage
STORAGE_TYPE=local  # or 's3'
UPLOAD_DIR=./uploads

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Application
APP_URL=https://casestack.io
PORT=5000
```

### **Optional (For S3 Storage)**

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
S3_BUCKET_NAME=casestack-files
```

---

## 🚀 **DEPLOYMENT OPTIONS**

### **Option 1: Railway (Recommended)**

**Backend:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add PostgreSQL
railway add postgresql

# Deploy
railway up
```

**Frontend:**
- Deploy to Vercel (automatic from GitHub)

### **Option 2: Docker**

```bash
# Build backend
cd backend
docker build -t casestack-backend .

# Build frontend
cd frontend
docker build -t casestack-frontend .

# Run with docker-compose
docker-compose up -d
```

### **Option 3: Traditional VPS**

**Requirements:**
- Ubuntu 22.04 LTS
- Node.js 18+
- PostgreSQL 14+
- Nginx
- PM2

```bash
# Install dependencies
sudo apt update
sudo apt install nodejs npm postgresql nginx

# Install PM2
npm install -g pm2

# Setup database
sudo -u postgres createdb casestack

# Clone and setup
git clone your-repo
cd backend
npm install
npm run migrate

# Start with PM2
pm2 start src/server.casestack.js --name casestack
pm2 save
pm2 startup
```

---

## 📧 **EMAIL SETUP**

### **Gmail (Development)**

1. Enable 2-Factor Authentication
2. Generate App Password
3. Use in .env:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
```

### **SendGrid (Production)**

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
```

---

## 💾 **DATABASE SETUP**

### **Local PostgreSQL**

```bash
# Create database
createdb casestack

# Run migrations
cd backend
npm run migrate

# (Optional) Seed data
npm run seed
```

### **Railway PostgreSQL**

```bash
# Railway automatically provides DATABASE_URL
# Just run migrations
npm run migrate
```

---

## 🔐 **SECURITY CHECKLIST**

- [ ] Change JWT_SECRET to strong random string
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure CORS properly
- [ ] Set secure cookie flags
- [ ] Enable rate limiting
- [ ] Setup firewall rules
- [ ] Regular security updates
- [ ] Database backups enabled
- [ ] Error tracking (Sentry)
- [ ] Log monitoring

---

## 🧪 **TESTING**

### **Test Email Service**

```bash
cd backend
node -e "require('./src/services/email.service').testConnection()"
```

### **Test File Upload**

```bash
# Upload a test file via API
curl -X POST http://localhost:5000/api/bundles/BUNDLE_ID/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@test.pdf"
```

### **Test PDF Export**

```bash
# Export a case
curl -X GET http://localhost:5000/api/bundles/case/CASE_ID/download-all \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output case-export.zip
```

---

## 📊 **MONITORING**

### **Health Check Endpoint**

```javascript
// Add to server.casestack.js
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### **PM2 Monitoring**

```bash
pm2 monit
pm2 logs casestack
pm2 status
```

---

## 🔄 **BACKUP STRATEGY**

### **Database Backup**

```bash
# Daily backup script
pg_dump casestack > backup-$(date +%Y%m%d).sql

# Restore
psql casestack < backup-20240108.sql
```

### **File Backup**

```bash
# Backup uploads directory
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# For S3, use AWS CLI
aws s3 sync s3://casestack-files ./backup/
```

---

## 🐛 **TROUBLESHOOTING**

### **Email Not Sending**

```bash
# Test SMTP connection
node -e "require('./src/services/email.service').testConnection()"

# Check logs
tail -f logs/email.log
```

### **File Upload Failing**

```bash
# Check permissions
ls -la uploads/

# Check disk space
df -h

# Check S3 credentials (if using S3)
aws s3 ls s3://casestack-files
```

### **Database Connection Error**

```bash
# Test connection
psql $DATABASE_URL

# Check Prisma
npx prisma studio --schema=./prisma/schema.casestack.prisma
```

---

## 📈 **PERFORMANCE OPTIMIZATION**

### **Database Indexing**

Already included in schema:
- Case number index
- Firm ID indexes
- Status indexes
- Date indexes

### **Caching (Future)**

```javascript
// Add Redis for caching
const redis = require('redis');
const client = redis.createClient();

// Cache case list
app.get('/api/cases', async (req, res) => {
  const cached = await client.get('cases:' + req.firmId);
  if (cached) return res.json(JSON.parse(cached));
  
  // ... fetch from database
  await client.setex('cases:' + req.firmId, 300, JSON.stringify(cases));
});
```

---

## 🎯 **PRODUCTION CHECKLIST**

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] Email service tested
- [ ] File upload tested
- [ ] PDF export tested
- [ ] SSL certificate installed
- [ ] Domain configured
- [ ] Backups automated
- [ ] Monitoring setup
- [ ] Error tracking enabled
- [ ] Rate limiting configured
- [ ] CORS configured
- [ ] Security headers enabled
- [ ] Logs configured
- [ ] Health checks working

---

## 📞 **SUPPORT**

For deployment issues:
1. Check logs: `pm2 logs casestack`
2. Check database: `npx prisma studio`
3. Test services individually
4. Review environment variables

---

**CASESTACK - Ready for Production Deployment** 🚀
