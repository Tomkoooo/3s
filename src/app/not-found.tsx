import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NotFound() {
    return (
        <Container className="flex-1 flex flex-col items-center justify-center">
            <div className="flex flex-col items-center justify-center gap-4">
                <h1 className="text-4xl font-bold text-center">404 - Hibás útvonal</h1>
                <p className="text-lg text-muted-foreground text-center">A kért tartalom nem található.</p>
                <Button asChild>
                    <Link href="/">Vissza az irányítópultra</Link>
                </Button>
            </div>
        </Container>
    )
}