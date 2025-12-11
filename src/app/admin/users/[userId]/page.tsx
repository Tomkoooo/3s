import Container from '@/components/container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser, getUserById } from '@/lib/auth';
import { notFound } from 'next/navigation';
import UserEditForm from '@/components/UserEditForm';
import { updateUserAction } from './actions';

export default async function UserEdit({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = await params;
    const user = await getUserById(userId);
    const currentUser = await getCurrentUser();
    if (!user) {
        return notFound();
    }
    const boundAction = updateUserAction.bind(null, user.id);
    return (
        <Container className="flex-1 flex flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Felhasználó szerkesztése</CardTitle>
                    <CardDescription>
                        Ebben a menüben szerkesztheted a felhasználó adatait.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UserEditForm user={user} currentUser={currentUser} updateAction={boundAction} cancelRedirectTo="/admin/users" />
                </CardContent>
            </Card>
        </Container>
    );
}