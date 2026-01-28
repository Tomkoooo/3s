"use client";

import { useEffect, useState, useTransition } from "react";
import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    getSchedulableSites,
    getAvailableAuditors,
    generateSchedulePreviewAction,
    createScheduledAuditsAction,
} from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CalendarIcon, UsersIcon, CheckCircle2Icon, AlertTriangleIcon, ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

type Site = {
    _id: string;
    name: string;
    fullPath?: string;
    checksCount: number;
    isParent?: boolean;
};

type Auditor = {
    _id: string;
    fullName: string;
    email: string;
    role: string;
};

type PreviewItem = {
    siteId: string;
    siteName: string;
    date: string;
    auditors: Array<{ _id: string; fullName: string; email: string }>;
};

export default function ScheduleAuditsPage() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    
    // Data
    const [sites, setSites] = useState<Site[]>([]);
    const [auditors, setAuditors] = useState<Auditor[]>([]);
    
    // Form state
    const [selectedSites, setSelectedSites] = useState<string[]>([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [selectedAuditors, setSelectedAuditors] = useState<string[]>([]);
    const [auditorsPerAudit, setAuditorsPerAudit] = useState(1);
    const [maxAuditsPerDay, setMaxAuditsPerDay] = useState<number | undefined>(undefined);
    
    // Preview state
    const [previews, setPreviews] = useState<PreviewItem[]>([]);
    const [conflicts, setConflicts] = useState<string[]>([]);
    const [showPreview, setShowPreview] = useState(false);

    // Load data
    useEffect(() => {
        async function loadData() {
            const [sitesData, auditorsData] = await Promise.all([
                getSchedulableSites(),
                getAvailableAuditors(),
            ]);
            setSites(sitesData);
            setAuditors(auditorsData);
        }
        loadData();
    }, []);

    // Handle site selection
    const toggleSite = (siteId: string) => {
        setSelectedSites(prev =>
            prev.includes(siteId)
                ? prev.filter(id => id !== siteId)
                : [...prev, siteId]
        );
    };

    const selectAllSites = () => {
        setSelectedSites(sites.map(s => s._id));
    };

    const deselectAllSites = () => {
        setSelectedSites([]);
    };

    // Handle auditor selection
    const toggleAuditor = (auditorId: string) => {
        setSelectedAuditors(prev =>
            prev.includes(auditorId)
                ? prev.filter(id => id !== auditorId)
                : [...prev, auditorId]
        );
    };

    const selectAllAuditors = () => {
        setSelectedAuditors(auditors.map(a => a._id));
    };

    const deselectAllAuditors = () => {
        setSelectedAuditors([]);
    };

    // Generate preview
    const handleGeneratePreview = async () => {
        if (selectedSites.length === 0) {
            toast.error('Válassz ki legalább egy területet');
            return;
        }

        if (!startDate || !endDate) {
            toast.error('Adj meg kezdő és záró dátumot');
            return;
        }

        startTransition(async () => {
            const result = await generateSchedulePreviewAction(
                selectedSites,
                startDate,
                endDate,
                frequency,
                selectedAuditors,
                auditorsPerAudit,
                maxAuditsPerDay
            );

            if (result.success && result.previews) {
                setPreviews(result.previews);
                setConflicts(result.conflicts || []);
                setShowPreview(true);
                toast.success(result.message || 'Előnézet generálva');
            } else {
                toast.error(result.message || 'Hiba az előnézet generálása során');
                setConflicts(result.conflicts || []);
            }
        });
    };

    // Create audits
    const handleCreateAudits = async () => {
        if (previews.length === 0) {
            toast.error('Nincs előnézet generálva');
            return;
        }

        const confirmed = confirm(
            `Biztos vagy benne, hogy létrehozod a ${previews.length} audit-ot? Ez a művelet nem vonható vissza.`
        );

        if (!confirmed) return;

        startTransition(async () => {
            const result = await createScheduledAuditsAction(previews);

            if (result.success) {
                toast.success(result.message || 'Audit-ok sikeresen létrehozva');
                router.push('/admin/audits');
                router.refresh();
            } else {
                toast.error(result.message || 'Hiba történt az audit-ok létrehozása során');
            }
        });
    };

    // Reset preview
    const handleBackToConfig = () => {
        setShowPreview(false);
        setPreviews([]);
        setConflicts([]);
    };

    if (showPreview) {
        return (
            <Container className="flex-1 flex flex-col gap-4 max-w-6xl">
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={handleBackToConfig} disabled={isPending}>
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        Vissza a beállításokhoz
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Előnézet</CardTitle>
                        <CardDescription>
                            {previews.length} audit lesz létrehozva
                            {conflicts.length > 0 && `, ${conflicts.length} konfliktus`}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Conflicts */}
                        {conflicts.length > 0 && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangleIcon className="w-5 h-5 text-yellow-600" />
                                    <h3 className="font-semibold text-yellow-800">
                                        Konfliktusok ({conflicts.length})
                                    </h3>
                                </div>
                                <ul className="text-sm text-yellow-800 space-y-1">
                                    {conflicts.slice(0, 10).map((conflict, index) => (
                                        <li key={index}>• {conflict}</li>
                                    ))}
                                    {conflicts.length > 10 && (
                                        <li className="text-muted-foreground">
                                            ... és még {conflicts.length - 10} konfliktus
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* Preview table */}
                        <div className="border rounded-lg overflow-hidden">
                            <div className="max-h-96 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted sticky top-0">
                                        <tr>
                                            <th className="text-left p-3 font-semibold">Terület</th>
                                            <th className="text-left p-3 font-semibold">Dátum</th>
                                            <th className="text-left p-3 font-semibold">Auditorok</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previews.map((preview, index) => (
                                            <tr key={index} className="border-t">
                                                <td className="p-3">{preview.siteName}</td>
                                                <td className="p-3">
                                                    {new Date(preview.date).toLocaleDateString('hu-HU')}
                                                </td>
                                                <td className="p-3">
                                                    {preview.auditors.map(a => a.fullName).join(', ')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex justify-end gap-2">
                            <Button
                                variant="outline"
                                onClick={handleBackToConfig}
                                disabled={isPending}
                            >
                                Módosítás
                            </Button>
                            <Button
                                onClick={handleCreateAudits}
                                disabled={isPending || previews.length === 0}
                            >
                                <CheckCircle2Icon className="w-4 h-4 mr-2" />
                                {isPending ? 'Létrehozás...' : `${previews.length} Audit Létrehozása`}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </Container>
        );
    }

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-6xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Audit Ütemezés</h1>
                    <p className="text-muted-foreground">
                        Automatikus audit generálás több területhez egyszerre
                    </p>
                </div>
                <Link href="/admin/audits">
                    <Button variant="outline">
                        <ArrowLeftIcon className="w-4 h-4 mr-2" />
                        Vissza
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Site Selection */}
                <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-lg">Területek</CardTitle>
                        <CardDescription>
                            Válaszd ki a területeket
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={selectAllSites}
                                disabled={sites.length === 0}
                            >
                                Mind
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={deselectAllSites}
                                disabled={selectedSites.length === 0}
                            >
                                Törlés
                            </Button>
                        </div>

                        <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                            {sites.length === 0 ? (
                                <p className="text-sm text-muted-foreground p-2">
                                    Nincsenek ütemezhető területek
                                </p>
                            ) : (
                                (() => {
                                    // Group sites by parent
                                    const topLevel: any[] = [];
                                    const childrenMap = new Map<string, any[]>();
                                    
                                    sites.forEach(site => {
                                        const pathParts = (site.fullPath || site.name).split(' > ');
                                        if (pathParts.length === 1) {
                                            topLevel.push(site);
                                        } else {
                                            const parentName = pathParts[0];
                                            if (!childrenMap.has(parentName)) {
                                                childrenMap.set(parentName, []);
                                            }
                                            childrenMap.get(parentName)!.push(site);
                                        }
                                    });
                                    
                                    return topLevel.map(parentSite => {
                                        const parentName = (parentSite.fullPath || parentSite.name).split(' > ')[0];
                                        const children = childrenMap.get(parentName) || [];
                                        
                                        return (
                                            <div key={parentSite._id} className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        id={`site-${parentSite._id}`}
                                                        checked={selectedSites.includes(parentSite._id)}
                                                        onCheckedChange={() => toggleSite(parentSite._id)}
                                                    />
                                                    <label
                                                        htmlFor={`site-${parentSite._id}`}
                                                        className="text-sm cursor-pointer flex-1 font-semibold flex items-center gap-1"
                                                    >
                                                        {parentSite.isParent ? '📁' : '📄'} {parentSite.name}
                                                        <span className="text-xs text-muted-foreground font-normal">
                                                            ({parentSite.isParent ? `${parentSite.checksCount} alterület` : `${parentSite.checksCount} pont`})
                                                        </span>
                                                    </label>
                                                </div>
                                                
                                                {children.map(child => (
                                                    <div key={child._id} className="flex items-center gap-2 ml-6 pl-2 border-l-2 border-muted">
                                                        <Checkbox
                                                            id={`site-${child._id}`}
                                                            checked={selectedSites.includes(child._id)}
                                                            onCheckedChange={() => toggleSite(child._id)}
                                                        />
                                                        <label
                                                            htmlFor={`site-${child._id}`}
                                                            className="text-sm cursor-pointer flex-1 text-muted-foreground"
                                                        >
                                                            └ {child.fullPath?.split(' > ').pop() || child.name}
                                                            <span className="text-xs ml-1">
                                                                ({child.checksCount} pont)
                                                            </span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    });
                                })()
                            )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {selectedSites.length} / {sites.length} kiválasztva
                        </p>
                    </CardContent>
                </Card>

                {/* Configuration */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-lg">Beállítások</CardTitle>
                        <CardDescription>
                            Ütemezési paraméterek
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">
                                    <CalendarIcon className="w-4 h-4 inline mr-1" />
                                    Kezdő dátum
                                </Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="endDate">
                                    <CalendarIcon className="w-4 h-4 inline mr-1" />
                                    Záró dátum
                                </Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    min={startDate || new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>

                        {/* Frequency */}
                        <div className="space-y-2">
                            <Label htmlFor="frequency">Gyakoriság</Label>
                            <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                                <SelectTrigger id="frequency">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Napi</SelectItem>
                                    <SelectItem value="weekly">Heti</SelectItem>
                                    <SelectItem value="monthly">Havi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Auditors per audit */}
                        <div className="space-y-2">
                            <Label htmlFor="auditorsPerAudit">
                                <UsersIcon className="w-4 h-4 inline mr-1" />
                                Auditorok száma audit-onként
                            </Label>
                            <Input
                                id="auditorsPerAudit"
                                type="number"
                                min={1}
                                max={5}
                                value={auditorsPerAudit}
                                onChange={(e) => setAuditorsPerAudit(parseInt(e.target.value))}
                            />
                        </div>

                        {/* Max audits per day */}
                        <div className="space-y-2">
                            <Label htmlFor="maxAuditsPerDay">
                                Max audit/nap/auditor (opcionális)
                            </Label>
                            <Input
                                id="maxAuditsPerDay"
                                type="number"
                                min={1}
                                placeholder="Nincs limit"
                                value={maxAuditsPerDay || ''}
                                onChange={(e) =>
                                    setMaxAuditsPerDay(
                                        e.target.value ? parseInt(e.target.value) : undefined
                                    )
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Ha megadod, egy auditor maximum ennyi audit-ot kaphat egy napon
                            </p>
                        </div>

                        {/* Auditor Pool */}
                        <div className="space-y-2">
                            <Label>Auditor Pool (opcionális)</Label>
                            <div className="flex gap-2 mb-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={selectAllAuditors}
                                    disabled={auditors.length === 0}
                                >
                                    Mind
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={deselectAllAuditors}
                                    disabled={selectedAuditors.length === 0}
                                >
                                    Törlés
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                                {auditors.map(auditor => (
                                    <div key={auditor._id} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`auditor-${auditor._id}`}
                                            checked={selectedAuditors.includes(auditor._id)}
                                            onCheckedChange={() => toggleAuditor(auditor._id)}
                                        />
                                        <label
                                            htmlFor={`auditor-${auditor._id}`}
                                            className="text-sm cursor-pointer flex-1"
                                        >
                                            {auditor.fullName}
                                            <span className="text-muted-foreground ml-1">
                                                ({auditor.role})
                                            </span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {selectedAuditors.length > 0
                                    ? `${selectedAuditors.length} auditor kiválasztva`
                                    : 'Összes elérhető auditor használva'}
                            </p>
                        </div>

                        {/* Generate button */}
                        <div className="pt-4">
                            <Button
                                onClick={handleGeneratePreview}
                                disabled={isPending || selectedSites.length === 0}
                                className="w-full"
                            >
                                {isPending ? 'Generálás...' : 'Előnézet Generálása'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Container>
    );
}


