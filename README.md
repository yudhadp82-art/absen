# Sistem Absensi Karyawan - Web + Android + Supabase

Sistem absensi karyawan dengan GPS location tracking dan database Supabase. Tersedia dalam 2 versi: **Web App (PWA)** dan **Android Native**.

## ✨ Fitur

- ✅ **Check-in / Check-out** dengan validasi GPS
- 📍 **GPS Location Tracking** dengan akurasi tinggi
- 🌐 **Web App (PWA)** - Mobile-friendly, installable, cross-platform ⭐ NEW!
- 📱 **Android Native App** (Kotlin + Jetpack Compose)
- 🗄️ **Supabase Database** - Data persistent & scalable
- 🎨 **Modern UI** dengan Material Design inspired
- 📊 **Dashboard Supabase** untuk monitoring data
- 🔐 **Row Level Security** untuk production
- 📚 **Context7 Workflow** untuk lookup dokumentasi library dari CLI, API, dan admin dashboard

## 🚀 Quick Start

### Cara 1: Web App (RECOMMENDED) ⭐

**Paling mudah - Tidak perpa install apapun!**

```bash
# 1. Setup Supabase (baca SUPABASE_QUICKSTART.md)
# 2. Start server + web app
start-web-app.bat

# 3. Open browser
http://localhost:3000
```

**Panduan Web App:** [WEB_SETUP.md](WEB_SETUP.md)

### Cara 2: Android Native App

```bash
# 1. Setup Supabase (baca SUPABASE_QUICKSTART.md)
# 2. Start server
start-supabase-server.bat

# 3. Run Android app (di Android Studio)
```

**Panduan Setup Supabase:** [SUPABASE_QUICKSTART.md](SUPABASE_QUICKSTART.md)

### Cara 2: Tanpa Database (In-Memory)

```bash
# 1. Start server
start-express-server.bat

# 2. Test API
test-api.bat

# 3. Run Android app
```

---

## 📂 Project Structure

```
absen/
├── 📁 api/                          # Backend API (Vercel Functions)
│   ├── health.js
│   └── attendance/route.js
│
├── 📁 supabase/                     # Supabase Database
│   └── schema.sql                   # Database schema
│
├── 📁 lib/
│   ├── cors.js
│   ├── context7.js
│   └── context7-service.js
│
├── 📁 scripts/
│   └── context7-cli.js
│
├── 📁 android/                      # Android Native App
│   ├── app/
│   │   ├── build.gradle.kts
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── java/com/absensi/karyawan/
│   │           ├── MainActivity.kt
│   │           ├── api/             # API service layer
│   │           ├── location/        # GPS location
│   │           ├── model/           # Data models
│   │           ├── ui/              # Compose UI
│   │           └── viewmodel/       # ViewModels
│   ├── build.gradle.kts
│   └── settings.gradle.kts
│
├── server.js                        # Express server (in-memory)
├── server-supabase.js               # Express server (Supabase) ⭐
│
├── .env.example                     # Environment variables template
├── vercel.json                      # Vercel configuration
├── package.json
│
└── 📚 Documentation/
    ├── README.md                    # This file
    ├── SUPABASE_QUICKSTART.md       # Setup Supabase (3 min)
    ├── SUPABASE_SETUP.md            # Panduan lengkap Supabase
    ├── QUICK_GUIDE.md               # Quick start guide
    ├── SETUP_GUIDE.md               # Setup guide lengkap
    ├── API.md                       # API documentation
    ├── QUICKSTART.md                # Quick start (tanpa DB)
    └── PROJECT_SUMMARY.md           # Ringkasan project
```

---

## 🎯 Fitur Backend

### Dengan Supabase ⭐

- ✅ **Persistent Storage** - Data tidak hilang
- ✅ **Dashboard Monitoring** - View data di Supabase
- ✅ **Daily Summary** - Summary per employee per day
- ✅ **Statistics** - Stats untuk check-in/check-out
- ✅ **Scalable** - Sampai jutaan records
- ✅ **Backup** - Auto backup oleh Supabase

**Endpoints:**
- `GET /api/health` - Health check
- `GET /api/attendance` - Get attendance history
- `GET /api/attendance/summary` - Get daily summary ⭐
- `GET /api/attendance/stats` - Get statistics ⭐
- `POST /api/attendance` - Submit attendance

### Tanpa Database (In-Memory)

- ⚡ **Lebih cepat** - Tidak ada database latency
- 🧪 **Cocok untuk testing** - Data reset tiap restart
- 📦 **Simple setup** - Tidak perlu database

**Endpoints:**
- `GET /api/health` - Health check
- `GET /api/attendance` - Get attendance history
- `POST /api/attendance` - Submit attendance

---

## 📱 Android App

