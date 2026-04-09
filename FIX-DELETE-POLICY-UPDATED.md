# 🔧 Perbaikan Tombol Hapus Karyawan - Update

## ✅ **MASALAH SQL SYNTAX TELAH DIPERBAIKI**

Error yang Anda temukan telah diperbaiki. Gunakan script SQL yang lebih sederhana di bawah ini.

---

## 🚀 **SOLUSI CEPAT (Gunakan Script Ini):**

### **Opsi 1: Fix DELETE Policy (Wajib untuk tombol hapus)**

Buka [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor** → Jalankan:

```sql
-- Simple DELETE Policy Fix
DROP POLICY IF EXISTS "Allow public delete employees" ON employees;
CREATE POLICY "Allow public delete employees"
    ON employees
    FOR DELETE
    TO public
    USING (true);

-- Verify the policy was created
SELECT
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'employees'
AND policyname = 'Allow public delete employees';
```

**Atau jalankan file:** `supabase/simple-delete-policy-fix.sql`

---

### **Opsi 2: Hapus Semua Data Karyawan**

**⚠️ PERINGATAN: Ini akan menghapus SEMUA data karyawan!**

Jalankan script ini di Supabase SQL Editor:

```sql
-- Delete all employees
DELETE FROM employees;

-- Verify deletion
SELECT COUNT(*) as remaining_employees FROM employees;
SELECT 'All employees deleted successfully' as status;
```

**Atau jalankan file:** `supabase/delete-all-employees-simple.sql`

---

## 🔍 **Penjelasan Error:**

**Error Original:**
```
ERROR: 42601: syntax error at or near "NOT"
LINE 2: CREATE POLICY IF NOT EXISTS "Allow public delete employees"
```

**Penyebab:**
- PostgreSQL di Supabase tidak mendukung `IF NOT EXISTS` untuk `CREATE POLICY`
- Syntax `CREATE POLICY IF NOT EXISTS` tidak valid

**Solusi:**
- Gunakan `DROP POLICY IF EXISTS` terlebih dahulu
- Kemudian gunakan `CREATE POLICY` normal

---

## 📋 **Langkah-langkah Lengkap:**

### **Langkah 1: Fix DELETE Policy (Wajib)**

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Masuk ke menu **SQL Editor**
4. Copy dan paste script di atas (Opsi 1)
5. Klik **Run**
6. Pastikan tidak ada error

### **Langkah 2: Verifikasi Policy**

Setelah menjalankan script, Anda harus melihat hasil seperti ini:

```
 schemaname | tablename | policyname                      | cmd
------------+-----------+---------------------------------+------
 public     | employees | Allow public delete employees    | d
```

### **Langkah 3: Test Tombol Hapus**

1. Buka Admin Dashboard: https://admin-dun-alpha.vercel.app
2. Masuk ke menu **Karyawan**
3. Coba hapus salah satu karyawan
4. Tombol hapus sekarang harus berfungsi! ✅

---

## 🗑️ **Jika Ingin Menghapus Semua Data:**

**Backup terlebih dahulu (opsional tapi disarankan):**

```sql
-- Backup data
CREATE TABLE employees_backup AS SELECT * FROM employees;
SELECT 'Backup created' as status;
```

**Kemudian hapus semua data:**

```sql
-- Hapus semua karyawan
DELETE FROM employees;

-- Cek hasilnya
SELECT COUNT(*) as remaining_employees FROM employees;
```

**Jika ingin restore:**

```sql
-- Restore dari backup
INSERT INTO employees SELECT * FROM employees_backup;

-- Hapus backup table
DROP TABLE employees_backup;
```

---

## 📄 **Files yang Diperbarui:**

✅ **Script SQL yang sudah diperbaiki:**
- [supabase/simple-delete-policy-fix.sql](supabase/simple-delete-policy-fix.sql) - Script fix DELETE policy yang benar
- [supabase/delete-all-employees-simple.sql](supabase/delete-all-employees-simple.sql) - Script hapus semua data yang benar
- [supabase/fix-delete-policy.sql](supabase/fix-delete-policy.sql) - Script fix yang diperbarui
- [supabase/schema.sql](supabase/schema.sql) - Schema yang diperbarui
- [supabase/schema-with-employees.sql](supabase/schema-with-employees.sql) - Schema yang diperbarui

❌ **Files lama (jangan gunakan):**
- `supabase/delete-all-employees.sql` - Ada syntax error

---

## 🐛 **Troubleshooting:**

### **Masih ada error?**

1. **Cek syntax SQL** - Pastikan script disalin dengan benar
2. **Cek tab SQL** - Pastikan Anda di tab "SQL Editor", bukan "Table Editor"
3. **Cek connection** - Pastikan database online dan bisa diakses
4. **Cek permissions** - Pastikan Anda memiliki permissions yang cukup

### **Policy tidak terbuat?**

1. Cek apakah ada error di tab Results
2. Cek apakah script berjalan sampai selesai
3. Cek apakah RLS sudah diaktifkan: `SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'employees';`

---

## 🎯 **Summary:**

✅ **Syntax error telah diperbaiki**
✅ **Script SQL yang benar disediakan**
✅ **Langkah-langkah yang jelas**
✅ **Ready untuk dijalankan di Supabase**

**Gunakan script SQL yang baru ini** - semuanya sudah diperbaiki dan siap digunakan!

---

**PENTING:** Script SQL yang lama memiliki syntax error. Gunakan script yang baru di file `simple-delete-policy-fix.sql` atau `delete-all-employees-simple.sql`.