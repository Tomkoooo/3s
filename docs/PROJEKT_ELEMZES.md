# 3SGP Projekt Elemzés és Fejlesztési Terv

## 1. JELENLEGI ÁLLAPOT ÖSSZEFOGLALÁSA

### 1.1 Technológiai Stack
- **Framework**: Next.js 15.4.6 (App Router)
- **React**: 19.1.0 (Server Components & Server Actions)
- **Adatbázis**: MongoDB 8.17.1 + Mongoose + GridFS
- **Autentikáció**: JWT (jsonwebtoken 9.0.2) + bcrypt
- **UI**: TailwindCSS 4 + Shadcn UI + Radix UI
- **Validáció**: Zod 4.0.17
- **Dátumkezelés**: dayjs 1.11.13 + date-fns 4.1.0

### 1.2 Adatbázis Modellek

#### User Model
```typescript
interface IUser {
    email: string;
    fullName: string;
    role: 'auditor' | 'fixer' | 'admin';
    hashedPassword: string;
    createdAt: Date;
    passwordChangedAt: Date;
    lastLoginAt: Date;
}
```

#### Break Model
```typescript
interface IBreak {
    userId: ObjectId;
    start: string;        // YYYY-MM-DD formátum
    end: string;          // YYYY-MM-DD formátum
    reason?: string;
}
```

#### Site Model (Területek)
```typescript
interface ISite {
    name: string;
    children?: ObjectId;     // Alterületek (rekurzív)
    checks: ObjectId[];      // Ellenőrzések (ha nincs children)
}
```
**Validáció**: children és checks nem létezhetnek egyszerre (pre-save hook)

#### Check Model (Ellenőrzési checklist elem)
```typescript
interface ICheck {
    text: string;
    referenceImage?: ObjectId;  // GridFS referencia
}
```

#### Audit Model (Ellenőrzés)
```typescript
interface IAudit {
    site: ObjectId;
    participants: ObjectId[];    // Auditor user ID-k
    onDate: Date;
    startTime?: Date;
    endTime?: Date;
    status: 'scheduled' | 'in_progress' | 'completed';  // virtual field
    result: IAuditResult[];
}

interface IAuditResult {
    check: ObjectId;
    result: boolean;         // OK vagy NOK
    comment?: string;        // Kötelező ha NOK
    image?: ObjectId;        // Kötelező ha NOK (GridFS)
}
```

#### Invite Model
```typescript
interface IInvite {
    role: 'auditor' | 'fixer' | 'admin';
    expiresAt: Date;
    createdAt: Date;
    comment: string;
}
```

### 1.3 Autentikáció & Middleware

#### Middleware Flow (src/middleware.ts)
1. **Static asset bypass**: `/api`, `/_next`, `/favicon.ico`, `/invite/*`, fájlok
2. **Admin létezés ellenőrzés**: 
   - Ha nincs admin → redirect `/quickstart`
   - Ha van admin és `/quickstart` → redirect `/`
3. **Session check**:
   - Ha nincs valid session és nem `/login` → redirect `/login`
   - JWT token cookie-ból validálás
   - Token újraellenőrzés: `passwordChangedAt` mezővel

#### JWT Session
- **Cookie név**: `session`
- **Max age**: 2 óra (7200000 ms)
- **HttpOnly**: true
- **Secure**: production módban
- **Token payload**: `{ id, role, email, fullName, iat, exp }`

#### Role-Based Access Control
- **Admin layout** (`src/app/admin/layout.tsx`): 
  - `getCurrentUser()` → ha nincs user: redirect `/login`
  - Ha role !== 'admin': `notFound()` (404)
- **Nincs explicit middleware protection** az admin routeokra, csak layout-level

### 1.4 Implementált Funkciók

#### ✅ Felhasználókezelés
- **Admin szerepkör**:
  - Felhasználók létrehozása (3 szerepkörben)
  - Felhasználók meghívása (invite link generálás, 7 napos lejárat)
  - Felhasználók szerkesztése
  - Felhasználók törlése
  - Felhasználói szünetek kezelése (bárki nevében)
  
- **Auditor/Fixer szerepkör**:
  - Saját profil szerkesztése
  - Saját szünetek kezelése

