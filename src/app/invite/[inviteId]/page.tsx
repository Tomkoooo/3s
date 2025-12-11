import Container from "@/components/container";
import { RegisterForm } from "@/components/RegisterForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInvite } from "@/lib/auth";
import { getRoleTranslation } from "@/lib/utils";
import { redirect } from "next/navigation";
import { registerUserWithInviteAction } from "./actions";

export default async function InvitePage({ params }: { params: Promise<{ inviteId: string }> }) {
    const { inviteId } = await params;

    const invite = await getInvite(inviteId);
    if (!invite) {
        redirect("/");
    }

    return (
        <Container className="flex-1 flex flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>{getRoleTranslation(invite.role)} meghívó</CardTitle>
                    <CardDescription>
                        Töltsd ki a mezőket a regisztrációhoz.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RegisterForm registerAction={registerUserWithInviteAction.bind(null, inviteId)} roleSelect={false} redirectTo={`/`} isLogin={true} />
                </CardContent>
            </Card>
        </Container>
    )
}