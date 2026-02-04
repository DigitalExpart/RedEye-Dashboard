/**
 * Centralized API Endpoints Configuration
 * Supports swapping between mock and real backend
 */

// Determine base URL based on environment
const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';

export const API_BASE_URL = USE_MOCKS
    ? '/api/mock'
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.example.com');

export const SOCKET_URL = USE_MOCKS
    ? 'http://localhost:4001'
    : (process.env.NEXT_PUBLIC_SOCKET_URL || 'wss://socket.example.com');

// Auth endpoints
export const AUTH_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/auth/login`,
    LOGOUT: `${API_BASE_URL}/auth/logout`,
    ME: `${API_BASE_URL}/auth/me`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
    FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
    TWO_FA_SEND: `${API_BASE_URL}/auth/2fa/telegram/send`,
    TWO_FA_VERIFY: `${API_BASE_URL}/auth/2fa/verify`,
} as const;

// Device endpoints
export const DEVICE_ENDPOINTS = {
    LIST: `${API_BASE_URL}/devices`,
    DETAIL: (id: string) => `${API_BASE_URL}/devices/${id}`,
    MESSAGES: (id: string) => `${API_BASE_URL}/devices/${id}/messages`,
} as const;

// Admin endpoints
export const ADMIN_ENDPOINTS = {
    USERS: `${API_BASE_URL}/admin/users`,
    USER_DETAIL: (id: string) => `${API_BASE_URL}/admin/users/${id}`,
    USER_ROLE: (id: string) => `${API_BASE_URL}/admin/users/${id}/role`,
    ASSIGN_DEVICE: `${API_BASE_URL}/admin/devices/assign`,
} as const;

// All endpoints combined
export const ENDPOINTS = {
    ...AUTH_ENDPOINTS,
    ...DEVICE_ENDPOINTS,
    ...ADMIN_ENDPOINTS,
} as const;

// Export for socket
export { USE_MOCKS };
