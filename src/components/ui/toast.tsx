'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number;
}

interface ToastItemProps extends Toast {
    onDismiss: (id: string) => void;
}

const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
};

const styles = {
    success: 'border-success-500/30 bg-success-500/10',
    error: 'border-error-500/30 bg-error-500/10',
    warning: 'border-warning-500/30 bg-warning-500/10',
    info: 'border-info-500/30 bg-info-500/10',
};

const iconStyles = {
    success: 'text-success-500',
    error: 'text-error-500',
    warning: 'text-warning-500',
    info: 'text-info-500',
};

function ToastItem({ id, type, title, description, duration = 5000, onDismiss }: ToastItemProps) {
    const Icon = icons[type];

    React.useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onDismiss(id);
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [id, duration, onDismiss]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className={cn(
                'pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg backdrop-blur-sm',
                styles[type]
            )}
            role="alert"
            aria-live="polite"
        >
            <div className="flex items-start gap-3">
                <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', iconStyles[type])} />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{title}</p>
                    {description && (
                        <p className="mt-1 text-sm text-neutral-300">{description}</p>
                    )}
                </div>
                <button
                    onClick={() => onDismiss(id)}
                    className="flex-shrink-0 text-neutral-400 hover:text-white transition-colors"
                    aria-label="Dismiss notification"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </motion.div>
    );
}

// Toast Context and Provider
interface ToastContextValue {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
    clearToasts: () => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([]);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { ...toast, id }]);
    }, []);

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const clearToasts = React.useCallback(() => {
        setToasts([]);
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
            {children}
            {mounted &&
                createPortal(
                    <div
                        className="fixed bottom-0 right-0 z-[700] flex flex-col gap-2 p-4 pointer-events-none max-h-screen overflow-hidden"
                        aria-label="Notifications"
                    >
                        <AnimatePresence mode="popLayout">
                            {toasts.map((toast) => (
                                <ToastItem key={toast.id} {...toast} onDismiss={removeToast} />
                            ))}
                        </AnimatePresence>
                    </div>,
                    document.body
                )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = React.useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }

    const { addToast, removeToast, clearToasts } = context;

    return {
        toast: addToast,
        success: (title: string, description?: string) =>
            addToast({ type: 'success', title, description }),
        error: (title: string, description?: string) =>
            addToast({ type: 'error', title, description }),
        warning: (title: string, description?: string) =>
            addToast({ type: 'warning', title, description }),
        info: (title: string, description?: string) =>
            addToast({ type: 'info', title, description }),
        dismiss: removeToast,
        clearAll: clearToasts,
    };
}
