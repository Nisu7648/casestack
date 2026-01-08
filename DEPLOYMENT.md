# CaseStack Enterprise - Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Git

### 1. Clone and Install

```bash
git clone https://github.com/Nisu7648/casestack.git
cd casestack

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb casestack

# Set up environment variables
cd backend
cp .env.example .env

# Edit .env with your database credentials:
# DATABASE_URL="postgresql://user:password@localhost:5432/casestack"
# JWT_SECRET="your-super-secret-key-change-this-in-production"
# PORT=5000
# NODE_ENV=production
```

### 3. Run Database Migrations

```bash
cd backend
npx prisma migrate deploy --schema=./prisma/schema.enterprise.prisma
npx prisma generate --schema=./prisma/schema.enterprise.prisma
```

### 4. Start the Application

```bash
# Terminal 1 - Backend
cd backend
node src/server.enterprise.js

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

---

## 🐳 Docker Deployment

### Build and Run with Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## ☁️ Cloud Deployment Options

### Option 1: Railway (Recommended - Easiest)

1. **Push to GitHub** (already done!)
2. **Go to Railway.app**
3. **Click "New Project" → "Deploy from GitHub"**
4. **Select your repository**
5. **Add PostgreSQL database** (Railway will auto-configure)
6. **Set environment variables:**
   - `JWT_SECRET`: Generate a secure random string
   - `NODE_ENV`: production
7. **Deploy!**

Railway will automatically:
- Detect your Node.js backend
- Set up PostgreSQL
- Configure networking
- Provide HTTPS URLs

**Cost**: ~$5-20/month

---

### Option 2: Render

1. **Backend:**
   - Go to Render.com
   - New → Web Service
   - Connect GitHub repo
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node src/server.enterprise.js`
   - Add PostgreSQL database

2. **Frontend:**
   - New → Static Site
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

**Cost**: Free tier available, ~$7/month for production

---

### Option 3: Vercel + Supabase

1. **Database (Supabase):**
   - Go to Supabase.com
   - Create new project
   - Copy connection string

2. **Backend (Vercel):**
   - Deploy backend as Vercel Serverless Functions
   - Set DATABASE_URL environment variable

3. **Frontend (Vercel):**
   - `vercel deploy`
   - Auto-deploys on git push

**Cost**: Free tier generous, ~$20/month for production

---

### Option 4: AWS (Enterprise)

1. **Database:** RDS PostgreSQL
2. **Backend:** ECS Fargate or EC2
3. **Frontend:** S3 + CloudFront
4. **Load Balancer:** ALB

**Cost**: ~$50-200/month depending on usage

---

## 📦 Environment Variables

### Backend (.env)
```bash
DATABASE_URL="postgresql://user:password@host:5432/casestack"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
PORT=5000
NODE_ENV=production
```

### Frontend (.env)
```bash
VITE_API_URL=http://localhost:5000
# Or in production:
# VITE_API_URL=https://your-backend-url.com
```

---

## 🔒 Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Use HTTPS in production
- [ ] Enable CORS only for your frontend domain
- [ ] Set secure password policies
- [ ] Enable rate limiting
- [ ] Regular database backups
- [ ] Monitor audit logs
- [ ] Keep dependencies updated

---

## 📊 Monitoring

### Health Checks
- Backend: `GET /health`
- Returns: `{ status: 'ok', timestamp: '...' }`

### Logs
- Backend logs: `console.log` statements
- Audit logs: Stored in database `audit_logs` table
- Export: `GET /api/audit/export?format=csv`

---

## 🔄 Updates and Maintenance

### Update Dependencies
```bash
cd backend && npm update
cd frontend && npm update
```

### Database Migrations
```bash
cd backend
npx prisma migrate dev --schema=./prisma/schema.enterprise.prisma
```

### Backup Database
```bash
pg_dump casestack > backup_$(date +%Y%m%d).sql
```

---

## 🆘 Troubleshooting

### Backend won't start
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Run migrations: `npx prisma migrate deploy`

### Frontend can't connect to backend
- Check VITE_API_URL in frontend/.env
- Ensure backend is running
- Check CORS settings

### Database connection errors
- Verify PostgreSQL is running
- Check connection string format
- Ensure database exists

---

## 📞 Support

- Documentation: See BUILD_COMPLETE.md
- Issues: GitHub Issues
- Email: support@casestack.io (configure your own)

---

## 🎉 You're Ready!

Your CaseStack Enterprise platform is now deployed and ready to use!

**Next Steps:**
1. Register your first admin account
2. Create your first client
3. Start your first engagement
4. Invite team members

**Happy consulting! 🚀**