#### ✅ Szünetkezelés
- Felhasználónkénti szünetek létrehozása
- Dátumtartomány megadása (start-end)
- Elmúlt szünetek automatikus törlése (`deletePastBreaks()`)
- Admin minden user szüneteit módosíthatja

#### ✅ Invite rendszer
- 7 napos lejáratú meghívók
- Szerepkör-alapú meghívás
- Comment mező a meghívóhoz
- Lejárt meghívók automatikus törlése

#### ✅ Autentikáció
- Regisztráció (csak invite-tal vagy quickstart)
- Login (email + password)
- Logout
- Session újraellenőrzés (client-side hook: `useAuth`)
- Password change → token invalidálás

### 1.5 Részlegesen Implementált Funkciók

#### 🟡 Területek (Sites)
- **Létező**: Adatmodell + UI scaffold
- **Hiányzik**:
  - CRUD műveletek (csak mock adat van)
  - Adatbázis integráció
  - Alterületek és ellenőrzések hozzárendelése
  - 3 szintes hierarchia kezelés

**Jelenlegi állapot**: `/admin/sites/page.tsx` MOCK adatokkal dolgozik:
```typescript
const MOCK_SITES: ProcessedSite[] = [...]
```

UI látható: TreeView komponens + SelectedEditor, de mentés/törlés nem működik.

#### 🟡 Ellenőrzések (Audits)
- **Létező**: Adatmodell kész
- **Hiányzik**:
  - Ütemezés logika
  - Auditor hozzárendelés
  - Ellenőrzés végrehajtása UI
  - Képfeltöltés (NOK esetén)
  - Email kiküldés (.ics fájl)

### 1.6 Hiányzó Funkciók

#### ❌ Fixer szerepkör
- **Státusz**: Egyáltalán nincs implementálva
- **Probléma**: Az üzleti logika nem tisztázott
- **Teendő**: Egyeztetés szükséges a stakeholderekkel

#### ❌ Ellenőrzés ütemezés
- Szabályalapú ütemezés
- Auditor hozzárendelés (szünetek figyelembevételével)
- Konfliktuskezelés

#### ❌ Email integráció
- SMTP konfiguráció
- .ics fájl generálás
- Email template-ek
- Napi összefoglaló emailek

#### ❌ Képfeltöltés/kezelés
- GridFS integráció használható, de nincs UI
- Nincs upload endpoint
- Nincs képmegjelenítés

#### ❌ Ellenőrzés végrehajtás
- Mobile-friendly UI az ellenőrzéshez
- Real-time állapot követés
- Időmérés (startTime/endTime)
- Kép csatolás NOK esetén

---

## 2. AZONOSÍTOTT PROBLÉMÁK

### 2.1 KRITIKUS: Admin Check Bug 🐛

**Probléma leírása**: 
Az induláskor `/login` jelenik meg `/quickstart` helyett, amikor nincs még admin user.

**Okozat**:
A middleware `has-admin` endpointot hívja:
```typescript
const res = await fetch(new URL('/api/system/has-admin', request.url), {
    headers: { 'accept': 'application/json' },
    cache: 'no-store',
});
```

**Lehetséges okok**:
1. **MongoDB kapcsolat hiba**: 
   - `MONGODB_URI=mongodb://admin:admin@sironicsrv:27017/`
   - Ha a `sironicsrv` host nem elérhető, a `connectDB()` sikertelen
   - A catch block `{ hasAdmin: false }` helyett `status: 500`-at ad vissza
   - A middleware `hasAdmin = null` marad (nem false!)
   
2. **Race condition**:
   - A middleware fetch-eli az API endpoint-ot
   - Az API endpoint `connectDB()`-t hív
   - Ha a kapcsolat lassú vagy timeout, a fetch elszáll catch-be
   - `hasAdmin = null` marad → folytatódik a session check
   
3. **Middleware fetch issue**:
   - Next.js 15 middleware-ben a fetch viselkedése változott
   - Lehet, hogy nem tudja elérni saját API route-ját

**Javasolt megoldások**:

