import Container from "@/components/container";
import SitesEditor from "./sites-editor";
import { getTopLevelSites } from "./actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

export type ProcessedSite = {
    _id: string,
    name: string,
    level: number,
    parentId?: string,
    children?: ProcessedSite[],
    checks?: Array<{
        _id: string;
        text: string;
        description?: string | null;
        referenceImage?: string | null;
    }>,
}

export default async function SitesPage() {
    const sites = await getTopLevelSites();
    
    // Sites are already processed by getTopLevelSites with serialized checks
    const processedSites: ProcessedSite[] = sites as ProcessedSite[];

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-full">
            <div className="flex flex-row items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Területek</h1>
                    <p className="text-sm text-muted-foreground">
                        Itt tudod kezelni a területeket, alterületeiket és a hozzájuk tartozó ellenőrzéseket.
                    </p>
                </div>
                <Link href="/admin/sites/create">
                    <Button>
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Új terület
                    </Button>
                </Link>
            </div>

            {sites.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground mb-4">
                        Még nincsenek területek létrehozva.
                    </p>
                    <Link href="/admin/sites/create">
                        <Button>
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Első terület létrehozása
                        </Button>
                    </Link>
                </div>
            ) : (
                <SitesEditor sites={processedSites} />
            )}
        </Container>
    )
}