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
import { PencilIcon, TrashIcon } from "lucide-react"
import dayjs from "@/lib/dayjs"
import type { ClientBreak } from "./page"

type BreaksTableProps = {
    breaks: ClientBreak[]
}

const BreakActions = ({ breakItem }: { breakItem: ClientBreak }) => {
    return (
        <div className="flex flex-row gap-2">
            <Button variant="outline" asChild>
                <Link href={`/my-account/breaks/edit/${breakItem._id}`}>
                    <PencilIcon className="w-4 h-4" />
                </Link>
            </Button>
            <Button variant="outline" className="border-red-500 text-red-500 border-1 hover:bg-red-500 hover:text-white" asChild>
                <Link href={`/my-account/breaks/delete/${breakItem._id}`}>
                    <TrashIcon className="w-4 h-4" />
                </Link>
            </Button>
        </div>
    )
}

export default function BreaksTable({ breaks }: BreaksTableProps) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Kezdő dátum</TableHead>
                    <TableHead>Befejező dátum</TableHead>
                    <TableHead>Indok</TableHead>
                    <TableHead>Időtartam</TableHead>
                    <TableHead>Műveletek</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {breaks.map((breakItem) => {
                    const startDate = dayjs(breakItem.start)
                    const endDate = breakItem.end ? dayjs(breakItem.end) : null
                    const duration = endDate ? endDate.diff(startDate, 'day') + 1 : 1
                    
                    return (
                        <TableRow key={breakItem._id}>
                            <TableCell className="text-sm">
                                {startDate.format("YYYY. MMMM DD.")}
                            </TableCell>
                            <TableCell className="text-sm">
                                {endDate ? endDate.format("YYYY. MMMM DD.") : "Egy napos"}
                            </TableCell>
                            <TableCell className="text-sm">
                                {breakItem.reason || "-"}
                            </TableCell>
                            <TableCell className="text-sm">
                                {duration} {duration === 1 ? "nap" : "nap"}
                            </TableCell>
                            <TableCell>
                                <BreakActions breakItem={breakItem} />
                            </TableCell>
                        </TableRow>
                    )
                })}
                {breaks.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">Nincs szünet rögzítve</TableCell>
                    </TableRow>
                )}
            </TableBody>
            <TableFooter>
                <TableRow>
                    <TableCell colSpan={5}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="text-sm text-muted-foreground">
                                {breaks.length > 0 ? (
                                    <span>
                                        {breaks.length} szünet
                                    </span>
                                ) : (
                                    <span>0 szünet</span>
                                )}
                            </div>
                        </div>
                    </TableCell>
                </TableRow>
            </TableFooter>
        </Table>
    )
}
