import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { deleteBreakAction, getBreakById } from "../../actions";
import BreakDeleteForm from "@/components/BreakDeleteForm";
import Link from "next/link";

export default async function DeleteBreakPage({ 
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

    async function onDeleteAction() {
        "use server";
        const res = await deleteBreakAction(breakId);
        if (!res.success) {
            return { success: false, message: res.message || "Törlés sikertelen" };
        }
        return res;
    }

    return (
        <Container className="flex-1 flex flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Szünet törlése</CardTitle>
                    <CardDescription>
                        Ezt a műveletet nem lehet visszavonni. A szünet végleg törlésre kerül.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <div className="text-sm">
                                <span className="text-muted-foreground">Kezdő dátum: </span>
                                <span>{breakData.start}</span>
                            </div>
                            {breakData.end && (
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Befejező dátum: </span>
                                    <span>{breakData.end}</span>
                                </div>
                            )}
                            {breakData.reason && (
                                <div className="text-sm">
                                    <span className="text-muted-foreground">Indok: </span>
                                    <span>{breakData.reason}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/my-account/breaks">Mégsem</Link>
                            </Button>
                            <BreakDeleteForm action={onDeleteAction} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Container>
    );
}
