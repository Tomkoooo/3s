"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Container from "@/components/container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeftIcon, CheckCircle2Icon, XCircleIcon } from "lucide-react";
import Link from "next/link";
import ChecklistItem from "./ChecklistItem";
import { startAuditAction, submitAuditResultAction } from "./actions";
import { toast } from "sonner";

type AuditExecutionClientProps = {
    audit: any;
};

export default function AuditExecutionClient({ audit }: AuditExecutionClientProps) {
    const router = useRouter();
    
    // Ha már in_progress, akkor azonnal started state
    const alreadyStarted = audit.status === 'in_progress' && audit.startTime;
    const [isStarted, setIsStarted] = useState(alreadyStarted);
    const [startTime, setStartTime] = useState<Date | null>(
        alreadyStarted ? new Date(audit.startTime!) : null
    );
    
    // Betöltjük a már meglévő eredményeket (ha vannak)
    const initialResults = audit.result
        ?.filter((r: any) => {
            const resultValue = r.result !== undefined ? r.result : r.pass;
            return resultValue !== undefined && resultValue !== null;
        })
        .map((r: any) => {
            const resultValue = r.result !== undefined ? r.result : r.pass;
            return {
                checkId: r.check._id || r.check,
                pass: resultValue,
                comment: r.comment,
                imageId: r.image,
            };
        }) || [];
    
    const [currentIndex, setCurrentIndex] = useState(initialResults.length > 0 ? initialResults.length : 0);
    const [results, setResults] = useState<Array<{
        checkId: string;
        pass: boolean;
        comment?: string;
        imageId?: string;
    }>>(initialResults);

    const totalChecks = audit.result?.length || 0;
    const progress = totalChecks > 0 ? ((currentIndex) / totalChecks) * 100 : 0;

    const handleStart = async () => {
        const result = await startAuditAction(audit._id);
        if (result.success) {
            setIsStarted(true);
            setStartTime(new Date());
            toast.success('Ellenőrzés elindítva');
        } else {
            toast.error(result.message || 'Hiba történt az indítás során');
        }
    };

    const handleCheckResult = (checkId: string, pass: boolean, comment?: string, imageId?: string) => {
        setResults(prev => {
            const existing = prev.find(r => r.checkId === checkId);
            if (existing) {
                return prev.map(r => r.checkId === checkId ? { checkId, pass, comment, imageId } : r);
            }
            return [...prev, { checkId, pass, comment, imageId }];
        });

        // Auto-advance ha OK (NOK esetén marad, mert komment + kép kell)
        if (pass && currentIndex < totalChecks - 1) {
            setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
        }
    };

    const handleNext = () => {
        if (currentIndex < totalChecks - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        if (results.length < totalChecks) {
            toast.error('Minden ellenőrzési pontot ki kell tölteni!');
            return;
        }

        // Ellenőrizzük, hogy minden NOK-hoz van-e komment
        const nokWithoutComment = results.find(r => !r.pass && !r.comment);
        if (nokWithoutComment) {
            toast.error('NOK esetén a komment megadása kötelező!');
            return;
        }

        const confirmed = confirm('Biztosan befejezed az ellenőrzést? Az eredményeket nem lehet később módosítani.');
        if (!confirmed) return;

        const result = await submitAuditResultAction(audit._id, results);
        if (result.success) {
            toast.success('Ellenőrzés sikeresen befejezve!');
            router.push(`/audits/${audit._id}`);
            router.refresh();
        } else {
            toast.error(result.message || 'Hiba történt a mentés során');
        }
    };

    const currentCheck = audit.result?.[currentIndex];
    const currentResult = results.find(r => r.checkId === currentCheck?._id);

    if (!isStarted) {
        return (
            <Container className="flex-1 flex flex-col items-center justify-center max-w-2xl">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle className="text-center">Ellenőrzés indítása</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center space-y-2">
                            <p className="text-lg font-semibold">{audit.site?.name}</p>
                            <p className="text-muted-foreground">
                                {totalChecks} ellenőrzési pont
                            </p>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Fontos:</strong> Az ellenőrzés indítása után az időt a rendszer rögzíti.
                                Végig kell menned minden ellenőrzési ponton.
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Link href={`/audits/${audit._id}`} className="flex-1">
                                <Button variant="outline" className="w-full">
                                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                                    Mégse
                                </Button>
                            </Link>
                            <Button onClick={handleStart} className="flex-1">
                                Indítás
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-2xl pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold">{audit.site?.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        {currentIndex + 1} / {totalChecks}
                    </p>
                </div>
                {startTime && (
                    <div className="text-sm text-muted-foreground">
                        Kezdés: {startTime.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
            </div>

            {/* Progress */}
            <Progress value={progress} className="h-2" />

            {/* Checklist Item */}
            {currentCheck && (
                <ChecklistItem
                    check={currentCheck.check}
                    result={currentResult}
                    onResult={handleCheckResult}
                    auditId={audit._id}
                />
            )}

            {/* Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 md:relative md:border-0 md:p-0">
                <div className="flex gap-2 max-w-2xl mx-auto">
                    <Button
                        variant="outline"
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className="flex-1"
                    >
                        Előző
                    </Button>

                    {currentIndex < totalChecks - 1 ? (
                        <Button
                            onClick={handleNext}
                            disabled={!currentResult}
                            className="flex-1"
                        >
                            Következő
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            disabled={results.length < totalChecks}
                            className="flex-1"
                        >
                            <CheckCircle2Icon className="w-4 h-4 mr-2" />
                            Befejezés
                        </Button>
                    )}
                </div>
            </div>
        </Container>
    );
}

