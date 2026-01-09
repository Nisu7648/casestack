# 🔐 DEVICE SESSION MANAGEMENT - MAX 3 DEVICES PER USER

## ✅ **FEATURE COMPLETE & INTEGRATED**

---

## 🎯 **OVERVIEW**

CASESTACK now enforces a **maximum of 3 active devices per user** for security and license compliance. This prevents account sharing and ensures proper user tracking.

---

## 🔧 **HOW IT WORKS**

### **1. Device Registration**
When a user logs in:
1. System generates unique device ID based on user agent + IP
2. Checks current active device count
3. If < 3 devices: Creates new session
4. If = 3 devices: **Blocks login** and shows active devices
5. Logs device registration in audit trail

### **2. Device Identification**
Each device is identified by:
- **Device ID**: Unique hash (SHA-256)
- **Device Name**: "Chrome on Windows", "Safari on iPhone"
- **Device Type**: desktop, mobile, tablet
- **Browser**: Chrome, Safari, Firefox, Edge, Opera
- **OS**: Windows, macOS, Linux, iOS, Android
- **IP Address**: For tracking
- **User Agent**: Full browser string

### **3. Session Management**
- **Token**: JWT token (7 days expiry)
- **Activity Tracking**: Last activity timestamp updated on each request
- **Auto-Expiry**: Sessions expire after 7 days
- **Manual Logout**: User can logout from specific device or all devices

---

## 📊 **DATABASE SCHEMA**

### **DeviceSession Model**
```prisma
model DeviceSession {
  id                String   @id @default(cuid())
  userId            String
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Device Information
  deviceId          String   // Unique device identifier
  deviceName        String?  // "Chrome on Windows"
  deviceType        String?  // "desktop", "mobile", "tablet"
  browser           String?  // "Chrome", "Safari", "Firefox"
  os                String?  // "Windows", "macOS", "iOS"
  
  // Session Information
  token             String   @unique // JWT token
  refreshToken      String?  @unique
  ipAddress         String?
  userAgent         String?
  
  // Status
  isActive          Boolean  @default(true)
  lastActivityAt    DateTime @default(now())
  expiresAt         DateTime
  
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([userId, isActive])
  @@index([token])
  @@index([deviceId])
  @@index([expiresAt])
}
```

### **FirmSettings Update**
```prisma
model FirmSettings {
  // ... existing fields
  maxDevicesPerUser Int @default(3) // NEW
}
```

---

## 🔌 **API ENDPOINTS**

### **1. Login (with device check)**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@firm.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "user-id",
    "email": "user@firm.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "MANAGER",
    "firmId": "firm-id",
    "firmName": "ABC Consulting"
  }
}
```

**Device Limit Exceeded (403):**
```json
{
  "error": "Device limit exceeded",
  "message": "Device limit exceeded. Maximum 3 devices allowed. Please logout from another device.",
  "activeSessions": [
    {
      "id": "session-1",
      "deviceName": "Chrome on Windows",
      "deviceType": "desktop",
      "lastActivityAt": "2024-01-09T10:30:00Z",
      "createdAt": "2024-01-08T09:00:00Z"
    },
    {
      "id": "session-2",
      "deviceName": "Safari on iPhone",
      "deviceType": "mobile",
      "lastActivityAt": "2024-01-09T11:00:00Z",
      "createdAt": "2024-01-07T14:00:00Z"
    },
    {
      "id": "session-3",
      "deviceName": "Firefox on macOS",
      "deviceType": "desktop",
      "lastActivityAt": "2024-01-09T08:00:00Z",
      "createdAt": "2024-01-06T16:00:00Z"
    }
  ]
}
```

### **2. Get Active Sessions**
```http
GET /api/auth/sessions
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "sessions": [
    {
      "id": "session-1",
      "deviceName": "Chrome on Windows",
      "deviceType": "desktop",
      "browser": "Chrome",
      "os": "Windows",
      "ipAddress": "192.168.1.100",
      "lastActivityAt": "2024-01-09T10:30:00Z",
      "createdAt": "2024-01-08T09:00:00Z",
      "isCurrent": true
    },
    {
      "id": "session-2",
      "deviceName": "Safari on iPhone",
      "deviceType": "mobile",
      "browser": "Safari",
      "os": "iOS",
      "ipAddress": "192.168.1.101",
      "lastActivityAt": "2024-01-09T11:00:00Z",
      "createdAt": "2024-01-07T14:00:00Z",
      "isCurrent": false
    }
  ],
  "deviceLimit": {
    "current": 2,
    "max": 3,
    "available": 1
  }
}
```

### **3. Logout from Current Device**
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### **4. Logout from All Devices**
```http
POST /api/auth/logout-all
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logged out from all devices successfully"
}
```

### **5. Remove Specific Device**
```http
DELETE /api/auth/sessions/:sessionId
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Device session removed successfully"
}
```

---

## 🔐 **SECURITY FEATURES**

### **1. Device Limit Enforcement**
- Maximum 3 active devices per user
- Configurable per firm (default: 3)
- Blocks new logins when limit reached
- Forces user to manage devices

### **2. Session Verification**
- Every API request verifies device session
- Checks if session is active
- Checks if session is expired
- Updates last activity timestamp

### **3. Audit Logging**
All device actions are logged:
- `DEVICE_REGISTERED` - New device login
- `DEVICE_REMOVED` - Device logout
- `DEVICE_LIMIT_EXCEEDED` - Login attempt when limit reached

### **4. Auto-Cleanup**
- Expired sessions automatically deactivated
- Cleanup function runs periodically
- Keeps database clean

---

## 💻 **FRONTEND INTEGRATION**

### **Login Flow**
```typescript
import { authAPI } from './services/api';

