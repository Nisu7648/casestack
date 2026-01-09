# 🐳 DOCKER DEPLOYMENT GUIDE - CASESTACK

## Complete Docker setup with PostgreSQL + Backend + Frontend

---

## 🚀 **QUICK START (3 COMMANDS)**

```bash
# 1. Clone repository
git clone https://github.com/Nisu7648/casestack.git
cd casestack

# 2. Setup environment
cp .env.docker .env
# Edit .env and change passwords/secrets

# 3. Start everything
docker-compose up -d
```

**Your app is running!**
- Frontend: http://localhost:8080
- Backend: http://localhost:5000
- Database: localhost:5432

---

## 📦 **WHAT'S INCLUDED**

### **Docker Compose Stack:**
- ✅ PostgreSQL 15 (database)
- ✅ Node.js Backend (API)
- ✅ React Frontend (Nginx)
- ✅ Health checks
- ✅ Auto-restart
- ✅ Volume persistence
- ✅ Network isolation

### **Files Created:**
- `docker-compose.yml` - Complete stack configuration
- `backend/Dockerfile` - Backend container
- `frontend/Dockerfile` - Frontend container
- `frontend/nginx.conf` - Nginx configuration
- `.env.docker` - Environment template
- `backend/.dockerignore` - Build optimization
- `frontend/.dockerignore` - Build optimization

---

## 🔧 **CONFIGURATION**

### **Step 1: Setup Environment**

```bash
# Copy template
cp .env.docker .env

# Edit .env file
nano .env
```

**Required changes:**
```env
# Change these!
DB_PASSWORD=your-secure-database-password
JWT_SECRET=your-super-secret-jwt-key-random-string

# Optional - Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### **Step 2: Build and Start**

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

---

## 📊 **DOCKER COMMANDS**

### **Start/Stop Services**
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Restart specific service
docker-compose restart backend

# Stop and remove volumes (CAUTION: deletes data)
docker-compose down -v
```

### **View Logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 backend
```

### **Database Management**
```bash
# Access PostgreSQL
docker-compose exec postgres psql -U casestack_user -d casestack

# Backup database
docker-compose exec postgres pg_dump -U casestack_user casestack > backup.sql

# Restore database
docker-compose exec -T postgres psql -U casestack_user casestack < backup.sql

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

### **Shell Access**
```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# Database shell
docker-compose exec postgres sh
```

---

## 🔍 **HEALTH CHECKS**

### **Check Service Health**
```bash
# All services
docker-compose ps

# Backend health
curl http://localhost:5000/health

# Frontend health
curl http://localhost:8080/health

# Database health
docker-compose exec postgres pg_isready -U casestack_user
```

### **Expected Output:**
```json
// Backend health
{
  "status": "healthy",
  "timestamp": "2024-01-09T...",
  "uptime": 123.45,
  "database": "connected"
}

// Frontend health
healthy
```

---

## 🚀 **PRODUCTION DEPLOYMENT**

### **Option 1: Docker Compose (Single Server)**

```bash
# On your server
git clone https://github.com/Nisu7648/casestack.git
cd casestack

# Setup environment
cp .env.docker .env
nano .env  # Update passwords and secrets

# Start with production settings
docker-compose up -d

# Setup SSL with Let's Encrypt (optional)
docker-compose --profile with-nginx up -d
```

### **Option 2: Docker Swarm (Multi-Server)**

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml casestack

# Check services
docker stack services casestack

# View logs
docker service logs casestack_backend
```

### **Option 3: Kubernetes (Advanced)**

```bash
# Convert docker-compose to k8s
kompose convert -f docker-compose.yml

# Deploy to k8s
kubectl apply -f .

# Check pods
kubectl get pods
```

---

## 🔐 **SECURITY BEST PRACTICES**

### **1. Change Default Passwords**
```env
# .env file
DB_PASSWORD=use-strong-random-password-here
JWT_SECRET=use-long-random-string-here
```

### **2. Use Secrets (Production)**
```bash
# Create secrets
echo "my-db-password" | docker secret create db_password -
echo "my-jwt-secret" | docker secret create jwt_secret -

