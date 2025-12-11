"use server";

import { connectDB } from '@/lib/db';
import { signIn } from '@/lib/auth';

export type LoginFormState =
    | {
        success: false;
        fieldErrors?: {
            email?: string[];
            password?: string[];
        };
        message?: string;
    }
    | {
        success: true;
        message?: string;
    };

export async function loginAction(
    _prevState: LoginFormState,
    formData: FormData
): Promise<LoginFormState> {
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    if (!email || !password) {
        const fieldErrors: LoginFormState & { success: false } = {
            success: false,
            fieldErrors: {
                email: !email ? ['Kötelező mező'] : undefined,
                password: !password ? ['Kötelező mező'] : undefined,
            },
        };
        return fieldErrors;
    }

    try {
        await connectDB();
        const token = await signIn(email, password);
        if (!token) {
            return { success: false, message: 'Hibás email vagy jelszó' };
        }
    } catch {
        return { success: false, message: 'Váratlan hiba történt. Próbáld újra később.' };
    }

    return { success: true };
}


    // 