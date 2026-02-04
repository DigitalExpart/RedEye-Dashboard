'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socketManager, SocketEventMap } from './manager';
import type {
    SocketDeviceStatusEvent,
    SocketNewMessageEvent,
    Device,
    Message,
} from '@/types/contracts';

// ============================================================================
// useSocket - Base socket hook
// ============================================================================

export function useSocket() {
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const connect = async () => {
            try {
                await socketManager.connect();
                setIsConnected(true);
            } catch (error) {
                console.error('[useSocket] Connection failed:', error);
                setIsConnected(false);
            }
        };

        connect();

        // Check connection status periodically
        const interval = setInterval(() => {
            setIsConnected(socketManager.isConnected());
        }, 1000);

        return () => {
            clearInterval(interval);
        };
    }, []);

    const joinRoom = useCallback((room: string) => {
        socketManager.joinRoom(room);
    }, []);

    const leaveRoom = useCallback((room: string) => {
        socketManager.leaveRoom(room);
    }, []);

    const disconnect = useCallback(() => {
        socketManager.disconnect();
        setIsConnected(false);
    }, []);

    return {
        isConnected,
        joinRoom,
        leaveRoom,
        disconnect,
    };
}

// ============================================================================
// useSocketEvent - Subscribe to specific socket events
// ============================================================================

export function useSocketEvent<K extends keyof SocketEventMap>(
    event: K,
    callback: (data: SocketEventMap[K]) => void
) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    useEffect(() => {
        const unsubscribe = socketManager.on(event, (data) => {
            callbackRef.current(data);
        });

        return unsubscribe;
    }, [event]);
}

// ============================================================================
// useDeviceStatus - Real-time device status updates
// ============================================================================

export function useDeviceStatus(deviceId?: string) {
    const queryClient = useQueryClient();

    useSocketEvent('device.status', (data: SocketDeviceStatusEvent) => {
        // Only process if we're watching all devices or this specific device
        if (deviceId && data.deviceId !== deviceId) return;

        // Update device in cache
        queryClient.setQueryData<Device>(
            ['devices', 'detail', data.deviceId],
            (old) => {
                if (!old) return old;
                return {
                    ...old,
                    status: data.status,
                    battery: data.battery,
                    lastSeen: data.lastSeen,
                    network: data.network,
                };
            }
        );

        // Update device in list cache
        queryClient.setQueriesData<{ items: Device[] }>(
            { queryKey: ['devices', 'list'] },
            (old) => {
                if (!old) return old;
                return {
                    ...old,
                    items: old.items.map((device) =>
                        device.id === data.deviceId
                            ? {
                                ...device,
                                status: data.status,
                                battery: data.battery,
                                lastSeen: data.lastSeen,
                            }
                            : device
                    ),
                };
            }
        );
    });
}

// ============================================================================
// useDeviceMessages - Real-time message stream
// ============================================================================

export function useDeviceMessages(
    deviceId: string,
    onNewMessage?: (message: Message) => void
) {
    const queryClient = useQueryClient();
    const seenMessageIds = useRef(new Set<string>());

    // Join device room on mount
    useEffect(() => {
        const room = `device:${deviceId}`;
        socketManager.joinRoom(room);

        return () => {
            socketManager.leaveRoom(room);
            seenMessageIds.current.clear();
        };
    }, [deviceId]);

    useSocketEvent('device.sms.new', (data: SocketNewMessageEvent) => {
        if (data.deviceId !== deviceId) return;

        // Dedupe by message ID
        if (seenMessageIds.current.has(data.message.id)) return;
        seenMessageIds.current.add(data.message.id);

        // Add to message cache (prepend to first page)
        queryClient.setQueriesData<{ items: Message[]; nextCursor: string | null }>(
            { queryKey: ['devices', deviceId, 'messages'] },
            (old) => {
                if (!old) return old;
                return {
                    ...old,
                    items: [data.message, ...old.items],
                };
            }
        );

        // Call callback if provided
        onNewMessage?.(data.message);
    });
}

// ============================================================================
// useDeviceRoom - Join/leave device-specific room
// ============================================================================

export function useDeviceRoom(deviceId: string) {
    useEffect(() => {
        const room = `device:${deviceId}`;
        socketManager.joinRoom(room);

        return () => {
            socketManager.leaveRoom(room);
        };
    }, [deviceId]);
}

// ============================================================================
// useUserRoom - Join user-specific room for global updates
// ============================================================================

export function useUserRoom(userId: string) {
    useEffect(() => {
        const room = `user:${userId}`;
        socketManager.joinRoom(room);

        return () => {
            socketManager.leaveRoom(room);
        };
    }, [userId]);
}
