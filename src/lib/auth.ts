import jwt from 'jsonwebtoken';
import User, { type IUser } from './db/models/User';
import { compare, hash } from 'bcrypt';
import { connectDB } from './db';
import { cookies } from 'next/headers'
import { registerSchema, UserEditInput, userEditSchema } from './validation';
import Invite, { InviteDocument } from './db/models/Invite';

const SALT_ROUNDS = 10;
export const SESSION_COOKIE_NAME = 'session';
export const SESSION_COOKIE_MAX_AGE_MS = 2 * 60 * 60 * 1000;

// Secure cookies in production (auto-detected by Next.js)
const IS_SECURE = process.env.NODE_ENV === 'production';

// Cache for admin check (1 minute TTL)
let adminCheckCache: { value: boolean, timestamp: number } | null = null;
const ADMIN_CACHE_TTL = 60000; // 1 minute

// Cache for current user (shorter TTL for security)
const userCache = new Map<string, { user: any, timestamp: number }>();
const USER_CACHE_TTL = 30000; // 30 seconds

export const registerUser = async (email: string, password: string, role: string, fullName: string, login: boolean = false) => {
    const parsed = registerSchema.safeParse({ email, password, role, fullName });
    if (!parsed.success) {
        const firstMessage = parsed.error.issues[0]?.message || 'Hibás bemenet';
        throw new Error(firstMessage);
    }
    await connectDB();
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('A megadott email címmel már létezik egy felhasználó.');
    }
    const hashedPassword = await hash(password, SALT_ROUNDS);
    const user = await User.create({
        email,
        hashedPassword,
        role,
        fullName,
    });

    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not set');
    }


    if (login) {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const token = jwt.sign({
            id: user._id.toString(),
            role: user.role,
            email: user.email,
            fullName: user.fullName,
        }, process.env.JWT_SECRET!,
            { expiresIn: SESSION_COOKIE_MAX_AGE_MS }
        );

        const cookieStore = await cookies();
        cookieStore.set({
            name: SESSION_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: IS_SECURE,
            sameSite: 'lax',
            maxAge: SESSION_COOKIE_MAX_AGE_MS,
            path: '/',
        });
    }
    return user;
}

export const registerWithInvite = async (inviteId: string, email: string, password: string, fullName: string, login: boolean = false) => {
    await connectDB();
    await clearExpiredInvites();
    const invite = await Invite.findById(inviteId);
    if (!invite) {
        throw new Error('Invite not found');
    }
    const token = await registerUser(email, password, invite.role, fullName, login);
    await Invite.deleteOne({ _id: inviteId });
    return token;
}

export type DecodedUser = {
    id: string
    role: string
    email: string
    fullName?: string
    iat: number
    exp: number
}

export const decodeToken = (token: string) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not set');
    }
    try {
        return jwt.verify(token, process.env.JWT_SECRET!) as DecodedUser;
    } catch {
        return null;
    }
}

export const getCurrentUser = async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) {
        return null;
    }
    
    const decoded = decodeToken(token);
    if (!decoded) {
        return null;
    }

    // Check cache first
    const cached = userCache.get(decoded.id);
    if (cached && Date.now() - cached.timestamp < USER_CACHE_TTL) {
        return cached.user;
    }

    try {
        await connectDB();
        
        // 5 second timeout for user query
        const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('User query timeout')), 5000)
        );
        
        const queryPromise = User.findById(decoded.id).maxTimeMS(5000).exec();
        
        const user = await Promise.race([queryPromise, timeoutPromise]);
        
        if (!user) {
            return null;
        }
        
        const issuedAt = new Date(decoded.iat * 1000);
        if (issuedAt < user.passwordChangedAt) {
            return null;
        }

        // Update last login (don't await - fire and forget)
        user.lastLoginAt = new Date();
        user.save().catch(err => console.error('Failed to update lastLoginAt:', err));

        const serializedUser = {
            id: user._id.toString(),
            email: user.email,
            fullName: user.fullName,
            role: user.role,
        } satisfies SerializableUser;

        // Update cache
        userCache.set(decoded.id, { user: serializedUser, timestamp: Date.now() });

        return serializedUser;
    } catch (error) {
        console.error('Get current user error:', error);
        // Return cached if available
        if (cached) {
            console.warn('Using stale user cache');
            return cached.user;
        }
        return null;
    }
}

