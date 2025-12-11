/**
 * Daily Summary Cron Job
 * 
 * Sends daily summary emails to all auditors
 * Runs every day at 8:00 AM
 * 
 * Vercel Cron configuration needed in vercel.json
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/db/models/User';
import Audit from '@/lib/db/models/Audit';
import { sendEmail } from '@/lib/email/smtp';
import { renderDailySummaryEmail, renderDailySummaryText, type DailySummaryData } from '@/lib/email/templates';

export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/daily-summary
 * 
 * Vercel Cron endpoint
 * Authorization: Check for cron secret or Vercel cron header
 */
export async function GET(request: NextRequest) {
    try {
        // Verify this is a cron request (Vercel sets this header)
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        // Get all auditors (and admins)
        const auditors = await User.find({
            role: { $in: ['auditor', 'admin'] },
        }).select('_id fullName email').lean();

        if (auditors.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No auditors found',
            });
        }

        // Get today's and tomorrow's dates
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayEnd = new Date(today);
        todayEnd.setHours(23, 59, 59, 999);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowEnd = new Date(tomorrow);
        tomorrowEnd.setHours(23, 59, 59, 999);

        let emailsSent = 0;
        let emailsFailed = 0;

        // Send email to each auditor
        for (const auditor of auditors) {
            try {
                // Get today's audits for this auditor
                const todayAudits = await Audit.find({
                    participants: auditor._id,
                    onDate: { $gte: today, $lte: todayEnd },
                }).populate('site').lean();

                // Get tomorrow's audits for this auditor
                const tomorrowAudits = await Audit.find({
                    participants: auditor._id,
                    onDate: { $gte: tomorrow, $lte: tomorrowEnd },
                }).populate('site').lean();

                // Skip if no audits
                if (todayAudits.length === 0 && tomorrowAudits.length === 0) {
                    continue;
                }

                const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

                // Prepare email data
                const emailData: DailySummaryData = {
                    recipientName: auditor.fullName,
                    todayAudits: todayAudits.map((audit: any) => ({
                        siteName: audit.site?.name || 'Ismeretlen terület',
                        time: audit.startTime
                            ? new Date(audit.startTime).toLocaleTimeString('hu-HU', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                              })
                            : undefined,
                        url: `${appUrl}/audits/${audit._id}`,
                    })),
                    tomorrowAudits: tomorrowAudits.map((audit: any) => ({
                        siteName: audit.site?.name || 'Ismeretlen terület',
                        url: `${appUrl}/audits/${audit._id}`,
                    })),
                    date: today.toLocaleDateString('hu-HU', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    }),
                };

                // Send email
                const result = await sendEmail({
                    to: auditor.email,
                    subject: `Napi összefoglaló - ${emailData.date}`,
                    html: renderDailySummaryEmail(emailData),
                    text: renderDailySummaryText(emailData),
                });

                if (result.success) {
                    emailsSent++;
                } else {
                    emailsFailed++;
                    console.error(`Failed to send to ${auditor.email}:`, result.error);
                }
            } catch (error) {
                emailsFailed++;
                console.error(`Error sending email to ${auditor.email}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Daily summary sent. Success: ${emailsSent}, Failed: ${emailsFailed}`,
            emailsSent,
            emailsFailed,
        });
    } catch (error) {
        console.error('[CRON] Daily summary error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}


