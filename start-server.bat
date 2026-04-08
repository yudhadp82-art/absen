@echo off
REM Script untuk menjalankan Backend API secara lokal
REM
echo ========================================
echo Starting Backend API Server...
echo ========================================
echo.

REM Cek apakah Vercel CLI terinstall
where vercel >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Vercel CLI tidak terinstall!
    echo Silakan jalankan: npm i -g vercel
    pause
    exit /b 1
)

echo [1/2] Installing dependencies...
call npm install
echo.

echo [2/2] Starting Vercel Dev Server...
echo Server akan berjalan di: http://localhost:3000
echo.
echo Press Ctrl+C untuk stop server
echo.

call vercel dev --yes --scope yudhadp82s-projects
