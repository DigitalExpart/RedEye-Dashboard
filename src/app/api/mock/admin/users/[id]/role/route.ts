/**
 * Mock Admin Update User Role Route
 * POST /api/mock/admin/users/[id]/role
 */

import { NextRequest } from 'next/server';
import type { UpdateRoleRequest, UpdateRoleResponse } from '@/types/contracts';
import {
    simulateLatency,
    successResponse,
    errors,
    getSessionFromRequest,
} from '@/mocks/handlers';
import {
    validateSession,
    findUserById,
    MOCK_USERS,
} from '@/mocks/data';

interface RouteParams {
    params: Promise<{ id: string }>;
}

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

export async function POST(request: NextRequest, { params }: RouteParams) {
    await simulateLatency();

    const { id } = await params;

    const auth = await requireAdmin(request);
    if ('error' in auth) {
        return auth.error;
    }

    try {
        const body: UpdateRoleRequest = await request.json();
        const { role } = body;

        // Validate role
        if (!role || !['admin', 'user'].includes(role)) {
            return errors.validation('Role must be "admin" or "user"');
        }

        // Can't change your own role
        if (id === auth.user.id) {
            return errors.validation('Cannot change your own role');
        }

        // Find target user
        const targetUser = MOCK_USERS.find(u => u.id === id);
        if (!targetUser) {
            return errors.notFound('User');
        }

        // Update role
        targetUser.role = role;

        const response: UpdateRoleResponse = {
            user: {
                id: targetUser.id,
                username: targetUser.username,
                email: targetUser.email,
                role: targetUser.role,
                twoFaEnabled: targetUser.twoFaEnabled,
                createdAt: targetUser.createdAt,
                lastLoginAt: targetUser.lastLoginAt,
            },
        };

        return successResponse(response);
    } catch {
        return errors.validation('Invalid request body');
    }
}
