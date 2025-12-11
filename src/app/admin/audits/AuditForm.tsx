"use client";

import { useActionState, useState, useEffect } from "react";
import { createAuditAction, updateAuditAction, type AuditFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import SiteSelect from "@/components/SiteSelect";
import AuditorSelect from "@/components/AuditorSelect";

type AuditFormProps = {
    sites: Array<{ _id: string; name: string; fullPath: string }>;
    auditors: Array<{ _id: string; fullName: string; email: string }>;
    auditId?: string;
    initialSiteId?: string;
    initialParticipantIds?: string[];
    initialDate?: string;
    mode?: 'create' | 'update';
};

export default function AuditForm({ 
    sites,
    auditors,
    auditId,
    initialSiteId = '',
    initialParticipantIds = [],
    initialDate = '',
    mode = 'create' 
}: AuditFormProps) {
    const router = useRouter();
    const [selectedSiteId, setSelectedSiteId] = useState(initialSiteId);
    const [selectedAuditorIds, setSelectedAuditorIds] = useState<string[]>(initialParticipantIds);
    
    const initialState: AuditFormState = { success: false };
    
    const action = mode === 'create' 
        ? createAuditAction 
        : updateAuditAction.bind(null, auditId!);
    
    const [state, formAction, isPending] = useActionState(action, initialState);

    useEffect(() => {
        if (state.success) {
            toast.success(state.message || 'Művelet sikeres');
            router.push('/admin/audits');
            router.refresh();
        } else if (state.message && !state.success) {
            toast.error(state.message);
        }
    }, [state, router]);

    // Minimum date (ma)
    const today = new Date().toISOString().split('T')[0];

    return (
        <form action={formAction} className="flex flex-col gap-4">
            {mode === 'create' && (
                <div className="flex flex-col gap-2">
                    <Label htmlFor="siteId">Terület</Label>
                    <SiteSelect 
                        sites={sites}
                        name="siteId"
                        value={selectedSiteId}
                        onChange={setSelectedSiteId}
                        required
                        disabled={isPending}
                    />
                    {state.fieldErrors?.siteId && (
                        <p className="text-sm text-red-600">{state.fieldErrors.siteId[0]}</p>
                    )}
                </div>
            )}

            <div className="flex flex-col gap-2">
                <Label htmlFor="onDate">Dátum</Label>
                <Input
                    id="onDate"
                    name="onDate"
                    type="date"
                    defaultValue={initialDate}
                    min={today}
                    required
                    disabled={isPending}
                />
                {state.fieldErrors?.onDate && (
                    <p className="text-sm text-red-600">{state.fieldErrors.onDate[0]}</p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <Label>Auditorok (min. 1 fő)</Label>
                <AuditorSelect 
                    auditors={auditors}
                    name="participants"
                    value={selectedAuditorIds}
                    onChange={setSelectedAuditorIds}
                    min={1}
                />
                {state.fieldErrors?.participants && (
                    <p className="text-sm text-red-600">{state.fieldErrors.participants[0]}</p>
                )}
            </div>

            <div className="flex flex-row gap-2 justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={isPending}
                >
                    Mégse
                </Button>
                <Button type="submit" disabled={isPending || selectedAuditorIds.length === 0}>
                    {isPending ? 'Mentés...' : mode === 'create' ? 'Létrehozás' : 'Mentés'}
                </Button>
            </div>
        </form>
    );
}



