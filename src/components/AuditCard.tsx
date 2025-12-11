import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import StatusBadge from "./StatusBadge";
import { CalendarIcon, UsersIcon, CheckCircle2Icon } from "lucide-react";
import Link from "next/link";

type AuditCardProps = {
    audit: {
        _id: string;
        site: { name: string } | null;
        onDate: Date | string;
        status: 'scheduled' | 'in_progress' | 'completed';
        participants: { fullName: string }[];
        result?: any[];
    };
    showActions?: boolean;
    basePath?: string; // "/audits" vagy "/admin/audits"
};

export default function AuditCard({ audit, showActions = true, basePath = "/audits" }: AuditCardProps) {
    const date = new Date(audit.onDate);
    const formattedDate = date.toLocaleDateString('hu-HU', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });

    const checkCount = audit.result?.length || 0;
    const participantNames = audit.participants.map(p => p.fullName).join(', ');

    return (
        <Card>
            <CardHeader>
                <div className="flex flex-row items-start justify-between">
                    <CardTitle className="text-lg">
                        {audit.site?.name || 'Ismeretlen terület'}
                    </CardTitle>
                    <StatusBadge status={audit.status} />
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarIcon className="w-4 h-4" />
                    <span>{formattedDate}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UsersIcon className="w-4 h-4" />
                    <span>{participantNames}</span>
                </div>

                {checkCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2Icon className="w-4 h-4" />
                        <span>{checkCount} ellenőrzési pont</span>
                    </div>
                )}

                {showActions && (
                    <div className="flex gap-2 pt-2">
                        <Link href={`${basePath}/${audit._id}`} className="flex-1">
                            <Button variant="outline" className="w-full">
                                Részletek
                            </Button>
                        </Link>
                        {(audit.status === 'scheduled' || audit.status === 'in_progress') && basePath === '/audits' && (
                            <Link href={`${basePath}/${audit._id}/execute`} className="flex-1">
                                <Button className="w-full">
                                    {audit.status === 'in_progress' ? 'Folytatás' : 'Indítás'}
                                </Button>
                            </Link>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

