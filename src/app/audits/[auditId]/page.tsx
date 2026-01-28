import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getMyAuditById } from "../actions";
import Link from "next/link";
import { ArrowLeftIcon, CalendarIcon, ClockIcon, PlayIcon, UsersIcon } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import FixAuditItem from "@/components/FixAuditItem";

export default async function UserAuditDetailsPage({
    params,
}: {
    params: Promise<{ auditId: string }>;
}) {
    const { auditId } = await params;
    const [audit, currentUser] = await Promise.all([
        getMyAuditById(auditId),
        getCurrentUser()
    ]);

    if (!audit || !currentUser) {
        notFound();
    }
    
    const isFixer = currentUser.role === 'fixer';

    const date = new Date(audit.onDate);
    const formattedDate = date.toLocaleDateString('hu-HU', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    const canExecute = audit.status === 'scheduled' || audit.status === 'in_progress';
    const isToday = new Date(audit.onDate).toDateString() === new Date().toDateString();
    const isInProgress = audit.status === 'in_progress';

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-4xl">
            <div className="flex items-center justify-between">
                <Link href="/audits">
                    <Button variant="ghost" size="sm">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        Vissza a listához
                    </Button>
                </Link>

                {canExecute && (
                    <Link href={`/audits/${auditId}/execute`}>
                        <Button>
                            <PlayIcon className="w-4 h-4 mr-2" />
                            {isInProgress ? 'Folytatás' : 'Ellenőrzés indítása'}
                        </Button>
                    </Link>
                )}
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl">{audit.site?.name || 'Ismeretlen terület'}</CardTitle>
                            <CardDescription>Ellenőrzés részletei</CardDescription>
                        </div>
                        <StatusBadge status={audit.status as 'scheduled' | 'in_progress' | 'completed'} />
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Alapadatok */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm text-muted-foreground">Dátum</p>
                                <p className="font-medium">{formattedDate}</p>
                            </div>
                        </div>

                        {audit.startTime && (
                            <div className="flex items-center gap-3">
                                <ClockIcon className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Kezdés</p>
                                    <p className="font-medium">
                                        {new Date(audit.startTime).toLocaleTimeString('hu-HU', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        )}

                        {audit.endTime && (
                            <div className="flex items-center gap-3">
                                <ClockIcon className="w-5 h-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm text-muted-foreground">Befejezés</p>
                                    <p className="font-medium">
                                        {new Date(audit.endTime).toLocaleTimeString('hu-HU', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Résztvevők */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <UsersIcon className="w-5 h-5 text-muted-foreground" />
                            <h3 className="font-semibold">Résztvevők</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {audit.participants.map((participant: any) => (
                                <div
                                    key={participant._id}
                                    className="px-3 py-1 bg-secondary text-white rounded-full text-sm"
                                >
                                    {participant.fullName}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Ellenőrzési pontok */}
                    <div>
                        <h3 className="font-semibold mb-3">
                            Ellenőrzési pontok ({audit.result?.length || 0})
                        </h3>
                        {audit.result && audit.result.length > 0 ? (
                            <div className="space-y-2">
                                {audit.result.map((result: any, index: number) => (
                                    <div
                                        key={result._id || index}
                                        className="p-4 border rounded-lg"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="font-medium mb-1">
                                                    {result.check?.text || 'Ismeretlen ellenőrzési pont'}
                                                </p>
                                                {result.check?.description && (
                                                    <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                                                        {result.check.description}
                                                    </p>
                                                )}
                                                {result.pass !== undefined && (
                                                    <div className="mt-2">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                                                                result.pass
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}
                                                        >
                                                            {result.pass ? '✓ OK' : '✗ NOK'}
                                                        </span>
                                                    </div>
                                                )}
                                                {result.comment && (
                                                    <p className="text-sm text-muted-foreground mt-2">
                                                        Megjegyzés: {result.comment}
                                                    </p>
                                                )}
                                            </div>
                                            {result.image && (
                                                <div className="relative w-32 h-32 rounded overflow-hidden border">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={`/api/upload/${result.image}`}
                                                        alt="Audit kép"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Fixer Interface */}
                                        {(isFixer || result.fixedBy) && (result.pass === false || result.result === false) && (
                                            <FixAuditItem 
                                                auditId={audit._id}
                                                checkId={result.check?._id || ''}
                                                currentFix={result.fixedAt ? {
                                                    fixedAt: result.fixedAt,
                                                    fixedBy: result.fixedBy,
                                                    fixComment: result.fixComment,
                                                    fixImage: result.fixImage,
                                                } : undefined}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground mb-4">
                                    {audit.status === 'scheduled'
                                        ? 'Az ellenőrzés még nem lett elvégezve.'
                                        : audit.status === 'in_progress'
                                        ? 'Az ellenőrzés folyamatban van.'
                                        : 'Nincsenek ellenőrzési eredmények.'}
                                </p>
                                {canExecute && (
                                    <Link href={`/audits/${auditId}/execute`}>
                                        <Button>
                                            <PlayIcon className="w-4 h-4 mr-2" />
                                            {isInProgress ? 'Folytatás' : 'Ellenőrzés indítása'}
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Info box scheduled esetén */}
                    {audit.status === 'scheduled' && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                                Az ellenőrzés {formattedDate}-ra van ütemezve, de bármikor elindítható.
                            </p>
                        </div>
                    )}

                    {/* Info box in_progress esetén */}
                    {audit.status === 'in_progress' && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                <strong>Folyamatban:</strong> Ez az ellenőrzés jelenleg folyamatban van. 
                                Kattints a &quot;Folytatás&quot; gombra a checklist megnyitásához.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Container>
    );
}

