"use server";

import { deleteUser, getCurrentUser, SESSION_COOKIE_NAME } from "@/lib/auth";
import { cookies } from "next/headers";

export type DeleteUserState =
    | { success: true; selfDelete?: boolean }
    | { success: false; message?: string };

export async function deleteUserAction(userId: string): Promise<DeleteUserState> {
    try {
        const current = await getCurrentUser();
        if (!current) return { success: false, message: "Nincs jogosultság." };
        await deleteUser(userId);
        if (current.id === userId) {
            const cookieStore = await cookies();
            cookieStore.delete(SESSION_COOKIE_NAME);
        }
        return { success: true, selfDelete: current.id === userId };
    } catch (err) {
        return { success: false, message: err instanceof Error ? err.message : "Ismeretlen hiba" };
    }
}