# Update docker-compose.yml to use secrets
```

### **3. Enable SSL**
```bash
# Get SSL certificate
certbot certonly --standalone -d yourdomain.com

# Copy certificates
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Start with nginx
docker-compose --profile with-nginx up -d
```

### **4. Firewall Rules**
```bash
# Allow only necessary ports
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 22/tcp   # SSH
ufw enable
```

---

## 📈 **MONITORING**

### **Resource Usage**
```bash
# All containers
docker stats

# Specific container
docker stats casestack-backend

# Disk usage
docker system df
```

### **Container Logs**
```bash
# Real-time logs
docker-compose logs -f --tail=100

# Export logs
docker-compose logs > casestack-logs.txt
```

### **Database Monitoring**
```bash
# Connection count
docker-compose exec postgres psql -U casestack_user -d casestack -c "SELECT count(*) FROM pg_stat_activity;"

# Database size
docker-compose exec postgres psql -U casestack_user -d casestack -c "SELECT pg_size_pretty(pg_database_size('casestack'));"
```

---

## 🔧 **TROUBLESHOOTING**

### **Issue: Backend can't connect to database**
```bash
# Check database is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Test connection
docker-compose exec backend sh -c "npx prisma db pull"
```

### **Issue: Frontend can't reach backend**
```bash
# Check backend is running
curl http://localhost:5000/health

# Check environment variable
docker-compose exec frontend env | grep VITE_API_URL

# Rebuild frontend with correct API URL
docker-compose build frontend
docker-compose up -d frontend
```

### **Issue: Port already in use**
```bash
# Find process using port
lsof -i :5000
lsof -i :8080

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "5001:5000"  # Use different host port
```

### **Issue: Out of disk space**
```bash
# Clean up unused images
docker image prune -a

# Clean up volumes (CAUTION)
docker volume prune

# Clean everything (CAUTION)
docker system prune -a --volumes
```

---

## 🔄 **UPDATES & MAINTENANCE**

### **Update Application**
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose build
docker-compose up -d

# Run migrations
docker-compose exec backend npx prisma migrate deploy
```

### **Backup Everything**
```bash
# Backup database
docker-compose exec postgres pg_dump -U casestack_user casestack > backup-$(date +%Y%m%d).sql

# Backup volumes
docker run --rm -v casestack_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-data-$(date +%Y%m%d).tar.gz /data

# Backup uploads
docker run --rm -v casestack_backend_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-$(date +%Y%m%d).tar.gz /data
```

### **Restore from Backup**
```bash
# Restore database
docker-compose exec -T postgres psql -U casestack_user casestack < backup-20240109.sql

# Restore volumes
docker run --rm -v casestack_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-data-20240109.tar.gz -C /
```

---

## 💰 **COST COMPARISON**

| Deployment | Monthly Cost | Setup Time |
|------------|--------------|------------|
| **Docker (VPS)** | $5-20 | 15 minutes |
| **Render.com** | $0-14 | 10 minutes |
| **AWS ECS** | $20-50 | 30 minutes |
| **DigitalOcean** | $12-24 | 15 minutes |

**Recommended for production:** DigitalOcean Droplet ($12/month) with Docker Compose

---

## ✅ **DEPLOYMENT CHECKLIST**

- [ ] Clone repository
- [ ] Copy `.env.docker` to `.env`
- [ ] Update passwords and secrets in `.env`
- [ ] Run `docker-compose build`
- [ ] Run `docker-compose up -d`
- [ ] Check all services: `docker-compose ps`
- [ ] Test backend: `curl http://localhost:5000/health`
- [ ] Test frontend: Open http://localhost:8080
- [ ] Register first firm
- [ ] Test complete workflow
- [ ] Setup backups
- [ ] Configure SSL (production)
- [ ] Setup monitoring
- [ ] **CASESTACK IS LIVE!** 🎉

---

## 📞 **SUPPORT**

For issues:
1. Check logs: `docker-compose logs -f`
2. Check health: `docker-compose ps`
3. Restart services: `docker-compose restart`
4. Check documentation: README.md

---

**CASESTACK - Docker Deployment**  
**Production-ready containerized deployment in 15 minutes** 🐳🚀
