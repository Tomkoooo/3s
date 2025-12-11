import Container from "@/components/container";
import UsersTable from "./users-table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { MaximizeIcon, PlusIcon, SendIcon, VolleyballIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { InviteBox } from "./invite/InviteBox";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const params = await searchParams;
    const q = typeof params.q === "string" ? params.q : "";
    const page = Number.parseInt(typeof params.page === "string" ? params.page : "1") || 1;
    const pageSize = Number.parseInt(typeof params.pageSize === "string" ? params.pageSize : "10") || 10;

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-full">
            <div>
                <h1 className="text-2xl font-bold">Felhasználók</h1>
                <p className="text-sm text-muted-foreground">
                    Itt tudsz felhasználókat létrehozni, meghívni, szerkeszteni és törölni.
                </p>
            </div>

            <div className="flex flex-row gap-2 flex-wrap">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button>
                            <SendIcon className="w-4 h-4" />
                            Meghívás
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="relative">
                        <Button size="icon" asChild variant="ghost" className="absolute top-0 right-0">
                            <Link href="/admin/users/invite">
                                <MaximizeIcon className="w-4 h-4" />
                            </Link>
                        </Button>
                        <InviteBox />
                    </PopoverContent>
                </Popover>
                <Button asChild variant="outline">
                    <Link href="/admin/users/create">
                        <PlusIcon className="w-4 h-4" />
                        Létrehozás
                    </Link>
                </Button>
                <Button asChild variant="outline">
                    <Link href="/admin/breaks">
                        <VolleyballIcon className="w-4 h-4" />
                        Munkaszünetek kezelése
                    </Link>
                </Button>
            </div>

            <form className="flex items-center gap-2" action="">
                <Input name="q" placeholder="Keresés név/email alapján" defaultValue={q} />
                <input type="hidden" name="pageSize" value={pageSize} />
                <Button variant="secondary" type="submit">Keresés</Button>
                {q ? (
                    <Button variant="ghost" asChild>
                        <Link href="?">Törlés</Link>
                    </Button>
                ) : null}
            </form>

            <UsersTable q={q} page={page} pageSize={pageSize} />
        </Container >
    )
}