/**
 * Mock Admin Assign Device Route
 * POST /api/mock/admin/devices/assign
 */

import { NextRequest } from 'next/server';
import type { AssignDeviceRequest, AssignDeviceResponse } from '@/types/contracts';
import {
    simulateLatency,
    successResponse,
    errors,
    getSessionFromRequest,
} from '@/mocks/handlers';
import {
    validateSession,
    findUserById,
    findDeviceById,
    MOCK_DEVICES,
} from '@/mocks/data';

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

export async function POST(request: NextRequest) {
    await simulateLatency();

    const auth = await requireAdmin(request);
    if ('error' in auth) {
        return auth.error;
    }

    try {
        const body: AssignDeviceRequest = await request.json();
        const { deviceId, userId } = body;

        // Validate
        if (!deviceId) {
            return errors.validation('deviceId is required');
        }

        // Find device
        const device = findDeviceById(deviceId);
        if (!device) {
            return errors.notFound('Device');
        }

        // If userId provided, verify user exists
        if (userId) {
            const targetUser = findUserById(userId);
            if (!targetUser) {
                return errors.notFound('User');
            }
        }

        // Update assignment
        const deviceIndex = MOCK_DEVICES.findIndex(d => d.id === deviceId);
        if (deviceIndex !== -1) {
            MOCK_DEVICES[deviceIndex].assignedTo = userId || undefined;
        }

        const response: AssignDeviceResponse = {
            device: MOCK_DEVICES[deviceIndex],
        };

        return successResponse(response);
    } catch {
        return errors.validation('Invalid request body');
    }
}

export async function DELETE(request: NextRequest) {
    await simulateLatency();

    const auth = await requireAdmin(request);
    if ('error' in auth) {
        return auth.error;
    }

    const deviceId = request.nextUrl.searchParams.get('deviceId');
    if (!deviceId) {
        return errors.validation('deviceId is required');
    }

    // Find and unassign device
    const deviceIndex = MOCK_DEVICES.findIndex(d => d.id === deviceId);
    if (deviceIndex === -1) {
        return errors.notFound('Device');
    }

    MOCK_DEVICES[deviceIndex].assignedTo = undefined;

    return successResponse({
        device: MOCK_DEVICES[deviceIndex],
    });
}
