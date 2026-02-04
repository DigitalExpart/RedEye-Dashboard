/**
 * Mock Device Messages Route
 * GET /api/mock/devices/[id]/messages
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRandomLatency } from '@/mocks/utils';
import { findDeviceById, getMessagesForDevice } from '@/mocks/store';
import { getSessionToken, verifySession } from '@/lib/session';
import type { CursorPaginated, Message } from '@/types/contracts';

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
    await withRandomLatency();

    const { id: deviceId } = await params;

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
    const device = findDeviceById(deviceId);
    if (!device) {
        return NextResponse.json(
            { ok: false, error: { error: 'NOT_FOUND', message: 'Device not found' } },
            { status: 404 }
        );
    }

    // Check access
    if (session.role !== 'admin' && device.assignedTo !== session.sub) {
        return NextResponse.json(
            { ok: false, error: { error: 'FORBIDDEN', message: 'You do not have access to this device' } },
            { status: 403 }
        );
    }

    // Parse cursor pagination
    const searchParams = request.nextUrl.searchParams;
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));

    // Get messages
    const { items, nextCursor, hasMore } = getMessagesForDevice(deviceId, cursor, limit);

    const response: CursorPaginated<Message> = {
        items,
        nextCursor,
        hasMore,
    };

    return NextResponse.json({ ok: true, data: response });
}
