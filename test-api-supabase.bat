@echo off
REM Script untuk test API endpoints dengan Supabase
REM

echo ========================================
echo Testing Backend API (Supabase)
echo ========================================
echo.

echo [1/5] Checking server status...
curl -s http://localhost:3000/api/health
if %ERRORLEVEL% EQU 0 (
    echo.
    echo [OK] Server is running!
    echo.
) else (
    echo.
    echo [ERROR] Server tidak berjalan!
    echo Silakan jalankan start-supabase-server.bat terlebih dahulu
    pause
    exit /b 1
)

echo [2/5] Testing Health Check...
echo Request: GET /api/health
curl -s http://localhost:3000/api/health
echo.
echo.

echo [3/5] Testing Check-in...
echo Request: POST /api/attendance
curl -X POST http://localhost:3000/api/attendance ^
  -H "Content-Type: application/json" ^
  -d "{\"employeeId\":\"EMP001\",\"employeeName\":\"Test User\",\"type\":\"checkin\",\"latitude\":-6.2088,\"longitude\":106.8456}"
echo.
echo.

echo [4/5] Testing Check-out...
curl -X POST http://localhost:3000/api/attendance ^
  -H "Content-Type: application/json" ^
  -d "{\"employeeId\":\"EMP001\",\"employeeName\":\"Test User\",\"type\":\"checkout\",\"latitude\":-6.2088,\"longitude\":106.8456}"
echo.
echo.

echo [5/5] Testing Get History...
echo Request: GET /api/attendance?employeeId=EMP001
curl -s "http://localhost:3000/api/attendance?employeeId=EMP001"
echo.
echo.

echo [BONUS] Testing Get Summary...
echo Request: GET /api/attendance/summary
curl -s "http://localhost:3000/api/attendance/summary"
echo.
echo.

echo [BONUS] Testing Get Statistics...
echo Request: GET /api/attendance/stats
curl -s "http://localhost:3000/api/attendance/stats"
echo.
echo.

echo ========================================
echo Test selesai!
echo ========================================
echo.
echo Check Supabase Dashboard untuk melihat data:
echo https://supabase.com/dashboard
echo.
pause
