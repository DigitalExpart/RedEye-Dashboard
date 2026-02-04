/**
 * Runtime Configuration
 * Centralizes all environment-based settings
 */

export const config = {
    useMocks: process.env.NEXT_PUBLIC_USE_MOCKS === 'true',
    socketUrl: process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4001',
    appName: process.env.NEXT_PUBLIC_APP_NAME ?? 'RedEYE Dashboard',

    mock: {
        latencyMin: Number(process.env.MOCK_LATENCY_MIN_MS ?? 50),
        latencyMax: Number(process.env.MOCK_LATENCY_MAX_MS ?? 250),
        failureRate: Number(process.env.MOCK_FAILURE_RATE ?? 0),
        devicesPerUser: Number(process.env.MOCK_DEVICES_PER_USER ?? 120),
        unassignedDevices: Number(process.env.MOCK_UNASSIGNED_DEVICES ?? 200),
        messagesPerDevice: Number(process.env.MOCK_MESSAGES_PER_DEVICE ?? 2000),
        sessionSecret: process.env.MOCK_SESSION_SECRET ?? 'dev_secret_change_me_in_production',
    },
} as const;
