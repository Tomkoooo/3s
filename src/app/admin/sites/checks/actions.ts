"use server";

import { connectDB } from "@/lib/db";
import Check from "@/lib/db/models/Check";
import Site from "@/lib/db/models/Site";
import { checkSchema } from "@/lib/validation";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";

export type CheckFormState = {
    success: boolean;
    message?: string;
    fieldErrors?: {
        text?: string[];
        description?: string[];
    };
};

/**
 * Új ellenőrzési pont létrehozása
 */
export async function createCheckAction(
    siteId: string,
    _prevState: CheckFormState,
    formData: FormData
): Promise<CheckFormState> {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez a művelethez' };
        }

        const rawText = formData.get('text');
        const rawDescription = formData.get('description');
        const rawReferenceImage = formData.get('referenceImage');

        const parsed = checkSchema.safeParse({
            text: rawText,
            description: rawDescription || undefined,
            referenceImage: rawReferenceImage || undefined,
        });

        if (!parsed.success) {
            const { fieldErrors } = parsed.error.flatten();
            return {
                success: false,
                fieldErrors: {
                    text: fieldErrors.text,
                    description: fieldErrors.description,
                },
                message: 'Hibás adatok',
            };
        }

        const { text, description, referenceImage } = parsed.data;

        await connectDB();

        // Ellenőrizzük hogy a site létezik
        const site = await Site.findById(siteId);
        if (!site) {
            return { success: false, message: 'A terület nem található' };
        }

        // Ellenőrizzük hogy a site-nak lehetnek-e checks-ei
        if (site.children && site.children.length > 0) {
            return { success: false, message: 'Ehhez a területhez nem adhatók ellenőrzések, mert alterületei vannak' };
        }

        // Új check létrehozása
        const newCheck = await Check.create({
            text,
            description: description || null,
            referenceImage: referenceImage || null,
        });

        // Check hozzáadása a site-hoz
        await Site.findByIdAndUpdate(siteId, {
            $push: { checks: newCheck._id },
        });

        revalidatePath('/admin/sites');
        return { success: true, message: 'Ellenőrzési pont sikeresen létrehozva' };
    } catch (error) {
        console.error('Create check error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

/**
 * Ellenőrzési pont szerkesztése
 */
export async function updateCheckAction(
    checkId: string,
    _prevState: CheckFormState,
    formData: FormData
): Promise<CheckFormState> {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez a művelethez' };
        }

        const rawText = formData.get('text');
        const rawDescription = formData.get('description');

        const parsed = checkSchema.safeParse({
            text: rawText,
            description: rawDescription || undefined,
        });

        if (!parsed.success) {
            const { fieldErrors } = parsed.error.flatten();
            return {
                success: false,
                fieldErrors: {
                    text: fieldErrors.text,
                    description: fieldErrors.description,
                },
            };
        }

        const { text, description } = parsed.data;

        await connectDB();

        const check = await Check.findById(checkId);
        if (!check) {
            return { success: false, message: 'Az ellenőrzési pont nem található' };
        }

        check.text = text;
        check.description = description || null;
        await check.save();

        revalidatePath('/admin/sites');
        return { success: true, message: 'Ellenőrzési pont frissítve' };
    } catch (error) {
        console.error('Update check error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

/**
 * Ellenőrzési pont törlése
 */
export async function deleteCheckAction(
    siteId: string,
    checkId: string
): Promise<CheckFormState> {
    try {
        // Auth check
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return { success: false, message: 'Nincs jogosultságod ehhez a művelethez' };
        }

        await connectDB();

        // Import Check model to ensure it's registered
        await import('@/lib/db/models/Check');

        // Validate ObjectId
        if (!ObjectId.isValid(checkId)) {
            return { success: false, message: 'Érvénytelen ellenőrzési pont ID' };
        }

        const check = await Check.findById(checkId);
        if (!check) {
            return { success: false, message: 'Az ellenőrzési pont nem található' };
        }

        // Törlés a site checks listájából (ObjectId-ként)
        await Site.findByIdAndUpdate(siteId, {
            $pull: { checks: new ObjectId(checkId) },
        });

        // Check törlése
        await Check.findByIdAndDelete(checkId);

        revalidatePath('/admin/sites');
        return { success: true, message: 'Ellenőrzési pont törölve' };
    } catch (error) {
        console.error('Delete check error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Ismeretlen hiba történt',
        };
    }
}

/**
 * Site összes check-jének lekérése
 */
export async function getChecksBySiteId(siteId: string) {
    try {
        await connectDB();
        
        // Import Check model to ensure it's registered
        await import('@/lib/db/models/Check');
        
        const site = await Site.findById(siteId)
            .select('checks')
            .lean()
            .exec();
        
        if (!site || !site.checks || site.checks.length === 0) {
            return [];
        }

        // Fetch checks manually
        const checkIds = site.checks.map((id: any) => id.toString());
        const checks = await Check.find({ _id: { $in: checkIds } })
            .lean()
            .exec();

        return checks.map((check: any) => ({
            _id: check._id.toString(),
            text: check.text,
            description: check.description || null,
            referenceImage: check.referenceImage?.toString() || null,
        }));
    } catch (error) {
        console.error('Get checks error:', error);
        return [];
    }
}


