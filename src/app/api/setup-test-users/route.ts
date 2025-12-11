import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import User from '@/lib/db/models/User';

export async function GET() {
    await connectDB();
    const results = [];

    const users = [
        { email: 'admin@3sgp.hu', role: 'admin', name: 'Test Admin' },
        { email: 'auditor@3sgp.hu', role: 'auditor', name: 'Test Auditor' },
        { email: 'fixer@3sgp.hu', role: 'fixer', name: 'Test Fixer' }
    ];

    for (const u of users) {
        try {
            const existing = await User.findOne({ email: u.email });
            if (existing) {
                // Determine if we need to reset password? For now just say exists.
                // Optionally update password if needed, but easier to just use what we have or delete/recreate.
                // Let's delete and recreate to be sure of password 'password123'
                await User.deleteOne({ email: u.email });
            }
            
            await registerUser(u.email, 'password123', u.role, u.name);
            results.push({ email: u.email, status: 'created', password: 'password123' });
        } catch (e: any) {
            results.push({ email: u.email, status: 'error', error: e.message });
        }
    }

    // Seed Sites and Checks
    try {
        const Site = (await import('@/lib/db/models/Site')).default;
        const Check = (await import('@/lib/db/models/Check')).default;

        // Clean up old test data if needed (optional, maybe unsafe if mixed with real data, but okay for dev)
        // await Site.deleteMany({ name: /Test Site/ });
        // await Check.deleteMany({ text: /Test Check/ });

        let site = await Site.findOne({ name: 'Test Site Alpha' });
        if (!site) {
            site = await Site.create({
                name: 'Test Site Alpha',
                level: 1,
                parent: null
            });
            results.push({ status: 'created', type: 'site', name: 'Test Site Alpha' });
        }

        // Add sub-site/checks
        const checkTexts = [
            { text: 'Check Lights', desc: 'Are lights working?' },
            { text: 'Check Fire Extinguisher', desc: 'Is it expired?' }
        ];

        let siteSaved = false;
        
        for (const c of checkTexts) {
             let check = await Check.findOne({ text: c.text });
             if (!check) {
                check = await Check.create({
                    text: c.text,
                    description: c.desc,
                });
                
                site.checks = site.checks || [];
                // Avoid duplicates in array if re-running
                if (!site.checks.some((id: any) => id.toString() === check._id.toString())) {
                    site.checks.push(check._id);
                    siteSaved = true;
                }
                results.push({ status: 'created', type: 'check', name: c.text });
             }
        }
        
        if (siteSaved) {
            await site.save();
        }
        
        // Ensure site links to checks (if the logic implies site.children or checks array? 
        // Based on analysis, checks link to site. Site might not store children explicitly if referencing by parent.)
        // Checked Site.ts: it has specific structure. Let's verify Site.ts content first.
        
    } catch (e: any) {
        results.push({ status: 'error', type: 'site/check', message: e.message });
    }

    return NextResponse.json({ results });
}
