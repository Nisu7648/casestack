# Security Policy

## 🔒 Supported Versions

Currently supported versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | ✅ Yes             |
| 1.x.x   | ❌ No              |

## 🚨 Reporting a Vulnerability

**DO NOT** open public GitHub issues for security vulnerabilities.

### Reporting Process

1. **Email:** Send details to [your-security-email@example.com]
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
   - Your contact information

3. **Response Time:**
   - Initial response: Within 48 hours
   - Status update: Within 7 days
   - Fix timeline: Depends on severity

### Severity Levels

**Critical:** Immediate attention required
- Remote code execution
- Authentication bypass
- Data breach potential

**High:** Fix within 7 days
- Privilege escalation
- SQL injection
- XSS vulnerabilities

**Medium:** Fix within 30 days
- Information disclosure
- CSRF vulnerabilities
- Weak encryption

**Low:** Fix in next release
- Minor information leaks
- Non-critical misconfigurations

## 🛡️ Security Best Practices

### For Users

1. **Keep Updated:** Always use the latest version
2. **Strong Passwords:** Use complex, unique passwords
3. **Environment Variables:** Never commit .env files
4. **HTTPS Only:** Always use HTTPS in production
5. **Regular Backups:** Backup your database regularly

### For Developers

1. **Dependencies:** Keep all dependencies updated
2. **Code Review:** All code must be reviewed
3. **Input Validation:** Validate all user inputs
4. **SQL Injection:** Use parameterized queries (Prisma ORM)
5. **XSS Prevention:** Sanitize all outputs
6. **Authentication:** Use JWT with secure secrets
7. **Rate Limiting:** Implement rate limiting on APIs
8. **CORS:** Configure CORS properly
9. **Helmet.js:** Use security headers
10. **Secrets:** Never hardcode secrets

## 🔐 Security Features

CaseStack includes:

- ✅ JWT Authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting
- ✅ CORS protection
- ✅ Helmet.js security headers
- ✅ Input validation
- ✅ SQL injection protection (Prisma)
- ✅ XSS protection
- ✅ Device session management
- ✅ Audit logging

## 📋 Security Checklist

Before deploying:

- [ ] All environment variables set
- [ ] Strong JWT_SECRET configured
- [ ] Database credentials secured
- [ ] HTTPS enabled
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] File upload limits set
- [ ] Error messages don't leak sensitive info
- [ ] Audit logging enabled
- [ ] Regular backups configured

## 🔄 Update Process

When a security update is released:

1. **Notification:** Security advisories published
2. **Patch Release:** Fix released ASAP
3. **Migration Guide:** If breaking changes
4. **Verification:** Test in staging first

## 📞 Contact

For security concerns:
- **Email:** [your-security-email@example.com]
- **PGP Key:** [Optional: Your PGP key]

## 🙏 Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who help improve CaseStack security.

---

**Last Updated:** January 2026
