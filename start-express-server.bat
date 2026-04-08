@echo off
REM Simple Express Server - Alternative untuk Vercel Dev
REM Tidak perlu Vercel CLI, hanya butuh Node.js
REM

echo ========================================
echo Starting Backend API (Express Server)
echo ========================================
echo.

REM Cek apakah Node.js terinstall
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js tidak terinstall!
    echo Silakan install dari: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/2] Installing dependencies...
call npm install express cors
echo.

echo [2/2] Starting server...
echo Server akan berjalan di: http://localhost:3000
echo.
echo Press Ctrl+C untuk stop server
echo.

node server.js
