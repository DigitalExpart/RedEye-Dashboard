/**
 * Mock Devices List Route
 * GET /api/mock/devices
 */

import { NextRequest, NextResponse } from 'next/server';
import { withRandomLatency } from '@/mocks/utils';
import { getDevicesForUser } from '@/mocks/store';
import { getSessionToken, verifySession } from '@/lib/session';
import type { Paginated, Device, DeviceStatus } from '@/types/contracts';

export async function GET(request: NextRequest) {
    await withRandomLatency();

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

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const query = searchParams.get('query')?.toLowerCase();
    const status = searchParams.get('status') as DeviceStatus | null;

    // Get devices (role-aware)
    let devices = getDevicesForUser(session.sub, session.role);

    // Apply filters
    if (query) {
        devices = devices.filter(d =>
            d.name.toLowerCase().includes(query) ||
            d.model?.toLowerCase().includes(query) ||
            d.manufacturer?.toLowerCase().includes(query) ||
            d.id.toLowerCase().includes(query)
        );
    }

    if (status) {
        devices = devices.filter(d => d.status === status);
    }

    // Paginate
    const total = devices.length;
    const startIndex = (page - 1) * pageSize;
    const items = devices.slice(startIndex, startIndex + pageSize);

    const response: Paginated<Device> = {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
    };

    return NextResponse.json({ ok: true, data: response });
}
