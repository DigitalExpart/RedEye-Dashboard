/**
 * Mock Data Store
 * In-memory datasets for mock API endpoints
 * Initialized once per server lifecycle
 */

import type { User, Device, Message, AdminUser, ID } from '@/types/contracts';
import {
    generateId,
    generateDevice,
    generateMessage,
    generateUser,
    randomInt,
} from './generators';

// ============================================================================
// User Store
// ============================================================================

interface MockUser extends User {
    password: string; // Stored for mock auth validation
}

export const MOCK_USERS: MockUser[] = [
    {
        ...generateUser('user_admin_001', 'admin', 'admin@redeye.local', 'admin', true),
        password: 'admin123',
    },
    {
        ...generateUser('user_001', 'user1', 'user1@redeye.local', 'user', true),
        password: 'user123',
    },
    {
        ...generateUser('user_002', 'demo', 'demo@redeye.local', 'user', false),
        password: 'demo123',
    },
    {
        ...generateUser('user_003', 'john', 'john@redeye.local', 'user', true),
        password: 'john123',
    },
    {
        ...generateUser('user_004', 'sarah', 'sarah@redeye.local', 'user', true),
        password: 'sarah123',
    },
];

// ============================================================================
// Device Store
// ============================================================================

const DEVICE_COUNT = 100;

function initializeDevices(): Device[] {
    const devices: Device[] = [];
    const userIds = MOCK_USERS.map(u => u.id);

    for (let i = 0; i < DEVICE_COUNT; i++) {
        // Assign each device to a random user (admin gets more)
        const assignedTo = i < 30
            ? 'user_admin_001'
            : userIds[randomInt(0, userIds.length - 1)];

        devices.push(generateDevice(i, assignedTo));
    }

    return devices;
}

export const MOCK_DEVICES: Device[] = initializeDevices();

// ============================================================================
// Message Store
// ============================================================================

const MESSAGES_PER_DEVICE = 2500;

interface MessageStore {
    [deviceId: string]: Message[];
}

function initializeMessages(): MessageStore {
    const store: MessageStore = {};

    for (const device of MOCK_DEVICES) {
        const messages: Message[] = [];

        for (let i = 0; i < MESSAGES_PER_DEVICE; i++) {
            // Spread messages over the past 90 days
            const daysAgo = Math.floor(i / (MESSAGES_PER_DEVICE / 90));
            messages.push(generateMessage(device.id, daysAgo));
        }

        // Sort by timestamp descending (newest first)
        messages.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        store[device.id] = messages;
    }

    return store;
}

// Lazy initialization to avoid slow startup
let _messageStore: MessageStore | null = null;

export function getMessageStore(): MessageStore {
    if (!_messageStore) {
        _messageStore = initializeMessages();
    }
    return _messageStore;
}

// ============================================================================
// Session Store (for mock auth)
// ============================================================================

interface MockSession {
    sessionId: ID;
    userId: ID;
    createdAt: string;
    expiresAt: string;
}

interface MockChallenge {
    challengeId: ID;
    userId: ID;
    methods: ('telegram_otp' | 'totp')[];
    createdAt: string;
    expiresAt: string;
}

// In-memory session storage
export const sessionStore = new Map<string, MockSession>();
export const challengeStore = new Map<string, MockChallenge>();

// ============================================================================
// Helper Functions
// ============================================================================

export function findUserByUsername(username: string): MockUser | undefined {
    return MOCK_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
}

export function findUserById(id: ID): MockUser | undefined {
    return MOCK_USERS.find(u => u.id === id);
}

export function findDeviceById(id: ID): Device | undefined {
    return MOCK_DEVICES.find(d => d.id === id);
}

export function getDevicesForUser(userId: ID): Device[] {
    return MOCK_DEVICES.filter(d => d.assignedTo === userId);
}

export function getMessagesForDevice(
    deviceId: ID,
    cursor?: string,
    limit: number = 50
): { items: Message[]; nextCursor: string | null; hasMore: boolean } {
    const store = getMessageStore();
    const allMessages = store[deviceId] || [];

    let startIndex = 0;
    if (cursor) {
        const cursorIndex = allMessages.findIndex(m => m.id === cursor);
        if (cursorIndex !== -1) {
            startIndex = cursorIndex + 1;
        }
    }

    const items = allMessages.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allMessages.length;
    const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

    return { items, nextCursor, hasMore };
}

export function getUsersAsAdmin(): AdminUser[] {
    return MOCK_USERS.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        twoFaEnabled: user.twoFaEnabled,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        deviceCount: MOCK_DEVICES.filter(d => d.assignedTo === user.id).length,
    }));
}

export function createSession(userId: ID): MockSession {
    const session: MockSession = {
        sessionId: generateId(),
        userId,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
    sessionStore.set(session.sessionId, session);
    return session;
}

export function createChallenge(userId: ID, methods: ('telegram_otp' | 'totp')[]): MockChallenge {
    const challenge: MockChallenge = {
        challengeId: generateId(),
        userId,
        methods,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
    };
    challengeStore.set(challenge.challengeId, challenge);
    return challenge;
}

export function validateSession(sessionId: string): MockSession | null {
    const session = sessionStore.get(sessionId);
    if (!session) return null;

    if (new Date(session.expiresAt) < new Date()) {
        sessionStore.delete(sessionId);
        return null;
    }

    return session;
}

export function validateChallenge(challengeId: string): MockChallenge | null {
    const challenge = challengeStore.get(challengeId);
    if (!challenge) return null;

    if (new Date(challenge.expiresAt) < new Date()) {
        challengeStore.delete(challengeId);
        return null;
    }

    return challenge;
}

// Add a new message (for real-time simulation)
export function addMessage(deviceId: ID, message: Message): void {
    const store = getMessageStore();
    if (!store[deviceId]) {
        store[deviceId] = [];
    }
    store[deviceId].unshift(message);
}

// Update device status (for real-time simulation)
export function updateDeviceStatus(
    deviceId: ID,
    updates: Partial<Pick<Device, 'status' | 'battery' | 'network' | 'lastSeen'>>
): Device | null {
    const device = MOCK_DEVICES.find(d => d.id === deviceId);
    if (!device) return null;

    Object.assign(device, updates);
    return device;
}
