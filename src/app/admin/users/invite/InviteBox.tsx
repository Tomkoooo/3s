"use client";

import { Button } from "@/components/ui/button"
import { getRoleTranslation } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useActionState, useState } from "react";
import { generateInviteAction } from "./actions";
import { CopyInput } from "@/components/ui/copy-input";
import { Input } from "@/components/ui/input";

export const InviteBox = () => {
    const [role, setRole] = useState<string>("auditor");
    const [comment, setComment] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    
    const boundAction = generateInviteAction.bind(null, role, comment, email);
    const [state, formAction] = useActionState(boundAction, {
        success: false,
    });

    const inviteUrl = state.success && state.inviteUrl
        ? state.inviteUrl
        : '';

    return (<div>
        <form action={formAction} className="flex flex-col gap-3 w-full">
            <div className="flex flex-col gap-2 w-full">
                <Label>Email cím (opcionális)</Label>
                <Input 
                    type="email" 
                    placeholder="pelda@email.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                />
                <p className="text-xs text-muted-foreground">Ha megadod, a rendszer automatikusan kiküldi a meghívót emailben.</p>
            </div>
            <div className="flex flex-col gap-2 w-full">
                <Label>Szerepkör</Label>
                <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="w-full">
                        <SelectValue className="w-full" placeholder="Válassz szerepkört" />
                    </SelectTrigger>
                    <SelectContent>
                        {["admin", "fixer", "auditor"].map((r) => (
                            <SelectItem key={r} value={r}>{getRoleTranslation(r)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex flex-col gap-2 w-full">
                <Label>Megjegyzés</Label>
                <Input value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
            <Button variant="secondary" type="submit">Meghívó generálása és küldése</Button>
            {state.success && state.inviteId ? (
                <div className="flex flex-col gap-1">
                    <Label>Meghívó link</Label>
                    <CopyInput value={inviteUrl} readOnly />
                    <span className="text-sm text-muted-foreground">Lejár: {state.expiresAt ? new Date(state.expiresAt).toLocaleString('hu-HU', { dateStyle: 'short', timeStyle: 'short' }) : ''}</span>
                </div>
            ) : null}
            {state.success === false && state.message ? (
                <p className="text-sm text-red-600">{state.message}</p>
            ) : null}
        </form>
    </div>)
}