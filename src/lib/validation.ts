import { z } from 'zod';

export const registerSchema = z.object({
    email: z.string().email('Érvényes email címet adj meg'),
    password: z
        .string()
        .min(8, 'A jelszónak legalább 8 karakter hosszúnak kell lennie')
        .max(128, 'A jelszó nem lehet hosszabb 128 karakternél'),
    role: z.enum(['auditor', 'fixer', 'admin']).default('auditor'),
    fullName: z.string().min(1, 'A név nem lehet üres'),
});

export type RegisterInput = z.infer<typeof registerSchema>;

export const userEditSchema = z.object({
    fullName: z.string().optional(),
    email: z.string().email('Érvényes email címet adj meg').optional(),
    password: z.string().optional(),
});

export type UserEditInput = z.infer<typeof userEditSchema>;

export const breakSchema = z.object({
    start: z.string().min(1, 'A kezdő dátum megadása kötelező'),
    end: z.string().optional(),
    reason: z.string().optional(),
});

export type BreakInput = z.infer<typeof breakSchema>;

// Site validáció
export const siteSchema = z.object({
    name: z.string().min(1, 'A terület neve kötelező').max(100, 'A név maximum 100 karakter lehet'),
    level: z.number().min(0).max(2),
    parentId: z.string().optional(),
});

export type SiteInput = z.infer<typeof siteSchema>;

// Check validáció
export const checkSchema = z.object({
    text: z.string().min(1, 'Az ellenőrzési pont címe kötelező').max(200, 'Maximum 200 karakter'),
    description: z.string().max(2000, 'Maximum 2000 karakter').optional(),
    referenceImage: z.string().optional(), // GridFS ObjectId string
});

export type CheckInput = z.infer<typeof checkSchema>;

// Audit validáció
export const auditSchema = z.object({
    siteId: z.string().min(1, 'A terület megadása kötelező'),
    participants: z.array(z.string()).min(1, 'Legalább egy auditor megadása kötelező'),
    onDate: z.string().min(1, 'A dátum megadása kötelező'),
});

export type AuditInput = z.infer<typeof auditSchema>;
