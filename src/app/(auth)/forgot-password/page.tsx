'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button, Input, Card, CardContent, useToast } from '@/components/ui';
import { forgotPassword } from '@/lib/api/auth';
import { forgotPasswordSchema } from '@/lib/utils/validation';

export default function ForgotPasswordPage() {
    const { error: showError } = useToast();

    const [email, setEmail] = React.useState('');
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = React.useState(false);
    const [isSubmitted, setIsSubmitted] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Validate
        const result = forgotPasswordSchema.safeParse({ email });
        if (!result.success) {
            setErrors({ email: result.error.issues[0]?.message || 'Invalid email' });
            return;
        }

        setIsLoading(true);
        try {
            await forgotPassword({ email });
            setIsSubmitted(true);
        } catch (err) {
            showError('Request failed', err instanceof Error ? err.message : 'Please try again');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="p-6">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to login
                </Link>

                {!isSubmitted ? (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white">Forgot password?</h2>
                            <p className="text-neutral-400 mt-1">
                                Enter your email and we&apos;ll send you a reset link
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                type="email"
                                label="Email address"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={errors.email}
                                leftIcon={<Mail className="h-4 w-4" />}
                                autoComplete="email"
                                disabled={isLoading}
                            />

                            <Button type="submit" className="w-full" isLoading={isLoading}>
                                Send Reset Link
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
                        <h2 className="text-xl font-bold text-white">Check your email</h2>
                        <p className="text-neutral-400 mt-2">
                            We&apos;ve sent a password reset link to{' '}
                            <span className="text-white">{email}</span>
                        </p>
                        <p className="text-sm text-neutral-500 mt-4">
                            Didn&apos;t receive the email? Check your spam folder or{' '}
                            <button
                                onClick={() => setIsSubmitted(false)}
                                className="text-primary-400 hover:text-primary-300 transition-colors"
                            >
                                try again
                            </button>
                        </p>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
