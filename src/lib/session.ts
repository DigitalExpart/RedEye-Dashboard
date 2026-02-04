/**
 * Session Management
 * Signed JWT tokens for httpOnly session cookies
 */

import { SignJWT, jwtVerify } from 'jose';
import type { Role } from '@/types/contracts';
import { config } from './config';

const COOKIE_NAME = 'redeye_session';
const secret = new TextEncoder().encode(config.mock.sessionSecret);

export interface SessionClaims {
    sub: string;      // userId
    role: Role;
    username: string;
    [key: string]: unknown; // Index signature for JWTPayload compatibility
}

export function getSessionCookieName(): string {
    return COOKIE_NAME;
}

/**
 * Create a signed JWT session token
 */
export async function signSession(claims: SessionClaims): Promise<string> {
    const jwt = await new SignJWT(claims)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);

    return jwt;
}

/**
 * Verify and decode a session token
 */
export async function verifySession(token: string): Promise<SessionClaims | null> {
    try {
        const { payload } = await jwtVerify(token, secret);
        return {
            sub: payload.sub as string,
            role: payload.role as Role,
            username: payload.username as string,
        };
    } catch {
        return null;
    }
}

/**
 * Get session from request cookies
 */
export function getSessionToken(request: Request): string | undefined {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return undefined;

    const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
            const [key, ...val] = c.trim().split('=');
            return [key, val.join('=')];
        })
    );

    return cookies[COOKIE_NAME];
}
