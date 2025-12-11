"use client";

import { useActionState, useEffect, useState } from 'react';
import { loginAction, type LoginFormState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { redirect } from 'next/navigation';

const initialState: LoginFormState = { success: false };

export default function LoginForm() {
    const [state, formAction] = useActionState(loginAction, initialState);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    useEffect(() => {
        if (state.success) {
            setEmail("");
            setPassword("");
            window.dispatchEvent(new Event('auth-change'));
            redirect('/');
        }
    }, [state.success]);

    useEffect(() => {
        window.dispatchEvent(new Event('auth-change'));
    }, []);

    return (
        <form action={formAction} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
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
                <Label htmlFor="password">Jelszó</Label>
                <PasswordInput
                    id="password"
                    name="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                />
                {state.success === false && state.fieldErrors?.password?.length ? (
                    <p className="text-sm text-red-600">{state.fieldErrors.password[0]}</p>
                ) : null}
            </div>
            <div className="flex flex-col gap-2">
                <Button type="submit">Bejelentkezés</Button>
                {state.success === false && state.message ? (
                    <p className="text-sm text-red-600">{state.message}</p>
                ) : null}
            </div>
        </form>
    );
}
