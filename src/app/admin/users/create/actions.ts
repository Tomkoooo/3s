"use server";

import { RegisterFormState } from "@/components/RegisterForm";
import { registerSchema } from "@/lib/validation";
import { getCurrentUser, registerUser } from "@/lib/auth";

export const createUserAction = async (_prevState: RegisterFormState, formData: FormData): Promise<RegisterFormState> => {
	const current = await getCurrentUser();
	if (!current || current.role !== "admin") {
		return { success: false, message: "Nincs jogosultság felhasználó létrehozásához." };
	}

	const rawEmail = formData.get("email");
	const rawPassword = formData.get("password");
	const rawFullName = formData.get("fullName");
	const rawRole = formData.get("role");

	const parsed = registerSchema.safeParse({ email: rawEmail, password: rawPassword, role: rawRole, fullName: rawFullName });
	if (!parsed.success) {
		const { fieldErrors, formErrors } = parsed.error.flatten((issue) => issue.message);
		return {
			success: false,
			fieldErrors: {
				email: fieldErrors.email,
				password: fieldErrors.password,
				fullName: fieldErrors.fullName,
			},
			message: formErrors[0] || fieldErrors["role"]?.[0],
		};
	}

	const { email, password, role, fullName } = parsed.data;
	try {
		await registerUser(email, password, role, fullName, false);
		return { success: true };
	} catch (error) {
		return { success: false, message: error instanceof Error ? error.message : "Ismeretlen hiba történt" };
	}
}