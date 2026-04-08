# 🚀 Setup & Run Guide - Panduan Lengkap

## ⚠️ Requirements yang Perlu Diinstall

### 1. Node.js & Vercel CLI (Backend)
```bash
# Install Node.js dari: https://nodejs.org/

# Install Vercel CLI
npm i -g vercel

# Verifikasi instalasi
node --version
vercel --version
```

### 2. Java JDK (Android)
```bash
# Install JDK 11 atau lebih baru
# Download dari: https://adoptium.net/

# Set JAVA_HOME environment variable
# Contoh untuk Windows:
setx JAVA_HOME "C:\Program Files\Eclipse Adoptium\jdk-11.0.xx-hotspot"

# Verifikasi instalasi
java -version
```

### 3. Android Studio
```bash
# Download dan install dari: https://developer.android.com/studio
# Pastikan install Android SDK dengan API 24+
```

---

## 📋 Cara Menjalankan Project

### Langkah 1: Jalankan Backend API

**Windows:**
```bash
# Double-click file ini:
start-server.bat

# ATAU jalankan di terminal:
cd d:\absen
npm install
vercel dev
```

**Linux/Mac:**
```bash
chmod +x start-server.sh
./start-server.sh
```

Server akan berjalan di: **http://localhost:3000**

**Test API:**
```bash
# Windows
test-api.bat

# Linux/Mac
curl http://localhost:3000/api/health
```

---

### Langkah 2: Setup Android Project

#### 2.1 Konfigurasi local.properties

Buka file: `android/local.properties`

Uncomment dan update baris sdk.dir:
```properties
sdk.dir=C\\:\\Users\\\\YOUR_USERNAME\\\\AppData\\\\Local\\\\Android\\\\Sdk
```

Ganti `YOUR_USERNAME` dengan username Windows Anda.

#### 2.2 Buka Project di Android Studio

1. Buka Android Studio
2. Pilih: **File → Open**
3. Pilih folder: `d:\absen\android`
4. Tunggu Gradle sync selesai

#### 2.3 Konfigurasi BASE_URL

**Untuk Local Testing (Android Emulator):**
File: `android/app/src/main/java/com/absensi/karyawan/api/RetrofitClient.kt`
```kotlin
private const val BASE_URL = "http://10.0.2.2:3000/api/"
```

**Untuk Physical Device:**
Ganti dengan IP address komputer Anda:
```kotlin
private const val BASE_URL = "http://192.168.1.X:3000/api/"
```

**Untuk Production (Vercel):**
```kotlin
private const val BASE_URL = "https://your-project.vercel.app/api/"
```

#### 2.4 Build dan Run

1. Connect Android device (USB debugging enabled)
   ATAU buat Android emulator
2. Klik tombol **Run** (▶️) di Android Studio
3. Pilih target device
4. Tunggu build selesai

---

## 🧪 Testing Manual

### Test 1: Health Check
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-04-07T...",
  "service": "Employee Attendance API"
}
```

### Test 2: Check-in
```bash
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "type": "checkin",
    "latitude": -6.2088,
    "longitude": 106.8456
  }'
```

### Test 3: Get History
```bash
curl "http://localhost:3000/api/attendance?employeeId=EMP001"
```

---

## 🐛 Troubleshooting

### Backend tidak start?
**Problem:** `command not found: vercel`
**Solution:**
```bash
npm i -g vercel
```

**Problem:** Port 3000 already in use
**Solution:**
```bash
# Kill process di port 3000
npx kill-port 3000
```

### Android build error?
**Problem:** `JAVA_HOME is not set`
**Solution:**
1. Install JDK 11+ dari adoptium.net
2. Set JAVA_HOME environment variable
3. Restart Android Studio

**Problem:** Gradle sync failed
**Solution:**
```
File → Invalidate Caches → Invalidate and Restart
```

**Problem:** SDK not found
**Solution:**
1. Buka SDK Manager di Android Studio
2. Install Android SDK Platform 34
3. Install Android SDK Build-Tools 34.0.0
4. Update `android/local.properties`

### App tidak connect ke server?
**Problem:** Connection failed di app
**Solution:**
- Pastikan backend server running
- Cek BASE_URL di RetrofitClient.kt
- Untuk emulator gunakan: `10.0.2.2:3000`
- Untuk physical device gunakan IP komputer
- Pastikan device dan komputer di network yang sama

**Problem:** Cleartext traffic not permitted
**Solution:**
Cek `AndroidManifest.xml` sudah ada:
```xml
android:usesCleartextTraffic="true"
```

---

## 📱 Cara Penggunaan Aplikasi

1. **Buka app**
   - Grant location permission saat diminta

2. **Isi data karyawan**
   - ID Karyawan: misal "EMP001"
   - Nama: nama lengkap anda

3. **Ambil lokasi**
   - Klik "Ambil Lokasi"
   - Tunggu GPS mengambil koordinat
   - Pastikan akurasi < 50 meter

4. **Check-in / Check-out**
   - Click "Check In" saat tiba
   - Click "Check Out" saat pulang

---

## 🌐 Deploy ke Production

### Deploy Backend ke Vercel:
```bash
vercel login
vercel
```

Copy deployment URL dan update di Android app.

---

## 📚 Quick Reference

| Command | Description |
|---------|-------------|
| `start-server.bat` | Start backend API |
| `test-api.bat` | Test API endpoints |
| `cd android && ./gradlew build` | Build Android APK |
| `adb install app-debug.apk` | Install APK ke device |

---

## 🆘 Butuh Bantuan?

1. Cek [QUICKSTART.md](QUICKSTART.md) untuk quick guide
2. Cek [API.md](API.md) untuk API documentation
3. Cek [README.md](README.md) untuk detail lengkap

---

**Good luck! 🚀**
