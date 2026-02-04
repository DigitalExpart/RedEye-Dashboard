/**
 * API Client
 * Typed fetch wrapper with automatic token refresh and error handling
 * Supports both mock and real backend endpoints
 */

import type { ApiError } from '@/types/contracts';

// ============================================================================
// Types
// ============================================================================

export interface RequestConfig extends Omit<RequestInit, 'body'> {
    body?: unknown;
    params?: Record<string, string | number | boolean | undefined>;
}

export class ApiClientError extends Error {
    constructor(
        public status: number,
        public code: string,
        message: string,
        public retryAfterSeconds?: number
    ) {
        super(message);
        this.name = 'ApiClientError';
    }

    static isRateLimited(error: unknown): error is ApiClientError {
        return error instanceof ApiClientError && error.status === 429;
    }

    static isUnauthorized(error: unknown): error is ApiClientError {
        return error instanceof ApiClientError && error.status === 401;
    }

    static isForbidden(error: unknown): error is ApiClientError {
        return error instanceof ApiClientError && error.status === 403;
    }

    static isNotFound(error: unknown): error is ApiClientError {
        return error instanceof ApiClientError && error.status === 404;
    }
}

// ============================================================================
// API Client
// ============================================================================

/**
 * Creates a URL with query parameters
 * Handles both relative (mock) and absolute (real) URLs
 */
function buildUrl(endpoint: string, params?: RequestConfig['params']): string {
    // For relative URLs (mock mode), use current origin
    const baseUrl = endpoint.startsWith('/')
        ? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000')
        : '';

    const url = new URL(endpoint, baseUrl || undefined);

    if (params) {
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined) {
                url.searchParams.append(key, String(value));
            }
        });
    }

    return url.toString();
}

/**
 * Refreshes the access token when expired
 */
async function refreshToken(): Promise<boolean> {
    try {
        const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === 'true';
        const refreshUrl = USE_MOCKS ? '/api/mock/auth/refresh' : `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`;

        const response = await fetch(refreshUrl, {
            method: 'POST',
            credentials: 'include',
        });
        return response.ok;
    } catch {
        return false;
    }
}

/**
 * Core fetch wrapper with error handling and token refresh
 */
async function request<T>(
    endpoint: string,
    config: RequestConfig = {},
    retryOnUnauthorized = true
): Promise<T> {
    const { body, params, headers: customHeaders, ...restConfig } = config;

    const url = buildUrl(endpoint, params);

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...customHeaders,
    };

    const response = await fetch(url, {
        ...restConfig,
        headers,
        credentials: 'include', // Send cookies
        body: body ? JSON.stringify(body) : undefined,
    });

    // Handle 401 with token refresh
    if (response.status === 401 && retryOnUnauthorized) {
        const refreshed = await refreshToken();
        if (refreshed) {
            // Retry the original request
            return request<T>(endpoint, config, false);
        }
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }

    // Handle non-OK responses
    if (!response.ok) {
        let errorData: ApiError;
        try {
            const json = await response.json();
            // Handle mock API wrapped error format: { ok: false, error: { error, message } }
            if (json && typeof json === 'object' && 'error' in json && typeof json.error === 'object') {
                errorData = json.error as ApiError;
            } else {
                errorData = json as ApiError;
            }
        } catch {
            errorData = {
                error: 'INTERNAL_ERROR',
                message: `Request failed with status ${response.status}`,
            };
        }

        throw new ApiClientError(
            response.status,
            errorData.error || 'INTERNAL_ERROR',
            errorData.message || 'An unexpected error occurred',
            errorData.retryAfterSeconds
        );
    }

    // Handle empty responses
    if (response.status === 204) {
        return undefined as T;
    }

    // Parse JSON response
    const json = await response.json();

    // Handle mock API wrapped response format: { ok: true, data: ... }
    if (json && typeof json === 'object' && 'ok' in json && 'data' in json) {
        return json.data as T;
    }

    // Return raw response for real backend
    return json as T;
}

// ============================================================================
// HTTP Methods
// ============================================================================

export const apiClient = {
    get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
        return request<T>(endpoint, { ...config, method: 'GET' });
    },

    post<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
        return request<T>(endpoint, { ...config, method: 'POST', body });
    },

    put<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
        return request<T>(endpoint, { ...config, method: 'PUT', body });
    },

    patch<T>(endpoint: string, body?: unknown, config?: RequestConfig): Promise<T> {
        return request<T>(endpoint, { ...config, method: 'PATCH', body });
    },

    delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
        return request<T>(endpoint, { ...config, method: 'DELETE' });
    },
};

export default apiClient;
