import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { connectDB } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import User from "@/lib/db/models/User";
import AdminBreakForm from "./AdminBreakForm";

export default async function AdminCreateBreakPage({ 
    searchParams 
}: { 
    searchParams: Promise<{ userId?: string }> 
}) {
    const { userId } = await searchParams;
    
    await connectDB();
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login");
    }

    if (user.role !== 'admin') {
        redirect("/");
    }

    // Get all users for selection
    const users = await User.find({}, 'fullName email').lean().exec();
    
    // Convert ObjectIds to strings for Client Component
    const serializedUsers = users.map(user => ({
        _id: user._id.toString(),
        fullName: user.fullName,
        email: user.email
    }));

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-2xl">
            <div>
                <h1 className="text-2xl font-bold">Új szünet létrehozása</h1>
                <p className="text-sm text-muted-foreground">
                    Válaszd ki a felhasználót és add meg a szünet részleteit.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Szünet adatai</CardTitle>
                    <CardDescription>
                        Add meg a szünet kezdő és befejező dátumát, valamint az indokot.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AdminBreakForm users={serializedUsers} preselectedUserId={userId} />
                </CardContent>
            </Card>
        </Container>
    );
}
