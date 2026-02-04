import { apiClient } from './client';
import { ADMIN_ENDPOINTS } from './endpoints';
import type {
    AdminUserListResponse,
    AssignDeviceRequest,
    AssignDeviceResponse,
    UpdateRoleRequest,
    UpdateRoleResponse,
    Role,
    User,
} from '@/types/contracts';

// ============================================================================
// Admin API Functions
// ============================================================================

export interface UserListParams {
    page?: number;
    pageSize?: number;
    query?: string;
    role?: Role;
}

/**
 * Get paginated list of users (admin only)
 */
export async function getUsers(params?: UserListParams): Promise<AdminUserListResponse> {
    return apiClient.get<AdminUserListResponse>(ADMIN_ENDPOINTS.USERS, {
        params: params as Record<string, string | number | boolean | undefined>,
    });
}

/**
 * Create new user (admin only)
 */
export async function createUser(data: {
    username: string;
    email: string;
    password: string;
    role: Role;
}): Promise<{ id: string; username: string; email: string; role: Role }> {
    return apiClient.post(ADMIN_ENDPOINTS.USERS, data);
}

/**
 * Get user detail (admin only)
 */
export async function getUser(userId: string): Promise<User> {
    return apiClient.get<User>(ADMIN_ENDPOINTS.USER_DETAIL(userId));
}

/**
 * Delete user (admin only)
 */
export async function deleteUser(userId: string): Promise<void> {
    return apiClient.delete(ADMIN_ENDPOINTS.USER_DETAIL(userId));
}

/**
 * Update user role (admin only)
 */
export async function updateUserRole(
    userId: string,
    data: UpdateRoleRequest
): Promise<UpdateRoleResponse> {
    return apiClient.post<UpdateRoleResponse>(ADMIN_ENDPOINTS.USER_ROLE(userId), data);
}

/**
 * Assign device to user (admin only)
 */
export async function assignDevice(
    data: AssignDeviceRequest
): Promise<AssignDeviceResponse> {
    return apiClient.post<AssignDeviceResponse>(ADMIN_ENDPOINTS.ASSIGN_DEVICE, data);
}

/**
 * Unassign device from user (admin only)
 */
export async function unassignDevice(deviceId: string): Promise<AssignDeviceResponse> {
    return apiClient.delete<AssignDeviceResponse>(
        `${ADMIN_ENDPOINTS.ASSIGN_DEVICE}?deviceId=${deviceId}`
    );
}
