# Database Setup - Quick Guide

## 🎯 You Need a PostgreSQL Database

LegalStack requires PostgreSQL to store users, firms, cases, etc.

---

## Option 1: Render.com (RECOMMENDED - FREE)

### Step 1: Create Database (3 minutes)
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Settings:
   - **Name**: `legalstack-db`
   - **Database**: `legalstack`
   - **Region**: Choose closest to you
   - **Plan**: **Free**
4. Click **"Create Database"**
5. Wait 2-3 minutes

### Step 2: Get Connection URL
1. Click on your database
2. Scroll to **"Connections"**
3. Copy **"Internal Database URL"**
   - Looks like: `postgresql://legalstack_user:xxx@dpg-xxx/legalstack`

### Step 3: Set Environment Variable
In your backend `.env` file:
```env
DATABASE_URL="postgresql://legalstack_user:xxx@dpg-xxx/legalstack"
```

### Step 4: Run Migrations
```bash
cd backend
npx prisma migrate deploy
```

**Done!** ✅

---

## Option 2: Local PostgreSQL (DEVELOPMENT)

### Step 1: Install PostgreSQL
**Mac:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download from: https://www.postgresql.org/download/windows/

### Step 2: Create Database
```bash
# Login to PostgreSQL
psql postgres

# Create database
CREATE DATABASE legalstack;

# Create user
CREATE USER legalstack_user WITH PASSWORD 'your_password';

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE legalstack TO legalstack_user;

# Exit
\q
```

### Step 3: Set Environment Variable
In `backend/.env`:
```env
DATABASE_URL="postgresql://legalstack_user:your_password@localhost:5432/legalstack"
```

### Step 4: Run Migrations
```bash
cd backend
npx prisma migrate deploy
```

**Done!** ✅

---

## Option 3: Supabase (FREE + FEATURES)

### Step 1: Create Project
1. Go to https://supabase.com
2. Click **"New Project"**
3. Settings:
   - **Name**: `legalstack`
   - **Database Password**: (save this!)
   - **Region**: Choose closest
   - **Plan**: Free
4. Click **"Create Project"**
5. Wait 2-3 minutes

### Step 2: Get Connection String
1. Go to **Settings** → **Database**
2. Scroll to **"Connection string"**
3. Select **"URI"**
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password

### Step 3: Set Environment Variable
In `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres"
```

### Step 4: Run Migrations
```bash
cd backend
npx prisma migrate deploy
```

**Done!** ✅

---

## 🔧 After Database Setup

### 1. Verify Connection
```bash
cd backend
npx prisma db pull
```
Should show: "Introspecting based on datasource..."

### 2. Generate Prisma Client
```bash
npx prisma generate
```

### 3. Run Migrations
```bash
npx prisma migrate deploy
```

### 4. (Optional) Fix Schema Issue
If registration fails with "firmId required":
```bash
psql $DATABASE_URL -c 'ALTER TABLE "users" ALTER COLUMN "firmId" DROP NOT NULL;'
```

---

## 🧪 Test Database

### Check Tables Created:
```bash
npx prisma studio
```
Opens browser at http://localhost:5555 showing all tables.

### Test Registration:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234",
    "firstName": "Test",
    "lastName": "User",
    "firmName": "Test Firm",
    "country": "United States"
  }'
```

Should return: `{"success":true,"token":"...","user":{...}}`

---

## ⚠️ Common Issues

### "Can't reach database server"
- Check DATABASE_URL is correct
- Verify database is running
- Check firewall/network settings

### "Password authentication failed"
- Verify password in DATABASE_URL
- Check user has correct permissions

### "Database does not exist"
- Create database first
- Check database name in URL

### "SSL connection required"
- Add `?sslmode=require` to DATABASE_URL
- Example: `postgresql://user:pass@host/db?sslmode=require`

---

## 📊 What Gets Created

After migrations, you'll have these tables:
- `users` - User accounts
- `firms` - Law firms
- `clients` - Clients
- `cases` - Legal cases
- `tasks` - Tasks
- `documents` - Documents
- `time_entries` - Time tracking
- `activity_logs` - Audit trail
- And 20+ more...

---

## 🚀 Next Steps

1. ✅ Database created
2. ✅ Migrations run
3. ✅ Tables created
4. 🎯 **Test registration**
5. 🎯 **Deploy to Render**

---

## 💡 Quick Commands

```bash
# Check database connection
npx prisma db pull

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Open database GUI
npx prisma studio

# Reset database (DANGER!)
npx prisma migrate reset
```

---

**Need help? Check logs:**
```bash
# Backend logs
npm run dev

# Database logs (Render)
# Go to dashboard → database → Logs tab
```
