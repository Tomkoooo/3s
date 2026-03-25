# Database Schema (Collections + Fields + References)

Ez a dokumentum a projektben használt **MongoDB collectionöket** sorolja fel: **név**, **mezők/típusok**, **kulcsok/indexek**, és **kapcsolatok (ref)**.

Forrás: `src/lib/db/models/*.ts` (+ GridFS `uploads.*`)

---

## Gyors áttekintés (Collections)

- **`users`** (Mongoose model: `User`)
- **`sites`** (Mongoose model: `Site`)
- **`checks`** (Mongoose model: `Check`)
- **`audits`** (Mongoose model: `Audit`)
- **`breaks`** (Mongoose model: `Break`)
- **`recurringschedules`** (Mongoose model: `RecurringSchedule`)
- **`invites`** (Mongoose model: `Invite`)
- **GridFS**:
  - **`uploads.files`** (Mongoose model: `Upload`)
  - **`uploads.chunks`** (GridFS internal)

---

## `users` (User)

**Fő kulcs**
- **`_id`**: `ObjectId`

**Mezők**
- **`email`**: `string` (lowercase, trim)
- **`fullName`**: `string` (trim)
- **`role`**: `'auditor' | 'fixer' | 'admin' | 'site_leader'`
- **`hashedPassword`**: `string`
- **`createdAt`**: `Date`
- **`passwordChangedAt`**: `Date`
- **`lastLoginAt`**: `Date`

**Indexek / kulcsok**
- **Unique**: `email` (`{ email: 1 } unique`)

**Kapcsolatok (más collectionök hivatkozzák)**
- `breaks.userId -> users._id`
- `audits.participants[] -> users._id`
- `audits.result[].fixedBy -> users._id`
- `audits.summaryAdminRecipients[] -> users._id`
- `sites.siteLeaders[] -> users._id`
- `sites.resultAdminRecipients[] -> users._id`
- `recurringschedules.auditorPool[] -> users._id`
- `recurringschedules.createdBy -> users._id`

---

## `sites` (Site)

**Fő kulcs**
- **`_id`**: `ObjectId`

**Mezők**
- **`name`**: `string`
- **`level`**: `number` (0..2)
- **`parentId`**: `ObjectId | null` (ref: `Site`)
- **`children[]`**: `ObjectId[]` (ref: `Site`)
- **`checks[]`**: `ObjectId[]` (ref: `Check`)

**Site-leader / email összefoglaló beállítások**
- **`siteLeaders[]`**: `ObjectId[]` (ref: `User`)
- **`resultEmailList[]`**: `string[]` (extra email címzettek)
- **`resultAdminRecipients[]`**: `ObjectId[]` (ref: `User`) (kijelölt admin címzettek)
- **`notifyAdminsOnResult`**: `boolean` (ha igaz: minden admin kap summary emailt)

**Indexek / kulcsok**
- `parentId` index: `{ parentId: 1 }`
- `level` index: `{ level: 1 }`

**Kapcsolatok**
- Önhivatkozó hierarchia:
  - `sites.parentId -> sites._id`
  - `sites.children[] -> sites._id`
- Check kapcsolatok:
  - `sites.checks[] -> checks._id`
- User kapcsolatok (beállítások):
  - `sites.siteLeaders[] -> users._id`
  - `sites.resultAdminRecipients[] -> users._id`

---

## `checks` (Check)

**Fő kulcs**
- **`_id`**: `ObjectId`

**Mezők**
- **`text`**: `string`
- **`description`**: `string | null`

**Referencia képek (GridFS)**
- **`referenceImage`**: `ObjectId | null` (ref: `Upload`) *(deprecated)*
- **`referenceImages[]`**: `ObjectId[]` (ref: `Upload`)

**Kapcsolatok**
- `sites.checks[] -> checks._id`
- `audits.result[].check -> checks._id`
- Upload (GridFS):
  - `checks.referenceImage -> uploads.files._id`
  - `checks.referenceImages[] -> uploads.files._id`

---

## `audits` (Audit)

**Fő kulcs**
- **`_id`**: `ObjectId`

**Mezők**
- **`site`**: `ObjectId` (ref: `Site`)
- **`participants[]`**: `ObjectId[]` (ref: `User`)
- **`onDate`**: `Date`
- **`startTime`**: `Date | null`
- **`endTime`**: `Date | null`
- **`result[]`**: `AuditResult[]` *(embedded subdocument tömb)*
- **`timeWindowStart`**: `string | null` (`HH:MM`)
- **`timeWindowEnd`**: `string | null` (`HH:MM`)

