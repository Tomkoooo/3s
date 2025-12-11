"use server";

import { connectDB } from "@/lib/db";
import RecurringSchedule from "@/lib/db/models/RecurringSchedule";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Get all recurring schedules
 */
export async function getRecurringSchedules() {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return [];
        }

        await connectDB();
        
        // Populate logic if needed, for now just basic info
        const schedules = await RecurringSchedule.find()
            .populate('siteIds', 'name')
            .sort({ createdAt: -1 })
            .lean();
            
        return schedules.map(s => ({
            ...s,
            _id: s._id.toString(),
            siteIds: s.siteIds.map((site: any) => ({
                _id: site._id.toString(),
                name: site.name
            })),
            auditorPool: s.auditorPool?.map((id: any) => id.toString()) || [],
            createdBy: s.createdBy.toString(),
            createdAt: s.createdAt.toISOString(),
            lastGeneratedDate: s.lastGeneratedDate ? s.lastGeneratedDate.toISOString() : undefined,
        }));
    } catch (error) {
        console.error('Get schedules error:', error);
        return [];
    }
}

/**
 * Toggle active status of a schedule
 */
export async function toggleScheduleActive(scheduleId: string, isActive: boolean) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Unauthorized' };
        }

        await connectDB();
        await RecurringSchedule.findByIdAndUpdate(scheduleId, { isActive });
        
        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Error' };
    }
}

/**
 * Delete a schedule
 */
export async function deleteSchedule(scheduleId: string) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Unauthorized' };
        }

        await connectDB();
        await RecurringSchedule.findByIdAndDelete(scheduleId);
        
        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : 'Error' };
    }
}

/**
 * Create a new recurring schedule
 */
export async function createRecurringSchedule(data: {
    name: string;
    siteIds: string[];
    frequency: 'daily' | 'weekly' | 'monthly';
    auditorPool: string[]; // empty means all
    auditorsPerAudit: number;
    maxAuditsPerDay?: number;
}) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Unauthorized' };
        }

        await connectDB();

        await RecurringSchedule.create({
            name: data.name,
            siteIds: data.siteIds,
            frequency: data.frequency,
            auditorPool: data.auditorPool.length > 0 ? data.auditorPool : undefined,
            auditorsPerAudit: data.auditorsPerAudit,
            maxAuditsPerDay: data.maxAuditsPerDay,
            createdBy: currentUser.id,
            isActive: true,
        });

        revalidatePath('/admin/schedules');
        return { success: true };
    } catch (error) {
        console.error('Create schedule error:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Error' };
    }
}
