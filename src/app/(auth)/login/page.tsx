'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Smartphone, KeyRound, ArrowLeft, Send } from 'lucide-react';
import { Button, Input, Card, CardContent, useToast } from '@/components/ui';
import { login, send2faCode, verify2fa } from '@/lib/api/auth';
import { loginSchema, twoFactorSchema, type LoginInput, type TwoFactorInput } from '@/lib/utils/validation';
import type { TwoFaMethod } from '@/types/contracts';

type LoginStep = 'credentials' | '2fa-select' | '2fa-verify';

export default function LoginPage() {
    const router = useRouter();
    const { error: showError, success } = useToast();

    const [step, setStep] = React.useState<LoginStep>('credentials');
    const [isLoading, setIsLoading] = React.useState(false);

    // Form state
    const [username, setUsername] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [code, setCode] = React.useState('');
    const [errors, setErrors] = React.useState<Record<string, string>>({});

    // 2FA state
    const [challengeId, setChallengeId] = React.useState('');
    const [availableMethods, setAvailableMethods] = React.useState<TwoFaMethod[]>([]);
    const [selectedMethod, setSelectedMethod] = React.useState<TwoFaMethod | null>(null);
    const [telegramCooldown, setTelegramCooldown] = React.useState(0);

    // Telegram cooldown timer
    React.useEffect(() => {
        if (telegramCooldown > 0) {
            const timer = setTimeout(() => setTelegramCooldown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [telegramCooldown]);

    const handleCredentialsSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Validate
        const result = loginSchema.safeParse({ username, password });
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
            const response = await login({ username, password });

            if (response.requires2fa) {
                setChallengeId(response.challengeId!);
                setAvailableMethods(response.methods || []);
                setStep('2fa-select');
            } else {
                // Direct login (no 2FA)
                success('Welcome back!', `Logged in as ${response.user?.username}`);
                router.push('/dashboard');
            }
        } catch (err) {
            showError('Login failed', err instanceof Error ? err.message : 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    const handleMethodSelect = async (method: TwoFaMethod) => {
        setSelectedMethod(method);

        if (method === 'telegram_otp') {
            // Trigger Telegram OTP send
            setIsLoading(true);
            try {
                const response = await send2faCode({ challengeId, method: 'telegram_otp' });
                setTelegramCooldown(response.cooldownSeconds);
                success('OTP Sent', 'Check your Telegram for the verification code');
            } catch (err) {
                showError('Failed to send OTP', err instanceof Error ? err.message : 'Please try again');
            } finally {
                setIsLoading(false);
            }
        }

        setStep('2fa-verify');
    };

    const handleResendTelegram = async () => {
        if (telegramCooldown > 0) return;

        setIsLoading(true);
        try {
            const response = await send2faCode({ challengeId, method: 'telegram_otp' });
            setTelegramCooldown(response.cooldownSeconds);
            success('OTP Sent', 'Check your Telegram for the verification code');
        } catch (err) {
            showError('Failed to send OTP', err instanceof Error ? err.message : 'Please try again');
        } finally {
            setIsLoading(false);
        }
    };

    const handle2FASubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        // Validate
        const result = twoFactorSchema.safeParse({ code });
        if (!result.success) {
            setErrors({ code: result.error.issues[0]?.message || 'Invalid code' });
            return;
        }

        if (!selectedMethod) return;

        setIsLoading(true);
        try {
            const response = await verify2fa({
                challengeId,
                method: selectedMethod,
                code,
            });

            success('Welcome back!', `Logged in as ${response.user?.username}`);
            router.push('/dashboard');
        } catch (err) {
            showError('Verification failed', err instanceof Error ? err.message : 'Invalid code');
        } finally {
            setIsLoading(false);
        }
    };

    const goBack = () => {
        if (step === '2fa-verify') {
            setStep('2fa-select');
            setCode('');
            setSelectedMethod(null);
        } else if (step === '2fa-select') {
            setStep('credentials');
            setChallengeId('');
            setAvailableMethods([]);
        }
    };

    return (
        <Card className="bg-neutral-900/50 border-neutral-800">
            <CardContent className="p-6">
                <AnimatePresence mode="wait">
                    {/* Step 1: Credentials */}
                    {step === 'credentials' && (
                        <motion.div
                            key="credentials"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                                <p className="text-neutral-400 mt-1">Sign in to your account</p>
                            </div>

                            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
                                <Input
                                    label="Username"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    error={errors.username}
                                    leftIcon={<User className="h-4 w-4" />}
                                    autoComplete="username"
                                    disabled={isLoading}
                                />

                                <Input
                                    type="password"
                                    label="Password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    error={errors.password}
                                    leftIcon={<Lock className="h-4 w-4" />}
                                    autoComplete="current-password"
                                    disabled={isLoading}
                                />

                                <div className="flex justify-end">
                                    <Link
                                        href="/forgot-password"
                                        className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                <Button type="submit" className="w-full" isLoading={isLoading}>
                                    Sign In
                                </Button>
                            </form>
                        </motion.div>
                    )}

                    {/* Step 2: 2FA Method Selection */}
                    {step === '2fa-select' && (
                        <motion.div
                            key="2fa-select"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <button
                                onClick={goBack}
                                className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-6"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </button>

                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-bold text-white">Two-Factor Authentication</h2>
                                <p className="text-neutral-400 mt-1">Choose a verification method</p>
                            </div>

                            <div className="space-y-3">
                                {availableMethods.includes('totp') && (
                                    <button
                                        onClick={() => handleMethodSelect('totp')}
                                        disabled={isLoading}
                                        className="w-full flex items-center gap-4 p-4 rounded-lg border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 hover:border-neutral-600 transition-all text-left"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600/20">
                                            <KeyRound className="h-5 w-5 text-primary-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Google Authenticator</p>
                                            <p className="text-sm text-neutral-400">Use your authenticator app</p>
                                        </div>
                                    </button>
                                )}

                                {availableMethods.includes('telegram_otp') && (
                                    <button
                                        onClick={() => handleMethodSelect('telegram_otp')}
                                        disabled={isLoading}
                                        className="w-full flex items-center gap-4 p-4 rounded-lg border border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 hover:border-neutral-600 transition-all text-left"
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/20">
                                            <Send className="h-5 w-5 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-white">Telegram OTP</p>
                                            <p className="text-sm text-neutral-400">Receive a code via Telegram</p>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: 2FA Verification */}
                    {step === '2fa-verify' && (
                        <motion.div
                            key="2fa-verify"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <button
                                onClick={goBack}
                                className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-6"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back
                            </button>

                            <div className="text-center mb-6">
                                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-600/20">
                                    {selectedMethod === 'totp' ? (
                                        <KeyRound className="h-7 w-7 text-primary-400" />
                                    ) : (
                                        <Send className="h-7 w-7 text-blue-400" />
                                    )}
                                </div>
                                <h2 className="text-2xl font-bold text-white">Enter Verification Code</h2>
                                <p className="text-neutral-400 mt-1">
                                    {selectedMethod === 'totp'
                                        ? 'Enter the 6-digit code from your authenticator app'
                                        : 'Enter the 6-digit code sent to your Telegram'}
                                </p>
                            </div>

                            <form onSubmit={handle2FASubmit} className="space-y-4">
                                <Input
                                    label="Verification Code"
                                    placeholder="000000"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    error={errors.code}
                                    leftIcon={<Smartphone className="h-4 w-4" />}
                                    autoComplete="one-time-code"
                                    inputMode="numeric"
                                    disabled={isLoading}
                                    className="text-center text-2xl tracking-widest font-mono"
                                />

                                {selectedMethod === 'telegram_otp' && (
                                    <div className="text-center">
                                        <button
                                            type="button"
                                            onClick={handleResendTelegram}
                                            disabled={telegramCooldown > 0 || isLoading}
                                            className="text-sm text-primary-400 hover:text-primary-300 transition-colors disabled:text-neutral-500 disabled:cursor-not-allowed"
                                        >
                                            {telegramCooldown > 0
                                                ? `Resend code in ${telegramCooldown}s`
                                                : 'Resend code'}
                                        </button>
                                    </div>
                                )}

                                <Button type="submit" className="w-full" isLoading={isLoading}>
                                    Verify
                                </Button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
