import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import BreakForm from "@/components/BreakForm";
import { createBreakAction } from "../actions";

export default async function NewBreakPage() {
    const user = await getCurrentUser();
    if (!user) {
        redirect("/login");
    }

    return (
        <Container className="flex-1 flex flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Új szünet</CardTitle>
                    <CardDescription>
                        Itt hozhatsz létre egy új szünetet.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BreakForm 
                        action={createBreakAction} 
                        cancelRedirectTo="/my-account/breaks" 
                    />
                </CardContent>
            </Card>
        </Container>
    );
}
