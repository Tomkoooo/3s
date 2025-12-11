# Audit Scheduling Feature - Teljes Implementáció

**Dátum:** 2025-11-05  
**Sprint:** Sprint 3 - Audit Ütemezés Algoritmus  
**Státusz:** ✅ Teljes funkcionalitással elkészült

---

## 🎯 Probléma és Megoldás

### Igény
Admin usernek képesnek kell lennie **tömegesen, automatikusan** generálni audit-okat több területre és több időszakra, rotation algoritmus szerint auditorok hozzárendelésével.

**Manuális létrehozás problémái:**
- Időigényes (minden audit külön létrehozása)
- Hajlamos a hibákra (elfelejtett területek, dátumok)
- Nem fair az auditor rotáció (mindig ugyanazok kapják)
- Nem veszi figyelembe a szüneteket (Break model)

### Megoldás: Automatikus Ütemező Rendszer

**Főbb funkciók:**
1. ✅ **Bulk audit generation** - Több terület × több dátum egyszerre
2. ✅ **Auditor rotation** - Справедливый rotation algoritmus
3. ✅ **Break awareness** - Szünetes auditorok kihagyása
4. ✅ **Conflict detection** - Max audits/day/auditor limit
5. ✅ **Preview before create** - Előnézet + megerősítés
6. ✅ **Flexible frequency** - Napi, heti, havi ütemezés

---

## 🏗️ Architektúra

### 1. Core Library (`src/lib/audit-scheduler.ts`)

**Fő algoritmusok:**

#### `getAvailableAuditorsForDate(date, auditorPool?)`
- Lekéri az elérhető auditorokat egy adott dátumra
- Figyelembe veszi a Break model-t (szünet időszakok)
- Opcionális auditor pool filter

```typescript
const availableAuditors = await getAvailableAuditorsForDate(
    new Date('2025-11-15'),
    ['auditor1', 'auditor2'] // Opcionális pool
);
// Returns: [{ _id, fullName, email, role }, ...]
```

#### `getAuditorAuditCountForDate(auditorId, date)`
- Számlálja egy auditor audit-jait egy napon
- Max audits/day limit ellenőrzéshez használva

#### `AuditorRotation` Class
- **Round-robin rotation** algoritmus
- Fair distribution (felváltva oszt)
- Auto-reset a pool végén

```typescript
const rotation = new AuditorRotation(auditors);
const nextAuditor = rotation.next(1); // Következő 1 auditor
const nextTwo = rotation.next(2);      // Következő 2 auditor
```

#### `generateDates(startDate, endDate, frequency)`
- Generál dátum array-t a frequency szerint
- **daily**: Minden nap
- **weekly**: Hetente ugyanazon a napon
- **monthly**: Havonta ugyanazon a napon

```typescript
generateDates(
    new Date('2025-11-01'),
    new Date('2025-11-30'),
    'weekly'
);
// Returns: [2025-11-01, 2025-11-08, 2025-11-15, 2025-11-22, 2025-11-29]
```

#### `generateAuditPreview(config)`
- Generál preview-t (NEM hoz létre audit-okat)
- Ellenőrzi a konfliktusokat
- Returns: `{ previews, conflicts }`

#### `createAuditsFromPreview(previews)`
- Létrehozza az audit-okat a preview alapján
- Ellenőrzi a duplikációkat
- Automatikusan másolja a check-eket a site-ról

#### `scheduleAudits(config)` - Main function
- Kombinálja a preview és create műveleteket
- One-shot scheduling (preview + create együtt)

---

### 2. Server Actions (`src/app/admin/audits/schedule/actions.ts`)

#### `getSchedulableSites()`
- Level 2 site-ok lekérése (amelyeknek vannak check-jei)
- Admin jogosultság ellenőrzés
- Returns: `[{ _id, name, checksCount }, ...]`

#### `getAvailableAuditors()`
- Auditor és admin role-ú userek lekérése
- Returns: `[{ _id, fullName, email, role }, ...]`

