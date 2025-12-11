import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'session';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const requestHeaders = new Headers(request.headers);
    
    // Set full URL for layout to parse pathname correctly
    requestHeaders.set('x-url', request.url);

    // Public routes
    const publicRoutes = ['/api', '/_next', '/favicon.ico', '/manifest.json', '/quickstart', '/login', '/invite'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    if (isPublicRoute) {
        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    }

    // Simple token check - NO DATABASE
    const token = request.cookies.get(SESSION_COOKIE_NAME);
    
    if (!token) {
        // No token = redirect to login
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Has token = allow through
    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}
