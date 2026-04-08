# Quick Start Guide - Panduan Cepat Memulai

## 🚀 3 Langkah Mulai Menggunakan Sistem Absensi

### Langkah 1: Deploy Backend ke Vercel (5 menit)

```bash
# Install Vercel CLI
npm i -g vercel

# Login ke Vercel
vercel login

# Deploy project
cd d:\absen
vercel

# Ikuti prompt di terminal
```

**Copy URL deployment** dari Vercel, misal:
```
https://absensi-karyawan-xyz.vercel.app
```

---

### Langkah 2: Update API URL di Android (1 menit)

Buka file ini di Android Studio:
```
android/app/src/main/java/com/absensi/karyawan/api/RetrofitClient.kt
```

Update baris 13:
```kotlin
// Ganti dengan URL Vercel Anda
private const val BASE_URL = "https://absensi-karyawan-xyz.vercel.app/api/"
```

---

### Langkah 3: Build dan Run Android App (10 menit)

#### Di Android Studio:

1. **Buka project**
   ```
   File → Open → pilih folder d:\absen\android
   ```

2. **Wait for Gradle sync** (tunggu hingga selesai)

3. **Connect device**
   - Hubungkan Android phone via USB (enable USB debugging)
   - ATAU gunakan emulator

4. **Klik Run button** (▶️) atau tekan `Shift + F10`

5. **Grant permission** saat app meminta izin lokasi

---

## ✅ Cara Menggunakan

### 1. Isi Data Diri
- **ID Karyawan**: EMP001 (atau ID lain)
- **Nama Karyawan**: Nama lengkap anda

### 2. Ambil Lokasi
- Klik tombol **"Ambil Lokasi"**
- Tunggu hingga koordinat muncul
- Pastikan akurasi di bawah 50 meter

### 3. Check-In
- Klik tombol **"Check In"** saat tiba di kantor
- Tunggu konfirmasi sukses

### 4. Check-Out
- Klik tombol **"Check Out"** saat pulang
- Tunggu konfirmasi sukses

---

## 🔧 Troubleshooting

### Problem: "Gagal mengambil lokasi"
**Solusi:**
- Pastikan GPS aktif
- Pergi ke outdoor (GPS tidak akurat di indoor)
- Close app dan buka lagi

### Problem: "Connection failed"
**Solusi:**
- Cek internet connection
- Pastikan BASE_URL sudah benar di RetrofitClient.kt
- Test API dengan curl:
  ```bash
  curl https://your-project.vercel.app/api/health
  ```

### Problem: Android build error
**Solusi:**
```bash
# Di Android Studio terminal
cd android
./gradlew clean
./gradlew build
```

Atau:
```
File → Invalidate Caches → Invalidate and Restart
```

---

## 📱 Minimum Requirements

### Android Device:
- **OS**: Android 7.0 (API 24) atau lebih baru
- **RAM**: 2GB atau lebih
- **GPS**: Wajib
- **Internet**: WiFi atau Mobile Data

### Development Machine:
- **Android Studio**: Hedgehog (2023.1.1) atau lebih baru
- **JDK**: 11 atau lebih baru
- **RAM**: 8GB atau lebih recommended

---

## 🎯 Next Steps

Setelah berhasil running:

1. **Test Check-in**
   - Coba check-in dari lokasi berbeda
   - Pastikan data tersimpan di server

2. **Test Check-out**
   - Check-out beberapa jam setelah check-in

3. **View History** (coming soon)
   - Lihat riwayat absensi

4. **Customize**
   - Ganti warna di `Color.kt`
   - Tambah logo perusahaan
   - Tambah validasi radius kantor

---

## 📚 Dokumentasi Lengkap

- [API Documentation](API.md) - API endpoints dan examples
- [README.md](README.md) - Dokumentasi lengkap project

---

## 💡 Tips

### Untuk Production:
1. Ganti in-memory storage dengan database nyata
2. Tambahkan authentication
3. Implement geofencing untuk validasi radius kantor
4. Tambah SSL certificate pinning
5. Gunakan environment variables untuk sensitive data

### Untuk Development:
1. Gunakan [Vercel CLI](https://vercel.com/docs/cli) untuk local development
2. Test di multiple device dengan ukuran layar berbeda
3. Monitor Vercel logs untuk debugging API

---

**Selamat menggunakan Sistem Absensi Karyawan! 🎉**

Jika ada pertanyaan, buka issue di GitHub repository.
