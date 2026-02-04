import { apiClient } from './client';
import { AUTH_ENDPOINTS } from './endpoints';
import type {
    User,
    AuthLoginRequest,
    AuthLoginResponse,
    Auth2faSendRequest,
    Auth2faSendResponse,
    Auth2faVerifyRequest,
    Auth2faVerifyResponse,
    AuthMeResponse,
    AuthForgotPasswordRequest,
    AuthResetPasswordRequest,
} from '@/types/contracts';

// ============================================================================
// Auth API Functions
// ============================================================================

/**
 * Login with username and password
 * Returns challengeId if 2FA is required
 */
export async function login(data: AuthLoginRequest): Promise<AuthLoginResponse> {
    return apiClient.post<AuthLoginResponse>(AUTH_ENDPOINTS.LOGIN, data);
}

/**
 * Request Telegram OTP code
 */
export async function send2faCode(data: Auth2faSendRequest): Promise<Auth2faSendResponse> {
    return apiClient.post<Auth2faSendResponse>(AUTH_ENDPOINTS.TWO_FA_SEND, data);
}

/**
 * Verify 2FA code (TOTP or Telegram OTP)
 */
export async function verify2fa(data: Auth2faVerifyRequest): Promise<Auth2faVerifyResponse> {
    return apiClient.post<Auth2faVerifyResponse>(AUTH_ENDPOINTS.TWO_FA_VERIFY, data);
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser(): Promise<User> {
    const response = await apiClient.get<AuthMeResponse>(AUTH_ENDPOINTS.ME);
    return response.user;
}

/**
 * Logout and clear session
 */
export async function logout(): Promise<void> {
    await apiClient.post(AUTH_ENDPOINTS.LOGOUT);
}

/**
 * Request password reset email
 */
export async function forgotPassword(data: AuthForgotPasswordRequest): Promise<{ success: boolean; message: string }> {
    return apiClient.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, data);
}

/**
 * Reset password with token
 */
export async function resetPassword(data: AuthResetPasswordRequest): Promise<{ success: boolean; message: string }> {
    return apiClient.post(AUTH_ENDPOINTS.RESET_PASSWORD, data);
}

/**
 * Refresh access token
 */
export async function refreshToken(): Promise<boolean> {
    try {
        await apiClient.post(AUTH_ENDPOINTS.REFRESH);
        return true;
    } catch {
        return false;
    }
}
