"use server";

import { RegisterFormState } from "@/components/RegisterForm";
import { registerSchema } from "@/lib/validation";
import { registerWithInvite } from "@/lib/auth";

export const registerUserWithInviteAction = async (inviteId: string, _prevState: RegisterFormState, formData: FormData): Promise<RegisterFormState> => {
    const rawEmail = formData.get("email");
    const rawPassword = formData.get("password");
    const rawFullName = formData.get("fullName");

    const parsed = registerSchema.safeParse({ email: rawEmail, password: rawPassword, fullName: rawFullName });
    if (!parsed.success) {
        const { fieldErrors, formErrors } = parsed.error.flatten((issue) => issue.message);
        return {
            success: false,
            fieldErrors: {
                email: fieldErrors.email,
                password: fieldErrors.password,
                fullName: fieldErrors.fullName,
            },
            message: formErrors[0],
        };
    }

    const { email, password, fullName } = parsed.data;
    try {
        await registerWithInvite(inviteId, email, password, fullName, true);
        return { success: true };
    } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Ismeretlen hiba történt" };
    }
}