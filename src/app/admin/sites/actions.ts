"use server";

import { connectDB } from "@/lib/db";
import Site from "@/lib/db/models/Site";
import { siteSchema } from "@/lib/validation";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type SiteFormState = {
    success: boolean;
    message?: string;
    siteId?: string;
    fieldErrors?: {
        name?: string[];
        level?: string[];
    };
};

/**
 * Új terület létrehozása
 */
export async function createSiteAction(
    _prevState: SiteFormState,
    formData: FormData
): Promise<SiteFormState> {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez a művelethez' };
        }

        const rawName = formData.get('name');
        const rawLevel = formData.get('level');
        const rawParentId = formData.get('parentId');

        const parsed = siteSchema.safeParse({
            name: rawName,
            level: rawLevel ? parseInt(rawLevel as string) : 0,
            parentId: rawParentId || undefined,
        });

        if (!parsed.success) {
            const { fieldErrors } = parsed.error.flatten();
            return {
                success: false,
                fieldErrors: {
                    name: fieldErrors.name,
                    level: fieldErrors.level,
                },
                message: 'Hibás adatok',
            };
        }

        const { name, level, parentId } = parsed.data;

        await connectDB();

        // Ha van parent, ellenőrizzük hogy létezik-e és hozzáadhatjuk-e
        if (parentId) {
            const parent = await Site.findById(parentId);
            if (!parent) {
                return { success: false, message: 'A szülő terület nem található' };
            }

            // Parent nem lehet level 2 (harmadik szint)
            if (parent.level === 2) {
                return { success: false, message: 'A harmadik szintű területekhez nem adható további alterület' };
            }

            // Level konzisztencia ellenőrzés
            if (level !== parent.level + 1) {
                return { success: false, message: 'A szint nem egyezik a hierarchiával' };
            }
        }

        // Új terület létrehozása
        const newSite = await Site.create({
            name,
            level,
            parentId: parentId || null,
            children: [],
            checks: [],
        });

        // Ha van parent, hozzáadjuk a parent children listájához
        if (parentId) {
            await Site.findByIdAndUpdate(parentId, {
                $push: { children: newSite._id },
            });
        }

        revalidatePath('/admin/sites');
        return { success: true, message: 'Terület sikeresen létrehozva', siteId: newSite._id.toString() };
    } catch (error) {
        console.error('Create site error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

/**
 * Terület szerkesztése (csak név)
 */
export async function updateSiteAction(
    siteId: string,
    _prevState: SiteFormState,
    formData: FormData
): Promise<SiteFormState> {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez a művelethez' };
        }

        const rawName = formData.get('name');

        if (!rawName || typeof rawName !== 'string' || rawName.trim().length === 0) {
            return {
                success: false,
                fieldErrors: { name: ['A név megadása kötelező'] },
            };
        }

        await connectDB();

        const site = await Site.findById(siteId);
        if (!site) {
            return { success: false, message: 'A terület nem található' };
        }

        site.name = rawName.trim();
        await site.save();

        revalidatePath('/admin/sites');
        return { success: true, message: 'Terület sikeresen frissítve' };
    } catch (error) {
        console.error('Update site error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

/**
 * Terület törlése (cascade: gyerekek és ellenőrzések is)
 */
export async function deleteSiteAction(siteId: string): Promise<SiteFormState> {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez a művelethez' };
        }

        await connectDB();

        const site = await Site.findById(siteId);
        if (!site) {
            return { success: false, message: 'A terület nem található' };
        }

        // Rekurzív törlés: először a gyerekek
        if (site.children && site.children.length > 0) {
            for (const childId of site.children) {
                await deleteSiteRecursive(childId.toString());
            }
        }

        // TODO: Ellenőrzések törlése (amikor Check CRUD kész lesz)
        // if (site.checks && site.checks.length > 0) {
        //     await Check.deleteMany({ _id: { $in: site.checks } });
        // }

        // Parent children listájából eltávolítás
        if (site.parentId) {
            await Site.findByIdAndUpdate(site.parentId, {
                $pull: { children: site._id },
            });
        }

        // Terület törlése
        await Site.findByIdAndDelete(siteId);

        revalidatePath('/admin/sites');
        return { success: true, message: 'Terület és alterületei sikeresen törölve' };
    } catch (error) {
        console.error('Delete site error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

/**
 * Rekurzív helper a site és gyerekek törléséhez
 */
async function deleteSiteRecursive(siteId: string): Promise<void> {
    const site = await Site.findById(siteId);
    if (!site) return;

    // Rekurzív törlés gyerekekre
    if (site.children && site.children.length > 0) {
        for (const childId of site.children) {
            await deleteSiteRecursive(childId.toString());
        }
    }

    // TODO: Checks törlése
    // if (site.checks && site.checks.length > 0) {
    //     await Check.deleteMany({ _id: { $in: site.checks } });
    // }

    await Site.findByIdAndDelete(siteId);
}

/**
 * Összes top-level site lekérése (level 0) populált alterületekkel és check-ekkel
 */
export async function getTopLevelSites() {
    try {
        await connectDB();

        // Import Check model to ensure it's registered
        await import('@/lib/db/models/Check');
        const Check = (await import('@/lib/db/models/Check')).default;

        const sites = await Site.find({ level: 0 })
            .select('_id name level parentId children checks')
            .lean()
            .exec();

        // Recursively populate checks for all sites
        async function populateChecks(siteList: any[]): Promise<any[]> {
            const result = [];
            
            for (const site of siteList) {
                const siteData: any = {
                    _id: site._id.toString(),
                    name: site.name,
                    level: site.level,
                    parentId: site.parentId?.toString(),
                    children: [],
                    checks: [],
                };

                // Populate checks if they exist
                if (site.checks && site.checks.length > 0) {
                    const checkIds = site.checks.map((id: any) => id.toString());
                    const checks = await Check.find({ _id: { $in: checkIds } })
                        .select('_id text description referenceImage')
                        .lean()
                        .exec();
                    
                    siteData.checks = checks.map((check: any) => ({
                        _id: check._id.toString(),
                        text: check.text,
                        description: check.description || null,
                        referenceImage: check.referenceImage?.toString() || null,
                    }));
                }

                // Recursively populate children
                if (site.children && site.children.length > 0) {
                    const childIds = site.children.map((id: any) => id.toString());
                    const children = await Site.find({ _id: { $in: childIds } })
                        .select('_id name level parentId children checks')
                        .lean()
                        .exec();
                    
                    siteData.children = await populateChecks(children);
                }

                result.push(siteData);
            }
            
            return result;
        }

        return await populateChecks(sites);
    } catch (error) {
        console.error('Get sites error:', error);
        return [];
    }
}

/**
 * Site lekérése ID alapján
 */
export async function getSiteById(siteId: string) {
    try {
        await connectDB();
        const site = await Site.findById(siteId).lean().exec();
        return site;
    } catch (error) {
        console.error('Get site by id error:', error);
        return null;
    }
}