**Opció A: Direkt DB query middleware-ben** (gyorsabb, de nem tiszta)
```typescript
import { connectDB } from '@/lib/db';
import User from '@/lib/db/models/User';

// middleware.ts-ben
try {
    await connectDB();
    const adminCount = await User.countDocuments({ role: 'admin' });
    hasAdmin = adminCount > 0;
} catch (error) {
    console.error('Admin check failed:', error);
    hasAdmin = false; // Explicit false
}
```

**Opció B: Cache-elt globális változó** (leggyorsabb)
```typescript
// lib/admin-check.ts
let adminCheckCache: { value: boolean, timestamp: number } | null = null;
const CACHE_TTL = 60000; // 1 perc

export async function hasAdminCached(): Promise<boolean> {
    if (adminCheckCache && Date.now() - adminCheckCache.timestamp < CACHE_TTL) {
        return adminCheckCache.value;
    }
    await connectDB();
    const exists = await User.exists({ role: 'admin' });
    adminCheckCache = { value: !!exists, timestamp: Date.now() };
    return adminCheckCache.value;
}
```

**Opció C: MongoDB kapcsolat diagnosztika**
```bash
# Tesztelni kell:
mongosh mongodb://admin:admin@sironicsrv:27017/
```

### 2.2 Biztonsági Problémák

#### 🔴 JWT_SECRET gyenge
```
JWT_SECRET=secret
```
**Megoldás**: Generálj erős secret-et:
```bash
openssl rand -base64 32
```

#### 🔴 Nincs rate limiting
Login/Register endpoint-ok támadhatóak.

**Megoldás**: `express-rate-limit` vagy Next.js middleware-ben:
```typescript
import { RateLimiter } from '@/lib/rate-limit';
const limiter = new RateLimiter({ windowMs: 15 * 60 * 1000, max: 5 });
```

#### 🔴 CORS nincs konfigurálva
API route-ok publikusak.

#### 🟡 Session cookie rotation hiányzik
Token refresh mechanizmus nincs.

### 2.3 Adatbázis Problémák

#### 🟡 Nincs indexelés optimalizáció
```typescript
// Hiányzó indexek:
userSchema.index({ email: 1 }, { unique: true });
breakSchema.index({ userId: 1, start: 1 });
auditSchema.index({ site: 1, onDate: 1 });
auditSchema.index({ participants: 1, onDate: 1 });
```

#### 🟡 Site model hibás típusok
```typescript
// Jelenleg:
children?: ObjectId;  // ❌ Csak egy child?

// Kellene:
children?: ObjectId[];  // ✅ Több child
```

#### 🟡 Nincs transaction kezelés
Kritikus műveleteknél (pl. audit létrehozás + email küldés).

### 2.4 Hiányzó Error Handling

- Nincs globális error boundary
- Server action hibák nem logolódnak
- Nincs Sentry/error tracking
- User-facing hibaüzenetek inconsistent-ek

### 2.5 Teljesítmény Problémák

- Nincs React.Suspense használat
- Nincs optimistic update
- Minden szerveroldali fetch `cache: 'no-store'`
- Nincs ISR/SSG használat (pedig lehetne)

---

## 3. FEJLESZTÉSI TERV

### 3.1 Azonnali Feladatok (P0 - 1-2 nap)

#### 1. Admin check bug javítása
- [ ] MongoDB kapcsolat tesztelése
- [ ] Middleware logging hozzáadása
- [ ] `hasAdmin` check refaktorálás (Opció B ajánlott)
- [ ] Tesztelés üres adatbázissal

#### 2. Biztonsági sürgősségek
- [ ] JWT_SECRET csere
- [ ] Rate limiting login/register-re
- [ ] CORS konfiguráció
- [ ] `.env.local` hozzáadása `.gitignore`-hoz (már benne van, de ellenőrizni)

#### 3. Site CRUD implementálás
- [ ] Server actions létrehozása (`src/app/admin/sites/actions.ts`)
- [ ] Site létrehozás (create)
- [ ] Site szerkesztés (update)
- [ ] Site törlés (delete) - cascade-del ellenőrzésekkel
- [ ] Alterületek hozzáadása/eltávolítása
- [ ] UI funkciók bekötése

### 3.2 Rövid Távú (P1 - 1 hét)

#### 4. Check CRUD implementálás
- [ ] Check model CRUD műveletek
- [ ] Kép upload endpoint (GridFS)
- [ ] Kép megjelenítés endpoint
- [ ] Check-ek hozzárendelése Site-okhoz
- [ ] UI check lista szerkesztő

