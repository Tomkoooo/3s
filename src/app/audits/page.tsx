import Container from "@/components/container";
import { getMyAudits } from "./actions";
import AuditCard from "@/components/AuditCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarIcon } from "lucide-react";
import { getCurrentUser } from "@/lib/auth"; // Assuming this function exists to get the current user

export default async function MyAuditsPage() {
    const audits = await getMyAudits();
    const currentUser = await getCurrentUser(); // Fetch current user

    const isFixer = currentUser?.role === 'fixer'; // Use optional chaining for safety

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">{isFixer ? 'Javítandó feladatok' : 'Ellenőrzéseim'}</h1>
                    <p className="text-sm text-muted-foreground">
                        {isFixer ? 'Az alábbi ellenőrzések során hibákat találtak.' : 'Itt találod a hozzád rendelt auditokat.'}
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
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground">
                        Még nincsenek hozzád rendelt ellenőrzések.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {audits.map((audit: any) => (
                        <AuditCard 
                            key={audit._id} 
                            audit={audit}
                            basePath="/audits"
                        />
                    ))}
                </div>
            )}
        </Container>
    );
}


