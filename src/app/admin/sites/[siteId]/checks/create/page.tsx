import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CheckForm from "@/components/CheckForm";
import { getSiteById } from "@/app/admin/sites/actions";
import { notFound } from "next/navigation";

export default async function CreateCheckPage({
    params,
}: {
    params: Promise<{ siteId: string }>;
}) {
    const { siteId } = await params;
    const site = await getSiteById(siteId);

    if (!site) {
        notFound();
    }

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Új ellenőrzési pont</CardTitle>
                    <CardDescription>
                        Új ellenőrzési pont hozzáadása a(z) &quot;{site.name}&quot; területhez.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CheckForm siteId={siteId} mode="create" />
                </CardContent>
            </Card>
        </Container>
    );
}



