"use server";

import { getCurrentUser } from "@/lib/auth";
import {
    scheduleAudits,
    generateAuditPreview,
    createAuditsFromPreview,
    type ScheduleConfig,
    type AuditPreview,
    type ScheduleResult,
    type ScheduleFrequency,
} from "@/lib/audit-scheduler";
import { connectDB } from "@/lib/db";
import Site from "@/lib/db/models/Site";
import User from "@/lib/db/models/User";
import { revalidatePath } from "next/cache";
import { sendBulkAuditNotifications } from "@/lib/email/audit-email";

/**
 * Get schedulable sites (level 2 sites with checks)
 */
export async function getSchedulableSites() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return [];
        }

        await connectDB();

        // Import Check model to ensure it's registered
        await import('@/lib/db/models/Check');
        const Check = (await import('@/lib/db/models/Check')).default;

        // Get all sites (not just level 2) - we'll filter by checks
        const allSites = await Site.find({})
            .select('_id name level checks parentId children')
            .lean()
            .exec();

        console.log(`[getSchedulableSites] Found ${allSites.length} total sites`);

        // Build a map of sites with checks
        const sitesWithChecksMap = new Map<string, any>();
        
        for (const site of allSites) {
            console.log(`[getSchedulableSites] Site: ${site.name} (level: ${site.level}), checks array:`, site.checks);
            
            if (site.checks && Array.isArray(site.checks) && site.checks.length > 0) {
                // Verify checks actually exist in database
                const checkIds = site.checks.map((id: any) => {
                    if (typeof id === 'object' && id.toString) {
                        return id.toString();
                    }
                    return String(id);
                });
                
                const existingChecks = await Check.find({ _id: { $in: checkIds } })
                    .select('_id')
                    .lean()
                    .exec();
                
                console.log(`[getSchedulableSites] Found ${existingChecks.length} existing checks for site ${site.name}`);
                
                if (existingChecks.length > 0) {
                    sitesWithChecksMap.set(site._id.toString(), {
                        ...site,
                        checksCount: existingChecks.length,
                    });
                }
            }
        }

        // Now include parent sites that have children with checks
        const schedulableSites: any[] = [];
        const addedSiteIds = new Set<string>();
        
        for (const site of allSites) {
            const siteId = site._id.toString();
            
            // Check if this site has checks directly
            if (sitesWithChecksMap.has(siteId)) {
                const siteWithChecks = sitesWithChecksMap.get(siteId);
                if (!addedSiteIds.has(siteId)) {
                    schedulableSites.push({
                        _id: siteId,
                        name: site.name,
                        parentId: site.parentId,
                        checksCount: siteWithChecks.checksCount,
                        hasDirectChecks: true,
                    });
                    addedSiteIds.add(siteId);
                }
            }
            
            // Check if this site has children with checks
            if (site.children && Array.isArray(site.children) && site.children.length > 0) {
                let childrenWithChecksCount = 0;
                
                for (const childId of site.children) {
                    const childIdStr = typeof childId === 'object' ? childId.toString() : String(childId);
                    if (sitesWithChecksMap.has(childIdStr)) {
                        childrenWithChecksCount++;
                    }
                }
                
                if (childrenWithChecksCount > 0 && !addedSiteIds.has(siteId)) {
                    schedulableSites.push({
                        _id: siteId,
                        name: site.name,
                        parentId: site.parentId,
                        checksCount: childrenWithChecksCount,
                        hasDirectChecks: false,
                        isParent: true,
                    });
                    addedSiteIds.add(siteId);
                }
            }
        }

        console.log(`[getSchedulableSites] Returning ${schedulableSites.length} schedulable sites (including parents)`);
        
        // Build hierarchy paths
        const processedSites = await Promise.all(
            schedulableSites.map(async (site: any) => {
                let fullPath = site.name;
                let currentParentId = site.parentId;

                // Traverse up to collect parent names
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
                    _id: site._id,
                    name: site.name,
                    fullPath,
                    checksCount: site.checksCount,
                    isParent: site.isParent || false,
                    parentId: site.parentId?.toString(),
                };
            })
        );

        return processedSites;
    } catch (error) {
        console.error('Get schedulable sites error:', error);
        return [];
    }
}

/**
 * Get available auditors (auditor or admin role)
 */
export async function getAvailableAuditors() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return [];
        }

        await connectDB();

        const auditors = await User.find({ role: { $in: ['auditor', 'admin'] } })
            .select('_id fullName email role')
            .sort({ fullName: 1 })
            .lean();

        return auditors.map((auditor: any) => ({
            _id: auditor._id.toString(),
            fullName: auditor.fullName,
            email: auditor.email,
            role: auditor.role,
        }));
    } catch (error) {
        console.error('Get available auditors error:', error);
        return [];
    }
}

