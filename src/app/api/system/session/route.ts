import { NextResponse } from 'next/server';
import { getCurrentUser, SESSION_COOKIE_NAME } from '@/lib/auth';
import { cookies } from 'next/headers';

// Force Node.js runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            const cookieStore = await cookies();
            cookieStore.delete(SESSION_COOKIE_NAME);
            return NextResponse.json({ user: null }, { status: 401 });
        }
        return NextResponse.json({ user });
    } catch (error) {
        console.error('Session API error:', error);
        return NextResponse.json({ user: null }, { status: 500 });
    }
}


