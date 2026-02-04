/**
 * Mock Auth 2FA Verify Route
 * POST /api/mock/auth/2fa/verify
 */

import { NextResponse } from 'next/server';
import type { Auth2faVerifyRequest, Auth2faVerifyResponse } from '@/types/contracts';
import { withRandomLatency } from '@/mocks/utils';
import { validateChallenge, consumeChallenge, findUserById } from '@/mocks/store';
import { signSession, getSessionCookieName } from '@/lib/session';

// Valid test codes (for mock mode)
const VALID_CODES = ['123456', '000000'];

export async function POST(request: Request) {
    await withRandomLatency();

    try {
        const body: Auth2faVerifyRequest = await request.json();
        const { challengeId, code } = body;

        // Validate challenge
        const challenge = validateChallenge(challengeId);
        if (!challenge) {
            return NextResponse.json(
                { ok: false, error: { error: 'VALIDATION_ERROR', message: 'Invalid or expired challenge' } },
                { status: 400 }
            );
        }

        // Validate code
        if (!VALID_CODES.includes(code)) {
            return NextResponse.json(
                { ok: false, error: { error: 'INVALID_2FA_CODE', message: 'Invalid verification code' } },
                { status: 401 }
            );
        }

        // Get user
        const user = findUserById(challenge.userId);
        if (!user) {
            return NextResponse.json(
                { ok: false, error: { error: 'INTERNAL_ERROR', message: 'User not found' } },
                { status: 500 }
            );
        }

        // Consume challenge (one-time use)
        consumeChallenge(challengeId);

        // Create signed session
        const token = await signSession({
            sub: user.id,
            role: user.role,
            username: user.username,
        });

        const response: Auth2faVerifyResponse = {
            success: true,
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

        const res = NextResponse.json({ ok: true, data: response });
        res.cookies.set(getSessionCookieName(), token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return res;
    } catch {
        return NextResponse.json(
            { ok: false, error: { error: 'VALIDATION_ERROR', message: 'Invalid request body' } },
            { status: 400 }
        );
    }
}
