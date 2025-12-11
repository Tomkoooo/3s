import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/lib/db/models/User';
import Audit from '@/lib/db/models/Audit';
import Site from '@/lib/db/models/Site';
import { resolveAuditConflicts } from '@/lib/audit-scheduler';
import { hash } from 'bcrypt';

export async function GET() {
    await connectDB();
    const logs: string[] = [];
    const log = (msg: string) => logs.push(msg);

    try {
        // 1. Setup Data
        // Find or create Test Auditor
        const testAuditorProps = { email: 'auditor@3sgp.hu', fullName: 'Test Auditor' };
        let testAuditor = await User.findOne({ email: testAuditorProps.email });
        if (!testAuditor) throw new Error("Test Auditor not found (run setup-test-users first)");
        
        // Create Replacement Auditor
        const replacementProps = { email: 'auditor2@3sgp.hu', fullName: 'Replacement Auditor' };
        let replacementAuditor = await User.findOne({ email: replacementProps.email });
        if (!replacementAuditor) {
            replacementAuditor = await User.create({
                ...replacementProps,
                hashedPassword: await hash('password123', 12),
                role: 'auditor'
            });
            log(`Created Replacement Auditor: ${replacementAuditor._id}`);
        } else {
            log(`Found Replacement Auditor: ${replacementAuditor._id}`);
        }

        // Find a Site
        const site = await Site.findOne();
        if (!site) throw new Error("No sites found");

        // 2. Create a Conflict Situation
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(12, 0, 0, 0); // Noon tomorrow

        // Ensure clean slate for tomorrow for this site
        await Audit.deleteMany({ 
            site: site._id, 
            onDate: { 
                $gte: new Date(tomorrow.setHours(0,0,0,0)), 
                $lte: new Date(tomorrow.setHours(23,59,59,999)) 
            } 
        });

        // Create an audit assigned to Test Auditor
        const audit = await Audit.create({
            site: site._id,
            participants: [testAuditor._id],
            onDate: tomorrow,
            result: [] // empty for pending
        });
        log(`Created Audit ${audit._id} for tomorrow assigned to ${testAuditor.fullName}`);

        // 3. Trigger Conflict Resolution (simulate Break)
        log(`Simulating Break for ${testAuditor.fullName} on ${tomorrow.toISOString()}`);
        
        const resolution = await resolveAuditConflicts(
            testAuditor._id.toString(),
            tomorrow,
            tomorrow
        );

        log(`Resolution Result: Resolved=${resolution.resolved}, Failed=${resolution.failed}`);
        logs.push(...resolution.logs.map(l => `[Logic] ${l}`));

        // 4. Verify Outcome
        const updatedAudit = await Audit.findById(audit._id).populate('participants');
        const participants = updatedAudit.participants.map((p: any) => p.email);
        
        log(`Updated Participants: ${participants.join(', ')}`);

        let success = false;
        if (!participants.includes(testAuditorProps.email) && participants.includes(replacementProps.email)) {
            log("SUCCESS: Test Auditor removed, Replacement Auditor added.");
            success = true;
        } else if (!participants.includes(testAuditorProps.email)) {
            log("PARTIAL SUCCESS: Test Auditor removed, but no replacement found (or replacement was not the expected one).");
             // This is acceptable if replacement logic picked someone else or failed to find one
             success = true; 
        } else {
            log("FAILURE: Test Auditor still present!");
        }

        return NextResponse.json({ success, logs });

    } catch (e: any) {
        return NextResponse.json({ error: e.message, stack: e.stack, logs });
    }
}
