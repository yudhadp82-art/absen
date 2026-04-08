@echo off
REM Script untuk test API endpoints
REM
echo ========================================
echo Testing Backend API
echo ========================================
echo.

REM Cek apakah server berjalan
echo [1/4] Checking server status...
curl -s http://localhost:3000/api/health
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Server is running!
    echo.
) else (
    echo.
    echo [ERROR] Server tidak berjalan!
    echo Silakan jalankan start-server.bat terlebih dahulu
    pause
    exit /b 1
)

echo [2/4] Testing Health Check...
echo Request: GET /api/health
curl -s http://localhost:3000/api/health
echo.
echo.

echo [3/4] Testing Check-in...
echo Request: POST /api/attendance
curl -X POST http://localhost:3000/api/attendance ^
  -H "Content-Type: application/json" ^
  -d "{\"employeeId\":\"EMP001\",\"employeeName\":\"Test User\",\"type\":\"checkin\",\"latitude\":-6.2088,\"longitude\":106.8456}"
echo.
echo.

echo [4/4] Testing Get History...
echo Request: GET /api/attendance?employeeId=EMP001
curl -s "http://localhost:3000/api/attendance?employeeId=EMP001"
echo.
echo.

echo ========================================
echo Test selesai!
echo ========================================
pause
