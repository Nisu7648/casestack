# 🗄️ Render PostgreSQL Database Setup

## **Step-by-Step Guide**

### **1. Create PostgreSQL Database on Render**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in the details:
   - **Name:** `legalstack-db`
   - **Database:** `legalstack`
   - **User:** `legalstack_user` (auto-generated)
   - **Region:** Choose closest to your users
   - **PostgreSQL Version:** 15 (recommended)
   - **Plan:** Free (or Starter $7/month for production)

4. Click **"Create Database"**

### **2. Get Database Connection Details**

After creation, you'll see:
- **Internal Database URL** (for Render services)
- **External Database URL** (for local development)

**Copy the Internal Database URL** - it looks like:
```
postgresql://legalstack_user:password@dpg-xxxxx.oregon-postgres.render.com/legalstack
```

### **3. Update Environment Variables**

#### **For Local Development:**
Create/update `backend/.env`:
```env
# Use External Database URL for local development
DATABASE_URL="postgresql://legalstack_user:password@dpg-xxxxx.oregon-postgres.render.com/legalstack?sslmode=require"

# Other variables
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"

# Cloudinary
CLOUDINARY_URL="cloudinary://api_key:api_secret@duqemxgun"

# SendGrid (optional)
SENDGRID_API_KEY="your-sendgrid-key"
SENDGRID_FROM_EMAIL="noreply@legalstack.com"
```

#### **For Production (Render):**
You'll set these in Render dashboard (next step).

### **4. Run Database Migrations Locally**

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# (Optional) Seed database with sample data
npx prisma db seed
```

### **5. Verify Database Connection**

```bash
# Open Prisma Studio to view database
npx prisma studio

# Should open at http://localhost:5555
# You should see all your tables (User, Firm, Case, etc.)
```

---

## **Database Schema Overview**

Your database includes these tables:

### **Core Tables:**
- `User` - User accounts
- `Firm` - Law firms
- `Client` - Clients
- `Case` - Legal cases
- `Document` - Case documents
- `Task` - Tasks
- `TimeEntry` - Time tracking
- `Invoice` - Invoices
- `InvoiceItem` - Invoice line items

### **Supporting Tables:**
- `CalendarEvent` - Calendar events
- `Template` - Document templates
- `ActivityLog` - Audit trail
- `Notification` - User notifications

### **Relationships:**
- Each User belongs to a Firm
- Each Case belongs to a Firm and Client
- Each Document belongs to a Case
- Each Task belongs to a Case
- Each TimeEntry belongs to a Case and User
- Each Invoice belongs to a Firm and Client

---

## **Database Backup & Maintenance**

### **Automatic Backups (Render):**
- **Free Plan:** No automatic backups
- **Starter Plan ($7/month):** Daily backups, 7-day retention
- **Standard Plan ($20/month):** Daily backups, 30-day retention

### **Manual Backup:**
```bash
# Export database
pg_dump $DATABASE_URL > backup.sql

# Restore database
psql $DATABASE_URL < backup.sql
```

### **Database Monitoring:**
- Check Render dashboard for:
  - Connection count
  - Database size
  - Query performance
  - Error logs

---

## **Troubleshooting**

### **Connection Issues:**

**Error: "Can't reach database server"**
```bash
# Check if DATABASE_URL is correct
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

**Error: "SSL required"**
```bash
# Add sslmode to connection string
DATABASE_URL="postgresql://...?sslmode=require"
```

### **Migration Issues:**

**Error: "Migration failed"**
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or create new migration
npx prisma migrate dev --name fix_migration
```

### **Performance Issues:**

**Slow queries:**
```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Add indexes
CREATE INDEX idx_case_firm ON "Case"("firmId");
CREATE INDEX idx_document_case ON "Document"("caseId");
```

---

## **Security Best Practices**

### **1. Use Environment Variables**
Never commit database credentials to Git.

### **2. Enable SSL**
Always use `sslmode=require` in production.

### **3. Limit Connections**
Set connection pool limits:
```javascript
// In prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  connectionLimit = 10
}
```

### **4. Regular Backups**
Upgrade to paid plan for automatic backups.

### **5. Monitor Access**
Check Render logs for suspicious activity.

---

## **Next Steps**

After database is set up:
1. ✅ Deploy backend to Render
2. ✅ Set environment variables
3. ✅ Run migrations in production
4. ✅ Test API endpoints
5. ✅ Deploy frontend

---

## **Useful Commands**

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Open Prisma Studio
npx prisma studio

# Reset database (dev only)
npx prisma migrate reset

# Create new migration
npx prisma migrate dev --name migration_name

# Check migration status
npx prisma migrate status

# Format schema
npx prisma format
```

---

## **Support**

If you encounter issues:
1. Check Render dashboard logs
2. Check Prisma documentation
3. Check PostgreSQL logs
4. Contact Render support

---

**Database setup complete!** ✅  
**Next:** Deploy backend to Render
