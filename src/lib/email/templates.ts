/**
 * Email Templates
 * 
 * HTML email templates for audit notifications
 */

import { brand } from "@/lib/brand";

/**
 * Audit notification email data
 */
export type AuditNotificationData = {
    recipientName: string;
    siteName: string;
    auditDate: string; // Formatted date string (e.g., "2025. november 15.")
    auditUrl: string;
    participants: string[]; // Names of other participants
    checkCount: number;
};

/**
 * Daily summary email data
 */
export type DailySummaryData = {
    recipientName: string;
    todayAudits: Array<{
        siteName: string;
        time?: string;
        url: string;
    }>;
    tomorrowAudits: Array<{
        siteName: string;
        url: string;
    }>;
    date: string; // Today's date
};

/**
 * Invite email data
 */
export type InviteEmailData = {
    recipientEmail: string;
    role: string;
    inviteUrl: string;
    expiresAt: string;
    comment?: string;
};

/**
 * Base email layout
 */
function emailLayout(content: string): string {
    return `
<!DOCTYPE html>
<html lang="hu">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${brand.emailFromSystemLabel}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .header p {
            margin: 10px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
            color: #333333;
        }
        .content h2 {
            margin: 0 0 20px 0;
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
        }
        .content p {
            margin: 0 0 15px 0;
            line-height: 1.6;
            font-size: 15px;
        }
        .info-box {
            background-color: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 15px 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info-box strong {
            display: block;
            margin-bottom: 5px;
            color: #667eea;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-box span {
            font-size: 16px;
            color: #1a1a1a;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            margin: 20px 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            font-size: 15px;
        }
        .participants {
            margin: 15px 0;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 4px;
        }
        .participants-list {
            list-style: none;
            padding: 0;
            margin: 10px 0 0 0;
        }
        .participants-list li {
            padding: 5px 0;
            font-size: 14px;
            color: #555;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            font-size: 13px;
            color: #666666;
            border-top: 1px solid #e0e0e0;
        }
        .audit-item {
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 6px;
            margin-bottom: 15px;
        }
        .audit-item h3 {
            margin: 0 0 5px 0;
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
        }
        .audit-item p {
            margin: 0;
            font-size: 14px;
            color: #666;
        }
        .audit-item a {
            color: #667eea;
            text-decoration: none;
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${brand.emailFromSystemLabel}</h1>
            <p>${brand.companyName}</p>
        </div>
        ${content}
        <div class="footer">
            <p>Ez egy automatikus értesítő email a ${brand.emailFromSystemLabel}ből.</p>
            <p>Kérdés esetén vedd fel a kapcsolatot a rendszergazdával.</p>
        </div>
    </div>
</body>
</html>
    `.trim();
}

/**
 * Audit notification email template
 */
export function renderAuditNotificationEmail(data: AuditNotificationData): string {
    const participantsHtml =
        data.participants.length > 0
            ? `
        <div class="participants">
            <strong style="color: #1a1a1a; font-size: 14px;">Résztvevők:</strong>
            <ul class="participants-list">
                ${data.participants.map((name) => `<li>• ${name}</li>`).join('')}
            </ul>
        </div>
    `
            : '';

    const content = `
        <div class="content">
            <h2>Új ellenőrzés kijelölve</h2>
            <p>Kedves ${data.recipientName}!</p>
            <p>
                Egy új ellenőrzés került kijelölésre a részedre. Kérjük, hajtsd végre az ellenőrzést a megadott időpontban.
            </p>
            
            <div class="info-box">
                <strong>Terület</strong>
                <span>${data.siteName}</span>
            </div>
            
            <div class="info-box">
                <strong>Időpont</strong>
                <span>${data.auditDate}</span>
            </div>
            
            <div class="info-box">
                <strong>Ellenőrzési pontok</strong>
                <span>${data.checkCount} pont</span>
            </div>
            
            ${participantsHtml}
            
            <p>
                Az ellenőrzést a megadott napon az alábbi linken keresztül tudod elindítani:
            </p>
            
            <center>
                <a href="${data.auditUrl}" class="button">Ellenőrzés megnyitása</a>
            </center>
            
            <p style="font-size: 13px; color: #666; margin-top: 20px;">
                <strong>Fontos:</strong> Az ellenőrzés során minden pontot ki kell töltened.
                NOK esetén komment és kép feltöltése kötelező.
            </p>
        </div>
    `;

    return emailLayout(content);
}

/**
 * Daily summary email template
 */
