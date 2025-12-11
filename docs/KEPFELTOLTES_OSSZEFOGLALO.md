# Képfeltöltés Implementáció Összefoglalója

## ✅ Elkészült Komponensek

### 1. GridFS Upload API
**Fájl**: `src/app/api/upload/route.ts`

**POST /api/upload**
- Kép feltöltés GridFS-re
- Validáció:
  - Max méret: 10MB
  - Típusok: JPEG, PNG, WebP
  - Auth check (bejelentkezett user)
- Metadata tárolás: uploadedBy, uploadedAt, originalName, size
- Response: fileId, filename, contentType, size

**GET /api/upload**
- User által feltöltött képek listázása
- Auth check

### 2. GridFS Download/Delete API
**Fájl**: `src/app/api/upload/[fileId]/route.ts`

**GET /api/upload/[fileId]**
- Kép letöltés/megjelenítés
- Nincs auth check (publikus URL)
- Cache header: 1 év immutable
- Streaming GridFS → Response

**DELETE /api/upload/[fileId]**
- Kép törlése
- Auth check + ownership check
- Admin bármit törölhet
- User csak saját képet

### 3. ImageUpload Komponens
**Fájl**: `src/components/ImageUpload.tsx`

**Funkciók**:
- ✅ Drag & drop
- ✅ File input fallback
- ✅ Client-side validáció (type, size)
- ✅ Preview thumbnail
- ✅ Upload progress indicator
- ✅ Kép törlés
- ✅ Existing image support

**Props**:
```typescript
type ImageUploadProps = {
    onUploadComplete: (fileId: string) => void;
    existingImageId?: string;
    maxSizeMB?: number;
};
```

**Használat**:
```typescript
<ImageUpload 
    onUploadComplete={(fileId) => setReferenceImageId(fileId)}
    existingImageId="abc123..."
    maxSizeMB={10}
/>
```

### 4. CheckForm Integráció
**Fájl**: `src/components/CheckForm.tsx`

**Változások**:
- ✅ ImageUpload komponens beágyazva
- ✅ Hidden input field: `referenceImage`
- ✅ State management: `referenceImageId`
- ✅ Initial value support

**Form flow**:
1. User feltölt képet
2. `onUploadComplete` callback → `setReferenceImageId(fileId)`
3. Hidden input automatikusan frissül
4. Form submit → fileId elküldi server action-be

### 5. CheckCard Megjelenítés
**Fájl**: `src/app/admin/sites/sites-editor.tsx`

**Változások**:
- ✅ Referencia kép megjelenítés (ha van)
- ✅ 32x32px thumbnail
- ✅ `/api/upload/[fileId]` URL használat

---

## 🔧 Technikai Részletek

### GridFS Bucket Inicializálás
```typescript
// src/lib/db/index.ts
let _uploadsBucket: mongo.GridFSBucket | null = null;

export const getUploadsBucket = () => {
    if (!_uploadsBucket) {
        const client = getNativeClient();
        _uploadsBucket = new mongo.GridFSBucket(client.db("3s-gp"), {
            bucketName: "uploads",
        });
    }
    return _uploadsBucket;
};
```

**Miért lazy init?**
- Edge Runtime kompatibilitás
- Nincs global scope inicializálás
- On-demand connection

### File Upload Flow
```
1. User kiválaszt képet
   ↓
2. Client-side validáció
   - Type check (image/*)
   - Size check (< 10MB)
   ↓
3. Preview generálás (FileReader)
   ↓
4. POST /api/upload
   - Server-side validáció
   - GridFS upload stream
   - Metadata tárolás
   ↓
5. Response: fileId
   ↓
6. onUploadComplete callback
   ↓
7. State update → form field frissül
```

### GridFS Struktúra
**Collection**: `uploads.files`

**Document példa**:
```javascript
{
  _id: ObjectId("..."),
  filename: "example.jpg",
  contentType: "image/jpeg",
  length: 123456,
  uploadDate: ISODate("2025-01-01T10:00:00Z"),
  metadata: {
    uploadedBy: "userId",
    uploadedAt: ISODate("2025-01-01T10:00:00Z"),
    originalName: "example.jpg",
    size: 123456
  }
}
```

**Chunks**: `uploads.chunks` (automatikus)

---

## 🎯 Használati Példák

### 1. Check Referencia Kép
```typescript
// Create check page
<CheckForm 
    siteId={siteId}
    mode="create"
/>

// Edit check page  
<CheckForm 
    siteId={siteId}
    checkId={checkId}
    initialText="..."
    initialReferenceImage="fileId123..."
    mode="update"
/>
```

