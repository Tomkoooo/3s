import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusIcon, CalendarClockIcon, CalendarIcon, DownloadIcon } from "lucide-react";
import { getAllAuditSitesForFilter, getAudits } from "./actions";
import AuditCard from "@/components/AuditCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminAuditsPage({
    searchParams,
}: {
    searchParams: Promise<{
        siteId?: string;
        status?: 'scheduled' | 'in_progress' | 'completed';
        dateFrom?: string;
        dateTo?: string;
    }>;
}) {
    const params = await searchParams;
    const [audits, sites] = await Promise.all([
        getAudits({
            siteId: params.siteId,
            status: params.status,
            dateFrom: params.dateFrom,
            dateTo: params.dateTo,
        }),
        getAllAuditSitesForFilter(),
    ]);
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];
    const exportUrl = `/api/admin/reports/export?startDate=${params.dateFrom || monthStartStr}&endDate=${params.dateTo || todayStr}&status=${params.status || ''}&siteId=${params.siteId || ''}`;

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
            <form className="grid grid-cols-1 md:grid-cols-5 gap-2 border rounded-md p-3">
                <div className="flex flex-col gap-1">
                    <Label htmlFor="siteId">Terület</Label>
                    <select
                        id="siteId"
                        name="siteId"
                        defaultValue={params.siteId || ''}
                        className="h-9 rounded-md border px-2 bg-background"
                    >
                        <option value="">Összes</option>
                        {sites.map((site) => (
                            <option key={site._id} value={site._id}>{site.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="status">Státusz</Label>
                    <select
                        id="status"
                        name="status"
                        defaultValue={params.status || ''}
                        className="h-9 rounded-md border px-2 bg-background"
                    >
                        <option value="">Összes</option>
                        <option value="scheduled">Tervezett</option>
                        <option value="in_progress">Folyamatban</option>
                        <option value="completed">Befejezett</option>
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="dateFrom">Kezdő dátum</Label>
                    <Input id="dateFrom" name="dateFrom" type="date" defaultValue={params.dateFrom || monthStartStr} />
                </div>
                <div className="flex flex-col gap-1">
                    <Label htmlFor="dateTo">Záró dátum</Label>
                    <Input id="dateTo" name="dateTo" type="date" defaultValue={params.dateTo || todayStr} />
                </div>
                <div className="flex items-end gap-2">
                    <Button type="submit" variant="outline">Szűrés</Button>
                    <Link href={exportUrl}>
                        <Button type="button">Export CSV</Button>
                    </Link>
                </div>
            </form>

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