export function renderDailySummaryEmail(data: DailySummaryData): string {
    const todaySection =
        data.todayAudits.length > 0
            ? `
        <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1a1a1a;">
                Mai ellenőrzések (${data.todayAudits.length})
            </h3>
            ${data.todayAudits
                .map(
                    (audit) => `
                <div class="audit-item">
                    <h3>${audit.siteName}</h3>
                    ${audit.time ? `<p>Idő: ${audit.time}</p>` : ''}
                    <p><a href="${audit.url}">Ellenőrzés megnyitása →</a></p>
                </div>
            `
                )
                .join('')}
        </div>
    `
            : `
        <div style="margin-bottom: 30px;">
            <p style="color: #666;">Nincs ellenőrzés ma.</p>
        </div>
    `;

    const tomorrowSection =
        data.tomorrowAudits.length > 0
            ? `
        <div>
            <h3 style="margin: 0 0 15px 0; font-size: 18px; color: #1a1a1a;">
                Holnapi ellenőrzések (${data.tomorrowAudits.length})
            </h3>
            ${data.tomorrowAudits
                .map(
                    (audit) => `
                <div class="audit-item">
                    <h3>${audit.siteName}</h3>
                    <p><a href="${audit.url}">Részletek megtekintése →</a></p>
                </div>
            `
                )
                .join('')}
        </div>
    `
            : '';

    const content = `
        <div class="content">
            <h2>Napi ellenőrzés összefoglaló</h2>
            <p>Kedves ${data.recipientName}!</p>
            <p>
                Az alábbiakban találod a mai és holnapi ellenőrzéseidet.
            </p>
            
            <div class="info-box">
                <strong>Dátum</strong>
                <span>${data.date}</span>
            </div>
            
            ${todaySection}
            ${tomorrowSection}
            
            <p style="font-size: 13px; color: #666; margin-top: 30px;">
                Jó munkát kívánunk az ellenőrzésekhez!
            </p>
        </div>
    `;

    return emailLayout(content);
}

/**
 * Plain text version of audit notification
 */
export function renderAuditNotificationText(data: AuditNotificationData): string {
    const participants =
        data.participants.length > 0
            ? `\n\nRésztvevők:\n${data.participants.map((name) => `- ${name}`).join('\n')}`
            : '';

    return `
${brand.emailFromSystemLabel}
Új ellenőrzés kijelölve

Kedves ${data.recipientName}!

Egy új ellenőrzés került kijelölésre a részedre.

Terület: ${data.siteName}
Időpont: ${data.auditDate}
Ellenőrzési pontok: ${data.checkCount} pont
${participants}

Az ellenőrzést a megadott napon az alábbi linken keresztül tudod elindítani:
${data.auditUrl}

Fontos: Az ellenőrzés során minden pontot ki kell töltened.
NOK esetén komment és kép feltöltése kötelező.

---
Ez egy automatikus értesítő email a ${brand.emailFromSystemLabel}ből.
    `.trim();
}

/**
 * Plain text version of daily summary
 */
export function renderDailySummaryText(data: DailySummaryData): string {
    const todaySection =
        data.todayAudits.length > 0
            ? `\nMai ellenőrzések (${data.todayAudits.length}):\n${data.todayAudits
                  .map((audit) => `- ${audit.siteName}${audit.time ? ` (${audit.time})` : ''}\n  ${audit.url}`)
                  .join('\n')}`
            : '\nNincs ellenőrzés ma.';

    const tomorrowSection =
        data.tomorrowAudits.length > 0
            ? `\n\nHolnapi ellenőrzések (${data.tomorrowAudits.length}):\n${data.tomorrowAudits
                  .map((audit) => `- ${audit.siteName}\n  ${audit.url}`)
                  .join('\n')}`
            : '';

    return `
${brand.emailFromSystemLabel}
Napi ellenőrzés összefoglaló

Kedves ${data.recipientName}!

Dátum: ${data.date}
${todaySection}
${tomorrowSection}

Jó munkát kívánunk az ellenőrzésekhez!

---
Ez egy automatikus értesítő email a ${brand.emailFromSystemLabel}ből.
    `.trim();
}

/**
 * Invite email template
 */
