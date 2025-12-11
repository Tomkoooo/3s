import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { UsersIcon, CalendarIcon } from "lucide-react";

export default function AdminPage() {
    return (
        <Container className="flex-1 flex flex-col gap-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold">Admin felület</h1>
                <p className="text-muted-foreground">
                    Itt tudod kezelni a felhasználókat és szüneteket.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UsersIcon className="w-5 h-5" />
                            Felhasználók kezelése
                        </CardTitle>
                        <CardDescription>
                            Felhasználók létrehozása, szerkesztése, törlése és meghívása
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/admin/users">
                                Felhasználók kezelése
                            </Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5" />
                            Szünetek kezelése
                        </CardTitle>
                        <CardDescription>
                            Szünetek létrehozása, szerkesztése és törlése bármely felhasználó nevében
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild className="w-full">
                            <Link href="/admin/breaks">
                                Szünetek kezelése
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </Container>
    )
}