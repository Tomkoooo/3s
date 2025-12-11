import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import User from "@/lib/db/models/User";
import { getBreakByIdForUser } from "@/app/my-account/breaks/actions";
import AdminBreakDeleteForm from "./AdminBreakDeleteForm";

export default async function AdminDeleteBreakPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ breakId: string }>;
    searchParams: Promise<{ userId?: string }>;
}) {
    const { breakId } = await params;
    const { userId } = await searchParams;

    await connectDB();
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login");
    }

    if (user.role !== 'admin') {
        redirect("/");
    }

    if (!userId) {
        notFound();
    }

    // Get the break data
    const breakData = await getBreakByIdForUser(breakId, userId);
    if (!breakData) {
        notFound();
    }

    // Get user info
    const targetUser = await User.findById(userId, 'fullName email').lean().exec();
    if (!targetUser) {
        notFound();
    }

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold">Szünet törlése</h1>
                <p className="text-sm text-muted-foreground">
                    Biztosan törölni szeretnéd ezt a szünetet? Ez a művelet nem vonható vissza.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Szünet adatai</CardTitle>
                    <CardDescription>
                        A törlésre kijelölt szünet részletei
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium">Felhasználó</Label>
                            <p className="text-sm text-muted-foreground">
                                {targetUser.fullName} ({targetUser.email})
                            </p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Kezdő dátum</Label>
                            <p className="text-sm text-muted-foreground">
                                {breakData.start}
                            </p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Befejező dátum</Label>
                            <p className="text-sm text-muted-foreground">
                                {breakData.end || "Egy napos"}
                            </p>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Indok</Label>
                            <p className="text-sm text-muted-foreground">
                                {breakData.reason || "-"}
                            </p>
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <AdminBreakDeleteForm breakId={breakId} targetUserId={userId} />
                    </div>
                </CardContent>
            </Card>
        </Container>
    );
}
