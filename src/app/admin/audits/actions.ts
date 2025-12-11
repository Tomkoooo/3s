"use server";

import { connectDB } from "@/lib/db";
import Audit from "@/lib/db/models/Audit";
import Site from "@/lib/db/models/Site";
import User from "@/lib/db/models/User";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { sendAuditNotificationToAll } from "@/lib/email/audit-email";

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

export type AuditFormState = {
    success: boolean;
    message?: string;
    fieldErrors?: {
        siteId?: string[];
        participants?: string[];
        onDate?: string[];
    };
};

/**
 * Audit-ok lekérése szűrőkkel
 */
export async function getAudits(filters?: {
    siteId?: string;
    auditorId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: 'scheduled' | 'in_progress' | 'completed';
}) {
    try {
        await connectDB();

        const query: any = {};

        if (filters?.siteId) {
            query.site = new ObjectId(filters.siteId);
        }

        if (filters?.auditorId) {
            query.participants = new ObjectId(filters.auditorId);
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

        const audits = await Audit.find(query)
            .populate('site')
            .populate('participants')
            .sort({ onDate: -1 })
            .lean()
            .exec();

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
                status,
            };
        });

        // Status szűrés
        if (filters?.status) {
            return processedAudits.filter((audit: any) => audit.status === filters.status);
        }

        return processedAudits;
    } catch (error) {
        console.error('Get audits error:', error);
        return [];
    }
}

/**
 * Audit létrehozása
 */
