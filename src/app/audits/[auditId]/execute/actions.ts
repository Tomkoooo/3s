"use server";

import { connectDB } from "@/lib/db";
import Audit from "@/lib/db/models/Audit";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Audit indítása (status: in_progress, startTime)
 */
export async function startAuditAction(auditId: string): Promise<{ success: boolean; message?: string }> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { success: false, message: 'Nincs bejelentkezve' };
        }

        await connectDB();

        const audit = await Audit.findById(auditId);
        if (!audit) {
            return { success: false, message: 'Audit nem található' };
        }

        // Jogosultság: csak ha résztvevő
        const isParticipant = audit.participants.some((p: any) => p.toString() === currentUser.id);
        if (!isParticipant && currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez az ellenőrzéshez' };
        }

        // Státusz ellenőrzés
        if (audit.status === 'completed') {
            return { success: false, message: 'Ez az ellenőrzés már be van fejezve' };
        }

        // Ha már in_progress, akkor OK (folytatás), ne módosítsuk a startTime-ot
        if (audit.status === 'in_progress') {
            return { success: true }; // Már elindult, engedjük folytatni
        }

        // Frissítés (csak scheduled esetén)
        audit.status = 'in_progress';
        audit.startTime = new Date();
        await audit.save();

        revalidatePath(`/audits/${auditId}`);
        return { success: true };
    } catch (error) {
        console.error('Start audit error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

/**
 * Audit eredmény beküldése (status: completed, endTime, results update)
 */
export async function submitAuditResultAction(
    auditId: string,
    results: Array<{
        checkId: string;
        pass: boolean;
        comment?: string;
        imageId?: string;
    }>
): Promise<{ success: boolean; message?: string }> {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { success: false, message: 'Nincs bejelentkezve' };
        }

        await connectDB();

        const audit = await Audit.findById(auditId);
        if (!audit) {
            return { success: false, message: 'Audit nem található' };
        }

        // Jogosultság
        const isParticipant = audit.participants.some((p: any) => p.toString() === currentUser.id);
        if (!isParticipant && currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez az ellenőrzéshez' };
        }

        // Státusz ellenőrzés
        if (audit.status !== 'in_progress') {
            return { success: false, message: 'Ez az ellenőrzés nincs folyamatban állapotban' };
        }

        // Validáció: minden check ki van-e töltve
        if (results.length !== audit.result.length) {
            return { success: false, message: 'Nem minden ellenőrzési pont van kitöltve' };
        }

        // NOK-ok validálása (komment kötelező)
        const invalidNok = results.find(r => !r.pass && !r.comment);
        if (invalidNok) {
            return { success: false, message: 'NOK esetén a komment megadása kötelező' };
        }

        // Eredmények frissítése
        for (const result of results) {
            const auditResult = audit.result.find((r: any) => r.check.toString() === result.checkId);
            if (auditResult) {
                auditResult.result = result.pass; // Map pass to result field
                auditResult.comment = result.comment || undefined;
                auditResult.image = result.imageId || undefined;
            }
        }

        // Státusz + endTime beállítása
        audit.status = 'completed';
        audit.endTime = new Date();
        await audit.save();

        revalidatePath(`/audits/${auditId}`);
        revalidatePath('/audits');
        return { success: true };
    } catch (error) {
        console.error('Submit audit result error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

