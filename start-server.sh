#!/bin/bash
# Script untuk menjalankan Backend API secara lokal

echo "========================================"
echo "Starting Backend API Server..."
echo "========================================"
echo ""

# Cek apakah Vercel CLI terinstall
if ! command -v vercel &> /dev/null; then
    echo "[ERROR] Vercel CLI tidak terinstall!"
    echo "Silakan jalankan: npm i -g vercel"
    exit 1
fi

echo "[1/2] Installing dependencies..."
npm install
echo ""

echo "[2/2] Starting Vercel Dev Server..."
echo "Server akan berjalan di: http://localhost:3000"
echo ""
echo "Press Ctrl+C untuk stop server"
echo ""

vercel dev