/**
 * Generate preview of audits to be created
 */
export async function generateSchedulePreviewAction(
    siteIds: string[],
    startDateStr: string,
    endDateStr: string,
    frequency: ScheduleFrequency,
    auditorPool: string[],
    auditorsPerAudit: number,
    maxAuditsPerDay?: number,
    timeWindowStart?: string,
    timeWindowEnd?: string
): Promise<{
    success: boolean;
    previews?: Array<{
        siteId: string;
        siteName: string;
        date: string;
        auditors: Array<{ _id: string; fullName: string; email: string }>;
        timeWindowStart?: string;
        timeWindowEnd?: string;
    }>;
    conflicts?: string[];
    message?: string;
}> {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez a művelethez' };
        }

        // Validation
        if (!siteIds || siteIds.length === 0) {
            return { success: false, message: 'Válassz ki legalább egy területet' };
        }

        if (!startDateStr || !endDateStr) {
            return { success: false, message: 'Adj meg kezdő és záró dátumot' };
        }

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (startDate > endDate) {
            return { success: false, message: 'A kezdő dátum nem lehet későbbi mint a záró dátum' };
        }

        if (auditorsPerAudit < 1) {
            return { success: false, message: 'Legalább 1 auditor szükséges audit-onként' };
        }

        // Generate preview
        const config: ScheduleConfig = {
            siteIds,
            startDate,
            endDate,
            frequency,
            auditorPool: auditorPool.length > 0 ? auditorPool : undefined,
            auditorsPerAudit,
            maxAuditsPerDay,
            respectBreaks: true,
            timeWindowStart,
            timeWindowEnd,
        };

        const { previews, conflicts } = await generateAuditPreview(config);

        // Convert Date to string for serialization
        const serializedPreviews = previews.map((p) => ({
            ...p,
            date: p.date.toISOString(),
        }));

        return {
            success: true,
            previews: serializedPreviews,
            conflicts: conflicts.length > 0 ? conflicts : undefined,
            message: `${previews.length} audit lesz generálva`,
        };
    } catch (error) {
        console.error('Generate schedule preview error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

/**
 * Create audits from confirmed preview
 */
export async function createScheduledAuditsAction(
    previews: Array<{
        siteId: string;
        siteName: string;
        date: string;
        auditors: Array<{ _id: string; fullName: string; email: string }>;
        timeWindowStart?: string;
        timeWindowEnd?: string;
    }>
): Promise<ScheduleResult> {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez a művelethez' };
        }

        if (!previews || previews.length === 0) {
            return { success: false, message: 'Nincs előnézet generálva' };
        }

        // Convert string dates back to Date objects
        const auditPreviews: AuditPreview[] = previews.map((p) => ({
            ...p,
            date: new Date(p.date),
        }));

        // Create audits
        const result = await createAuditsFromPreview(auditPreviews);

        // Send emails to all participants (async, non-blocking)
        if (result.success && result.createdAudits && result.createdAudits.length > 0) {
            sendBulkAuditNotifications(result.createdAudits).catch((error) => {
                console.error('[EMAIL] Failed to send bulk notifications:', error);
                // Ne törjön el az audit létrehozás email hiba miatt
            });
        }

        // Revalidate paths
        revalidatePath('/admin/audits');
        revalidatePath('/audits');

        return result;
    } catch (error) {
        console.error('Create scheduled audits error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

/**
 * Quick schedule action (preview + create in one step)
 */
export async function quickScheduleAuditsAction(
    siteIds: string[],
    startDateStr: string,
    endDateStr: string,
    frequency: ScheduleFrequency,
    auditorPool: string[],
    auditorsPerAudit: number,
    maxAuditsPerDay?: number
): Promise<ScheduleResult> {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez a művelethez' };
        }

        // Validation
        if (!siteIds || siteIds.length === 0) {
            return { success: false, message: 'Válassz ki legalább egy területet' };
        }

        const startDate = new Date(startDateStr);
        const endDate = new Date(endDateStr);

        if (startDate > endDate) {
            return { success: false, message: 'A kezdő dátum nem lehet későbbi mint a záró dátum' };
        }

        // Schedule
        const config: ScheduleConfig = {
            siteIds,
            startDate,
            endDate,
            frequency,
            auditorPool: auditorPool.length > 0 ? auditorPool : undefined,
            auditorsPerAudit,
            maxAuditsPerDay,
            respectBreaks: true,
        };

        const result = await scheduleAudits(config);

        // Revalidate paths
        if (result.success) {
            revalidatePath('/admin/audits');
            revalidatePath('/audits');
        }

        return result;
    } catch (error) {
        console.error('Quick schedule audits error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

