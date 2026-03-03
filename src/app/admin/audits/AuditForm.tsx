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
import { Checkbox } from "@/components/ui/checkbox";

type AuditFormProps = {
    sites: Array<{ _id: string; name: string; fullPath: string }>;
    auditors: Array<{ _id: string; fullName: string; email: string; role?: string }>;
    adminRecipients?: Array<{ _id: string; fullName: string; email: string }>;
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
    adminRecipients = [],
    mode = 'create' 
}: AuditFormProps) {
    const router = useRouter();
    const [selectedSiteId, setSelectedSiteId] = useState(initialSiteId);
    const [selectedAuditorIds, setSelectedAuditorIds] = useState<string[]>(initialParticipantIds);
    const [summaryEmailList, setSummaryEmailList] = useState("");
    const [selectedSummaryAdminIds, setSelectedSummaryAdminIds] = useState<string[]>([]);
    const [adminRecipientFilter, setAdminRecipientFilter] = useState("");
    
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
    const filteredAdminRecipients = adminRecipients.filter((admin) => {
        if (!adminRecipientFilter.trim()) return true;
        const token = adminRecipientFilter.trim().toLowerCase();
        return (
            admin.fullName.toLowerCase().includes(token) ||
            admin.email.toLowerCase().includes(token)
        );
    });

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

            {mode === 'create' && (
                <div className="flex flex-col gap-3 border rounded-md p-3">
                    <Label htmlFor="summaryEmailList">Összefoglaló email extra címzettek</Label>
                    <Input
                        id="summaryEmailList"
                        name="summaryEmailList"
                        value={summaryEmailList}
                        onChange={(e) => setSummaryEmailList(e.target.value)}
                        placeholder="email1@ceg.hu, email2@ceg.hu"
                        disabled={isPending}
                    />
                    <p className="text-xs text-muted-foreground">
                        Ezek a címzettek a site beállításaihoz hozzáadódnak a lezárt audit összefoglalónál.
                    </p>

                    <div className="flex flex-col gap-2">
                        <Label>Admin címzettek kiválasztása (összefoglaló email)</Label>
                        <Input
                            value={adminRecipientFilter}
                            onChange={(e) => setAdminRecipientFilter(e.target.value)}
                            placeholder="Keresés admin név/email alapján"
                            disabled={isPending}
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => setSelectedSummaryAdminIds(filteredAdminRecipients.map((a) => a._id))}
                            >
                                Szűrt kijelölése
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() =>
                                    setSelectedSummaryAdminIds((prev) =>
                                        prev.filter((id) => !filteredAdminRecipients.some((a) => a._id === id))
                                    )
                                }
                            >
                                Szűrt törlése
                            </Button>
                        </div>
                        {adminRecipients.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Nincs elérhető admin felhasználó.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {filteredAdminRecipients.map((admin) => (
                                    <label key={admin._id} className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={selectedSummaryAdminIds.includes(admin._id)}
                                            onCheckedChange={(checked) => {
                                                setSelectedSummaryAdminIds((prev) => {
                                                    if (checked) return Array.from(new Set([...prev, admin._id]));
                                                    return prev.filter((id) => id !== admin._id);
                                                });
                                            }}
                                        />
                                        <span>{admin.fullName} ({admin.email})</span>
                                    </label>
                                ))}
                            </div>
                        )}
                        {selectedSummaryAdminIds.map((id) => (
                            <input key={id} type="hidden" name="summaryAdminRecipients" value={id} />
                        ))}
                    </div>
                </div>
            )}

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



