"use server";

import { connectDB } from "@/lib/db";
import Audit from "@/lib/db/models/Audit";
import { getCurrentUser } from "@/lib/auth";
import { ObjectId } from "mongodb";

// Lean típusok a Mongoose queryhez
type LeanSite = {
    _id: any;
    name: string;
    level: number;
};

type LeanUser = {
    _id: any;
    fullName: string;
    email: string;
    role: string;
};

type LeanCheck = {
    _id: any;
    text: string;
    referenceImage?: any;
};

type LeanAuditResult = {
    _id?: any;
    check: LeanCheck | any;
    pass?: boolean;
    comment?: string;
    image?: any;
};

type LeanAudit = {
    _id: any;
    site: LeanSite | any;
    participants: LeanUser[];
    onDate: Date | string;
    startTime?: Date | string;
    endTime?: Date | string;
    result?: LeanAuditResult[];
};

/**
 * Saját audit-ok lekérése (ahol a user résztvevő)
 */
export async function getMyAudits(filters?: {
    dateFrom?: string;
    dateTo?: string;
    status?: 'scheduled' | 'in_progress' | 'completed';
}) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return [];
        }

        await connectDB();


        const query: any = {};
        
        if (currentUser.role === 'fixer') {
            // Fixers see audits that have at least one failed check (pass: false)
            // Note: MongoDB stores boolean in 'pass' or 'result' (legacy)
            query['result'] = { 
                $elemMatch: { 
                    $or: [
                        { pass: false }, 
                        { result: false }
                    ] 
                } 
            };
        } else {
            // Auditors only see their own audits
            query.participants = new ObjectId(currentUser.id);
        }

        if (filters?.dateFrom || filters?.dateTo) {
            query.onDate = {};
            if (filters.dateFrom) {
                query.onDate.$gte = new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
                query.onDate.$lte = new Date(filters.dateTo);
            }
        }

        // Import Check model to ensure it's registered
        await import('@/lib/db/models/Check');
        const Check = (await import('@/lib/db/models/Check')).default;

        const audits = await Audit.find(query)
            .populate('site')
            .populate('participants')
            .sort({ onDate: -1 })
            .lean()
            .exec();

        // Manually populate checks
        for (const audit of audits as any[]) {
            if (audit.result && audit.result.length > 0) {
                const checkIds = audit.result
                    .map((r: any) => r.check?.toString())
                    .filter(Boolean);
                
                if (checkIds.length > 0) {
                    const checks = await Check.find({ _id: { $in: checkIds } })
                        .lean()
                        .exec();
                    
                    const checkMap = new Map(checks.map((c: any) => [c._id.toString(), c]));
                    
                    audit.result = audit.result.map((r: any) => ({
                        ...r,
                        check: r.check ? checkMap.get(r.check.toString()) || null : null,
                    }));
                }
            }
        }

        // Status számítás és szűrés
        const processedAudits = audits.map((audit: any) => {
            let status = 'scheduled';
            if (audit.startTime && audit.endTime) {
                status = 'completed';
            } else if (audit.startTime) {
                status = 'in_progress';
            }

            return {
                ...audit,
                _id: audit._id.toString(),
                site: audit.site ? {
                    _id: audit.site._id.toString(),
                    name: audit.site.name,
                } : null,
                participants: audit.participants.map((p: any) => ({
                    _id: p._id.toString(),
                    fullName: p.fullName,
                    email: p.email,
                })),
                result: audit.result?.map((r: any) => ({
                    ...r,
                    pass: r.result !== undefined ? r.result : r.pass, // Map result to pass for compatibility
                })) || [],
                status,
            };
        });

        // Status szűrés
        if (filters?.status) {
            return processedAudits.filter((audit: any) => audit.status === filters.status);
        }

        return processedAudits;
    } catch (error) {
        console.error('Get my audits error:', error);
        return [];
    }
}

/**
 * Audit részletek lekérése (csak ha résztvevő vagy admin)
 */
