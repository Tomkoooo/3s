# Audit Implementáció Terv

## 📋 Hiányzó Oldalak Struktúra

### Általános (Minden User)
```
/                           - Dashboard (összefoglaló)
/audits                     - Saját audit-ok listája
/audits/[auditId]          - Audit részletek
/audits/[auditId]/execute  - Audit végrehajtás (később)
/calendar                   - Saját audit-ok naptárban
```

### Adminisztráció (Csak Admin)
```
/admin/audits              - Összes audit kezelés
/admin/audits/create       - Új audit létrehozás
/admin/audits/[auditId]    - Audit szerkesztés/részletek
/admin/audits/schedule     - Tömeges ütemezés (később)
/admin/calendar            - Globális naptár (összes audit)
```

---

## 🎯 Sprint 2: Audit CRUD - Implementációs Sorrend

### Fázis 1: Backend (Server Actions)
**Fájl**: `/admin/audits/actions.ts`

#### Műveletek:
```typescript
// 1. Audit lista lekérés (szűrőkkel)
getAudits(filters: {
  siteId?: string,
  auditorId?: string,
  dateFrom?: string,
  dateTo?: string,
  status?: 'scheduled' | 'in_progress' | 'completed'
})

// 2. Audit létrehozás
createAuditAction(formData: FormData)
  - siteId (required)
  - participantIds[] (required, min 1)
  - onDate (required)

// 3. Audit részletek
getAuditById(auditId: string)

// 4. Audit módosítás
updateAuditAction(auditId: string, formData: FormData)
  - participantIds[]
  - onDate

// 5. Audit törlés
deleteAuditAction(auditId: string)

// 6. Saját audit-ok
getMyAudits(userId: string)
```

---

### Fázis 2: Admin UI

#### 1. Audit Lista Oldal
**Fájl**: `/admin/audits/page.tsx`

**Funkciók**:
- Táblázat: Site, Dátum, Auditorok, Státusz, Műveletek
- Szűrők: Site, Auditor, Dátum, Státusz
- "Új audit" gomb
- Státusz badge: scheduled (kék), in_progress (sárga), completed (zöld)

**Táblázat oszlopok**:
```
| Terület | Dátum | Auditorok | Státusz | Műveletek |
|---------|-------|-----------|---------|-----------|
| Raktár A > Polc 1 | 2025-01-15 | John, Jane | Scheduled | [Részletek] [Törlés] |
```

#### 2. Audit Létrehozás Oldal
**Fájl**: `/admin/audits/create/page.tsx`

**Form mezők**:
```typescript
<form>
  // Site kiválasztás (hierarchikus select)
  <SiteSelect 
    name="siteId"
    filter={(site) => site.level === 2} // Csak legalsó szint
  />
  
  // Auditor kiválasztás (multi-select)
  <AuditorSelect 
    name="participantIds"
    multiple
    min={1}
  />
  
  // Dátum kiválasztás
  <DatePicker 
    name="onDate"
    min={today}
  />
  
  <Button type="submit">Létrehozás</Button>
</form>
```

**Validációk**:
- Site: kötelező, level 2 (legalsó szint)
- Participants: minimum 1 auditor
- Date: jövőbeli dátum

#### 3. Audit Részletek Oldal
**Fájl**: `/admin/audits/[auditId]/page.tsx`

**Megjelenített info**:
```
Terület: Raktár A > A1 Zóna > Polc 1
Dátum: 2025-01-15
Státusz: Scheduled

Résztvevők:
- John Doe (john@example.com)
- Jane Smith (jane@example.com)

Ellenőrzési Pontok: 12 db
- Biztonsági ajtó működőképes
- Tűzoltó készülék használható
- ... (lista)

Időzítés:
- Kezdés: - (még nem indult)
- Befejezés: - (még nem fejeződött be)
- Időtartam: -

[Szerkesztés] [Törlés]
```

---

### Fázis 3: User UI

#### 1. Dashboard Oldal
**Fájl**: `/page.tsx`

**Tartalom**:
```typescript
// Admin Dashboard
- Összes audit: 45
- Mai audit-ok: 5
- Folyamatban: 2
- Várakozó: 28

// User/Auditor Dashboard
- Saját audit-jaim: 8
- Mai ellenőrzések: 2
- Befejezett: 6
- Következő: 2025-01-15

// Gyors linkek
- [Új ellenőrzés indítása]
- [Naptár megtekintése]
- [Korábbi ellenőrzések]
```

#### 2. Saját Audit-ok Oldal
**Fájl**: `/audits/page.tsx`

**Funkciók**:
- Csak saját audit-ok (ahol részt vesz)
- Filter: státusz, dátum
- Card layout (mobile-friendly)

**Card példa**:
```
┌─────────────────────────────────────┐
│ 📍 Raktár A > Polc 1                │
│ 📅 2025-01-15                        │
│ 🟢 Scheduled                         │
│                                      │
│ Résztvevők: John, Jane              │
│ Ellenőrzési pontok: 12 db            │
│                                      │
│ [Részletek] [Ellenőrzés indítása]   │
└─────────────────────────────────────┘
```

#### 3. Naptár Nézetek

**Admin Globális Naptár**
**Fájl**: `/admin/calendar/page.tsx`
- Összes audit-ot mutat
- Month/Week/Day view
- Klikk → audit részletek

**User Saját Naptár**
**Fájl**: `/calendar/page.tsx`
- Csak saját audit-ok
- Month/Week view
- Klikk → audit részletek

---

## 📦 Komponensek

### 1. SiteSelect Komponens
**Fájl**: `/components/SiteSelect.tsx`

