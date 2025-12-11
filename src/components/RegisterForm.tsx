"use client";

import { Label } from "@/components/ui/label";
import { useActionState, useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { PasswordInput } from "./ui/password-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { getRoleTranslation } from "@/lib/utils";
import { redirect } from "next/navigation";

export type RegisterFormState = {
    success: boolean;
    fieldErrors?: {
        fullName?: string[];
        email?: string[];
        password?: string[];
    };
    message?: string;
}

const initialState: RegisterFormState = { success: false };

export function RegisterForm({
    registerAction,
    roleSelect,
    redirectTo,
    isLogin,
    cancelRedirectTo
}: {
    registerAction: (prevState: RegisterFormState, formData: FormData) => Promise<RegisterFormState>,
    roleSelect?: boolean
    redirectTo?: string
    isLogin?: boolean
    cancelRedirectTo?: string
}) {
    const [state, formAction] = useActionState(registerAction, initialState);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [role, setRole] = useState("");

    useEffect(() => {
        if (state.success) {
            setEmail("");
            setPassword("");
            setFullName("");
            setRole("");
            if (redirectTo) {
                redirect(redirectTo);
            }
        }
    }, [state.success, redirectTo]);

    return (
        <form action={formAction} className="flex flex-col gap-6">
            {roleSelect ? (
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row gap-1 items-center">
                        <Label htmlFor="role">Szerepkör</Label>
                        <span className="text-sm text-red-600">*</span>
                    </div>
                    <Select name="role" required value={role} onValueChange={(value) => setRole(value)}>
                        <SelectTrigger className="w-full" id="role">
                            <SelectValue placeholder="Válassz szerepkört" />
                        </SelectTrigger>
                        <SelectContent>
                            {["admin", "auditor", "fixer"].map((role) => (
                                <SelectItem key={role} value={role}>{getRoleTranslation(role)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            ) : null}
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-1 items-center">
                    <Label htmlFor="fullName">Teljes név</Label>
                    <span className="text-sm text-red-600">*</span>
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
                    <span className="text-sm text-red-600">*</span>
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
                    <span className="text-sm text-red-600">*</span>
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
            <div className="flex flex-col gap-2">
                <Button onClick={isLogin ? () => window.dispatchEvent(new Event("auth-delay-check")) : undefined} type="submit">Regisztráció</Button>
                {cancelRedirectTo ? <Button variant="outline" onClick={() => redirect(cancelRedirectTo)}>Mégsem</Button> : null}
            </div>
        </form>
    );
}