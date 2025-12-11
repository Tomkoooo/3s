"use client";

import { Button } from "@/components/ui/button";
import { TrashIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteAuditAction } from "../actions";
import { toast } from "sonner";

export default function DeleteAuditButton({ auditId }: { auditId: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (!confirm('Biztosan törlöd ezt az ellenőrzést? Ez a művelet nem visszavonható!')) {
            return;
        }

        startTransition(async () => {
            const result = await deleteAuditAction(auditId);
            if (result.success) {
                toast.success(result.message || 'Ellenőrzés törölve');
                router.push('/admin/audits');
                router.refresh();
            } else {
                toast.error(result.message || 'Hiba történt a törlés során');
            }
        });
    };

    return (
        <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
        >
            <TrashIcon className="w-4 h-4 mr-2" />
            {isPending ? 'Törlés...' : 'Törlés'}
        </Button>
    );
}



