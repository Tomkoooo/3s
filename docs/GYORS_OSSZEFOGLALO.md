# 3SGP Gyors Összefoglaló

## 🎯 MI MŰKÖDIK MÁR?

✅ **Felhasználókezelés (100%)**
- Admin/Auditor/Fixer user létrehozás
- Invite system (7 napos lejárat)
- Role-based access control
- Profil szerkesztés

✅ **Szünetkezelés (100%)**
- Szünetek létrehozása/szerkesztése/törlése
- Admin bárki nevében módosíthat
- Automatikus múltbeli szünetek törlése

✅ **Autentikáció (100%)**
- JWT-based session
- Login/Logout
- Token invalidálás password change után

## ⚠️ MI NEM MŰKÖDIK?

❌ **Területek (Sites)** - csak UI mock van, nincs CRUD
❌ **Ellenőrzések (Checks)** - csak adatmodell van
❌ **Audit ütemezés** - nincs implementálva
❌ **Email küldés** - nincs implementálva
❌ **Fixer szerepkör** - nincs kidolgozva
❌ **Képfeltöltés** - GridFS kész, de nincs UI

## 🐛 KRITIKUS BUG

**Admin check nem működik helyesen:**
- Induláskor `/login` jelenik meg `/quickstart` helyett
- **OK**: MongoDB kapcsolat hiba vagy middleware fetch issue

**GYORS JAVÍTÁS** (lásd lent) ⬇️

## 📋 MIT KELL CSINÁLNI? (Prioritás szerint)

### 1. AZONNAL (1-2 nap)
1. Admin check bug javítás 🔴
2. JWT_SECRET csere 🔴
3. Rate limiting hozzáadás 🔴

### 2. ELSŐ SPRINT (1 hét)
4. Site CRUD teljes implementálás
5. Site alterületek kezelése (3 szint)
6. Unit tesztek felállítása

### 3. MÁSODIK SPRINT (1 hét)
7. Check CRUD
8. Képfeltöltés (GridFS integration)
9. Integration tesztek

### 4. HARMADIK SPRINT (2 hét)
10. Audit ütemezés algoritmus
11. Email + .ics fájl küldés
12. Component tesztek

### 5. NEGYEDIK SPRINT (2 hét)
13. Audit végrehajtás UI (mobile-first)
14. PWA offline support
15. E2E tesztek

### 6. ÖTÖDIK SPRINT (1 hét)
16. Fixer szerepkör (követelmények tisztázása után)
17. Monitoring (Sentry)
18. Dokumentáció

## 📊 TELJES IDŐ BECSLÉS

- **MVP (alapműködés)**: 4-5 hét
- **Production ready**: 8-10 hét
- **Teljes + tesztek**: 12-14 hét

## 🔧 TESZTELÉS RÖVIDEN

**Framework stack:**
```bash
npm install -D jest @testing-library/react @playwright/test mongodb-memory-server
```

**4 réteg:**
1. **Unit tests** (Jest) - utils, validáció, auth logika
2. **Integration tests** (Jest + MongoDB Memory) - server actions
3. **Component tests** (RTL) - React komponensek
4. **E2E tests** (Playwright) - teljes user flow-k

**Coverage target:**
- Unit: 80%+
- Integration: 70%+
- Component: 60%+
- E2E: kritikus path-ek

---

# ⚡ ADMIN CHECK BUG - AZONNALI JAVÍTÁS

## Jelenlegi probléma

```typescript
// src/middleware.ts (27-39 sor)
let hasAdmin: boolean | null = null;
try {
    const res = await fetch(new URL('/api/system/has-admin', request.url), {
        headers: { 'accept': 'application/json' },
        cache: 'no-store',
    });
    if (res.ok) {
        const data = await res.json();
        hasAdmin = Boolean(data?.hasAdmin);
    }
} catch {
    // ignore and continue to auth  ❌ Ez a probléma!
}
```

**Hiba**: Ha a fetch elszáll, `hasAdmin = null` marad, és folytatódik a session check → `/login` redirect.

## Megoldás 1: Direkt DB query (AJÁNLOTT)

**Fájl**: `src/middleware.ts`

```typescript
import { connectDB } from '@/lib/db';
import User from '@/lib/db/models/User';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-url', request.url);

    // Skip middleware for static assets, Next internals, and API routes
    const isStaticAsset = /\.[^/]+$/.test(pathname);
    if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/_next') ||
        pathname === '/favicon.ico' ||
        pathname.startsWith('/invite/') ||
        isStaticAsset
    ) {
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    // 1) If no admin exists yet, redirect everything (non-static) to /quickstart
    let hasAdmin: boolean = false;
    try {
        await connectDB();
        const adminCount = await User.countDocuments({ role: 'admin' });
        hasAdmin = adminCount > 0;
    } catch (error) {
        console.error('Admin check failed in middleware:', error);
        // Ha DB hiba van, biztonságos alapállás: nincs admin
        hasAdmin = false;
    }

    if (!hasAdmin) {
        if (pathname !== '/quickstart') {
            return NextResponse.redirect(new URL('/quickstart', request.url));
        }
        // On /quickstart allow through without session check
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }
    
    if (hasAdmin && pathname === '/quickstart') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 2) Check session via API; if no user and not on /login, redirect to /login
    // ... (rest of the middleware remains the same)
}
```

