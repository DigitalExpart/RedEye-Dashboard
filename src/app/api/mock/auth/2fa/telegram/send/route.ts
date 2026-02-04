/**
 * Mock Auth 2FA Send Route
 * POST /api/mock/auth/2fa/telegram/send
 */

import { NextRequest } from 'next/server';
import type { Auth2faSendRequest, Auth2faSendResponse } from '@/types/contracts';
import {
    simulateLatency,
    successResponse,
    errors,
} from '@/mocks/handlers';
import { validateChallenge } from '@/mocks/data';

export async function POST(request: NextRequest) {
    await simulateLatency();

    try {
        const body: Auth2faSendRequest = await request.json();
        const { challengeId } = body;

        // Validate challenge exists
        const challenge = validateChallenge(challengeId);
        if (!challenge) {
            return errors.validation('Invalid or expired challenge');
        }

        // Mock: Always succeed in sending
        const response: Auth2faSendResponse = {
            sent: true,
            cooldownSeconds: 60,
        };

        return successResponse(response);
    } catch {
        return errors.validation('Invalid request body');
    }
}
