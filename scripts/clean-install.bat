@echo off
REM SOMI Sentinel Clean Install Script (Windows)
REM This script removes node_modules and reinstalls all dependencies

echo 🧹 SOMI Sentinel Clean Install
echo ==============================

REM Remove existing node_modules
echo [INFO] Removing existing node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo [SUCCESS] Removed main node_modules
) else (
    echo [WARNING] No main node_modules found
)

REM Remove package-lock.json
if exist package-lock.json (
    del package-lock.json
    echo [SUCCESS] Removed package-lock.json
)

REM Remove node_modules from subdirectories
echo [INFO] Cleaning subdirectory node_modules...

if exist contracts\node_modules (
    rmdir /s /q contracts\node_modules
    echo [SUCCESS] Removed contracts\node_modules
)

if exist agent\node_modules (
    rmdir /s /q agent\node_modules
    echo [SUCCESS] Removed agent\node_modules
)

if exist relayer\node_modules (
    rmdir /s /q relayer\node_modules
    echo [SUCCESS] Removed relayer\node_modules
)

REM Install main dependencies
echo [INFO] Installing main project dependencies...
npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install main dependencies
    pause
    exit /b 1
)
echo [SUCCESS] Main dependencies installed successfully

REM Contract dependencies are now included in main package.json
echo [INFO] Contract dependencies are now included in main package.json

REM Agent dependencies are now included in main package.json
echo [INFO] Agent dependencies are now included in main package.json

REM Relayer dependencies are now included in main package.json
echo [INFO] Relayer dependencies are now included in main package.json

echo [SUCCESS] All dependencies installed successfully!
echo.
echo 🚀 You can now start the application:
echo    npm run dev
echo.
echo 📚 Or run individual services:
echo    npm run dev:frontend  # Frontend only
echo    npm run dev:backend   # Backend only
echo    npm run dev:all       # All services
echo.
echo 🔧 Or use the scripts:
echo    start.sh              # Simple start
echo    scripts\start-all.bat # Full system
echo.
pause
