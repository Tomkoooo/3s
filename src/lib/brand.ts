export type BrandKey = '3s' | '4s' | '5s';

export type Brand = {
  key: BrandKey;
  appShortName: string;
  appLongName: string;
  description: string;
  systemNameHu: string;
  companyName: string;
  emailFromSystemLabel: string;
  ics: {
    productId: string;
    uidDomain: string;
    organizerName: string;
  };
};

function assertNever(x: never): never {
  throw new Error(`Unhandled brand key: ${String(x)}`);
}

function getBrandKey(): BrandKey {
  const raw = (process.env.NEXT_PUBLIC_BRAND_KEY || '3s').trim().toLowerCase();
  if (raw === '3s' || raw === '4s' || raw === '5s') return raw;
  return '3s';
}

function brandFor(key: BrandKey): Brand {
  switch (key) {
    case '3s':
      return {
        key,
        appShortName: '3SGP',
        appLongName: '3SGP - General Plastics Kft. 3S Ellenőrzó Rendszer',
        description: 'General Plastics Kft. 3S Ellenőrzó Rendszer - Break Management System',
        systemNameHu: '3S Ellenőrző Rendszer',
        companyName: 'General-Plastics',
        emailFromSystemLabel: '3S Ellenőrző Rendszer',
        ics: {
          productId: '3s-gp/audit-system',
          uidDomain: '3s-gp.com',
          organizerName: 'Audit System',
        },
      };
    case '4s':
      return {
        key,
        appShortName: '4SGP',
        appLongName: '4SGP - General Plastics Kft. 4S Ellenőrzó Rendszer',
        description: 'General Plastics Kft. 4S Ellenőrzó Rendszer - Break Management System',
        systemNameHu: '4S Ellenőrző Rendszer',
        companyName: 'General-Plastics',
        emailFromSystemLabel: '4S Ellenőrző Rendszer',
        ics: {
          productId: '4s-gp/audit-system',
          uidDomain: '4s-gp.com',
          organizerName: 'Audit System',
        },
      };
    case '5s':
      return {
        key,
        appShortName: '5SGP',
        appLongName: '5SGP - General Plastics Kft. 5S Ellenőrzó Rendszer',
        description: 'General Plastics Kft. 5S Ellenőrzó Rendszer - Break Management System',
        systemNameHu: '5S Ellenőrző Rendszer',
        companyName: 'General-Plastics',
        emailFromSystemLabel: '5S Ellenőrző Rendszer',
        ics: {
          productId: '5s-gp/audit-system',
          uidDomain: '5s-gp.com',
          organizerName: 'Audit System',
        },
      };
    default:
      return assertNever(key);
  }
}

export const brand: Brand = brandFor(getBrandKey());

