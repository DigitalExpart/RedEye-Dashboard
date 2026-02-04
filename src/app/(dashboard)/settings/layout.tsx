'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Shield, Key, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const settingsNav = [
    { label: 'Profile', href: '/settings/profile', icon: User },
    { label: 'Security', href: '/settings/security', icon: Shield },
    { label: 'API Keys', href: '/settings/api-keys', icon: Key },
    { label: 'Notifications', href: '/settings/notifications', icon: Bell },
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Settings</h1>
                <p className="text-neutral-400">Manage your account and preferences</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                {/* Sidebar Navigation */}
                <nav className="lg:w-64 flex-shrink-0">
                    <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                        {settingsNav.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                                    pathname === item.href
                                        ? 'bg-primary-600/20 text-primary-400'
                                        : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </div>
                </nav>

                {/* Content */}
                <div className="flex-1 min-w-0">{children}</div>
            </div>
        </div>
    );
}
