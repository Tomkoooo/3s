import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Site from '@/lib/db/models/Site';
import User from '@/lib/db/models/User';
import { scheduleAudits, createAuditsFromPreview } from '@/lib/audit-scheduler';

export async function GET() {
    await connectDB();
    const logs: string[] = [];
    const log = (msg: string) => logs.push(msg);

    try {
        const site = await Site.findOne({ name: 'Test Site Alpha' }).populate('checks');
        const auditor = await User.findOne({ email: 'auditor@3sgp.hu' });

        if (!site) return NextResponse.json({ error: 'Site not found' });
        if (!auditor) return NextResponse.json({ error: 'Auditor not found' });

        log(`Found Site: ${site.name}, Level: ${site.level}, Check count: ${site.checks?.length}`);
        log(`Found Auditor: ${auditor.fullName}`);

        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + 7);

        log(`Generating for ${today.toISOString()} to ${endDate.toISOString()}`);

        const config = {
            siteIds: [site._id.toString()],
            startDate: today,
            endDate: endDate,
            frequency: 'daily' as const,
            auditorPool: [auditor._id.toString()],
            auditorsPerAudit: 1,
            maxAuditsPerDay: 5,
            respectBreaks: true
        };

        const result = await scheduleAudits(config);
        log(`Result success: ${result.success}`);
        log(`Audits created: ${result.auditsCreated}`);
        if (result.conflicts) log(`Conflicts: ${result.conflicts.join(', ')}`);

        return NextResponse.json({ logs, result });

    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack, logs });
    }
}
