'use client';

import Link from 'next/link';
import { Users, Smartphone, Shield, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui';
import { useRequireAdmin } from '@/providers';

const adminLinks = [
    {
        title: 'User Management',
        description: 'Add, edit, and manage user accounts',
        href: '/admin/users',
        icon: Users,
        color: 'bg-primary-600/20 text-primary-400',
    },
    {
        title: 'Device Assignment',
        description: 'Assign and unassign devices to users',
        href: '/admin/devices',
        icon: Smartphone,
        color: 'bg-success-500/20 text-success-500',
    },
    {
        title: 'Roles & Permissions',
        description: 'Configure access control settings',
        href: '/admin/roles',
        icon: Shield,
        color: 'bg-warning-500/20 text-warning-500',
    },
    {
        title: 'System Settings',
        description: 'Configure global application settings',
        href: '/admin/settings',
        icon: Settings,
        color: 'bg-info-500/20 text-info-500',
    },
];

export default function AdminPage() {
    const { isLoading } = useRequireAdmin();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
                <p className="text-neutral-400">Manage users, devices, and system settings</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                {adminLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                        <Card hover className="p-6 h-full">
                            <div className="flex items-start gap-4">
                                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${link.color}`}>
                                    <link.icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{link.title}</h3>
                                    <p className="mt-1 text-sm text-neutral-400">{link.description}</p>
                                </div>
                            </div>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
