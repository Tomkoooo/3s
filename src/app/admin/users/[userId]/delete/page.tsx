import Container from '@/components/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getInitials, getRoleTranslation } from '@/lib/utils';
import { getCurrentUser, getUserById } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { deleteUserAction, type DeleteUserState } from './actions';
import Link from 'next/link';
import DeleteForm from './DeleteForm';

export default async function UserEdit({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const currentUser = await getCurrentUser();
    const isCurrentUser = currentUser?.id === userId;
    const user = await getUserById(userId);
    if (!user) {
        return notFound();
    }
    async function onDeleteAction(): Promise<DeleteUserState> {
        'use server'
        const res = await deleteUserAction(userId);
        if (!res.success) {
            return { success: false, message: res.message || 'Törlés sikertelen' };
        }
        return res;
    }

    return (
        <Container className="flex-1 flex flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Felhasználó törlése</CardTitle>
                    <CardDescription>
                        Ezt a műveletet nem lehet visszavonni. A {isCurrentUser ? <span className="text-amber-600">saját fiókod</span> : 'felhasználó'} végleg törlésre kerül.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-6">
                        <div className="flex items-center gap-3">
                            <Avatar className="size-12">
                                <AvatarFallback className="bg-primary text-primary-foreground lowercase">{user.fullName ? getInitials(user.fullName, 2) : user.email.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-medium">{user.fullName || 'Nincs név'}</span>
                                <span className="text-sm text-muted-foreground">{user.email}</span>
                            </div>
                        </div>
                        <div className="text-sm">
                            <span className="text-muted-foreground">Szerepkör: </span>
                            <span>{getRoleTranslation(user.role)}</span>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/admin/users">Mégsem</Link>
                            </Button>
                            <DeleteForm action={onDeleteAction} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Container>
    );
}