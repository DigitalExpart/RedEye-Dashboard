/**
 * Mock Utility Functions
 */

import { config } from '@/lib/config';

/**
 * Sleep for specified milliseconds
 */
export async function sleep(ms: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Add random latency to simulate network delay
 */
export async function withRandomLatency(): Promise<void> {
    const { latencyMin, latencyMax } = config.mock;
    const ms = Math.floor(latencyMin + Math.random() * (latencyMax - latencyMin + 1));
    await sleep(ms);
}

/**
 * Randomly decide if this request should fail (for testing error handling)
 */
export function shouldFail(): boolean {
    return Math.random() < config.mock.failureRate;
}

/**
 * Generate a unique ID
 */
export function generateId(prefix: string = 'id'): string {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
