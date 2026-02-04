/**
 * Deterministic Mock Data Seeding
 * Generates stable IDs so REST + Socket data matches
 */

import type { Device, Message, User, SimInfo, DeviceStatus } from '@/types/contracts';

// Helpers for deterministic IDs
function deviceId(n: number): string {
    return `dev_${String(n).padStart(5, '0')}`;
}

function messageId(deviceIndex: number, n: number): string {
    return `sms_${deviceIndex}_${String(n).padStart(6, '0')}`;
}

function userId(type: 'admin' | 'user', n: number): string {
    return `u_${type}_${n}`;
}

function isoDate(msAgo: number = 0): string {
    return new Date(Date.now() - msAgo).toISOString();
}

// Data pools
const MODELS = ['Pixel 7 Pro', 'Samsung S23', 'Xiaomi 13', 'OnePlus 11', 'Oppo Find X6'];
const MANUFACTURERS = ['Google', 'Samsung', 'Xiaomi', 'OnePlus', 'Oppo'];
const CARRIERS = ['AT&T', 'T-Mobile', 'Verizon', 'Vodafone', 'Orange'];
const ANDROID_VERSIONS = ['12', '13', '14'];
const APP_VERSIONS = ['1.0.0', '1.1.0', '1.2.0', '2.0.0'];

const SMS_SENDERS = [
    'Mom', 'Dad', 'Work', 'Bank Alert', 'Amazon', 'Uber',
    '+15551234567', '+15559876543', 'Netflix', 'Google', 'DHL'
];

const SMS_TEMPLATES = [
    'Your verification code is {code}. Valid for 5 minutes.',
    'Your order #{order} has been shipped. Track at example.com/track/{order}',
    'Payment of ${amount} received. New balance: ${balance}',
    'Reminder: You have an appointment tomorrow at {time}.',
    'Hey! Are you free this weekend?',
    'Security alert: New login from {city}.',
    'Flash sale! Up to 50% off ends tonight.',
    'Your ride is arriving in {minutes} minutes.',
    'Package delivered to front door at {time}.',
    'Thanks for your purchase! Invoice attached.',
];

function fillTemplate(template: string, seed: number): string {
    return template
        .replace('{code}', String(100000 + (seed % 900000)))
        .replace('{order}', String(10000 + (seed % 90000)))
        .replace(/\{amount\}/g, String(10 + (seed % 490)))
        .replace(/\{balance\}/g, String(100 + (seed % 4900)))
        .replace(/\{time\}/g, `${8 + (seed % 10)}:${(seed % 6)}0`)
        .replace('{city}', ['New York', 'London', 'Paris', 'Tokyo', 'Sydney'][seed % 5])
        .replace('{minutes}', String(2 + (seed % 13)));
}

export interface SeedOptions {
    devicesPerUser: number;
    unassignedDevices: number;
    messagesPerDevice: number;
}

export interface MockDataStore {
    users: (User & { password: string })[];
    devices: Device[];
    messagesByDeviceId: Record<string, Message[]>;
}

/**
 * Generate deterministic mock data
 */
export function seedMockData(opts: SeedOptions): MockDataStore {
    // Users with passwords
    const users: (User & { password: string })[] = [
        {
            id: userId('admin', 1),
            username: 'admin',
            email: 'admin@redeye.local',
            role: 'admin',
            twoFaEnabled: true,
            createdAt: isoDate(90 * 24 * 60 * 60 * 1000), // 90 days ago
            lastLoginAt: isoDate(1 * 60 * 60 * 1000), // 1 hour ago
            password: 'admin123',
        },
        {
            id: userId('user', 1),
            username: 'user',
            email: 'user@redeye.local',
            role: 'user',
            twoFaEnabled: true,
            createdAt: isoDate(30 * 24 * 60 * 60 * 1000), // 30 days ago
            lastLoginAt: isoDate(2 * 60 * 60 * 1000), // 2 hours ago
            password: 'user123',
        },
        {
            id: userId('user', 2),
            username: 'demo',
            email: 'demo@redeye.local',
            role: 'user',
            twoFaEnabled: false,
            createdAt: isoDate(7 * 24 * 60 * 60 * 1000), // 7 days ago
            password: 'demo123',
        },
    ];

    // Devices
    const devices: Device[] = [];
    let deviceIndex = 1;

    // Create device helper
    const createDevice = (index: number, assignedTo?: string): Device => {
        const isOnline = index % 4 !== 0; // 75% online
        const status: DeviceStatus = isOnline ? (index % 7 === 0 ? 'idle' : 'online') : 'offline';

        const sims: SimInfo[] = [
            {
                slot: 1,
                carrier: CARRIERS[index % CARRIERS.length],
                number: `+1555${String(1000000 + index).slice(-7)}`,
                iccid: `8901${String(index).padStart(15, '0')}`,
            },
        ];

        // 30% have dual SIM
        if (index % 3 === 0) {
            sims.push({
                slot: 2,
                carrier: CARRIERS[(index + 1) % CARRIERS.length],
                number: `+1555${String(2000000 + index).slice(-7)}`,
                iccid: `8902${String(index).padStart(15, '0')}`,
            });
        }

        return {
            id: deviceId(index),
            name: `RedEYE Device ${index}`,
            model: MODELS[index % MODELS.length],
            manufacturer: MANUFACTURERS[index % MANUFACTURERS.length],
            androidVersion: ANDROID_VERSIONS[index % ANDROID_VERSIONS.length],
            appVersion: APP_VERSIONS[index % APP_VERSIONS.length],
            status,
            battery: status === 'offline' ? 5 + (index % 15) : 20 + (index % 80),
            network: status === 'offline' ? 'none' : (index % 2 === 0 ? 'wifi' : 'mobile'),
            lastSeen: status === 'online'
                ? isoDate(index * 1000) // Very recent
                : isoDate((index % 48) * 60 * 60 * 1000), // 0-48 hours ago
            assignedTo,
            sims,
            tags: index % 5 === 0 ? ['vip'] : (index % 7 === 0 ? ['test'] : []),
            createdAt: isoDate((60 + (index % 300)) * 24 * 60 * 60 * 1000),
        };
    };

    // User devices (distributed between user1 and demo)
    for (let i = 0; i < opts.devicesPerUser; i++) {
        const assignedTo = i % 2 === 0 ? userId('user', 1) : userId('user', 2);
        devices.push(createDevice(deviceIndex++, assignedTo));
    }

    // Unassigned devices (admin can see all)
    for (let i = 0; i < opts.unassignedDevices; i++) {
        devices.push(createDevice(deviceIndex++));
    }

    // Messages per device
    const messagesByDeviceId: Record<string, Message[]> = {};

    for (const device of devices) {
        const messages: Message[] = [];
        const devNum = parseInt(device.id.split('_')[1], 10);

        for (let i = 0; i < opts.messagesPerDevice; i++) {
            const seed = devNum * 10000 + i;
            const template = SMS_TEMPLATES[i % SMS_TEMPLATES.length];

            messages.push({
                id: messageId(devNum, i),
                deviceId: device.id,
                type: i % 10 === 0 ? 'notification' : 'sms',
                sender: SMS_SENDERS[i % SMS_SENDERS.length],
                body: fillTemplate(template, seed),
                timestamp: isoDate(i * 60 * 1000 + (seed % 30000)), // Spread over time
                simSlot: (i % 2) + 1,
                read: i > 10, // First 10 unread
            });
        }

        // Sort newest first
        messages.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
        messagesByDeviceId[device.id] = messages;
    }

    return { users, devices, messagesByDeviceId };
}
