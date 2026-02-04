/**
 * Mock Auth Me Route
 * GET /api/mock/auth/me
 */

import { NextResponse } from 'next/server';
import type { AuthMeResponse } from '@/types/contracts';
import { withRandomLatency } from '@/mocks/utils';
import { findUserById } from '@/mocks/store';
import { getSessionToken, verifySession } from '@/lib/session';

export async function GET(request: Request) {
    await withRandomLatency();

    // Get session from cookie
    const token = getSessionToken(request);
    if (!token) {
        return NextResponse.json(
            { ok: false, error: { error: 'UNAUTHORIZED', message: 'Authentication required' } },
            { status: 401 }
        );
    }

    // Verify session
    const session = await verifySession(token);
    if (!session) {
        return NextResponse.json(
            { ok: false, error: { error: 'SESSION_EXPIRED', message: 'Session expired. Please log in again.' } },
            { status: 401 }
        );
    }

    // Get user
    const user = findUserById(session.sub);
    if (!user) {
        return NextResponse.json(
            { ok: false, error: { error: 'INTERNAL_ERROR', message: 'User not found' } },
            { status: 500 }
        );
    }

    const response: AuthMeResponse = {
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            twoFaEnabled: user.twoFaEnabled,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
        },
    };

    return NextResponse.json({ ok: true, data: response });
}