#### `generateSchedulePreviewAction(...)`
- Preview generálás server action-ként
- Validáció (dates, sites, auditors)
- Date serialization (Date → ISO string)

#### `createScheduledAuditsAction(previews)`
- Audit-ok létrehozása megerősítés után
- Revalidation (`/admin/audits`, `/audits`)

#### `quickScheduleAuditsAction(...)`
- Preview + create one-step
- Gyors ütemezéshez (ha nincs szükség preview-ra)

---

### 3. Schedule UI (`src/app/admin/audits/schedule/page.tsx`)

**Client-side React komponens** két nézettel:

#### Configuration View (Alapértelmezett)
**Layout:** 2 oszlopos grid
- **Bal oldal:** Site selection
  - Checkbox lista (scroll-olható)
  - "Mind" / "Törlés" gombok
  - Kiválasztott sites count
  
- **Jobb oldal:** Configuration
  - Date range picker (kezdő, záró dátum)
  - Frequency selector (napi/heti/havi)
  - Auditors per audit (1-5)
  - Max audits/day (optional limit)
  - Auditor pool selection (optional filter)

**Validáció:**
- Kezdő dátum nem lehet múltbeli
- Záró dátum >= kezdő dátum
- Min. 1 site kiválasztva
- Min. 1 auditor per audit

**"Előnézet Generálása" gomb:**
- Disabled ha nincs site kiválasztva
- isPending state (loading indicator)

#### Preview View (Előnézet után)
**Komponensek:**
1. **Conflicts Banner** (ha van konfliktus)
   - Sárga alert box
   - Konfliktusok listája (max 10 megjelenítve)
   - Példa: "2025-11-15: Nem elegendő auditor (szükséges: 2, elérhető: 1)"

2. **Preview Table**
   - 3 oszlop: Terület, Dátum, Auditorok
   - Scroll-olható (max-height: 96)
   - Sortable by date (newest first)

3. **Action Buttons**
   - "Vissza a beállításokhoz" - Edit config
   - "N Audit Létrehozása" - Confirm creation

**Final Confirmation:**
- Browser confirm dialog
- "Biztos vagy benne, hogy létrehozod a X audit-ot?"
- Után redirect → `/admin/audits`

---

## 📊 Használati Forgatókönyvek

### 1. Heti Audit Ütemezés (Egyszerű)
**Cél:** Minden területhez heti audit a következő hónapra

**Lépések:**
1. Menj: `/admin/audits/schedule`
2. Sites: Klikk "Mind" (összes terület)
3. Kezdő dátum: 2025-12-01
4. Záró dátum: 2025-12-31
5. Frequency: **Heti**
6. Auditors per audit: **1**
7. Max audits/day: (üresen hagyva)
8. Auditor pool: (üresen hagyva - mind)
9. Klikk "Előnézet Generálása"
10. Ellenőrizd a preview-t
11. Klikk "X Audit Létrehozása"

**Eredmény:**
- 5 site × 5 hét = **25 audit** létrehozva
- Auditorok round-robin szerint hozzárendelve
- Szünetes auditorok kihagyva

---

### 2. Napi Audit Kiválasztott Területekre
**Cél:** Kritikus területek napi ellenőrzése 2 hét alatt

**Lépések:**
1. Sites: Csak 2-3 kritikus területet kiválasztva
2. Frequency: **Napi**
3. Auditors per audit: **2** (két auditor együtt)
4. Max audits/day: **3** (egy auditor max 3 audit/nap)
5. Előnézet → Létrehozás

**Eredmény:**
- 3 site × 14 nap = 42 audit
- Mindegyikhez 2 auditor hozzárendelve
- Auditorok max 3 audit-ot kapnak naponta

---

### 3. Havi Audit Adott Auditor Csapattal
**Cél:** Szakértő csapat havi auditjai

**Lépések:**
1. Sites: Összes (vagy kiválasztott)
2. Frequency: **Havi**
3. Auditor pool: Csak 3-4 auditor kiválasztva
4. Auditors per audit: **1**
5. Előnézet → Létrehozás

