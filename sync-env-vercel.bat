@echo off
set SUPABASE_URL=https://wjtjlwlxygwwrfxbfqmi.supabase.co
set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqdGpsd2x4eWd3d3JmeGJmcW1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1MDE0MjUsImV4cCI6MjA5MTA3NzQyNX0.bnd5uzdNM95nwvEDgyKbOJzADhJQH3D5vmjtnff5xpc

echo ========================================
echo Syncing Env to Vercel (Automatic)
echo ========================================

echo.
echo [1/4] Syncing SUPABASE_URL to absen...
vercel env add SUPABASE_URL production --value "%SUPABASE_URL%" --yes --scope yudhadp82s-projects --force

echo.
echo [2/4] Syncing SUPABASE_ANON_KEY to absen...
vercel env add SUPABASE_ANON_KEY production --value "%SUPABASE_ANON_KEY%" --yes --scope yudhadp82s-projects --force

echo.
echo [3/4] Syncing SUPABASE_URL to admin...
pushd admin
vercel env add SUPABASE_URL production --value "%SUPABASE_URL%" --yes --scope yudhadp82s-projects --force
popd

echo.
echo [4/4] Syncing SUPABASE_ANON_KEY to admin...
pushd admin
vercel env add SUPABASE_ANON_KEY production --value "%SUPABASE_ANON_KEY%" --yes --scope yudhadp82s-projects --force
popd

echo.
echo ========================================
echo Sync Complete!
echo ========================================
pause

