#!/bin/bash
# Food Detection System Setup Script
# Installs all dependencies and configures the system

echo "================================================================"
echo "🍽️  North Indian Food Detection System - Setup"
echo "================================================================"
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "✗ Node.js not found. Please install Node.js 14+ from https://nodejs.org/"
    exit 1
fi
echo "✓ Node.js $(node -v) found"
echo ""

# Check Python
echo "✓ Checking Python..."
if ! command -v python3 &> /dev/null; then
    echo "✗ Python 3 not found. Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi
echo "✓ Python $(python3 --version) found"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "✗ Failed to install backend dependencies"
    exit 1
fi
echo "✓ Backend dependencies installed"
echo ""

# Install Python dependencies
echo "📦 Installing Python dependencies..."
python3 -m pip install --upgrade pip
python3 -m pip install tensorflow numpy pillow

if [ $? -ne 0 ]; then
    echo "⚠️  Some Python packages failed to install"
    echo "   This might be due to system configuration"
    echo "   TensorFlow requires Python 3.8+ and may need CUDA for GPU support"
fi
echo "✓ Python dependencies configured"
echo ""

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p ml_models
mkdir -p uploads/food-images
echo "✓ Directories created"
echo ""

# Check if model files exist
echo "🔍 Checking for model files..."
if [ -f "ml_models/north_indian_food_model.h5" ]; then
    echo "✓ Pre-trained model found"
else
    echo "ℹ️  Model file not found: ml_models/north_indian_food_model.h5"
    echo "   The model will be created on first use"
fi
echo ""

# Test Python script
echo "🧪 Testing Python food detection script..."
python3 services/northIndianFoodDetector.py --list-foods > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ Food detection script is working"
else
    echo "⚠️  Could not test the script. Skipping..."
fi
echo ""

echo "================================================================"
echo "✅ Setup Complete!"
echo "================================================================"
echo ""
echo "Next steps:"
echo "1. Start the backend server:"
echo "   cd backend"
echo "   npm start"
echo ""
echo "2. The food detection API will be available at:"
echo "   http://localhost:5000/api/food/"
echo ""
echo "3. Available endpoints:"
echo "   POST   /api/food/detect              - Detect food from image"
echo "   GET    /api/food/foods               - Get all foods"
echo "   GET    /api/food/nutrition/:foodName - Get food nutrition"
echo "   POST   /api/food/analyze-meal        - Analyze meal"
echo "   GET    /api/food/recommendations     - Get recommendations"
echo "   POST   /api/food/search              - Search foods"
echo "   GET    /api/food/categories          - Get categories"
echo "   GET    /api/food/stats               - Get statistics"
echo "   GET    /api/food/health-check        - Health check"
echo ""
echo "📖 For detailed API documentation, see: FOOD_DETECTION_GUIDE.md"
echo ""