**Eredmény:**
- Csak a kiválasztott auditorok kapnak audit-ot
- Rotation a pool-on belül

---

### 4. Conflict Detection Demo
**Szcenárió:**
- 5 site
- 7 napra ütemezve (daily)
- Csak 2 auditor elérhető
- Max 3 audit/day/auditor

**Mi történik:**
1. Előnézet generálás
2. Konfliktusok megjelennek:
   ```
   2025-11-15: Nem elegendő auditor (szükséges: 1, elérhető: 0)
   2025-11-16: Max audits/day limit elérve auditor1 esetében
   ```
3. Csak az **ütközésmentes** audit-ok kerülnek a preview-ba
4. Admin látja a konfliktusokat és módosíthatja a beállításokat

---

## 🔧 Üzleti Logika Részletesen

### 1. Rotation Algorithm (Round-Robin)

**Példa 4 auditor, 10 site esetén:**
```
Auditor Pool: [A, B, C, D]

Site 1 → A
Site 2 → B
Site 3 → C
Site 4 → D
Site 5 → A (újra A, mert végigértünk)
Site 6 → B
...
Site 10 → B
```

**Több auditor/audit esetén:**
```
Auditors per audit = 2

Site 1 → [A, B]
Site 2 → [C, D]
Site 3 → [A, B]
...
```

**Előnyök:**
- ✅ Fair distribution
- ✅ Minden auditor kb. ugyanannyi audit-ot kap
- ✅ Predictable pattern

---

### 2. Break Awareness

**Működés:**
1. Query a `Break` collection-ből az adott dátumra:
   ```typescript
   const breaksOnDate = await Break.find({
       start: { $lte: dayEnd },
       $or: [{ end: { $gte: dayStart } }, { end: null }]
   });
   ```
2. Kiszűri a szünetes auditorokat
3. Csak a maradék auditorok kerülnek a rotation pool-ba

**Példa:**
- Auditors: [A, B, C, D]
- 2025-11-15-re B-nek van szünete
- Available auditors: [A, C, D]
- Rotation ezekkel történik

---

### 3. Max Audits Per Day Limit

**Célja:** Egy auditor ne legyen túlterhelve egy napon

**Algoritmus:**
1. Minden auditor hozzárendelés előtt ellenőrzi:
   ```typescript
   const count = await getAuditorAuditCountForDate(auditor._id, date);
   if (count >= maxAuditsPerDay) {
       // Skip this auditor
   }
   ```
2. Ha egy auditor elérte a limitet, a következő auditor jön
3. Ha **minden** auditor elérte → conflict

**Példa:**
- Max: 2 audit/day
- 5 site ugyanarra a napra
- 3 auditor
- Lehetséges: 3 × 2 = **6 audit** (de csak 5-öt kérünk, OK)

---

### 4. Duplicate Detection

**Probléma:** Ne hozzunk létre duplikált audit-ot (ugyanaz a site + dátum)

**Megoldás:**
```typescript
const existing = await Audit.findOne({
    site: preview.siteId,
    onDate: preview.date,
});

if (existing) {
    skipped++;
    conflicts.push('Már létezik audit erre a napra');
    continue;
}
```

**Eredmény:** Ha már van audit, az kimarad és conflict message

---

## 🎨 UI/UX Design

### Color Scheme
```css
Primary Button:    bg-primary (kék)
Outline Button:    border-primary (kék)
Conflict Banner:   bg-yellow-50, border-yellow-200, text-yellow-800
Preview Table:     border-gray-200, hover:bg-gray-50
```

### Responsive Layout
- **Desktop (lg+):** 3-column grid (sites | config span-2)
- **Tablet (md):** 2-column grid
- **Mobile:** 1-column stack

### Loading States
- `isPending` state minden async action-nél
- Disable buttons loading közben
- Loading text: "Generálás...", "Létrehozás..."

### Empty States
```
Sites = 0:
  "Nincsenek ütemezhető területek"
  (Level 2 sites with checks szükségesek)

Preview = 0 (after generation):
  "Nincs audit generálva. Ellenőrizd a beállításokat."
```