// Login
try {
  const response = await authAPI.login(email, password);
  // Success - redirect to dashboard
  window.location.href = '/dashboard';
} catch (error) {
  if (error.response?.status === 403 && 
      error.response?.data?.error === 'Device limit exceeded') {
    // Show device management modal
    const sessions = error.response.data.activeSessions;
    showDeviceManagementModal(sessions);
  } else {
    // Show error
    alert('Login failed');
  }
}
```

### **Device Management UI**
```typescript
// Get active sessions
const { sessions, deviceLimit } = await authAPI.getSessions();

// Display sessions
sessions.forEach(session => {
  console.log(`${session.deviceName} - Last active: ${session.lastActivityAt}`);
  if (session.isCurrent) {
    console.log('(Current device)');
  }
});

// Remove device
await authAPI.removeSession(sessionId);

// Logout from all devices
await authAPI.logoutAll();
```

---

## 🧪 **TESTING**

### **Test 1: Normal Login (< 3 devices)**
```bash
# Login from device 1
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@firm.com","password":"password123"}'

# Should succeed and return token
```

### **Test 2: Device Limit (= 3 devices)**
```bash
# Login from 4th device (should fail)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@firm.com","password":"password123"}'

# Should return 403 with active sessions list
```

### **Test 3: Get Sessions**
```bash
curl -X GET http://localhost:5000/api/auth/sessions \
  -H "Authorization: Bearer <token>"

# Should return list of active sessions
```

### **Test 4: Remove Device**
```bash
curl -X DELETE http://localhost:5000/api/auth/sessions/<session-id> \
  -H "Authorization: Bearer <token>"

# Should remove device and allow new login
```

---

## 📈 **MONITORING**

### **Check Active Sessions**
```sql
SELECT 
  u.email,
  u."firstName",
  u."lastName",
  COUNT(ds.id) as "activeSessions"
FROM "User" u
LEFT JOIN "DeviceSession" ds ON u.id = ds."userId" 
  AND ds."isActive" = true 
  AND ds."expiresAt" > NOW()
GROUP BY u.id, u.email, u."firstName", u."lastName"
ORDER BY "activeSessions" DESC;
```

### **Check Device Details**
```sql
SELECT 
  "deviceName",
  "deviceType",
  "browser",
  "os",
  "ipAddress",
  "lastActivityAt",
  "createdAt",
  "isActive"
FROM "DeviceSession"
WHERE "userId" = 'USER_ID_HERE'
ORDER BY "lastActivityAt" DESC;
```

### **Cleanup Expired Sessions**
```sql
SELECT cleanup_expired_device_sessions();
```

---

## 🔧 **CONFIGURATION**

### **Change Device Limit**
```sql
-- Update firm settings
UPDATE "FirmSettings"
SET "maxDevicesPerUser" = 5
WHERE "firmId" = 'FIRM_ID_HERE';
```

### **Environment Variables**
```env
# JWT expiry (affects session duration)
JWT_EXPIRES_IN=7d
```

---

## 🎯 **BENEFITS**

### **1. Security**
- Prevents account sharing
- Tracks device usage
- Detects suspicious logins

### **2. License Compliance**
- Enforces per-user licensing
- Prevents multi-user access
- Accurate user counting

### **3. User Experience**
- Clear device management
- Easy device removal
- Transparent limits

### **4. Audit Trail**
- Complete device history
- Login tracking
- Compliance reporting

---

## 🚀 **DEPLOYMENT**

### **1. Run Migration**
```bash
cd backend
npm run migrate
```

Or manually:
```bash
psql $DATABASE_URL < prisma/migrations/add_device_sessions.sql
```

### **2. Restart Server**
```bash
npm restart
```

### **3. Verify**
```bash
# Check health
curl http://localhost:5000/health

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@firm.com","password":"password"}'
```

---

## 📞 **TROUBLESHOOTING**

### **Issue: Can't login (device limit)**
**Solution:** 
1. Go to Account Settings
2. View Active Devices
3. Remove old/unused devices
4. Try login again

### **Issue: Session expired**
**Solution:**
1. Login again
2. New session will be created
3. Old session automatically cleaned up

### **Issue: Wrong device count**
**Solution:**
```sql
-- Cleanup expired sessions
SELECT cleanup_expired_device_sessions();
```

---

## ✅ **FEATURE STATUS**

- [x] Database schema updated
- [x] Device session service created
- [x] Auth route integrated
- [x] Auth middleware updated
- [x] Frontend API service updated
- [x] Migration script created
- [x] Audit logging integrated
- [x] Documentation complete
- [x] **100% READY TO USE**

---

**CASESTACK - Device Session Management**  
**Maximum 3 devices per user. Secure. Compliant. Working.** 🔐✅
