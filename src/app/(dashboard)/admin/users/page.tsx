'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
    Users,
    Smartphone,
    Activity,
    TrendingUp,
    Search,
    Plus,
    MoreVertical,
    Edit,
    Trash2,
    Shield,
} from 'lucide-react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    Button,
    Input,
    Badge,
    Modal,
    ModalFooter,
    useToast,
    Skeleton,
} from '@/components/ui';
import { getUsers, updateUserRole, deleteUser } from '@/lib/api/admin';
import { useRequireAdmin } from '@/providers';
import type { AdminUser, Role } from '@/types/contracts';

// Stats Card
function StatCard({
    title,
    value,
    icon: Icon,
    color,
}: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
}) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-neutral-400">{title}</p>
                        <p className="text-3xl font-bold text-white mt-1">{value}</p>
                    </div>
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// User Row Component
function UserRow({
    user,
    onEdit,
    onDelete,
}: {
    user: AdminUser;
    onEdit: (user: AdminUser) => void;
    onDelete: (user: AdminUser) => void;
}) {
    const [menuOpen, setMenuOpen] = React.useState(false);

    return (
        <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-b border-neutral-800 hover:bg-neutral-800/50 transition-colors"
        >
            <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-700 text-sm font-medium text-white">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-white">{user.username}</p>
                        <p className="text-sm text-neutral-400">{user.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3">
                <Badge variant={user.role === 'admin' ? 'primary' : 'default'}>
                    {user.role}
                </Badge>
            </td>
            <td className="px-4 py-3">
                <Badge variant={user.twoFaEnabled ? 'success' : 'warning'}>
                    {user.twoFaEnabled ? '2FA Enabled' : '2FA Disabled'}
                </Badge>
            </td>
            <td className="px-4 py-3 text-neutral-400">{user.deviceCount}</td>
            <td className="px-4 py-3">
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="h-8 w-8"
                    >
                        <MoreVertical className="h-4 w-4" />
                    </Button>
                    {menuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setMenuOpen(false)}
                            />
                            <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-lg border border-neutral-700 bg-neutral-800 py-1 shadow-lg">
                                <button
                                    onClick={() => {
                                        onEdit(user);
                                        setMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-700 hover:text-white"
                                >
                                    <Edit className="h-4 w-4" />
                                    Edit Role
                                </button>
                                <button
                                    onClick={() => {
                                        onDelete(user);
                                        setMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-error-400 hover:bg-neutral-700"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Delete User
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </td>
        </motion.tr>
    );
}

export default function AdminUsersPage() {
    const { isLoading: isCheckingAdmin } = useRequireAdmin();
    const { success, error: showError } = useToast();

    const [search, setSearch] = React.useState('');
    const [page, setPage] = React.useState(1);
    const [editUser, setEditUser] = React.useState<AdminUser | null>(null);
    const [deleteUserState, setDeleteUserState] = React.useState<AdminUser | null>(null);
    const [newRole, setNewRole] = React.useState<Role>('user');
    const [isUpdating, setIsUpdating] = React.useState(false);

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['users', 'list', { page, query: search }],
        queryFn: () => getUsers({ page, pageSize: 20, query: search }),
        enabled: !isCheckingAdmin,
    });

    const users = data?.items || [];
    const totalUsers = data?.total || 0;
    const adminCount = users.filter((u) => u.role === 'admin').length;

    const handleUpdateRole = async () => {
        if (!editUser) return;
        setIsUpdating(true);
        try {
            await updateUserRole(editUser.id, { role: newRole });
            success('Role updated', `${editUser.username} is now a ${newRole}`);
            setEditUser(null);
            refetch();
        } catch (err) {
            showError('Update failed', err instanceof Error ? err.message : 'Please try again');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!deleteUserState) return;
        setIsUpdating(true);
        try {
            await deleteUser(deleteUserState.id);
            success('User deleted', `${deleteUserState.username} has been removed`);
            setDeleteUserState(null);
            refetch();
        } catch (err) {
            showError('Delete failed', err instanceof Error ? err.message : 'Please try again');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isCheckingAdmin) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 rounded-xl" />
                    ))}
                </div>
                <Skeleton className="h-96 rounded-xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-neutral-400">Manage user accounts and permissions</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={totalUsers}
                    icon={Users}
                    color="bg-primary-600/20 text-primary-400"
                />
                <StatCard
                    title="Admins"
                    value={adminCount}
                    icon={Shield}
                    color="bg-warning-500/20 text-warning-500"
                />
                <StatCard
                    title="Active Today"
                    value="--"
                    icon={Activity}
                    color="bg-success-500/20 text-success-500"
                />
                <StatCard
                    title="New This Month"
                    value="--"
                    icon={TrendingUp}
                    color="bg-info-500/20 text-info-500"
                />
            </div>

            {/* User Table */}
            <Card>
                <CardHeader className="border-b border-neutral-800">
                    <div className="flex items-center justify-between">
                        <CardTitle>Users</CardTitle>
                        <div className="w-64">
                            <Input
                                placeholder="Search users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                leftIcon={<Search className="h-4 w-4" />}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-4 space-y-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full" />
                            ))}
                        </div>
                    ) : users.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-neutral-800 text-left text-sm text-neutral-400">
                                        <th className="px-4 py-3 font-medium">User</th>
                                        <th className="px-4 py-3 font-medium">Role</th>
                                        <th className="px-4 py-3 font-medium">2FA Status</th>
                                        <th className="px-4 py-3 font-medium">Devices</th>
                                        <th className="px-4 py-3 font-medium w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <UserRow
                                            key={user.id}
                                            user={user}
                                            onEdit={(u) => {
                                                setEditUser(u);
                                                setNewRole(u.role);
                                            }}
                                            onDelete={setDeleteUserState}
                                        />
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                            <Users className="mx-auto h-10 w-10 text-neutral-600" />
                            <p className="mt-4 text-neutral-400">No users found</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Role Modal */}
            <Modal
                isOpen={!!editUser}
                onClose={() => setEditUser(null)}
                title="Edit User Role"
                description={`Change role for ${editUser?.username}`}
            >
                <div className="space-y-4">
                    <div className="flex gap-3">
                        <button
                            onClick={() => setNewRole('user')}
                            className={`flex-1 p-4 rounded-lg border transition-colors ${newRole === 'user'
                                ? 'border-primary-500 bg-primary-600/10'
                                : 'border-neutral-700 hover:border-neutral-600'
                                }`}
                        >
                            <Users className="h-6 w-6 text-neutral-400 mx-auto mb-2" />
                            <p className="font-medium text-white">User</p>
                            <p className="text-xs text-neutral-400">Standard access</p>
                        </button>
                        <button
                            onClick={() => setNewRole('admin')}
                            className={`flex-1 p-4 rounded-lg border transition-colors ${newRole === 'admin'
                                ? 'border-primary-500 bg-primary-600/10'
                                : 'border-neutral-700 hover:border-neutral-600'
                                }`}
                        >
                            <Shield className="h-6 w-6 text-warning-500 mx-auto mb-2" />
                            <p className="font-medium text-white">Admin</p>
                            <p className="text-xs text-neutral-400">Full access</p>
                        </button>
                    </div>
                </div>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setEditUser(null)}>
                        Cancel
                    </Button>
                    <Button onClick={handleUpdateRole} isLoading={isUpdating}>
                        Save Changes
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteUserState}
                onClose={() => setDeleteUserState(null)}
                title="Delete User"
                description="This action cannot be undone."
            >
                <p className="text-neutral-300">
                    Are you sure you want to delete{' '}
                    <span className="font-medium text-white">{deleteUserState?.username}</span>?
                    All their data will be permanently removed.
                </p>
                <ModalFooter>
                    <Button variant="outline" onClick={() => setDeleteUserState(null)}>
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeleteUser} isLoading={isUpdating}>
                        Delete User
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
}
