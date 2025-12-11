# 3SGP - Ellenőrzési Platform

Audit management platform Next.js 15, React 19, MongoDB és GridFS alapokon.

## 🚀 Gyors Indítás

### Előkövetelmények
- Node.js 18+ vagy Yarn
- MongoDB (helyben vagy távoli szerver)

### Telepítés

```bash
# Függőségek telepítése
npm install
# vagy
yarn install

# Environment változók beállítása
cp .env.example .env.local
```

### Environment Változók

Hozz létre egy `.env.local` fájlt:

```env
# MongoDB
MONGODB_URI=mongodb://admin:admin@localhost:27017/

# JWT
JWT_SECRET=<generált_erős_secret>

# Email (később)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=<app_password>
```

### Indítás

```bash
npm run dev
# vagy
yarn dev
```

Nyisd meg [http://localhost:3000](http://localhost:3000) a böngészőben.

---

## ✅ Elkészült Funkciók

### Autentikáció & Felhasználókezelés
- ✅ JWT-based session kezelés
- ✅ 3 szerepkör: Admin, Auditor, Fixer
- ✅ Felhasználó CRUD (admin)
- ✅ Invite rendszer (7 napos lejárat)
- ✅ Szünetkezelés (break management)
- ✅ Role-based access control

### Területkezelés (Sites)
- ✅ 3 szintes hierarchia (Level 0, 1, 2)
- ✅ Site CRUD műveletek
- ✅ TreeView UI
- ✅ Alterületek kezelése
- ✅ Validációs szabályok

### Ellenőrzési Pontok (Checks)
- ✅ Check CRUD műveletek
- ✅ Referencia kép feltöltés (GridFS)
- ✅ Site-hoz rendelés
- ✅ Inline szerkesztés

### Képfeltöltés (GridFS)
- ✅ Upload API endpoint
- ✅ Download/serve API
- ✅ Delete API (ownership check)
- ✅ ImageUpload komponens (drag & drop)
- ✅ Kép preview
- ✅ Max 10MB, típus validáció

### Ellenőrzések (Audits)
- ✅ Audit CRUD műveletek (admin)
- ✅ Site és Auditor hozzárendelés
- ✅ Saját audit-ok megtekintése (user)
- ✅ Státusz kezelés (scheduled/in_progress/completed)
- ✅ Dashboard statisztikák
- ✅ Admin audit lista
- ✅ User audit lista
- ✅ Admin audit részletek (szerkesztés, törlés)
- ✅ User audit részletek (részletes nézet)
- ✅ Audit végrehajtás UI (checklist, OK/NOK, timer)
- ✅ NOK esetén kötelező komment + opcionális kép
- ✅ Progress bar + navigáció
- ✅ Audit folytatás (in_progress audit-ok újranyitása)
- ✅ Meglévő eredmények betöltése
- ✅ Több auditor együttműködés támogatás

### UI/UX
- ✅ Modern design (Shadcn UI)
- ✅ Mobile-responsive
- ✅ Dark mode support
- ✅ Toast notifikációk
- ✅ Loading states
- ✅ Error handling

---

## ❌ Hiányzó / Folyamatban Lévő Funkciók

### 1. Audit Ütemezés Algoritmus (MAGAS prioritás)
**Mi hiányzik:**
- Automatikus auditor kijelölés
- Rotation (felváltva)
- Break figyelembevétel
- Konfliktus detektálás
- Tömeges audit generálás UI

**Érintett fájlok:**
```
/lib/audit-scheduler.ts (létrehozandó)
/admin/audits/schedule/page.tsx (létrehozandó)
/admin/audits/schedule/actions.ts (létrehozandó)
```

**Becsült idő:** 3-4 óra

---

### 2. Email Integráció (KÖZEPES prioritás)
**Mi hiányzik:**
- SMTP konfiguráció (nodemailer)
- .ics fájl generálás
- Email template-ek
- Audit értesítő email
- Napi összefoglaló email (cron job)

**Érintett fájlok:**
```
/lib/email/smtp.ts (létrehozandó)
/lib/email/templates.tsx (létrehozandó)
/lib/email/ics-generator.ts (létrehozandó)
/api/cron/daily-summary/route.ts (létrehozandó)
```

**Environment változók:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=<app_password>
EMAIL_FROM=Audit System <noreply@example.com>
```

**Becsült idő:** 2-3 óra

---

### 3. Naptár Nézetek (ALACSONY prioritás)
**Mi hiányzik:**
- Admin globális naptár (/admin/calendar)
- User saját naptár (/calendar)
- Month/Week/Day view
- Naptár komponens (react-big-calendar vagy egyedi)

**Érintett fájlok:**
```
/admin/calendar/page.tsx (létrehozandó)
/calendar/page.tsx (létrehozandó)
/components/CalendarView.tsx (létrehozandó)
```

**Package szükséges:**
```bash
npm install react-big-calendar date-fns
# vagy
npm install @fullcalendar/react
```

**Becsült idő:** 2-3 óra

---

### 4. Fixer Szerepkör (TISZTÁZÁSRA VÁR)
**Probléma:** Az üzleti logika nem tisztázott

**Kérdések a stakeholder-eknek:**
1. Mi a Fixer fő feladata?
2. Látja az összes NOK-ot?
3. Van külön dashboard-ja?
4. Automatikus értesítést kap?
5. Milyen jogosultságai vannak?

**Lehetséges implementációk:**
- Fixer Dashboard (NOK lista)
- Task management (feladat hozzárendelés)
- Javítási workflow

**Érintett fájlok:**
```
/fixer/page.tsx (létrehozandó - tisztázás után)
/fixer/tasks/[taskId]/page.tsx (létrehozandó)
```

**Becsült idő:** 2-3 óra (követelmények tisztázása után)

---

### 5. További Javítások

#### Biztonsági Javítások
- ⚠️ **JWT_SECRET** csere (jelenleg: "secret")
  ```bash
  openssl rand -base64 32
  ```
- ⚠️ Rate limiting (login/register)
- ⚠️ CORS konfiguráció

#### Offline Support (OPCIONÁLIS)
- PWA konfiguráció
- IndexedDB cache audit execution során
- Service worker

#### Tesztek (ALACSONY prioritás)
- Unit tesztek (Jest)
- Integration tesztek (MongoDB Memory Server)
- Component tesztek (React Testing Library)
- E2E tesztek (Playwright)

**Becsült idő:** 8-10 óra

---

## 📋 Összesített Hátralevő Munka

| Funkció | Prioritás | Becsült Idő | Státusz |
|---------|-----------|-------------|---------|
| **Audit végrehajtás UI** | 🔴 MAGAS | 3-4 óra | ✅ **Elkészült** |
| **Admin/User audit részletek** | 🟡 KÖZEPES | 1-2 óra | ✅ **Elkészült** |
| Audit ütemezés | 🔴 MAGAS | 3-4 óra | Tervezve |
| Email integráció | 🟡 KÖZEPES | 2-3 óra | Tervezve |
| Naptár nézetek | 🟢 ALACSONY | 2-3 óra | Tervezve |
| Fixer szerepkör | ⚪ TISZTÁZÁSRA VÁR | 2-3 óra | Várakozik |
| Biztonsági javítások | 🔴 MAGAS | 30 perc | Tervezve |
| Offline support | 🟢 ALACSONY | 2-3 óra | Opcionális |
| Tesztek | 🟢 ALACSONY | 8-10 óra | Opcionális |

**Teljes becsült idő MVP-hez:** 6-8 óra (0.75-1 munkanap)

**Teljes becsült idő production-ready-hez:** 20-28 óra (2.5-3.5 munkanap)

---

## 🗂️ Projekt Struktúra

```
src/
├── app/
│   ├── admin/                        # Admin oldalak
│   │   ├── audits/                   # ✅ Audit kezelés
│   │   │   ├── page.tsx              # Lista
│   │   │   ├── create/page.tsx       # Új audit
│   │   │   ├── [auditId]/page.tsx    # Részletek + szerkesztés
│   │   │   ├── AuditForm.tsx         # Form komponens
│   │   │   └── actions.ts            # Backend műveletek
│   │   ├── sites/                    # ✅ Területek
│   │   ├── users/                    # ✅ Felhasználók
│   │   └── breaks/                   # ✅ Szünetek
│   ├── audits/                       # ✅ User audit-ok
│   │   ├── page.tsx                  # Saját audit-ok lista
│   │   ├── [auditId]/page.tsx        # Részletek
│   │   ├── [auditId]/execute/        # ✅ Végrehajtás UI
│   │   │   ├── page.tsx              # Entry point
│   │   │   ├── AuditExecutionClient.tsx
│   │   │   ├── ChecklistItem.tsx
│   │   │   └── actions.ts
│   │   └── actions.ts                # User műveletek
│   ├── my-account/                   # ✅ Profil + szünetek
│   ├── api/
│   │   ├── upload/                   # ✅ GridFS API
│   │   └── system/                   # ✅ System API (session, has-admin)
│   └── page.tsx                      # ✅ Dashboard
├── components/                       # ✅ Reusable komponensek
│   ├── AuditCard.tsx                 # Audit kártya
│   ├── StatusBadge.tsx               # Státusz badge
│   ├── SiteSelect.tsx                # Site dropdown
│   ├── AuditorSelect.tsx             # Auditor picker
│   ├── ImageUpload.tsx               # Kép feltöltő (drag&drop)
│   └── ui/                           # Shadcn UI komponensek
├── lib/
│   ├── auth.ts                       # ✅ JWT auth
│   ├── db/
│   │   ├── models/                   # ✅ Mongoose modellek
│   │   │   ├── User.ts
│   │   │   ├── Site.ts
│   │   │   ├── Check.ts
│   │   │   ├── Audit.ts
│   │   │   ├── Break.ts
│   │   │   ├── Invite.ts
│   │   │   └── Uploads.ts
│   │   └── index.ts                  # ✅ DB connection
│   └── validation.ts                 # ✅ Zod schemák
└── middleware.ts                     # ✅ Auth + admin check (timeout)
```

---

## 📚 Dokumentáció

További részletes dokumentáció:
- `PROJEKT_ELEMZES.md` - Teljes projekt elemzés
- `IMPLEMENTACIO_OSSZEFOGLALO.md` - Implementáció összefoglaló
- `FEJLESZTESI_TERV.md` - Fejlesztési terv
- `AUDIT_IMPLEMENTACIO_TERV.md` - Audit implementáció részletei
- `AUDIT_CRUD_ELKESZULT.md` - Audit CRUD implementáció (Session 1)
- `SESSION_2_OSSZEFOGLALO.md` - Audit részletek + végrehajtás UI (Session 2) ⭐
- `BUGFIX_OSSZEFOGLALO.md` - Kritikus bug fixek (checks másolás, dátum kezelés, lean típusok) 🐛
- `AUDIT_FOLYTATAS_FEATURE.md` - Audit folytatás feature (in_progress újranyitás, többuser support) 🔄
- `KEPFELTOLTES_OSSZEFOGLALO.md` - Képfeltöltés dokumentáció
- `MODELLEK_JAVITASOK.md` - MongoDB modellek javítások
- `TERULETEK_JAVITAS.md` - Területkezelés javítások

---

## 🛠️ Tech Stack

- **Framework:** Next.js 15.4.6 (App Router)
- **React:** 19.1.0 (Server Components + Server Actions)
- **Database:** MongoDB 8.17.1 + Mongoose
- **File Storage:** GridFS
- **Auth:** JWT + bcrypt
- **UI:** TailwindCSS 4 + Shadcn UI + Radix UI
- **Validation:** Zod 4.0.17
- **Date:** dayjs + date-fns

---

## 🤝 Contributing

1. Válassz egy funkciót a fenti listából
2. Nézd meg a kapcsolódó dokumentációt
3. Implementáld a funkciót
4. Tesztel lokálisan
5. Commit és push

---

## 📞 Support

Kérdések vagy problémák esetén nézd meg a dokumentációkat vagy nyiss issue-t.

---

**Jelenlegi verzió:** MVP (~92% kész) ✨
**Következő milestone:** Audit ütemezés algoritmus + Email integráció
