# ⚙️ Setup Supabase Environment Variables

## Masalah
Dashboard menampilkan 0 untuk semua statistik karena environment variables Supabase belum diset.

## Solusi

### Langkah 1: Dapatkan Supabase Credentials

1. **Buka Supabase Dashboard:**
   ```
   https://supabase.com/dashboard
   ```

2. **Pilih Project** Anda

3. **Go to Settings → API**

4. **Copy dua nilai berikut:**
   - **Project URL** → ini adalah `SUPABASE_URL`
   - **anon public** key → ini adalah `SUPABASE_ANON_KEY`

### Langkah 2: Tambah ke Main App (absen)

**Option A: Menggunakan Vercel Dashboard (Rekomendasi)**

1. Buka: https://vercel.com/yudhadp82s-projects/absen/settings/environment-variables
2. Click "Add New"
3. Tambahkan dua variables:
   - **Key:** `SUPABASE_URL`
   - **Value:** [paste dari Supabase]
   - Environment: **Production, Preview, Development**

4. Click "Save"

5. Ulangi untuk:
   - **Key:** `SUPABASE_ANON_KEY`
   - **Value:** [paste dari Supabase]
   - Environment: **Production, Preview, Development**

**Option B: Menggunakan Vercel CLI**

```bash
# Tambah SUPABASE_URL
vercel env add SUPABASE_URL --scope yudhadp82s-projects

# Paste URL ketika diminta
# Pilih environment: Production, Preview, Development

# Tambah SUPABASE_ANON_KEY
vercel env add SUPABASE_ANON_KEY --scope yudhadp82s-projects

# Paste Anon Key ketika diminta
# Pilih environment: Production, Preview, Development
```

### Langkah 3: Tambah ke Admin Dashboard

**Option A: Vercel Dashboard**

1. Buka: https://vercel.com/yudhadp82s-projects/admin/settings/environment-variables
2. Same steps as above

**Option B: Vercel CLI**

```bash
cd admin/admin

# Tambah SUPABASE_URL
vercel env add SUPABASE_URL --scope yudhadp82s-projects

# Tambah SUPABASE_ANON_KEY
vercel env add SUPABASE_ANON_KEY --scope yudhadp82s-projects
```

### Langkah 4: Redeploy Kedua Project

```bash
# Deploy main app
cd /d/absen
vercel --prod --scope yudhadp82s-projects

# Deploy admin dashboard
cd admin/admin
vercel --prod --scope yudhadp82s-projects
```

---

## 🧪 Test Setup

Setelah redeploy, test dengan:

```bash
# Test stats endpoint
curl https://absen-brown.vercel.app/api/attendance/stats

# Harus return JSON dengan statistics, bukan error
```

---

## Contoh Environment Variables

```
SUPABASE_URL=https://xxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Troubleshooting

### Masih error "Supabase credentials not configured"?

1. Check environment variables di Vercel Dashboard
2. Pastikan ada di **Production** environment
3. Redeploy setelah menambah env vars

### Dashboard masih menampilkan 0?

1. Pastikan database schema sudah di-run:
   - Buka Supabase Dashboard → SQL Editor
   - Run `supabase/schema-with-employees.sql`

2. Check apakah ada data di database:
   ```sql
   SELECT COUNT(*) FROM employees;
   SELECT COUNT(*) FROM attendance;
   ```

3. Check API logs di Vercel Dashboard

---

## URLs Penting

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Main App Env Vars:** https://vercel.com/yudhadp82s-projects/absen/settings/environment-variables
- **Admin App Env Vars:** https://vercel.com/yudhadp82s-projects/admin/settings/environment-variables
- **Main App:** https://absen-brown.vercel.app
- **Admin Dashboard:** https://admin-dun-alpha.vercel.app

---

**📝 Catatan:** Environment variables harus diset untuk **kedua** project (absen dan admin) agar kedua aplikasi bisa connect ke database yang sama.