#### 5. Adatbázis optimalizáció
- [ ] Indexek hozzáadása
- [ ] Site model children field javítása (ObjectId → ObjectId[])
- [ ] Migration script írása meglévő adatokhoz
- [ ] Transaction wrapper implementálás kritikus műveleteknél

#### 6. Error handling
- [ ] Globális error boundary (app/error.tsx)
- [ ] Logging service (Winston vagy Pino)
- [ ] Egységes hibaüzenet formátum
- [ ] Server action error wrapper

### 3.3 Közép Távú (P2 - 2-3 hét)

#### 7. Audit ütemezés logika
- [ ] Ütemező algoritmus (auditor rotation, break figyelembevétel)
- [ ] Audit létrehozás server action
- [ ] Konfliktus detektálás
- [ ] Manuális override lehetőség
- [ ] Audit lista UI (naptár nézet)

#### 8. Email integráció
- [ ] SMTP konfiguráció (nodemailer)
- [ ] .ics fájl generátor
- [ ] Email template engine (React Email vagy mjml)
- [ ] Napi összefoglaló cron job (Vercel Cron vagy node-cron)
- [ ] Email küldés retry logika

#### 9. Audit végrehajtás UI
- [ ] Mobile-first ellenőrzés UI
- [ ] Checklist progressbar
- [ ] Kép feltöltés drag-and-drop
- [ ] Offline support (PWA + IndexedDB)
- [ ] Timer komponens (startTime/endTime)

#### 10. Fixer szerepkör tisztázás
- [ ] Stakeholder meeting
- [ ] Use case definiálás
- [ ] Fixer dashboard tervezés
- [ ] Implementálás a tisztázott követelmények alapján

### 3.4 Hosszú Távú (P3 - 1+ hónap)

#### 11. Teljesítmény optimalizáció
- [ ] React.Suspense streaming
- [ ] Optimistic updates (useOptimistic)
- [ ] Képoptimalizáció (next/image)
- [ ] Cache stratégia átgondolás
- [ ] CDN integráció

#### 12. Monitoring & Analytics
- [ ] Sentry integráció
- [ ] Audit completion rate tracking
- [ ] User activity analytics
- [ ] Performance monitoring (Web Vitals)

#### 13. Dokumentáció
- [ ] API dokumentáció (TypeDoc)
- [ ] User manual
- [ ] Admin guide
- [ ] Deployment guide

#### 14. Testing (lásd 4. fejezet)

---

## 4. TESZTELÉSI STRATÉGIA

### 4.1 Testing Stack Javaslat

```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/user-event": "^14.5.0",
    "jest": "^29.7.0",
    "jest-environment-jsdom": "^29.7.0",
    "@playwright/test": "^1.40.0",
    "mongodb-memory-server": "^9.1.0",
    "msw": "^2.0.0"
  }
}
```

### 4.2 Tesztrétegek

#### 4.2.1 Unit Testing (Jest)

**Cél**: Izolált funkciók tesztelése

**Mit tesztelünk**:
- Utility functions (`src/lib/utils.ts`)
- Validáció sémák (`src/lib/validation.ts`)
- Adatbázis helper függvények (`src/lib/db/index.ts`)
- Auth logika (`src/lib/auth.ts`)

**Példa setup**:
```typescript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

// src/lib/__tests__/auth.test.ts
import { registerUser, signIn, adminExists } from '../auth';
import { MongoMemoryServer } from 'mongodb-memory-server';

describe('Auth functions', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(async () => {
    await mongoServer.stop();
  });

  it('should register a new user', async () => {
    const user = await registerUser(
      'test@example.com',
      'password123',
      'admin',
      'Test User'
    );
    expect(user.email).toBe('test@example.com');
  });

  it('should not allow duplicate emails', async () => {
    await expect(
      registerUser('test@example.com', 'password123', 'auditor', 'Test 2')
    ).rejects.toThrow('már létezik');
  });
});
```

#### 4.2.2 Integration Testing (Jest + MongoDB Memory Server)

**Cél**: Server Actions és adatbázis interakciók tesztelése

