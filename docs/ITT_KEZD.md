# Információk a projekt állapotáról az átadás előtt

## Általános információk

UI: TailwindCSS, Shadcn UI
Adatbázis: MongoDB mongoose-al, gridfs külön kiexportálva másik változóban
Autentikáció: Valamilyen JWT alapú autentikáció, de fogalmam sincs hogy ez a megfelelő implementáció volt-e amit alkalmaztam, valszeg te majd jól megcsinálod. Vannak periodikus ellenőrzések a frontenden az autentikált állapot újravalidálására, kb egy rakás szar ahogy van.

Nekiállhatnék dokumentálni, de igazából akkora egy büdös katyvasz ez az egész, hogy jobban jársz ha ránézel aztán eldöntöd hogy egyáltalán használod-e alapnak.

## Ami kész

Működik az autentikáció, felhasználókat meg lehet hívni, illetve létrehozni a 3 szerepkörben, mindenkinek módosíthatók a szüneteik és a felhasználói adataik a megfelelő jogosultságokkal, nyilvan az admin barkit modosit, a másik kettő szerepkör csak saját magukat.

## Teendők
- Területek és az ahhoz tartozó ellenőrzések létrehozására felület biztosítása
- Az ellenőrzések ütemezése és a végrehajtó auditorok hozzárendelése a szabályok szerint
- Egy külső mailszerverhez hozzá kell tudjon rendelődnie az appnak és onnan kell kiküldeni .ics fájlokban az ellenőrzések ütemezését az auditor email címére (csak napra pontosan, all day eventek)
- "Fixer" szerepkör semennyire nincs kidolgozva és nem is tudom hogy gyakorlatban pontosan mit kell csinálni, erről egyeztetned kell velük.

## Területek
3 szint van, az első szint mindig alterületeket tartalmaz, a második szinten válaszható hogy további alterületek, vagy ellenőrzések, a harmadik szinten pedig mindenképpen ellenőrzések.

## Ellenőrzési checklistek
Egy szövegből és egy képből épül fel, a kép opcionalis paraméter, referenciának szolgálhat, hogy adott kikötésnek való helyes megfelelése esetén hogyan kell hogy kinézzen.

## Ellenőrzések
Szempontonként megy végig egy területen, mindig a legalsó szinteken történnek. Szempontonként, lehet OK, vagy NOK.
Ha OK, nincs további teendő, ha NOK akkor kötelező egy komment és egy kép feltöltése.