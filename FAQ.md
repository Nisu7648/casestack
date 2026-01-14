# ❓ Frequently Asked Questions (FAQ)

---

## 🎯 **General Questions**

### **What is CaseStack?**
CaseStack is a professional case management system designed for audit, legal, and consulting firms. It consolidates 10+ tools into one unified platform for managing cases, clients, documents, and workflows.

### **Who is CaseStack for?**
- CA (Chartered Accountant) firms
- Legal firms
- Consulting firms
- Audit firms
- Any professional services firm managing cases

### **How is CaseStack different from other tools?**
- **70% cheaper** than competitors like Clio
- **All-in-one** solution (no need for multiple tools)
- **Self-hosted** option for complete control
- **Professional** black/white theme
- **Production-ready** - deploy in minutes

### **Is CaseStack open source?**
No, CaseStack is proprietary software. However, we provide comprehensive documentation and support.

---

## 💰 **Pricing & Plans**

### **How much does CaseStack cost?**
- **Free Tier:** 1 user, 100 cases
- **Starter:** $29/month - 5 users
- **Professional:** $99/month - 20 users
- **Enterprise:** Custom pricing

### **Is there a free trial?**
Yes! The free tier is available forever with 1 user and 100 cases.

### **Can I self-host for free?**
Yes! You can deploy CaseStack on your own infrastructure at no cost (except hosting fees).

### **What payment methods do you accept?**
Credit card, PayPal, bank transfer (for enterprise).

### **Can I cancel anytime?**
Yes, cancel anytime. No long-term contracts required.

---

## 🚀 **Deployment & Setup**

### **How long does setup take?**
- **Docker:** 2 minutes
- **Manual:** 5 minutes
- **Free hosting:** 10 minutes

### **What are the system requirements?**
- **Node.js:** 18+
- **PostgreSQL:** 14+
- **RAM:** 2GB minimum
- **Storage:** 10GB minimum

### **Can I deploy on shared hosting?**
Not recommended. Use VPS, cloud hosting, or Docker.

### **Which cloud providers are supported?**
- DigitalOcean
- AWS
- Google Cloud
- Azure
- Render
- Vercel
- Any VPS provider

### **Do you provide hosting?**
Not currently, but it's on our roadmap for 2026.

---

## 🔒 **Security & Privacy**

### **Is my data secure?**
Yes! We implement:
- JWT authentication
- Password hashing (bcrypt)
- HTTPS encryption
- Rate limiting
- Audit logging
- Device session limits

### **Where is data stored?**
Data is stored in your PostgreSQL database. You control where it's hosted.

### **Is CaseStack GDPR compliant?**
Yes, when self-hosted. You control all data.

### **Do you have access to my data?**
No, if self-hosted. Your data stays on your infrastructure.

### **What about backups?**
You're responsible for backups when self-hosted. We recommend daily automated backups.

---

## 📱 **Features & Functionality**

### **What features are included?**
- Case management
- Client management
- Document upload/download
- Audit trail
- Search functionality
- Analytics & reporting
- Task management
- Calendar integration
- User management
- Device session management

### **Can I customize CaseStack?**
Yes! Modify the code, add features, or integrate with other tools.

### **Does it support multiple users?**
Yes! Unlimited users on enterprise plan.

### **Can I upload any file type?**
Yes! All file types supported with SHA-256 verification.

### **Is there a mobile app?**
Not yet. Mobile apps planned for Q3 2026.

### **Does it work offline?**
Not currently. Offline mode planned for 2026.

---

## 🔧 **Technical Questions**

### **What tech stack is used?**
- **Backend:** Node.js + Express + PostgreSQL
- **Frontend:** React + TypeScript + Vite
- **ORM:** Prisma
- **Auth:** JWT
- **Deployment:** Docker

### **Can I use MySQL instead of PostgreSQL?**
Prisma supports MySQL, but we recommend PostgreSQL for best performance.

### **How do I update CaseStack?**
```bash
git pull origin main
cd backend && npm install
cd ../frontend && npm install
npx prisma migrate deploy
```

### **Can I integrate with other tools?**
Yes! Use our API or build custom integrations.

### **Is there an API?**
Yes! RESTful API with 67+ endpoints.

### **Can I contribute code?**
See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 🐛 **Troubleshooting**

### **Backend won't start**
1. Check DATABASE_URL in .env
2. Run `npx prisma migrate deploy`
3. Check logs: `docker-compose logs -f backend`

### **Frontend shows blank page**
1. Check VITE_API_URL in .env
2. Ensure backend is running
3. Check browser console for errors

### **Database connection failed**
1. Verify PostgreSQL is running
2. Check DATABASE_URL format
3. Test connection: `psql $DATABASE_URL`

### **File upload fails**
1. Check MAX_FILE_SIZE in .env
2. Verify storage permissions
3. Check disk space

### **Login not working**
1. Check JWT_SECRET is set
2. Clear browser cache
3. Check backend logs

---

## 📚 **Documentation**

### **Where is the documentation?**
All documentation is in the GitHub repository:
- README.md - Quick start
- DEPLOYMENT_GUIDE.md - Production deployment
- DOCKER_DEPLOYMENT_GUIDE.md - Docker setup
- INTEGRATION_GUIDE.md - Manual setup
- SECURITY.md - Security policy
- CONTRIBUTING.md - Contribution guidelines

### **Are there video tutorials?**
Coming soon! Planned for Q1 2026.

### **Is there a knowledge base?**
Check GitHub Wiki (coming soon).

### **How do I get support?**
1. Check documentation
2. Search GitHub Issues
3. Create new issue
4. Contact support (enterprise only)

---

## 🤝 **Community & Support**

### **How do I report bugs?**
Use GitHub Issues with the bug report template.

### **How do I request features?**
Use GitHub Issues with the feature request template.

### **Is there a community forum?**
GitHub Discussions (coming soon).

### **Do you offer training?**
Enterprise customers get dedicated training.

### **What's your response time?**
- **Community:** Best effort
- **Paid:** 24-48 hours
- **Enterprise:** 4-8 hours

---

## 🔄 **Updates & Roadmap**

### **How often do you release updates?**
- **Patches:** Weekly
- **Minor:** Monthly
- **Major:** Quarterly

### **What's on the roadmap?**
See [ROADMAP.md](ROADMAP.md) for detailed plans.

### **Can I influence the roadmap?**
Yes! Vote on features in GitHub Discussions.

### **Will my data migrate to new versions?**
Yes! We provide migration guides for breaking changes.

---

## 💼 **Business Questions**

### **Can I white-label CaseStack?**
Enterprise plan includes white-labeling (coming Q4 2026).

### **Do you offer reseller programs?**
Yes! Contact us for partnership opportunities.

### **Can I get a custom quote?**
Yes! Contact us for enterprise pricing.

### **Do you offer SLAs?**
Yes, for enterprise customers.

### **What about compliance certifications?**
SOC 2 compliance planned for Q4 2026.

---

## 📞 **Contact**

### **How do I contact you?**
- **GitHub Issues:** Bug reports & features
- **Email:** [your-email@example.com]
- **Security:** See SECURITY.md

### **Do you have social media?**
Coming soon!

### **Where is your office?**
Remote-first company.

---

## 🎓 **Learning Resources**

### **Getting Started**
1. Read README.md
2. Follow DOCKER_QUICK_START.md
3. Watch tutorials (coming soon)
4. Join community

### **Best Practices**
1. Regular backups
2. Strong passwords
3. HTTPS only
4. Keep updated
5. Monitor logs

---

**Still have questions?**  
Create an issue on GitHub or check our documentation!

---

**Last Updated:** January 14, 2026
