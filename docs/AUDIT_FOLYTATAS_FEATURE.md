# Audit Folytatás Feature

**Dátum:** 2025-10-24  
**Feature:** In-progress audit-ok folytatása / megosztása több user között

---

## 🎯 Probléma

Jelenleg ha egy auditor elindít egy audit-ot és:
1. ❌ Kilép a böngészőből
2. ❌ Elfelejti folytatni
3. ❌ Más auditor szeretne csatlakozni

→ **Nincs lehetőség a folytatásra!** Az audit "beszorult" `in_progress` státuszban.

---

## ✅ Megoldás

### Új Funkciók

1. **"Folytatás" gomb**
   - Ha audit status = `in_progress` → "Folytatás" gomb jelenik meg
   - Ugyanaz a `/audits/[auditId]/execute` útvonal
   - Betölti a már meglévő eredményeket

2. **Meglévő eredmények betöltése**
   - Az `AuditExecutionClient` automatikusan betölti a már kitöltött check-eket
   - A `currentIndex` a következő kitöltetlen check-nél áll
   - A progress bar tükrözi az előrehaladást

3. **Többszörös indítás támogatása**
   - A `startAuditAction` már nem dob hibát `in_progress` esetén
   - A `startTime` nem változik (megőrzi az eredeti időt)

---

## 📝 Módosított Fájlok

### 1. User Audit Részletek (`src/app/audits/[auditId]/page.tsx`)

**Változások:**
```typescript
// Előtte:
const canExecute = audit.status === 'scheduled';

// Utána:
const canExecute = audit.status === 'scheduled' || audit.status === 'in_progress';
const isInProgress = audit.status === 'in_progress';
```

**UI elemek:**
- ✅ "Folytatás" gomb (`in_progress` esetén)
- ✅ Sárga info box: "Folyamatban: Ez az ellenőrzés jelenleg folyamatban van..."
- ✅ Gomb mindig látható `in_progress` esetén (dátumtól függetlenül)

---

### 2. Execute Entry Point (`src/app/audits/[auditId]/execute/page.tsx`)

**Változások:**
```typescript
// Előtte:
if (audit.status !== 'scheduled') {
    return <Error />;
}
if (!isToday) {
    return <Error />;
}

// Utána:
if (audit.status === 'completed') {
    return <Error message="Már befejezett" />;
}
const isInProgress = audit.status === 'in_progress';
if (!isToday && !isInProgress) {
    return <Error message="Még nem elérhető" />;
}
```

**Logika:**
- ✅ `in_progress` státusz engedélyezett
- ✅ `in_progress` esetén a dátum nem számít (bármikor folytatható)
- ❌ `completed` státusz továbbra is tiltott

---

### 3. Audit Execution Client (`src/app/audits/[auditId]/execute/AuditExecutionClient.tsx`)

**Változások:**

**3.1. Auto-start in_progress esetén:**
```typescript
const alreadyStarted = audit.status === 'in_progress' && audit.startTime;
const [isStarted, setIsStarted] = useState(alreadyStarted);
const [startTime, setStartTime] = useState<Date | null>(
    alreadyStarted ? new Date(audit.startTime!) : null
);
```

**3.2. Meglévő eredmények betöltése:**
```typescript
const initialResults = audit.result
    ?.filter((r: any) => r.pass !== undefined && r.pass !== null)
    .map((r: any) => ({
        checkId: r.check._id || r.check,
        pass: r.pass,
        comment: r.comment,
        imageId: r.image,
    })) || [];

const [results, setResults] = useState(initialResults);
const [currentIndex, setCurrentIndex] = useState(
    initialResults.length > 0 ? initialResults.length : 0
);
```

**Működés:**
1. Ha `in_progress` → **Automatikusan elindult állapot** (nincs "Indítás" gomb)
2. **Betöltés:** Minden már kitöltött check (ahol `pass !== null/undefined`)
3. **Folytatás:** A `currentIndex` a következő kitöltetlen check-nél kezdődik
4. **Progress bar:** Helyesen mutatja az előrehaladást (pl: 3/10)

---

### 4. Start Audit Action (`src/app/audits/[auditId]/execute/actions.ts`)

**Változások:**
```typescript
// Előtte:
if (audit.status !== 'scheduled') {
    return { success: false, message: 'Már nem indítható el' };
}

// Utána:
if (audit.status === 'completed') {
    return { success: false, message: 'Már be van fejezve' };
}
if (audit.status === 'in_progress') {
    return { success: true }; // Folytatás OK, ne módosítsuk a startTime-ot
}
```

**Logika:**
- ✅ `in_progress` esetén sikeres visszatérés (folytatás engedélyezve)
- ✅ **NEM módosítja a `startTime`-ot** (megőrzi az eredeti időt)
- ❌ `completed` esetén továbbra is tiltás

---

### 5. Audit Card (`src/components/AuditCard.tsx`)

**Változások:**
```typescript
// Előtte:
{audit.status === 'scheduled' && basePath === '/audits' && (
    <Button>Indítás</Button>
)}

// Utána:
{(audit.status === 'scheduled' || audit.status === 'in_progress') && basePath === '/audits' && (
    <Button>
        {audit.status === 'in_progress' ? 'Folytatás' : 'Indítás'}
    </Button>
)}
```

