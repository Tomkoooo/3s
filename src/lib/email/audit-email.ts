/**
 * Audit Email Service
 * 
 * Sends audit-related emails to participants
 */

import { sendEmail, sendBatchEmail } from './smtp';
import { generateAuditIcs, type AuditEventData } from './ics-generator';
import {
    renderAuditNotificationEmail,
    renderAuditNotificationText,
    type AuditNotificationData,
} from './templates';
import { connectDB } from '../db';
import User from '../db/models/User';
import Site from '../db/models/Site';

/**
 * Send audit notification email to a single participant
 */
export async function sendAuditNotificationEmail(
    auditId: string,
    participantId: string,
    auditData: {
        site: { _id: string; name: string };
        onDate: Date;
        participants: Array<{ _id: string; fullName: string; email: string }>;
        checkCount: number;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        await connectDB();

        // Get participant
        const participant = auditData.participants.find(
            (p) => p._id.toString() === participantId
        );

        if (!participant) {
            return { success: false, error: 'Participant not found' };
        }

        // Format date
        const auditDate = new Date(auditData.onDate).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        // Get other participants
        const otherParticipants = auditData.participants
            .filter((p) => p._id.toString() !== participantId)
            .map((p) => p.fullName);

        // Generate audit URL
        const auditUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/audits/${auditId}`;

        // Prepare email data
        const emailData: AuditNotificationData = {
            recipientName: participant.fullName,
            siteName: auditData.site.name,
            auditDate,
            auditUrl,
            participants: otherParticipants,
            checkCount: auditData.checkCount,
        };

        // Generate .ics file
        const icsData: AuditEventData = {
            title: `Ellenőrzés: ${auditData.site.name}`,
            description: `Ellenőrzési pontok: ${auditData.checkCount}\n\nMegnyitás: ${auditUrl}`,
            location: auditData.site.name,
            startDate: new Date(auditData.onDate),
            attendeeEmails: auditData.participants.map((p) => p.email),
            url: auditUrl,
        };

        const icsResult = generateAuditIcs(icsData);

        const attachments = icsResult.success && icsResult.icsContent
            ? [
                  {
                      filename: `audit_${auditData.site.name.replace(/[^a-zA-Z0-9]/g, '_')}_${
                          auditData.onDate.toISOString().split('T')[0]
                      }.ics`,
                      content: icsResult.icsContent,
                      contentType: 'text/calendar',
                  },
              ]
            : [];

        // Send email
        const result = await sendEmail({
            to: participant.email,
            subject: `Új ellenőrzés: ${auditData.site.name} - ${auditDate}`,
            html: renderAuditNotificationEmail(emailData),
            text: renderAuditNotificationText(emailData),
            attachments,
        });

        return result;
    } catch (error) {
        console.error('[AUDIT EMAIL ERROR]', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Send audit notification emails to all participants
 */
export async function sendAuditNotificationToAll(
    auditId: string,
    auditData: {
        site: { _id: string; name: string };
        onDate: Date;
        participants: Array<{ _id: string; fullName: string; email: string }>;
        checkCount: number;
    }
): Promise<{
    success: number;
    failed: number;
    errors?: Array<{ email: string; error: string }>;
}> {
    try {
        const results = await Promise.allSettled(
            auditData.participants.map((participant) =>
                sendAuditNotificationEmail(auditId, participant._id.toString(), auditData)
            )
        );

        let success = 0;
        let failed = 0;
        const errors: Array<{ email: string; error: string }> = [];

        results.forEach((result, index) => {
            const participant = auditData.participants[index];
            if (result.status === 'fulfilled' && result.value.success) {
                success++;
            } else {
                failed++;
                errors.push({
                    email: participant.email,
                    error:
                        result.status === 'fulfilled'
                            ? result.value.error || 'Unknown error'
                            : 'Promise rejected',
                });
            }
        });

        return { success, failed, errors: errors.length > 0 ? errors : undefined };
    } catch (error) {
        console.error('[AUDIT EMAIL BATCH ERROR]', error);
        return {
            success: 0,
            failed: auditData.participants.length,
            errors: [
                {
                    email: 'all',
                    error: error instanceof Error ? error.message : 'Unknown error',
                },
            ],
        };
    }
}

/**
 * Send bulk audit notifications (for scheduled audits)
 */
export async function sendBulkAuditNotifications(
    audits: Array<{
        _id: string;
        site: { _id: string; name: string };
        onDate: Date;
        participants: Array<{ _id: string; fullName: string; email: string }>;
        checkCount: number;
    }>
): Promise<{
    totalSent: number;
    totalFailed: number;
    auditResults: Array<{
        auditId: string;
        success: number;
        failed: number;
    }>;
}> {
    let totalSent = 0;
    let totalFailed = 0;
    const auditResults: Array<{ auditId: string; success: number; failed: number }> = [];

    for (const audit of audits) {
        const result = await sendAuditNotificationToAll(audit._id, audit);
        totalSent += result.success;
        totalFailed += result.failed;
        auditResults.push({
            auditId: audit._id,
            success: result.success,
            failed: result.failed,
        });
    }

    return { totalSent, totalFailed, auditResults };
}