---

## 📝 API Reference

### ScheduleConfig Type
```typescript
type ScheduleConfig = {
    siteIds: string[];              // Sites to schedule
    startDate: Date;                // Start date
    endDate: Date;                  // End date
    frequency: 'daily' | 'weekly' | 'monthly';
    auditorPool?: string[];         // Optional auditor filter
    auditorsPerAudit: number;       // Auditors per audit (default: 1)
    maxAuditsPerDay?: number;       // Max audits/auditor/day (optional)
    respectBreaks: boolean;         // Consider breaks (default: true)
};
```

### AuditPreview Type
```typescript
type AuditPreview = {
    siteId: string;
    siteName: string;
    date: Date; // ISO string when serialized
    auditors: Array<{
        _id: string;
        fullName: string;
        email: string;
    }>;
};
```

### ScheduleResult Type
```typescript
type ScheduleResult = {
    success: boolean;
    auditsCreated?: number;
    auditsSkipped?: number;
    conflicts?: string[];
    message?: string;
};
```

---

## 🧪 Tesztelési Útmutató

### 1. Basic Scheduling Test
**Setup:**
- 3 site (level 2, with checks)
- 2 auditor (no breaks)
- 1 hét időszak, weekly frequency

**Lépések:**
1. Select all 3 sites
2. Start: ma, End: +7 days
3. Frequency: weekly
4. Auditors per audit: 1
5. Generate preview
6. **Ellenőrzés:** 3 audit preview (1 site = 1 audit)
7. Create audits
8. **Ellenőrzés:** `/admin/audits`-en 3 új audit látható

---

### 2. Rotation Test
**Setup:**
- 6 site
- 3 auditor (A, B, C)

**Lépések:**
1. Schedule 6 site, 1 day, auditors per audit = 1
2. Preview ellenőrzés:
   ```
   Site 1 → A
   Site 2 → B
   Site 3 → C
   Site 4 → A (rotation restart)
   Site 5 → B
   Site 6 → C
   ```

---

### 3. Break Awareness Test
**Setup:**
- 2 site
- 3 auditor (A, B, C)
- B-nek van break 2025-11-15-re

**Lépések:**
1. Schedule 2 site 2025-11-15-re
2. Preview:
   ```
   Site 1 → A (B kihagyva)
   Site 2 → C
   ```
3. **Ellenőrzés:** B NEM jelenik meg egyik audit-ban sem

---

### 4. Max Audits/Day Test
**Setup:**
- 5 site
- 2 auditor (A, B)
- Max 2 audits/day

**Lépések:**
1. Schedule 5 site, same day
2. Preview:
   ```
   Site 1 → A
   Site 2 → B
   Site 3 → A
   Site 4 → B
   (A és B mindkét elérte limitet)
   ```
3. Conflict: "2025-11-15: Nem elegendő auditor (szükséges: 1, elérhető: 0)"
4. Csak 4 audit kerül a preview-ba

---

### 5. Duplicate Detection Test
**Setup:**
- 1 site
- Már létezik audit erre a site-ra 2025-11-20-ra

**Lépések:**
1. Schedule ugyanazt a site-ot 2025-11-20-ra
2. Preview: 1 audit
3. Create audits
4. **Conflict:** "Site X - 2025-11-20: Már létezik audit erre a napra"
5. auditsCreated = 0, auditsSkipped = 1

---

### 6. Frequency Test
**Daily:**
- Start: 2025-11-01, End: 2025-11-05
- Expected: 5 dates [11-01, 11-02, 11-03, 11-04, 11-05]

**Weekly:**
- Start: 2025-11-01, End: 2025-11-30
- Expected: ~4-5 dates [11-01, 11-08, 11-15, 11-22, 11-29]

**Monthly:**
- Start: 2025-11-01, End: 2026-02-01
- Expected: 4 dates [11-01, 12-01, 01-01, 02-01]

---

## 🚀 Production Checklist

