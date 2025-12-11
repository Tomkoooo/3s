import Container from '@/components/container';
import { RegisterForm } from '@/components/RegisterForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createUserAction } from './actions';

export default async function UserCreate() {
    return (
        <Container className="flex-1 flex flex-col items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Felhasználó létrehozása</CardTitle>
                    <CardDescription>
                        Ebben a menüben létrehozhatsz egy új felhasználót.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <RegisterForm registerAction={createUserAction} roleSelect={true} redirectTo={`/admin/users`} cancelRedirectTo={`/admin/users`} />
                </CardContent>
            </Card>
        </Container>
    );
}