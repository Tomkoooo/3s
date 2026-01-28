/**
 * Audit Scheduler Library
 * 
 * Core scheduling algorithms for automatic audit generation
 */

import { connectDB } from './db';
import User from './db/models/User';
import Break from './db/models/Break';
import Site from './db/models/Site';
import Audit from './db/models/Audit';
import Check from './db/models/Check';
import { ObjectId } from 'mongodb';

/**
 * Frequency types for scheduling
 */
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

/**
 * Schedule configuration
 */
export type ScheduleConfig = {
    siteIds: string[];                    // Sites to schedule audits for
    startDate: Date;                       // Schedule start date
    endDate: Date;                         // Schedule end date
    frequency: ScheduleFrequency;          // How often to schedule
    auditorPool?: string[];                // Specific auditors (if empty, use all available)
    auditorsPerAudit: number;             // How many auditors per audit (default 1)
    maxAuditsPerDay?: number;             // Max audits per auditor per day (default unlimited)
    respectBreaks: boolean;                // Whether to skip auditors on break (default true)
};

/**
 * Generated audit preview
 */
export type AuditPreview = {
    siteId: string;
    siteName: string;
    date: Date;
    auditors: Array<{ _id: string; fullName: string; email: string }>;
};

/**
 * Scheduling result
 */
export type ScheduleResult = {
    success: boolean;
    auditsCreated?: number;
    auditsSkipped?: number;
    conflicts?: string[];
    message?: string;
};

/**
 * Get available auditors for a specific date
 * Excludes auditors who have breaks on that date
 */
export async function getAvailableAuditorsForDate(
    date: Date,
    auditorPool?: string[]
): Promise<Array<{ _id: any; fullName: string; email: string; role: string }>> {
    await connectDB();

    // Query for auditors (role = 'auditor' or 'admin')
    const query: any = { role: { $in: ['auditor', 'admin'] } };
    
    // If auditor pool is specified, filter by IDs
    if (auditorPool && auditorPool.length > 0) {
        query._id = { $in: auditorPool };
    }

    const allAuditors = await User.find(query)
        .select('_id fullName email role')
        .lean();

    // Get breaks that overlap with the given date
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const breaksOnDate = await Break.find({
        $or: [
            // Break starts before/on date and ends after/on date
            { start: { $lte: dayEnd }, $or: [{ end: { $gte: dayStart } }, { end: null }] },
        ],
    }).lean();

    const auditorIdsOnBreak = breaksOnDate.map((b: any) => b.userId.toString());

    // Filter out auditors on break
    const availableAuditors = allAuditors.filter(
        (auditor) => !auditorIdsOnBreak.includes(auditor._id.toString())
    );

    return availableAuditors;
}

/**
 * Check how many audits an auditor already has on a specific date
 */
export async function getAuditorAuditCountForDate(
    auditorId: string,
    date: Date
): Promise<number> {
    await connectDB();

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const count = await Audit.countDocuments({
        participants: auditorId,
        onDate: { $gte: dayStart, $lte: dayEnd },
    });

    return count;
}

/**
 * Rotation algorithm
 * Returns the next N auditors in rotation, cycling through the pool
 */
export class AuditorRotation {
    private auditors: Array<{ _id: any; fullName: string; email: string; role: string }>;
    private currentIndex: number = 0;

    constructor(auditors: Array<{ _id: any; fullName: string; email: string; role: string }>) {
        this.auditors = auditors;
    }

    /**
     * Get next N auditors
     */
    next(count: number = 1): Array<{ _id: any; fullName: string; email: string; role: string }> {
        if (this.auditors.length === 0) return [];

        const selected: Array<{ _id: any; fullName: string; email: string; role: string }> = [];

        for (let i = 0; i < count; i++) {
            selected.push(this.auditors[this.currentIndex]);
            this.currentIndex = (this.currentIndex + 1) % this.auditors.length;
        }

        return selected;
    }

    /**
     * Reset rotation to start
     */
    reset() {
        this.currentIndex = 0;
    }
}

/**
 * Generate date array based on frequency
 */
