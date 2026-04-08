# 🔧 Supabase Setup Guide

Panduan lengkap setup Supabase database untuk Sistem Absensi Karyawan.

---

## 📋 Prerequisites

- Akun Supabase (gratis di https://supabase.com)
- Project sudah dibuat di Supabase

---

## 🚀 Langkah 1: Buat Project Supabase

### 1. Sign Up / Login

Kunjungi: https://supabase.com

### 2. Create New Project

1. Klik **"New Project"**
2. Isi form:
   - **Name**: `absensi-karyawan`
   - **Database Password**: (buat password yang kuat, simpan baik-baik!)
   - **Region**: Pilih region terdekat (Singapore untuk Indonesia)
3. Klik **"Create new project"**
4. Tunggu 2-3 menit untuk provisioning

---

## 📊 Langkah 2: Setup Database Schema

### 1. Buka SQL Editor

Di Supabase Dashboard:
```
SQL Editor → New Query
```

### 2. Copy & Paste Schema

Copy isi file `supabase/schema.sql` dan paste ke SQL Editor.

### 3. Run Schema

Klik **"Run"** atau tekan `Ctrl + Enter`

**Expected output:**
```
Success. No rows returned (took 123ms)
```

### 4. Verify Tables

Cek di **Table Editor**, seharusnya ada:
- ✅ `attendance` table
- ✅ `employees` table (opsional)
- ✅ `daily_attendance_summary` view

---

## 🔑 Langkah 3: Dapatkan API Credentials

### 1. Buka API Settings

Di Supabase Dashboard:
```
Settings → API
```

### 2. Copy Credentials

Anda akan melihat:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Simpan Credentials

Copy kedua nilai ini untuk langkah berikutnya.

---

## ⚙️ Langkah 4: Setup Environment Variables

### 1. Create .env File

Di root project (`d:\absen`), buat file `.env`:

```bash
# Copy dari example
copy .env.example .env
```

### 2. Edit .env File

Buka `.env` dan isi dengan credentials Anda:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
PORT=3000
```

**Ganti:**
- `your-project.supabase.co` dengan Project URL dari Supabase
- `your-anon-key-here` dengan anon/public key dari Supabase

### 3. Simpan File

**⚠️ PENTING:** Jangan share `.env` file ini! File ini sudah di .gitignore.

---

## 🧪 Langkah 5: Test Backend Server

### 1. Install Dependencies

```bash
cd d:\absen
npm install
```

### 2. Start Server

```bash
npm start
```

**Expected output:**
```
========================================
🚀 Backend API Server is Running!
========================================
📍 URL: http://localhost:3000
🗄️  Database: Supabase

✨ Server ready dengan Supabase database!
========================================
```

### 3. Test Health Check

Di terminal lain:

```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "ok",
  "timestamp": "2026-04-07T...",
  "service": "Employee Attendance API",
  "version": "2.0.0",
  "database": "Supabase connected"
}
```

### 4. Test Check-in

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

### 5. Verify di Supabase

Kembali ke Supabase Dashboard:
```
Table Editor → attendance
```

Seharusnya ada record baru!

---

## 📱 Langkah 6: Update Android App

### 1. Buka Android Project

```
Android Studio → Open → d:\absen\android
```

### 2. Verify BASE_URL

File: `android/app/src/main/java/com/absensi/karyawan/api/RetrofitClient.kt`

**Untuk Emulator:**
```kotlin
private const val BASE_URL = "http://10.0.2.2:3000/api/"
```

**Untuk Physical Device:**
```kotlin
private const val BASE_URL = "http://192.168.1.X:3000/api/"
```

### 3. Build & Run

Click **Run** (▶️) di Android Studio

---

## 🎯 Langkah 7: Test End-to-End

### 1. Di Android App:
- Input ID: `EMP001`
- Input Nama: `John Doe`
- Click "Ambil Lokasi"
- Click "Check In"

### 2. Verify di Supabase Dashboard:

```
Table Editor → attendance
```

Seharusnya ada record dengan:
- employee_id: `EMP001`
- employee_name: `John Doe`
- type: `checkin`
- latitude & longitude terisi

---

## 📊 Supabase Dashboard Features

Setelah setup, Anda bisa:

### 1. View Data
```
Table Editor → attendance
```

### 2. Run Queries
```
SQL Editor → New Query
```

Contoh query:
```sql
-- Lihat semua check-in hari ini
SELECT * FROM attendance
WHERE DATE(created_at) = CURRENT_DATE
  AND type = 'checkin'
