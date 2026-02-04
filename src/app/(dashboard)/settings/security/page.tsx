'use client';

import * as React from 'react';
import { Shield, Key, Smartphone, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input, Modal, ModalFooter, useToast } from '@/components/ui';
import { useAuth } from '@/providers';
import { changePasswordSchema } from '@/lib/utils/validation';

export default function SecurityPage() {
    const { user } = useAuth();
    const { success, error: showError } = useToast();

    const [showPasswordModal, setShowPasswordModal] = React.useState(false);
    const [currentPassword, setCurrentPassword] = React.useState('');
    const [newPassword, setNewPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = React.useState(false);

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const result = changePasswordSchema.safeParse({
            currentPassword,
            newPassword,
            confirmPassword,
        });

        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.issues.forEach((err) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0] as string] = err.message;
                }
            });
            setErrors(fieldErrors);
            return;
        }

        setIsLoading(true);
        try {
            // API call would go here
            // await changePassword({ currentPassword, newPassword });
            success('Password changed', 'Your password has been updated');
            setShowPasswordModal(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            showError('Failed', err instanceof Error ? err.message : 'Please try again');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* 2FA Status */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary-400" />
                        Two-Factor Authentication
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${user?.twoFaEnabled ? 'bg-success-500/20' : 'bg-warning-500/20'
                                }`}>
                                {user?.twoFaEnabled ? (
                                    <CheckCircle className="h-6 w-6 text-success-500" />
                                ) : (
                                    <AlertCircle className="h-6 w-6 text-warning-500" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-white">
                                    {user?.twoFaEnabled ? '2FA is enabled' : '2FA is disabled'}
                                </p>
                                <p className="text-sm text-neutral-400">
                                    {user?.twoFaEnabled
                                        ? 'Your account is protected with two-factor authentication'
                                        : 'Enable 2FA to add an extra layer of security'}
                                </p>
                            </div>
                        </div>
                        <Button variant={user?.twoFaEnabled ? 'outline' : 'default'}>
                            {user?.twoFaEnabled ? 'Manage 2FA' : 'Enable 2FA'}
                        </Button>
                    </div>

                    {user?.twoFaEnabled && (
                        <div className="mt-4 pt-4 border-t border-neutral-800">
                            <p className="text-sm font-medium text-neutral-300 mb-2">Enabled methods:</p>
                            <div className="flex gap-2">
                                <Badge variant="success">
                                    <Key className="mr-1 h-3 w-3" />
                                    Google Authenticator
                                </Badge>
                                <Badge variant="default">
                                    <Smartphone className="mr-1 h-3 w-3" />
                                    Telegram OTP
                                </Badge>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Password */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary-400" />
                        Password
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-white">Change your password</p>
                            <p className="text-sm text-neutral-400">
                                We recommend using a strong, unique password
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => setShowPasswordModal(true)}>
                            Change Password
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Active Sessions */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-800/50 border border-primary-500/30">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600/20">
                                    <Smartphone className="h-5 w-5 text-primary-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-white">Current Session</p>
                                    <p className="text-sm text-neutral-400">
                                        Windows • Chrome • Last active: Just now
                                    </p>
                                </div>
                            </div>
                            <Badge variant="success">Active</Badge>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-neutral-800">
                        <Button variant="destructive" size="sm">
                            Sign out all other sessions
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Change Password Modal */}
            <Modal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                title="Change Password"
            >
                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <Input
                        type="password"
                        label="Current Password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        error={errors.currentPassword}
                        leftIcon={<Lock className="h-4 w-4" />}
                        disabled={isLoading}
                    />
                    <Input
                        type="password"
                        label="New Password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        error={errors.newPassword}
                        leftIcon={<Lock className="h-4 w-4" />}
                        disabled={isLoading}
                    />
                    <Input
                        type="password"
                        label="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        error={errors.confirmPassword}
                        leftIcon={<Lock className="h-4 w-4" />}
                        disabled={isLoading}
                    />

                    <ModalFooter>
                        <Button type="button" variant="outline" onClick={() => setShowPasswordModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isLoading}>
                            Update Password
                        </Button>
                    </ModalFooter>
                </form>
            </Modal>
        </div>
    );
}
