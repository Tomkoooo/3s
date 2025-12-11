"use server";

import { breakSchema } from "@/lib/validation";
import { getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Break, { BreakDocument } from "@/lib/db/models/Break";
import { SerializableUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { resolveAuditConflicts } from "@/lib/audit-scheduler";

// Helper function to parse and validate form data
function parseBreakFormData(formData: FormData) {
    const rawInput = {
        start: formData.get("start")?.toString(),
        end: formData.get("end")?.toString() || undefined,
        reason: formData.get("reason")?.toString() || undefined,
    };

    const parsed = breakSchema.safeParse(rawInput);
    if (!parsed.success) {
        const fieldErrors: BreakFormState["fieldErrors"] = {};
        for (const issue of parsed.error.issues) {
            const path = issue.path[0];
            if (!path || typeof path !== "string") continue;
            fieldErrors[path as keyof NonNullable<typeof fieldErrors>] = [
                issue.message,
            ];
        }
        return {
            success: false as const,
            fieldErrors,
            message: "Kérjük, javítsd a megadott mezőket.",
        };
    }

    return {
        success: true as const,
        data: {
            start: parsed.data.start,
            end: parsed.data.end || parsed.data.start, // Use start date if end is not specified
            reason: parsed.data.reason,
        },
    };
}

// Helper function to check admin permissions
function checkAdminPermission(currentUser: SerializableUser) {
    if (currentUser.role !== 'admin') {
        return {
            success: false as const,
            message: "Nincs jogosultságod ehhez a művelethez.",
        };
    }
    return { success: true as const };
}

export type BreakFormState = {
    success: boolean;
    fieldErrors?: {
        start?: string[];
        end?: string[];
        reason?: string[];
    };
    message?: string;
};

export type DeleteBreakState = {
    success: boolean;
    message?: string;
};

export async function createBreakAction(
    _prevState: BreakFormState,
    formData: FormData
): Promise<BreakFormState> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect("/login");
    }

    const parseResult = parseBreakFormData(formData);
    if (!parseResult.success) {
        return parseResult;
    }

    try {
        await connectDB();
        await Break.create({
            userId: currentUser.id,
            start: parseResult.data.start,
            end: parseResult.data.end,
            reason: parseResult.data.reason,
        });

        // Resolve conflicts
        try {
            const resolution = await resolveAuditConflicts(
                currentUser.id,
                new Date(parseResult.data.start),
                new Date(parseResult.data.end || parseResult.data.start)
            );
            if (resolution.resolved > 0) {
                console.log(`Resolved ${resolution.resolved} conflicts for user ${currentUser.id}`);
            }
        } catch (confError) {
            console.error('Error resolving conflicts:', confError);
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Ismeretlen hiba történt",
        };
    }
}

export async function updateBreakAction(
    breakId: string,
    _prevState: BreakFormState,
    formData: FormData
): Promise<BreakFormState> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect("/login");
    }

    const parseResult = parseBreakFormData(formData);
    if (!parseResult.success) {
        return parseResult;
    }

    try {
        await connectDB();
        const breakDoc = await Break.findOneAndUpdate(
            { _id: breakId, userId: currentUser.id },
            {
                start: parseResult.data.start,
                end: parseResult.data.end,
                reason: parseResult.data.reason,
            },
            { new: true }
        );

        if (!breakDoc) {
            return {
                success: false,
                message: "Szünet nem található vagy nincs jogosultságod a szerkesztéshez.",
            };
        }

        // Resolve conflicts
        try {
            const resolution = await resolveAuditConflicts(
                currentUser.id,
                new Date(parseResult.data.start),
                new Date(parseResult.data.end || parseResult.data.start)
            );
            if (resolution.resolved > 0) {
                console.log(`Resolved ${resolution.resolved} conflicts for user ${currentUser.id}`);
            }
        } catch (confError) {
            console.error('Error resolving conflicts:', confError);
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Ismeretlen hiba történt",
        };
    }
}

export async function deleteBreakAction(breakId: string): Promise<DeleteBreakState> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect("/login");
    }

    try {
        await connectDB();
        const result = await Break.findOneAndDelete({
            _id: breakId,
            userId: currentUser.id,
        });

        if (!result) {
            return {
                success: false,
                message: "Szünet nem található vagy nincs jogosultságod a törléshez.",
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Ismeretlen hiba történt",
        };
    }
}