**Összefoglaló email célzás (audit-szint)**
- **`summaryEmailList[]`**: `string[]`
- **`summaryAdminRecipients[]`**: `ObjectId[]` (ref: `User`)

**Indexek / kulcsok**
- `{ site: 1, onDate: 1 }`
- `{ participants: 1, onDate: 1 }`
- `{ onDate: 1 }`

**Kapcsolatok**
- `audits.site -> sites._id`
- `audits.participants[] -> users._id`
- `audits.summaryAdminRecipients[] -> users._id`

### Embedded: `audits.result[]` (AuditResult)

**Mezők**
- **`check`**: `ObjectId` (ref: `Check`)
- **`result`**: `boolean | undefined` *(true=OK, false=NOK, undefined=nem válaszolt)*
- **`comment`**: `string | undefined` *(NOK esetén kötelező)*
- **`image`**: `ObjectId | undefined` (ref: `Upload`) *(deprecated)*
- **`images[]`**: `ObjectId[]` (ref: `Upload`)

**Fixer mezők**
- **`fixedBy`**: `ObjectId | undefined` (ref: `User`)
- **`fixedAt`**: `Date | undefined`
- **`fixComment`**: `string | undefined`
- **`fixImage`**: `ObjectId | undefined` (ref: `Upload`) *(deprecated)*
- **`fixImages[]`**: `ObjectId[]` (ref: `Upload`)

**Kapcsolatok**
- `audits.result[].check -> checks._id`
- `audits.result[].images[] -> uploads.files._id`
- `audits.result[].fixedBy -> users._id`

---

## `breaks` (Break)

**Fő kulcs**
- **`_id`**: `ObjectId`

**Mezők**
- **`userId`**: `ObjectId` (ref: `User`)
- **`start`**: `string` (`YYYY-MM-DD`)
- **`end`**: `string` (`YYYY-MM-DD`)
- **`reason`**: `string | null`

**Indexek / kulcsok**
- `{ userId: 1, start: 1 }`
- `{ start: 1 }`
- `{ end: 1 }`

**Kapcsolatok**
- `breaks.userId -> users._id`

---

## `recurringschedules` (RecurringSchedule)

**Fő kulcs**
- **`_id`**: `ObjectId`

**Mezők**
- **`name`**: `string`
- **`siteIds[]`**: `ObjectId[]` (ref: `Site`)
- **`frequency`**: `'daily' | 'weekly' | 'monthly'`
- **`auditorPool[]`**: `ObjectId[]` (ref: `User`)
- **`auditorsPerAudit`**: `number` (min 1)
- **`maxAuditsPerDay`**: `number | undefined`
- **`createdBy`**: `ObjectId` (ref: `User`)
- **`createdAt`**: `Date`
- **`isActive`**: `boolean`
- **`lastGeneratedDate`**: `Date | undefined`

**Kapcsolatok**
- `recurringschedules.siteIds[] -> sites._id`
- `recurringschedules.auditorPool[] -> users._id`
- `recurringschedules.createdBy -> users._id`

---

## `invites` (Invite)

**Fő kulcs**
- **`_id`**: `ObjectId`

**Mezők**
- **`role`**: `'auditor' | 'fixer' | 'admin' | 'site_leader'`
- **`expiresAt`**: `Date`
- **`createdAt`**: `Date`
- **`comment`**: `string`

**Indexek / kulcsok**
- `{ expiresAt: 1 }`

**Kapcsolatok**
- Nincs közvetlen `ref`, csak üzleti logika szerint a regisztrációkor a szerepkör itt dől el.

---

## `uploads.files` (Upload, GridFS)

Source: `src/lib/db/models/Uploads.ts`

**Fő kulcs**
- **`_id`**: `ObjectId`

**Mezők (GridFS meta)**
- **`length`**: `number`
- **`chunkSize`**: `number`
- **`uploadDate`**: `Date`
- **`filename`**: `string`
- **`md5`**: `string`

**Kapcsolatok**
- `checks.referenceImage/referenceImages[] -> uploads.files._id`
- `audits.result[].image/images[] -> uploads.files._id`
- `audits.result[].fixImage/fixImages[] -> uploads.files._id`

---

## `uploads.chunks` (GridFS internal)

GridFS belső collection: a fájlok bináris chunkjai. Közvetlenül nem Mongoose modellezi a projekt.