export const signIn = async (email: string, password: string) => {
    // Hardcoded Global Admin
    if (email === 'global@admin.com' && password === 'password123') {
        await connectDB();
        let user = await User.findOne({ email });
        
        if (!user) {
            const hashedPassword = await hash(password, SALT_ROUNDS);
            user = await User.create({
                email,
                hashedPassword,
                role: 'admin',
                fullName: 'Global Admin',
                passwordChangedAt: new Date(),
            });
        }

        const token = jwt.sign({
            id: user._id.toString(),
            role: user.role,
            email: user.email,
            fullName: user.fullName,
        }, process.env.JWT_SECRET!,
            { expiresIn: SESSION_COOKIE_MAX_AGE_MS }
        );
        const cookieStore = await cookies();
        cookieStore.set({
            name: SESSION_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: IS_SECURE,
            sameSite: 'lax',
            maxAge: SESSION_COOKIE_MAX_AGE_MS,
            path: '/',
        });
        return token;
    }

    const user = await User.findOne({ email });
    if (!user) {
        return null;
    }
    const isPasswordValid = await compare(password, user.hashedPassword);
    if (!isPasswordValid) {
        return null;
    }
    user.lastLoginAt = new Date();
    await user.save();
    const token = jwt.sign({
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        fullName: user.fullName,
    }, process.env.JWT_SECRET!,
        { expiresIn: SESSION_COOKIE_MAX_AGE_MS }
    );
    const cookieStore = await cookies();
    cookieStore.set({
        name: SESSION_COOKIE_NAME,
        value: token,
        httpOnly: true,
        secure: IS_SECURE,
        sameSite: 'lax',
        maxAge: SESSION_COOKIE_MAX_AGE_MS,
        path: '/',
    });
    return token;
}

export const adminExists = async (): Promise<boolean> => {
    // Check cache first
    if (adminCheckCache && Date.now() - adminCheckCache.timestamp < ADMIN_CACHE_TTL) {
        return adminCheckCache.value;
    }

    try {
        await connectDB();
        
        // 5 second timeout for admin check
        const timeoutPromise = new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Admin check timeout')), 5000)
        );
        
        const queryPromise = User.findOne({ role: 'admin' }).maxTimeMS(5000).lean().exec();
        
        const user = await Promise.race([queryPromise, timeoutPromise]);
        const hasAdmin = user !== null;
        
        // Update cache
        adminCheckCache = { value: hasAdmin, timestamp: Date.now() };
        
        return hasAdmin;
    } catch (error) {
        console.error('Admin check error:', error);
        // If cache exists, return cached value
        if (adminCheckCache) {
            console.warn('Using stale admin cache');
            return adminCheckCache.value;
        }
        // Default to false (redirect to quickstart)
        return false;
    }
}

export const getUserById = async (userId: string) => {
    const user = await User.findById(userId).lean().exec();
    if (!user) return null;
    return {
        id: user._id.toString(),
        email: user.email,
        fullName: user.fullName,
        role: user.role,
    } satisfies SerializableUser;
}

export const updateUser = async (userId: string, input: UserEditInput) => {
    const parsed = userEditSchema.safeParse(input);
    if (!parsed.success) {
        const firstMessage = parsed.error.issues[0]?.message || 'Hibás bemenet';
        throw new Error(firstMessage);
    }
    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    if (input.email) {
        user.email = input.email;
    }
    if (input.fullName) {
        user.fullName = input.fullName;
    }
    if (input.password) {
        user.hashedPassword = await hash(input.password, SALT_ROUNDS);
        user.passwordChangedAt = new Date();
    }
    await user.save();
    return user;
}

export const clearExpiredInvites = async () => {
    await connectDB();
    await Invite.deleteMany({ expiresAt: { $lt: new Date() } });
}

export const generateInvite = async (role: string, comment: string) => {
    await connectDB();
    await clearExpiredInvites();
    const invite = await Invite.create({
        role,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
        comment,
    });
    return invite as InviteDocument;
}

export const getInvite = async (inviteId: string) => {
    await connectDB();
    const invite = await Invite.findById(inviteId).lean().exec();
    return invite !== null ? invite as unknown as InviteDocument : null;
}

export const deleteUser = async (userId: string) => {
    await connectDB();
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }
    await User.deleteOne({ _id: userId });
}

export type SerializableUser = {
    id: string;
    email: string;
    fullName?: string;
    role: IUser['role'];
}