# 🗄️ Setup Database Supabase

## Masalah
Tabel database belum ada di Supabase. Perlu menjalankan SQL schema.

## ✨ Solusi

### Langkah 1: Buka Supabase SQL Editor

1. **Buka Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/wjtjlwlxygwwrfxbfqmi
   ```

2. **Navigate ke SQL Editor:**
   - Click menu "SQL Editor" di sidebar kiri
   - Click "New Query"

### Langkah 2: Copy & Paste Schema

1. **Buka file schema:**
   ```
   d:\absen\supabase\schema-with-employees.sql
   ```

2. **Copy semua isi file** (Ctrl+A, Ctrl+C)

3. **Paste ke SQL Editor** (Ctrl+V)

### Langkah 3: Jalankan Query

1. **Click tombol "Run"** atau **"▶️"** di pojok kanan atas
2. **Tunggu proses selesai** (biasanya 1-2 detik)
3. **Pastikan tidak ada error** (hijau ✓)

### Langkah 4: Verify Setup

**Cek apakah tabel sudah dibuat:**

Di SQL Editor, jalankan:

```sql
-- Cek tabel employees
SELECT COUNT(*) FROM employees;

-- Cek tabel attendance
SELECT COUNT(*) FROM attendance;

-- Harus menampilkan 0 rows (karena belum ada data)
```

**Jika error "table does not exist", ulangi Langkah 2-3**

---

## 📊 Apa yang Dibuat oleh Schema?

### 1. Tabel `employees`
```sql
- id (UUID, primary key)
- employee_id (VARCHAR 50, unique)
- employee_name (VARCHAR 255)
- email (VARCHAR 255)
- department (VARCHAR 255)
- position (VARCHAR 255)
- phone (VARCHAR 50)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### 2. Tabel `attendance`
```sql
- id (UUID, primary key)
- employee_id (VARCHAR 50)
- employee_name (VARCHAR 255)
- type (VARCHAR 20: checkin/checkout)
- latitude (DECIMAL 10,8)
- longitude (DECIMAL 11,8)
- accuracy (FLOAT)
- address (TEXT)
- device_id (VARCHAR 255)
- created_at (TIMESTAMP)
```

### 3. Indexes (untuk performance)
- Index pada employee_id, email, is_active
- Index pada attendance employee_id, created_at

### 4. View `daily_attendance_summary`
- View untuk menggabungkan attendance dan employees

### 5. Sample Data (10 Karyawan)
Schema akan otomatis insert 10 sample employees:
- EMP001 - EMP010
- Berbagai departemen: IT, HR, Finance, Marketing, dll

---

## 🧪 Test Setup

Setelah schema dijalankan, test API:

```bash
# Test stats endpoint
curl https://absen-brown.vercel.app/api/attendance/stats

# Harus return:
{
  "success": true,
  "data": {
    "today": {
      "totalEmployees": 10,
      "checkins": 0,
      ...
    }
  }
}
```

**Jika masih error "table does not exist":**
- Pastikan SQL di-run dengan benar
- Check SQL Editor history untuk memastikan query berhasil
- Coba refresh Supabase dashboard

---

## 🔧 Troubleshooting

### Error: "relation does not exist"

**Artinya:** Tabel belum dibuat atau SQL error

**Solusi:**
1. Buka SQL Editor
2. Check "History" tab untuk melihat query yang sudah dijalankan
3. Pastikan tidak ada error message
4. Jika ada error, fix dan re-run SQL

### Error: "permission denied"

**Artinya:** RLS (Row Level Security) memblokir akses

**Solusi:**
```sql
-- Matikan RLS sementara untuk testing
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
```

### Sample data tidak muncul

**Solusi:**
```sql
-- Insert sample data manual
INSERT INTO employees (employee_id, employee_name, department, position)
VALUES
  ('EMP001', 'Test User', 'IT', 'Developer');
```

---

## 📱 Langkah Selanjutnya

Setelah database setup:

1. ✅ **Refresh dashboard** di https://admin-dun-alpha.vercel.app
2. ✅ **Cek statistik** - harusnya menampilkan 10 karyawan
3. ✅ **Test absensi** di https://absen-brown.vercel.app
4. ✅ **Verify data sync** antara kedua aplikasi

---

## 🎯 Hasil Akhir

Setelah setup selesai:
- ✅ Database Supabase siap dengan 10 sample karyawan
- ✅ API bisa connect ke database
- ✅ Dashboard menampilkan statistik dengan benar
- ✅ Aplikasi absensi berfungsi penuh

---

**📝 File Schema:** `supabase/schema-with-employees.sql`

**🔗 Supabase Dashboard:** https://supabase.com/dashboard/project/wjtjlwlxygwwrfxbfqmi

**🚀 Setelah setup, refresh dashboard untuk melihat data!**
