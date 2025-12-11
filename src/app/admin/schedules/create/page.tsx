import Container from "@/components/container";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import CreateScheduleForm from "./CreateScheduleForm";
import { getTopLevelSites } from "@/app/admin/sites/actions";
import { getAvailableAuditors } from "@/app/admin/audits/schedule/actions";

export default async function CreateSchedulePage() {
    // Reuse existing actions to fetch data
    const sites = await getTopLevelSites();
    const auditors = await getAvailableAuditors();

    // Flatten sites for the selector (site selector usually needs flat list of selectable items)
    // Actually, let's pass the raw tree for better UI if we were reusing the tree selector, 
    // but to keep it simple and reusing the pattern from AuditSchedule, 
    // we might want a flat list of "schedulable" sites (leaf nodes or all nodes).
    // The AuditSchedule actions.ts has `getSchedulableSites`. Let's use that if exposed, or just use what we have.
    // getTopLevelSites returns a tree.
    
    // Simplification: Let's assume we can schedule for any site that has checks.
    // Helper to flatten and filter:
    const flattenSites = (nodes: any[]): any[] => {
        let flat: any[] = [];
        for (const node of nodes) {
            // Include if it has checks
            if (node.checks && node.checks.length > 0) {
                flat.push(node);
            }
            if (node.children) {
                flat = flat.concat(flattenSites(node.children));
            }
        }
        return flat;
    };
    
    const schedulableSites = flattenSites(sites);

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-4xl">
            <div className="flex items-center gap-4">
                <Link href="/admin/schedules">
                    <Button variant="ghost" size="icon">
                        <ArrowLeftIcon className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Új ütemezés létrehozása</h1>
                    <p className="text-sm text-muted-foreground">
                        Állíts be egy új ismétlődő audit szabályt.
                    </p>
                </div>
            </div>

            <CreateScheduleForm sites={schedulableSites} auditors={auditors} />
        </Container>
    );
}
