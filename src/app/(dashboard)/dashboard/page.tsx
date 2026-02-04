'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Smartphone,
    Battery,
    Wifi,
    Signal,
    Clock,
    ChevronRight,
    Activity,
    Users,
    MessageSquare,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    StatusBadge,
    SkeletonDeviceCard,
} from '@/components/ui';
import { cn, formatRelativeTime, getBatteryColorClass } from '@/lib/utils';
import { getDevices } from '@/lib/api/devices';
import { useDeviceStatus, useSocket } from '@/lib/socket';
import { useAuth } from '@/providers';

// Stats Card Component
function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    color = 'primary',
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: { value: number; label: string };
    color?: 'primary' | 'success' | 'warning' | 'error';
}) {
    const colorClasses = {
        primary: 'bg-primary-600/20 text-primary-400',
        success: 'bg-success-500/20 text-success-500',
        warning: 'bg-warning-500/20 text-warning-500',
        error: 'bg-error-500/20 text-error-500',
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-neutral-400">{title}</p>
                        <p className="text-3xl font-bold text-white mt-1">{value}</p>
                        {trend && (
                            <p className="text-xs text-neutral-500 mt-1">
                                <span className={trend.value >= 0 ? 'text-success-500' : 'text-error-500'}>
                                    {trend.value >= 0 ? '+' : ''}{trend.value}%
                                </span>{' '}
                                {trend.label}
                            </p>
                        )}
                    </div>
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', colorClasses[color])}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Device Card Component
function DeviceCard({
    device,
}: {
    device: {
        id: string;
        name: string;
        status: 'online' | 'offline' | 'idle';
        battery: number;
        lastSeen: string;
        model?: string;
    };
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            transition={{ duration: 0.2 }}
        >
            <Link href={`/devices/${device.id}`}>
                <Card hover className="p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800">
                                <Smartphone className="h-5 w-5 text-neutral-400" />
                            </div>
                            <div>
                                <p className="font-medium text-white">{device.name}</p>
                                <p className="text-sm text-neutral-400">{device.model || 'Android Device'}</p>
                            </div>
                        </div>
                        <StatusBadge status={device.status} />
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                            <Battery className={cn('h-4 w-4', getBatteryColorClass(device.battery))} />
                            <span className="text-sm text-neutral-300">{device.battery}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-neutral-400" />
                            <span className="text-sm text-neutral-300">Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-neutral-400" />
                            <span className="text-sm text-neutral-300">{formatRelativeTime(device.lastSeen)}</span>
                        </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between pt-3 border-t border-neutral-800">
                        <span className="text-xs text-neutral-500">View details</span>
                        <ChevronRight className="h-4 w-4 text-neutral-500" />
                    </div>
                </Card>
            </Link>
        </motion.div>
    );
}

export default function DashboardPage() {
    const { user, isAdmin } = useAuth();
    const { isConnected } = useSocket();

    // Subscribe to device status updates
    useDeviceStatus();

    const { data, isLoading } = useQuery({
        queryKey: ['devices', 'list', { page: 1, pageSize: 20 }],
        queryFn: () => getDevices({ page: 1, pageSize: 20 }),
    });

    const devices = data?.items || [];
    const totalDevices = data?.total || 0;
    const onlineDevices = devices.filter((d) => d.status === 'online').length;
    const offlineDevices = devices.filter((d) => d.status === 'offline').length;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                    <p className="text-neutral-400">
                        Welcome back, {user?.username || 'User'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div
                        className={cn(
                            'flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium',
                            isConnected
                                ? 'bg-success-500/20 text-success-500'
                                : 'bg-error-500/20 text-error-500'
                        )}
                    >
                        <span
                            className={cn(
                                'h-2 w-2 rounded-full',
                                isConnected ? 'bg-success-500 animate-pulse' : 'bg-error-500'
                            )}
                        />
                        {isConnected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Devices"
                    value={totalDevices}
                    icon={Smartphone}
                    trend={{ value: 12, label: 'from last month' }}
                />
                <StatCard
                    title="Online Devices"
                    value={onlineDevices}
                    icon={Wifi}
                    color="success"
                />
                <StatCard
                    title="Offline Devices"
                    value={offlineDevices}
                    icon={Signal}
                    color="warning"
                />
                <StatCard
                    title="Messages Today"
                    value="1,234"
                    icon={MessageSquare}
                    color="primary"
                />
            </div>

            {/* Device Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-white">Your Devices</h2>
                    <Link
                        href="/devices"
                        className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                    >
                        View all
                    </Link>
                </div>

                {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <SkeletonDeviceCard key={i} />
                        ))}
                    </div>
                ) : devices.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {devices.slice(0, 6).map((device) => (
                            <DeviceCard key={device.id} device={device} />
                        ))}
                    </div>
                ) : (
                    <Card className="p-12 text-center">
                        <Smartphone className="mx-auto h-12 w-12 text-neutral-600" />
                        <h3 className="mt-4 text-lg font-medium text-white">No devices</h3>
                        <p className="mt-2 text-neutral-400">
                            You don&apos;t have any devices assigned to your account yet.
                        </p>
                    </Card>
                )}
            </div>

            {/* Quick Actions for Admin */}
            {isAdmin && (
                <div>
                    <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Link href="/admin/users">
                            <Card hover className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600/20">
                                        <Users className="h-5 w-5 text-primary-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Manage Users</p>
                                        <p className="text-sm text-neutral-400">Add or edit user accounts</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                        <Link href="/admin/devices">
                            <Card hover className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-500/20">
                                        <Smartphone className="h-5 w-5 text-success-500" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-white">Assign Devices</p>
                                        <p className="text-sm text-neutral-400">Manage device assignments</p>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
