@echo off
REM SOMI Sentinel Complete System Startup Script (Windows)
REM This script starts all services in the correct order

echo 🚀 Starting SOMI Sentinel Complete System
echo ==========================================

REM Create logs directory
if not exist logs mkdir logs

REM Check if deployed.json exists
if not exist deployed.json (
    echo [ERROR] deployed.json not found. Please run deployment first:
    echo cd contracts ^&^& npm run deploy:somnia
    pause
    exit /b 1
)

echo [INFO] Contract addresses loaded from deployed.json

REM Check environment variables
echo [INFO] Checking environment variables...
if "%AGENT_PRIVATE_KEY%"=="" (
    echo [ERROR] AGENT_PRIVATE_KEY not set
    goto :error
)
if "%RELAYER_PRIVATE_KEY%"=="" (
    echo [ERROR] RELAYER_PRIVATE_KEY not set
    goto :error
)
if "%GEMINI_API_KEY%"=="" (
    echo [ERROR] GEMINI_API_KEY not set
    goto :error
)
if "%NFT_STORAGE_KEY%"=="" (
    echo [ERROR] NFT_STORAGE_KEY not set
    goto :error
)

echo [SUCCESS] Environment variables validated

REM Start services
echo [INFO] Starting services...

REM Start Backend API
echo [INFO] Starting Backend API...
cd backend
start "Backend API" cmd /k "npm run dev"
cd ..
timeout /t 5 /nobreak > nul

REM Start Relayer
echo [INFO] Starting Relayer...
cd relayer
start "Relayer" cmd /k "npm run dev"
cd ..
timeout /t 5 /nobreak > nul

REM Start Agent
echo [INFO] Starting Agent...
cd agent
start "Agent" cmd /k "npm run dev"
cd ..
timeout /t 5 /nobreak > nul

REM Start Frontend
echo [INFO] Starting Frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo [SUCCESS] All services started successfully!
echo.
echo 🌐 Service URLs:
echo ================
echo Frontend:    http://localhost:5173
echo Backend API: http://localhost:3000
echo Relayer:     http://localhost:3001
echo Agent:       http://localhost:3002
echo.
echo 📊 Monitoring:
echo ==============
echo Backend Health: http://localhost:3000/health
echo Relayer Status: http://localhost:3001/status
echo Agent Status:   http://localhost:3002/status
echo.
echo Press any key to continue...
pause > nul
goto :end

:error
echo [ERROR] Missing required environment variables
pause
exit /b 1

:end
