/**
 * Mock Auth Logout Route
 * POST /api/mock/auth/logout
 */

import { NextResponse } from 'next/server';
import { withRandomLatency } from '@/mocks/utils';
import { getSessionCookieName } from '@/lib/session';

export async function POST() {
    await withRandomLatency();

    const res = NextResponse.json({ ok: true, data: { success: true } });

    // Clear session cookie
    res.cookies.set(getSessionCookieName(), '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0, // Expire immediately
    });

    return res;
}
