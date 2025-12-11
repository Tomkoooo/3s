"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DeleteBreakState } from "@/app/my-account/breaks/actions";

const initialState: DeleteBreakState = { success: false };

type BreakDeleteFormProps = {
    action: (prevState: DeleteBreakState, formData: FormData) => Promise<DeleteBreakState>;
};

export default function BreakDeleteForm({ action }: BreakDeleteFormProps) {
    const [state, formAction] = useActionState(action, initialState);
    const router = useRouter();

    useEffect(() => {
        if (state.success) {
            router.replace("/my-account/breaks");
        }
    }, [state, router]);

    return (
        <form action={formAction}>
            <Button variant="destructive" onClick={() => {
                window.dispatchEvent(new Event("auth-delay-check"));
            }}>
                <TrashIcon className="w-4 h-4" /> Törlés
            </Button>
        </form>
    );
}
