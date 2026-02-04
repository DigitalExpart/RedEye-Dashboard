/**
 * Mock API Response Handlers
 * Utilities for creating standardized mock responses
 */

import { NextResponse } from 'next/server';
import type { ApiError, ApiErrorCode, Paginated } from '@/types/contracts';

// Artificial latency range (ms)
const MIN_LATENCY = 50;
const MAX_LATENCY = 250;

/**
 * Adds artificial latency to simulate network delay
 */
export async function simulateLatency(): Promise<void> {
    const delay = Math.floor(Math.random() * (MAX_LATENCY - MIN_LATENCY)) + MIN_LATENCY;
    await new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Creates a successful JSON response
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
    return NextResponse.json(data, { status });
}

/**
 * Creates an error JSON response
 */
export function errorResponse(
    code: ApiErrorCode,
    message: string,
    status: number,
    details?: Record<string, unknown>
): NextResponse {
    const error: ApiError = {
        error: code,
        message,
        details,
        requestId: `req_${Date.now().toString(36)}`,
    };
    return NextResponse.json(error, { status });
}

/**
 * Common error responses
 */
export const errors = {
    unauthorized: (message: string = 'Authentication required') =>
        errorResponse('UNAUTHORIZED', message, 401),

    forbidden: (message: string = 'Access denied') =>
        errorResponse('FORBIDDEN', message, 403),

    notFound: (resource: string = 'Resource') =>
        errorResponse('NOT_FOUND', `${resource} not found`, 404),

    validation: (message: string, details?: Record<string, unknown>) =>
        errorResponse('VALIDATION_ERROR', message, 400, details),

    invalidCredentials: () =>
        errorResponse('INVALID_CREDENTIALS', 'Invalid username or password', 401),

    invalid2faCode: () =>
        errorResponse('INVALID_2FA_CODE', 'Invalid verification code', 401),

    sessionExpired: () =>
        errorResponse('SESSION_EXPIRED', 'Your session has expired. Please log in again.', 401),

    rateLimited: (retryAfterSeconds: number) => {
        const response = errorResponse('RATE_LIMITED', 'Too many requests', 429);
        response.headers.set('Retry-After', String(retryAfterSeconds));
        return response;
    },

    internal: (message: string = 'An unexpected error occurred') =>
        errorResponse('INTERNAL_ERROR', message, 500),
};

/**
 * Creates a paginated response
 */
export function paginatedResponse<T>(
    items: T[],
    page: number,
    pageSize: number,
    total: number
): Paginated<T> {
    return {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };
}

/**
 * Parses pagination params from URL search params
 */
export function parsePaginationParams(searchParams: URLSearchParams): {
    page: number;
    pageSize: number;
    query?: string;
} {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const query = searchParams.get('query') || undefined;

    return { page, pageSize, query };
}

/**
 * Parses cursor pagination params
 */
export function parseCursorParams(searchParams: URLSearchParams): {
    cursor?: string;
    limit: number;
} {
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    return { cursor, limit };
}

/**
 * Cookie helpers
 */
export const SESSION_COOKIE_NAME = 'redeye_session';

export function setSessionCookie(response: NextResponse, sessionId: string): NextResponse {
    response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/',
    });
    return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
    response.cookies.delete(SESSION_COOKIE_NAME);
    return response;
}

export function getSessionFromRequest(request: Request): string | undefined {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return undefined;

    const cookies = Object.fromEntries(
        cookieHeader.split(';').map(c => {
            const [key, ...val] = c.trim().split('=');
            return [key, val.join('=')];
        })
    );

    return cookies[SESSION_COOKIE_NAME];
}
