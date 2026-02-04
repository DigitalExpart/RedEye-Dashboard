/**
 * Mock Admin User Detail Route
 * GET /api/mock/admin/users/[id] - Get user detail
 * DELETE /api/mock/admin/users/[id] - Delete user
 */

import { NextRequest } from 'next/server';
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
    MOCK_DEVICES,
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

export async function GET(request: NextRequest, { params }: RouteParams) {
    await simulateLatency();

    const { id } = await params;

    const auth = await requireAdmin(request);
    if ('error' in auth) {
        return auth.error;
    }

    const targetUser = findUserById(id);
    if (!targetUser) {
        return errors.notFound('User');
    }

    const deviceCount = MOCK_DEVICES.filter(d => d.assignedTo === targetUser.id).length;

    return successResponse({
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email,
        role: targetUser.role,
        twoFaEnabled: targetUser.twoFaEnabled,
        createdAt: targetUser.createdAt,
        lastLoginAt: targetUser.lastLoginAt,
        deviceCount,
    });
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
    await simulateLatency();

    const { id } = await params;

    const auth = await requireAdmin(request);
    if ('error' in auth) {
        return auth.error;
    }

    // Can't delete yourself
    if (id === auth.user.id) {
        return errors.validation('Cannot delete your own account');
    }

    const targetUser = findUserById(id);
    if (!targetUser) {
        return errors.notFound('User');
    }

    // Remove from mock store
    const index = MOCK_USERS.findIndex(u => u.id === id);
    if (index !== -1) {
        MOCK_USERS.splice(index, 1);
    }

    // Unassign their devices
    MOCK_DEVICES.forEach(device => {
        if (device.assignedTo === id) {
            device.assignedTo = undefined;
        }
    });

    return successResponse({ success: true }, 200);
}
