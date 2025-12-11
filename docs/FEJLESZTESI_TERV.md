# Fejlesztési Terv - Teljes Állapot

## 📊 Jelenlegi Állapot (98% KÉSZ) 🎉

### ✅ Kész (100%)
- Felhasználókezelés (Admin, Auditor, Fixer szerepkörök)
- Autentikáció (JWT + session)
- Szünetkezelés
- Invite rendszer
- **Területek CRUD (3 szintes hierarchia)**
- **Ellenőrzési pontok CRUD**
- **✅ Képfeltöltés (GridFS upload/download)** ← KÉSZ
- **✅ Audit CRUD műveletek** ← KÉSZ
- **✅ Audit ütemezés algoritmus** ← KÉSZ
- **✅ Email integráció + .ics fájl** ← KÉSZ
- **✅ Audit végrehajtás UI** ← KÉSZ
- **✅ Check Description Field** ← KÉSZ
- **✅ Calendar Views (Admin + User)** ← KÉSZ
- **✅ Dashboard Improvements** ← KÉSZ
- Admin védelem minden szinten

### 🟡 Opcionális / Üzletileg Tisztázatlan
- Fixer szerepkör (üzleti logika TBD)
- Advanced reporting / analytics
- PWA offline support

---

## 🎯 Fejlesztési Sprintek (MIND KÉSZ ✅)

### ✅ Sprint 1: Képfeltöltés (ELKÉSZÜLT)
**Miért fontos**: Check referencia képek + Audit NOK képekhez

#### Feladatok:
- [x] GridFS upload API endpoint
- [x] GridFS download/serve API endpoint
- [x] Image upload komponens (drag & drop)
- [x] Image preview komponens
- [x] Check referencia kép feltöltés integrálás
- [x] Képtörlés funkció

**Dokumentáció**: `KEPFELTOLTES_OSSZEFOGLALO.md`

**Fájlok**:
```
/api/upload/route.ts          - POST upload, GET list
/api/upload/[fileId]/route.ts - GET download, DELETE
/components/ImageUpload.tsx   - Drag & drop komponens
/components/ImagePreview.tsx  - Kép megjelenítő
```

**Használat**:
- Check form-ban referencia kép feltöltés
- Később: Audit végrehajtásnál NOK képek

---

### ✅ Sprint 2: Audit CRUD (ELKÉSZÜLT)
**Miért fontos**: Audit-ok létrehozása, listázása, módosítása alapvető

#### Feladatok:
- [x] Audit lista oldal (admin)
- [x] Audit létrehozás form
  - Site kiválasztás
  - Résztvevők (auditor-ok) kiválasztás
  - Dátum kiválasztás
- [x] Audit részletek oldal
- [x] Audit módosítás
- [x] Audit törlés
- [x] Audit végrehajtás UI (Folytatás funkció)
- [x] Check Description Field

**Dokumentáció**: `AUDIT_CRUD_ELKESZULT.md`, `AUDIT_FOLYTATAS_FEATURE.md`, `CHECK_DESCRIPTION_FEATURE.md`

**Fájlok**:
```
/admin/audits/page.tsx              - Lista
/admin/audits/create/page.tsx       - Új audit
/admin/audits/[auditId]/page.tsx    - Részletek
/admin/audits/actions.ts            - Server actions
```

**UI Elemek**:
- Audit tábla (site, dátum, auditor-ok, státusz)
- Státusz badge: scheduled / in_progress / completed
- Filter: dátum, site, auditor

---

### ✅ Sprint 3: Audit Ütemezés (ELKÉSZÜLT)
**Miért fontos**: Automatikus auditor kijelölés a szabályok szerint

#### Üzleti Logika:
1. **Site alapú ütemezés**: ✅
   - Minden legalsó szintű site-hoz (level 2) audit kell
   - Periódikus ütemezés (heti, havi, custom)

2. **Auditor kijelölés szabályok**: ✅
   - Rotation (felváltva)
   - Szünet figyelembevétel (Break model)
   - Minimum auditor szám (1-2 fő)

3. **Konfliktus kezelés**: ✅
   - Egy auditor max X audit/nap
   - Átfedés detektálás

**Dokumentáció**: `AUDIT_SCHEDULING_FEATURE.md`

#### Feladatok:
- [x] Ütemező algoritmus írása
- [x] Break ellenőrzés integráció
- [x] Auditor rotation logika
- [x] Manual override lehetőség
- [x] Bulk audit generálás UI

**Fájlok**:
```
/lib/audit-scheduler.ts              - Core algoritmus
/admin/audits/schedule/page.tsx      - Ütemező UI
/admin/audits/schedule/actions.ts    - Schedule actions
```

**Példa algoritmus**:
```typescript
// Pseudo-code
function scheduleAudits(params: {
  sites: Site[],
  dateRange: { start: Date, end: Date },
  frequency: 'daily' | 'weekly' | 'monthly'
}) {
  const availableAuditors = await getAvailableAuditors(dateRange);
  const rotation = createRotation(availableAuditors);
  
  for (const date of dateRange) {
    for (const site of sites) {
      const auditor = rotation.next(date);
      if (auditor && !hasBreak(auditor, date)) {
        createAudit({ site, auditor, date });
      }
    }
  }
}
```

---

### ✅ Sprint 4: Email Integráció (ELKÉSZÜLT)
**Miért fontos**: Auditor-okat értesíteni kell az audit-okról

