/**
 * Mock Admin Users Route
 * GET /api/mock/admin/users - List users
 * POST /api/mock/admin/users - Create user
 */

import { NextRequest } from 'next/server';
import type { AdminUserListResponse, CreateUserRequest, Role } from '@/types/contracts';
import {
    simulateLatency,
    successResponse,
    errors,
    paginatedResponse,
    parsePaginationParams,
    getSessionFromRequest,
} from '@/mocks/handlers';
import {
    validateSession,
    findUserById,
    getUsersAsAdmin,
    MOCK_USERS,
} from '@/mocks/data';
import { generateId, generateISODate } from '@/mocks/generators';

// Helper to check admin access
async function requireAdmin(request: NextRequest) {
    const sessionId = getSessionFromRequest(request);
    if (!sessionId) {
        return { error: errors.unauthorized() };
    }

    const session = validateSession(sessionId);
    if (!session) {
        return { error: errors.sessionExpired() };
    }

    const user = findUserById(session.userId);
    if (!user) {
        return { error: errors.internal('User not found') };
    }

    if (user.role !== 'admin') {
        return { error: errors.forbidden('Admin access required') };
    }

    return { user };
}

export async function GET(request: NextRequest) {
    await simulateLatency();

    const auth = await requireAdmin(request);
    if ('error' in auth) {
        return auth.error;
    }

    // Get pagination params
    const { page, pageSize, query } = parsePaginationParams(request.nextUrl.searchParams);
    const roleFilter = request.nextUrl.searchParams.get('role') as Role | null;

    // Get all users
    let users = getUsersAsAdmin();

    // Apply filters
    if (query) {
        const lowerQuery = query.toLowerCase();
        users = users.filter(u =>
            u.username.toLowerCase().includes(lowerQuery) ||
            u.email.toLowerCase().includes(lowerQuery)
        );
    }

    if (roleFilter) {
        users = users.filter(u => u.role === roleFilter);
    }

    // Paginate
    const total = users.length;
    const startIndex = (page - 1) * pageSize;
    const paginatedUsers = users.slice(startIndex, startIndex + pageSize);

    const response: AdminUserListResponse = paginatedResponse(
        paginatedUsers,
        page,
        pageSize,
        total
    );

    return successResponse(response);
}

export async function POST(request: NextRequest) {
    await simulateLatency();

    const auth = await requireAdmin(request);
    if ('error' in auth) {
        return auth.error;
    }

    try {
        const body: CreateUserRequest = await request.json();
        const { username, email, password, role } = body;

        // Validate
        if (!username || username.length < 3) {
            return errors.validation('Username must be at least 3 characters');
        }

        if (!email || !email.includes('@')) {
            return errors.validation('Valid email is required');
        }

        if (!password || password.length < 6) {
            return errors.validation('Password must be at least 6 characters');
        }

        // Check for duplicates
        const existingUser = MOCK_USERS.find(
            u => u.username.toLowerCase() === username.toLowerCase() ||
                u.email.toLowerCase() === email.toLowerCase()
        );
        if (existingUser) {
            return errors.validation('Username or email already exists');
        }

        // Create user (mock - just return success)
        const newUser = {
            id: generateId(),
            username,
            email,
            role: role || 'user' as Role,
            twoFaEnabled: false,
            createdAt: generateISODate(),
            password, // In reality, this would be hashed
        };

        // Add to mock store (in-memory only)
        MOCK_USERS.push(newUser);

        return successResponse({
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role,
        }, 201);
    } catch {
        return errors.validation('Invalid request body');
    }
}
