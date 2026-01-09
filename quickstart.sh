#!/bin/bash

# ============================================
# CASESTACK QUICK START SCRIPT
# Automated setup for development
# ============================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}CASESTACK QUICK START${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}✓ Node.js $(node --version) detected${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠ PostgreSQL not found${NC}"
    echo "Please install PostgreSQL or use a cloud database"
fi

echo ""
echo -e "${BLUE}Step 1: Backend Setup${NC}"
echo "----------------------------------------"

cd backend

# Install dependencies
echo "Installing backend dependencies..."
npm install

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${YELLOW}⚠ Please edit backend/.env with your configuration${NC}"
    echo "Press Enter when ready to continue..."
    read
fi

# Check if DATABASE_URL is set
if ! grep -q "DATABASE_URL=postgresql://" .env; then
    echo -e "${RED}✗ DATABASE_URL not configured in .env${NC}"
    echo "Please set DATABASE_URL in backend/.env"
    exit 1
fi

# Run migrations
echo "Running database migrations..."
npm run migrate

# Generate Prisma client
echo "Generating Prisma client..."
npm run generate

echo -e "${GREEN}✓ Backend setup complete${NC}"
echo ""

# Start backend in background
echo "Starting backend server..."
npm run dev &
BACKEND_PID=$!

echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
echo ""

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}✗ Backend failed to start${NC}"
        kill $BACKEND_PID
        exit 1
    fi
    sleep 1
done

echo ""
echo -e "${BLUE}Step 2: Frontend Setup${NC}"
echo "----------------------------------------"

cd ../frontend

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "VITE_API_URL=http://localhost:5000" > .env
    echo -e "${GREEN}✓ Created frontend/.env${NC}"
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"
echo ""

# Start frontend
echo "Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${YELLOW}⚠ Frontend may not be ready yet${NC}"
    fi
    sleep 1
done

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ CASESTACK IS RUNNING!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}Backend:${NC}  http://localhost:5000"
echo -e "${BLUE}Frontend:${NC} http://localhost:5173"
echo -e "${BLUE}Health:${NC}   http://localhost:5000/health"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit 0" INT

# Keep script running
wait
