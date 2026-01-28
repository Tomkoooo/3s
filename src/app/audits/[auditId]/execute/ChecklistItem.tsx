"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import MultiImageUpload from "@/components/MultiImageUpload";

type ChecklistItemProps = {
    check: {
        _id: string;
        text: string;
        description?: string;
        referenceImage?: string;
    };
    result?: {
        checkId: string;
        pass: boolean;
        comment?: string;
        imageIds?: string[];
    };
    onResult: (checkId: string, pass: boolean, comment?: string, imageIds?: string[]) => void;
    auditId: string;
};

export default function ChecklistItem({ check, result, onResult }: ChecklistItemProps) {
    const [pass, setPass] = useState<boolean | null>(result?.pass ?? null);
    const [comment, setComment] = useState(result?.comment || '');
    const [imageIds, setImageIds] = useState<string[]>(result?.imageIds || []);

    const handlePassChange = (newPass: boolean) => {
        setPass(newPass);
        onResult(check._id, newPass, comment, imageIds);
    };

    const handleCommentChange = (newComment: string) => {
        setComment(newComment);
        if (pass !== null) {
            onResult(check._id, pass, newComment, imageIds);
        }
    };

    const handleImageUpload = (newImageIds: string[]) => {
        setImageIds(newImageIds);
        if (pass !== null) {
            onResult(check._id, pass, comment, newImageIds);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">{check.text}</CardTitle>
                {check.description && (
                    <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                        {check.description}
                    </p>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Referencia kép */}
                {check.referenceImage && (
                    <div>
                        <Label>Referencia kép</Label>
                        <div className="relative w-full h-48 rounded-md overflow-hidden border mt-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={`/api/upload/${check.referenceImage}`}
                                alt="Referencia"
                                className="w-full h-full object-contain"
                            />
                        </div>
                    </div>
                )}

                {/* OK / NOK gombok */}
                <div>
                    <Label>Eredmény</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <Button
                            variant={pass === true ? "default" : "outline"}
                            size="lg"
                            onClick={() => handlePassChange(true)}
                            className={`h-20 ${pass === true ? 'bg-green-600 hover:bg-green-700' : ''}`}
                        >
                            <CheckCircle2Icon className="w-8 h-8 mr-2" />
                            OK
                        </Button>
                        <Button
                            variant={pass === false ? "default" : "outline"}
                            size="lg"
                            onClick={() => handlePassChange(false)}
                            className={`h-20 ${pass === false ? 'bg-red-600 hover:bg-red-700' : ''}`}
                        >
                            <XCircleIcon className="w-8 h-8 mr-2" />
                            NOK
                        </Button>
                    </div>
                </div>

                {/* NOK esetén komment + kép (kötelező) */}
                {pass === false && (
                    <>
                        <div>
                            <Label htmlFor="comment">
                                Megjegyzés <span className="text-red-600">*</span>
                            </Label>
                            <Textarea
                                id="comment"
                                placeholder="Írd le, mi a probléma..."
                                value={comment}
                                onChange={(e) => handleCommentChange(e.target.value)}
                                rows={3}
                                className="mt-2"
                                required
                            />
                            {!comment && (
                                <p className="text-sm text-red-600 mt-1">
                                    NOK esetén a megjegyzés megadása kötelező
                                </p>
                            )}
                        </div>

                        <div>
                            <Label>
                                Fotók feltöltése <span className="text-muted-foreground">(opcionális)</span>
                            </Label>
                            <div className="mt-2">
                                <MultiImageUpload
                                    onImagesChange={handleImageUpload}
                                    existingImageIds={imageIds}
                                    maxImages={100}
                                />
                            </div>
                        </div>
                    </>
                )}

                {/* OK esetén opcionális komment */}
                {pass === true && (
                    <div>
                        <Label htmlFor="comment">
                            Megjegyzés <span className="text-muted-foreground">(opcionális)</span>
                        </Label>
                        <Textarea
                            id="comment"
                            placeholder="Tetszőleges megjegyzés..."
                            value={comment}
                            onChange={(e) => handleCommentChange(e.target.value)}
                            rows={2}
                            className="mt-2"
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


