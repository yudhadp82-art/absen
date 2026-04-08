# ⚡ Supabase Quick Start - 3 Langkah

## 🎯 Setup Supabase dalam 3 Menit

### Langkah 1: Buat Project Supabase (2 menit)

1. **Buka** https://supabase.com
2. **Sign up / Login**
3. **Click "New Project"**
4. **Isi form:**
   - Name: `absensi-karyawan`
   - Password: (buat & simpan!)
   - Region: Singapore
5. **Wait 2-3 menit** untuk provisioning

---

### Langkah 2: Setup Database (30 detik)

1. **Buka SQL Editor** di Supabase Dashboard
2. **Copy** isi file `supabase/schema.sql`
3. **Paste** ke SQL Editor
4. **Click "Run"**

✅ Database schema siap!

---

### Langkah 3: Configure & Run (30 detik)

1. **Create .env file:**
   ```bash
   copy .env.example .env
   ```

2. **Get credentials:**
   - Buka: Settings → API di Supabase Dashboard
   - Copy: Project URL
   - Copy: anon/public key

3. **Edit .env:**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Start server:**
   ```bash
   start-supabase-server.bat
   ```

✅ Server running dengan Supabase!

---

## 🧪 Test Cepat

```bash
# Test health check
curl http://localhost:3000/api/health

# Test check-in
curl -X POST http://localhost:3000/api/attendance \
  -H "Content-Type: application/json" \
  -d '{"employeeId":"EMP001","employeeName":"Test","type":"checkin","latitude":-6.2088,"longitude":106.8456}'

# Atau double-click:
test-api-supabase.bat
```

---

## 📱 Run Android App

1. **Buka Android Studio**
2. **Open:** `d:\absen\android`
3. **Click Run** (▶️)

---

## 📊 View Data di Supabase

Buka Supabase Dashboard → **Table Editor** → **attendance**

---

## ✅ Done!

**Keuntungan Supabase:**
- ✅ Data persistent
- ✅ Dashboard untuk view data
- ✅ Real-time subscriptions
- ✅ Auto backups
- ✅ Scalable

---

**Panduan Lengkap:** [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

**Need help?** Check troubleshooting di guide above! 🚀
