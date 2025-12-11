"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { getRoleTranslation } from "@/lib/utils"
import { useActionState, useEffect, useState } from "react"
import { deleteInviteAction } from "./actions"
import { ClientInvite } from "./page"
import { CopyInput } from "@/components/ui/copy-input"

const InviteRow = ({ invite, baseUrl, onDelete }: {
    invite: ClientInvite
    baseUrl: string
    onDelete: () => void
}) => {
    const boundAction = deleteInviteAction.bind(null, invite._id)
    const [state, formAction] = useActionState(boundAction, { success: false })

    useEffect(() => {
        if (state.success) {
            onDelete()
        }
    }, [state.success, onDelete])

    return <TableRow key={invite._id}>
        <TableCell>
            <CopyInput value={`${baseUrl}/invite/${invite._id}`} className="w-full" />
        </TableCell>
        <TableCell>{getRoleTranslation(invite.role)}</TableCell>
        <TableCell>{invite.comment}</TableCell>
        <TableCell>{new Date(invite.createdAt).toLocaleString("hu-HU", { dateStyle: "short", timeStyle: "short" })}</TableCell>
        <TableCell>{new Date(invite.expiresAt).toLocaleString("hu-HU", { dateStyle: "short", timeStyle: "short" })}</TableCell>
        <TableCell>
            <form action={formAction}>
                <Button type="submit" variant="destructive">Törlés</Button>
            </form>
        </TableCell>
    </TableRow>
}

export const InvitesTable = ({ invites, baseUrl }: {
    invites: ClientInvite[]
    baseUrl: string
}) => {
    const [innerInvites, setInnerInvites] = useState(invites)

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Meghívó link</TableHead>
                    <TableHead>Szerepkör</TableHead>
                    <TableHead>Megjegyzés</TableHead>
                    <TableHead>Készült</TableHead>
                    <TableHead>Lejár</TableHead>
                    <TableHead>Műveletek</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {innerInvites.map((invite) => (
                    <InviteRow key={invite._id} invite={invite} baseUrl={baseUrl} onDelete={() => {
                        setInnerInvites(innerInvites.filter((i) => i._id !== invite._id))
                    }} />
                ))}
            </TableBody>
        </Table>
    )
}