import Container from "@/components/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InviteBox } from "./InviteBox";
import { InvitesTable } from "./invites-table";
import { headers } from "next/headers";
import Invite from "@/lib/db/models/Invite";
import { connectDB } from "@/lib/db";

export type ClientInvite = {
    _id: string
    role: 'auditor' | 'fixer' | 'admin'
    createdAt: string
    expiresAt: string
    comment: string
}

export default async function UserInvite() {

    await connectDB()
    const invites = await Invite.find({}).sort({ createdAt: -1 }).lean().exec()

    const h = await headers()
    const url = h.get("x-url")
    const baseUrl = url ? new URL(url).origin : ""

    return (
        <Container className="flex-1 grid grid-cols-1 xl:grid-cols-4 items-start justify-center gap-4">
            <Card className="w-full xl:col-span-1">
                <CardHeader>
                    <CardTitle>Meghívó link generálása</CardTitle>
                    <CardDescription>
                        A linket a felhasználónak kell megosztani, hogy regisztrálhasson.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <InviteBox />
                </CardContent>
            </Card>
            <Card className="w-full xl:col-span-3">
                <CardHeader>
                    <CardTitle>Aktív meghívók</CardTitle>
                    <CardDescription>
                        Meghívók, amik már le lettek generálva, de nincsenek felhasználva.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <InvitesTable
                        invites={invites.map((i) => ({
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            _id: (i._id as any).toString(),
                            role: i.role,
                            createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : String(i.createdAt),
                            expiresAt: i.expiresAt instanceof Date ? i.expiresAt.toISOString() : String(i.expiresAt),
                            comment: i.comment,
                        }))}
                        baseUrl={baseUrl}
                    />
                </CardContent>
            </Card>
        </Container>
    );
}