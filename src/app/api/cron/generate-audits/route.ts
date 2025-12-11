/**
 * Recurring Audit Generation Cron Job
 * 
 * Runs daily to process active recurring schedules and generate audits into the future.
 * Vercel Cron configuration needed in vercel.json
 */

import { NextResponse } from 'next/server';
import { generateRecurringAudits } from '@/lib/audit-scheduler';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Verify this is a cron request (Vercel sets this header)
        // const authHeader = request.headers.get('authorization');
        // const cronSecret = process.env.CRON_SECRET;

        // Allow running if no secret is configured (dev mode) or if secret matches
        // if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        //      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        // }

        const result = await generateRecurringAudits();

        return NextResponse.json({
            success: true,
            processed: result.processed,
            auditsCreated: result.auditsCreated,
            errors: result.errors,
            message: `Processed ${result.processed} schedules, created ${result.auditsCreated} audits. Errors: ${result.errors.length}`
        });
    } catch (error) {
        console.error('[CRON] Generate audits error:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
