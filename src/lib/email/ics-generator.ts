/**
 * ICS (iCalendar) File Generator
 * 
 * Generates .ics calendar files for audit events
 */

import { createEvents, type EventAttributes, type DateArray } from 'ics';

/**
 * Audit event data for ICS generation
 */
export type AuditEventData = {
    title: string;
    description?: string;
    location?: string;
    startDate: Date;
    endDate?: Date; // If not provided, creates all-day event
    organizerEmail?: string;
    attendeeEmails?: string[];
    url?: string;
};

/**
 * Convert Date to ICS date array [year, month, day, hour, minute]
 */
function dateToIcsArray(date: Date): DateArray {
    return [
        date.getFullYear(),
        date.getMonth() + 1, // ICS months are 1-indexed
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
    ];
}

/**
 * Generate ICS file for a single audit
 */
export function generateAuditIcs(auditData: AuditEventData): {
    success: boolean;
    icsContent?: string;
    error?: string;
} {
    try {
        const event: EventAttributes = {
            title: auditData.title,
            description: auditData.description,
            location: auditData.location,
            productId: '3s-gp/audit-system',
            uid: `audit-${Date.now()}@3s-gp.com`,
            status: 'CONFIRMED',
        };

        // If endDate is not provided, create all-day event
        if (!auditData.endDate) {
            // All-day event
            event.start = [
                auditData.startDate.getFullYear(),
                auditData.startDate.getMonth() + 1,
                auditData.startDate.getDate(),
            ];
            event.duration = { days: 1 };
        } else {
            // Timed event
            event.start = dateToIcsArray(auditData.startDate);
            event.end = dateToIcsArray(auditData.endDate);
        }

        // Add organizer
        if (auditData.organizerEmail) {
            event.organizer = {
                name: 'Audit System',
                email: auditData.organizerEmail,
            };
        }

        // Add attendees
        if (auditData.attendeeEmails && auditData.attendeeEmails.length > 0) {
            event.attendees = auditData.attendeeEmails.map((email) => ({
                email,
                rsvp: true,
                role: 'REQ-PARTICIPANT',
            }));
        }

        // Add URL
        if (auditData.url) {
            event.url = auditData.url;
        }

        const { error, value } = createEvents([event]);

        if (error) {
            return {
                success: false,
                error: error.message || 'Unknown ICS generation error',
            };
        }

        return {
            success: true,
            icsContent: value,
        };
    } catch (error) {
        console.error('[ICS GENERATION ERROR]', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Generate ICS file for multiple audits
 */
export function generateMultipleAuditsIcs(auditsData: AuditEventData[]): {
    success: boolean;
    icsContent?: string;
    error?: string;
} {
    try {
        const events: EventAttributes[] = auditsData.map((auditData, index) => {
            const event: EventAttributes = {
                title: auditData.title,
                description: auditData.description,
                location: auditData.location,
                productId: '3s-gp/audit-system',
                uid: `audit-${Date.now()}-${index}@3s-gp.com`,
                status: 'CONFIRMED',
            };

            // All-day event or timed
            if (!auditData.endDate) {
                event.start = [
                    auditData.startDate.getFullYear(),
                    auditData.startDate.getMonth() + 1,
                    auditData.startDate.getDate(),
                ];
                event.duration = { days: 1 };
            } else {
                event.start = dateToIcsArray(auditData.startDate);
                event.end = dateToIcsArray(auditData.endDate);
            }

            if (auditData.organizerEmail) {
                event.organizer = {
                    name: 'Audit System',
                    email: auditData.organizerEmail,
                };
            }

            if (auditData.attendeeEmails && auditData.attendeeEmails.length > 0) {
                event.attendees = auditData.attendeeEmails.map((email) => ({
                    email,
                    rsvp: true,
                    role: 'REQ-PARTICIPANT',
                }));
            }

            if (auditData.url) {
                event.url = auditData.url;
            }

            return event;
        });

        const { error, value } = createEvents(events);

        if (error) {
            return {
                success: false,
                error: error.message || 'Unknown ICS generation error',
            };
        }

        return {
            success: true,
            icsContent: value,
        };
    } catch (error) {
        console.error('[ICS GENERATION ERROR]', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Generate ICS filename based on audit info
 */
export function generateIcsFilename(siteName: string, date: Date): string {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const safeSiteName = siteName.replace(/[^a-zA-Z0-9]/g, '_');
    return `audit_${safeSiteName}_${dateStr}.ics`;
}


