"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircleIcon } from "lucide-react";
import { submitAuditFix } from "@/app/audits/[auditId]/actions";
import { toast } from "sonner";
import Image from "next/image";
import MultiImageUpload from "@/components/MultiImageUpload";

interface Props {
    auditId: string;
    checkId: string; // This matches the check ID in the result array
    resultId?: string; // Optional result ID if needed
    currentFix?: {
        fixedAt?: string;
        fixedBy?: string;
        fixComment?: string;
        fixImage?: string;
        fixImages?: string[];
    };
}

export default function FixAuditItem({ auditId, checkId, currentFix }: Props) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [comment, setComment] = useState(currentFix?.fixComment || "");
    const [imageIds, setImageIds] = useState<string[]>(
        currentFix?.fixImages || (currentFix?.fixImage ? [currentFix.fixImage] : [])
    );
    const [isPending, startTransition] = useTransition();

    const isFixed = !!currentFix?.fixedAt;

    const handleSubmit = () => {
        if (!comment.trim()) return toast.error("Kérjük írj megjegyzést a javításról!");
        
        startTransition(async () => {
            const result = await submitAuditFix(auditId, checkId, comment, imageIds.length > 0 ? imageIds : undefined);
            if (result.success) {
                toast.success("Javítás rögzítve!");
                setIsExpanded(false);
            } else {
                toast.error("Hiba történt: " + result.message);
            }
        });
    };

    if (isFixed) {
        const displayImages = currentFix?.fixImages || (currentFix?.fixImage ? [currentFix.fixImage] : []);
        
        return (
            <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-semibold text-green-900">Javítva</p>
                        <p className="text-sm text-green-800 mt-1">{currentFix?.fixComment}</p>
                        {displayImages.length > 0 && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {displayImages.map((imgId, idx) => (
                                    <div key={idx} className="w-20 h-20 relative rounded border overflow-hidden">
                                        <Image src={`/api/upload/${imgId}`} alt={`Fix proof ${idx + 1}`} fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-green-700 mt-2">
                             Rögzítve: {new Date(currentFix!.fixedAt!).toLocaleDateString('hu-HU')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isExpanded) {
        return (
            <div className="mt-2">
                <Button onClick={() => setIsExpanded(true)} variant="outline" className="w-full sm:w-auto border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100 hover:text-orange-900">
                    <CheckCircleIcon className="w-4 h-4 mr-2" />
                    Javítás rögzítése
                </Button>
            </div>
        );
    }

    return (
        <div className="mt-4 bg-orange-50 rounded-lg p-4 border border-orange-200 animate-in fade-in slide-in-from-top-2">
            <h4 className="font-semibold text-orange-900 mb-3">Javítás rögzítése</h4>
            
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`fix-comment-${checkId}`} className="text-orange-900">Megjegyzés a javításról</Label>
                    <Textarea 
                        id={`fix-comment-${checkId}`} 
                        placeholder="Mi történt? Hogyan lett elhárítva a hiba?" 
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        className="bg-white"
                    />
                </div>

                <div className="space-y-2">
                    <Label className="text-orange-900">Bizonyíték képek (opcionális)</Label>
                    <p className="text-sm text-muted-foreground">
                        Tölts fel képeket a javítás állapotáról.
                    </p>
                    <MultiImageUpload 
                        onImagesChange={setImageIds}
                        existingImageIds={imageIds}
                        maxImages={5}
                    />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>Mégse</Button>
                    <Button onClick={handleSubmit} disabled={isPending} className="bg-orange-600 hover:bg-orange-700 text-white">
                        {isPending ? 'Mentés...' : 'Javítás mentése'}
                    </Button>
                </div>
            </div>
        </div>
    );
}
