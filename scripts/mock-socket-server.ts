/**
 * Mock Socket.io Server
 * Runs as separate process on port 4001
 * 
 * Start: npm run dev:socket
 * Or run with Next.js: npm run dev
 */

import { Server, Socket } from 'socket.io';

const PORT = parseInt(process.env.MOCK_SOCKET_PORT || '4001', 10);
const DEVICES_PER_USER = parseInt(process.env.MOCK_DEVICES_PER_USER || '120', 10);
const UNASSIGNED_DEVICES = parseInt(process.env.MOCK_UNASSIGNED_DEVICES || '200', 10);

// Same deterministic ID generation as seed.ts
function deviceId(n: number): string {
    return `dev_${String(n).padStart(5, '0')}`;
}

// Generate device IDs matching the mock store
const TOTAL_DEVICES = DEVICES_PER_USER + UNASSIGNED_DEVICES;
const DEVICE_IDS: string[] = [];
for (let i = 1; i <= TOTAL_DEVICES; i++) {
    DEVICE_IDS.push(deviceId(i));
}

// Track device states
interface DeviceState {
    id: string;
    status: 'online' | 'offline' | 'idle';
    battery: number;
    network: 'wifi' | 'mobile' | 'none';
    signal: 0 | 1 | 2 | 3 | 4;
    lastSeen: string;
}

const deviceStates = new Map<string, DeviceState>();

// Initialize with random states
for (const id of DEVICE_IDS) {
    const index = parseInt(id.split('_')[1], 10);
    const online = index % 4 !== 0;

    deviceStates.set(id, {
        id,
        status: online ? (index % 7 === 0 ? 'idle' : 'online') : 'offline',
        battery: 20 + (index % 80),
        network: online ? (index % 2 === 0 ? 'wifi' : 'mobile') : 'none',
        signal: online ? ((index % 5) as 0 | 1 | 2 | 3 | 4) : 0,
        lastSeen: new Date().toISOString(),
    });
}

// Create Socket.io server
const io = new Server(PORT, {
    cors: {
        origin: true,
        credentials: true,
    },
});

console.log(`[mock-socket] Server starting on http://localhost:${PORT}`);
console.log(`[mock-socket] Tracking ${DEVICE_IDS.length} devices with deterministic IDs`);

// Handle connections
io.on('connection', (socket: Socket) => {
    console.log(`[mock-socket] Client connected: ${socket.id}`);

    // Room management
    socket.on('room.join', ({ room }: { room: string }) => {
        socket.join(room);
        console.log(`[mock-socket] ${socket.id} joined room: ${room}`);
    });

    socket.on('room.leave', ({ room }: { room: string }) => {
        socket.leave(room);
        console.log(`[mock-socket] ${socket.id} left room: ${room}`);
    });

    // Legacy room events (for compatibility)
    socket.on('join', ({ room }: { room: string }) => socket.join(room));
    socket.on('leave', ({ room }: { room: string }) => socket.leave(room));

    socket.on('disconnect', (reason: string) => {
        console.log(`[mock-socket] Client disconnected: ${socket.id} (${reason})`);
    });
});

// Emit device status updates every second
setInterval(() => {
    for (const [deviceId, state] of deviceStates) {
        const room = `device:${deviceId}`;

        // Skip if no one is listening
        if (!io.sockets.adapter.rooms.has(room)) continue;

        // Mutate state randomly
        const oldBattery = state.battery;
        state.battery = Math.max(5, Math.min(100, oldBattery + (Math.random() > 0.5 ? 1 : -1)));
        state.lastSeen = new Date().toISOString();

        // Occasionally change status
        if (Math.random() > 0.95) {
            if (state.status === 'online') {
                state.status = Math.random() > 0.5 ? 'idle' : 'offline';
                if (state.status === 'offline') {
                    state.network = 'none';
                    state.signal = 0;
                }
            } else if (state.status === 'idle') {
                state.status = Math.random() > 0.3 ? 'online' : 'offline';
            } else {
                state.status = 'online';
                state.network = Math.random() > 0.5 ? 'wifi' : 'mobile';
                state.signal = Math.floor(Math.random() * 5) as 0 | 1 | 2 | 3 | 4;
            }
        }

        // Emit status update
        const statusPayload = {
            deviceId: state.id,
            status: state.status,
            battery: state.battery,
            network: state.network,
            signal: state.signal,
            lastSeen: state.lastSeen,
        };

        io.to(room).emit('device.status', statusPayload);

        // Occasionally emit new SMS (30% chance when online)
        if (state.status !== 'offline' && Math.random() > 0.7) {
            const smsPayload = {
                deviceId: state.id,
                message: {
                    id: `live_${state.id}_${Date.now()}`,
                    deviceId: state.id,
                    type: 'sms' as const,
                    sender: `+1555${String(Math.floor(1000000 + Math.random() * 9000000))}`,
                    body: `Live SMS at ${new Date().toLocaleTimeString()} - ${Math.random().toString(16).slice(2, 10)}`,
                    timestamp: new Date().toISOString(),
                    simSlot: Math.random() > 0.5 ? 1 : 2,
                    read: false,
                },
            };

            io.to(room).emit('device.sms.new', smsPayload);
        }
    }
}, 1000);

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('[mock-socket] Shutting down...');
    io.close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('[mock-socket] Shutting down...');
    io.close();
    process.exit(0);
});

console.log('[mock-socket] Ready and listening for connections');
