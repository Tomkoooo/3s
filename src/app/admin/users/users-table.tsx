import {
    Table,
    TableBody,
    TableCell,
    TableFooter,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { connectDB } from "@/lib/db"
import User, { UserDocument, type IUser } from "@/lib/db/models/User"
import type { FilterQuery } from "mongoose"
import { PencilIcon, TrashIcon, VolleyballIcon } from "lucide-react"
import { getCurrentUser } from "@/lib/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { getInitials, getRoleTranslation } from "@/lib/utils"
import dayjs from "@/lib/dayjs"

type UsersTableProps = {
    q?: string
    page?: number
    pageSize?: number
}

const createFilterFromQuery = (q: string): FilterQuery<IUser> => {
    const tokens = q.split(/\s+/).map(t => t.trim()).filter(Boolean)
    if (tokens.length === 0) return {}
    const isKnownRole = (value: string): value is IUser['role'] => (
        value === "admin" || value === "auditor" || value === "fixer"
    )
    const roleTokens: IUser['role'][] = []
    const otherTokens: string[] = []
    for (const token of tokens) {
        const lower = token.toLowerCase()
        if (isKnownRole(lower)) {
            roleTokens.push(lower)
        } else {
            otherTokens.push(token)
        }
    }
    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const andClauses: FilterQuery<IUser>[] = []
    for (const role of roleTokens) {
        andClauses.push({ role })
    }
    for (const token of otherTokens) {
        const pattern = escapeRegex(token)
        andClauses.push({
            $or: [
                { fullName: { $regex: pattern, $options: "i" } },
                { email: { $regex: pattern, $options: "i" } },
                { role: { $regex: pattern, $options: "i" } },
            ],
        })
    }
    return andClauses.length > 0 ? { $and: andClauses } : {}
}

const UserActions = ({ user }: { user: UserDocument }) => {
    return (
        <div className="flex flex-row gap-2">
            <Button variant="outline" asChild>
                <Link href={`/admin/users/${user._id}`}>
                    <PencilIcon className="w-4 h-4" />
                </Link>
            </Button>
            <Button variant="outline" asChild>
                <Link href={`/admin/users/${user._id}/breaks`}>
                    <VolleyballIcon className="w-4 h-4" />
                </Link>
            </Button>
            <Button variant="outline" className="border-red-500 text-red-500 border-1 hover:bg-red-500 hover:text-white" asChild>
                <Link href={`/admin/users/${user._id}/delete`}>
                    <TrashIcon className="w-4 h-4" />
                </Link>
            </Button>
        </div>
    )
}

export default async function UsersTable({ q = "", page = 1, pageSize = 10 }: UsersTableProps) {
    await connectDB()

    const currentUser = await getCurrentUser()

    const currentPage = Number.isFinite(page) && page > 0 ? page : 1
    const limit = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 10
    const skip = (currentPage - 1) * limit

    const filter = q ? createFilterFromQuery(q) : {}

    const [users, total] = await Promise.all([
        User.find(filter).sort({ fullName: 1, email: 1 }).skip(skip).limit(limit).exec(),
        User.countDocuments(filter).exec(),
    ])

    const totalPages = Math.max(1, Math.ceil(total / limit))
    const startItem = total === 0 ? 0 : skip + 1
    const endItem = Math.min(skip + users.length, total)

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Név</TableHead>
                    <TableHead>Szerepkör</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Utolsó aktivitás</TableHead>
                    <TableHead>Létrehozva</TableHead>
                    <TableHead>Azonosító</TableHead>
                    <TableHead>Műveletek</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user._id.toString()}>
                        <TableCell className="flex gap-2 flex-row items-center">
                            <Avatar>
                                <AvatarFallback className="bg-primary text-primary-foreground lowercase">
                                    {user.fullName ? getInitials(user.fullName, 2) : user.email.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <span className="flex flex-row items-center gap-1 leading-none">
                                {user.fullName}{currentUser?.id === user._id.toString() ? <span className="text-xs text-muted-foreground"> (te)</span> : null}
                            </span>
                        </TableCell>
                        <TableCell className="text-xs">{getRoleTranslation(user.role)}</TableCell>
                        <TableCell className="text-xs">{user.email}</TableCell>
                        <TableCell className="text-xs">{user.lastLoginAt ? dayjs(user.lastLoginAt).fromNow() : "Nincs belépés"}</TableCell>
                        <TableCell className="text-xs">{user.createdAt ? dayjs(user.createdAt).format("YYYY. MM. DD. HH:mm") : "Nincs létrehozva"}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{user._id.toString()}</TableCell>
                        <TableCell>
                            <UserActions user={user} />
                        </TableCell>
                    </TableRow>
                ))}
                {users.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center">Nincs felhasználó</TableCell>
                    </TableRow>
                )}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={7}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm text-muted-foreground">
                                {total > 0 ? (
                                    <span>
                                        {startItem}–{endItem} / {total}
                                    </span>
                                ) : (
                                    <span>0 / 0</span>
                                )}
                                {q ? <span className="ml-2">(szűrő: &quot;{q}&quot;)</span> : null}
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" asChild disabled={currentPage <= 1}>
                                    <Link href={`?q=${encodeURIComponent(q)}&page=${Math.max(1, currentPage - 1)}&pageSize=${limit}`} prefetch={false}>Előző</Link>
                                </Button>
                                <span className="text-sm">
                                    {currentPage} / {totalPages}
                                </span>
                                <Button variant="outline" asChild disabled={currentPage >= totalPages}>
                                    <Link href={`?q=${encodeURIComponent(q)}&page=${Math.min(totalPages, currentPage + 1)}&pageSize=${limit}`} prefetch={false}>Következő</Link>
                                </Button>
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    )
}