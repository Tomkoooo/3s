import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Audit from "@/lib/db/models/Audit";
import Site from "@/lib/db/models/Site";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !['admin', 'site_leader'].includes(currentUser.role)) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');
        const siteId = searchParams.get('siteId');
        const status = searchParams.get('status');

        if (!startDateStr || !endDateStr) {
            return new NextResponse('Missing date range', { status: 400 });
        }

        const startDate = new Date(startDateStr);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);

        await connectDB();

        const query: any = {
            onDate: { $gte: startDate, $lte: endDate }
        };

        if (siteId && ObjectId.isValid(siteId)) {
            query.site = new ObjectId(siteId);
        }

        if (status === 'scheduled') {
            query.startTime = { $exists: false };
        } else if (status === 'in_progress') {
            query.startTime = { $exists: true, $ne: null };
            query.endTime = { $exists: false };
        } else if (status === 'completed') {
            query.startTime = { $exists: true, $ne: null };
            query.endTime = { $exists: true, $ne: null };
        }

        if (currentUser.role === 'site_leader') {
            const leaderSites = await Site.find({ siteLeaders: new ObjectId(currentUser.id) }).select('_id').lean().exec();
            const leaderSiteIds = leaderSites.map((s: any) => s._id);
            query.site = query.site
                ? { $in: leaderSiteIds.filter((id: any) => id.toString() === query.site.toString()) }
                : { $in: leaderSiteIds };
        }

        // Fetch Audits
        const audits = await Audit.find(query)
        .populate('site', 'name')
        .populate('participants', 'fullName')
        .sort({ onDate: -1 })
        .lean();

        // Generate CSV
        const header = ['Audit ID', 'Terület', 'Dátum', 'Státusz', 'Auditorok', 'Összes pont', 'Megfelelt', 'Eredmény %'];
        const rows = [header.join(';')];

        for (const audit of audits) {
            const siteName = (audit.site as any)?.name || 'Ismeretlen';
            const d = new Date(audit.onDate);
            const date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.`;
            const auditorNames = (audit.participants as any[]).map((p: any) => p.fullName).join('; ');
            
            // Calc status
            let status = 'Tervezett';
            if (audit.startTime) status = 'Folyamatban';
            if (audit.startTime && audit.endTime) status = 'Befejezett';

            // Calc score
            let totalChecks = 0;
            let passedChecks = 0;
            
            if (audit.result && Array.isArray(audit.result)) {
                // Count only answered checks
                const answered = audit.result.filter((r: any) => {
                    const val = r.result !== undefined ? r.result : r.pass;
                    return val !== undefined && val !== null;
                });
                
                totalChecks = audit.result.length; // Or usually we count total checks defined for site? Audit result represents all checks.
                passedChecks = answered.filter((r: any) => {
                     const val = r.result !== undefined ? r.result : r.pass;
                     return val === true;
                }).length;
            }

            const scorePercent = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

            // CSV safe strings (quote if contains comma)
            const safeSite = `"${siteName.replace(/"/g, '""')}"`;
            const safeAuditors = `"${auditorNames.replace(/"/g, '""')}"`;

            rows.push([
                (audit._id as unknown as string).toString(),
                safeSite,
                date,
                status,
                safeAuditors,
                totalChecks,
                passedChecks,
                `${scorePercent}%`
            ].join(';'));
        }

        const csvContent = rows.join('\n');
        // Add BOM for Excel UTF-8 compatibility
        const BOM = '\uFEFF'; 
        const finalContent = BOM + csvContent;

        return new NextResponse(finalContent, {
            headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="Ellenorzesek_${startDateStr}_${endDateStr}.csv"`,
            },
        });

    } catch (error) {
        console.error('Export error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
