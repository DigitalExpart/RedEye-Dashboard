'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button, Input, Card, CardContent, useToast } from '@/components/ui';
import { resetPassword } from '@/lib/api/auth';
import { resetPasswordSchema } from '@/lib/utils/validation';

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { error: showError } = useToast();

    const token = searchParams.get('token');

    const [password, setPassword] = React.useState('');
    const [confirmPassword, setConfirmPassword] = React.useState('');
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);

    // Check for token
    if (!token) {
        return (
            <Card className="bg-neutral-900/50 border-neutral-800">
                <CardContent className="p-6 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-error-500/20">
                        <AlertCircle className="h-7 w-7 text-error-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Invalid Reset Link</h2>
                    <p className="text-neutral-400 mt-2">
                        This password reset link is invalid or has expired.
                    </p>
                    <Button
                        className="mt-6"
                        onClick={() => router.push('/forgot-password')}
                    >
                        Request New Link
                    </Button>
                </CardContent>
            </Card>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Validate
        const result = resetPasswordSchema.safeParse({ password, confirmPassword });
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
            await resetPassword({ token, password });
            setIsSuccess(true);
        } catch (err) {
            showError('Reset failed', err instanceof Error ? err.message : 'Please try again');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="p-6">
                {!isSuccess ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Reset your password</h2>
                            <p className="text-neutral-400 mt-1">
                                Enter your new password below
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                type="password"
                                label="New Password"
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                error={errors.password}
                                leftIcon={<Lock className="h-4 w-4" />}
                                autoComplete="new-password"
                                disabled={isLoading}
                            />

                            <Input
                                type="password"
                                label="Confirm Password"
                                placeholder="Confirm new password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                error={errors.confirmPassword}
                                leftIcon={<Lock className="h-4 w-4" />}
                                autoComplete="new-password"
                                disabled={isLoading}
                            />

                            <div className="text-xs text-neutral-400 space-y-1">
                                <p>Password must contain:</p>
                                <ul className="list-disc list-inside space-y-0.5 ml-2">
                                    <li>At least 6 characters</li>
                                    <li>One uppercase letter</li>
                                    <li>One lowercase letter</li>
                                    <li>One number</li>
                                </ul>
                            </div>

                            <Button type="submit" className="w-full" isLoading={isLoading}>
                                Reset Password
                            </Button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-4"
                    >
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-500/20">
                            <CheckCircle className="h-7 w-7 text-success-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Password Reset!</h2>
                        <p className="text-neutral-400 mt-2">
                            Your password has been successfully reset.
                        </p>
                        <Button
                            className="mt-6"
                            onClick={() => router.push('/login')}
                        >
                            Sign In
                        </Button>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
