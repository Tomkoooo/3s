"use server";

import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { getCurrentUser, updateUser, SESSION_COOKIE_NAME, SESSION_COOKIE_MAX_AGE_MS } from "@/lib/auth";
import { userEditSchema } from "@/lib/validation";

export type UserEditFormState = {
    success: boolean;
    fieldErrors?: { fullName?: string[]; email?: string[]; password?: string[] };
    message?: string;
};

export async function updateMyAccountAction(
    _prevState: UserEditFormState,
    formData: FormData
): Promise<UserEditFormState> {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return { success: false, message: "Be kell jelentkezned." };
    }

    const rawInput = {
        fullName: formData.get("fullName")?.toString() || undefined,
        email: formData.get("email")?.toString() || undefined,
        password: formData.get("password")?.toString() || undefined,
    };

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
        const updated = await updateUser(currentUser.id, parsed.data);

        const passwordChanged = Boolean(parsed.data.password);
        const cookieStore = await cookies();
        // Ha jelszó változott: azonnali kijelentkeztetés (cookie törlés)
        if (passwordChanged) {
            cookieStore.delete(SESSION_COOKIE_NAME);
        } else {
            // mindenképp újrageneráljuk a session sütit aktuális adatokkal
            if (!process.env.JWT_SECRET) {
                throw new Error("JWT_SECRET is not set");
            }
            const maxAgeMs = SESSION_COOKIE_MAX_AGE_MS;
            const token = jwt.sign(
                {
                    id: updated._id.toString(),
                    role: updated.role,
                    email: updated.email,
                    fullName: updated.fullName,
                },
                process.env.JWT_SECRET,
                { expiresIn: maxAgeMs }
            );
            cookieStore.set({
                name: SESSION_COOKIE_NAME,
                value: token,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: maxAgeMs,
                path: "/",
            });
        }

        return { success: true };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "Ismeretlen hiba történt",
        };
    }
}