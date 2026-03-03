"use client"

import { TreeView } from "@/components/tree-view"
import { ProcessedSite } from "./page"
import { useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SaveIcon, TrashIcon, UndoIcon, PlusIcon, EditIcon, ChevronUpIcon, ChevronDownIcon } from "lucide-react"
import { Label } from "@/components/ui/label"
import { deleteSiteAction, updateSiteAction } from "./actions"
import { deleteCheckAction, reorderChecksAction } from "./checks/actions"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import dayjs from "@/lib/dayjs"

// Check Card Component
const CheckCard = ({ 
    siteId,
    check, 
    isPending,
    canMoveUp,
    canMoveDown,
    onDelete,
    onMoveUp,
    onMoveDown
}: { 
    siteId: string;
    check: {
        _id: string;
        text: string;
        description?: string | null;
        referenceImage?: string | null;
        referenceImages?: string[];
    }, 
    isPending: boolean,
    canMoveUp: boolean,
    canMoveDown: boolean,
    onDelete: () => void,
    onMoveUp: () => void,
    onMoveDown: () => void
}) => {
    // Ensure check is a plain object
    const checkData = {
        _id: String(check._id || ''),
        text: String(check.text || ''),
        description: check.description || null,
        referenceImage: check.referenceImage || null,
        referenceImages: check.referenceImages || [],
    };

    return (
        <Card>
            <CardContent className="pt-4 pb-4">
                <div className="flex flex-row items-start justify-between gap-2">
                    <div className="flex-1 flex flex-col gap-2">
                        <p className="text-sm font-semibold">{checkData.text}</p>
                        {checkData.description && (
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                {checkData.description}
                            </p>
                        )}
                        {checkData.referenceImages.length > 0 && (
                            <div className="flex flex-row gap-2 flex-wrap">
                                {checkData.referenceImages.map((imageId, idx) => (
                                    <div key={idx} className="relative w-20 h-20 rounded overflow-hidden border">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img 
                                            src={`/api/upload/${imageId}`}
                                            alt={`Referencia kép ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        {checkData.referenceImage && !checkData.referenceImages.length && (
                            <div className="relative w-32 h-32 rounded overflow-hidden border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img 
                                    src={`/api/upload/${checkData.referenceImage}`}
                                    alt="Referencia kép"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex flex-row gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onMoveUp}
                                disabled={isPending || !canMoveUp}
                                title="Fel"
                            >
                                <ChevronUpIcon className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onMoveDown}
                                disabled={isPending || !canMoveDown}
                                title="Le"
                            >
                                <ChevronDownIcon className="w-4 h-4" />
                            </Button>
                        </div>
                        <Link href={`/admin/sites/${siteId}/checks/${checkData._id}/edit`}>
                            <Button
                                variant="ghost"
                                size="icon"
                                disabled={isPending}
                                title="Szerkesztés"
                            >
                                <EditIcon className="w-4 h-4" />
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onDelete}
                            disabled={isPending}
                            title="Törlés"
                        >
                            <TrashIcon className="w-4 h-4 text-red-600" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};


type NotificationUser = { _id: string; fullName: string; email: string };

const SelectedEditor = ({
    site,
    level,
    siteLeaders,
    admins,
}: {
    site: ProcessedSite | null,
    level: number,
    siteLeaders: NotificationUser[],
    admins: NotificationUser[],
}) => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [name, setName] = useState(site?.name || "");
    const [children, setChildren] = useState(site?.children)
    const [checks, setChecks] = useState(site?.checks)
    const [selectedSiteLeaders, setSelectedSiteLeaders] = useState<string[]>(site?.siteLeaders || []);
    const [resultEmailListText, setResultEmailListText] = useState((site?.resultEmailList || []).join(', '));
    const [selectedResultAdmins, setSelectedResultAdmins] = useState<string[]>(site?.resultAdminRecipients || []);
    const [notifyAdminsOnResult, setNotifyAdminsOnResult] = useState(Boolean(site?.notifyAdminsOnResult));
    const [siteLeaderFilter, setSiteLeaderFilter] = useState('');
    const [adminFilter, setAdminFilter] = useState('');

    const mode = useMemo<("children" | "checks" | undefined)>(() => {
        if (!site) return undefined
        switch (level) {
            case 0:
                return "children" // Level 0: mindig alterületek
            case 1:
                // Level 1: ha vannak children → "children", különben → "checks"
                if (children && children.length > 0) return "children"
                return "checks" // Default: checks mode (lehet check-eket hozzáadni)
            case 2:
                return "checks" // Level 2: mindig checks
        }
        return undefined
    }, [level, children, site])

    const nameChanged = useMemo(() => {
        return site?.name !== name
    }, [site?.name, name])
    const notificationChanged = useMemo(() => {
        const currentLeaders = (site?.siteLeaders || []).slice().sort().join(',');
        const nextLeaders = selectedSiteLeaders.slice().sort().join(',');
        const currentEmails = (site?.resultEmailList || []).map((e) => e.trim().toLowerCase()).sort().join(',');
        const nextEmails = resultEmailListText
            .split(/[,\n;]/)
            .map((e) => e.trim().toLowerCase())
            .filter(Boolean)
            .sort()
            .join(',');
        const currentAdmins = (site?.resultAdminRecipients || []).slice().sort().join(',');
        const nextAdmins = selectedResultAdmins.slice().sort().join(',');
        const currentNotifyAdmins = Boolean(site?.notifyAdminsOnResult);
        return currentLeaders !== nextLeaders || currentEmails !== nextEmails || currentAdmins !== nextAdmins || currentNotifyAdmins !== notifyAdminsOnResult;
    }, [site?.siteLeaders, selectedSiteLeaders, site?.resultEmailList, resultEmailListText, site?.resultAdminRecipients, selectedResultAdmins, site?.notifyAdminsOnResult, notifyAdminsOnResult]);

    useEffect(() => {
        setName(site?.name || "")
        setChildren(site?.children)
        setChecks(site?.checks)
        setSelectedSiteLeaders(site?.siteLeaders || [])
        setResultEmailListText((site?.resultEmailList || []).join(', '))
        setSelectedResultAdmins(site?.resultAdminRecipients || [])
        setNotifyAdminsOnResult(Boolean(site?.notifyAdminsOnResult))
        setSiteLeaderFilter('')
        setAdminFilter('')
    }, [site])

    const undoChanges = useCallback(() => {
        setName(site?.name || "")
        setChildren(site?.children)
        setChecks(site?.checks)
        setSelectedSiteLeaders(site?.siteLeaders || [])
        setResultEmailListText((site?.resultEmailList || []).join(', '))
        setSelectedResultAdmins(site?.resultAdminRecipients || [])
        setNotifyAdminsOnResult(Boolean(site?.notifyAdminsOnResult))
        setSiteLeaderFilter('')
        setAdminFilter('')
    }, [site])

    const handleSave = useCallback(async () => {
        if (!site || (!nameChanged && !notificationChanged)) return;

        startTransition(async () => {
            const formData = new FormData();
            formData.append('name', name);
            for (const leaderId of selectedSiteLeaders) {
                formData.append('siteLeaders', leaderId);
            }
            for (const adminId of selectedResultAdmins) {
                formData.append('resultAdminRecipients', adminId);
            }
            formData.append('resultEmailList', resultEmailListText);
            formData.append('notifyAdminsOnResult', notifyAdminsOnResult ? 'true' : 'false');
            
            const result = await updateSiteAction(site._id, { success: false }, formData);
            
            if (result.success) {
                toast.success(result.message || 'Terület frissítve');
                router.refresh();
            } else {
                toast.error(result.message || 'Hiba történt');
            }
        });
    }, [site, name, nameChanged, notificationChanged, selectedSiteLeaders, resultEmailListText, selectedResultAdmins, notifyAdminsOnResult, router]);

    const handleDelete = useCallback(async () => {
        if (!site) return;
        
        if (!confirm(`Biztosan törlöd a "${site.name}" területet? Ez az összes alterületét és ellenőrzését is törli!`)) {
            return;
        }

        startTransition(async () => {
            const result = await deleteSiteAction(site._id);
            
            if (result.success) {
                toast.success(result.message || 'Terület törölve');
                router.refresh();
            } else {
                toast.error(result.message || 'Hiba történt');
            }
        });
    }, [site, router]);

    if (!site) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <p>Válassz ki egy területet a szerkesztéshez</p>
            </div>
        );
    }

    const filteredSiteLeaders = siteLeaders.filter((leader) => {
        if (!siteLeaderFilter.trim()) return true;
        const token = siteLeaderFilter.trim().toLowerCase();
        return (
            leader.fullName.toLowerCase().includes(token) ||
            leader.email.toLowerCase().includes(token)
        );
    });

    const filteredAdmins = admins.filter((admin) => {
        if (!adminFilter.trim()) return true;
        const token = adminFilter.trim().toLowerCase();
        return (
            admin.fullName.toLowerCase().includes(token) ||
            admin.email.toLowerCase().includes(token)
        );
    });
    const monthStartStr = dayjs().startOf('month').format('YYYY-MM-DD');
    const todayStr = dayjs().format('YYYY-MM-DD');

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-1 items-center">
                    <Label htmlFor="name">Név</Label>
                    {nameChanged ? <span className="text-sm text-blue-600 italic leading-none">módosítva</span> : null}
                </div>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isPending}
                />
            </div>

            {mode === "children" || mode === undefined ? (
                <div className="flex flex-col gap-2">
                    <Label>Alterületek</Label>
                    {children && children.length > 0 ? (
                        <p className="text-sm text-muted-foreground">
                            {children.length} alterület
                        </p>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Még nincsenek alterületek
                        </p>
                    )}
                    {level < 2 && (
                        <Link href={`/admin/sites/create?parentId=${site._id}&level=${level + 1}`}>
                            <Button variant="outline" size="sm" disabled={isPending}>
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Alterület hozzáadása
                            </Button>
                        </Link>
                    )}
                </div>
            ) : null}

            {mode === "checks" ? (
                <div className="flex flex-col gap-2">
                    <div className="flex flex-row items-center justify-between">
                        <Label>Ellenőrzési pontok</Label>
                        <Link href={`/admin/sites/${site._id}/checks/create`}>
                            <Button variant="outline" size="sm" disabled={isPending}>
                                <PlusIcon className="w-4 h-4 mr-2" />
                                Új ellenőrzés
                            </Button>
                        </Link>
                    </div>
                    
                    {checks && checks.length > 0 ? (
                        <div className="flex flex-col gap-2 mt-2">
                            {checks.map((check, index) => (
                                <CheckCard 
                                    key={check._id || `check-${index}`}
                                    siteId={site._id}
                                    check={check}
                                    isPending={isPending}
                                    canMoveUp={index > 0}
                                    canMoveDown={index < checks.length - 1}
                                    onMoveUp={() => {
                                        if (!checks) return;
                                        const newOrder = [...checks];
                                        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
                                        startTransition(async () => {
                                            const result = await reorderChecksAction(
                                                site._id,
                                                newOrder.map(c => c._id)
                                            );
                                            if (result.success) {
                                                toast.success(result.message);
                                                router.refresh();
                                            } else {
                                                toast.error(result.message || 'Hiba történt');
                                            }
                                        });
                                    }}
                                    onMoveDown={() => {
                                        if (!checks) return;
                                        const newOrder = [...checks];
                                        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
                                        startTransition(async () => {
                                            const result = await reorderChecksAction(
                                                site._id,
                                                newOrder.map(c => c._id)
                                            );
                                            if (result.success) {
                                                toast.success(result.message);
                                                router.refresh();
                                            } else {
                                                toast.error(result.message || 'Hiba történt');
                                            }
                                        });
                                    }}
                                    onDelete={async () => {
                                        if (!check._id) {
                                            toast.error('Az ellenőrzési pont ID-ja hiányzik');
                                            return;
                                        }
                                        if (!confirm(`Biztosan törlöd ezt az ellenőrzési pontot?`)) {
                                            return;
                                        }
                                        startTransition(async () => {
                                            const result = await deleteCheckAction(site._id, check._id);
                                            if (result.success) {
                                                toast.success(result.message);
                                                router.refresh();
                                            } else {
                                                toast.error(result.message);
                                            }
                                        });
                                    }}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground mt-2">
                            Még nincsenek ellenőrzési pontok definiálva.
                        </p>
                    )}
                </div>
            ) : null}

            <div className="flex flex-col gap-3 border rounded-md p-3">
                <Label>Összefoglaló email beállítások</Label>
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">Terület vezetők hozzárendelése</p>
                    <div className="flex flex-col gap-2">
                        <Input
                            value={siteLeaderFilter}
                            onChange={(e) => setSiteLeaderFilter(e.target.value)}
                            placeholder="Keresés név vagy email alapján"
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedSiteLeaders(filteredSiteLeaders.map((l) => l._id))}
                            >
                                Szűrt kijelölése
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    setSelectedSiteLeaders((prev) =>
                                        prev.filter((id) => !filteredSiteLeaders.some((l) => l._id === id))
                                    )
                                }
                            >
                                Szűrt törlése
                            </Button>
                        </div>
                    </div>
                    {siteLeaders.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nincs elérhető `site_leader` felhasználó.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {filteredSiteLeaders.map((leader) => (
                                <label key={leader._id} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={selectedSiteLeaders.includes(leader._id)}
                                        onCheckedChange={(checked) => {
                                            setSelectedSiteLeaders((prev) => {
                                                if (checked) return Array.from(new Set([...prev, leader._id]));
                                                return prev.filter((id) => id !== leader._id);
                                            });
                                        }}
                                    />
                                    <span>{leader.fullName} ({leader.email})</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <Label htmlFor="resultEmailList">Extra email címek (vesszővel elválasztva)</Label>
                    <Input
                        id="resultEmailList"
                        value={resultEmailListText}
                        onChange={(e) => setResultEmailListText(e.target.value)}
                        placeholder="vezeto1@ceg.hu, vezeto2@ceg.hu"
                    />
                </div>
                <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                        checked={notifyAdminsOnResult}
                        onCheckedChange={(checked) => setNotifyAdminsOnResult(Boolean(checked))}
                    />
                    <span>Adminok is kapjanak összefoglaló emailt</span>
                </label>
                <div className="flex flex-col gap-2">
                    <p className="text-sm text-muted-foreground">Kijelölt admin címzettek</p>
                    <div className="flex flex-col gap-2">
                        <Input
                            value={adminFilter}
                            onChange={(e) => setAdminFilter(e.target.value)}
                            placeholder="Keresés admin név vagy email alapján"
                        />
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedResultAdmins(filteredAdmins.map((a) => a._id))}
                            >
                                Szűrt kijelölése
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                    setSelectedResultAdmins((prev) =>
                                        prev.filter((id) => !filteredAdmins.some((a) => a._id === id))
                                    )
                                }
                            >
                                Szűrt törlése
                            </Button>
                        </div>
                    </div>
                    {admins.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Nincs admin felhasználó.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {filteredAdmins.map((admin) => (
                                <label key={admin._id} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                        checked={selectedResultAdmins.includes(admin._id)}
                                        onCheckedChange={(checked) => {
                                            setSelectedResultAdmins((prev) => {
                                                if (checked) return Array.from(new Set([...prev, admin._id]));
                                                return prev.filter((id) => id !== admin._id);
                                            });
                                        }}
                                    />
                                    <span>{admin.fullName} ({admin.email})</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                {notifyAdminsOnResult && admins.length > 0 ? (
                    <p className="text-xs text-muted-foreground">
                        Jelenlegi admin címzettek: {admins.map((a) => a.fullName).join(', ')}
                    </p>
                ) : null}
            </div>

            <div className="flex flex-col gap-2 border rounded-md p-3">
                <Label>Terület audit naplók</Label>
                <p className="text-xs text-muted-foreground">
                    Nyisd meg a kiválasztott terület audit listáját vagy exportáld CSV-ben.
                </p>
                <div className="flex gap-2">
                    <Link href={`/admin/audits?siteId=${site._id}`}>
                        <Button type="button" variant="outline" size="sm">Audit lista megnyitása</Button>
                    </Link>
                    <Link href={`/api/admin/reports/export?siteId=${site._id}&startDate=${monthStartStr}&endDate=${todayStr}`}>
                        <Button type="button" size="sm">Audit export (CSV)</Button>
                    </Link>
                </div>
            </div>

            <div className="flex flex-row gap-2 items-center justify-end">
                <Button 
                    variant="destructive" 
                    onClick={handleDelete}
                    disabled={isPending}
                >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Törlés
                </Button>
                <Button 
                    variant="outline" 
                    disabled={(!nameChanged && !notificationChanged) || isPending} 
                    onClick={undoChanges}
                >
                    <UndoIcon className="w-4 h-4 mr-2" />
                    Visszavonás
                </Button>
                <Button 
                    variant="default" 
                    disabled={(!nameChanged && !notificationChanged) || isPending}
                    onClick={handleSave}
                >
                    <SaveIcon className="w-4 h-4 mr-2" />
                    Mentés
                </Button>
            </div>
        </div>
    )
}

export default function SitesEditor({
    sites,
    siteLeaders,
    admins,
}: {
    sites: ProcessedSite[]
    siteLeaders: NotificationUser[]
    admins: NotificationUser[]
}) {
    const searchParams = useSearchParams();
    const selectedParam = searchParams.get('selected');
    const [selectedSite, setSelectedSite] = useState<ProcessedSite | null>(null)
    const router = useRouter()

    const selectedSiteLevel = useMemo(() => {
        if (!selectedSite) return 0;

        // Check if the selected site is a top-level site
        const isTopLevel = sites.some(site => site._id === selectedSite._id);
        if (isTopLevel) return 0;

        // Check if it's a level 1 child (direct child of a top-level site)
        for (const topSite of sites) {
            if (topSite.children?.some(child => child._id === selectedSite._id)) {
                return 1;
            }

            // Check if it's a level 2 child (child of a child)
            if (topSite.children) {
                for (const child of topSite.children) {
                    if (child.children?.some(grandChild => grandChild._id === selectedSite._id)) {
                        return 2;
                    }
                }
            }
        }

        return 0; // fallback
    }, [selectedSite, sites])

    // Create a flat map of all sites for easy lookup
    const siteMap = useMemo(() => {
        const map = new Map<string, ProcessedSite>();

        const addToMap = (site: ProcessedSite) => {
            map.set(site._id, site);
            site.children?.forEach(addToMap);
        };

        sites.forEach(addToMap);
        return map;
    }, [sites]);

    // Handle auto-selection from URL
    useEffect(() => {
        if (selectedParam && !selectedSite) {
            const site = siteMap.get(selectedParam);
            if (site) {
                setSelectedSite(site);
            }
        }
    }, [selectedParam, siteMap, selectedSite]);

    return (
        <div className="flex flex-row gap-4 flex-wrap-reverse">
            <TreeView
                className="flex-1 min-w-fit pr-8"
                onSelectChange={(value: any) => {
                    const site = siteMap.get(value.id);
                    setSelectedSite(site || null);
                }}
                expandAll
                data={
                    sites.map((site) => ({
                        id: site._id,
                        name: site.name,
                        children: site.children?.map((child) => ({
                            id: child._id,
                            name: child.name,
                            children: child.children?.map((grandChild) => ({
                                id: grandChild._id,
                                name: grandChild.name,
                            })) || undefined
                        })) || undefined
                    }))
                } />

            <div className="flex-4 min-w-fit">
                <SelectedEditor site={selectedSite} level={selectedSiteLevel} siteLeaders={siteLeaders} admins={admins} />
            </div>
        </div>
    )
}