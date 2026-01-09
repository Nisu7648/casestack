# 🐳 DOCKER QUICK START - CASESTACK

## Deploy CASESTACK with Docker in 3 commands!

---

## 🚀 **FASTEST WAY TO RUN CASESTACK**

```bash
# 1. Clone and enter directory
git clone https://github.com/Nisu7648/casestack.git && cd casestack

# 2. Setup environment
cp .env.docker .env

# 3. Start everything!
docker-compose up -d
```

**That's it! Your app is running:**
- 🌐 Frontend: http://localhost:8080
- 🔌 Backend: http://localhost:5000
- 🗄️ Database: localhost:5432

---

## 📋 **WHAT YOU GET**

✅ **Complete CASESTACK stack**
- PostgreSQL 15 database
- Node.js backend API
- React frontend with Nginx
- All features working
- Device session management (max 3 devices)
- Production-ready configuration

✅ **Docker benefits:**
- One command deployment
- Isolated environment
- Easy updates
- Portable across systems
- Production-ready

---

## 🔧 **CONFIGURATION**

### **Before starting, edit `.env` file:**

```env
# REQUIRED: Change these!
DB_PASSWORD=your-secure-password-here
JWT_SECRET=your-random-secret-key-here

# OPTIONAL: Email settings
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

---

## 📊 **USEFUL COMMANDS**

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Check status
docker-compose ps

# Access backend shell
docker-compose exec backend sh

# Access database
docker-compose exec postgres psql -U casestack_user -d casestack

# Run migrations
docker-compose exec backend npx prisma migrate deploy

# Backup database
docker-compose exec postgres pg_dump -U casestack_user casestack > backup.sql
```

---

## ✅ **VERIFY DEPLOYMENT**

```bash
# Check backend health
curl http://localhost:5000/health

# Check frontend
curl http://localhost:8080/health

# Check all services
docker-compose ps
```

**Expected output:**
```
NAME                   STATUS              PORTS
casestack-backend      Up (healthy)        0.0.0.0:5000->5000/tcp
casestack-db           Up (healthy)        0.0.0.0:5432->5432/tcp
casestack-frontend     Up (healthy)        0.0.0.0:8080->8080/tcp
```

---

## 🎯 **NEXT STEPS**

1. Open http://localhost:8080
2. Register your first firm
3. Login and create a case
4. Test device session management
5. **You're ready to go!** 🎉

---

## 📚 **FULL DOCUMENTATION**

- **[DOCKER_DEPLOYMENT_GUIDE.md](DOCKER_DEPLOYMENT_GUIDE.md)** - Complete Docker guide
- **[FREE_DEPLOYMENT_GUIDE.md](FREE_DEPLOYMENT_GUIDE.md)** - Free cloud hosting
- **[README.md](README.md)** - Main documentation

---

## 💰 **COST**

**Local Docker:** $0 (runs on your machine)  
**VPS with Docker:** $5-20/month (DigitalOcean, Linode, etc.)

---

**CASESTACK - Docker Deployment**  
**Production-ready in 3 commands** 🐳🚀