- ✅ Core scheduler library implementálva
- ✅ Server actions implementálva (auth check included)
- ✅ UI implementálva (config + preview views)
- ✅ Navigation links hozzáadva (sidebar + admin audits page)
- ✅ Error handling (validation, conflicts, duplicate detection)
- ✅ Break awareness implementálva
- ✅ Rotation algorithm implementálva
- ✅ Max audits/day limit implementálva
- ✅ Responsive design
- ✅ Loading states
- ✅ Toast notifications
- ✅ Revalidation after creation
- ✅ No linter errors
- ✅ TypeScript strict mode compatible

**Státusz:** ✅ **Production Ready**

---

## 📂 Létrehozott Fájlok

1. ✅ `src/lib/audit-scheduler.ts` (426 lines)
   - Core scheduling algorithms
   - Rotation, breaks, conflicts

2. ✅ `src/app/admin/audits/schedule/actions.ts` (204 lines)
   - Server actions
   - Data fetching, preview, creation

3. ✅ `src/app/admin/audits/schedule/page.tsx` (449 lines)
   - Schedule UI
   - Config view + Preview view

4. ✅ `src/components/app-sidebar.tsx` (frissítve)
   - "Audit Ütemezés" link hozzáadva

5. ✅ `src/app/admin/audits/page.tsx` (frissítve)
   - "Ütemezés" quick action button

**Összesen:** 3 új fájl, 2 módosított fájl

---

## 🎯 Következő Lépések (Opcionális Fejlesztések)

### 1. Schedule Templates
**Cél:** Gyakran használt konfigurációk mentése

```typescript
type ScheduleTemplate = {
    name: string;
    config: ScheduleConfig;
    createdBy: ObjectId;
};
```

**UI:**
- "Sablon mentése" gomb config view-ban
- "Sablon betöltése" dropdown
- Template management oldal

---

### 2. Recurring Schedules (Cron-like)
**Cél:** Automatikus audit generálás időszakonként

```typescript
type RecurringSchedule = {
    name: string;
    config: ScheduleConfig;
    enabled: boolean;
    nextRun: Date;
};
```

**Implementation:**
- Vercel Cron job (daily)
- Ellenőrzi az aktív recurring schedule-okat
- Auto-generate audits

---

### 3. Conflict Resolution Suggestions
**Cél:** AI/heuristic javaslatok konfliktusok megoldására

**Példa:**
```
Conflict: Nem elegendő auditor 2025-11-15-re
Javaslat:
  1. Növeld a max audits/day limitet 2-ről 3-ra
  2. Adj hozzá több auditort a pool-hoz
  3. Oszd el a site-okat több napra
```

---

### 4. Audit History & Analytics
**Cél:** Statisztikák az audit eloszlásról

**Metrics:**
- Audits per auditor (pie chart)
- Audits per site (bar chart)
- Completion rate over time (line chart)

---

### 5. Email Notifications (Sprint 4)
**Cél:** Email értesítés az ütemezett audit-okról

**Implementation:**
- Audit létrehozás után email minden résztvevőnek
- .ics fájl melléklet (calendar integration)
- Napi összefoglaló email (cron)

---

## 📌 Megjegyzések

### Performance Considerations
- **Large schedules** (100+ audits): Preview lehet lassú
  - Megoldás: Pagination a preview table-ben
  - Megoldás: Async generation (job queue)

### Edge Cases
1. **Nincs auditor**: Conflict message
2. **Nincs site**: Disabled submit
3. **Past dates**: Validation error
4. **End < Start**: Validation error
5. **Site deleted közben**: Skipped, conflict message

### Security
- ✅ Admin role check minden action-nél
- ✅ JWT authentication required
- ❌ Rate limiting NINCS (TODO: később)

---

**Készítette:** AI Assistant  
**Igény:** User (tomko)  
**Implementáció időpontja:** 2025-11-05  
**Sprint:** 3 (Audit Ütemezés)  
**Státusz:** ✅ Teljes funkcionalitással elkészült és production ready


