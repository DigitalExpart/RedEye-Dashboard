'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4">
            <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-500/20">
                    <AlertCircle className="h-8 w-8 text-error-500" />
                </div>
                <h2 className="mt-6 text-2xl font-semibold text-white">
                    Something went wrong!
                </h2>
                <p className="mt-2 text-neutral-400">
                    An unexpected error occurred. Please try again.
                </p>
                <div className="mt-6 flex items-center justify-center gap-4">
                    <Button onClick={reset}>Try again</Button>
                    <Button variant="outline" onClick={() => window.location.href = '/'}>
                        Go home
                    </Button>
                </div>
            </div>
        </div>
    );
}