export async function createAuditAction(
    _prevState: AuditFormState,
    formData: FormData
): Promise<AuditFormState> {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez a művelethez' };
        }

        const siteId = formData.get('siteId') as string;
        const onDate = formData.get('onDate') as string;
        const participantIds = formData.getAll('participants') as string[];

        // Validáció
        if (!siteId || !ObjectId.isValid(siteId)) {
            return {
                success: false,
                fieldErrors: { siteId: ['Érvényes terület kiválasztása kötelező'] },
            };
        }

        if (!onDate) {
            return {
                success: false,
                fieldErrors: { onDate: ['Dátum megadása kötelező'] },
            };
        }

        if (!participantIds || participantIds.length === 0) {
            return {
                success: false,
                fieldErrors: { participants: ['Legalább egy auditor kiválasztása kötelező'] },
            };
        }

        await connectDB();

        // Import Check model to ensure it's registered
        await import('@/lib/db/models/Check');
        const Check = (await import('@/lib/db/models/Check')).default;

        // Site validáció - try without lean to get proper checks array
        const siteDoc = await Site.findById(siteId)
            .select('_id name level checks')
            .exec();
            
        if (!siteDoc) {
            return { success: false, message: 'A terület nem található' };
        }

        const site = siteDoc.toObject ? siteDoc.toObject() : siteDoc;
        
        // Get checks array - handle both Mongoose document and plain object
        let checksArray = site.checks;
        if (siteDoc.checks && Array.isArray(siteDoc.checks)) {
            checksArray = siteDoc.checks;
        } else if (site.checks && Array.isArray(site.checks)) {
            checksArray = site.checks;
        }

        console.log(`[createAuditAction] Site ${site.name} (level: ${site.level}):`, {
            checksArray: checksArray,
            checksLength: checksArray?.length || 0,
            checksType: typeof checksArray,
            isArray: Array.isArray(checksArray),
        });

        // Accept any site that has checks (regardless of level)
        // The getAuditableSites already filters for sites with checks

        // Ellenőrizzük, hogy vannak-e checks
        if (!checksArray || !Array.isArray(checksArray) || checksArray.length === 0) {
            return { success: false, message: 'A területhez még nincsenek ellenőrzési pontok definiálva' };
        }

        // Fetch checks manually - handle both Mongoose ObjectId and string formats
        const checkIds = checksArray.map((id: any) => {
            // Handle Mongoose ObjectId
            if (id && typeof id === 'object' && id.toString) {
                return new ObjectId(id.toString());
            }
            // Handle string
            if (typeof id === 'string' && ObjectId.isValid(id)) {
                return new ObjectId(id);
            }
            // Fallback
            return String(id);
        }).filter(id => ObjectId.isValid(id.toString()));
        
        if (checkIds.length === 0) {
            return { success: false, message: 'A területhez tartozó ellenőrzési pontok ID-ja érvénytelen' };
        }
        
        console.log(`[createAuditAction] Checking ${checkIds.length} check IDs:`, checkIds.map(id => id.toString()));
        
        const checks = await Check.find({ _id: { $in: checkIds } })
            .select('_id')
            .lean()
            .exec();

        console.log(`[createAuditAction] Found ${checks.length} checks in database`);

        if (checks.length === 0) {
            return { 
                success: false, 
                message: `A területhez tartozó ellenőrzési pontok nem találhatók az adatbázisban (keresett ID-k: ${checkIds.map(id => id.toString()).join(', ')})` 
            };
        }

        // Participants validáció
        const validParticipants = participantIds.filter((id) => ObjectId.isValid(id));
        if (validParticipants.length === 0) {
            return { success: false, message: 'Érvényes auditor-ok kiválasztása kötelező' };
        }

        // Dátum validáció (ne legyen múltbeli)
        const selectedDate = new Date(onDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
            return { success: false, message: 'Múltbeli dátumra nem lehet audit-ot létrehozni' };
        }

        // Checks másolása az audit result mezőjébe (üres eredményekkel)
        const initialResults = checks.map((check: any) => ({
            check: check._id, // Use the fetched check's _id
            result: undefined, // Will be set when audit is executed
            comment: undefined,
            image: undefined,
        }));

        // Új audit létrehozása
        const newAudit = await Audit.create({
            site: new ObjectId(siteId),
            participants: validParticipants.map((id) => new ObjectId(id)),
            onDate: selectedDate,
            result: initialResults, // Checks másolva, de még nincs eredmény
        });

        // Participants adatainak lekérése email küldéshez
        const participants = await User.find({
            _id: { $in: validParticipants.map(id => new ObjectId(id)) }
        }).select('_id fullName email').lean();

        // Email küldés (async, nem blokkol)
        // Silent failure - ha nem megy ki az email, az audit létrehozás akkor is sikeres
        sendAuditNotificationToAll(newAudit._id.toString(), {
            site: {
                _id: site._id.toString(),
                name: site.name,
            },
            onDate: selectedDate,
            participants: participants.map((p: any) => ({
                _id: p._id.toString(),
                fullName: p.fullName,
                email: p.email,
            })),
            checkCount: checks.length,
        }).catch((error) => {
            console.error('[EMAIL] Failed to send audit notification:', error);
            // Ne törjön el az audit létrehozás email hiba miatt
        });

        revalidatePath('/admin/audits');
        return { success: true, message: 'Ellenőrzés sikeresen létrehozva' };
    } catch (error) {
        console.error('Create audit error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

/**
 * Audit részletek lekérése
 */
export async function getAuditById(auditId: string) {
    try {
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

        if (!audit) {
            return null;
        }

        // Manually populate checks
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
        console.error('Get audit by id error:', error);
        return null;
    }
}

/**
 * Audit módosítása (csak participants és onDate)
 */
export async function updateAuditAction(
    auditId: string,
    _prevState: AuditFormState,
    formData: FormData
): Promise<AuditFormState> {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez a művelethez' };
        }

        if (!ObjectId.isValid(auditId)) {
            return { success: false, message: 'Érvénytelen audit azonosító' };
        }

        const onDate = formData.get('onDate') as string;
        const participantIds = formData.getAll('participants') as string[];

        await connectDB();

        const audit = await Audit.findById(auditId);
        if (!audit) {
            return { success: false, message: 'Az ellenőrzés nem található' };
        }

        // Csak scheduled audit-ot lehet módosítani
        if (audit.startTime) {
            return { success: false, message: 'Elindított ellenőrzést nem lehet módosítani' };
        }

        // Frissítés
        if (onDate) {
            const selectedDate = new Date(onDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate < today) {
                return { success: false, message: 'Múltbeli dátumra nem lehet módosítani' };
            }
            audit.onDate = selectedDate;
        }

        if (participantIds && participantIds.length > 0) {
            const validParticipants = participantIds.filter((id) => ObjectId.isValid(id));
            if (validParticipants.length === 0) {
                return { success: false, message: 'Érvényes auditor-ok kiválasztása kötelező' };
            }
            audit.participants = validParticipants.map((id) => new ObjectId(id));
        }

        await audit.save();

        revalidatePath('/admin/audits');
        revalidatePath(`/admin/audits/${auditId}`);
        return { success: true, message: 'Ellenőrzés sikeresen frissítve' };
    } catch (error) {
        console.error('Update audit error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

/**
 * Audit törlése
 */
export async function deleteAuditAction(auditId: string): Promise<AuditFormState> {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez a művelethez' };
        }

        if (!ObjectId.isValid(auditId)) {
            return { success: false, message: 'Érvénytelen audit azonosító' };
        }

        await connectDB();

        const audit = await Audit.findById(auditId);
        if (!audit) {
            return { success: false, message: 'Az ellenőrzés nem található' };
        }

        // Completed audit-ot ne lehessen törölni
        if (audit.startTime && audit.endTime) {
            return { success: false, message: 'Befejezett ellenőrzést nem lehet törölni' };
        }

        await Audit.findByIdAndDelete(auditId);

        revalidatePath('/admin/audits');
        return { success: true, message: 'Ellenőrzés sikeresen törölve' };
    } catch (error) {
        console.error('Delete audit error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

/**
 * Összes auditor lekérése (auditor + admin role)
 */
export async function getAuditors() {
    try {
        await connectDB();

        const auditors = await User.find({
            role: { $in: ['auditor', 'admin'] },
        })
            .select('_id fullName email role')
            .lean()
            .exec();

        return auditors.map((auditor: any) => ({
            _id: auditor._id.toString(),
            fullName: auditor.fullName,
            email: auditor.email,
            role: auditor.role,
        }));
    } catch (error) {
        console.error('Get auditors error:', error);
        return [];
    }
}

/**
 * Level 2 site-ok lekérése (ahol lehet audit és vannak check-ek)
 */
export async function getAuditableSites() {
    try {
        await connectDB();

        // Import Check model to ensure it's registered
        await import('@/lib/db/models/Check');
        const Check = (await import('@/lib/db/models/Check')).default;

        // Get all sites and filter by checks (not just level 2)
        // Some sites might have checks even if they're not level 2
        const sitesRaw = await Site.find({})
            .select('_id name parentId level checks children')
            .exec();

        console.log(`[getAuditableSites] Found ${sitesRaw.length} total sites`);
        
        // Log all sites with their levels
        for (const site of sitesRaw) {
            const siteObj = site.toObject ? site.toObject() : site;
            console.log(`[getAuditableSites] Site: ${siteObj.name}, level: ${siteObj.level}, checks: ${siteObj.checks?.length || 0}, children: ${siteObj.children?.length || 0}`);
        }

        // Convert to plain objects and filter sites that have checks
        const sitesWithChecks = [];
        for (const siteDoc of sitesRaw) {
            const site = siteDoc.toObject ? siteDoc.toObject() : siteDoc;
            
            // Get checks array - handle both Mongoose document and plain object
            let checksArray = site.checks;
            if (siteDoc.checks && Array.isArray(siteDoc.checks)) {
                checksArray = siteDoc.checks;
            } else if (site.checks && Array.isArray(site.checks)) {
                checksArray = site.checks;
            }
            
            // Also check if site has children (might be a parent site with checks)
            let childrenArray = site.children;
            if (siteDoc.children && Array.isArray(siteDoc.children)) {
                childrenArray = siteDoc.children;
            } else if (site.children && Array.isArray(site.children)) {
                childrenArray = site.children;
            }
            
            console.log(`[getAuditableSites] Site: ${site.name} (level ${site.level}), checks:`, checksArray?.length || 0, `children:`, childrenArray?.length || 0);
            
            // Site is auditable if it has checks (regardless of level or children)
            if (checksArray && Array.isArray(checksArray) && checksArray.length > 0) {
                // Verify checks actually exist in database
                const checkIds = checksArray.map((id: any) => {
                    // Handle Mongoose ObjectId
                    if (id && typeof id === 'object' && id.toString) {
                        return new ObjectId(id.toString());
                    }
                    // Handle string
                    if (typeof id === 'string' && ObjectId.isValid(id)) {
                        return new ObjectId(id);
                    }
                    // Fallback
                    return String(id);
                }).filter(id => ObjectId.isValid(id.toString()));
                
                console.log(`[getAuditableSites] Site ${site.name} check IDs:`, checkIds.map(id => id.toString()));
                
                if (checkIds.length === 0) {
                    console.log(`[getAuditableSites] Site ${site.name} has invalid check IDs`);
                    continue;
                }
                
                const existingChecks = await Check.find({ _id: { $in: checkIds } })
                    .select('_id')
                    .lean()
                    .exec();
                
                console.log(`[getAuditableSites] Site ${site.name} found ${existingChecks.length} checks in database`);
                
                if (existingChecks.length > 0) {
                    sitesWithChecks.push({
                        _id: site._id,
                        name: site.name,
                        parentId: site.parentId,
                        checks: checksArray, // Keep original checks array
                    });
                } else {
                    console.log(`[getAuditableSites] WARNING: Site ${site.name} has ${checkIds.length} check IDs but none exist in database!`);
                }
            } else {
                console.log(`[getAuditableSites] Site ${site.name} has no checks or empty checks array`);
            }
        }

        console.log(`[getAuditableSites] Returning ${sitesWithChecks.length} sites with checks`);

        // Parent hierarchia felépítése
        const processedSites = await Promise.all(
            sitesWithChecks.map(async (site: any) => {
                let fullPath = site.name;
                let currentParentId = site.parentId;

                // Szülők nevének összegyűjtése
                while (currentParentId) {
                    const parent = await Site.findById(currentParentId).select('name parentId').lean();
                    if (parent) {
                        fullPath = `${parent.name} > ${fullPath}`;
                        currentParentId = parent.parentId;
                    } else {
                        break;
                    }
                }

                return {
                    _id: site._id.toString(),
                    name: site.name,
                    fullPath,
                };
            })
        );

        return processedSites;
    } catch (error) {
        console.error('Get auditable sites error:', error);
        return [];
    }
}

