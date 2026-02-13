import Container from "@/components/container";
import { getMyAuditById } from "../../actions";
import { notFound } from "next/navigation";
import AuditExecutionClient from "./AuditExecutionClient";
import dayjs from "@/lib/dayjs";

export default async function ExecuteAuditPage({
    params,
}: {
    params: Promise<{ auditId: string }>;
}) {
    const { auditId } = await params;
    const audit = await getMyAuditById(auditId);

    if (!audit) {
        notFound();
    }

    // Csak scheduled vagy in_progress audit-ot lehet végrehajtani
    if (audit.status === 'completed') {
        return (
            <Container className="flex-1 flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Már befejezett</h1>
                <p className="text-muted-foreground">
                    Ez az ellenőrzés már be lett fejezve.
                </p>
            </Container>
        );
    }

    // Ezen a héten vagy in_progress státusz esetén lehet végrehajtani
    const auditDate = dayjs(audit.onDate);
    const today = dayjs();
    const isSameWeek = auditDate.isSame(today, 'week');
    const isInProgress = audit.status === 'in_progress';

    if (!isSameWeek && !isInProgress) {
        return (
            <Container className="flex-1 flex flex-col items-center justify-center">
                <h1 className="text-2xl font-bold mb-4">Még nem elérhető</h1>
                <p className="text-muted-foreground">
                    Ez az ellenőrzés a {auditDate.format('YYYY. ww.')} hétre van ütemezve.
                </p>
            </Container>
        );
    }

    return <AuditExecutionClient audit={audit} />;
}

