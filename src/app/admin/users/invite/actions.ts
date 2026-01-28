"use server";

import { generateInvite, getCurrentUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Invite from "@/lib/db/models/Invite";
import { headers } from "next/headers";
import { sendInviteEmail } from "@/lib/email/user-email";

export type InviteFormState = {
    success: boolean;
    message?: string;
    inviteId?: string;
    inviteUrl?: string;
    expiresAt?: string;
}

export async function generateInviteAction(role: string, comment: string, email?: string): Promise<InviteFormState> {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        return { success: false, message: 'Nincs jogosultság meghívó létrehozásához.' };
    }

    // Use BASE_URL from env (for ngrok) or extract from request
    const h = await headers();
    const baseUrl = process.env.BASE_URL || new URL(h.get('x-url') ?? '').origin;

    const validRoles = ['auditor', 'fixer', 'admin'] as const;
    type Role = typeof validRoles[number];
    const isRole = (value: string): value is Role => (validRoles as readonly string[]).includes(value);
    if (!isRole(role)) {
        return { success: false, message: 'Érvénytelen szerepkör.' };
    }

    const invite = await generateInvite(role, comment);
    const inviteId = String(invite._id);
    const inviteUrl = `${baseUrl}/invite/${inviteId}`;

    // Ha megadtak email címet, küldjük ki a meghívót
    if (email && email.trim()) {
        const emailResult = await sendInviteEmail({
            recipientEmail: email,
            role: role,
            inviteUrl: inviteUrl,
            expiresAt: invite.expiresAt.toISOString(),
            comment: comment
        });

        if (!emailResult.success) {
            console.error('[INVITE EMAIL SEND FAILED]', emailResult.error);
            return {
                success: true,
                inviteId,
                inviteUrl,
                expiresAt: invite.expiresAt.toISOString(),
                message: `Meghívó létrehozva, de az email küldése sikertelen: ${emailResult.error}`
            };
        }
    }

    return {
        success: true,
        inviteId,
        inviteUrl,
        expiresAt: invite.expiresAt.toISOString(),
        message: email ? 'Meghívó létrehozva és kiküldve emailben.' : 'Meghívó létrehozva.'
    };
}

export async function deleteInviteAction(inviteId: string) {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
        return { success: false, message: 'Nincs jogosultság meghívó törléséhez.' };
    }

    await connectDB()
    await Invite.deleteOne({ _id: inviteId });
    return { success: true };
}