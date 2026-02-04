/**
 * Mock Auth Reset Password Route
 * POST /api/mock/auth/reset-password
 */

import { NextRequest } from 'next/server';
import type { AuthResetPasswordRequest } from '@/types/contracts';
import {
    simulateLatency,
    successResponse,
    errors,
} from '@/mocks/handlers';

export async function POST(request: NextRequest) {
    await simulateLatency();

    try {
        const body: AuthResetPasswordRequest = await request.json();
        const { token, password } = body;

        // Validate input
        if (!token) {
            return errors.validation('Reset token is required');
        }

        if (!password || password.length < 6) {
            return errors.validation('Password must be at least 6 characters');
        }

        // Mock: Accept any token that looks valid (length check)
        if (token.length < 10) {
            return errors.validation('Invalid or expired reset token');
        }

        // Mock: Always succeed
        return successResponse({
            success: true,
            message: 'Password has been reset successfully.',
        });
    } catch {
        return errors.validation('Invalid request body');
    }
}