ORDER BY created_at DESC;

-- Lihat summary per employee
SELECT * FROM daily_attendance_summary
ORDER BY attendance_date DESC;
```

### 3. View Logs
```
Logs → Database
```

### 4. Monitor Usage
```
Settings → Billing
```

---

## 🔐 Security Best Practices

### 1. Row Level Security (RLS)

Schema sudah mengaktifkan RLS. Untuk production, implement proper auth:

```sql
-- Example: Only allow users to see their own records
CREATE POLICY "Users can view own records"
    ON attendance
    FOR SELECT
    TO authenticated
    USING (auth.uid()::text = employee_id);
```

### 2. API Keys

- **Anon Key**: Untuk public access (seperti sekarang)
- **Service Role Key**: Untuk admin operations (JANGAN dipakai di client!)

### 3. Environment Variables

Selalu gunakan environment variables untuk sensitive data:

```env
# ✅ BENAR
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-key

# ❌ SALAH - JANGAN hardcode!
const supabaseUrl = 'https://your-project.supabase.co'
```

---

## 🌐 Deploy ke Production

### Deploy Backend ke Vercel:

```bash
# Set environment variables di Vercel
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY

# Deploy
vercel --prod
```

Atau via Vercel Dashboard:
```
Project → Settings → Environment Variables
```

---

## 📚 Additional Endpoints

Dengan Supabase, sekarang ada extra endpoints:

### Get Daily Summary
```bash
curl "http://localhost:3000/api/attendance/summary"
```

### Get Statistics
```bash
curl "http://localhost:3000/api/attendance/stats"
```

---

## 🐛 Troubleshooting

### "Database connection failed"

**Problem:** Salah SUPABASE_URL atau SUPABASE_ANON_KEY

**Solution:**
1. Cek credentials di Supabase Dashboard
2. Pastikan `.env` file sudah benar
3. Restart server: `npm start`

### "Permission denied"

**Problem:** RLS policies terlalu ketat

**Solution:**
1. Buka Supabase Dashboard → Authentication → Policies
2. Cek policies untuk `attendance` table
3. Pastikan "Allow public select" dan "Allow public insert" aktif

### "Table not found"

**Problem:** Schema belum di-run

**Solution:**
1. Buka SQL Editor di Supabase Dashboard
2. Copy-paste isi `supabase/schema.sql`
3. Run query

---

## ✅ Checklist

Sebelum mulai menggunakan:

- [ ] Supabase project sudah dibuat
- [ ] Database schema sudah di-run
- [ ] `.env` file sudah dibuat dan diisi
- [ ] Backend server running dengan `npm start`
- [ ] Health check endpoint berhasil
- [ ] Test check-in berhasil
- [ ] Data muncul di Supabase Dashboard
- [ ] Android app terhubung ke backend

---

## 🎉 Selamat!

Sistem absensi Anda sekarang menggunakan **Supabase database**!

**Keuntungan:**
- ✅ Data persistent (tidak hilang saat server restart)
- ✅ Bisa view di Supabase Dashboard
- ✅ Real-time subscriptions (coming soon)
- ✅ Backup otomatis oleh Supabase
- ✅ Scalable sampai jutaan records

---

**Next Steps:**
- Baca [API.md](API.md) untuk dokumentasi API lengkap
- Explore Supabase Dashboard untuk monitoring
- Implement authentication untuk production

Butuh bantuan? Cek [README.md](README.md) atau buka issue di GitHub! 🚀