**Előnyök:**
- ✅ Nincs internal fetch (gyorsabb)
- ✅ Explicit error handling
- ✅ Biztonságos fallback

**Hátrányok:**
- ⚠️ Minden request-nél DB query (de gyors, mert cache-elhető)

## Megoldás 2: Cache + DB query (LEGJOBB teljesítmény)

**Új fájl**: `src/lib/admin-cache.ts`

```typescript
import { connectDB } from '@/lib/db';
import User from '@/lib/db/models/User';

interface AdminCheckCache {
    value: boolean;
    timestamp: number;
}

let cache: AdminCheckCache | null = null;
const CACHE_TTL = 60000; // 1 perc

export async function hasAdminCached(): Promise<boolean> {
    // Return cached value if still valid
    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
        return cache.value;
    }

    // Query database
    try {
        await connectDB();
        const adminCount = await User.countDocuments({ role: 'admin' });
        const hasAdmin = adminCount > 0;
        
        // Update cache
        cache = { value: hasAdmin, timestamp: Date.now() };
        return hasAdmin;
    } catch (error) {
        console.error('Admin check failed:', error);
        // If cache exists but expired, use stale value
        if (cache) {
            console.warn('Using stale admin cache due to DB error');
            return cache.value;
        }
        // No cache, assume no admin (safe default)
        return false;
    }
}

export function invalidateAdminCache(): void {
    cache = null;
}
```

**Használat middleware-ben**:

```typescript
import { hasAdminCached } from '@/lib/admin-cache';

export async function middleware(request: NextRequest) {
    // ...

    const hasAdmin = await hasAdminCached();
    
    if (!hasAdmin) {
        if (pathname !== '/quickstart') {
            return NextResponse.redirect(new URL('/quickstart', request.url));
        }
        return NextResponse.next({
            request: { headers: requestHeaders },
        });
    }
    
    // ...
}
```

**Cache invalidálás quickstart után**:

```typescript
// src/app/quickstart/actions.ts
import { invalidateAdminCache } from '@/lib/admin-cache';

export async function registerAction(...) {
    // ...
    await registerUser(email, password, role, fullName, true);
    invalidateAdminCache(); // ✅ Cache törlés
    return { success: true };
}
```

**Előnyök:**
- ✅ Gyors (1 perc cache)
- ✅ Resilient (stale cache használat DB hiba esetén)
- ✅ Explicit cache invalidálás

## Megoldás 3: MongoDB kapcsolat javítás

**Ellenőrizd**:

```bash
# Terminálban:
mongosh mongodb://admin:admin@sironicsrv:27017/

# Ha nem működik, cseréld le localhost-ra vagy IP címre:
# .env.local
MONGODB_URI=mongodb://admin:admin@localhost:27017/
# vagy
MONGODB_URI=mongodb://admin:admin@192.168.1.100:27017/
```

**Ha távoli szerver**: Ellenőrizd a firewall és DNS beállításokat.

## Melyiket válasszam?

| Megoldás | Sebesség | Megbízhatóság | Komplexitás |
|----------|----------|---------------|-------------|
| 1. Direkt DB | 🟡 Közepes | 🟢 Jó | 🟢 Egyszerű |
| 2. Cache | 🟢 Gyors | 🟢 Legjobb | 🟡 Közepes |
| 3. Kapcsolat fix | 🟢 Gyors | 🔴 Bizonytalan | 🟢 Egyszerű |

**Ajánlás**: **Megoldás 2 (Cache)** - legjobb teljesítmény és megbízhatóság arány.

**Gyors win**: **Megoldás 1 (Direkt DB)** - 5 perc alatt kész, működik garantáltan.

---

# 📝 TESZTELÉS QUICK START

## 1. Telepítés

```bash
npm install -D jest @types/jest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jest-environment-jsdom @playwright/test mongodb-memory-server msw
```

## 2. Jest konfig

**Fájl**: `jest.config.js`

```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
};

module.exports = createJestConfig(customJestConfig);
```

**Fájl**: `jest.setup.js`

```javascript
import '@testing-library/jest-dom';

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
```

## 3. Első teszt

**Fájl**: `src/lib/__tests__/validation.test.ts`

```typescript
import { registerSchema } from '../validation';

describe('Validation schemas', () => {
  it('should validate correct registration data', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
      role: 'auditor',
      fullName: 'Test User',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
      role: 'auditor',
      fullName: 'Test User',
    });
    expect(result.success).toBe(false);
  });
});
```

## 4. Script hozzáadás

**Fájl**: `package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test"
  }
}
```

## 5. Futtatás

```bash
npm test                 # Összes teszt
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

---

# 🚀 KÖVETKEZŐ LÉPÉSEK

1. **Most azonnal** (5 perc):
   ```bash
   # Admin check bug javítás (Megoldás 1)
   # Nyisd meg: src/middleware.ts
   # Cseréld le a has-admin check-et a fenti kóddal
   ```

2. **Ma** (30 perc):
   ```bash
   # JWT secret csere
   openssl rand -base64 32
   # Másold be .env.local-ba
   
   # Tesztelés telepítés
   npm install -D jest @types/jest ...
   ```

3. **Holnap** (1 nap):
   - Site CRUD server actions
   - Első unit tesztek

4. **Jövő hét**:
   - Check CRUD
   - Integration tesztek

---

**Kérdések?** Jelezd és segítek az implementálásban! 🚀


