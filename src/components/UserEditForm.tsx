"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import type { SerializableUser } from "@/lib/auth";
import { useActionState, useEffect, useMemo, useState } from "react";
import { redirect } from "next/navigation";

export type UserEditFormState = {
	success: boolean;
	fieldErrors?: { fullName?: string[]; email?: string[]; password?: string[] };
	message?: string;
};

export default function UserEditForm({
	user,
	currentUser,
	updateAction,
	cancelRedirectTo,
	onFinishRedirectTo
}: {
	user: SerializableUser
	currentUser: SerializableUser | null
	updateAction: (prevState: UserEditFormState, formData: FormData) => Promise<UserEditFormState>
	cancelRedirectTo?: string
	onFinishRedirectTo?: string
}) {
	const [fullName, setFullName] = useState(user.fullName);
	const [email, setEmail] = useState(user.email);
	const [password, setPassword] = useState("");
	const [state, formAction] = useActionState(updateAction, { success: false });
	const isCurrentUser = useMemo(() => currentUser?.id === user.id, [currentUser, user.id]);

	const fullNameChanged = useMemo(() => fullName !== user.fullName, [fullName, user.fullName]);
	const emailChanged = useMemo(() => email !== user.email, [email, user.email]);
	const passwordChanged = useMemo(() => password.length > 0, [password]);

	useEffect(() => {
		if (state.success && isCurrentUser && passwordChanged) {
			window.dispatchEvent(new Event("auth-change"));
			redirect("/login");
		}
		if (state.success && onFinishRedirectTo) {
			redirect(onFinishRedirectTo);
		}
	}, [state.success, isCurrentUser, passwordChanged, onFinishRedirectTo]);

	return (
		<form className="flex flex-col gap-6" action={formAction}>
			<div className="flex flex-col gap-2">
				<div className="flex flex-row gap-1 items-center">
					<Label htmlFor="fullName">Teljes név</Label>
					{fullNameChanged ? <span className="text-sm text-blue-600 italic leading-none">módosítva</span> : null}
				</div>
				<Input
					id="fullName"
					name="fullName"
					placeholder="Gipsz Jakab"
					value={fullName}
					onChange={(e) => setFullName(e.target.value)}
				/>
				{state.success === false && state.fieldErrors?.fullName?.length ? (
					<p className="text-sm text-red-600">{state.fieldErrors.fullName[0]}</p>
				) : null}
			</div>
			<div className="flex flex-col gap-2">
				<div className="flex flex-row gap-1 items-center">
					<Label htmlFor="email">Email</Label>
					{emailChanged ? <span className="text-sm text-blue-600 italic leading-none">módosítva</span> : null}
				</div>
				<Input
					id="email"
					name="email"
					placeholder="gipszjakab@gmail.com"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					autoComplete="email"
				/>
				{state.success === false && state.fieldErrors?.email?.length ? (
					<p className="text-sm text-red-600">{state.fieldErrors.email[0]}</p>
				) : null}
			</div>
			<div className="flex flex-col gap-2">
				<div className="flex flex-row gap-1 items-center">
					<Label htmlFor="password">Jelszó</Label>
					{passwordChanged ? <span className="text-sm text-blue-600 italic leading-none">módosítva</span> : null}
				</div>
				<PasswordInput
					id="password"
					name="password"
					placeholder="Password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					autoComplete="new-password"
				/>
				{state.success === false && state.fieldErrors?.password?.length ? (
					<p className="text-sm text-red-600">{state.fieldErrors.password[0]}</p>
				) : null}
			</div>
			{state.success === false && state.message ? (
				<p className="text-sm text-red-600">{state.message}</p>
			) : null}
			{state.success ? (
				<p className="text-sm text-green-600">Sikeresen frissítve.</p>
			) : null}
			<div className="flex flex-row gap-2 justify-end">
				{cancelRedirectTo ? (
					<Button variant="outline" onClick={(e) => { e.preventDefault(); redirect(cancelRedirectTo) }}>Bezárás</Button>
				) : null}
				<Button type="submit">Módosítás</Button>
			</div>
		</form>
	)
}


