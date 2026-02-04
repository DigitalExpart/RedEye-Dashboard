/**
 * Mock Data Store
 * Singleton that persists across hot reloads in development
 */

import { config } from '@/lib/config';
import { seedMockData, type MockDataStore } from './seed';
import type { Device, Message, User, ID } from '@/types/contracts';

// Survive hot reload in development
declare global {
    // eslint-disable-next-line no-var
    var __redeyeMockStore: MockDataStore | undefined;
}

/**
 * Get or create the mock data store
 */
export function getMockStore(): MockDataStore {
    if (!globalThis.__redeyeMockStore) {
        globalThis.__redeyeMockStore = seedMockData({
            devicesPerUser: config.mock.devicesPerUser,
            unassignedDevices: config.mock.unassignedDevices,
            messagesPerDevice: config.mock.messagesPerDevice,
        });
        console.log('[MockStore] Initialized with', {
            users: globalThis.__redeyeMockStore.users.length,
            devices: globalThis.__redeyeMockStore.devices.length,
            totalMessages: Object.values(globalThis.__redeyeMockStore.messagesByDeviceId)
                .reduce((sum, msgs) => sum + msgs.length, 0),
        });
    }
    return globalThis.__redeyeMockStore;
}

// ============================================================================
// Query Helpers
// ============================================================================

export function findUserByUsername(username: string): (User & { password: string }) | undefined {
    const { users } = getMockStore();
    return users.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function findUserById(id: ID): (User & { password: string }) | undefined {
    const { users } = getMockStore();
    return users.find(u => u.id === id);
}

export function findDeviceById(id: ID): Device | undefined {
    const { devices } = getMockStore();
    return devices.find(d => d.id === id);
}

export function getDevicesForUser(userId: ID, role: 'admin' | 'user'): Device[] {
    const { devices } = getMockStore();
    // Admin sees all, user sees only assigned
    if (role === 'admin') return devices;
    return devices.filter(d => d.assignedTo === userId);
}

export function getMessagesForDevice(
    deviceId: ID,
    cursor?: string,
    limit: number = 50
): { items: Message[]; nextCursor: string | null; hasMore: boolean } {
    const { messagesByDeviceId } = getMockStore();
    const allMessages = messagesByDeviceId[deviceId] || [];

    let startIndex = 0;
    if (cursor) {
        const cursorIndex = allMessages.findIndex(m => m.id === cursor);
        if (cursorIndex !== -1) {
            startIndex = cursorIndex + 1;
        }
    }

    const items = allMessages.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allMessages.length;
    const nextCursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    return { items, nextCursor, hasMore };
}

export function getAllUsers(): (User & { password: string })[] {
    return getMockStore().users;
}

export function addMessageToDevice(deviceId: ID, message: Message): void {
    const { messagesByDeviceId } = getMockStore();
    if (!messagesByDeviceId[deviceId]) {
        messagesByDeviceId[deviceId] = [];
    }
    messagesByDeviceId[deviceId].unshift(message);
}

export function updateDeviceStatus(
    deviceId: ID,
    updates: Partial<Pick<Device, 'status' | 'battery' | 'network' | 'lastSeen'>>
): Device | null {
    const { devices } = getMockStore();
    const device = devices.find(d => d.id === deviceId);
    if (!device) return null;

    Object.assign(device, updates);
    return device;
}

// ============================================================================
// Session/Challenge Stores
// ============================================================================

interface Challenge {
    challengeId: string;
    userId: string;
    methods: ('telegram_otp' | 'totp')[];
    expiresAt: number;
}

const challengeStore = new Map<string, Challenge>();

export function createChallenge(userId: string, methods: ('telegram_otp' | 'totp')[]): Challenge {
    const challenge: Challenge = {
        challengeId: `ch_${userId}_${Date.now()}`,
        userId,
        methods,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };
    challengeStore.set(challenge.challengeId, challenge);
    return challenge;
}

export function validateChallenge(challengeId: string): Challenge | null {
    const challenge = challengeStore.get(challengeId);
    if (!challenge) return null;

    if (Date.now() > challenge.expiresAt) {
        challengeStore.delete(challengeId);
        return null;
    }

    return challenge;
}

export function consumeChallenge(challengeId: string): void {
    challengeStore.delete(challengeId);
}
