# CASESTACK

**Professional case management system for audit, legal, and consulting firms.**

---

## 🚀 QUICK START

### Docker (Recommended)
```bash
git clone https://github.com/Nisu7648/casestack.git
cd casestack
cp .env.docker .env
docker-compose up -d
```

Open: http://localhost:8080

### Manual Setup
```bash
git clone https://github.com/Nisu7648/casestack.git
cd casestack
chmod +x quickstart.sh
./quickstart.sh
```

Open: http://localhost:5173

---

## 📦 WHAT'S INCLUDED

- **Backend:** Node.js + Express + PostgreSQL
- **Frontend:** React + TypeScript + Vite
- **Features:** Case management, file upload, audit trail, device sessions
- **Theme:** Professional black/white modes only

---

## 🎨 DESIGN

- **Black Mode** (default) - Pure black background, white text
- **White Mode** - Pure white background, black text
- **No fancy colors** - Professional and minimal
- **Toggle:** Sun/moon icon in top-right corner

---

## 📁 STRUCTURE

```
casestack/
├── backend/          # API server
├── frontend/         # React app
├── docker-compose.yml
├── quickstart.sh
└── README.md
```

---

## 🔧 CONFIGURATION

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@localhost:5432/casestack
JWT_SECRET=your-secret-key
STORAGE_TYPE=local
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

---

## 📚 DOCUMENTATION

- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Production deployment
- **[FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md)** - Free hosting (Render + Vercel)
- **[DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)** - Docker setup
- **[DOCKER_QUICK_START.md](DOCKER_QUICK_START.md)** - 3-command Docker start
- **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Manual setup guide
- **[DEVICE_SESSION_MANAGEMENT.md](DEVICE_SESSION_MANAGEMENT.md)** - Device session feature

---

## ✅ FEATURES

- Case finalization workflow
- File upload/download with SHA-256 verification
- Advanced search
- Audit trail
- User management
- Device session management (max 3 devices)
- Email notifications
- PDF export
- Role-based access

---

## 🚀 DEPLOYMENT OPTIONS

### 1. Free Hosting (Render + Vercel)
- Backend: Render.com (free tier)
- Frontend: Vercel (free)
- Cost: $0/month
- Guide: [FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md)

### 2. Docker (VPS)
- DigitalOcean, Linode, Vultr
- Cost: $5-20/month
- Guide: [DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)

### 3. Local Development
- Run on your machine
- Cost: $0
- Guide: [DOCKER_QUICK_START.md](DOCKER_QUICK_START.md)

---

## 💻 TECH STACK

**Backend:**
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT Authentication
- Winston Logger
- Nodemailer
- PDFKit

**Frontend:**
- React + TypeScript
- Vite
- React Router
- Axios
- Professional black/white theme

---

## 📞 SUPPORT

For issues:
1. Check documentation in repo
2. Check logs: `docker-compose logs -f`
3. Check health: `curl http://localhost:5000/health`

---

**CASESTACK - Professional Case Management**  
**Production-ready. Deploy in minutes.**
