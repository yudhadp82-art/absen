#!/bin/bash
# Simple Express Server - Alternative untuk Vercel Dev

echo "========================================"
echo "Starting Backend API (Express Server)"
echo "========================================"
echo ""

# Cek apakah Node.js terinstall
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js tidak terinstall!"
    echo "Silakan install dari: https://nodejs.org/"
    exit 1
fi

echo "[1/2] Installing dependencies..."
npm install express cors
echo ""

echo "[2/2] Starting server..."
echo "Server akan berjalan di: http://localhost:3000"
echo ""
echo "Press Ctrl+C untuk stop server"
echo ""

node server.js