**UI változás:**
- Audit listán (`/audits`) megjelenik a "Folytatás" gomb `in_progress` audit-oknál
- Sárga státusz badge (`in_progress`)

---

## 🎮 Használati Forgatókönyvek

### 1. Auditor kilép és visszajön
1. **Indítás:** Auditor elindítja az audit-ot → `status: in_progress`, `startTime` rögzítve
2. **Kitölt 3 check-et** → `result[0-2].pass = true/false`
3. **Kilép** (bezárja böngészőt)
4. **Visszajön:** `/audits` → látja a kártyán "Folytatás" gombot
5. **Folytatás:** Kattint → Checklist betöltődik 4. check-től folytatva ✅

### 2. Két auditor együtt dolgozik
1. **Auditor A** elindítja az audit-ot
2. **Kitölt 5 check-et**
3. **Auditor B** (szintén résztvevő) megnyitja ugyanazt az audit-ot
4. **Látja:** "Folytatás" gomb
5. **Folytatja:** 6. check-től kezdve tudja folytatni
6. **Mentés:** Mindkét auditor eredményei megmaradnak ✅

### 3. Admin felügyelet
1. Admin megtekinti az audit részleteit
2. Látja: státusz = "Folyamatban" (sárga)
3. Látja: már kitöltött check-ek eredményeit
4. Admin is folytathatja (ha résztvevő)

---

## ⚠️ Fontos Megjegyzések

### Konkurencia (Race Condition)
- ❌ **Nincs real-time sync** (nincs WebSocket)
- ⚠️ Ha két user **egyidejűleg** dolgozik, az **utolsó mentés** felülírja a másikat
- 💡 **Megoldás (később):**
  - Optimistic locking (version field)
  - WebSocket real-time sync
  - "Valaki már dolgozik rajta" figyelmeztetés

### Progress Megtartás
- ✅ Minden mentéskor (`submitAuditResultAction`) az **összes eredmény** mentődik
- ✅ Részleges eredmények **perzisztálódnak**
- ✅ Browser crash után is folytatható

### StartTime Megőrzés
- ✅ Az eredeti `startTime` **nem változik** folytatáskor
- ✅ A `endTime - startTime` **valós időtartamot** mutat
- ❌ Nincs "pause" funkció (szüneteltetés)

---

## 🧪 Tesztelési Lépések

### Teszt 1: Kilépés és folytatás
1. Indíts el egy audit-ot
2. Tölts ki 2-3 check-et
3. **KILÉPÉS:** Zárd be a böngésző fület (NE fejezd be!)
4. Nyisd meg újra: `/audits`
5. **ELLENŐRZÉS:** A kártya státusza "Folyamatban" (sárga)
6. **ELLENŐRZÉS:** "Folytatás" gomb látható
7. Kattints "Folytatás"
8. **ELLENŐRZÉS:** Az első 2-3 check már ki van töltve
9. **ELLENŐRZÉS:** A progress bar helyesen mutatja (pl: 3/10)
10. Fejezd be az audit-ot
11. **ELLENŐRZÉS:** Minden eredmény megmaradt

### Teszt 2: Többszörös folytatás
1. Indíts el egy audit-ot
2. Tölts ki 1 check-et
3. Kattints vissza → "Folytatás"
4. Tölts ki még 1 check-et
5. Kattints vissza → "Folytatás"
6. **ELLENŐRZÉS:** Mind a 2 check kitöltve van

### Teszt 3: Több user
1. **User A:** Indítás → Kitölt 3 check-et → Kilép
2. **User B:** (szintén résztvevő) Belép → "Folytatás"
3. **ELLENŐRZÉS:** User B látja User A eredményeit
4. **User B:** Kitölt még 2 check-et → Befejezés
5. **ELLENŐRZÉS:** Mind az 5 check megvan

### Teszt 4: Admin nézet
1. User indít egy audit-ot → Kitölt 2 check-et → Kilép
2. **Admin:** `/admin/audits/[id]`
3. **ELLENŐRZÉS:** Látható a 2 kitöltött check eredménye
4. **ELLENŐRZÉS:** Státusz = "Folyamatban"

---

## 📊 Összefoglaló

| Feature | Előtte | Utána |
|---------|---------|-------|
| In-progress audit megnyitás | ❌ Hibaüzenet | ✅ "Folytatás" gomb |
| Eredmények betöltése | ❌ Mindig újrakezdi | ✅ Betölti meglévőket |
| Többszörös indítás | ❌ Error | ✅ OK (startTime megmarad) |
| Kilépés után folytatás | ❌ Lehetetlen | ✅ Működik |
| Több user együttműködés | ❌ Lehetetlen | ✅ Működik (óvatosan!) |
| Progress tracking | ❌ Mindig 0/N | ✅ Helyes (M/N) |

**Státusz:** ✅ Elkészült és tesztelve

---

**Készítette:** AI Assistant  
**Feature Request:** User (tomko)  
**Implementáció ideje:** 2025-10-24



