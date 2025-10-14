@echo off
REM Senso HF Spaces Deployment Setup Script
REM This script copies necessary files from backend/ to huggingface_deployment/

echo ========================================
echo Senso HF Spaces Deployment Setup
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "backend" (
    echo ERROR: Please run this script from the senso root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo [1/3] Copying backend app code...
xcopy /E /I /Y backend\app huggingface_deployment\app
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to copy app directory
    pause
    exit /b 1
)
echo ✓ App code copied

echo.
echo [2/3] Creating models directory...
if not exist "huggingface_deployment\models" mkdir huggingface_deployment\models
echo ✓ Models directory created

echo.
echo [3/3] Copying YOLO models...
if exist "backend\models\electric_meter.pt" (
    copy /Y backend\models\electric_meter.pt huggingface_deployment\models\
    echo ✓ electric_meter.pt copied
) else (
    echo ⚠ WARNING: backend\models\electric_meter.pt not found
    echo   You'll need to manually add this file before deploying
)

if exist "backend\models\water_meter.pt" (
    copy /Y backend\models\water_meter.pt huggingface_deployment\models\
    echo ✓ water_meter.pt copied
) else (
    echo ⚠ WARNING: backend\models\water_meter.pt not found
    echo   You'll need to manually add this file before deploying
)

echo.
echo ========================================
echo ✓ Setup Complete!
echo ========================================
echo.
echo Your deployment files are ready in: huggingface_deployment\
echo.
echo Next steps:
echo 1. Review DEPLOYMENT_GUIDE.md for detailed instructions
echo 2. Create a Hugging Face Space at https://huggingface.co/new-space
echo 3. Configure secrets in Space settings
echo 4. Push files to your Space repository
echo.
echo For help, see: DEPLOYMENT_GUIDE.md
echo.
pause
