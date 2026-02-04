import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusIcon, CalendarClockIcon, CalendarIcon, DownloadIcon } from "lucide-react";
import { getAudits } from "./actions";
import AuditCard from "@/components/AuditCard";

export default async function AdminAuditsPage() {
    const audits = await getAudits();

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-6xl">
            <div className="flex flex-row items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Ellenőrzések kezelése</h1>
                    <p className="text-sm text-muted-foreground">
                        Összes ellenőrzés létrehozása, módosítása és törlése
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/calendar">
                        <Button variant="outline" size="sm">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            Naptár
                        </Button>
                    </Link>
                    <Link href="/admin/reports">
                        <Button variant="outline" size="sm">
                            <DownloadIcon className="w-4 h-4 mr-2" />
                            Jelentések
                        </Button>
                    </Link>
                    <Link href="/admin/audits/schedule">
                        <Button variant="outline">
                            <CalendarClockIcon className="w-4 h-4 mr-2" />
                            Ütemezés
                        </Button>
                    </Link>
                    <Link href="/admin/audits/create">
                        <Button>
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Új ellenőrzés
                        </Button>
                    </Link>
                </div>
            </div>

            {audits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground mb-4">
                        Még nincsenek ellenőrzések létrehozva.
                    </p>
                    <Link href="/admin/audits/create">
                        <Button>
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Első ellenőrzés létrehozása
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {audits.map((audit: any) => (
                        <AuditCard 
                            key={audit._id} 
                            audit={audit}
                            basePath="/admin/audits"
                        />
                    ))}
                </div>
            )}
        </Container>
    );
}