```typescript
type SiteSelectProps = {
  name: string;
  value?: string;
  onChange?: (siteId: string) => void;
  filter?: (site: Site) => boolean;
  required?: boolean;
};

export default function SiteSelect({ 
  name, 
  value, 
  onChange,
  filter = () => true,
  required 
}: SiteSelectProps) {
  // Hierarchikus select: Level 0 > Level 1 > Level 2
  // TreeView vagy nested select
}
```

### 2. AuditorSelect Komponens
**Fájl**: `/components/AuditorSelect.tsx`

```typescript
type AuditorSelectProps = {
  name: string;
  value?: string[];
  onChange?: (auditorIds: string[]) => void;
  multiple?: boolean;
  min?: number;
  excludeBreaks?: boolean; // Kiszűri akik szabin vannak
  date?: string; // Melyik napra nézve (break ellenőrzéshez)
};

export default function AuditorSelect({ 
  name, 
  value = [], 
  onChange,
  multiple = false,
  min = 0,
  excludeBreaks = false,
  date
}: AuditorSelectProps) {
  // Multi-select auditor-ok
  // Checkbox vagy multi-select dropdown
  // Ha excludeBreaks: szűrés Break alapján
}
```

### 3. AuditCard Komponens
**Fájl**: `/components/AuditCard.tsx`

```typescript
type AuditCardProps = {
  audit: {
    id: string;
    site: { name: string; fullPath: string };
    onDate: string;
    status: string;
    participants: { name: string }[];
    checkCount: number;
  };
  onView?: () => void;
  onExecute?: () => void;
  showActions?: boolean;
};

export default function AuditCard({ audit, onView, onExecute, showActions }: AuditCardProps) {
  // Mobile-friendly card
  // Színes státusz badge
  // Quick actions
}
```

### 4. StatusBadge Komponens
**Fájl**: `/components/StatusBadge.tsx`

```typescript
type StatusBadgeProps = {
  status: 'scheduled' | 'in_progress' | 'completed';
};

const statusConfig = {
  scheduled: { label: 'Ütemezve', color: 'blue' },
  in_progress: { label: 'Folyamatban', color: 'yellow' },
  completed: { label: 'Befejezett', color: 'green' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  // Színes badge
}
```

---

## 🗄️ Adatbázis Kiegészítések

### Audit Model Javítások
Jelenleg:
```typescript
export type IAudit = {
    site: ObjectId;
    participants: ObjectId[];
    onDate: Date;
    startTime?: Date;
    endTime?: Date;
    status: 'scheduled' | 'in_progress' | 'completed'; // virtual
    result: IAuditResult[];
}
```

**Kiegészítés**:
```typescript
// Nincs változtatás szükséges!
// A model tökéletes, csak a virtual field-ek használata
```

**Indexek** (már megvannak):
```typescript
auditSchema.index({ site: 1, onDate: 1 });
auditSchema.index({ participants: 1, onDate: 1 });
auditSchema.index({ onDate: 1 });
```

---

## 🔄 Implementációs Flow

### 1. Backend Setup (30 perc)
```typescript
// src/app/admin/audits/actions.ts
export async function getAudits(filters) { ... }
export async function createAuditAction(formData) { ... }
export async function getAuditById(id) { ... }
export async function updateAuditAction(id, formData) { ... }
export async function deleteAuditAction(id) { ... }

// src/app/audits/actions.ts  
export async function getMyAudits(userId) { ... }
```

### 2. Komponensek (1 óra)
```typescript
// src/components/SiteSelect.tsx
// src/components/AuditorSelect.tsx
// src/components/AuditCard.tsx
// src/components/StatusBadge.tsx
```

### 3. Admin Oldalak (2-3 óra)
```typescript
// src/app/admin/audits/page.tsx - Lista
// src/app/admin/audits/create/page.tsx - Létrehozás
// src/app/admin/audits/[auditId]/page.tsx - Részletek
```

### 4. User Oldalak (1-2 óra)
```typescript
// src/app/page.tsx - Dashboard
// src/app/audits/page.tsx - Saját audit-ok
// src/app/audits/[auditId]/page.tsx - Részletek
```

### 5. Naptár (később, opcionális)
```typescript
// src/app/admin/calendar/page.tsx
// src/app/calendar/page.tsx
// Komponens: react-big-calendar vagy egyedi
```

---

## 🎨 UI/UX Design Notes

### Színkódok
```css
scheduled:   bg-blue-100 text-blue-800
in_progress: bg-yellow-100 text-yellow-800
completed:   bg-green-100 text-green-800
```

### Mobile-first
- Card layout kis képernyőn
- Táblázat nagy képernyőn
- Hamburger menu navigáció

### Gyors műveletek
- "Ellenőrzés indítása" gomb (scheduled → in_progress)
- "Befejezés" gomb (in_progress → completed)
- Quick filters (ma, holnap, ezen a héten)

---

## 📅 Időbecslés

| Fázis | Feladat | Idő |
|-------|---------|-----|
| 1 | Backend (server actions) | 1-2 óra |
| 2 | Komponensek | 1-2 óra |
| 3 | Admin oldalak | 2-3 óra |
| 4 | User oldalak | 1-2 óra |
| 5 | Dashboard | 30 perc |
| 6 | Polish & testing | 1 óra |

**Össz**: 6-10 óra (1-2 munkanap)

---

## 🚀 Most Kezdjük

**1. lépés**: Audit server actions (backend)
**2. lépés**: SiteSelect és AuditorSelect komponensek
**3. lépés**: Admin audit lista oldal
**4. lépés**: Admin audit létrehozás oldal

**Kezdhetjük az actions.ts-sel?** 🔥