### 2. Standalone Image Upload
```typescript
import ImageUpload from '@/components/ImageUpload';

function MyComponent() {
    const [imageId, setImageId] = useState('');
    
    return (
        <ImageUpload 
            onUploadComplete={setImageId}
            maxSizeMB={5}
        />
    );
}
```

### 3. Kép Megjelenítés
```typescript
// Next.js Image komponens
<Image 
    src={`/api/upload/${fileId}`}
    alt="..."
    width={200}
    height={200}
/>

// Vagy sima img tag
<img 
    src={`/api/upload/${fileId}`}
    alt="..."
    className="..."
/>
```

### 4. Kép Törlés
```typescript
const handleDelete = async (fileId: string) => {
    const response = await fetch(`/api/upload/${fileId}`, {
        method: 'DELETE',
    });
    
    if (response.ok) {
        console.log('Deleted');
    }
};
```

---

## 🔒 Biztonsági Megfontolások

### 1. Upload Védelem
- ✅ Auth check: csak bejelentkezett user tölthet fel
- ✅ File type whitelist: csak képek
- ✅ File size limit: max 10MB
- ✅ Metadata: uploadedBy tracking

### 2. Download Védelem
- ❌ Nincs auth check (publikus URL)
- ✅ De: fileId nehezen kitalálható (MongoDB ObjectId)
- ℹ️ Megfontolás: Később lehet token-based access

### 3. Delete Védelem
- ✅ Auth check
- ✅ Ownership check (csak saját kép)
- ✅ Admin override (admin törölhet bármit)

### 4. Lehetséges Fejlesztések
```typescript
// Token-based access
GET /api/upload/[fileId]?token=JWT_TOKEN

// Ownership check download-nál
if (!isPublic && userId !== file.metadata.uploadedBy) {
    return 403;
}

// Rate limiting
const limiter = rateLimit({ windowMs: 60000, max: 10 });
```

---

## 📊 Teljesítmény

### Optimalizációk
1. **Cache Headers**:
   ```typescript
   'Cache-Control': 'public, max-age=31536000, immutable'
   ```
   - 1 év cache böngészőben
   - Immutable: nincs revalidation

2. **Streaming**:
   - GridFS → Response streaming
   - Nincs teljes fájl memóriában

3. **Lazy Init**:
   - Bucket csak használatkor jön létre
   - Nincs global scope pollution

### Skálázhatóság
- **GridFS limit**: Nincs (MongoDB max doc size: 16MB, de chunks-okra bont)
- **Max fájl méret**: Jelenleg 10MB (növelhető)
- **Concurrent uploads**: Unlimited (MongoDB handles)
- **CDN integráció**: Később `/api/upload/[fileId]` → CloudFront

---

## 🧪 Tesztelési Útmutató

### Manual Testing

#### 1. Kép Feltöltés
```
1. Menj /admin/sites
2. Válassz területet (level 2)
3. Klikk "Új ellenőrzés"
4. Írj szöveget
5. Drag & drop egy képet
   ✅ Preview jelenik meg
6. Mentsd el
   ✅ Check létrejön fileId-val
```

#### 2. Kép Megjelenítés
```
1. Válaszd ki az előbb létrehozott check-et
2. CheckCard mutatja a képet
   ✅ Thumbnail látható
```

#### 3. Kép Törlés
```
1. CheckForm-ban töröld a képet (X gomb)
   ✅ Preview eltűnik
2. Mentsd el
   ✅ Check fileId = null
```

#### 4. Validáció Tesztek
```
# File size
- Tölts fel > 10MB képet
  ✅ Hibaüzenet: "max 10MB"

# File type
- Tölts fel PDF-et
  ✅ Hibaüzenet: "Csak képek"

# Auth
- Logout
- POST /api/upload
  ✅ 401 Unauthorized
```

---

## 🚀 Következő Lépések (Audit NOK Képek)

A képfeltöltés infrastruktúra készen áll az Audit NOK képekhez is!

**Használat audit végrehajtáskor**:
```typescript
// Audit execution form
{result === 'NOK' && (
    <>
        <Textarea name="comment" required />
        <ImageUpload 
            onUploadComplete={(fileId) => setNokImageId(fileId)}
            required
        />
    </>
)}
```

**Audit model**:
```typescript
// IAuditResult - már támogatja!
image?: ObjectId;  // GridFS fileId
```

---

## ✅ Összefoglalás

**Elkészült**:
- ✅ GridFS upload/download/delete API
- ✅ ImageUpload komponens (drag & drop)
- ✅ CheckForm integráció
- ✅ CheckCard megjelenítés
- ✅ Auth + validáció
- ✅ Dokumentáció

**Production ready**: ✅ Igen

**Következő**: Audit CRUD műveletek 🚀



