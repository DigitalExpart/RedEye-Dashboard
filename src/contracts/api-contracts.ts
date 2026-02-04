// ============================================================================
// RedEYE Dashboard - API Contracts
// ============================================================================
// This file centralizes all API contracts for easy updates when backend changes.
// All types marked with [ASSUMPTION] can be adjusted based on actual backend.
// ============================================================================

// ============================================================================
// Common Types
// ============================================================================

export type Role = 'admin' | 'user';

export interface ApiError {
    error: string;
    message: string;
    retryAfterSeconds?: number;
}

export interface PaginatedResponse<T> {
    items: T[];
    page: number;
    pageSize: number;
    total: number;
}

export interface CursorPaginatedResponse<T> {
    items: T[];
    nextCursor: string | null;
}

// ============================================================================
// Auth Types
// ============================================================================

export interface User {
    id: string;
    username: string;
    email: string;
    role: Role;
    twoFaEnabled: boolean;
}

export type TwoFactorMethod = 'telegram_otp' | 'totp';

// Login
export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    requires2fa: boolean;
    challengeId?: string;
    methods?: TwoFactorMethod[];
    user?: User;
}

// 2FA
export interface TriggerTelegramOtpRequest {
    challengeId: string;
}

export interface TriggerTelegramOtpResponse {
    sent: boolean;
    cooldownSeconds: number;
}

export interface Verify2faRequest {
    challengeId: string;
    method: TwoFactorMethod;
    code: string;
}

export interface Verify2faResponse {
    ok: boolean;
    user: User;
}

// TOTP Setup
export interface TotpSetupResponse {
    secret: string;
    qrCodeUrl: string;
}

export interface TotpConfirmRequest {
    code: string;
}

export interface TotpConfirmResponse {
    enabled: boolean;
}

// Password Reset
export interface ForgotPasswordRequest {
    email: string;
}

export interface ResetPasswordRequest {
    token: string;
    newPassword: string;
}

export interface PasswordResetResponse {
    ok: boolean;
}

// Session
export interface GetMeResponse {
    user: User;
}

// ============================================================================
// Device Types
// ============================================================================

export type DeviceStatus = 'online' | 'offline' | 'idle';
export type NetworkType = 'wifi' | 'cell';

export interface SimCard {
    slot: number;
    carrier: string;
    number: string;
    iccid: string;
    imsi: string;
}

export interface Device {
    id: string;
    name: string;
    status: DeviceStatus;
    battery: number;
    lastSeen: string;
    model?: string;
    androidVersion?: string;
    appVersion?: string;
    network?: NetworkType;
    signal?: number;
    sims?: SimCard[];
    tags?: string[];
}

export interface DeviceListResponse extends PaginatedResponse<Device> { }

export interface DeviceDetailResponse {
    device: Device;
}

// ============================================================================
// Message Types
// ============================================================================

export type MessageType = 'sms' | 'notification' | 'app_message';

export interface Message {
    id: string;
    type: MessageType;
    sender: string;
    body: string;
    timestamp: string;
    simSlot?: number;
    app?: string;
    read?: boolean;
}

export interface MessageListResponse extends CursorPaginatedResponse<Message> { }

// ============================================================================
// Admin Types
// ============================================================================

export interface AdminUser extends User {
    createdAt: string;
    lastLogin?: string;
    deviceCount: number;
}

export interface AdminUserListResponse extends PaginatedResponse<AdminUser> { }

export interface AssignDeviceRequest {
    deviceId: string;
    userId: string;
}

export interface AssignDeviceResponse {
    ok: boolean;
}

export interface UpdateRoleRequest {
    role: Role;
}

export interface UpdateRoleResponse {
    ok: boolean;
}

// ============================================================================
// Socket Event Types
// ============================================================================

export interface DeviceStatusEvent {
    deviceId: string;
    status: DeviceStatus;
    battery: number;
    lastSeen: string;
    network: NetworkType;
    signal: number;
}

export interface DeviceSmsEvent {
    deviceId: string;
    smsId: string;
    sender: string;
    body: string;
    timestamp: string;
    simSlot: number;
}

export interface DeviceInfoUpdateEvent {
    deviceId: string;
    name?: string;
    model?: string;
    androidVersion?: string;
    appVersion?: string;
    tags?: string[];
}

export interface DeviceSimUpdateEvent {
    deviceId: string;
    sims: SimCard[];
}

export type SocketEventMap = {
    'device.status': DeviceStatusEvent;
    'device.sms.new': DeviceSmsEvent;
    'device.info.update': DeviceInfoUpdateEvent;
    'device.sim.update': DeviceSimUpdateEvent;
};

// ============================================================================
// API Endpoints
// ============================================================================

export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',

    // 2FA
    TRIGGER_TELEGRAM_OTP: '/auth/2fa/telegram/send',
    VERIFY_2FA: '/auth/2fa/verify',
    TOTP_SETUP: '/auth/2fa/totp/setup',
    TOTP_CONFIRM: '/auth/2fa/totp/confirm',

    // Password Reset
    FORGOT_PASSWORD: '/auth/password/forgot',
    RESET_PASSWORD: '/auth/password/reset',

    // Devices
    DEVICES: '/devices',
    DEVICE_DETAIL: (id: string) => `/devices/${id}`,
    DEVICE_MESSAGES: (id: string) => `/devices/${id}/messages`,

    // Admin
    ADMIN_USERS: '/admin/users',
    ADMIN_USER_ROLE: (id: string) => `/admin/users/${id}/role`,
    ADMIN_ASSIGN_DEVICE: '/admin/devices/assign',
} as const;
