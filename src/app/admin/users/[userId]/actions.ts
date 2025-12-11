"use server";

import { userEditSchema } from "@/lib/validation";
import { updateUser } from "@/lib/auth";

export type UserEditFormState = {
    success: boolean;
    fieldErrors?: { fullName?: string[]; email?: string[]; password?: string[] };
    message?: string;
};

export async function updateUserAction(
    userId: string,
    _prevState: UserEditFormState,
    formData: FormData
): Promise<UserEditFormState> {
    const rawInput = {
        fullName: formData.get("fullName")?.toString() || undefined,
        email: formData.get("email")?.toString() || undefined,
        password: formData.get("password")?.toString() || undefined,
    };

    // Ne küldjünk üres jelszót
    if (rawInput.password === "") rawInput.password = undefined;

    const parsed = userEditSchema.safeParse(rawInput);
    if (!parsed.success) {
        const fieldErrors: UserEditFormState["fieldErrors"] = {};
        for (const issue of parsed.error.issues) {
            const path = issue.path[0];
            if (!path || typeof path !== "string") continue;
            fieldErrors[path as keyof NonNullable<typeof fieldErrors>] = [
                issue.message,
            ];
        }
        return {
            success: false,
            fieldErrors,
            message: "Kérjük, javítsd a megadott mezőket.",
        };
    }

    try {
        await updateUser(userId, parsed.data);
        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Ismeretlen hiba történt",
        };
    }
}


