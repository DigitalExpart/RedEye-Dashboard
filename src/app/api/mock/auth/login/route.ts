/**
 * Mock Auth Login Route
 * POST /api/mock/auth/login
 */

import { NextResponse } from 'next/server';
import type { AuthLoginRequest, AuthLoginResponse, TwoFaMethod } from '@/types/contracts';
import { withRandomLatency } from '@/mocks/utils';
import { findUserByUsername, createChallenge } from '@/mocks/store';
import { signSession, getSessionCookieName } from '@/lib/session';

export async function POST(request: Request) {
    await withRandomLatency();

    try {
        const body: AuthLoginRequest = await request.json();
        const { username, password } = body;

        // Validate input
        if (!username || !password) {
            return NextResponse.json(
                { ok: false, error: { error: 'VALIDATION_ERROR', message: 'Username and password are required' } },
                { status: 400 }
            );
        }

        // Find user and validate password
        const user = findUserByUsername(username);
        if (!user || user.password !== password) {
            return NextResponse.json(
                { ok: false, error: { error: 'UNAUTHORIZED', message: 'Invalid credentials' } },
                { status: 401 }
            );
        }

        // Check if 2FA is required
        if (user.twoFaEnabled) {
            const methods: TwoFaMethod[] = ['telegram_otp', 'totp'];
            const challenge = createChallenge(user.id, methods);

            const response: AuthLoginResponse = {
                requires2fa: true,
                challengeId: challenge.challengeId,
                methods,
            };

            return NextResponse.json({ ok: true, data: response });
        }

        // No 2FA - create session immediately
        const token = await signSession({
            sub: user.id,
            role: user.role,
            username: user.username,
        });

        const response: AuthLoginResponse = {
            requires2fa: false,
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
