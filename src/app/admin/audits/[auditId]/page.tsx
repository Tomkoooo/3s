import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAuditById, getAuditors, getAuditableSites } from "../actions";
import Link from "next/link";
import { ArrowLeftIcon, CalendarIcon, ClockIcon, EditIcon, UsersIcon } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import { notFound } from "next/navigation";
import DeleteAuditButton from "@/app/admin/audits/[auditId]/DeleteAuditButton";
import AuditForm from "../AuditForm";

export default async function AdminAuditDetailsPage({
    params,
    searchParams,
}: {
    params: Promise<{ auditId: string }>;
    searchParams: Promise<{ edit?: string }>;
}) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const isEditMode = resolvedSearchParams.edit === 'true';
    
    const audit = await getAuditById(resolvedParams.auditId);

    if (!audit) {
        notFound();
    }

    const date = new Date(audit.onDate);
    const formattedDate = date.toLocaleDateString('hu-HU', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    // Edit mode: betöltjük az auditorokat és site-okat
    if (isEditMode) {
        const [auditors, sites] = await Promise.all([
            getAuditors(),
            getAuditableSites(),
        ]);

        return (
            <Container className="flex-1 flex flex-col gap-4 max-w-2xl">
                <div className="flex items-center gap-2">
                    <Link href={`/admin/audits/${resolvedParams.auditId}`}>
                        <Button variant="ghost" size="sm">
                            <ArrowLeftIcon className="w-4 h-4 mr-2" />
                            Vissza
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Ellenőrzés szerkesztése</CardTitle>
                        <CardDescription>
                            Módosítsd az ellenőrzés részleteit
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AuditForm 
                            sites={sites}
                            auditors={auditors}
                            auditId={resolvedParams.auditId}
                            initialSiteId={audit.site?._id}
                            initialParticipantIds={audit.participants.map((p: any) => p._id)}
                            initialDate={audit.onDate ? new Date(audit.onDate).toISOString().split('T')[0] : ''}
                            mode="update"
                        />
                    </CardContent>
                </Card>
            </Container>
        );
    }

    // View mode: részletek megjelenítése
    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-4xl">
            <div className="flex items-center justify-between">
                <Link href="/admin/audits">
                    <Button variant="ghost" size="sm">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        Vissza a listához
                    </Button>
                </Link>

                <div className="flex gap-2">
                    <Link href={`/admin/audits/${resolvedParams.auditId}?edit=true`}>
                        <Button variant="outline">
                            <EditIcon className="w-4 h-4 mr-2" />
                            Szerkesztés
                        </Button>
                    </Link>
                    <DeleteAuditButton auditId={resolvedParams.auditId} />
                </div>
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
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                {audit.status === 'scheduled'
                                    ? 'Az ellenőrzés még nem lett elvégezve.'
                                    : 'Nincsenek ellenőrzési eredmények.'}
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </Container>
    );
}

