"use server";

import { registerSchema } from '@/lib/validation';
import { adminExists, registerUser } from '@/lib/auth';

export type RegisterFormState =
    | {
        success: false;
        fieldErrors?: {
            email?: string[];
            password?: string[];
            fullName?: string[];
        };
        message?: string;
    }
    | {
        success: true;
        message?: string;
    };

export async function registerAction(
    _prevState: RegisterFormState,
    formData: FormData
): Promise<RegisterFormState> {
    const rawEmail = formData.get('email');
    const rawPassword = formData.get('password');
    const rawFullName = formData.get('fullName');
    const role = 'admin';

    const parsed = registerSchema.safeParse({ email: rawEmail, password: rawPassword, role, fullName: rawFullName });
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

    // Guard: allow exactly one admin registration via quickstart
    if (await adminExists()) {
        return { success: false, message: 'Már létezik admin felhasználó' };
    }

    await registerUser(email, password, role, fullName, true);
    
    return { success: true };
}


