'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser, logout as apiLogout } from '@/lib/api/auth';
import type { User } from '@/types/contracts';
import { ROUTES, PUBLIC_ROUTES } from '@/lib/utils/constants';

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    isAdmin: boolean;
    login: (user: User) => void;
    logout: () => Promise<void>;
    refetch: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const queryClient = useQueryClient();

    const {
        data,
        isLoading,
        refetch,
        isError,
    } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: getCurrentUser,
        staleTime: 10 * 60 * 1000, // 10 minutes
        retry: false,
    });

    const user = data ?? null;
    const isAuthenticated = !!user;
    const isAdmin = user?.role === 'admin';

    // Redirect logic
    React.useEffect(() => {
        if (isLoading) return;

        const isPublicRoute = PUBLIC_ROUTES.some((route) =>
            pathname.startsWith(route)
        );

        if (!isAuthenticated && !isPublicRoute) {
            // Redirect to login if not authenticated and not on public route
            router.push(ROUTES.LOGIN);
        } else if (isAuthenticated && isPublicRoute) {
            // Redirect to dashboard if authenticated and on public route
            router.push(ROUTES.DASHBOARD);
        }
    }, [isAuthenticated, isLoading, pathname, router]);

    const login = React.useCallback(
        (user: User) => {
            queryClient.setQueryData(['auth', 'me'], { user });
            router.push(ROUTES.DASHBOARD);
        },
        [queryClient, router]
    );

    const logout = React.useCallback(async () => {
        try {
            await apiLogout();
        } catch {
            // Continue with logout even if API call fails
        }
        queryClient.clear();
        router.push(ROUTES.LOGIN);
    }, [queryClient, router]);

    // Handle auth error (e.g., session expired)
    React.useEffect(() => {
        if (isError && !PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
            router.push(ROUTES.LOGIN);
        }
    }, [isError, pathname, router]);

    const value: AuthContextValue = {
        user,
        isLoading,
        isAuthenticated,
        isAdmin,
        login,
        logout,
        refetch: () => refetch(),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Hook for requiring authentication
export function useRequireAuth() {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push(ROUTES.LOGIN);
        }
    }, [isAuthenticated, isLoading, router]);

    return { isAuthenticated, isLoading };
}

// Hook for requiring admin role
export function useRequireAdmin() {
    const { isAdmin, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push(ROUTES.LOGIN);
            } else if (!isAdmin) {
                router.push(ROUTES.DASHBOARD);
            }
        }
    }, [isAdmin, isAuthenticated, isLoading, router]);

    return { isAdmin, isLoading };
}
