'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Virtuoso } from 'react-virtuoso';
import {
    Smartphone,
    Battery,
    Wifi,
    Signal,
    Clock,
    MessageSquare,
    ArrowLeft,
    CreditCard,
    Info,
    ChevronDown,
    Bell,
} from 'lucide-react';
import Link from 'next/link';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    StatusBadge,
    Badge,
    Button,
    Skeleton,
    SkeletonMessage,
} from '@/components/ui';
import { cn, formatRelativeTime, formatDateTime, getBatteryColorClass } from '@/lib/utils';
import { getDevice, getDeviceMessages } from '@/lib/api/devices';
import { useDeviceMessages, useDeviceRoom } from '@/lib/socket';
import type { Message } from '@/types/contracts';

// Message Item Component
const MessageItem = React.memo(function MessageItem({ message }: { message: Message }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 p-4 border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
        >
            <div
                className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0',
                    message.type === 'sms' ? 'bg-primary-600/20' : 'bg-info-500/20'
                )}
            >
                {message.type === 'sms' ? (
                    <MessageSquare className="h-5 w-5 text-primary-400" />
                ) : (
                    <Bell className="h-5 w-5 text-info-400" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">{message.sender}</span>
                    {message.simSlot && (
                        <Badge variant="outline" className="text-xs">
                            SIM {message.simSlot}
                        </Badge>
                    )}
                    <span className="text-xs text-neutral-500">
                        {formatDateTime(message.timestamp)}
                    </span>
                </div>
                <p className="mt-1 text-neutral-300 break-words">{message.body}</p>
            </div>
        </motion.div>
    );
});

// SIM Card Component
function SimCardInfo({
    sim,
}: {
    sim: { slot: number; carrier: string; number: string; iccid?: string };
}) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600/20">
                <CreditCard className="h-5 w-5 text-primary-400" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">SIM {sim.slot}</span>
                    <Badge variant="default" className="text-xs">
                        {sim.carrier}
                    </Badge>
                </div>
                <p className="text-sm text-neutral-400 truncate">{sim.number}</p>
            </div>
        </div>
    );
}

export default function DeviceDetailPage() {
    const params = useParams();
    const deviceId = params.id as string;

    const [newMessageCount, setNewMessageCount] = React.useState(0);
    const virtuosoRef = React.useRef<any>(null);

    // Fetch device details
    const { data: device, isLoading: isLoadingDevice } = useQuery({
        queryKey: ['devices', 'detail', deviceId],
        queryFn: () => getDevice(deviceId),
        enabled: !!deviceId,
    });

    // Fetch messages with infinite scroll
    const {
        data: messagesData,
        isLoading: isLoadingMessages,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['devices', deviceId, 'messages'],
        queryFn: ({ pageParam }) =>
            getDeviceMessages(deviceId, { cursor: pageParam, limit: 50 }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        enabled: !!deviceId,
    });

    // Join device room for real-time updates
    useDeviceRoom(deviceId);

    // Handle new messages
    useDeviceMessages(deviceId, () => {
        setNewMessageCount((c) => c + 1);
    });

    const messages = React.useMemo(
        () => messagesData?.pages.flatMap((p) => p.items) ?? [],
        [messagesData]
    );

    const scrollToTop = () => {
        virtuosoRef.current?.scrollToIndex({ index: 0 });
        setNewMessageCount(0);
    };

    if (isLoadingDevice) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                        <Skeleton className="h-96 rounded-xl" />
                    </div>
                    <Skeleton className="h-96 rounded-xl" />
                </div>
            </div>
        );
    }

    if (!device) {
        return (
            <div className="text-center py-12">
                <Smartphone className="mx-auto h-12 w-12 text-neutral-600" />
                <h2 className="mt-4 text-lg font-medium text-white">Device not found</h2>
                <p className="mt-2 text-neutral-400">
                    The device you&apos;re looking for doesn&apos;t exist.
                </p>
                <Button asChild className="mt-6">
                    <Link href="/dashboard">Back to Dashboard</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/dashboard"
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-800 hover:bg-neutral-700 transition-colors"
                >
                    <ArrowLeft className="h-5 w-5 text-neutral-400" />
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-white">{device.name}</h1>
                        <StatusBadge status={device.status} />
                    </div>
                    <p className="text-neutral-400">{device.model || 'Android Device'}</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Message Stream */}
                <div className="lg:col-span-2">
                    <Card className="overflow-hidden">
                        <CardHeader className="border-b border-neutral-800">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5 text-primary-400" />
                                    Messages
                                </CardTitle>
                                {newMessageCount > 0 && (
                                    <Button size="sm" onClick={scrollToTop}>
                                        {newMessageCount} new message{newMessageCount > 1 ? 's' : ''}
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isLoadingMessages ? (
                                <div>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <SkeletonMessage key={i} />
                                    ))}
                                </div>
                            ) : messages.length > 0 ? (
                                <Virtuoso
                                    ref={virtuosoRef}
                                    style={{ height: '500px' }}
                                    data={messages}
                                    endReached={() => hasNextPage && fetchNextPage()}
                                    overscan={200}
                                    itemContent={(index, message) => (
                                        <MessageItem key={message.id} message={message} />
                                    )}
                                    components={{
                                        Footer: () =>
                                            isFetchingNextPage ? (
                                                <div className="p-4 text-center">
                                                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                                                </div>
                                            ) : null,
                                    }}
                                />
                            ) : (
                                <div className="py-12 text-center">
                                    <MessageSquare className="mx-auto h-10 w-10 text-neutral-600" />
                                    <p className="mt-4 text-neutral-400">No messages yet</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Device Info Sidebar */}
                <div className="space-y-6">
                    {/* Device Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Info className="h-4 w-4 text-primary-400" />
                                Device Info
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-neutral-500">Battery</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Battery
                                            className={cn('h-4 w-4', getBatteryColorClass(device.battery))}
                                        />
                                        <span className="font-medium text-white">{device.battery}%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Network</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {device.network === 'wifi' ? (
                                            <Wifi className="h-4 w-4 text-success-500" />
                                        ) : (
                                            <Signal className="h-4 w-4 text-success-500" />
                                        )}
                                        <span className="font-medium text-white capitalize">
                                            {device.network || 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Last Seen</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock className="h-4 w-4 text-neutral-400" />
                                        <span className="font-medium text-white">
                                            {formatRelativeTime(device.lastSeen)}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-neutral-500">Android</p>
                                    <span className="font-medium text-white">
                                        {device.androidVersion || 'Unknown'}
                                    </span>
                                </div>
                            </div>

                            {device.appVersion && (
                                <div className="pt-3 border-t border-neutral-800">
                                    <p className="text-xs text-neutral-500">App Version</p>
                                    <span className="text-sm text-white">{device.appVersion}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* SIM Cards */}
                    {device.sims && device.sims.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <CreditCard className="h-4 w-4 text-primary-400" />
                                    SIM Cards
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {device.sims.map((sim) => (
                                    <SimCardInfo key={sim.slot} sim={sim} />
                                ))}
                            </CardContent>
                        </Card>
                    )}

                    {/* Tags */}
                    {device.tags && device.tags.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Tags</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {device.tags.map((tag) => (
                                        <Badge key={tag} variant="outline">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Screen reader announcement for new messages */}
            <div aria-live="polite" aria-atomic="false" className="sr-only">
                {newMessageCount > 0 && `${newMessageCount} new messages received`}
            </div>
        </div>
    );
}
