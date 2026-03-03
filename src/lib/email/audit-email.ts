/**
 * Audit Email Service
 * 
 * Sends audit-related emails to participants
 */

import { sendEmail } from './smtp';
import { generateAuditIcs, type AuditEventData } from './ics-generator';
import {
    renderAuditNotificationEmail,
    renderAuditNotificationText,
    renderAuditResultSummaryEmail,
    renderAuditResultSummaryText,
    type AuditResultSummaryData,
    type AuditNotificationData,
} from './templates';
import { connectDB } from '../db';
import Audit from '../db/models/Audit';
import Site from '../db/models/Site';
import User from '../db/models/User';
import Check from '../db/models/Check';
import { ObjectId } from 'mongodb';

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

export async function sendAuditResultSummaryForCompletedAudit(
    auditId: string
): Promise<{ success: number; failed: number; recipients: number }> {
    try {
        await connectDB();

        const audit = await Audit.findById(auditId).lean();
        if (!audit) {
            return { success: 0, failed: 0, recipients: 0 };
        }

        const site = await Site.findById(audit.site)
            .select('name siteLeaders resultEmailList resultAdminRecipients notifyAdminsOnResult')
            .lean();
        if (!site) {
            return { success: 0, failed: 0, recipients: 0 };
        }

        const participantIds = (audit.participants || []).map((id: any) => new ObjectId(id.toString()));
        const participants = await User.find({ _id: { $in: participantIds } })
            .select('fullName email')
            .lean();

        const checkIds = (audit.result || [])
            .map((r: any) => r.check?.toString())
            .filter(Boolean)
            .map((id: string) => new ObjectId(id));
        const checks = await Check.find({ _id: { $in: checkIds } }).select('_id text').lean();
        const checkMap = new Map(checks.map((c: any) => [c._id.toString(), c.text]));

        const siteLeaderIds = (site.siteLeaders || []).map((id: any) => new ObjectId(id.toString()));
        const siteAdminIds = (site.resultAdminRecipients || []).map((id: any) => new ObjectId(id.toString()));
        const summaryAdminIds = (audit.summaryAdminRecipients || []).map((id: any) => new ObjectId(id.toString()));
        const siteLeaderUsers = siteLeaderIds.length > 0
            ? await User.find({ _id: { $in: siteLeaderIds } }).select('email').lean()
            : [];
        const siteAdminUsers = siteAdminIds.length > 0
            ? await User.find({ _id: { $in: siteAdminIds } }).select('email').lean()
            : [];
        const summaryAdminUsers = summaryAdminIds.length > 0
            ? await User.find({ _id: { $in: summaryAdminIds } }).select('email').lean()
            : [];
        const notifyAdminUsers = site.notifyAdminsOnResult
            ? await User.find({ role: 'admin' }).select('email').lean()
            : [];

        const recipients = Array.from(
            new Set(
                [
                    ...siteLeaderUsers.map((u: any) => u.email),
                    ...(site.resultEmailList || []),
                    ...siteAdminUsers.map((u: any) => u.email),
                    ...((audit.summaryEmailList || []) as string[]),
                    ...summaryAdminUsers.map((u: any) => u.email),
                    ...notifyAdminUsers.map((u: any) => u.email),
                ]
                    .map((email) => email.trim().toLowerCase())
                    .filter(Boolean)
            )
        );

        if (recipients.length === 0) {
            return { success: 0, failed: 0, recipients: 0 };
        }

        const baseUrl = process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const auditUrl = `${baseUrl}/audits/${auditId}`;
        const auditDate = new Date(audit.onDate).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        const results: AuditResultSummaryData['results'] = (audit.result || []).map((r: any) => {
            const imageIds = Array.isArray(r.images) ? r.images : (r.image ? [r.image] : []);
            const imageUrls = imageIds.map((id: any) => `${baseUrl}/api/upload/${id.toString()}`);
            const resultValue = r.result !== undefined ? r.result : r.pass;
            return {
                checkText: checkMap.get(r.check?.toString()) || 'Ismeretlen ellenőrzési pont',
                resultLabel: resultValue === true ? 'OK' : resultValue === false ? 'NOK' : 'N/A',
                comment: r.comment || undefined,
                imageUrls,
            };
        });

        const summaryData: AuditResultSummaryData = {
            siteName: site.name,
            auditDate,
            participants: participants.map((p: any) => p.fullName),
            auditUrl,
            results,
        };

        let success = 0;
        let failed = 0;
        for (const recipientEmail of recipients) {
            const result = await sendEmail({
                to: recipientEmail,
                subject: `Audit összefoglaló: ${site.name} - ${auditDate}`,
                html: renderAuditResultSummaryEmail(summaryData),
                text: renderAuditResultSummaryText(summaryData),
            });
            if (result.success) {
                success++;
            } else {
                failed++;
            }
        }

        return { success, failed, recipients: recipients.length };
    } catch (error) {
        console.error('[AUDIT RESULT EMAIL ERROR]', error);
        return { success: 0, failed: 0, recipients: 0 };
    }
}


