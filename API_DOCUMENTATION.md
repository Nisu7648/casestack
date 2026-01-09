# 📚 CASESTACK API DOCUMENTATION

## Base URL
```
Production: https://api.casestack.io
Development: http://localhost:5000
```

---

## 🔐 Authentication

All API endpoints (except `/health` and `/api/auth/*`) require JWT authentication.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## 📋 API Endpoints

### **Health & Monitoring**

#### GET `/health`
Basic health check (no auth required)

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-08T10:00:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

#### GET `/health/detailed`
Detailed system health (no auth required)

**Response:**
```json
{
  "status": "healthy",
  "checks": {
    "database": true,
    "memory": true,
    "disk": true
  },
  "system": {
    "uptime": 3600,
    "memory": { ... },
    "cpu": { ... }
  }
}
```

#### GET `/metrics`
System metrics (no auth required)

---

### **Authentication**

#### POST `/api/auth/register`
Register new firm and admin user

**Request:**
```json
{
  "email": "admin@firm.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "firmName": "Consulting Firm LLP",
  "country": "INDIA"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "email": "admin@firm.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "ADMIN",
    "firmId": "uuid"
  }
}
```

#### POST `/api/auth/login`
Login user

**Request:**
```json
{
  "email": "admin@firm.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ... }
}
```

---

### **Cases**

#### GET `/api/cases`
Get all cases with filters

**Query Parameters:**
- `status` - DRAFT | UNDER_REVIEW | FINALIZED
- `fiscalYear` - Integer (e.g., 2024)
- `clientId` - UUID
- `caseType` - AUDIT | TAX | ADVISORY | COMPLIANCE | OTHER

**Response:**
```json
{
  "cases": [
    {
      "id": "uuid",
      "caseNumber": "CASE-2024-0001",
      "caseName": "Annual Audit 2024",
      "status": "FINALIZED",
      "client": { ... },
      "preparedBy": { ... },
      "reviewedBy": { ... },
      "approvedBy": { ... }
    }
  ]
}
```

#### GET `/api/cases/:id`
Get single case with full details

**Response:**
```json
{
  "case": {
    "id": "uuid",
    "caseNumber": "CASE-2024-0001",
    "caseName": "Annual Audit 2024",
    "status": "FINALIZED",
    "bundles": [ ... ],
    "approvalChain": [ ... ]
  }
}
```

#### POST `/api/cases`
Create new case (DRAFT)

**Request:**
```json
{
  "caseName": "Annual Audit 2024",
  "caseType": "AUDIT",
  "clientId": "uuid",
  "periodStart": "2024-01-01",
  "periodEnd": "2024-12-31",
  "fiscalYear": 2024,
  "description": "Annual audit for FY 2024",
  "tags": ["audit", "annual"]
}
```

#### POST `/api/cases/:id/submit`
Submit case for review (DRAFT → UNDER_REVIEW)

**Response:**
```json
{
  "message": "Case submitted for review. Notifications sent to reviewers.",
  "case": { ... }
}
```

#### POST `/api/cases/:id/review`
Review case (Manager+ only)

**Request:**
```json
{
  "approved": true,
  "comments": "Looks good, ready for finalization"
}
```

**Response:**
```json
{
  "message": "Case approved. Ready for partner finalization.",
  "case": { ... }
}
```

#### POST `/api/cases/:id/finalize`
Finalize case (Partner only, irreversible)

**Request:**
```json
{
  "finalComments": "Case finalized and locked"
}
```

**Response:**
```json
{
  "message": "✅ CASE FINALIZED AND LOCKED. This action is irreversible.",
  "case": { ... }
}
```

---

### **File Bundles**

#### GET `/api/bundles/case/:caseId`
Get all bundles for a case

**Response:**
```json
{
  "bundles": [
    {
      "id": "uuid",
      "bundleName": "Financial Statements",
      "version": 1,
      "isFinalized": false,
      "files": [ ... ]
    }
  ]
}
```

#### POST `/api/bundles/case/:caseId`
Create new bundle

**Request:**
```json
{
  "bundleName": "Financial Statements"
}
```

#### POST `/api/bundles/:bundleId/upload`
Upload files to bundle (multipart/form-data)

**Form Data:**
- `files` - Array of files (max 10 files, 100MB each)

