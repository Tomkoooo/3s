# Environment Configuration Guide

## 📋 Gyors Kezdés

Hozd létre a `.env.local` fájlt a projekt gyökérkönyvtárában:

```bash
cp .env.example .env.local  # ha létezik
# VAGY
touch .env.local
```

## 🔧 Környezeti Változók

### 1. **DATABASE** (Kötelező)

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/3sgp

# VAGY MongoDB Atlas (Production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/3sgp?retryWrites=true&w=majority
```

### 2. **AUTHENTICATION** (Kötelező)

```env
# JWT Secret - VÁLTOZTASD MEG production-ben!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Erős JWT secret generálása:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. **HTTPS / NGROK SUPPORT** (Ngrok használathoz)

```env
# Csak ngrok/HTTPS tunnel esetén állítsd 'true'-ra
FORCE_SECURE_COOKIES=false

# Debug mode (opcionális)
MIDDLEWARE_DEBUG=false
```

### 4. **EMAIL CONFIGURATION** (Opcionális)

```env
# SMTP beállítások audit értesítésekhez
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM=3S Audit System <noreply@example.com>

# Teszt módhoz (nem küld valódi emailt)
SIMULATE_EMAIL=true
```

**Gmail App Password beállítása:**
1. Google Account Security → 2-Step Verification
2. App Passwords → Generate
3. Másold be a generált jelszót

### 5. **CRON JOBS** (Vercel/Production)

```env
# Secret token cron endpoint-ok védelméhez
CRON_SECRET=your-cron-secret-token
```

## 📝 Teljes `.env.local` Példák

### Local Development (HTTP - localhost:3000)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/3sgp

# Auth
JWT_SECRET=dev-secret-key-replace-in-production

# HTTPS/Ngrok (NEM kell localhost-hoz)
FORCE_SECURE_COOKIES=false
MIDDLEWARE_DEBUG=false

# Email (opcionális, lehet SIMULATE)
SIMULATE_EMAIL=true
```

### Ngrok Development (HTTPS - ngrok tunnel)

```env
# Database
MONGODB_URI=mongodb://localhost:27017/3sgp

# Auth
JWT_SECRET=dev-secret-key-replace-in-production

# HTTPS/Ngrok - FONTOS!
FORCE_SECURE_COOKIES=true          # ← Kapcsold BE ngrok-hoz!
MIDDLEWARE_DEBUG=true              # ← Debug-oláshoz

# Email (opcionális)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=3S Audit <noreply@example.com>
```

### Production (Vercel/Hosting)

```env
# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/3sgp?retryWrites=true&w=majority

# Auth
JWT_SECRET=a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2

# HTTPS - Auto-detected production-ben, NEM kell
# FORCE_SECURE_COOKIES=true  # ← Nem kell!

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@yourcompany.com
SMTP_PASSWORD=production-app-password
EMAIL_FROM=3S Audit System <noreply@yourcompany.com>

# Cron
CRON_SECRET=strong-random-cron-secret-token

# Deployment (Auto-set by Vercel)
# NODE_ENV=production
# VERCEL_URL=your-app.vercel.app
```

## 🚨 Fontos Biztonsági Megjegyzések

### ✅ DO:
- ✅ Használj erős, random JWT_SECRET-et
- ✅ Különböző secret-eket dev/staging/production-ben
- ✅ `.env.local` fájlt tartsd `.gitignore`-ban
- ✅ Forgasd a secret-eket rendszeresen production-ben
- ✅ Gmail esetén használj App Password-öt

### ❌ DON'T:
- ❌ Ne commitolj `.env.local` fájlt git-be
- ❌ Ne használd ugyanazt a JWT_SECRET-et mindenhol
- ❌ Ne használd a Gmail jelszavadat közvetlenül
- ❌ Ne exposed secret-eket client-side code-ban
- ❌ Ne használj gyenge secret-eket production-ben

## 🔍 Hibaelhárítás

### "Cannot connect to MongoDB"
```bash
# Ellenőrizd, hogy MongoDB fut-e
sudo systemctl status mongod
# VAGY
brew services list | grep mongodb

# Indítsd el ha nem fut
sudo systemctl start mongod
# VAGY
brew services start mongodb-community
```

### "JWT_SECRET is not set"
```bash
# Ellenőrizd, hogy .env.local létezik-e
ls -la .env.local

# Ellenőrizd a tartalmat
cat .env.local | grep JWT_SECRET

# Ha hiányzik, add hozzá
echo "JWT_SECRET=your-secret-here" >> .env.local
```

### "Ngrok redirect loop"
```bash
# Állítsd be FORCE_SECURE_COOKIES=true-t
echo "FORCE_SECURE_COOKIES=true" >> .env.local

# Töröld a böngésző cookie-jait
# Chrome: Ctrl+Shift+Delete → Cookies

# Indítsd újra a dev szervert
npm run dev
```

### "Email sending failed"
```bash
# Teszteléshez használd a simulate módot
echo "SIMULATE_EMAIL=true" >> .env.local

# Ellenőrizd az SMTP beállításokat
# Gmail: Biztos App Password-öt használsz?

# Debug mode
echo "MIDDLEWARE_DEBUG=true" >> .env.local
```

## 📊 Environment Variable Összefoglaló

| Variable | Kötelező | Default | Leírás |
|----------|----------|---------|--------|
| `MONGODB_URI` | ✅ Igen | - | MongoDB connection string |
| `JWT_SECRET` | ✅ Igen | - | JWT token titkosítási kulcs |
| `FORCE_SECURE_COOKIES` | ❌ Nem | `false` | HTTPS cookie-k ngrok-hoz |
| `MIDDLEWARE_DEBUG` | ❌ Nem | `false` | Debug logging |
| `SMTP_HOST` | ❌ Nem | - | SMTP szerver cím |
| `SMTP_PORT` | ❌ Nem | `587` | SMTP port |
| `SMTP_USER` | ❌ Nem | - | SMTP felhasználó |
| `SMTP_PASSWORD` | ❌ Nem | - | SMTP jelszó |
| `EMAIL_FROM` | ❌ Nem | - | Küldő email cím |
| `SIMULATE_EMAIL` | ❌ Nem | `false` | Email szimuláció |
| `CRON_SECRET` | ❌ Nem | - | Cron endpoint védelem |

## 🎯 Gyors Start Checklist

- [ ] `.env.local` fájl létrehozva
- [ ] `MONGODB_URI` beállítva (MongoDB fut)
- [ ] `JWT_SECRET` generálva és beállítva
- [ ] Ngrok esetén `FORCE_SECURE_COOKIES=true`
- [ ] Email konfiguráció (ha használod)
- [ ] Dev szerver újraindítva
- [ ] Böngésző cache törölve
- [ ] Login teszt sikeres

---

**Dokumentáció frissítve:** 2025-11-05  
**Kapcsolódó dokumentumok:** `NGROK_HTTPS_FIX.md`


