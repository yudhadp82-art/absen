# ⚡ 3 Langkah Selesaikan Deployment

## 🎉 Deployment Berhasil!

**Production URL:** https://absen-brown.vercel.app

---

## ⚠️ WAJIB: Setup Environment Variables (3 Menit)

### Langkah 1: Buka Vercel Environment Variables

**Klik link ini:**
```
https://vercel.com/yudhadp82s-projects/absen/settings/environment-variables
```

### Langkah 2: Get Supabase Credentials

1. **Buka Supabase:** https://supabase.com/dashboard
2. **Pilih project** Anda
3. **Settings → API**
4. **Copy 2 nilai ini:**
   - `Project URL`
   - `anon public` key

### Langkah 3: Add Environment Variables di Vercel

Di Vercel Environment Variables page, klik **"Add New"**:

**Variable 1: SUPABASE_URL**
```
Name: SUPABASE_URL
Value: https://xxxxxxxxxxxxx.supabase.co (paste dari Supabase)
Environments: ✅ Production ✅ Preview ✅ Development
```
Klik **Save**

**Variable 2: SUPABASE_ANON_KEY**
```
Name: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (paste dari Supabase)
Environments: ✅ Production ✅ Preview ✅ Development
```
Klik **Save**

### Langkah 4: Redeploy

Di terminal:
```bash
vercel deploy --prod --scope yudhadp82s-projects
```

---

## 🌐 Akses Web App

Setelah setup environment variables dan redeploy:

**URL:** https://absen-brown.vercel.app

**Test:**
1. Buka URL di browser
2. Grant location permission
3. Isi ID & Nama karyawan
4. Click "Ambil Lokasi"
5. Click "Check In"

---

## 📱 Install sebagai App (PWA)

### Di Android Phone:

1. Buka Chrome
2. Go to: https://absen-brown.vercel.app
3. Click menu (3 dots top right)
4. Select "Add to Home Screen" atau "Install App"
5. App akan muncul di home screen! 📱

### Di Desktop:

1. Open Chrome/Edge
2. Click install icon (⊕) in address bar
3. Click "Install"

---

## ✅ Checklist

- [ ] Setup Supabase project (belum? baca SUPABASE_QUICKSTART.md)
- [ ] Add SUPABASE_URL di Vercel Dashboard
- [ ] Add SUPABASE_ANON_KEY di Vercel Dashboard
- [ ] Redeploy dengan `vercel deploy --prod`
- [ ] Test web app di browser
- [ ] Install sebagai PWA di mobile

---

## 📚 Quick Links

- **Web App:** https://absen-brown.vercel.app
- **Vercel Dashboard:** https://vercel.com/yudhadp82s-projects/absen
- **Environment Variables:** https://vercel.com/yudhadp82s-projects/absen/settings/environment-variables
- **Deployments:** https://vercel.com/yudhadp82s-projects/absen/deployments

---

## 🆘 Butuh Bantuan?

**Environment Variables:**
- Baca [DEPLOYMENT_SUCCESS.md](DEPLOYMENT_SUCCESS.md)

**Supabase Setup:**
- Baca [SUPABASE_QUICKSTART.md](SUPABASE_QUICKSTART.md)

**Web App Guide:**
- Baca [WEB_SETUP.md](WEB_SETUP.md)

---

**🎉 Deployment Selesai! Sekarang setup environment variables dan web app siap digunakan!**