export async function getBreakById(breakId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect("/login");
    }

    try {
        await connectDB();
        const breakDoc = await Break.findOne({
            _id: breakId,
            userId: currentUser.id,
        }).lean().exec();

        if (!breakDoc) {
            return null;
        }

        return {
            _id: (breakDoc as BreakDocument)._id.toString(),
            start: (breakDoc as BreakDocument).start,
            end: (breakDoc as BreakDocument).end,
            reason: (breakDoc as BreakDocument).reason,
        };
    } catch {
        return null;
    }
}

// Admin-specific actions
export async function createBreakForUserAction(
    _prevState: BreakFormState,
    formData: FormData
): Promise<BreakFormState> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect("/login");
    }

    const adminCheck = checkAdminPermission(currentUser);
    if (!adminCheck.success) {
        return adminCheck;
    }

    // Extract targetUserId from formData
    const targetUserId = formData.get("targetUserId")?.toString();
    if (!targetUserId) {
        return {
            success: false,
            message: "Felhasználó kiválasztása kötelező.",
        };
    }

    const parseResult = parseBreakFormData(formData);
    if (!parseResult.success) {
        return parseResult;
    }

    try {
        await connectDB();
        await Break.create({
            userId: targetUserId,
            start: parseResult.data.start,
            end: parseResult.data.end,
            reason: parseResult.data.reason,
        });

        // Resolve conflicts
        try {
            const resolution = await resolveAuditConflicts(
                targetUserId,
                new Date(parseResult.data.start),
                new Date(parseResult.data.end || parseResult.data.start)
            );
            if (resolution.resolved > 0) {
                console.log(`Resolved ${resolution.resolved} conflicts for user ${targetUserId}`);
            }
        } catch (confError) {
            console.error('Error resolving conflicts:', confError);
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Ismeretlen hiba történt",
        };
    }
}

export async function updateBreakForUserAction(
    breakId: string,
    targetUserId: string,
    _prevState: BreakFormState,
    formData: FormData
): Promise<BreakFormState> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect("/login");
    }

    const adminCheck = checkAdminPermission(currentUser);
    if (!adminCheck.success) {
        return adminCheck;
    }

    const parseResult = parseBreakFormData(formData);
    if (!parseResult.success) {
        return parseResult;
    }

    try {
        await connectDB();
        const breakDoc = await Break.findOneAndUpdate(
            { _id: breakId, userId: targetUserId },
            {
                start: parseResult.data.start,
                end: parseResult.data.end,
                reason: parseResult.data.reason,
            },
            { new: true }
        );

        if (!breakDoc) {
            return {
                success: false,
                message: "Szünet nem található.",
            };
        }

        // Resolve conflicts
        try {
            const resolution = await resolveAuditConflicts(
                targetUserId,
                new Date(parseResult.data.start),
                new Date(parseResult.data.end || parseResult.data.start)
            );
            if (resolution.resolved > 0) {
                console.log(`Resolved ${resolution.resolved} conflicts for user ${targetUserId}`);
            }
        } catch (confError) {
            console.error('Error resolving conflicts:', confError);
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Ismeretlen hiba történt",
        };
    }
}

export async function deleteBreakForUserAction(breakId: string, targetUserId: string): Promise<DeleteBreakState> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect("/login");
    }

    const adminCheck = checkAdminPermission(currentUser);
    if (!adminCheck.success) {
        return adminCheck;
    }

    try {
        await connectDB();
        const result = await Break.findOneAndDelete({
            _id: breakId,
            userId: targetUserId,
        });

        if (!result) {
            return {
                success: false,
                message: "Szünet nem található.",
            };
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Ismeretlen hiba történt",
        };
    }
}

export async function getBreakByIdForUser(breakId: string, targetUserId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect("/login");
    }

    const adminCheck = checkAdminPermission(currentUser);
    if (!adminCheck.success) {
        return null;
    }

    try {
        await connectDB();
        const breakDoc = await Break.findOne({
            _id: breakId,
            userId: targetUserId,
        }).lean().exec();

        if (!breakDoc) {
            return null;
        }

        return {
            _id: (breakDoc as BreakDocument)._id.toString(),
            start: (breakDoc as BreakDocument).start,
            end: (breakDoc as BreakDocument).end,
            reason: (breakDoc as BreakDocument).reason,
        };
    } catch {
        return null;
    }
}