'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Eye,
    LayoutDashboard,
    Smartphone,
    Settings,
    Users,
    LogOut,
    Menu,
    X,
    ChevronDown,
    Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { AuthProvider, useAuth } from '@/providers';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    adminOnly?: boolean;
}

const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Devices', href: '/devices', icon: Smartphone },
    { label: 'Settings', href: '/settings', icon: Settings },
];

const adminItems: NavItem[] = [
    { label: 'Users', href: '/admin/users', icon: Users, adminOnly: true },
    { label: 'Admin', href: '/admin', icon: Shield, adminOnly: true },
];

function Sidebar({ isMobile = false, onClose }: { isMobile?: boolean; onClose?: () => void }) {
    const pathname = usePathname();
    const { user, isAdmin, logout } = useAuth();

    const isActive = (href: string) => {
        if (href === '/dashboard') return pathname === '/dashboard';
        return pathname.startsWith(href);
    };

    const NavLink = ({ item }: { item: NavItem }) => (
        <Link
            href={item.href}
            onClick={onClose}
            className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                    ? 'bg-primary-600/20 text-primary-400'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
            )}
        >
            <item.icon className="h-5 w-5" />
            {item.label}
        </Link>
    );

    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-16 items-center gap-2 px-4 border-b border-neutral-800">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                    <Eye className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold text-white">
                    Red<span className="text-primary-500">EYE</span>
                </span>
                {isMobile && (
                    <button
                        onClick={onClose}
                        className="ml-auto p-2 text-neutral-400 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                ))}

                {isAdmin && (
                    <>
                        <div className="my-4 border-t border-neutral-800" />
                        <p className="px-3 mb-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                            Administration
                        </p>
                        {adminItems.map((item) => (
                            <NavLink key={item.href} item={item} />
                        ))}
                    </>
                )}
            </nav>

            {/* User section */}
            <div className="border-t border-neutral-800 p-4">
                <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-700 text-sm font-medium text-white">
                        {user?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                            {user?.username || 'User'}
                        </p>
                        <p className="text-xs text-neutral-400 capitalize">{user?.role || 'user'}</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-neutral-400 hover:text-white"
                    onClick={logout}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                </Button>
            </div>
        </div>
    );
}

function Header({ onMenuClick }: { onMenuClick: () => void }) {
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-neutral-800 bg-neutral-900/80 backdrop-blur-sm px-4 lg:px-6">
            <button
                onClick={onMenuClick}
                className="lg:hidden p-2 text-neutral-400 hover:text-white"
            >
                <Menu className="h-5 w-5" />
            </button>

            <div className="flex-1" />

            {/* User dropdown - desktop */}
            <div className="hidden lg:flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-700 text-sm font-medium text-white">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-sm text-neutral-300">{user?.username}</span>
            </div>
        </header>
    );
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    return (
        <div className="min-h-screen bg-neutral-950">
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 border-r border-neutral-800 bg-neutral-900 lg:block">
                <Sidebar />
            </aside>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/70 lg:hidden"
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'tween', duration: 0.3 }}
                            className="fixed left-0 top-0 z-50 h-screen w-64 border-r border-neutral-800 bg-neutral-900 lg:hidden"
                        >
                            <Sidebar isMobile onClose={() => setMobileMenuOpen(false)} />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Main content */}
            <div className="lg:pl-64">
                <Header onMenuClick={() => setMobileMenuOpen(true)} />
                <main className="p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </AuthProvider>
    );
}
