"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayIcon, PauseIcon, TrashIcon, ClockIcon, UsersIcon, MapPinIcon } from "lucide-react";
import { toggleScheduleActive, deleteSchedule } from "./actions";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function ScheduleListItem({ schedule }: { schedule: any }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleScheduleActive(schedule._id, !schedule.isActive);
            if (result.success) {
                toast.success(schedule.isActive ? "Ütemezés felfüggesztve" : "Ütemezés aktiválva");
            } else {
                toast.error("Hiba történt");
            }
        });
    };

    const handleDelete = () => {
        if (!confirm("Biztosan törölni szeretnéd ezt az ütemezést?")) return;
        
        startTransition(async () => {
            const result = await deleteSchedule(schedule._id);
            if (result.success) {
                toast.success("Ütemezés törölve");
            } else {
                toast.error("Hiba történt");
            }
        });
    };

    const frequencyLabels = {
        daily: "Naponta",
        weekly: "Hetente",
        monthly: "Havonta"
    };

    return (
        <Card className={!schedule.isActive ? "opacity-75 bg-muted/30" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-semibold">{schedule.name}</CardTitle>
                    {schedule.isActive ? (
                        <Badge variant="default" className="bg-green-600 hover:bg-green-700">Aktív</Badge>
                    ) : (
                        <Badge variant="secondary">Inaktív</Badge>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleToggle} 
                        disabled={isPending}
                        title={schedule.isActive ? "Felfüggesztés" : "Aktiválás"}
                    >
                        {schedule.isActive ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleDelete} 
                        disabled={isPending}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        title="Törlés"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <ClockIcon className="w-4 h-4" />
                        <span>Gyakoriság: <span className="text-foreground font-medium">{frequencyLabels[schedule.frequency as keyof typeof frequencyLabels]}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPinIcon className="w-4 h-4" />
                        <span>Területek: <span className="text-foreground font-medium">{schedule.siteIds.length} db</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <UsersIcon className="w-4 h-4" />
                        <span>Auditorok: <span className="text-foreground font-medium">{schedule.auditorsPerAudit} / audit</span></span>
                    </div>
                </div>
                {schedule.lastGeneratedDate && (
                    <div className="mt-4 text-xs text-muted-foreground">
                        Utoljára generálva: {new Date(schedule.lastGeneratedDate).toLocaleDateString('hu-HU')}
                        {' '}(Generálva eddig: {new Date(schedule.lastGeneratedDate).toLocaleDateString('hu-HU')})
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
