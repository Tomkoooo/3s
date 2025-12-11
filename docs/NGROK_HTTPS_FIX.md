# Ngrok HTTPS Session/Cookie Fix

## 🔴 Probléma
Amikor az alkalmazást ngrok-on keresztül használod HTTPS-sel, a bejelentkezés után folyamatosan visszaredirectel a login oldalra, még sikeres autentikáció után is.

## 🔍 OK
A probléma a **session cookie beállításokban** volt:
1. ❌ Hiányzó `sameSite` attribútum
2. ❌ A `secure` flag nem volt megfelelően kezelve HTTPS development környezetben (ngrok)

### Részletes magyarázat:
- **localhost HTTP-n**: Cookie-k `secure: false` nélkül működnek
- **ngrok HTTPS-en**: A böngésző szigorúbb cookie policy-kat alkalmaz
  - HTTPS-en a cookie-knak `secure: true` kell legyen
  - A `sameSite` attribútum kötelező a modern böngészőkben
  - Ngrok esetén a domain változik (pl. `https://abc123.ngrok.io`)

## ✅ Megoldás

### 0. Admin Check API Runtime Fix (`src/app/api/system/has-admin/route.ts`)

**Hozzáadva:**
```typescript
// Force Node.js runtime (required for MongoDB)
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
```

**Miért fontos:** Az API endpoint MongoDB-t használ, ami csak Node.js runtime-ban működik, nem edge runtime-ban.

### 1. Session Cookie Fix (`src/lib/auth.ts`)

**Hozzáadva:**
```typescript
// Allow forcing secure cookies in development (e.g., for ngrok HTTPS)
const isSecureCookie = () => {
    if (process.env.FORCE_SECURE_COOKIES === 'true') return true;
    return process.env.NODE_ENV === 'production';
};
```

**Frissített cookie beállítások:**
```typescript
cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isSecureCookie(),          // ← Dinamikus secure flag
    sameSite: 'lax',                   // ← ÚJ: Hozzáadva!
    maxAge: SESSION_COOKIE_MAX_AGE_MS,
    path: '/',
});
```

### 2. Middleware URL Fix (`src/middleware.ts`)

**Javított URL építés:**
```typescript
// Build correct URL for API call (works in both dev and production)
const protocol = request.nextUrl.protocol;
const host = request.nextUrl.host;
const apiUrl = `${protocol}//${host}/api/system/has-admin`;

const res = await fetch(apiUrl, {
    headers: { 'accept': 'application/json' },
    cache: 'no-store',
    signal: controller.signal,
});
```

**Miért fontos:** A `new URL('/api/...', request.url)` nem működik helyesen edge runtime-ban development környezetben. Az új módszer explicit URL építéssel működik minden esetben.

### 3. Middleware Debug (`src/middleware.ts`)

**Hozzáadva debug logging:**
```typescript
const DEBUG = process.env.MIDDLEWARE_DEBUG === 'true';

function debugLog(...args: any[]) {
    if (DEBUG) {
        console.log('[Middleware]', ...args);
    }
}
```

**Debug pontok:**
- Cookie jelenlét ellenőrzés
- Session API válasz státusz
- User autentikáció eredmény
- Redirect okak

## 🚀 Használat

### Ngrok-kal való tesztelés

#### 1. Ngrok indítása
```bash
ngrok http 3000
```

Kapni fogsz egy URL-t, pl.: `https://abc123.ngrok.io`

#### 2. Environment változók beállítása

Hozz létre egy `.env.local` fájlt (vagy frissítsd a meglévőt):

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/3sgp

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Ngrok/HTTPS Support
FORCE_SECURE_COOKIES=true          # ← ÚJ: Ngrok HTTPS-hez
MIDDLEWARE_DEBUG=true              # ← ÚJ: Debug logging (opcionális)

# Email (ha használod)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=3S Audit System <noreply@example.com>
```

#### 3. Alkalmazás újraindítása
```bash
npm run dev
```

#### 4. Ngrok URL-en keresztül tesztelés
Nyisd meg: `https://abc123.ngrok.io` (a te ngrok URL-ed)

### Debug Mode Aktiválás

Ha problémát tapasztalsz, kapcsold be a debug mode-ot:

```env
MIDDLEWARE_DEBUG=true
```

A console-ban látni fogod:
```
[Middleware] Checking session for: / Cookies: present
[Middleware] Session check response: 200
[Middleware] Session data: user found
[Middleware] User authenticated, allowing through
```

Vagy hiba esetén:
```
[Middleware] Checking session for: / Cookies: missing
[Middleware] Session check response: 401
[Middleware] No user in session, redirecting to /login
```

## 📋 Checklist - Ngrok teszteléshez

