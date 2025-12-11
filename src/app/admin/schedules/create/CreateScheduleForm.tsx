"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createRecurringSchedule } from "../actions";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
    sites: any[];
    auditors: any[];
}

export default function CreateScheduleForm({ sites, auditors }: Props) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    
    const [name, setName] = useState("");
    const [selectedSites, setSelectedSites] = useState<string[]>([]);
    const [selectedAuditors, setSelectedAuditors] = useState<string[]>([]);
    const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("weekly");
    const [auditorsPerAudit, setAuditorsPerAudit] = useState(1);
    const [maxAuditsPerDay, setMaxAuditsPerDay] = useState<number | undefined>(undefined);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim()) return toast.error("Adj nevet az ütemezésnek");
        if (selectedSites.length === 0) return toast.error("Válassz legalább egy területet");
        
        startTransition(async () => {
            const result = await createRecurringSchedule({
                name,
                siteIds: selectedSites,
                frequency,
                auditorPool: selectedAuditors,
                auditorsPerAudit,
                maxAuditsPerDay: maxAuditsPerDay || undefined,
            });
            
            if (result.success) {
                toast.success("Ütemezés létrehozva");
                router.push("/admin/schedules");
            } else {
                toast.error(result.message || "Hiba történt");
            }
        });
    };
    
    const toggleSite = (id: string) => {
        setSelectedSites(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleAuditor = (id: string) => {
        setSelectedAuditors(prev => 
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };
    
    const selectAllSites = () => setSelectedSites(sites.map(s => s._id));
    const deselectSites = () => setSelectedSites([]);
    
    const selectAllAuditors = () => setSelectedAuditors([]); // Empty means all in our logic
    
    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Megnevezés</Label>
                        <Input 
                            id="name" 
                            placeholder="pl. Heti Általános Ellenőrzés" 
                            value={name} 
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="frequency">Gyakoriság</Label>
                        <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="daily">Naponta</SelectItem>
                                <SelectItem value="weekly">Hetente</SelectItem>
                                <SelectItem value="monthly">Havonta</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            A rendszer minden nap ellenőrzi, és automatikusan generálja a jövőbeli feladatokat 2 hétre előre.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="auditorsPerAudit">Auditorok száma / ellenőrzés</Label>
                            <Input 
                                type="number" 
                                min={1} 
                                value={auditorsPerAudit}
                                onChange={e => setAuditorsPerAudit(parseInt(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="maxAuditsPerDay">Max audit / auditor / nap (opcionális)</Label>
                            <Input 
                                type="number" 
                                min={1} 
                                placeholder="Korlátlan"
                                value={maxAuditsPerDay || ''}
                                onChange={e => setMaxAuditsPerDay(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sites Selector */}
                <Card className="h-96 flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between bg-muted/50">
                        <Label>Területek ({selectedSites.length})</Label>
                        <div className="flex gap-2">
                            <Button type="button" variant="ghost" size="xs" onClick={selectAllSites}>Mind</Button>
                            <Button type="button" variant="ghost" size="xs" onClick={deselectSites}>Semmi</Button>
                        </div>
                    </div>
                    <div className="overflow-y-auto p-4 space-y-2 flex-1">
                        {sites.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">Nincsenek ütemezhető (check-kel rendelkező) területek.</p>
                        ) : (
                            sites.map(site => (
                                <div key={site._id} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`site-${site._id}`} 
                                        checked={selectedSites.includes(site._id)}
                                        onCheckedChange={() => toggleSite(site._id)}
                                    />
                                    <Label htmlFor={`site-${site._id}`} className="text-sm font-normal cursor-pointer">
                                        {site.name} <span className="text-xs text-muted-foreground">({site.checks.length} pont)</span>
                                    </Label>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Auditors Selector */}
                <Card className="h-96 flex flex-col">
                    <div className="p-4 border-b flex items-center justify-between bg-muted/50">
                        <Label>Auditorok ({selectedAuditors.length === 0 ? 'Összes' : selectedAuditors.length})</Label>
                        <div className="flex gap-2">
                             <Button 
                                type="button" 
                                variant="ghost" 
                                size="xs" 
                                onClick={selectAllAuditors}
                                className={selectedAuditors.length === 0 ? "bg-secondary" : ""}
                            >
                                Bárki (Auto)
                            </Button>
                        </div>
                    </div>
                    <div className="overflow-y-auto p-4 space-y-2 flex-1">
                        {auditors.map(auditor => (
                            <div key={auditor._id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`auditor-${auditor._id}`} 
                                    checked={selectedAuditors.includes(auditor._id)}
                                    onCheckedChange={() => toggleAuditor(auditor._id)}
                                />
                                <Label htmlFor={`auditor-${auditor._id}`} className="text-sm font-normal cursor-pointer">
                                    {auditor.fullName}
                                </Label>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()}>Mégse</Button>
                <Button type="submit" disabled={isPending}>
                    {isPending ? 'Létrehozás...' : 'Ütemezés Létrehozása'}
                </Button>
            </div>
        </form>
    );
}
