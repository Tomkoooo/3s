import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UserEditForm from "@/components/UserEditForm";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { updateMyAccountAction } from "./actions";

export default async function MyAccountPage() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return redirect("/login");
    }
    const boundAction = updateMyAccountAction.bind(null);
    return (
        <Container className="flex-1 flex flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Fiókbeállítások</CardTitle>
                    <CardDescription>
                        Itt tudod módosítani a jelszavadat, teljes nevedet, és e-mail címedet.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UserEditForm user={currentUser} currentUser={currentUser} updateAction={boundAction} cancelRedirectTo="/" onFinishRedirectTo="/" />
                </CardContent>
            </Card>
        </Container>
    )
}