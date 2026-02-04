/**
 * Mock Device Detail Route
 * GET /api/mock/devices/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRandomLatency } from '@/mocks/utils';
import { findDeviceById } from '@/mocks/store';
import { getSessionToken, verifySession } from '@/lib/session';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    await withRandomLatency();

    const { id } = await params;

    // Authenticate
    const token = getSessionToken(request);
    if (!token) {
        return NextResponse.json(
            { ok: false, error: { error: 'UNAUTHORIZED', message: 'Authentication required' } },
            { status: 401 }
        );
    }

    const session = await verifySession(token);
    if (!session) {
        return NextResponse.json(
            { ok: false, error: { error: 'SESSION_EXPIRED', message: 'Session expired' } },
            { status: 401 }
        );
    }

    // Find device
    const device = findDeviceById(id);
    if (!device) {
        return NextResponse.json(
            { ok: false, error: { error: 'NOT_FOUND', message: 'Device not found' } },
            { status: 404 }
        );
    }

    // Check access (admin sees all, user only their assigned devices)
    if (session.role !== 'admin' && device.assignedTo !== session.sub) {
        return NextResponse.json(
            { ok: false, error: { error: 'FORBIDDEN', message: 'You do not have access to this device' } },
            { status: 403 }
        );
    }

    return NextResponse.json({ ok: true, data: { device } });
}