**Mit tesztelünk**:
- Server actions (`actions.ts` fájlok)
- Adatbázis műveletek
- Middleware logika

**Példa**:
```typescript
// src/app/admin/users/__tests__/actions.test.ts
import { createUserAction } from '../create/actions';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB } from '@/lib/db';

describe('User creation action', () => {
  beforeEach(async () => {
    // Clean DB before each test
    await User.deleteMany({});
  });

  it('should create admin user with valid data', async () => {
    const formData = new FormData();
    formData.append('email', 'admin@test.com');
    formData.append('password', 'securepass123');
    formData.append('fullName', 'Admin User');
    formData.append('role', 'admin');

    const result = await createUserAction(
      { success: false },
      formData
    );

    expect(result.success).toBe(true);
  });

  it('should reject weak password', async () => {
    const formData = new FormData();
    formData.append('email', 'admin@test.com');
    formData.append('password', '123');
    formData.append('fullName', 'Admin User');
    formData.append('role', 'admin');

    const result = await createUserAction(
      { success: false },
      formData
    );

    expect(result.success).toBe(false);
    expect(result.fieldErrors?.password).toBeDefined();
  });
});
```

#### 4.2.3 Component Testing (React Testing Library)

**Cél**: React komponensek tesztelése

**Mit tesztelünk**:
- Form komponensek
- UI interakciók
- Client-side validáció
- Conditional rendering

**Példa**:
```typescript
// src/components/__tests__/BreakForm.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BreakForm } from '../BreakForm';

describe('BreakForm', () => {
  it('should submit valid break data', async () => {
    const mockAction = jest.fn().mockResolvedValue({ success: true });
    render(<BreakForm action={mockAction} />);

    const startInput = screen.getByLabelText(/kezdő dátum/i);
    await userEvent.type(startInput, '2024-01-01');

    const submitButton = screen.getByRole('button', { name: /mentés/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAction).toHaveBeenCalled();
    });
  });

  it('should display validation errors', async () => {
    const mockAction = jest.fn().mockResolvedValue({
      success: false,
      fieldErrors: { start: ['Kötelező mező'] },
    });
    render(<BreakForm action={mockAction} />);

    const submitButton = screen.getByRole('button', { name: /mentés/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/kötelező mező/i)).toBeInTheDocument();
    });
  });
});
```

#### 4.2.4 E2E Testing (Playwright)

**Cél**: Teljes user flow-k tesztelése böngészőben

**Mit tesztelünk**:
- Komplett user journey-k
- Multi-page flow-k
- File upload/download
- Navigation

**Példa setup**:
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
  },
});

// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('should complete quickstart and create admin', async ({ page }) => {
    await page.goto('/');
    
    // Should redirect to quickstart
    await expect(page).toHaveURL('/quickstart');
    
    // Fill registration form
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'securepass123');
    await page.fill('input[name="fullName"]', 'Admin User');
    await page.click('button[type="submit"]');
    
    // Should redirect to admin dashboard
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('Admin felület');
  });

  test('should login existing user', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'securepass123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
  });
});

