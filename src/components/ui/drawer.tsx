'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: React.ReactNode;
    side?: 'left' | 'right';
    size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-xl',
};

export function Drawer({
    isOpen,
    onClose,
    title,
    description,
    children,
    side = 'right',
    size = 'md',
}: DrawerProps) {
    const [mounted, setMounted] = React.useState(false);
    const previousActiveElement = React.useRef<HTMLElement | null>(null);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    React.useEffect(() => {
        if (isOpen) {
            previousActiveElement.current = document.activeElement as HTMLElement;
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            previousActiveElement.current?.focus();
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!mounted) return null;

    const slideVariants = {
        left: {
            initial: { x: '-100%' },
            animate: { x: 0 },
            exit: { x: '-100%' },
        },
        right: {
            initial: { x: '100%' },
            animate: { x: 0 },
            exit: { x: '100%' },
        },
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 z-[400] flex"
                    role="dialog"
                    aria-modal="true"
                >
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 bg-black/70"
                        onClick={onClose}
                    />

                    {/* Drawer Content */}
                    <motion.div
                        initial={slideVariants[side].initial}
                        animate={slideVariants[side].animate}
                        exit={slideVariants[side].exit}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className={cn(
                            'relative h-full w-full border-neutral-700 bg-neutral-900 shadow-xl',
                            side === 'left' ? 'border-r' : 'ml-auto border-l',
                            sizeClasses[size]
                        )}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-neutral-700 px-6 py-4">
                            <div>
                                {title && (
                                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                                )}
                                {description && (
                                    <p className="mt-1 text-sm text-neutral-400">{description}</p>
                                )}
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="h-8 w-8 text-neutral-400 hover:text-white"
                                aria-label="Close drawer"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Body */}
                        <div className="h-[calc(100%-73px)] overflow-y-auto px-6 py-4">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