### Tech Stack
- **Language:** Kotlin
- **UI Framework:** Jetpack Compose
- **Architecture:** MVVM
- **HTTP Client:** Retrofit2
- **Location:** Google Play Services
- **Async:** Coroutines + Flow

### Features
- GPS location tracking
- Material Design 3 UI
- Permission handling
- Error handling
- Loading states
- Offline-ready (future)

---

## 🔧 Setup Instructions

### Dengan Supabase (RECOMMENDED)

1. **Buat project Supabase:**
   - Kunjungi https://supabase.com
   - Create new project
   - Wait for provisioning (2-3 min)

2. **Setup database:**
   - Buka SQL Editor di Supabase Dashboard
   - Copy-paste isi `supabase/schema.sql`
   - Run query

3. **Configure environment:**
   ```bash
   copy .env.example .env
   ```

4. **Get credentials:**
   - Buka Settings → API di Supabase
   - Copy Project URL & anon key

5. **Edit .env:**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   CONTEXT7_API_KEY=ctx7sk-your-context7-key
   ```

6. **Start server:**
   ```bash
   start-supabase-server.bat
   ```

**Panduan lengkap:** [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

### Tanpa Database

1. **Start server:**
   ```bash
   start-express-server.bat
   ```

### Workflow Context7

Context7 sekarang terintegrasi ke repo ini dalam tiga jalur:

- `npm run context7:resolve -- --library "Next.js" --query "app router caching"` untuk cari library ID terbaik dari terminal
- `npm run context7:docs -- --library "Supabase" --query "javascript select rows"` untuk ambil dokumentasi langsung dari terminal
- `POST /api/context7` untuk admin dashboard atau tooling internal

Contoh request API:

```bash
curl -X POST http://localhost:3000/api/context7 \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "docs",
    "libraryName": "Next.js",
    "query": "server actions"
  }'
```

Payload yang didukung:

- `mode: "resolve"` butuh `libraryName` dan `query`
- `mode: "docs"` butuh `query` plus salah satu dari `libraryName` atau `libraryId`

Semua workflow Context7 membaca `CONTEXT7_API_KEY` dari environment server, jadi tidak ada API key yang diekspos ke frontend.

---

## 🚀 Deploy ke Production

### Deploy Backend ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY

# Deploy
vercel --prod
```

### Deploy Android App

1. **Build release APK:**
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

2. **Sign APK:**
   - Generate keystore
   - Sign APK dengan keystore

3. **Distribute:**
   - Upload ke Google Play Store
   - Atau distribute APK langsung

---

## 📊 API Documentation

Lihat dokumentasi lengkap di [API.md](API.md)

### Contoh Request

```bash
# Health check
curl http://localhost:3000/api/health

# Check-in
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP001",
    "employeeName": "John Doe",
    "type": "checkin",
    "latitude": -6.2088,
    "longitude": 106.8456
  }'

# Get history
curl "http://localhost:3000/api/attendance?employeeId=EMP001"
```

---

## 🛠️ Troubleshooting

### Backend Issues

**"Database connection failed"**
- Check `.env` file ada
- Check SUPABASE_URL dan SUPABASE_ANON_KEY benar

**"Port 3000 already in use"**
```bash
npx kill-port 3000
```

### Android Issues

**"Connection refused"**
- Pastikan backend server running
- Check BASE_URL di RetrofitClient.kt
- Untuk emulator gunakan: `10.0.2.2:3000`
- Untuk physical device gunakan IP komputer

**"JAVA_HOME not set"**
- Install JDK 11+
- Set JAVA_HOME environment variable

---

## 📚 Documentation

| File | Deskripsi |
|------|-----------|
| [SUPABASE_QUICKSTART.md](SUPABASE_QUICKSTART.md) | ⭐ Setup Supabase (3 min) |
| [SUPABASE_SETUP.md](SUPABASE_SETUP.md) | Panduan lengkap Supabase |
| [API.md](API.md) | API documentation |
| [QUICK_GUIDE.md](QUICK_GUIDE.md) | Quick start guide |
| [SETUP_GUIDE.md](SETUP_GUIDE.md) | Setup guide lengkap |
| [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) | Ringkasan project |

---

## 🎯 Roadmap

- [ ] Authentication (JWT/OAuth)
- [ ] Geofencing validation
- [ ] Admin dashboard
- [ ] Export ke Excel/PDF
- [ ] Photo capture
- [ ] Offline mode
- [ ] Push notifications
- [ ] Biometric auth
- [ ] Multi-language

---

## 📄 License

MIT License - feel free to use for learning or production.

---

## 🆘 Support

Jika ada pertanyaan atau issues:
1. Cek [SUPABASE_SETUP.md](SUPABASE_SETUP.md) untuk setup Supabase
2. Cek [API.md](API.md) untuk API documentation
3. Buka issue di GitHub repository

---

**Made with ❤️ using Android, Kotlin, and Supabase**
