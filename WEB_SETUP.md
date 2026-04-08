# 🌐 Web-based Mobile App - Setup Guide

Panduan setup Progressive Web App (PWA) untuk Sistem Absensi Karyawan.

---

## ✨ Fitur Web App

- ✅ **Mobile-friendly** - Responsive design untuk semua device
- ✅ **PWA Support** - Bisa di-install seperti native app
- ✅ **GPS Location** - Geolocation API untuk tracking
- ✅ **Offline Ready** - Service worker untuk caching
- ✅ **Modern UI** - Material Design inspired
- ✅ **Cross-platform** - Jalan di browser manapun
- ✅ **No Build Required** - Pure HTML/CSS/JavaScript

---

## 🚀 Quick Start (2 Langkah)

### Langkah 1: Start Backend

```bash
# Dengan Supabase (RECOMMENDED)
start-supabase-server.bat

# Atau tanpa database
start-express-server.bat
```

### Langkah 2: Open Web App

**Cara 1: Direct File**
```
Double-click: web/index.html
```

**Cara 2: Local Server (RECOMMENDED)**
```bash
# Di folder d:\absen
# Install simple HTTP server
npm install -g http-server

# Run server
http-server ./web -p 8080

# Buka browser:
http://localhost:8080
```

**Cara 3: VS Code Live Server**
```
1. Install "Live Server" extension di VS Code
2. Right-click index.html
3. Select "Open with Live Server"
```

---

## 📱 Install sebagai PWA

### Di Android (Chrome):

1. **Buka app** di Chrome
2. **Wait** untuk install banner
3. **Click "Add to Home Screen"** atau "Install App"
4. **Confirm** install

### Di Desktop (Chrome/Edge):

1. **Buka app**
2. **Click icon install** di address bar
3. **Click "Install"**
4. **Confirm** install

---

## 🌐 Deploy ke Production

### Option 1: Vercel (RECOMMENDED)

```bash
# Deploy ke Vercel
vercel

# Set domain
vercel domains add absensi.yourdomain.com
```

### Option 2: Netlify

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=web
```

### Option 3: GitHub Pages

1. Push ke GitHub repository
2. Settings → Pages
3. Source: Deploy from branch
4. Branch: main, folder: /web

---

## ⚙️ Configuration

### Update API Base URL

File: `web/js/config.js`

```javascript
const CONFIG = {
    // Untuk local development
    API_BASE_URL: 'http://localhost:3000/api',

    // Untuk production (ganti dengan URL Anda)
    // API_BASE_URL: 'https://your-project.vercel.app/api',
};
```

---

## 🧪 Testing

### Test GPS Location

1. **Open web app**
2. **Click "Ambil Lokasi"**
3. **Grant location permission**
4. **View coordinates**

### Test Check-in/Check-out

1. **Fill employee info**
2. **Click "Ambil Lokasi"**
3. **Click "Check In"**
4. **Verify di Supabase Dashboard**

---

## 📊 File Structure

```
web/
├── index.html              # Main HTML
├── manifest.json          # PWA manifest
├── css/
│   └── style.css          # Styles
├── js/
│   ├── config.js          # Configuration
│   ├── storage.js         # Local storage
│   ├── location.js        # GPS location
│   ├── api.js             # API communication
│   └── app.js             # Main app logic
└── icons/                 # PWA icons (need to add)
```

---

## 🎨 Customization

### Ubah Warna Theme

File: `web/css/style.css`

```css
:root {
    --primary-color: #2196F3;     /* Ganti warna primary */
    --secondary-color: #FF9800;   /* Ganti warna secondary */
}
```

### Ubah App Name

File: `web/index.html` dan `web/manifest.json`

```html
<title>Nama App Anda</title>
```

```json
{
  "name": "Nama App Anda",
  "short_name": "Singkat"
}
```

---

## 🔧 Troubleshooting

### "Location permission denied"

**Problem:** Browser tidak mengizinkan akses lokasi

**Solution:**
- Chrome: Settings → Privacy and security → Site Settings → Location
- Allow location untuk localhost/domain Anda

### "Service Worker not registered"

**Problem:** PWA features tidak berfungsi

**Solution:**
- Pastikan dijalankan via HTTP server (bukan file://)
- Gunakan HTTPS untuk production

### "API connection failed"

**Problem:** Tidak bisa connect ke backend

**Solution:**
- Pastikan backend server running
- Check API_BASE_URL di config.js
- Untuk local: gunakan http://localhost:3000/api
- Untuk production: gunakan https://domain.com/api

---

## ✅ PWA Features Checklist

- [ ] Installable (Add to Home Screen)
- [ ] Offline cache (Service Worker)
- [ ] Responsive design
- [ ] GPS location tracking
- [ ] Push notifications (future)
- [ ] Background sync (future)

---

## 📱 Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Firefox | 90+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| Opera | 76+ | ✅ Full |

**Required Features:**
- Geolocation API
- Service Workers
- Local Storage
- Fetch API

---

## 🎯 Next Steps

1. **Test di browser:**
   ```bash
   http-server ./web -p 8080
   ```

2. **Install sebagai PWA:**
   - Buka di Chrome mobile
   - Add to Home Screen

3. **Deploy ke production:**
   ```bash
   vercel
   ```

4. **Customize:**
   - Ganti warna di style.css
   - Ganti nama di manifest.json
   - Add logo/icons

---

## 📚 Documentation

- [SUPABASE_QUICKSTART.md](SUPABASE_QUICKSTART.md) - Setup Supabase
- [API.md](API.md) - API documentation
- [README.md](README.md) - Main documentation

---

**Made with ❤️ using HTML, CSS, JavaScript, and Supabase**
