@echo off
REM Script untuk menjalankan Backend + Web App
REM

echo ========================================
echo Starting Backend + Web App
echo ========================================
echo.

REM Cek apakah .env file exists
if not exist .env (
    echo [ERROR] .env file tidak ditemukan!
    echo.
    echo Silakan buat .env file terlebih dahulu:
    echo   1. Copy .env.example ke .env
    echo   2. Isi SUPABASE_URL dan SUPABASE_ANON_KEY
    echo   3. Baca SUPABASE_SETUP.md untuk panduan
    echo.
    pause
    exit /b 1
)

REM Cek apakah Node.js terinstall
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js tidak terinstall!
    echo Silakan install dari: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Checking .env file...
echo [OK] .env file found
echo.

echo [2/3] Installing dependencies...
call npm install
echo.

echo [3/3] Starting server dengan Web App...
echo.
echo ========================================
echo Server akan berjalan di:
echo   📍 Backend: http://localhost:3000/api
echo   🌐 Web App: http://localhost:3000
echo ========================================
echo.
echo Press Ctrl+C untuk stop server
echo.

node server-web.js
