/**
 * Mock Data Generators
 * Creates realistic fake data for testing
 */

import type { ID, ISODate, DeviceStatus, MessageType, Role } from '@/types/contracts';

// Seed for consistent generation
let idCounter = 0;

export function generateId(): ID {
    return `mock_${++idCounter}_${Date.now().toString(36)}`;
}

export function generateISODate(daysAgo: number = 0, hoursAgo: number = 0): ISODate {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(date.getHours() - hoursAgo);
    return date.toISOString();
}

export function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
}

export function randomBoolean(trueChance: number = 0.5): boolean {
    return Math.random() < trueChance;
}

// Device data pools
const DEVICE_NAMES = [
    'Galaxy S23', 'Pixel 7 Pro', 'OnePlus 11', 'Xiaomi 13', 'Oppo Find X6',
    'Samsung A54', 'Realme GT', 'Vivo X90', 'Motorola Edge', 'Nothing Phone 2',
    'Redmi Note 12', 'Poco F5', 'Honor Magic5', 'Asus ROG 7', 'Sony Xperia 5'
];

const MANUFACTURERS = ['Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Motorola', 'Asus', 'Sony', 'Nothing'];

const CARRIERS = ['Vodafone', 'T-Mobile', 'AT&T', 'Verizon', 'Orange', 'O2', 'Three', 'EE', 'Sprint', 'MTN'];

const ANDROID_VERSIONS = ['11', '12', '12L', '13', '14'];

const APP_VERSIONS = ['1.0.0', '1.1.0', '1.2.0', '1.2.1', '1.3.0', '2.0.0', '2.0.1'];

// Message content pools
const SMS_SENDERS = [
    'Mom', 'Dad', 'Work', 'Bank Alert', 'Amazon', 'Uber', 'WhatsApp',
    '+1234567890', '+0987654321', 'DHL', 'Netflix', 'Spotify', 'Google'
];

const SMS_TEMPLATES = [
    'Your verification code is {code}. Valid for 5 minutes.',
    'Your order #{order} has been shipped. Track at {link}',
    'Payment of ${amount} received. Balance: ${balance}',
    'Reminder: Your appointment is tomorrow at {time}',
    'Hey! Are you free this weekend?',
    'Thank you for your purchase. Invoice attached.',
    'Your subscription will renew on {date}',
    'Security alert: New login from {location}',
    'Flash sale! Up to 50% off ends tonight.',
    'Your ride is arriving in {minutes} minutes.',
    'Package delivered to front door at {time}',
    'Low balance alert: ${balance} remaining',
    'Meeting rescheduled to {time}',
    'Happy birthday! 🎂',
    'Thanks for calling. I\'ll get back to you soon.',
];

const NOTIFICATION_APPS = [
    'com.whatsapp', 'com.facebook.orca', 'com.instagram.android',
    'com.twitter.android', 'com.snapchat.android', 'com.telegram.messenger',
    'com.discord', 'com.slack', 'com.microsoft.teams'
];

export function generatePhoneNumber(): string {
    const prefix = randomElement(['+1', '+44', '+49', '+33', '+61']);
    const number = Array.from({ length: 10 }, () => randomInt(0, 9)).join('');
    return `${prefix}${number}`;
}

function fillTemplate(template: string): string {
    return template
        .replace('{code}', String(randomInt(100000, 999999)))
        .replace('{order}', String(randomInt(10000, 99999)))
        .replace('{link}', 'https://track.example.com/' + randomInt(1000, 9999))
        .replace(/\{amount\}/g, String(randomInt(10, 500)))
        .replace(/\{balance\}/g, String(randomInt(100, 5000)))
        .replace(/\{time\}/g, `${randomInt(8, 18)}:${randomInt(0, 5)}0`)
        .replace('{date}', generateISODate(-randomInt(1, 30)).split('T')[0])
        .replace('{location}', randomElement(['New York', 'London', 'Paris', 'Tokyo', 'Sydney']))
        .replace('{minutes}', String(randomInt(2, 15)));
}

export function generateSmsBody(): string {
    return fillTemplate(randomElement(SMS_TEMPLATES));
}

export function generateDeviceStatus(): DeviceStatus {
    const rand = Math.random();
    if (rand < 0.4) return 'online';
    if (rand < 0.7) return 'idle';
    return 'offline';
}

export function generateDeviceName(index: number): string {
    const baseName = randomElement(DEVICE_NAMES);
    return `${baseName} (#${index + 1})`;
}

export function generateDevice(index: number, assignedTo?: ID) {
    const manufacturer = randomElement(MANUFACTURERS);
    const status = generateDeviceStatus();

    return {
        id: generateId(),
        name: generateDeviceName(index),
        model: randomElement(DEVICE_NAMES),
        manufacturer,
        androidVersion: randomElement(ANDROID_VERSIONS),
        appVersion: randomElement(APP_VERSIONS),
        status,
        battery: status === 'offline' ? randomInt(0, 20) : randomInt(20, 100),
        network: status === 'offline' ? 'none' as const : randomElement(['wifi', 'mobile'] as const),
        lastSeen: status === 'online'
            ? generateISODate(0, 0)
            : generateISODate(0, randomInt(1, 48)),
        assignedTo,
        sims: [
            {
                slot: 1,
                carrier: randomElement(CARRIERS),
                number: generatePhoneNumber(),
                iccid: Array.from({ length: 19 }, () => randomInt(0, 9)).join(''),
            },
            ...(randomBoolean(0.3) ? [{
                slot: 2,
                carrier: randomElement(CARRIERS),
                number: generatePhoneNumber(),
                iccid: Array.from({ length: 19 }, () => randomInt(0, 9)).join(''),
            }] : []),
        ],
        tags: randomBoolean(0.5)
            ? Array.from({ length: randomInt(1, 3) }, () => randomElement(['work', 'personal', 'test', 'vip', 'backup']))
            : [],
        createdAt: generateISODate(randomInt(30, 365)),
    };
}

export function generateMessage(deviceId: ID, daysAgo: number = 0): {
    id: ID;
    deviceId: ID;
    type: MessageType;
    sender: string;
    body: string;
    timestamp: ISODate;
    simSlot?: number;
    appPackage?: string;
    read: boolean;
} {
    const type: MessageType = randomBoolean(0.7) ? 'sms' : 'notification';

    return {
        id: generateId(),
        deviceId,
        type,
        sender: type === 'sms' ? randomElement(SMS_SENDERS) : randomElement(NOTIFICATION_APPS).split('.').pop()!,
        body: generateSmsBody(),
        timestamp: generateISODate(daysAgo, randomInt(0, 23)),
        simSlot: type === 'sms' ? randomInt(1, 2) : undefined,
        appPackage: type === 'notification' ? randomElement(NOTIFICATION_APPS) : undefined,
        read: randomBoolean(0.8),
    };
}

export function generateUser(
    id: ID,
    username: string,
    email: string,
    role: Role,
    twoFaEnabled: boolean = true
) {
    return {
        id,
        username,
        email,
        role,
        twoFaEnabled,
        createdAt: generateISODate(randomInt(30, 365)),
        lastLoginAt: generateISODate(randomInt(0, 7)),
    };
}
