#!/bin/bash

# Quick Start Script for Camera Food Detection System
# Run this once to set up everything

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  📱 Camera Food Detection System - Quick Start Setup           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Set colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Node.js
echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Please install Node.js 16+ from https://nodejs.org/"
    exit 1
fi
echo -e "${GREEN}✅ Node.js $(node -v)${NC}"

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi
echo -e "${GREEN}✅ npm $(npm -v)${NC}"

echo ""
echo -e "${BLUE}📦 Installing dependencies...${NC}"
echo ""

# Backend dependencies
echo "Installing backend dependencies..."
cd backend || exit 1
npm install --silent --production=false

cd ..

# Frontend dependencies
echo "Installing frontend dependencies..."
cd fitness-app-frontend || exit 1
npm install --silent --production=false

cd ..

echo ""
echo -e "${GREEN}✅ Dependencies installed!${NC}"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      🚀 Ready to Start!                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${YELLOW}Next, open two terminal windows:${NC}"
echo ""
echo -e "${BLUE}Terminal 1 - Backend Server:${NC}"
echo '  $ cd backend && npm start'
echo ""
echo -e "${BLUE}Terminal 2 - Frontend Development:${NC}"
echo '  $ cd fitness-app-frontend && npm run dev'
echo ""
echo -e "${YELLOW}Then open your browser:${NC}"
echo '  👉 http://localhost:3000/camera'
echo ""
echo -e "${YELLOW}Don't forget:${NC}"
echo "  1. Grant camera permission when prompted"
echo "  2. Use good lighting for better detection"
echo "  3. Press F12 to see detailed logs if issues occur"
echo ""
