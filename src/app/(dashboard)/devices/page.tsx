'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
    Smartphone,
    Plus,
    Search,
    Filter,
} from 'lucide-react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
    StatusBadge,
    SkeletonDeviceCard,
} from '@/components/ui';
import { getDevices } from '@/lib/api/devices';
import { useDeviceStatus } from '@/lib/socket';

export default function DevicesPage() {
    useDeviceStatus();

    const { data, isLoading } = useQuery({
        queryKey: ['devices', 'list', { page: 1, pageSize: 50 }],
        queryFn: () => getDevices({ page: 1, pageSize: 50 }),
    });

    const devices = data?.items || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Devices</h1>
                    <p className="text-neutral-400">
                        {data?.total || 0} device{data?.total !== 1 ? 's' : ''} total
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search devices..."
                                leftIcon={<Search className="h-4 w-4" />}
                            />
                        </div>
                        <Button variant="outline">
                            <Filter className="mr-2 h-4 w-4" />
                            Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Device Grid */}
            {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonDeviceCard key={i} />
                    ))}
                </div>
            ) : devices.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {devices.map((device) => (
                        <Link key={device.id} href={`/devices/${device.id}`}>
                            <Card hover className="p-4 h-full">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800">
                                            <Smartphone className="h-5 w-5 text-neutral-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">{device.name}</p>
                                            <p className="text-sm text-neutral-400">
                                                {device.model || 'Android Device'}
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge status={device.status} />
                                </div>
                                <div className="mt-4 pt-3 border-t border-neutral-800">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-neutral-400">Battery</span>
                                        <span className="text-white">{device.battery}%</span>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <Smartphone className="mx-auto h-12 w-12 text-neutral-600" />
                    <h3 className="mt-4 text-lg font-medium text-white">No devices found</h3>
                    <p className="mt-2 text-neutral-400">
                        You don&apos;t have any devices assigned to your account yet.
                    </p>
                </Card>
            )}
        </div>
    );
}
