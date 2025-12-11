"use client";

import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DeleteUserState } from "./actions";

const initialState: DeleteUserState = { success: false };

type DeleteFormProps = {
    action: (prevState: DeleteUserState, formData: FormData) => Promise<DeleteUserState>;
};

export default function DeleteForm({ action }: DeleteFormProps) {
    const [state, formAction] = useActionState(action, initialState);
    const router = useRouter();

    useEffect(() => {
        if (state.success) {
            router.replace("/admin/users");
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


