import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import AuditForm from "@/app/admin/audits/AuditForm";
import { getAuditableSites, getAuditors } from "../actions";

export default async function CreateAuditPage() {
    const [sites, auditors] = await Promise.all([
        getAuditableSites(),
        getAuditors(),
    ]);

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>Új ellenőrzés létrehozása</CardTitle>
                    <CardDescription>
                        Hozz létre egy új ellenőrzést egy területhez. Válaszd ki a területet, az auditorokat és a dátumot.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <AuditForm sites={sites} auditors={auditors} mode="create" />
                </CardContent>
            </Card>
        </Container>
    );
}



