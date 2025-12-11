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
            .select('_id name level checks')
            .lean()
            .exec();

        console.log(`[getSchedulableSites] Found ${allSites.length} total sites`);

        // Filter sites that have checks and verify checks exist
        const sitesWithChecks = [];
        for (const site of allSites) {
            console.log(`[getSchedulableSites] Site: ${site.name} (level: ${site.level}), checks array:`, site.checks);
            console.log(`[getSchedulableSites] Site: ${site.name}, checks array length: ${site.checks?.length || 0}, checks type:`, typeof site.checks);
            
            if (site.checks && Array.isArray(site.checks) && site.checks.length > 0) {
                // Verify checks actually exist in database
                const checkIds = site.checks.map((id: any) => {
                    // Handle both ObjectId and string formats
                    if (typeof id === 'object' && id.toString) {
                        return id.toString();
                    }
                    return String(id);
                });
                console.log(`[getSchedulableSites] Checking ${checkIds.length} check IDs for site ${site.name}:`, checkIds);
                
                const existingChecks = await Check.find({ _id: { $in: checkIds } })
                    .select('_id')
                    .lean()
                    .exec();
                
                console.log(`[getSchedulableSites] Found ${existingChecks.length} existing checks for site ${site.name} (level ${site.level})`);
                
                if (existingChecks.length > 0) {
                    sitesWithChecks.push({
                        _id: site._id.toString(),
                        name: site.name,
                        checksCount: existingChecks.length,
                    });
                } else {
                    console.log(`[getSchedulableSites] WARNING: Site ${site.name} has ${checkIds.length} check IDs but none exist in database!`);
                }
            } else {
                console.log(`[getSchedulableSites] Site ${site.name} (level ${site.level}) has no checks or empty checks array`);
            }
        }

        console.log(`[getSchedulableSites] Returning ${sitesWithChecks.length} sites with checks`);
        return sitesWithChecks;
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
    maxAuditsPerDay?: number
): Promise<{
    success: boolean;
    previews?: Array<{
        siteId: string;
        siteName: string;
        date: string;
        auditors: Array<{ _id: string; fullName: string; email: string }>;
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