// e2e/admin.spec.ts
test.describe('Admin features', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@test.com');
    await page.fill('input[name="password"]', 'securepass123');
    await page.click('button[type="submit"]');
  });

  test('should create new user', async ({ page }) => {
    await page.goto('/admin/users/create');
    await page.fill('input[name="email"]', 'auditor@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="fullName"]', 'Auditor User');
    await page.selectOption('select[name="role"]', 'auditor');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('.toast')).toContainText('sikeres');
  });
});
```

### 4.3 Test Coverage Goals

```
Unit Tests:        80%+ coverage
Integration Tests: 70%+ coverage
Component Tests:   60%+ coverage
E2E Tests:         Critical paths only (10-15 tests)
```

### 4.4 CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 4.5 Testing Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **Test isolation**: Minden test önálló, egymástól független
3. **Mock external services**: Ne hívjunk valódi email API-t, payment gateway-t stb.
4. **Test data factories**: 
```typescript
// src/__tests__/factories/user.factory.ts
export const createTestUser = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'password123',
  fullName: 'Test User',
  role: 'auditor',
  ...overrides,
});
```
5. **Snapshot testing óvatosan**: Csak stabil komponensekhez
6. **E2E tests párhuzamosítás**: Playwright worker-ekkel

---

## 5. IMPLEMENTÁLÁSI PRIORITÁSOK

### Sprint 1 (1 hét): Foundation
- Admin check bug javítás ✅
- Biztonsági javítások ✅
- Site CRUD teljes implementáció ✅
- Unit test infrastruktúra felállítás ✅

### Sprint 2 (1 hét): Content Management
- Check CRUD + képfeltöltés ✅
- Adatbázis optimalizáció ✅
- Integration testek ✅
- Error handling rendszer ✅

### Sprint 3 (2 hét): Audit System
- Audit ütemezés algoritmus ✅
- Email integráció (SMTP + .ics) ✅
- Component testek ✅
- Audit lista UI ✅

### Sprint 4 (2 hét): Mobile & UX
- Audit végrehajtás UI ✅
- PWA offline support ✅
- E2E testek ✅
- Performance optimization ✅

### Sprint 5 (1 hét): Fixer & Polish
- Fixer szerepkör (követelmények szerint) ✅
- Monitoring & logging ✅
- Dokumentáció ✅
- Load testing ✅

---

## 6. ENVIRONMENT VARIABLES

Jelenleg használt:
```env
JWT_SECRET=secret  # ❌ CSERÉLNI!
MONGODB_URI=mongodb://admin:admin@sironicsrv:27017/
```

Javasolt teljes `.env.local`:
```env
# Database
MONGODB_URI=mongodb://admin:admin@sironicsrv:27017/
MONGODB_DB_NAME=3s-gp

# Auth
JWT_SECRET=<openssl rand -base64 32 output>
SESSION_MAX_AGE_MS=7200000

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@company.com
SMTP_PASSWORD=<app password>
EMAIL_FROM=3S-GP System <noreply@company.com>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Monitoring (opcionális)
SENTRY_DSN=
SENTRY_ENV=development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 7. DEPLOYMENT CHECKLIST

### Pre-deployment
- [ ] .env.local → .env.production
- [ ] JWT_SECRET generálás
- [ ] MongoDB production connection string
- [ ] SMTP credentials
- [ ] Sentry DSN
- [ ] CORS allowed origins
- [ ] Rate limiting konfig

### Vercel Deployment
```bash
npm run build  # Ellenőrizni hogy nincs hiba
vercel --prod
```

### Environment Variables Vercel-en
```bash
vercel env add JWT_SECRET production
vercel env add MONGODB_URI production
vercel env add SMTP_HOST production
# ... stb
```

### Post-deployment
- [ ] Health check endpoint tesztelés
- [ ] Quickstart flow tesztelés
- [ ] Login flow tesztelés
- [ ] Admin user létrehozás
- [ ] Email küldés tesztelés
- [ ] Monitoring dashboard ellenőrzés

---

## 8. KÖVETKEZTETÉSEK

### Pozitívumok ✅
- Modern tech stack (Next.js 15, React 19)
- Tiszta adatmodell struktúra
- Működő autentikáció és felhasználókezelés
- Shadcn UI → jó UX alap
- Server Actions → egyszerű backend

### Kihívások ⚠️
- Admin check bug kritikus
- Biztonsági hiányosságok
- Site/Check/Audit UI hiányzik
- Fixer szerepkör tisztázatlan
- Email integráció hiányzik
- Tesztek 0%

### Becsült fejlesztési idő
- **Minimálisan működő rendszer (MVP)**: 4-5 hét (Sprint 1-3)
- **Production-ready**: 8-10 hét (Sprint 1-5)
- **Teljes feature set + testek**: 12-14 hét

### Ajánlás
1. **Azonnali**: Admin check bug + biztonsági javítások (1-2 nap)
2. **Első sprint**: Site & Check CRUD (1 hét)
3. **Második sprint**: Audit alapok + email (2 hét)
4. **Harmadik sprint**: Mobile UI + testek (2 hét)
5. **Stakeholder meeting**: Fixer szerepkör tisztázása

---

## 9. KAPCSOLAT & KÉRDÉSEK

Ha bármelyik részhez kérdésed van vagy segítség kell az implementálásban, jelezd! 

Javasolt következő lépés: **Kezdjük az admin check bug javításával?**


