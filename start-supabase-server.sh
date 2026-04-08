#!/bin/bash
# Script untuk menjalankan Backend API dengan Supabase Database

echo "========================================"
echo "Starting Backend API (Supabase)"
echo "========================================"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "[ERROR] .env file tidak ditemukan!"
    echo ""
    echo "Silakan buat .env file terlebih dahulu:"
    echo "  1. Copy .env.example ke .env"
    echo "  2. Isi SUPABASE_URL dan SUPABASE_ANON_KEY"
    echo "  3. Baca SUPABASE_SETUP.md untuk panduan"
    echo ""
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js tidak terinstall!"
    echo "Silakan install dari: https://nodejs.org/"
    exit 1
fi

echo "[1/3] Checking .env file..."
echo "[OK] .env file found"
echo ""

echo "[2/3] Installing dependencies..."
npm install
echo ""

echo "[3/3] Starting server dengan Supabase..."
echo ""
echo "Server akan berjalan di: http://localhost:3000"
echo "Database: Supabase"
echo ""
echo "Press Ctrl+C untuk stop server"
echo ""

node server-supabase.js