- [ ] `.env.local` létrehozva/frissítve
- [ ] `FORCE_SECURE_COOKIES=true` beállítva
- [ ] `JWT_SECRET` kitöltve
- [ ] `MONGODB_URI` helyes
- [ ] Ngrok elindítva (`ngrok http 3000`)
- [ ] Next.js dev szerver fut (`npm run dev`)
- [ ] Böngésző cache törölve (Ctrl+Shift+Delete)
- [ ] Bejelentkezés tesztelve ngrok URL-en

## 🔧 Hibaelhárítás

### "Folyamatosan visszaredirectel login-ra"
1. ✅ Ellenőrizd, hogy `FORCE_SECURE_COOKIES=true` be van-e állítva
2. ✅ Töröld a böngésző cookie-jait
3. ✅ Kapcsold be a `MIDDLEWARE_DEBUG=true`-t
4. ✅ Ellenőrizd a console log-okat

### "Cookie nem jön át"
1. ✅ Ellenőrizd a böngésző Developer Tools → Application → Cookies-t
2. ✅ Keress egy `session` nevű cookie-t
3. ✅ Nézd meg, hogy `Secure` és `SameSite=Lax` van-e
4. ✅ Ha nincs, töröld és jelentkezz be újra

### "Invalid token" error
1. ✅ Ellenőrizd, hogy a `JWT_SECRET` ugyanaz-e minden újraindításnál
2. ✅ Töröld a régi cookie-kat
3. ✅ Jelentkezz be újra

### "Folyamatos redirect /quickstart-ra admin létezése ellenére"
1. ✅ **Indítsd újra a dev szervert!** (`Ctrl+C` majd `npm run dev`)
2. ✅ Ellenőrizd hogy MongoDB fut és elérhető
3. ✅ Kapcsold be a debug mode-ot: `MIDDLEWARE_DEBUG=true`
4. ✅ Nézd meg a console log-ot:
   ```
   [Middleware] Checking admin existence at: http://localhost:3000/api/system/has-admin
   [Middleware] Admin check response status: 200
   [Middleware] Admin exists: true (cached)
   ```
5. ✅ Ha "fetch failed" látható, ellenőrizd az API endpoint-ot:
   ```bash
   curl http://localhost:3000/api/system/has-admin
   # Várt válasz: {"hasAdmin":true}
   ```

## 🎯 sameSite Attribútum Magyarázat

| Érték | Leírás | Használat |
|-------|--------|-----------|
| `'strict'` | Cookie csak same-site kérésekhez | Legbiztonságosabb, de túl szigorú lehet |
| `'lax'` | Cookie GET kérésekhez és same-site-hoz | **Ajánlott** (ezt használjuk) |
| `'none'` | Cookie minden kéréshez (HTTPS kötelező!) | Cross-site integrációkhoz |

**Választásunk: `'lax'`** - Kiegyensúlyozott biztonság és használhatóság.

## 📊 Cookie Beállítások Összefoglaló

| Attribútum | Érték | Indok |
|------------|-------|-------|
| `httpOnly` | `true` | Véd XSS ellen (JavaScript nem éri el) |
| `secure` | `isSecureCookie()` | HTTPS-en kötelező, localhost-on opcionális |
| `sameSite` | `'lax'` | CSRF védelem, GET kérések engedélyezése |
| `maxAge` | `7200000` (2h) | Session timeout |
| `path` | `'/'` | Minden route-on elérhető |

## 🌐 Production Deployment

Production környezetben (pl. Vercel):
```env
# .env.production
NODE_ENV=production                # Auto: secure=true
MONGODB_URI=mongodb+srv://...      # Production DB
JWT_SECRET=very-strong-secret-key  # Erős generált kulcs
```

A `FORCE_SECURE_COOKIES` **NEM szükséges** production-ben, mert `NODE_ENV=production` esetén automatikusan `secure: true`.

## ✨ Összefoglalás

**Változtatások:**
1. ✅ API route runtime explicit beállítása (`nodejs`)
2. ✅ Middleware URL építés javítása (protocol + host)
3. ✅ `sameSite: 'lax'` hozzáadva minden session cookie-hoz
4. ✅ `isSecureCookie()` helper funkció HTTPS dev supporthoz
5. ✅ `FORCE_SECURE_COOKIES` environment variable
6. ✅ `MIDDLEWARE_DEBUG` környezeti változó
7. ✅ Részletes middleware debug logging

**Eredmény:**
- ✅ Localhost HTTP működik (ahogy eddig)
- ✅ Ngrok HTTPS működik (új!)
- ✅ Production HTTPS működik (Vercel, stb.)
- ✅ Debug-olható session problémák
- ✅ Nincs "quickstart redirect loop"

---

**Fix verzió:** 2025-11-05  
**Státusz:** ✅ JAVÍTVA és TESZTELVE  
**Utolsó frissítés:** 2025-11-05 (Admin check + middleware URL fix)

