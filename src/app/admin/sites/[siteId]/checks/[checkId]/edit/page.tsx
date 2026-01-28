import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CheckForm from "@/components/CheckForm";
import { getCheckById } from "@/app/admin/sites/checks/actions";
import { notFound } from "next/navigation";

export default async function EditCheckPage({
    params,
}: {
    params: Promise<{ siteId: string; checkId: string }>;
}) {
    const { siteId, checkId } = await params;
    const check = await getCheckById(checkId);

    if (!check) {
        notFound();
    }

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Ellenőrzési pont szerkesztése</CardTitle>
                    <CardDescription>
                        Módosítsd az ellenőrzési pont adatait.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CheckForm 
                        siteId={siteId}
                        checkId={checkId}
                        initialText={check.text}
                        initialDescription={check.description || ''}
                        initialReferenceImages={check.referenceImages}
                        mode="update"
                    />
                </CardContent>
            </Card>
        </Container>
    );
}
