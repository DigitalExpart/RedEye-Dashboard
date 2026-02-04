export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'RedEYE Dashboard';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.example.com';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'wss://socket.example.com';

// Auth
export const ACCESS_TOKEN_COOKIE = 'accessToken';
export const REFRESH_TOKEN_COOKIE = 'refreshToken';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Real-time
export const SOCKET_RECONNECT_MAX_ATTEMPTS = 10;
export const SOCKET_RECONNECT_BASE_DELAY = 1000;
export const SOCKET_RECONNECT_MAX_DELAY = 30000;

// Cache times (in milliseconds)
export const CACHE_TIME = {
    DEVICES: 30 * 1000,      // 30 seconds
    MESSAGES: 60 * 1000,     // 1 minute
    USERS: 5 * 60 * 1000,    // 5 minutes
    PROFILE: 10 * 60 * 1000, // 10 minutes
} as const;

// Route paths
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    DASHBOARD: '/dashboard',
    DEVICE: (id: string) => `/devices/${id}`,
    ADMIN: '/admin',
    ADMIN_USERS: '/admin/users',
    ADMIN_DEVICES: '/admin/devices',
    SETTINGS: '/settings',
    SETTINGS_PROFILE: '/settings/profile',
    SETTINGS_SECURITY: '/settings/security',
    SETTINGS_API_KEYS: '/settings/api-keys',
} as const;

// Protected route patterns
export const PUBLIC_ROUTES = ['/login', '/forgot-password', '/reset-password'];
export const ADMIN_ROUTES = ['/admin'];
