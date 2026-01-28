"use client";

import { useActionState, useState, useRef } from "react";
import { createCheckAction, updateCheckAction, type CheckFormState } from "@/app/admin/sites/checks/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import MultiImageUpload from "./MultiImageUpload";

type CheckFormProps = {
    siteId: string;
    checkId?: string;
    initialText?: string;
    initialDescription?: string;
    initialReferenceImages?: string[];
    mode?: 'create' | 'update';
};

export default function CheckForm({ 
    siteId,
    checkId, 
    initialText = '', 
    initialDescription = '',
    initialReferenceImages = [],
    mode = 'create' 
}: CheckFormProps) {
    const router = useRouter();
    const formRef = useRef<HTMLFormElement>(null);
    const [referenceImageIds, setReferenceImageIds] = useState<string[]>(initialReferenceImages);
    const [shouldAddAnother, setShouldAddAnother] = useState(false);
    
    const initialState: CheckFormState = { success: false };
    
    const action = mode === 'create' 
        ? createCheckAction.bind(null, siteId)
        : updateCheckAction.bind(null, checkId!);
    
    const [state, formAction, isPending] = useActionState(action, initialState);

    useEffect(() => {
        if (state.success) {
            toast.success(state.message || 'Művelet sikeres');
            
            if (shouldAddAnother && mode === 'create') {
                // Reset form for next entry
                formRef.current?.reset();
                setReferenceImageIds([]);
                setShouldAddAnother(false);
                // Stay on the same page, don't navigate
            } else {
                router.back();
                router.refresh();
            }
        } else if (state.message && !state.success) {
            toast.error(state.message);
        }
    }, [state, router, shouldAddAnother, mode]);

    const handleSubmitWithFlag = (addAnother: boolean) => {
        setShouldAddAnother(addAnother);
    };

    return (
        <form ref={formRef} action={formAction} className="flex flex-col gap-4">
            <input type="hidden" name="referenceImages" value={referenceImageIds.join(',')} />
            
            <div className="flex flex-col gap-2">
                <Label htmlFor="text">Ellenőrzési pont címe</Label>
                <Input
                    id="text"
                    name="text"
                    defaultValue={initialText}
                    placeholder="pl. Biztonsági ajtó ellenőrzése"
                    required
                    disabled={isPending}
                />
                {state.fieldErrors?.text && (
                    <p className="text-sm text-red-600">{state.fieldErrors.text[0]}</p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <Label htmlFor="description">Részletes leírás (opcionális)</Label>
                <Textarea
                    id="description"
                    name="description"
                    defaultValue={initialDescription}
                    placeholder="Írj részletes instrukciót, hogy mire kell figyelni, mi a kritérium, mit kell kerülni..."
                    rows={4}
                    disabled={isPending}
                />
                <p className="text-sm text-muted-foreground">
                    Adj meg konkrét ellenőrzési szempontokat az auditornak (pl. "Ellenőrizd, hogy az ajtó szabadon nyílik-e, nincs-e sérült zsanér, van-e érvényes biztonsági matrica")
                </p>
                {state.fieldErrors?.description && (
                    <p className="text-sm text-red-600">{state.fieldErrors.description[0]}</p>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <Label>Referencia képek (opcionális)</Label>
                <p className="text-sm text-muted-foreground">
                    Tölts fel referencia képeket amelyek mutatják, hogy az ellenőrzési pontnak milyen állapotban kell lennie.
                </p>
                <MultiImageUpload 
                    onImagesChange={setReferenceImageIds}
                    existingImageIds={initialReferenceImages}
                    maxImages={5}
                />
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
                {mode === 'create' && (
                    <Button 
                        type="submit" 
                        variant="secondary"
                        disabled={isPending}
                        onClick={() => handleSubmitWithFlag(true)}
                    >
                        {isPending ? 'Mentés...' : 'Mentés és új hozzáadása'}
                    </Button>
                )}
                <Button 
                    type="submit" 
                    disabled={isPending}
                    onClick={() => handleSubmitWithFlag(false)}
                >
                    {isPending ? 'Mentés...' : mode === 'create' ? 'Létrehozás' : 'Mentés'}
                </Button>
            </div>
        </form>
    );
}

