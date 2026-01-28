"use server";

import { connectDB } from "@/lib/db";
import Audit from "@/lib/db/models/Audit";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitAuditFix(
    auditId: string, 
    checkId: string, 
    fixComment: string, 
    fixImageIds?: string[]
) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'fixer') {
            return { success: false, message: 'Unauthorized' };
        }

        await connectDB();
        
        const audit = await Audit.findById(auditId);
        if (!audit) {
            return { success: false, message: 'Audit not found' };
        }

        // Find the result item
        const resultItem = audit.result.find((r: any) => 
            r.check.toString() === checkId || 
            (r._id && r._id.toString() === checkId) // fallback if passed result _id
        );

        if (!resultItem) {
            return { success: false, message: 'Result item not found' };
        }

        // Update with fix info
        resultItem.fixedBy = currentUser.id;
        resultItem.fixedAt = new Date();
        resultItem.fixComment = fixComment;
        
        // Support for multiple images (new) and single image (backward compatibility)
        if (fixImageIds && fixImageIds.length > 0) {
            resultItem.fixImages = fixImageIds;
            // Keep the first image in the old field for backward compatibility
            resultItem.fixImage = fixImageIds[0];
        }

        // Mongoose might not detect deep change in array
        audit.markModified('result');
        await audit.save();

        revalidatePath(`/audits/${auditId}`);
        return { success: true };
    } catch (error) {
        console.error('Submit fix error:', error);
        return { success: false, message: error instanceof Error ? error.message : 'Error' };
    }
}

