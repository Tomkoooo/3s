import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import BreakForm from "@/components/BreakForm";
import { updateBreakAction, getBreakById } from "../../actions";

export default async function EditBreakPage({ 
    params 
}: { 
    params: Promise<{ breakId: string }> 
}) {
    const { breakId } = await params;
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login");
    }

    const breakData = await getBreakById(breakId);
    if (!breakData) {
        return notFound();
    }

    const boundAction = updateBreakAction.bind(null, breakId);

    return (
        <Container className="flex-1 flex flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Szünet szerkesztése</CardTitle>
                    <CardDescription>
                        Itt szerkesztheted a szünet adatait.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BreakForm 
                        breakData={breakData}
                        action={boundAction} 
                        cancelRedirectTo="/my-account/breaks" 
                    />
                </CardContent>
            </Card>
        </Container>
    );
}
