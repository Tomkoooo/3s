# Területkezelés Javítások

## 🐛 Javított Problémák

### 1. Alterület Létrehozás Hiba
**Probléma**: Amikor egy területből alterületet akartam létrehozni, mindig top-level területként jött létre.

**Ok**: A `/admin/sites/create/page.tsx` nem dolgozta fel a query paramétereket (`parentId`, `level`).

**Megoldás**:
```typescript
// ELŐTTE ❌
export default function CreateSitePage() {
    return <SiteForm /> // Nincs parentId és level
}

// UTÁNA ✅
export default async function CreateSitePage({ searchParams }) {
    const params = await searchParams;
    const parentId = params.parentId;
    const level = params.level ? parseInt(params.level) : 0;
    
    return (
        <SiteForm 
            parentId={parentId} 
            initialLevel={level}
            mode="create"
        />
    );
}
```

**Link amely átadja a paramétereket**:
```typescript
// sites-editor.tsx
<Link href={`/admin/sites/create?parentId=${site._id}&level=${level + 1}`}>
    <Button>Alterület hozzáadása</Button>
</Link>
```

### 2. Admin Role Check
**Probléma**: Nincs explicit admin role ellenőrzés a területkezelés oldalakon.

**Megoldás**: Az `/admin/layout.tsx` **már védi** az összes `/admin/*` route-ot!

```typescript
// src/app/admin/layout.tsx
export default async function AdminLayout({ children }) {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
        redirect('/login');
    }

    if (currentUser.role !== 'admin') {
        notFound(); // 404 nem admin usereknek
    }

    return <>{children}</>;
}
```

**Védett route-ok**:
- ✅ `/admin/sites` - Területek lista
- ✅ `/admin/sites/create` - Új terület/alterület
- ✅ `/admin/sites/[siteId]/checks/create` - Új ellenőrzési pont
- ✅ `/admin/users` - Felhasználók
- ✅ `/admin/breaks` - Szünetek
- ✅ Minden más `/admin/*` oldal

---

## 📋 Területek Hierarchia Működése

### Létrehozási Flow

#### 1. Top-level Terület (Level 0)
```
Navigáció: /admin/sites → "Új terület" gomb
URL: /admin/sites/create
Query params: NINCS
Form értékek:
  - parentId: undefined
  - level: 0
```

#### 2. Első Szintű Alterület (Level 1)
```
Navigáció: Terület kiválasztása → "Alterület hozzáadása" gomb
URL: /admin/sites/create?parentId=<TERÜLET_ID>&level=1
Query params: parentId, level
Form értékek:
  - parentId: <TERÜLET_ID>
  - level: 1
```

#### 3. Második Szintű Alterület (Level 2)
```
Navigáció: Alterület kiválasztása → "Alterület hozzáadása" gomb
URL: /admin/sites/create?parentId=<ALTERÜLET_ID>&level=2
Query params: parentId, level
Form értékek:
  - parentId: <ALTERÜLET_ID>
  - level: 2
```

### Validációs Szabályok

```typescript
// Server action validáció
if (parentId) {
    const parent = await Site.findById(parentId);
    
    // Parent nem lehet level 2
    if (parent.level === 2) {
        return { success: false, message: 'Harmadik szinthez nem adhatsz alterületet' };
    }
    
    // Level konzisztencia
    if (level !== parent.level + 1) {
        return { success: false, message: 'A szint nem egyezik a hierarchiával' };
    }
}
```

### UI Megkötések

```typescript
// sites-editor.tsx
{level < 2 && (
    <Link href={`/admin/sites/create?parentId=${site._id}&level=${level + 1}`}>
        <Button>Alterület hozzáadása</Button>
    </Link>
)}
```

- Level 0: Van "Alterület hozzáadása" gomb ✅
- Level 1: Van "Alterület hozzáadása" gomb ✅  
- Level 2: **NINCS** "Alterület hozzáadása" gomb ❌

---

## 🎯 Tesztelési Útmutató

### 1. Top-level Terület Létrehozása
```
1. Navigálj: /admin/sites
2. Klikk: "Új terület" gomb
3. Kitöltés: "Raktár A"
4. Mentés
✅ Elvárás: Létrejön level 0 területként
```

