# Network Issue Fix Guide

**Complete solution for all network connectivity problems**

---

## Quick Fix (Most Common Issues)

### 1. **Setup Environment Variables**

**Backend (.env):**
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/casestack?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_EXPIRES_IN="7d"
PORT=5000
NODE_ENV="development"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"
```

**Frontend (.env):**
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### 2. **Start Backend First**

```bash
cd backend
npm install
npm run dev
```

**Expected output:**
```
🚀 CaseStack API v3.0 - Production Ready
📡 Server: http://0.0.0.0:5000
✅ Active Modules: ...
```

### 3. **Start Frontend Second**

```bash
cd frontend
npm install
npm run dev
```

**Expected output:**
```
VITE v5.x.x ready in xxx ms
➜ Local: http://localhost:3000
➜ Network: use --host to expose
```

### 4. **Test Connection**

Open browser: `http://localhost:3000`

Check browser console - should see:
```
[API Request] GET /health
[API Response] GET /health 200
```

---

## Common Errors & Solutions

### Error 1: "Network Error" / "ERR_NETWORK"

**Cause:** Backend not running or wrong URL

**Solution:**
```bash
# 1. Check if backend is running
curl http://localhost:5000/health

# 2. If not running, start backend
cd backend
npm run dev

# 3. Verify .env files exist
ls -la backend/.env
ls -la frontend/.env

# 4. Check VITE_API_URL in frontend/.env
cat frontend/.env
```

### Error 2: "CORS Error"

**Cause:** Frontend origin not allowed

**Solution:**

Edit `backend/.env`:
```env
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173,http://localhost:3001"
```

Restart backend:
```bash
cd backend
npm run dev
```

### Error 3: "Connection Refused"

**Cause:** Port already in use or firewall

**Solution:**
```bash
# Check if port 5000 is in use
lsof -i :5000  # Mac/Linux
netstat -ano | findstr :5000  # Windows

# Kill process if needed
kill -9 <PID>  # Mac/Linux
taskkill /PID <PID> /F  # Windows

# Or use different port
# Edit backend/.env
PORT=5001

# Edit frontend/.env
VITE_API_URL=http://localhost:5001
```

### Error 4: "Timeout"

**Cause:** Slow network or backend hanging

**Solution:**

The API client now has:
- ✅ 30 second timeout
- ✅ Automatic retry (3 attempts)
- ✅ Exponential backoff

If still timing out:
```bash
# Check backend logs
cd backend
npm run dev

# Look for errors in console
```

### Error 5: "404 Not Found"

**Cause:** Wrong API endpoint

**Solution:**

Check API routes in browser console:
```
[API Request] GET /api/cases  ✅ Correct
[API Request] GET /cases      ❌ Wrong (missing /api)
```

All endpoints must start with `/api/`:
- ✅ `/api/auth/login`
- ✅ `/api/cases`
- ✅ `/api/users`

---

## Development Setup (Step by Step)

### Step 1: Clone & Install

```bash
# Clone repository
git clone https://github.com/yourusername/casestack.git
cd casestack

# Install backend
cd backend
npm install

# Install frontend
cd ../frontend
npm install
```

### Step 2: Database Setup

```bash
cd backend

# Create database
createdb casestack

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npx prisma db seed
```

### Step 3: Environment Variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your values

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your values
```

### Step 4: Start Services

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### Step 5: Verify

```bash
# Test backend
curl http://localhost:5000/health

# Expected response:
{
  "status": "ok",
  "service": "CaseStack API",
  "version": "3.0.0"
}

# Test frontend
# Open browser: http://localhost:3000
```

---

## Production Deployment

### Using Docker

```bash
# Build and start
docker-compose -f docker-compose.production.yml up -d

# Check logs
docker-compose logs -f

# Test
curl http://localhost/health
```

### Manual Deployment

```bash
# Backend
cd backend
npm install --production
npm run build
npm start

# Frontend
cd frontend
npm install
npm run build
# Serve dist/ folder with nginx or similar
```

---

## Network Debugging Tools

### 1. Check Backend Health

```bash
curl http://localhost:5000/health
```

### 2. Check API Endpoint

```bash
curl http://localhost:5000/api/test
```

### 3. Test with Authentication

```bash
# Login first
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Use token
curl http://localhost:5000/api/cases \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 4. Browser Console

Open DevTools (F12) → Console:
```javascript
// Check API URL
console.log(import.meta.env.VITE_API_URL)

// Test API
fetch('http://localhost:5000/health')
  .then(r => r.json())
  .then(console.log)
```

### 5. Network Tab

Open DevTools (F12) → Network:
- Filter by "XHR" or "Fetch"
- Look for failed requests (red)
- Check request/response headers
- Verify status codes

---

## Advanced Fixes

### Fix 1: Proxy Not Working

Edit `frontend/vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

### Fix 2: CORS in Production

Edit `backend/src/server.js`:
```javascript
app.use(cors({
  origin: ['https://your-domain.com'],
  credentials: true
}));
```

### Fix 3: SSL/HTTPS Issues

```bash
# Development with HTTPS
npm install -D @vitejs/plugin-basic-ssl

# vite.config.ts
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()]
})
```

---

## Checklist

Before asking for help, verify:

- [ ] Backend is running (`npm run dev` in backend/)
- [ ] Frontend is running (`npm run dev` in frontend/)
- [ ] `.env` files exist in both backend/ and frontend/
- [ ] `VITE_API_URL` in frontend/.env is correct
- [ ] `ALLOWED_ORIGINS` in backend/.env includes frontend URL
- [ ] Database is running and connected
- [ ] No firewall blocking ports 3000 or 5000
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows requests going to correct URL

---

## Still Having Issues?

### 1. Clean Install

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### 2. Check Logs

```bash
# Backend logs
cd backend
npm run dev 2>&1 | tee backend.log

# Frontend logs
cd frontend
npm run dev 2>&1 | tee frontend.log
```

### 3. Test Minimal Setup

Create `test.js`:
```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(5000, () => {
  console.log('Test server running on port 5000');
});
```

Run:
```bash
node test.js
curl http://localhost:5000/health
```

---

## Summary

**The network fix includes:**

✅ **Automatic retry** - 3 attempts with exponential backoff  
✅ **Better error messages** - User-friendly error handling  
✅ **CORS fixed** - Proper origin configuration  
✅ **Timeout handling** - 30 second timeout  
✅ **Request logging** - Debug info in console  
✅ **Health checks** - `/health` endpoint  
✅ **Proxy configuration** - Vite proxy for development  

**Most issues are caused by:**
1. Backend not running
2. Wrong environment variables
3. CORS misconfiguration
4. Port conflicts

**Follow the Quick Fix section above to resolve 90% of network issues!**
