# 🎨 Render Frontend Deployment Guide

## **Deploy LegalStack Frontend to Render**

### **Prerequisites**
- ✅ Backend deployed and running
- ✅ Backend URL available
- ✅ GitHub repository with frontend code

---

## **Step 1: Create Static Site**

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository: `Nisu7648/casestack`
4. Configure the site:

### **Basic Settings:**
- **Name:** `legalstack-frontend`
- **Branch:** `main`
- **Root Directory:** `frontend`
- **Build Command:** `npm install && npm run build`
- **Publish Directory:** `dist` (for Vite) or `build` (for Create React App)

---

## **Step 2: Environment Variables**

Click **"Advanced"** → **"Add Environment Variable"**

### **Required Variables:**

```env
# Backend API URL
VITE_API_URL=https://legalstack-backend.onrender.com

# Or for Create React App:
REACT_APP_API_URL=https://legalstack-backend.onrender.com

# App Environment
VITE_ENV=production
```

### **Optional Variables:**

```env
# Stripe (when ready)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Analytics
VITE_GA_TRACKING_ID=UA-XXXXXXXXX-X

# Feature Flags
VITE_ENABLE_BETA_FEATURES=false
```

---

## **Step 3: Update Frontend Configuration**

### **For Vite (React + Vite):**

Update `frontend/vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser'
  }
})
```

### **For Create React App:**

Update `frontend/package.json`:
```json
{
  "proxy": "http://localhost:5000",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

---

## **Step 4: Update API Client**

Create `frontend/src/config/api.js`:
```javascript
// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Axios instance
import axios from 'axios';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## **Step 5: Deploy**

1. Click **"Create Static Site"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Build the app
   - Deploy to CDN

3. Watch the logs for:
   ```
   ✅ Installing dependencies...
   ✅ Building application...
   ✅ Optimizing assets...
   ✅ Deploy successful!
   ```

---

## **Step 6: Configure Redirects**

For Single Page Applications (SPA), create `frontend/public/_redirects`:

```
/*    /index.html   200
```

Or `frontend/public/render.yaml`:
```yaml
services:
  - type: web
    name: legalstack-frontend
    env: static
    buildCommand: npm install && npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
```

---

## **Step 7: Test Your Frontend**

Your frontend will be available at:
```
https://legalstack-frontend.onrender.com
```

### **Test Features:**

1. **Registration:**
   - Go to `/register`
   - Create new account
   - Check welcome email

2. **Login:**
   - Go to `/login`
   - Login with credentials
   - Verify JWT token

3. **Dashboard:**
   - View dashboard
   - Check API calls
   - Verify data loading

4. **Cases:**
   - Create new case
   - Upload documents
   - Track time

5. **Billing:**
   - Create invoice
   - Export to PDF
   - Send to client

---

## **Step 8: Configure Custom Domain (Optional)**

1. Go to site → **"Settings"** → **"Custom Domain"**
2. Add your domain: `app.legalstack.com`
3. Update DNS records:
   ```
   Type: CNAME
   Name: app
   Value: legalstack-frontend.onrender.com
   ```

---

## **Deployment Checklist**

### **Before Deployment:**
- ✅ Backend URL configured
- ✅ Environment variables set
- ✅ Build command tested locally
- ✅ Code pushed to GitHub

### **After Deployment:**
- ✅ Site is live (green status)
- ✅ No build errors
- ✅ Pages load correctly
- ✅ API calls working
- ✅ Authentication working
- ✅ File uploads working
- ✅ All features functional

---

## **Troubleshooting**

### **Issue: Build Failed**

**Error: "Module not found"**
```bash
# Check package.json dependencies
npm install

# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Error: "Out of memory"**
```json
// Add to package.json
{
  "scripts": {
    "build": "NODE_OPTIONS=--max_old_space_size=4096 vite build"
  }
}
```

### **Issue: API Calls Failing**

**Check:**
1. Backend URL is correct in environment variables
2. CORS is configured on backend
3. API endpoints are correct
4. Network tab in browser DevTools

**Fix CORS:**
```javascript
// In backend/src/index.js
app.use(cors({
  origin: 'https://legalstack-frontend.onrender.com',
  credentials: true
}));
```

### **Issue: 404 on Refresh**

**Add redirects:**
```
// frontend/public/_redirects
/*    /index.html   200
```

### **Issue: Environment Variables Not Working**

**For Vite:**
- Must start with `VITE_`
- Rebuild after changing

**For Create React App:**
- Must start with `REACT_APP_`
- Restart dev server

---

## **Performance Optimization**

### **1. Code Splitting**
```javascript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Cases = lazy(() => import('./pages/Cases'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/cases" element={<Cases />} />
  </Routes>
</Suspense>
```

### **2. Image Optimization**
```javascript
// Use WebP format
<img src="image.webp" alt="..." />

// Lazy load images
<img loading="lazy" src="..." alt="..." />
```

### **3. Bundle Size**
```bash
# Analyze bundle
npm run build -- --analyze

# Remove unused dependencies
npm prune
```

### **4. Caching**
```javascript
// Service worker for PWA
// In frontend/public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/static/css/main.css',
        '/static/js/main.js'
      ]);
    })
  );
});
```

---

## **SEO Optimization**

### **1. Meta Tags**
```html
<!-- In frontend/public/index.html -->
<head>
  <title>LegalStack - Fair Legal Case Management</title>
  <meta name="description" content="Modern legal case management with fair, economy-based pricing for law firms worldwide." />
  <meta name="keywords" content="legal, case management, law firm, billing, time tracking" />
  
  <!-- Open Graph -->
  <meta property="og:title" content="LegalStack" />
  <meta property="og:description" content="Fair legal case management" />
  <meta property="og:image" content="/og-image.png" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="LegalStack" />
  <meta name="twitter:description" content="Fair legal case management" />
</head>
```

### **2. Sitemap**
```xml
<!-- frontend/public/sitemap.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://legalstack.com/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://legalstack.com/pricing</loc>
    <priority>0.8</priority>
  </url>
</urlset>
```

### **3. Robots.txt**
```
# frontend/public/robots.txt
User-agent: *
Allow: /
Sitemap: https://legalstack.com/sitemap.xml
```

---

## **Analytics & Monitoring**

### **1. Google Analytics**
```javascript
// In frontend/src/index.jsx
import ReactGA from 'react-ga4';

ReactGA.initialize('G-XXXXXXXXXX');

// Track page views
ReactGA.send({ hitType: "pageview", page: window.location.pathname });
```

### **2. Error Tracking (Sentry)**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: import.meta.env.VITE_ENV
});
```

---

## **Continuous Deployment**

Render automatically deploys when you push to GitHub:

1. Make changes to frontend code
2. Commit and push to `main` branch
3. Render detects changes
4. Automatically builds and deploys
5. Live in ~2-3 minutes

---

## **Next Steps**

After frontend is deployed:
1. ✅ Test all features end-to-end
2. ✅ Fix any bugs
3. ✅ Add Stripe integration
4. ✅ Polish UI/UX
5. ✅ Launch to beta users

---

## **Useful Links**

- **Render Dashboard:** https://dashboard.render.com/
- **Frontend URL:** https://legalstack-frontend.onrender.com
- **Backend URL:** https://legalstack-backend.onrender.com
- **Logs:** https://dashboard.render.com/static/[site-id]/logs

---

**Frontend deployment complete!** ✅  
**Next:** End-to-end testing and Stripe integration