#### Feladatok:
- [x] SMTP konfiguráció (nodemailer)
- [x] .ics fájl generátor
- [x] Email template (React alapú)
- [x] Audit értesítő email
- [x] Napi összefoglaló email (cron)
- [x] Email küldés retry logika

**Dokumentáció**: `EMAIL_INTEGRATION_FEATURE.md`

**Környezeti változók**:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASSWORD=app_password
EMAIL_FROM=Audit System <noreply@example.com>
```

**Email típusok**:
1. **Audit kijelölés email**:
   - Subject: "Új ellenőrzés kijelölve: [Site név] - [Dátum]"
   - Body: Részletek + .ics melléklet
   - .ics: all-day event

2. **Napi összefoglaló** (cron):
   - Reggel 8:00
   - Mai audit-ok listája
   - Holnapi audit-ok előzetes

**Fájlok**:
```
/lib/email/smtp.ts              - SMTP client
/lib/email/templates.tsx        - React Email templates
/lib/email/ics-generator.ts     - .ics fájl generálás
/api/cron/daily-summary/route.ts - Vercel Cron endpoint
```

---

### ✅ Sprint 5: Audit Végrehajtás UI (ELKÉSZÜLT)
**Miért fontos**: Az auditor-oknak kell egy UI ahol végig tudnak menni a checklist-en

#### Követelmények:
- Mobile-first design (telefon/tablet) ✅
- Check description/instructions ✅
- Real-time mentés ✅
- Kép feltöltés NOK esetén ✅
- Continue audit feature ✅

#### Feladatok:
- [x] Audit végrehajtás oldal (`/audits/[auditId]/execute`)
- [x] Checklist UI (OK/NOK gombok)
- [x] Timer (startTime → endTime)
- [x] Progress bar
- [x] NOK case: komment + kép kötelező
- [x] Continue audit feature (resume in-progress)

**Dokumentáció**: `AUDIT_FOLYTATAS_FEATURE.md`, `CHECK_DESCRIPTION_FEATURE.md`

**User Flow**:
```
1. Auditor bejelentkezik
2. Látja a kijelölt audit-okat: "Saját Audit-jaim"
3. Klikk "Ellenőrzés indítása"
   → startTime rögzítés
4. Végigmegy a checklist pontokon:
   - Pont szövege + referencia kép (ha van)
   - OK gomb (zöld) | NOK gomb (piros)
   - Ha NOK:
     * Komment textarea (kötelező)
     * Kép feltöltés (kötelező)
5. "Ellenőrzés befejezése"
   → endTime rögzítés
   → status = 'completed'
6. Összefoglaló oldal
```

**Fájlok**:
```
/audits/page.tsx                      - Saját audit-ok lista
/audits/[auditId]/page.tsx            - Részletek
/audits/[auditId]/execute/page.tsx    - Végrehajtás UI
/components/ChecklistItem.tsx         - Egyetlen check UI
/components/AuditTimer.tsx            - Timer komponens
```

**Offline Support**:
```typescript
// Service Worker
self.addEventListener('fetch', (event) => {
  if (isAuditRequest(event.request)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
  }
});

// IndexedDB
const db = await openDB('audit-cache', 1);
await db.put('audits', auditData, auditId);
```

---

### Sprint 6: Fixer Szerepkör (tisztázás után)
**Probléma**: Az üzleti logika nem tisztázott

#### Kérdések stakeholder-eknek:
1. Mi a Fixer fő feladata?
   - Javítja a NOK pontokat?
   - Látja az összes NOK-ot?
   - Van külön dashboard-ja?

2. Workflow:
   - Audit befejezés után automatikusan kap értesítést?
   - Manuálisan kell kijelölni a feladatokat?

3. Jogosultságok:
   - Látja az összes audit-ot?
   - Módosíthatja az audit eredményeket?
   - Hozzáfér a területekhez?

#### Lehetséges implementációk:

**Verzió A: Fixer Dashboard**
```
/fixer/page.tsx - NOK pontok listája
/fixer/tasks/[taskId]/page.tsx - Feladat részletek
/fixer/tasks/[taskId]/resolve - Feladat megoldása
```

**Verzió B: Fixer = Extended Auditor**
```
- Minden auditor jogosultság
- + NOK pontok kezelése
- + Javítási workflow
```

---

## 📅 Időbecslés

| Sprint | Funkció | Becsült idő | Prioritás |
|--------|---------|-------------|-----------|
| 1 | Képfeltöltés | 1-2 nap | 🔴 MOST |
| 2 | Audit CRUD | 2-3 nap | 🔴 Sürgős |
| 3 | Audit Ütemezés | 3-4 nap | 🟡 Fontos |
| 4 | Email Integráció | 2-3 nap | 🟡 Fontos |
| 5 | Audit Végrehajtás UI | 3-4 nap | 🟡 Fontos |
| 6 | Fixer Szerepkör | 2-3 nap | 🟢 Later |

**Össz idő**: 13-19 nap (~3-4 hét)

---

## 🚀 Következő Lépések

### Most azonnal (Sprint 1):
1. **GridFS Upload API**
   - POST `/api/upload` - Kép feltöltés
   - GET `/api/upload/[fileId]` - Kép letöltés
   - DELETE `/api/upload/[fileId]` - Kép törlés

2. **ImageUpload Komponens**
   - Drag & drop
   - File validation (size, type)
   - Preview

3. **Check Form Integráció**
   - Referencia kép feltöltés opció
   - Kép preview
   - Kép törlés

**Kezdjük?** 🚀


