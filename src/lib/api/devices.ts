import { apiClient } from './client';
import { DEVICE_ENDPOINTS } from './endpoints';
import type {
    Device,
    DeviceListResponse,
    DeviceDetailResponse,
    MessageListResponse,
    DeviceStatus,
} from '@/types/contracts';

// ============================================================================
// Device API Functions
// ============================================================================

export interface DeviceListParams {
    page?: number;
    pageSize?: number;
    query?: string;
    status?: DeviceStatus;
}

/**
 * Get paginated list of devices
 */
export async function getDevices(params?: DeviceListParams): Promise<DeviceListResponse> {
    return apiClient.get<DeviceListResponse>(DEVICE_ENDPOINTS.LIST, {
        params: params as Record<string, string | number | boolean | undefined>,
    });
}

/**
 * Get device by ID with full details
 */
export async function getDevice(id: string): Promise<Device> {
    const response = await apiClient.get<DeviceDetailResponse>(
        DEVICE_ENDPOINTS.DETAIL(id)
    );
    return response.device;
}

export interface MessageListParams {
    cursor?: string;
    limit?: number;
    type?: 'sms' | 'notification' | 'app_message';
    after?: string; // ISO timestamp for fetching messages after reconnect
}

/**
 * Get paginated messages for a device
 */
export async function getDeviceMessages(
    deviceId: string,
    params?: MessageListParams
): Promise<MessageListResponse> {
    return apiClient.get<MessageListResponse>(
        DEVICE_ENDPOINTS.MESSAGES(deviceId),
        { params: params as Record<string, string | number | boolean | undefined> }
    );
}

/**
 * Update device name/tags
 */
export async function updateDevice(
    id: string,
    data: { name?: string; tags?: string[] }
): Promise<Device> {
    const response = await apiClient.patch<DeviceDetailResponse>(
        DEVICE_ENDPOINTS.DETAIL(id),
        data
    );
    return response.device;
}