### 2. Alterület Létrehozása
```
1. Navigálj: /admin/sites
2. Válaszd ki: "Raktár A"
3. Klikk: "Alterület hozzáadása"
4. Kitöltés: "A1 Zóna"
5. Mentés
✅ Elvárás: 
   - Létrejön level 1 területként
   - parentId = Raktár A ID
   - Megjelenik a TreeView-ban "Raktár A" alatt
```

### 3. Második Szintű Alterület
```
1. Navigálj: /admin/sites
2. Nyisd ki: "Raktár A" → "A1 Zóna"
3. Válaszd ki: "A1 Zóna"
4. Klikk: "Alterület hozzáadása"
5. Kitöltés: "Polc 1"
6. Mentés
✅ Elvárás:
   - Létrejön level 2 területként
   - parentId = A1 Zóna ID
   - Megjelenik "A1 Zóna" alatt
   - **NINCS** "Alterület hozzáadása" gomb (level 2 limit)
```

### 4. Ellenőrzési Pont Hozzáadása
```
1. Válaszd ki: "Polc 1" (level 2 terület)
2. Klikk: "Új ellenőrzés"
3. Kitöltés: "Biztonsági ajtó működőképes"
4. Mentés
✅ Elvárás:
   - Check létrejön
   - Megjelenik a "Polc 1" ellenőrzési listájában
```

### 5. Admin Check Teszt
```
# Nem-admin userrel próbálj meg hozzáférni:
URL: /admin/sites

✅ Elvárás:
   - Auditor/Fixer: 404 Not Found
   - Nincs bejelentkezve: Redirect /login
   - Admin: Terület lista megjelenik
```

---

## 🔒 Security Flow Diagram

```
Request: /admin/sites/create
    ↓
Middleware (src/middleware.ts)
    ├─ Has admin? → Quickstart check
    └─ Has session? → Session check
    ↓
Admin Layout (src/app/admin/layout.tsx)
    ├─ getCurrentUser()
    ├─ role !== 'admin' ? → notFound()
    └─ role === 'admin' ✅
    ↓
Server Action (createSiteAction)
    ├─ getCurrentUser()
    ├─ role !== 'admin' ? → { success: false }
    └─ role === 'admin' ✅
    ↓
Database Operation
    ↓
Response
```

**Védelem szintjei:**
1. **Middleware**: Session ellenőrzés
2. **Layout**: Admin role check (404 ha nem admin)
3. **Server Action**: Admin role check (fail response)

---

## 📝 Fejlesztői Jegyzetek

### Query Params Next.js 15-ben
```typescript
// Server Component
export default async function Page({ searchParams }) {
    // Next.js 15: searchParams Promise!
    const params = await searchParams;
    const parentId = params.parentId;
    const level = params.level;
}
```

### Hidden Input Fields
```typescript
// Form hidden fields átadása
<form>
    <input type="hidden" name="parentId" value={parentId} />
    <input type="hidden" name="level" value={level} />
    <input type="text" name="name" />
</form>
```

### Server Action FormData
```typescript
export async function createSiteAction(formData: FormData) {
    const name = formData.get('name');
    const parentId = formData.get('parentId'); // Hidden field-ből
    const level = formData.get('level');       // Hidden field-ből
}
```

---

## ✅ Összefoglalás

| Probléma | Státusz | Megoldás |
|----------|---------|----------|
| Alterület létrehozás hiba | ✅ Javítva | Query params feldolgozása |
| Admin role check hiányzik | ✅ Javítva | Már védve az admin/layout.tsx által |
| Level 2 után alterület gomb | ✅ Javítva | Conditional rendering (level < 2) |
| Parent-child kapcsolat | ✅ Működik | parentId és level átadása |

**Minden működik!** 🎉

A területkezelés most teljes funkcionalitású:
- ✅ 3 szintes hierarchia
- ✅ Proper parent-child kapcsolatok
- ✅ Admin védelem minden szinten
- ✅ UI/UX megfelelő feedback-kel



