# CaseStack

**Professional Case Management Platform for Law Firms**

Clean, fast, and powerful case management with AI-powered insights and geo-based pricing.

---

## 🚀 Quick Start

### Automated Setup (Recommended)

```bash
# Clone repository
git clone https://github.com/yourusername/casestack.git
cd casestack

# Run setup script
chmod +x setup.sh
./setup.sh
```

### Manual Setup

```bash
# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration

# Database setup
createdb casestack
npx prisma migrate dev

# Frontend setup
cd ../frontend
npm install
cp .env.example .env
# Edit .env with your configuration
```

### Start Development

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Open browser:** `http://localhost:3000`

---

## ⚠️ Network Issues?

**If you see "Network Error" or connection problems:**

1. **Check backend is running:**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Verify environment variables:**
   ```bash
   # Backend: backend/.env
   PORT=5000
   ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"
   
   # Frontend: frontend/.env
   VITE_API_URL=http://localhost:5000
   ```

3. **See full troubleshooting guide:**
   - [NETWORK_FIX.md](NETWORK_FIX.md) - Complete network troubleshooting

**The network fix includes:**
- ✅ Automatic retry (3 attempts)
- ✅ Better error messages
- ✅ CORS configuration
- ✅ Request logging
- ✅ Health checks

---

## Features

- **Case Management** - Unlimited cases with full lifecycle tracking
- **AI Assistant** - Predictive analytics, risk assessment, smart recommendations
- **Client Portal** - Secure client communication and document sharing
- **Document Management** - Unlimited storage with version control
- **Time Tracking** - Billable hours tracking and reporting
- **Workflow Automation** - Custom workflows and task automation
- **Video Meetings** - Built-in video conferencing
- **E-Signatures** - Contract signing and management
- **Advanced Reporting** - Business intelligence and analytics
- **API Access** - Full REST API for integrations

---

## Pricing

**Simple per-user pricing with geo-based rates**

| Country | Price/User/Month | Currency |
|---------|------------------|----------|
| Switzerland | 120 | CHF |
| United States | 78 | USD |
| United Kingdom | 78 | GBP |
| Germany | 82 | EUR |
| India | 35 | INR |
| Brazil | 58 | BRL |

**90+ countries supported with fair, localized pricing**

**All features included. No limits. 14-day free trial.**

---

## Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL + Prisma ORM
- Redis (caching)
- Stripe (payments)
- JWT authentication
- Geo-IP detection

**Frontend:**
- React + TypeScript
- Vite
- TailwindCSS
- Clean professional UI (black/white/grey)
- No animations (fast & professional)

**Infrastructure:**
- Docker + Docker Compose
- NGINX (reverse proxy)
- Prometheus + Grafana (monitoring)

---

## API Documentation

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Cases
```
GET    /api/cases
POST   /api/cases
GET    /api/cases/:id
PUT    /api/cases/:id
DELETE /api/cases/:id
```

### AI Features
```
POST /api/ai/cases/:id/predict
POST /api/ai/cases/:id/risk
POST /api/ai/cases/:id/recommendations
```

### Billing
```
GET  /api/billing/pricing/geo
POST /api/billing/subscription
GET  /api/billing/subscription
PUT  /api/billing/payment-method
```

### Health Check
```
GET /health
```

---

## Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/casestack

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Stripe (optional)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Frontend (.env)
```env
# API URL
VITE_API_URL=http://localhost:5000
```

---

## Docker Deployment

### Development
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.production.yml up -d
```

### Check Status
```bash
docker-compose ps
docker-compose logs -f
```

---

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

---

## Deployment Guides

- [Docker Deployment](DOCKER_DEPLOYMENT_GUIDE.md)
- [Production Deployment](PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Render Deployment](RENDER_DEPLOYMENT_GUIDE.md)
- [Network Troubleshooting](NETWORK_FIX.md)

---

## Project Structure

```
casestack/
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── server.js       # Express app
│   ├── prisma/
│   │   └── schema.prisma   # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities
│   │   ├── stores/         # State management
│   │   └── styles/         # CSS files
│   └── package.json
├── nginx/
│   └── nginx.conf          # NGINX configuration
├── docker-compose.yml
└── README.md
```

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## Security

- JWT authentication
- Password hashing (bcrypt)
- Rate limiting
- CORS protection
- SQL injection prevention
- XSS protection
- CSRF protection
- SSL/TLS encryption
- Input sanitization
- Secure headers (Helmet.js)

See [SECURITY.md](SECURITY.md) for security policy.

---

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## Support

- **Documentation:** [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- **Network Issues:** [NETWORK_FIX.md](NETWORK_FIX.md)
- **FAQ:** [FAQ.md](FAQ.md)
- **Issues:** [GitHub Issues](https://github.com/yourusername/casestack/issues)

---

## Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Advanced AI features
- [ ] Multi-language support
- [ ] Accounting integrations
- [ ] Court calendar sync
- [ ] Legal research integration

See [ROADMAP.md](ROADMAP.md) for details.

---

## Status

✅ **Production Ready**
- Clean, professional codebase
- Comprehensive documentation
- Geo-based pricing (90+ countries)
- Enterprise security
- Performance optimized
- Network issues fixed
- Monitoring configured
- Deployment ready

---

**Built with ❤️ for law firms worldwide**

**Clean. Fast. Professional. Global.**
