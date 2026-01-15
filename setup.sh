#!/bin/bash

# CaseStack Setup Script
# Automated setup for development environment

set -e

echo "======================================"
echo "🚀 CaseStack Setup Script"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ npm $(npm -v) detected${NC}"
echo ""

# Backend setup
echo "======================================"
echo "📦 Setting up Backend"
echo "======================================"

cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Setup environment
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit backend/.env with your configuration${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

# Check if PostgreSQL is running
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL detected${NC}"
    
    # Ask if user wants to create database
    read -p "Create database 'casestack'? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        createdb casestack 2>/dev/null || echo -e "${YELLOW}⚠️  Database might already exist${NC}"
        echo -e "${GREEN}✅ Database created${NC}"
    fi
    
    # Run migrations
    read -p "Run database migrations? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        npx prisma migrate dev
        echo -e "${GREEN}✅ Migrations completed${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  PostgreSQL not detected. Please install and configure manually.${NC}"
fi

cd ..

# Frontend setup
echo ""
echo "======================================"
echo "🎨 Setting up Frontend"
echo "======================================"

cd frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Setup environment
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${GREEN}✅ .env file created${NC}"
else
    echo -e "${GREEN}✅ .env file already exists${NC}"
fi

cd ..

# Final instructions
echo ""
echo "======================================"
echo "✅ Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure environment variables:"
echo "   - Edit backend/.env"
echo "   - Edit frontend/.env"
echo ""
echo "2. Start the backend:"
echo "   cd backend"
echo "   npm run dev"
echo ""
echo "3. Start the frontend (in a new terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Open your browser:"
echo "   http://localhost:3000"
echo ""
echo "======================================"
echo "📚 Documentation:"
echo "   - README.md - Quick start guide"
echo "   - NETWORK_FIX.md - Network troubleshooting"
echo "   - PROJECT_SUMMARY.md - Project overview"
echo "======================================"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
