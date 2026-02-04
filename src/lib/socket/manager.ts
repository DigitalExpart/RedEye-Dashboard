import { io, Socket } from 'socket.io-client';
import {
    SOCKET_URL,
    SOCKET_RECONNECT_MAX_ATTEMPTS,
    SOCKET_RECONNECT_BASE_DELAY,
    SOCKET_RECONNECT_MAX_DELAY,
} from '@/lib/utils/constants';
import type { SocketDeviceStatusEvent, SocketNewMessageEvent } from '@/types/contracts';

export type SocketEventMap = {
    'device.status': SocketDeviceStatusEvent;
    'device.sms.new': SocketNewMessageEvent;
};

// ============================================================================
// Socket Manager - Singleton Pattern
// ============================================================================

type SocketCallback<T> = (data: T) => void;

class SocketManager {
    private static instance: SocketManager;
    private socket: Socket | null = null;
    private subscribedRooms: Set<string> = new Set();
    private eventListeners: Map<string, Set<SocketCallback<unknown>>> = new Map();
    private connectionPromise: Promise<void> | null = null;
    private isConnecting = false;

    private constructor() {
        // Private constructor for singleton
    }

    static getInstance(): SocketManager {
        if (!SocketManager.instance) {
            SocketManager.instance = new SocketManager();
        }
        return SocketManager.instance;
    }

    /**
     * Connect to the socket server
     */
    connect(): Promise<void> {
        if (this.socket?.connected) {
            return Promise.resolve();
        }

        if (this.connectionPromise) {
            return this.connectionPromise;
        }

        this.isConnecting = true;

        this.connectionPromise = new Promise((resolve, reject) => {
            this.socket = io(SOCKET_URL, {
                withCredentials: true,
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: SOCKET_RECONNECT_MAX_ATTEMPTS,
                reconnectionDelay: SOCKET_RECONNECT_BASE_DELAY,
                reconnectionDelayMax: SOCKET_RECONNECT_MAX_DELAY,
                timeout: 10000,
            });

            this.socket.on('connect', () => {
                console.log('[Socket] Connected:', this.socket?.id);
                this.isConnecting = false;
                this.connectionPromise = null;
                this.resubscribeRooms();
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('[Socket] Connection error:', error.message);

                if (error.message === 'unauthorized') {
                    this.handleUnauthorized();
                }

                if (this.isConnecting) {
                    this.isConnecting = false;
                    this.connectionPromise = null;
                    reject(error);
                }
            });

            this.socket.on('disconnect', (reason) => {
                console.log('[Socket] Disconnected:', reason);
            });

            this.socket.on('reconnect', (attemptNumber) => {
                console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
                this.resubscribeRooms();
            });

            this.socket.on('reconnect_failed', () => {
                console.error('[Socket] Reconnection failed');
            });

            // Setup event forwarding
            this.setupEventForwarding();
        });

        return this.connectionPromise;
    }

    /**
     * Disconnect from the socket server
     */
    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.subscribedRooms.clear();
            this.eventListeners.clear();
            this.connectionPromise = null;
        }
    }

    /**
     * Join a room for device-specific events
     */
    joinRoom(room: string): void {
        if (!this.socket?.connected) {
            console.warn('[Socket] Cannot join room, not connected');
            return;
        }

        if (!this.subscribedRooms.has(room)) {
            this.socket.emit('join', { room });
            this.subscribedRooms.add(room);
            console.log('[Socket] Joined room:', room);
        }
    }

    /**
     * Leave a room
     */
    leaveRoom(room: string): void {
        if (!this.socket?.connected) return;

        if (this.subscribedRooms.has(room)) {
            this.socket.emit('leave', { room });
            this.subscribedRooms.delete(room);
            console.log('[Socket] Left room:', room);
        }
    }

    /**
     * Subscribe to a socket event
     */
    on<K extends keyof SocketEventMap>(
        event: K,
        callback: SocketCallback<SocketEventMap[K]>
    ): () => void {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }

        this.eventListeners.get(event)!.add(callback as SocketCallback<unknown>);

        // Return unsubscribe function
        return () => {
            this.eventListeners.get(event)?.delete(callback as SocketCallback<unknown>);
        };
    }

    /**
     * Emit a one-time event listener
     */
    once<K extends keyof SocketEventMap>(
        event: K,
        callback: SocketCallback<SocketEventMap[K]>
    ): void {
        const wrapper = (data: SocketEventMap[K]) => {
            callback(data);
            this.eventListeners.get(event)?.delete(wrapper as SocketCallback<unknown>);
        };
        this.on(event, wrapper);
    }

    /**
     * Check if socket is connected
     */
    isConnected(): boolean {
        return this.socket?.connected ?? false;
    }

    /**
     * Get the socket instance (for advanced use)
     */
    getSocket(): Socket | null {
        return this.socket;
    }

    // ============================================================================
    // Private Methods
    // ============================================================================

    private resubscribeRooms(): void {
        if (!this.socket?.connected) return;

        this.subscribedRooms.forEach((room) => {
            this.socket!.emit('join', { room });
        });
        console.log('[Socket] Resubscribed to rooms:', Array.from(this.subscribedRooms));
    }

    private handleUnauthorized(): void {
        console.warn('[Socket] Unauthorized, redirecting to login');
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }

    private setupEventForwarding(): void {
        if (!this.socket) return;

        const events: (keyof SocketEventMap)[] = [
            'device.status',
            'device.sms.new',
        ];

        events.forEach((event) => {
            this.socket!.on(event, (data: SocketEventMap[typeof event]) => {
                this.eventListeners.get(event)?.forEach((callback) => {
                    callback(data);
                });
            });
        });
    }
}

// Export singleton instance
export const socketManager = SocketManager.getInstance();
export default socketManager;
