# CaseStack

**Professional Case Management Platform for Law Firms**

Clean, fast, and powerful case management with AI-powered insights and geo-based pricing.

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

- Switzerland: CHF 120/user/month
- United States: USD 78/user/month
- United Kingdom: GBP 78/user/month
- India: INR 35/user/month
- *Pricing varies by country based on purchasing power*

**All features included. No limits. 14-day free trial.**

---

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/casestack.git
cd casestack

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
cd backend
npx prisma migrate dev

# Start development servers
npm run dev  # Backend (port 5000)
cd ../frontend
npm run dev  # Frontend (port 5173)
```

### Docker Deployment

```bash
# Production deployment
docker-compose -f docker-compose.production.yml up -d

# Development
docker-compose up -d
```

---

## Tech Stack

**Backend:**
- Node.js + Express
- PostgreSQL + Prisma ORM
- Redis (caching)
- Stripe (payments)
- JWT authentication

**Frontend:**
- React + TypeScript
- Vite
- TailwindCSS
- Axios

**Infrastructure:**
- Docker
- NGINX
- Prometheus + Grafana (monitoring)

---

## API Documentation

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
```

### Cases
```
GET    /api/cases
POST   /api/cases
GET    /api/cases/:id
PUT    /api/cases/:id
DELETE /api/cases/:id
```

### AI
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
```

---

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/casestack

# JWT
JWT_SECRET=your-secret-key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Redis
REDIS_URL=redis://localhost:6379

# Frontend
VITE_API_URL=http://localhost:5000
```

---

## Deployment

### Production Checklist

- [ ] Set environment variables
- [ ] Configure SSL certificates
- [ ] Setup database backups
- [ ] Configure monitoring
- [ ] Setup Stripe webhooks
- [ ] Test payment flow
- [ ] Configure email service
- [ ] Setup domain and DNS

### Deployment Guides

- [Docker Deployment](DOCKER_DEPLOYMENT_GUIDE.md)
- [Production Deployment](PRODUCTION_DEPLOYMENT_GUIDE.md)
- [Render Deployment](RENDER_DEPLOYMENT_GUIDE.md)

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

---

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## Support

- Documentation: [docs.casestack.com](https://docs.casestack.com)
- Email: support@casestack.com
- Issues: [GitHub Issues](https://github.com/yourusername/casestack/issues)

---

## Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Advanced AI features
- [ ] Multi-language support
- [ ] Accounting integrations
- [ ] Court calendar sync
- [ ] Legal research integration

---

**Built with ❤️ for law firms worldwide**
