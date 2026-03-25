"use server";

import { connectDB } from "@/lib/db";
import Audit from "@/lib/db/models/Audit";
import Check from "@/lib/db/models/Check";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendAuditResultSummaryForCompletedAudit } from "@/lib/email/audit-email";

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
        pass?: boolean;
        valueText?: string;
        comment?: string;
        imageIds?: string[];
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

        const checkIds = audit.result.map((r: any) => r.check.toString());
        const checks = await Check.find({ _id: { $in: checkIds } }).select("_id answerType").lean().exec();
        const checkMap = new Map(checks.map((c: any) => [c._id.toString(), c]));

        // Validáció: minden check ki van-e töltve (type-aware)
        if (results.length !== audit.result.length) {
            return { success: false, message: 'Nem minden ellenőrzési pont van kitöltve' };
        }

        const missing = results.find((r) => {
            const check = checkMap.get(r.checkId);
            if (check?.answerType === 'info_text') return false; // valueText is optional by design
            return r.pass === undefined || r.pass === null;
        });
        if (missing) {
            return { success: false, message: 'Nem minden ellenőrzési pont van kitöltve' };
        }

        // NOK-ok validálása (komment kötelező) - only for scored OK/NOK checks
        const invalidNok = results.find((r) => {
            const check = checkMap.get(r.checkId);
            if (check?.answerType === 'info_text') return false;
            return r.pass === false && !r.comment;
        });
        if (invalidNok) {
            return { success: false, message: 'NOK esetén a komment megadása kötelező' };
        }

        // Eredmények frissítése
        for (const result of results) {
            const auditResult = audit.result.find((r: any) => r.check.toString() === result.checkId);
            if (auditResult) {
                const check = checkMap.get(result.checkId);
                if (check?.answerType === 'info_text') {
                    auditResult.valueText = result.valueText || undefined;
                    auditResult.result = undefined as any;
                    auditResult.comment = undefined;
                    auditResult.images = [];
                    auditResult.image = undefined;
                } else {
                    auditResult.valueText = undefined;
                    auditResult.result = result.pass as any; // Map pass to result field
                    auditResult.comment = result.comment || undefined;
                    // Support both legacy single image and new array
                    if (result.imageIds && result.imageIds.length > 0) {
                        auditResult.images = result.imageIds;
                        auditResult.image = result.imageIds[0]; // Backward compatibility
                    } else {
                        auditResult.images = [];
                        auditResult.image = undefined;
                    }
                }
            }
        }

        // Státusz + endTime beállítása
        audit.status = 'completed';
        audit.endTime = new Date();
        await audit.save();

        // Send summary emails in background; audit completion must not fail due to email issues.
        sendAuditResultSummaryForCompletedAudit(auditId).catch((error) => {
            console.error('[EMAIL] Failed to send audit summary email:', error);
        });

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

/**
 * Audit részeredmény mentése (nem fejezi be, csak ment)
 */
export async function updateAuditProgressAction(
    auditId: string,
    checkId: string,
    data: {
        pass?: boolean;
        valueText?: string;
        comment?: string;
        imageIds?: string[];
    }
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

        // Jogosultság/Státusz ellenőrzés
        const isParticipant = audit.participants.some((p: any) => p.toString() === currentUser.id);
        if (!isParticipant && currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez az ellenőrzéshez' };
        }
        
        if (audit.status === 'completed') {
            return { success: false, message: 'Már lezárt ellenőrzés nem módosítható' };
        }

        // Keresés a result tömbben check ID alapján
        const auditResult = audit.result.find((r: any) => r.check.toString() === checkId);
        if (!auditResult) {
            return { success: false, message: 'Érvénytelen ellenőrzési pont' };
        }

        const check = await Check.findById(checkId).select("_id answerType").lean().exec();
        if (check?.answerType === 'info_text') {
            auditResult.valueText = data.valueText || undefined;
            auditResult.result = undefined as any;
            auditResult.comment = undefined;
            auditResult.images = [];
            auditResult.image = undefined;
        } else {
            // Adatok frissítése
            auditResult.valueText = undefined;
            auditResult.result = data.pass as any;
            auditResult.comment = data.comment || undefined;
            
            if (data.imageIds && data.imageIds.length > 0) {
                auditResult.images = data.imageIds;
                auditResult.image = data.imageIds[0]; // Backward compatibility
            } else {
                auditResult.images = [];
                auditResult.image = undefined;
            }
        }

        // Státusz frissítése in_progress-re ha még scheduled volt
        if (audit.status === 'scheduled') {
            audit.status = 'in_progress';
            if (!audit.startTime) {
                audit.startTime = new Date();
            }
        }

        await audit.save();
        revalidatePath(`/audits/${auditId}/execute`);
        return { success: true };
    } catch (error) {
        console.error('Update audit progress error:', error);
        return { success: false, message: 'Mentés sikertelen' };
    }
}

