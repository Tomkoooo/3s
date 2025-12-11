import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { connectDB, deletePastBreaks } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Break from "@/lib/db/models/Break";
import Link from "next/link";
import { PlusIcon } from "lucide-react";
import AdminBreaksTable from "./admin-breaks-table";

export type AdminClientBreak = {
    _id: string;
    start: string;
    end?: string;
    reason?: string;
    userId: string;
    userFullName: string;
    userEmail: string;
}

export default async function AdminBreaksPage() {
    await connectDB();
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login");
    }

    if (user.role !== 'admin') {
        redirect("/");
    }

    await deletePastBreaks();

    // Get all breaks with user information
    const breaks = await Break.find({})
        .populate('userId', 'fullName email')
        .sort({ start: -1 })
        .lean()
        .exec();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientBreaks: AdminClientBreak[] = breaks.map((breakDoc: any) => ({
        _id: breakDoc._id.toString(),
        start: breakDoc.start,
        end: breakDoc.end,
        reason: breakDoc.reason,
        userId: breakDoc.userId._id.toString(),
        userFullName: breakDoc.userId.fullName,
        userEmail: breakDoc.userId.email,
    }));

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-full">
            <div>
                <h1 className="text-2xl font-bold">Szünetek kezelése</h1>
                <p className="text-sm text-muted-foreground">
                    Itt tudsz szüneteket létrehozni, szerkeszteni és törölni bármely felhasználó nevében.
                </p>
            </div>

            <div className="flex flex-row gap-2">
                <Button asChild>
                    <Link href="/admin/breaks/create">
                        <PlusIcon className="w-4 h-4" />
                        Új szünet
                    </Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Összes szünet</CardTitle>
                    <CardDescription>
                        Az összes felhasználó szünetei egy helyen
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AdminBreaksTable breaks={clientBreaks} />
                </CardContent>
            </Card>
        </Container>
    );
}
