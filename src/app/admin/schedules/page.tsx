import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusIcon, PlayIcon, PauseIcon, TrashIcon, CalendarIcon } from "lucide-react";
import { getRecurringSchedules, toggleScheduleActive, deleteSchedule } from "./actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// We need a client component for the actions to be interactive without full page reload if we want smooth UX,
// but for now I'll use a simple form/action approach or a client component wrapper.
// Let's make a client component for the list item to handle interactions.
import ScheduleListItem from "./ScheduleListItem";

export const dynamic = 'force-dynamic';

export default async function SchedulesPage() {
    const schedules = await getRecurringSchedules();

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-full">
            <div className="flex flex-row items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Automatikus Ütemezések</h1>
                    <p className="text-sm text-muted-foreground">
                        Itt kezelheted a rendszeres, automatikusan generált auditokat.
                    </p>
                </div>
                <Link href="/admin/schedules/create">
                    <Button>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Új ütemezés
                    </Button>
                </Link>
            </div>

            {schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/10">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                    <h3 className="text-lg font-medium mb-2">Nincsenek aktív ütemezések</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                        Hozz létre egy új sablont, és a rendszer automatikusan generálni fogja az ellenőrzéseket a megadott gyakorisággal.
                    </p>
                    <Link href="/admin/schedules/create">
                        <Button variant="outline">
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Első ütemezés létrehozása
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {schedules.map((schedule) => (
                        <ScheduleListItem key={schedule._id} schedule={schedule} />
                    ))}
                </div>
            )}
        </Container>
    );
}
