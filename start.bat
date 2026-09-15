@echo off
title Secure File Sharing System Launcher
echo ===================================================
echo   Starting Secure File Sharing System (SecureVault)
echo ===================================================
echo.

echo [1/2] Launching Backend Server on port 5000...
start "SecureVault Backend (Port 5000)" cmd /k "cd /d %~dp0backend && node server.js"

timeout /t 2 >nul

echo [2/2] Launching Frontend Server on port 5173...
start "SecureVault Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 >nul

echo.
echo Opening SecureVault in your browser: http://localhost:5173
start http://localhost:5173

echo.
echo ===================================================
echo   Both servers are running!
echo   Admin Demo: admin@secure.io / Admin@12345
echo   User Demo:  alex@company.com / User@12345
echo ===================================================
pause
