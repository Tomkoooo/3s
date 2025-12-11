import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import User from "@/lib/db/models/User";
import { getBreakByIdForUser } from "@/app/my-account/breaks/actions";
import AdminBreakEditForm from "./AdminBreakEditForm";

export default async function AdminEditBreakPage({ 
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
                <h1 className="text-2xl font-bold">Szünet szerkesztése</h1>
                <p className="text-sm text-muted-foreground">
                    Szerkeszd a szünet adatait: {targetUser.fullName} ({targetUser.email})
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Szünet adatai</CardTitle>
                    <CardDescription>
                        Módosítsd a szünet kezdő és befejező dátumát, valamint az indokot.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AdminBreakEditForm 
                        breakData={breakData} 
                        targetUserId={userId}
                        targetUserName={targetUser.fullName}
                    />
                </CardContent>
            </Card>
        </Container>
    );
}
