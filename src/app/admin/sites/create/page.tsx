import Container from "@/components/container";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SiteForm from "../SiteForm";
import { getSiteById } from "../actions";

export default async function CreateSitePage({
    searchParams,
}: {
    searchParams: Promise<{ parentId?: string; level?: string }>;
}) {
    const params = await searchParams;
    const parentId = params.parentId;
    const level = params.level ? parseInt(params.level) : 0;

    // Ha van parent, lekérjük a nevét
    let parentSite = null;
    if (parentId) {
        parentSite = await getSiteById(parentId);
    }

    const levelNames = ['első', 'második', 'harmadik'];
    const isSubArea = level > 0;

    return (
        <Container className="flex-1 flex flex-col gap-4 max-w-2xl">
            <Card>
                <CardHeader>
                    <CardTitle>
                        {isSubArea ? 'Új alterület létrehozása' : 'Új terület létrehozása'}
                    </CardTitle>
                    <CardDescription>
                        {isSubArea && parentSite
                            ? `Hozz létre egy új ${levelNames[level]} szintű területet a "${parentSite.name}" területen belül.`
                            : 'Hozz létre egy új első szintű területet. Alterületeket később adhatsz hozzá.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <SiteForm 
                        parentId={parentId} 
                        initialLevel={level}
                        mode="create"
                    />
                </CardContent>
            </Card>
        </Container>
    );
}