export function renderInviteEmail(data: InviteEmailData): string {
    const roleNames = {
        admin: 'Adminisztrátor',
        auditor: 'Auditor',
        fixer: 'Javító (Karbantartó)',
        site_leader: 'Terület vezető',
    } as any;

    const roleName = roleNames[data.role] || data.role;

    const content = `
        <div class="content">
            <h2>Meghívó a ${brand.emailFromSystemLabel}be</h2>
            <p>Üdvözlünk!</p>
            <p>
                Meghívtak a ${brand.emailFromSystemLabel} használatára <strong>${roleName}</strong> szerepkörben.
            </p>
            
            ${data.comment ? `
            <div class="info-box">
                <strong>Megjegyzés</strong>
                <span>${data.comment}</span>
            </div>
            ` : ''}
            
            <div class="info-box">
                <strong>Szerepkör</strong>
                <span>${roleName}</span>
            </div>
            
            <div class="info-box">
                <strong>Lejárat</strong>
                <span>${new Date(data.expiresAt).toLocaleString('hu-HU')}</span>
            </div>
            
            <p>
                A regisztrációhoz és a fiókod aktiválásához kattints az alábbi gombra:
            </p>
            
            <center>
                <a href="${data.inviteUrl}" class="button">Regisztráció és Aktiválás</a>
            </center>
            
            <p style="font-size: 13px; color: #666; margin-top: 20px;">
                Ezt a linket csak egyszer tudod felhasználni. Amennyiben nem te kérted a hozzáférést, kérjük hagyd figyelmen kívül ezt az üzenetet.
            </p>
        </div>
    `;

    return emailLayout(content);
}

/**
 * Plain text version of invite email
 */
export function renderInviteText(data: InviteEmailData): string {
    const roleNames = {
        admin: 'Adminisztrátor',
        auditor: 'Auditor',
        fixer: 'Javító (Karbantartó)',
        site_leader: 'Terület vezető',
    } as any;

    const roleName = roleNames[data.role] || data.role;

    return `
${brand.emailFromSystemLabel}
Meghívó a rendszerbe

Üdvözlünk!

Meghívtak a ${brand.emailFromSystemLabel} használatára ${roleName} szerepkörben.

Szerepkör: ${roleName}
Lejárat: ${new Date(data.expiresAt).toLocaleString('hu-HU')}
${data.comment ? `\nMegjegyzés: ${data.comment}` : ''}

A regisztrációhoz és a fiókod aktiválásához látogass el az alábbi linkre:
${data.inviteUrl}

Ezt a linket csak egyszer tudod felhasználni.

---
Ez egy automatikus értesítő email a ${brand.emailFromSystemLabel}ből.
    `.trim();
}

export type AuditResultSummaryData = {
    siteName: string;
    auditDate: string;
    participants: string[];
    auditUrl: string;
    results: Array<{
        checkText: string;
        resultLabel: 'OK' | 'NOK' | 'N/A';
        comment?: string;
        imageUrls?: string[];
    }>;
};

export function renderAuditResultSummaryEmail(data: AuditResultSummaryData): string {
    const rows = data.results
        .map((item) => {
            const statusColor =
                item.resultLabel === 'OK'
                    ? '#16a34a'
                    : item.resultLabel === 'NOK'
                        ? '#dc2626'
                        : '#6b7280';
            const images = item.imageUrls && item.imageUrls.length > 0
                ? `<p style="margin: 6px 0 0 0; font-size: 13px;">Képek: ${item.imageUrls
                    .map((url) => `<a href="${url}">${url}</a>`)
                    .join('<br/>')}</p>`
                : '';

            return `
                <div class="audit-item">
                    <h3>${item.checkText}</h3>
                    <p><strong style="color:${statusColor}">${item.resultLabel}</strong></p>
                    ${item.comment ? `<p>Komment: ${item.comment}</p>` : ''}
                    ${images}
                </div>
            `;
        })
        .join('');

    const content = `
        <div class="content">
            <h2>Ellenőrzési összefoglaló</h2>
            <p>Egy ellenőrzés lezárásra került.</p>
            <div class="info-box">
                <strong>Terület</strong>
                <span>${data.siteName}</span>
            </div>
            <div class="info-box">
                <strong>Dátum</strong>
                <span>${data.auditDate}</span>
            </div>
            <div class="info-box">
                <strong>Résztvevők</strong>
                <span>${data.participants.join(', ')}</span>
            </div>
            ${rows}
            <center>
                <a href="${data.auditUrl}" class="button">Audit megnyitása</a>
            </center>
        </div>
    `;

    return emailLayout(content);
}

export function renderAuditResultSummaryText(data: AuditResultSummaryData): string {
    const resultLines = data.results
        .map((item) => {
            const images = item.imageUrls && item.imageUrls.length > 0
                ? `\n  Képek:\n  ${item.imageUrls.join('\n  ')}`
                : '';
            return `- ${item.checkText}: ${item.resultLabel}${item.comment ? `\n  Komment: ${item.comment}` : ''}${images}`;
        })
        .join('\n');

    return `
${brand.emailFromSystemLabel}
Ellenőrzési összefoglaló

Terület: ${data.siteName}
Dátum: ${data.auditDate}
Résztvevők: ${data.participants.join(', ')}

Eredmények:
${resultLines}

Audit link:
${data.auditUrl}
    `.trim();
}


