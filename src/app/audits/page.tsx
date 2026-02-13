import Container from "@/components/container";
import { getMyAudits } from "./actions";
import AuditCard from "@/components/AuditCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarIcon, LayoutListIcon, CheckCircle2Icon, ClockIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import dayjs from "@/lib/dayjs";

export default async function MyAuditsPage() {
    const audits = await getMyAudits();
    const currentUser = await getCurrentUser();

    const isFixer = currentUser?.role === 'fixer';
    const now = dayjs();
    const startOfWeek = now.startOf('week');
    const endOfWeek = now.endOf('week');

    // Grouping logic
    const currentWeekAudits = audits.filter((audit: any) => 
        dayjs(audit.onDate).isSame(now, 'week')
    );

    const otherAudits = audits.filter((audit: any) => 
        !dayjs(audit.onDate).isSame(now, 'week')
    );

    const availableCurrentWeek = currentWeekAudits.filter((a: any) => a.status !== 'completed');
    const completedCurrentWeek = currentWeekAudits.filter((a: any) => a.status === 'completed');

    return (
        <Container className="flex-1 flex flex-col gap-6 max-w-4xl pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{isFixer ? 'Javítandó feladatok' : 'Ellenőrzéseim'}</h1>
                    <p className="text-sm text-muted-foreground">
                        {isFixer ? 'Az alábbi ellenőrzések során hibákat találtak.' : 'Itt találod a hozzád rendelt ellenőrzéseket.'}
                    </p>
                </div>
                <Link href="/my-account/calendar">
                    <Button variant="outline" size="sm">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        Naptár nézet
                    </Button>
                </Link>
            </div>

            {audits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <LayoutListIcon className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground font-medium">
                        Még nincsenek hozzád rendelt ellenőrzések.
                    </p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* CURRENT WEEK SECTION */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-2 border-b pb-2">
                            <ClockIcon className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-semibold">Eheti ellenőrzések</h2>
                            <span className="text-xs text-muted-foreground ml-auto bg-muted px-2 py-1 rounded-md">
                                {startOfWeek.format('MMM D.')} - {endOfWeek.format('MMM D.')}
                            </span>
                        </div>

                        {/* Available this week */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                                <ClockIcon className="w-4 h-4" />
                                <h3>Elvégzendő ({availableCurrentWeek.length})</h3>
                            </div>
                            {availableCurrentWeek.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic pl-6">Nincs elvégzendő ellenőrzés ezen a héten.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {availableCurrentWeek.map((audit: any) => (
                                        <AuditCard key={audit._id} audit={audit} basePath="/audits" />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Completed this week */}
                        {completedCurrentWeek.length > 0 && (
                            <div className="space-y-4 pt-4">
                                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                                    <CheckCircle2Icon className="w-4 h-4" />
                                    <h3>Befejezett ezen a héten ({completedCurrentWeek.length})</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {completedCurrentWeek.map((audit: any) => (
                                        <AuditCard key={audit._id} audit={audit} basePath="/audits" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* OTHER AUDITS SECTION */}
                    {otherAudits.length > 0 && (
                        <div className="space-y-6 pt-6 opacity-80">
                            <div className="flex items-center gap-2 border-b pb-2">
                                <CalendarIcon className="w-5 h-5 text-muted-foreground" />
                                <h2 className="text-lg font-semibold text-muted-foreground">További ellenőrzések</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {otherAudits.map((audit: any) => (
                                    <AuditCard key={audit._id} audit={audit} basePath="/audits" />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Container>
    );
}


