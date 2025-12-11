import Container from "@/components/container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { connectDB, deletePastBreaks } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Break from "@/lib/db/models/Break";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import BreaksTable from "./breaks-table";

export type ClientBreak = {
    _id: string;
    start: string;
    end?: string;
    reason?: string;
}

export default async function BreaksPage() {
    await connectDB();
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login");
    }

    await deletePastBreaks();

    // Users only see their own breaks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const breaks = (await Break.find({ userId: user.id }).sort({ start: -1 }).lean().exec()).map((breakDoc: any) => ({
        _id: breakDoc._id.toString(),
        start: breakDoc.start,
        end: breakDoc.end,
        reason: breakDoc.reason
    })) as ClientBreak[];

    return (
        <Container className="flex-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold">Szünetek</h1>
                    <p className="text-sm text-muted-foreground mt-2">
                        A múltbeli szünetek automatikusan törlődnek a rendszerből. Csak a jelenlegi és jövőbeli szünetek maradnak meg.
                    </p>
                </div>
                <Button asChild>
                    <Link href="/my-account/breaks/new">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Új szünet
                    </Link>
                </Button>
            </div>

            {breaks.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-8">
                        <p className="text-muted-foreground mb-4">Még nincs szünet rögzítve.</p>
                        <Button asChild>
                            <Link href="/my-account/breaks/new">
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Első szünet hozzáadása
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <BreaksTable breaks={breaks} />
            )}
        </Container>
    )
}