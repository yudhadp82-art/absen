# 🐛 Fix Tombol Hapus Karyawan

## Masalah
Tombol hapus karyawan tidak berfungsi karena **Missing DELETE Policy** di tabel employees pada database Supabase.

## Solusi

### Langkah 1: Jalankan Script SQL di Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Pilih project Anda
3. Masuk ke menu **SQL Editor**
4. Buat query baru dan jalankan script berikut:

```sql
-- Fix Missing DELETE Policy for Employees Table
CREATE POLICY IF NOT EXISTS "Allow public delete employees"
    ON employees
    FOR DELETE
    TO public
    USING (true);

-- Verify the policy was created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'employees'
ORDER BY policyname;
```

Atau jalankan file: `supabase/fix-delete-policy.sql`

### Langkah 2: Verifikasi Policy

Setelah menjalankan script, Anda akan melihat hasil seperti ini:

```
 schemaname | tablename | policyname                      | permissive | roles | cmd  | qual | with_check
------------+-----------+---------------------------------+------------+-------+------+------------
 public     | employees | Allow public delete employees    | t          | {}    | d    | (true)
 public     | employees | Allow public insert employees    | t          | {}    | i    | (true)
 public     | employees | Allow public select employees    | t          | {}    | r    | (true)
 public     | employees | Allow public update employees    | t          | {}    | {}   | (true)
```

Pastikan Anda melihat policy `Allow public delete employees` dengan `cmd = d` (delete).

### Langkah 3: Test Fungsi Hapus

1. Buka Admin Dashboard: https://admin-dun-alpha.vercel.app
2. Masuk ke menu **Karyawan**
3. Coba hapus salah satu karyawan
4. Klik tombol **🗑️ Hapus**
5. Konfirmasi dialog
6. Data karyawan seharusnya berhasil dihapus

## Penjelasan Teknis

### Apa yang menyebabkan masalah ini?

1. **Row Level Security (RLS) diaktifkan** pada tabel `employees`
2. **Policy DELETE tidak ada** sehingga operasi hapus diblokir oleh RLS
3. API mengembalikan error namun tidak ditampilkan ke user

### Perbaikan yang dilakukan:

1. ✅ **Tambah DELETE Policy** ke schema database
2. ✅ **Improvisi error handling** di API endpoint
3. ✅ **Tambah logging** untuk debugging
4. ✅ **Tambah validasi** sebelum operasi hapus
5. ✅ **Fix file schema** untuk deployment berikutnya

### Files yang diupdate:

- `supabase/schema.sql` - Tambah DELETE policy
- `supabase/schema-with-employees.sql` - Tambah DELETE policy  
- `supabase/fix-delete-policy.sql` - Script fix khusus
- `api/employees.js` - Improvisi error handling dan logging

## Troubleshooting

### Masih gagal menghapus setelah fix?

1. **Cek browser console** untuk error messages:
   - Buka Developer Tools (F12)
   - Tab Console
   - Cari error messages

2. **Cek network requests**:
   - Tab Network
   - Cari request DELETE ke `/api/employees?id=XXX`
   - Cek response status dan body

3. **Verifikasi policy di Supabase**:
   - Pastikan policy `Allow public delete employees` ada
   - Cek jika ada error di SQL Editor

4. **Cek environment variables**:
   - `SUPABASE_URL` harus di-set di Vercel
   - `SUPABASE_ANON_KEY` harus di-set di Vercel

### Error Common:

**Error: "Employee not found"**
- Employee ID tidak valid atau sudah dihapus

**Error: "Failed to delete employee"**
- Policy DELETE belum dijalankan di Supabase
- Jalankan script SQL di atas

**Error: "Internal Server Error"**
- Cek environment variables di Vercel
- Cek Supabase credentials

## Deployment

Setelah fix diterapkan di database:

1. **Code sudah auto-deploy** ke Vercel ✅
2. **Restart tidak diperlukan** untuk API changes
3. **Database changes** perlu dijalankan manual via Supabase SQL Editor

## Status

- ✅ Code fix completed
- ⏳ Database fix perlu dijalankan manual
- 🔄 Ready for testing

---

**Catatan:** Ini adalah issue security policy di database, bukan di code. Pastikan untuk menjalankan script SQL di Supabase Dashboard untuk mengaktifkan fungsi hapus.