export async function getMyAuditById(auditId: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return null;
        }

        if (!ObjectId.isValid(auditId)) {
            return null;
        }

        await connectDB();

        // Import Check model to ensure it's registered
        await import('@/lib/db/models/Check');
        const Check = (await import('@/lib/db/models/Check')).default;

        const audit = await Audit.findById(auditId)
            .populate('site')
            .populate('participants')
            .lean<LeanAudit>();

        // Manually populate checks
        if (audit && audit.result && audit.result.length > 0) {
            const checkIds = audit.result
                .map((r: any) => r.check?.toString())
                .filter(Boolean);
            
            if (checkIds.length > 0) {
                const checks = await Check.find({ _id: { $in: checkIds } })
                    .lean()
                    .exec();
                
                const checkMap = new Map(checks.map((c: any) => [c._id.toString(), c]));
                
                audit.result = audit.result.map((r: any) => ({
                    ...r,
                    check: r.check ? checkMap.get(r.check.toString()) || null : null,
                }));
            }
        }

        if (!audit) {
            return null;
        }

        // Ellenőrizzük hogy résztvevő-e vagy admin
        const isParticipant = audit.participants.some(
            (p) => p._id.toString() === currentUser.id
        );
        const isAdmin = currentUser.role === 'admin';
        const isFixer = currentUser.role === 'fixer';
        
        // Fixer can view if there are issues
        if (isFixer) {
            const hasIssues = audit.result?.some((r: any) => r.pass === false || r.result === false);
            if (!hasIssues) {
                return null; // Don't show healthy audits to fixers
            }
        } else if (!isParticipant && !isAdmin) {
            return null; // Nincs jogosultsága megtekinteni
        }

        // Status számítás
        let status: 'scheduled' | 'in_progress' | 'completed' = 'scheduled';
        if (audit.startTime && audit.endTime) {
            status = 'completed';
        } else if (audit.startTime) {
            status = 'in_progress';
        }

        return {
            _id: audit._id.toString(),
            site: audit.site ? {
                _id: audit.site._id.toString(),
                name: audit.site.name,
                level: audit.site.level,
            } : null,
            participants: audit.participants.map((p) => ({
                _id: p._id.toString(),
                fullName: p.fullName,
                email: p.email,
                role: p.role,
            })),
            onDate: audit.onDate instanceof Date ? audit.onDate.toISOString() : audit.onDate,
            startTime: audit.startTime instanceof Date ? audit.startTime.toISOString() : audit.startTime,
            endTime: audit.endTime instanceof Date ? audit.endTime.toISOString() : audit.endTime,
            result: audit.result?.map((r: any) => ({
                _id: r._id?.toString(),
                check: r.check ? {
                    _id: r.check._id?.toString(),
                    text: r.check.text,
                    description: r.check.description || null,
                    referenceImage: r.check.referenceImage?.toString() || null,
                } : null,
                pass: r.result !== undefined ? r.result : r.pass, // Map result to pass for compatibility
                comment: r.comment,
                image: r.image?.toString(),
            })) || [],
            status,
        };
    } catch (error) {
        console.error('Get my audit by id error:', error);
        return null;
    }
}

/**
 * Dashboard statisztikák
 */
export async function getDashboardStats() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return null;
        }

        await connectDB();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (currentUser.role === 'admin') {
            // Admin statisztikák
            const totalAudits = await Audit.countDocuments();
            const todayAudits = await Audit.countDocuments({
                onDate: { $gte: today, $lt: tomorrow },
            });

            const allAudits = await Audit.find().lean();
            const inProgress = allAudits.filter((a: any) => a.startTime && !a.endTime).length;
            const scheduled = allAudits.filter((a: any) => !a.startTime).length;

            return {
                totalAudits,
                todayAudits,
                inProgress,
                scheduled,
            };
        } else {
            // User statisztikák (auditor/fixer)
            const userId = new ObjectId(currentUser.id);
            const isFixer = currentUser.role === 'fixer';
            
            let myAudits: any[] = [];
            
            if (isFixer) {
                 // Fixer sees audits with issues
                 myAudits = await Audit.find({
                    result: { 
                        $elemMatch: { 
                             $or: [
                                { pass: false }, 
                                { result: false }
                            ] 
                        } 
                    }
                 }).lean();
            } else {
                // Auditor sees own audits
                myAudits = await Audit.find({
                    participants: userId,
                }).lean();
            }

            const totalAudits = myAudits.length;
            const todayAudits = myAudits.filter((a: any) => {
                const auditDate = new Date(a.onDate);
                auditDate.setHours(0, 0, 0, 0);
                return auditDate.getTime() === today.getTime();
            }).length;

            const completed = myAudits.filter((a: any) => a.startTime && a.endTime).length;
            const nextAudit = myAudits
                .filter((a: any) => !a.startTime && new Date(a.onDate) >= today)
                .sort((a: any, b: any) => new Date(a.onDate).getTime() - new Date(b.onDate).getTime())[0];

            return {
                totalAudits,
                todayAudits,
                completed,
                nextAuditDate: nextAudit ? nextAudit.onDate : null,
            };
        }
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        return null;
    }
}

