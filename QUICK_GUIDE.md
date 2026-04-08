# ⚡ QUICK START - 2 Cara Menjalankan Backend

## 🎯 Pilihan Cara Menjalankan Backend

### Cara 1: Express Server (RECOMMENDED - Paling Mudah) ✨

**Keuntungan:**
- ✅ Tidak perlu Vercel CLI
- ✅ Hanya butuh Node.js
- ✅ Lebih simple dan cepat
- ✅ Perfect untuk local development

**Jalankan:**
```bash
# Windows: Double-click file ini
start-express-server.bat

# Atau via terminal:
cd d:\absen
npm install
npm start
```

Server akan berjalan di: **http://localhost:3000**

---

### Cara 2: Vercel Dev (Butuh Vercel CLI)

**Keuntungan:**
- ✅ Simulasi environment Vercel
- ✅ Support serverless functions
- ✅ Cocok untuk testing sebelum deploy

**Jalankan:**
```bash
# Windows: Double-click file ini
start-server.bat

# Atau via terminal:
cd d:\absen
vercel dev --yes --scope yudhadp82s-projects
```

---

## 🚀 Rekomendasi: Pakai Cara 1 (Express Server)

### Langkah 1: Start Backend
```bash
# Double-click: start-express-server.bat
# ATAU:
npm install
npm start
```

Output:
```
========================================
🚀 Backend API Server is Running!
========================================
📍 URL: http://localhost:3000

✨ Server ready untuk menerima requests!
========================================
```

### Langkah 2: Test API
```bash
# Double-click: test-api.bat
# ATAU:
curl http://localhost:3000/api/health
```

### Langkah 3: Update Android BASE_URL

File: `android/app/src/main/java/com/absensi/karyawan/api/RetrofitClient.kt`

**Untuk Android Emulator:**
```kotlin
private const val BASE_URL = "http://10.0.2.2:3000/api/"
```

**Untuk Physical Device:**
```kotlin
private const val BASE_URL = "http://192.168.1.X:3000/api/"
```

Cari IP komputer Anda: `ipconfig`

---

## 📱 Run Android App

1. Buka Android Studio
2. Open project: `d:\absen\android`
3. Wait for Gradle sync
4. Click Run (▶️)

---

## ✅ Checklist Sebelum Mulai

- [ ] Node.js installed (check: `node --version`)
- [ ] Java JDK 11+ installed
- [ ] Android Studio installed
- [ ] Backend server running
- [ ] BASE_URL sudah diupdate di RetrofitClient.kt

---

## 🐛 Troubleshooting

**"Cannot find module 'express'"**
```bash
npm install
```

**"Port 3000 already in use"**
```bash
# Kill port 3000
npx kill-port 3000
```

**"Connection refused" di Android app**
- Pastikan backend server running
- Cek BASE_URL di RetrofitClient.kt
- Untuk emulator gunakan: `10.0.2.2:3000`
- Untuk physical device gunakan IP komputer

---

## 📚 Dokumentasi Lengkap

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Panduan setup lengkap
- [API.md](API.md) - API documentation
- [README.md](README.md) - Main documentation

---

**Next Step:** Jalankan `start-express-server.bat` sekarang! 🚀
