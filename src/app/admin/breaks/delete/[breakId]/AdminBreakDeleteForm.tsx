"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DeleteBreakState } from "@/app/my-account/breaks/actions";
import { deleteBreakForUserAction } from "@/app/my-account/breaks/actions";

const initialState: DeleteBreakState = { success: false };

type AdminBreakDeleteFormProps = {
    breakId: string;
    targetUserId: string;
};

export default function AdminBreakDeleteForm({ breakId, targetUserId }: AdminBreakDeleteFormProps) {
    const router = useRouter();
    const [state, formAction] = useActionState(
        deleteBreakForUserAction.bind(null, breakId, targetUserId), 
        initialState
    );

    useEffect(() => {
        if (state.success) {
            router.replace("/admin/breaks");
        }
    }, [state, router]);

    return (
        <form action={formAction}>
            <div className="flex flex-row gap-2">
                <Button variant="outline" onClick={() => router.push("/admin/breaks")}>
                    Mégsem
                </Button>
                <Button variant="destructive" type="submit">
                    <TrashIcon className="w-4 h-4" /> Törlés
                </Button>
            </div>
            {state.success === false && state.message ? (
                <p className="text-sm text-red-600 mt-2">{state.message}</p>
            ) : null}
        </form>
    );
}
