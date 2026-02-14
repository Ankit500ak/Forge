@echo off
REM Food Detection System Setup Script for Windows
REM Installs all dependencies and configures the system

echo ================================================================
echo 🍽️  North Indian Food Detection System - Setup
echo ================================================================
echo.

REM Check Node.js
echo ✓ Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ✗ Node.js not found. Please install Node.js 14+ from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% found
echo.

REM Check Python
echo ✓ Checking Python...
where python >nul 2>nul
if %errorlevel% neq 0 (
    where python3 >nul 2>nul
    if %errorlevel% neq 0 (
        echo ✗ Python 3 not found. Please install Python 3.8+ from https://www.python.org/
        pause
        exit /b 1
    )
    set PYTHON=python3
) else (
    set PYTHON=python
)
for /f "tokens=*" %%i in ('%PYTHON% --version') do set PYTHON_VERSION=%%i
echo ✓ Python %PYTHON_VERSION% found
echo.

REM Navigate to backend
cd backend

REM Install backend dependencies
echo 📦 Installing backend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ✗ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✓ Backend dependencies installed
echo.

REM Install Python dependencies
echo 📦 Installing Python dependencies...
%PYTHON% -m pip install --upgrade pip
%PYTHON% -m pip install tensorflow numpy pillow

if %errorlevel% neq 0 (
    echo ⚠️  Some Python packages failed to install
    echo    This might be due to system configuration
    echo    TensorFlow requires Python 3.8+ and may need CUDA for GPU support
)
echo ✓ Python dependencies configured
echo.

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist ml_models mkdir ml_models
if not exist uploads\food-images mkdir uploads\food-images
echo ✓ Directories created
echo.

REM Check if model files exist
echo 🔍 Checking for model files...
if exist ml_models\north_indian_food_model.h5 (
    echo ✓ Pre-trained model found
) else (
    echo ℹ️  Model file not found: ml_models\north_indian_food_model.h5
    echo    The model will be created on first use
)
echo.

REM Test Python script
echo 🧪 Testing Python food detection script...
%PYTHON% services\northIndianFoodDetector.py --list-foods >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Food detection script is working
) else (
    echo ⚠️  Could not test the script. Skipping...
)
echo.

echo ================================================================
echo ✅ Setup Complete!
echo ================================================================
echo.
echo Next steps:
echo 1. Start the backend server:
echo    cd backend
echo    npm start
echo.
echo 2. The food detection API will be available at:
echo    http://localhost:5000/api/food/
echo.
echo 3. Available endpoints:
echo    POST   /api/food/detect              - Detect food from image
echo    GET    /api/food/foods               - Get all foods
echo    GET    /api/food/nutrition/:foodName - Get food nutrition
echo    POST   /api/food/analyze-meal        - Analyze meal
echo    GET    /api/food/recommendations     - Get recommendations
echo    POST   /api/food/search              - Search foods
echo    GET    /api/food/categories          - Get categories
echo    GET    /api/food/stats               - Get statistics
echo    GET    /api/food/health-check        - Health check
echo.
echo 📖 For detailed API documentation, see: FOOD_DETECTION_GUIDE.md
echo.
pause
