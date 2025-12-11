import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { connectDB, deletePastBreaks } from "@/lib/db";
import { getCurrentUser, getUserById } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Break from "@/lib/db/models/Break";
import Link from "next/link";
import { PlusIcon, ArrowLeftIcon } from "lucide-react";
import AdminUserBreaksTable from "./AdminUserBreaksTable";

export type AdminUserClientBreak = {
    _id: string;
    start: string;
    end?: string;
    reason?: string;
}

export default async function AdminUserBreaksPage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    
    await connectDB();
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login");
    }

    if (user.role !== 'admin') {
        redirect("/");
    }

    const targetUser = await getUserById(userId);
    if (!targetUser) {
        notFound();
    }

    await deletePastBreaks();

    // Get breaks for the specific user
    const breaks = await Break.find({ userId })
        .sort({ start: -1 })
        .lean()
        .exec();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientBreaks: AdminUserClientBreak[] = breaks.map((breakDoc: any) => ({
        _id: breakDoc._id.toString(),
        start: breakDoc.start,
        end: breakDoc.end,
        reason: breakDoc.reason,
    }));

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-full">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                    <Link href="/admin/breaks">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Szünetek kezelése</h1>
                    <p className="text-sm text-muted-foreground">
                        {targetUser.fullName} ({targetUser.email}) szünetei
                    </p>
                </div>
            </div>

            <div className="flex flex-row gap-2">
                <Button asChild>
                    <Link href={`/admin/breaks/create?userId=${userId}`}>
                        <PlusIcon className="w-4 h-4" />
                        Új szünet
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{targetUser.fullName} szünetei</CardTitle>
                    <CardDescription>
                        A felhasználó összes szünetének listája
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AdminUserBreaksTable breaks={clientBreaks} userId={userId} />
                </CardContent>
            </Card>
        </Container>
    );
}
