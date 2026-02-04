/**
 * Middleware - Route Protection
 * Protects dashboard, devices, settings, and admin routes
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookieName, verifySession } from '@/lib/session';

const PROTECTED_PREFIXES = ['/dashboard', '/devices', '/settings', '/admin'];
const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password', '/'];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check if this is a protected route
    const isProtected = PROTECTED_PREFIXES.some(prefix => pathname.startsWith(prefix));
    const isPublic = PUBLIC_ROUTES.includes(pathname) || pathname.startsWith('/api/');

    if (!isProtected) {
        return NextResponse.next();
    }

    // Get session token from cookie
    const token = request.cookies.get(getSessionCookieName())?.value;
    const session = token ? await verifySession(token) : null;

    // Redirect to login if not authenticated
    if (!session) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
    }

    // Check admin access for /admin routes
    if (pathname.startsWith('/admin') && session.role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        return NextResponse.redirect(url);
    }

    // Add user info to request headers for server components
    const response = NextResponse.next();
    response.headers.set('x-user-id', session.sub);
    response.headers.set('x-user-role', session.role);
    response.headers.set('x-user-name', session.username);

    return response;
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/devices/:path*',
        '/settings/:path*',
        '/admin/:path*',
    ],
};