export function generateDates(
    startDate: Date,
    endDate: Date,
    frequency: ScheduleFrequency
): Date[] {
    const dates: Date[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    while (current <= end) {
        dates.push(new Date(current));

        switch (frequency) {
            case 'daily':
                current.setDate(current.getDate() + 1);
                break;
            case 'weekly':
                current.setDate(current.getDate() + 7);
                break;
            case 'monthly':
                current.setMonth(current.getMonth() + 1);
                break;
        }
    }

    return dates;
}

/**
 * Shuffle array helper for randomization
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Generate audit preview
 * Does NOT create audits, only returns a preview
 */
export async function generateAuditPreview(
    config: ScheduleConfig
): Promise<{ previews: AuditPreview[]; conflicts: string[] }> {
    await connectDB();

    const previews: AuditPreview[] = [];
    const conflicts: string[] = [];

    // Get all selected sites with their children
    const selectedSites = await Site.find({ _id: { $in: config.siteIds } })
        .select('_id name children checks')
        .lean();

    if (selectedSites.length === 0) {
        return { previews, conflicts: ['Nincsenek kiválasztott területek'] };
    }

    // Import Check model
    await import('@/lib/db/models/Check');
    const Check = (await import('@/lib/db/models/Check')).default;

    // Recursive function to get all descendant sites with checks
    async function getAllDescendantsWithChecks(siteId: any): Promise<Array<{ _id: any; name: string }>> {
        const results: Array<{ _id: any; name: string }> = [];
        
        // Get this site
        const site = await Site.findById(siteId)
            .select('_id name checks children')
            .lean();
        
        if (!site) return results;
        
        // Check if this site has checks directly
        if (site.checks && Array.isArray(site.checks) && site.checks.length > 0) {
            const existingChecks = await Check.find({ _id: { $in: site.checks } })
                .select('_id')
                .lean()
                .exec();
            
            if (existingChecks.length > 0) {
                results.push({
                    _id: site._id,
                    name: site.name,
                });
            }
        }
        
        // Recursively process all children
        if (site.children && Array.isArray(site.children) && site.children.length > 0) {
            for (const childId of site.children) {
                const childDescendants = await getAllDescendantsWithChecks(childId);
                results.push(...childDescendants);
            }
        }
        
        return results;
    }

    // Expand parent sites to include all their descendants with checks (recursive)
    const sitesToSchedule: Array<{ _id: any; name: string }> = [];
    const processedIds = new Set<string>();

    for (const site of selectedSites) {
        const siteId = site._id.toString();
        
        // Get all descendants with checks for this site (recursive)
        const descendants = await getAllDescendantsWithChecks(site._id);
        
        for (const descendant of descendants) {
            const descendantId = descendant._id.toString();
            if (!processedIds.has(descendantId)) {
                sitesToSchedule.push(descendant);
                processedIds.add(descendantId);
            }
        }
    }

    if (sitesToSchedule.length === 0) {
        return { previews, conflicts: ['Egyik kiválasztott terület sem ütemezhető'] };
    }

    // Generate dates based on frequency
    const dates = generateDates(config.startDate, config.endDate, config.frequency);

    // For each date
    for (const date of dates) {
        // Get available auditors for this date
        let availableAuditors = await getAvailableAuditorsForDate(date, config.auditorPool);

        // Filter by max audits per day
        if (config.maxAuditsPerDay !== undefined && config.maxAuditsPerDay > 0) {
            const filtered = [];
            for (const auditor of availableAuditors) {
                const count = await getAuditorAuditCountForDate(auditor._id.toString(), date);
                if (count < config.maxAuditsPerDay) {
                    filtered.push(auditor);
                }
            }
            availableAuditors = filtered;
        }

        // RANDOMIZE auditor order for this date to prevent repetitive pairings
        availableAuditors = shuffleArray(availableAuditors);

        // Check if we have enough auditors
        if (availableAuditors.length < config.auditorsPerAudit) {
            conflicts.push(
                `${date.toLocaleDateString('hu-HU')}: Nem elegendő auditor (szükséges: ${
                    config.auditorsPerAudit
                }, elérhető: ${availableAuditors.length})`
            );
            continue;
        }

        // Create rotation with shuffled auditors
        const rotation = new AuditorRotation(availableAuditors);

        // For each site, assign auditors
        for (const site of sitesToSchedule) {
            const auditors = rotation.next(config.auditorsPerAudit);

            if (auditors.length < config.auditorsPerAudit) {
                conflicts.push(
                    `${site.name} - ${date.toLocaleDateString('hu-HU')}: Nem elegendő auditor`
                );
                continue;
            }

            previews.push({
                siteId: site._id.toString(),
                siteName: site.name,
                date,
                auditors: auditors.map((a) => ({
                    _id: a._id.toString(),
                    fullName: a.fullName,
                    email: a.email,
                })),
            });
        }
    }

    return { previews, conflicts };
}

/**
 * Create audits from preview
 * This is the actual creation step
 */
export async function createAuditsFromPreview(
    previews: AuditPreview[]
): Promise<ScheduleResult & { createdAudits?: Array<{ _id: string; site: { _id: string; name: string }; onDate: Date; participants: Array<{ _id: string; fullName: string; email: string }>; checkCount: number }> }> {
    await connectDB();

    let created = 0;
    let skipped = 0;
    const conflicts: string[] = [];
    const createdAudits: Array<{ _id: string; site: { _id: string; name: string }; onDate: Date; participants: Array<{ _id: string; fullName: string; email: string }>; checkCount: number }> = [];

    for (const preview of previews) {
        try {
            // Check if audit already exists
            const existing = await Audit.findOne({
                site: preview.siteId,
                onDate: preview.date,
            });

            if (existing) {
                skipped++;
                conflicts.push(
                    `${preview.siteName} - ${preview.date.toLocaleDateString(
                        'hu-HU'
                    )}: Már létezik audit erre a napra`
                );
                continue;
            }

            // Get site checks
            const site = await Site.findById(preview.siteId)
                .select('checks')
                .lean()
                .exec();
            
            console.log(`[createAuditsFromPreview] Site ${preview.siteName} (${preview.siteId}):`, {
                siteExists: !!site,
                checksArray: site?.checks,
                checksLength: site?.checks?.length || 0,
                checksType: typeof site?.checks,
            });
            
            if (!site) {
                skipped++;
                conflicts.push(
                    `${preview.siteName}: A terület nem található`
                );
                continue;
            }
            
            if (!site.checks || !Array.isArray(site.checks) || site.checks.length === 0) {
                skipped++;
                conflicts.push(
                    `${preview.siteName}: Nincsenek ellenőrzési pontok definiálva (checks array: ${JSON.stringify(site.checks)})`
                );
                continue;
            }

            // Fetch checks manually - handle both ObjectId and string formats
            const checkIds = site.checks.map((id: any) => {
                // Convert to ObjectId if needed
                if (typeof id === 'object' && id.toString) {
                    return new ObjectId(id.toString());
                }
                if (ObjectId.isValid(String(id))) {
                    return new ObjectId(String(id));
                }
                return String(id);
            });
            
            console.log(`[createAuditsFromPreview] Site ${preview.siteName} check IDs:`, checkIds.map(id => id.toString()));
            
            const checks = await Check.find({ _id: { $in: checkIds } })
                .select('_id')
                .lean()
                .exec();

            console.log(`[createAuditsFromPreview] Site ${preview.siteName} found ${checks.length} checks in database`);

            if (checks.length === 0) {
                skipped++;
                conflicts.push(
                    `${preview.siteName}: Az ellenőrzési pontok nem találhatók az adatbázisban (keresett ID-k: ${checkIds.join(', ')})`
                );
                continue;
            }

            // Create initial results (empty for scheduled audits)
            const initialResults = checks.map((check: any) => ({
                check: check._id,
                result: undefined, // Will be set when audit is executed
                comment: undefined,
                image: undefined,
            }));

            // Create audit
            const newAudit = await Audit.create({
                site: preview.siteId,
                participants: preview.auditors.map((a) => a._id),
                onDate: preview.date,
                result: initialResults,
            });

            // Store created audit data for email sending
            createdAudits.push({
                _id: newAudit._id.toString(),
                site: {
                    _id: preview.siteId,
                    name: preview.siteName,
                },
                onDate: preview.date,
                participants: preview.auditors,
                checkCount: initialResults.length,
            });

            created++;
        } catch (error) {
            console.error('Error creating audit:', error);
            conflicts.push(
                `${preview.siteName} - ${preview.date.toLocaleDateString(
                    'hu-HU'
                )}: Hiba a létrehozás során: ${error instanceof Error ? error.message : String(error)}`
            );
            skipped++;
        }
    }

    // Send email notifications to participants
    if (createdAudits.length > 0) {
        try {
            const { sendBulkAuditNotifications } = await import('@/lib/email/audit-email');
            const emailResult = await sendBulkAuditNotifications(createdAudits);
            console.log(`[createAuditsFromPreview] Emails sent: ${emailResult.totalSent}, failed: ${emailResult.totalFailed}`);
        } catch (emailError) {
            console.error('[createAuditsFromPreview] Email error:', emailError);
            // Don't fail the whole process if emails fail
        }
    }

    return {
        success: true,
        auditsCreated: created,
        auditsSkipped: skipped,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
        createdAudits: createdAudits.length > 0 ? createdAudits : undefined,
        message: `${created} audit sikeresen létrehozva${
            skipped > 0 ? `, ${skipped} kihagyva` : ''
        }`,
    };
}

/**
 * Main scheduling function
 * Generates preview and creates audits in one go
 */
export async function scheduleAudits(config: ScheduleConfig): Promise<ScheduleResult> {
    try {
        // Generate preview
        const { previews, conflicts: previewConflicts } = await generateAuditPreview(config);

        if (previews.length === 0) {
            return {
                success: false,
                message: 'Nincs audit generálva. Ellenőrizd a beállításokat.',
                conflicts: previewConflicts,
            };
        }

        // Create audits
        const result = await createAuditsFromPreview(previews);

        // Merge conflicts
        const allConflicts = [
            ...(previewConflicts || []),
            ...(result.conflicts || []),
        ];

        return {
            ...result,
            conflicts: allConflicts.length > 0 ? allConflicts : undefined,
        };
    } catch (error) {
        console.error('Schedule audits error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}


/**
 * Generate audits for recurring schedules
 * Runs via Cron job daily
 */
export async function generateRecurringAudits(): Promise<{
    processed: number;
    auditsCreated: number;
    errors: string[];
}> {
    await connectDB();
    
    // Import RecurringSchedule model
    await import('@/lib/db/models/RecurringSchedule');
    const RecurringSchedule = (await import('@/lib/db/models/RecurringSchedule')).default;
    
    const activeSchedules = await RecurringSchedule.find({ isActive: true });
    
    let processed = 0;
    let totalCreated = 0;
    const errors: string[] = [];
    
    const LOOKAHEAD_DAYS = 14; // Always schedule 2 weeks ahead
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (const schedule of activeSchedules) {
        try {
            // Determine start date: lastGenerated + 1 day, or today if never generated
            let startDate = new Date(today);
            if (schedule.lastGeneratedDate) {
                startDate = new Date(schedule.lastGeneratedDate);
                startDate.setDate(startDate.getDate() + 1);
                
                // If last generated is far in past (e.g. paused for months), don't fill months backlog.
                // Just start from today.
                if (startDate < today) {
                    startDate = new Date(today);
                }
            }
            
            // Determine end date: today + LOOKAHEAD_DAYS
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + LOOKAHEAD_DAYS);
            
            // If up to date, skip
            if (startDate > endDate) {
                continue;
            }
            
            const config: ScheduleConfig = {
                siteIds: schedule.siteIds.map((id: any) => id.toString()),
                startDate: startDate,
                endDate: endDate,
                frequency: schedule.frequency as ScheduleFrequency,
                auditorPool: schedule.auditorPool?.map((id: any) => id.toString()),
                auditorsPerAudit: schedule.auditorsPerAudit,
                maxAuditsPerDay: schedule.maxAuditsPerDay,
                respectBreaks: true,
            };
            
            const result = await scheduleAudits(config);
            
            if (result.success) {
                totalCreated += result.auditsCreated || 0;
                
                // Update lastGeneratedDate
                schedule.lastGeneratedDate = endDate;
                await schedule.save();
            } else {
                errors.push(`Schedule "${schedule.name}" failed: ${result.message}`);
                if (result.conflicts) {
                    errors.push(...result.conflicts.map(c => `Conflict in "${schedule.name}": ${c}`));
                }
            }
            
            processed++;
        } catch (error) {
            console.error(`Error processing schedule ${schedule._id}:`, error);
            errors.push(`Error in schedule "${schedule.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    return {
        processed,
        auditsCreated: totalCreated,
        errors
    };
}


/**
 * Post-Scheduling Conflict Resolution
 * 
 * Called when a user creates a break. Checks for conflicts with existing scheduled audits
 * and attempts to reassign them.
 */
export async function resolveAuditConflicts(
    userId: string,
    breakStart: Date,
    breakEnd: Date
): Promise<{ resolved: number; failed: number; logs: string[] }> {
    await connectDB();
    const logs: string[] = [];
    let resolved = 0;
    let failed = 0;

    // Normalize dates
    const start = new Date(breakStart);
    start.setHours(0, 0, 0, 0);
    const end = new Date(breakEnd || breakStart);
    end.setHours(23, 59, 59, 999);

    // Find conflicting audits
    // Status must be 'scheduled' (not in_progress or completed)
    const conflictingAudits = await Audit.find({
        participants: userId,
        onDate: { $gte: start, $lte: end },
        startTime: { $exists: false } // ensure it hasn't started
    });

    if (conflictingAudits.length === 0) {
        return { resolved: 0, failed: 0, logs };
    }

    logs.push(`Found ${conflictingAudits.length} conflicting audits for user ${userId}`);

    for (const audit of conflictingAudits) {
        try {
            // Find available replacements
            // We need to look for auditors who are NOT in the current participants list
            const currentParticipantIds = audit.participants.map((p: any) => p.toString());
            const availableAuditors = await getAvailableAuditorsForDate(audit.onDate, undefined); // undefined pool = all auditors
            
            // Filter out:
            // 1. The user taking the break (already handled by getAvailableAuditorsForDate usually, but just in case)
            // 2. Auditors already assigned to THIS audit
            const candidates = availableAuditors.filter(a => 
                a._id.toString() !== userId && 
                !currentParticipantIds.includes(a._id.toString())
            );

            if (candidates.length > 0) {
                // Pick a candidate (simple strategy: first one, or random)
                // Better strategy: picked one with least audits that day? 
                // For now, let's pick the first available candidate.
                const replacement = candidates[0];
                
                // Remove old user, add new user
                audit.participants = audit.participants.filter((p: any) => p.toString() !== userId);
                audit.participants.push(replacement._id);
                
                await audit.save();
                logs.push(`Resolved conflict for audit ${audit._id} on ${audit.onDate.toISOString().split('T')[0]}: Replaced with ${replacement.fullName}`);
                resolved++;
            } else {
                // No replacement found
                // We just remove the user? Or leave them and let it fail?
                // Requirements say "needs to be changed".
                // If we remove them, the audit might have 0 participants.
                // If we leave them, they are on break.
                // Let's remove them to respect the break, but log a warning.
                
                audit.participants = audit.participants.filter((p: any) => p.toString() !== userId);
                await audit.save();
                
                logs.push(`WARNING: Removed user from audit ${audit._id} on ${audit.onDate.toISOString().split('T')[0]} but NO REPLACEMENT found!`);
                failed++;
            }
        } catch (e: any) {
            logs.push(`Error resolving audit ${audit._id}: ${e.message}`);
            failed++;
        }
    }

    return { resolved, failed, logs };
}
