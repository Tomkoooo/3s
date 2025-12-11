import Container from "@/components/container";
import { Card, CardTitle, CardHeader, CardDescription, CardContent } from "@/components/ui/card";
import LoginForm from "./LoginForm";

export default function Login() {
    return <Container className="flex-1 flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Bejelentkezés</CardTitle>
                <CardDescription>
                    Adja meg a fiók adatait a bejelentkezéshez.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <LoginForm />
            </CardContent>
        </Card>
    </Container>;
}