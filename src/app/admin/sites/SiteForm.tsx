"use client";

import { useActionState } from "react";
import { createSiteAction, updateSiteAction, type SiteFormState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

type SiteFormProps = {
    siteId?: string;
    initialName?: string;
    initialLevel?: number;
    parentId?: string;
    mode?: 'create' | 'update';
};

export default function SiteForm({ 
    siteId, 
    initialName = '', 
    initialLevel = 0,
    parentId,
    mode = 'create' 
}: SiteFormProps) {
    const router = useRouter();
    
    const initialState: SiteFormState = { success: false };
    
    const action = mode === 'create' 
        ? createSiteAction 
        : updateSiteAction.bind(null, siteId!);
    
    const [state, formAction, isPending] = useActionState(action, initialState);

    useEffect(() => {
        if (state.success) {
            toast.success(state.message || 'Művelet sikeres');
            router.push('/admin/sites');
            router.refresh();
        } else if (state.message && !state.success) {
            toast.error(state.message);
        }
    }, [state, router]);

    return (
        <form action={formAction} className="flex flex-col gap-4">
            {parentId && (
                <input type="hidden" name="parentId" value={parentId} />
            )}
            {initialLevel !== undefined && (
                <input type="hidden" name="level" value={initialLevel} />
            )}
            
            <div className="flex flex-col gap-2">
                <Label htmlFor="name">Terület neve</Label>
                <Input
                    id="name"
                    name="name"
                    defaultValue={initialName}
                    placeholder="pl. Raktár A"
                    required
                    disabled={isPending}
                />
                {state.fieldErrors?.name && (
                    <p className="text-sm text-red-600">{state.fieldErrors.name[0]}</p>
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
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Mentés...' : mode === 'create' ? 'Létrehozás' : 'Mentés'}
                </Button>
            </div>
        </form>
    );
}


