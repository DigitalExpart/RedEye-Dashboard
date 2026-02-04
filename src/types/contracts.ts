/**
 * RedEYE Dashboard - TypeScript Contracts
 * Single source of truth for all types - UI and API consume these only
 */

// ============================================================================
// Primitives
// ============================================================================

export type ID = string;
export type ISODate = string;
export type Role = 'admin' | 'user';
export type DeviceStatus = 'online' | 'offline' | 'idle';
export type MessageType = 'sms' | 'notification' | 'app_message';
export type TwoFaMethod = 'telegram_otp' | 'totp';

// ============================================================================
// API Response Types
// ============================================================================

export type ApiErrorCode =
    | 'UNAUTHORIZED'
    | 'FORBIDDEN'
    | 'NOT_FOUND'
    | 'VALIDATION_ERROR'
    | 'RATE_LIMITED'
    | 'INTERNAL_ERROR'
    | 'INVALID_CREDENTIALS'
    | 'INVALID_2FA_CODE'
    | 'SESSION_EXPIRED';

export interface ApiError {
    error: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
    requestId?: string;
    retryAfterSeconds?: number;
}

export interface Paginated<T> {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface CursorPaginated<T> {
    items: T[];
    nextCursor: string | null;
    hasMore: boolean;
}

// ============================================================================
// User & Auth
// ============================================================================

export interface User {
    id: ID;
    username: string;
    email: string;
    role: Role;
    twoFaEnabled: boolean;
    createdAt: ISODate;
    lastLoginAt?: ISODate;
}

export interface SessionUser extends User {
    sessionId: ID;
    expiresAt: ISODate;
}

// Auth Requests
export interface AuthLoginRequest {
    username: string;
    password: string;
}

export interface Auth2faSendRequest {
    challengeId: ID;
    method: TwoFaMethod;
}

export interface Auth2faVerifyRequest {
    challengeId: ID;
    code: string;
    method: TwoFaMethod;
}

export interface AuthForgotPasswordRequest {
    email: string;
}

export interface AuthResetPasswordRequest {
    token: string;
    password: string;
}

// Auth Responses
export interface AuthLoginResponse {
    requires2fa: boolean;
    challengeId?: ID;
    methods?: TwoFaMethod[];
    user?: User;
}

export interface Auth2faSendResponse {
    sent: boolean;
    cooldownSeconds: number;
}

export interface Auth2faVerifyResponse {
    success: boolean;
    user: User;
}

export interface AuthMeResponse {
    user: User;
}

// ============================================================================
// Device
// ============================================================================

export interface SimInfo {
    slot: number;
    carrier: string;
    number: string;
    iccid?: string;
}

export interface Device {
    id: ID;
    name: string;
    model?: string;
    manufacturer?: string;
    androidVersion?: string;
    appVersion?: string;
    status: DeviceStatus;
    battery: number;
    network?: 'wifi' | 'mobile' | 'none';
    lastSeen: ISODate;
    assignedTo?: ID;
    sims?: SimInfo[];
    tags?: string[];
    createdAt: ISODate;
}

export interface DeviceListResponse extends Paginated<Device> { }

export interface DeviceDetailResponse {
    device: Device;
}

// ============================================================================
// Messages
// ============================================================================

export interface Message {
    id: ID;
    deviceId: ID;
    type: MessageType;
    sender: string;
    body: string;
    timestamp: ISODate;
    simSlot?: number;
    appPackage?: string;
    read: boolean;
}

export interface MessageListResponse extends CursorPaginated<Message> { }

// ============================================================================
// Admin
// ============================================================================

export interface AdminUser extends User {
    deviceCount: number;
}

export interface AdminUserListResponse extends Paginated<AdminUser> { }

export interface UpdateRoleRequest {
    role: Role;
}

export interface UpdateRoleResponse {
    user: User;
}

export interface AssignDeviceRequest {
    deviceId: ID;
    userId: ID;
}

export interface AssignDeviceResponse {
    device: Device;
}

export interface CreateUserRequest {
    username: string;
    email: string;
    password: string;
    role: Role;
}

// ============================================================================
// Socket Events
// ============================================================================

export interface SocketDeviceStatusEvent {
    deviceId: ID;
    status: DeviceStatus;
    battery: number;
    network?: 'wifi' | 'mobile' | 'none';
    lastSeen: ISODate;
}

export interface SocketNewMessageEvent {
    deviceId: ID;
    message: Message;
}

export interface SocketConnectionEvent {
    userId: ID;
    connectedAt: ISODate;
}

// ============================================================================
// API Endpoints
// ============================================================================

export const API_ENDPOINTS = {
    // Auth
    AUTH_LOGIN: '/auth/login',
    AUTH_LOGOUT: '/auth/logout',
    AUTH_ME: '/auth/me',
    AUTH_2FA_SEND: '/auth/2fa/telegram/send',
    AUTH_2FA_VERIFY: '/auth/2fa/verify',
    AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
    AUTH_RESET_PASSWORD: '/auth/reset-password',
    AUTH_REFRESH: '/auth/refresh',

    // Devices
    DEVICES: '/devices',
    DEVICE_DETAIL: (id: string) => `/devices/${id}`,
    DEVICE_MESSAGES: (id: string) => `/devices/${id}/messages`,

    // Admin
    ADMIN_USERS: '/admin/users',
    ADMIN_USER_DETAIL: (id: string) => `/admin/users/${id}`,
    ADMIN_USER_ROLE: (id: string) => `/admin/users/${id}/role`,
    ADMIN_ASSIGN_DEVICE: '/admin/devices/assign',
} as const;
