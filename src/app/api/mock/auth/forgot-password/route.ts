/**
 * Mock Auth Forgot Password Route
 * POST /api/mock/auth/forgot-password
 */

import { NextRequest } from 'next/server';
import type { AuthForgotPasswordRequest } from '@/types/contracts';
import {
    simulateLatency,
    successResponse,
    errors,
} from '@/mocks/handlers';

export async function POST(request: NextRequest) {
    await simulateLatency();

    try {
        const body: AuthForgotPasswordRequest = await request.json();
        const { email } = body;

        // Validate email format
        if (!email || !email.includes('@')) {
            return errors.validation('Valid email is required');
        }

        // Mock: Always succeed (don't reveal if email exists)
        return successResponse({
            success: true,
            message: 'If an account exists with this email, you will receive a password reset link.',
        });
    } catch {
        return errors.validation('Invalid request body');
    }
}
