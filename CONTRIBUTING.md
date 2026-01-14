# Contributing to CaseStack

Thank you for your interest in contributing to CaseStack! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/casestack.git
   cd casestack
   ```
3. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 📋 Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm 9+

### Installation
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Setup
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials

# Frontend
cp frontend/.env.example frontend/.env
```

### Database Setup
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### Running Locally
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

## 🎯 Contribution Guidelines

### Code Style
- **Backend:** Follow Node.js best practices
- **Frontend:** Use TypeScript, follow React best practices
- **Formatting:** Use consistent indentation (2 spaces)
- **Naming:** Use camelCase for variables, PascalCase for components

### Commit Messages
Follow conventional commits:
```
feat: add new feature
fix: bug fix
docs: documentation changes
style: formatting changes
refactor: code refactoring
test: adding tests
chore: maintenance tasks
```

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**
4. **Update CHANGELOG.md** with your changes
5. **Create PR** with clear description:
   - What changes were made
   - Why the changes were needed
   - How to test the changes

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] All tests passing
```

## 🐛 Reporting Bugs

Use GitHub Issues with the bug template:
- **Clear title** describing the issue
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, Node version, etc.)

## 💡 Feature Requests

Use GitHub Issues with the feature template:
- **Clear description** of the feature
- **Use case** - why is this needed?
- **Proposed solution**
- **Alternatives considered**

## 📝 Code Review Process

1. All PRs require at least one review
2. Address all review comments
3. Maintain professional, constructive communication
4. Be open to feedback and suggestions

## 🔒 Security

**DO NOT** open public issues for security vulnerabilities.
See [SECURITY.md](SECURITY.md) for reporting process.

## 📄 License

By contributing, you agree that your contributions will be licensed under the same proprietary license as the project.

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Maintain professional communication

## ❓ Questions?

- Check existing issues and documentation
- Ask in discussions
- Contact maintainers

---

**Thank you for contributing to CaseStack!** 🎉
