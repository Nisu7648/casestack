# 🚀 CASESTACK

**AI-Powered Professional Case Management System**

Modern, secure, and scalable case management platform for accounting and audit firms.

---

## ✨ Features

- ✅ **16 Advanced Features** - Complete case management suite
- ✅ **Multi-User Firms** - Team collaboration with role-based access
- ✅ **AI Document Analysis** - Automated document processing
- ✅ **Professional UI** - Modern, responsive design
- ✅ **Secure Authentication** - JWT + Google OAuth support
- ✅ **Real-time Updates** - Live collaboration features

---

## 🚀 Quick Start

### **Live Demo**

- **Frontend:** https://casestack-frontend.onrender.com
- **Backend API:** https://casestack-backend.onrender.com
- **Health Check:** https://casestack-backend.onrender.com/health

### **Local Development**

```bash
# Clone repository
git clone https://github.com/Nisu7648/casestack.git
cd casestack

# Backend setup
cd backend
npm install
npx prisma generate
npm start

# Frontend setup (in new terminal)
cd frontend
npm install
npm run dev
```

---

## 📦 Tech Stack

### **Backend**
- Node.js + Express
- PostgreSQL + Prisma ORM
- JWT Authentication
- bcrypt for password hashing

### **Frontend**
- React + TypeScript
- Vite
- TailwindCSS
- Lucide Icons

### **Deployment**
- Render.com (Free tier)
- Auto-deploy on push
- HTTPS enabled

---

## 🔧 Environment Variables

### **Backend (.env)**
```env
DATABASE_URL=postgresql://user:password@host:5432/database
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=5000
```

### **Frontend (.env)**
```env
VITE_API_URL=https://casestack-backend.onrender.com
```

---

## 📚 API Endpoints

### **Authentication**
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/verify` - Verify token

### **Firm Management**
- `POST /api/firm/create` - Create firm
- `GET /api/firm/details` - Get firm info
- `PUT /api/firm/update` - Update firm

### **Health**
- `GET /health` - Health check
- `GET /` - API info

---

## 🎯 Project Structure

```
casestack/
├── backend/
│   ├── src/
│   │   ├── index.js              # Main server
│   │   └── routes/
│   │       └── casestack/
│   │           ├── auth-simple.js    # Auth routes
│   │           └── firm-simple.js    # Firm routes
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   └── pages/
│   │       └── casestack/
│   │           └── FirmSetupProfessional.tsx
│   └── package.json
└── render.yaml                   # Render deployment config
```

---

## 🚀 Deployment

### **Render.com (Recommended)**

1. Fork this repository
2. Create account on [Render.com](https://render.com)
3. Connect your GitHub repository
4. Render will auto-deploy using `render.yaml`
5. Set environment variables in Render dashboard

**Cost:** $0/month (Free tier)

---

## 📝 License

Proprietary - All rights reserved

---

## 👥 Team

Built by CASESTACK Team

---

## 🔗 Links

- **Live App:** https://casestack-frontend.onrender.com
- **API Docs:** https://casestack-backend.onrender.com
- **GitHub:** https://github.com/Nisu7648/casestack

---

## ✅ Status

- ✅ Backend: Live
- ✅ Frontend: Live
- ✅ Database: Connected
- ✅ Authentication: Working
- ✅ Firm Management: Working

**Last Updated:** January 2024