**Response:**
```json
{
  "message": "3 files uploaded successfully",
  "files": [
    {
      "id": "uuid",
      "fileName": "balance-sheet.pdf",
      "fileType": "PDF",
      "fileSize": 1048576,
      "fileHash": "sha256-hash...",
      "uploadedBy": { ... }
    }
  ]
}
```

#### GET `/api/bundles/file/:fileId/download`
Download single file

**Response:** File stream

#### GET `/api/bundles/:bundleId/download`
Download bundle as ZIP

**Response:** ZIP file stream

#### GET `/api/bundles/case/:caseId/download-all`
Export case (audit-ready PDF + all files)

**Response:** ZIP file containing:
- `CASE-2024-0001-EXPORT.pdf` (audit report)
- All files organized by bundle

---

### **Search**

#### GET `/api/search/advanced`
Advanced search with filters

**Query Parameters:**
- `q` - Search query (required, min 2 chars)
- `fiscalYear` - Integer
- `caseType` - AUDIT | TAX | etc.
- `clientId` - UUID
- `status` - DRAFT | UNDER_REVIEW | FINALIZED
- `dateFrom` - ISO date
- `dateTo` - ISO date
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20, max: 100)

**Response:**
```json
{
  "cases": [ ... ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  },
  "query": {
    "searchTerm": "audit",
    "filters": { ... }
  }
}
```

#### GET `/api/search/suggestions`
Autocomplete suggestions

**Query Parameters:**
- `q` - Search query (min 2 chars)

**Response:**
```json
{
  "suggestions": {
    "cases": ["Annual Audit 2024", "Tax Audit 2023"],
    "clients": ["ABC Corp", "XYZ Ltd"],
    "tags": ["audit", "tax", "compliance"]
  }
}
```

#### GET `/api/search/filters`
Get available filter options

**Response:**
```json
{
  "filters": {
    "fiscalYears": [2024, 2023, 2022],
    "caseTypes": ["AUDIT", "TAX", "ADVISORY"],
    "clients": [ ... ],
    "statuses": ["DRAFT", "UNDER_REVIEW", "FINALIZED"]
  }
}
```

---

### **Clients**

#### GET `/api/clients`
Get all clients

#### POST `/api/clients`
Create new client

**Request:**
```json
{
  "name": "ABC Corporation",
  "industry": "Manufacturing",
  "contactPerson": "Jane Smith",
  "email": "jane@abc.com",
  "phone": "+91-9876543210",
  "address": "123 Business St, Mumbai"
}
```

#### PUT `/api/clients/:id`
Update client

#### DELETE `/api/clients/:id`
Delete client (soft delete)

---

### **Users**

#### GET `/api/users`
Get all users in firm

#### POST `/api/users`
Create new user (Admin only)

**Request:**
```json
{
  "email": "user@firm.com",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STAFF"
}
```

#### PUT `/api/users/:id`
Update user

#### DELETE `/api/users/:id`
Deactivate user

---

### **Audit Logs**

#### GET `/api/audit`
Get audit logs

**Query Parameters:**
- `action` - Filter by action type
- `entityType` - CASE | FILE | USER | etc.
- `userId` - Filter by user
- `startDate` - ISO date
- `endDate` - ISO date
- `page` - Page number
- `limit` - Results per page

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "action": "CASE_FINALIZED",
      "entityType": "CASE",
      "entityId": "uuid",
      "user": { ... },
      "metadata": { ... },
      "createdAt": "2024-01-08T10:00:00.000Z"
    }
  ],
  "pagination": { ... }
}
```

#### GET `/api/audit/export`
Export audit logs as CSV

**Response:** CSV file

---

## 🔒 Rate Limits

- **General API**: 100 requests / 15 minutes
- **Auth endpoints**: 5 attempts / 15 minutes
- **File uploads**: 50 uploads / hour
- **Exports**: 10 exports / hour
- **Email**: 20 emails / hour

---

## ⚠️ Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "statusCode": 400,
  "timestamp": "2024-01-08T10:00:00.000Z"
}
```

### Common Status Codes
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

---

## 📝 Notes

1. All timestamps are in ISO 8601 format (UTC)
2. All IDs are UUIDs
3. File uploads use multipart/form-data
4. Downloads return file streams
5. Pagination starts at page 1
6. Maximum file size: 100MB per file
7. Maximum files per upload: 10

---

**CASESTACK API v1.0.0**  
**Last Updated: 2024-01-08**
