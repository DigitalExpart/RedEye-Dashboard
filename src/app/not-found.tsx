import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 px-4">
            <div className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-800">
                    <FileQuestion className="h-8 w-8 text-neutral-400" />
                </div>
                <h1 className="mt-6 text-6xl font-bold text-white">404</h1>
                <h2 className="mt-2 text-xl font-semibold text-white">Page not found</h2>
                <p className="mt-2 text-neutral-400">
                    The page you&apos;re looking for doesn&apos;t exist or has been moved.
                </p>
                <div className="mt-6">
                    <Button asChild>
                        <Link href="/dashboard">Back to Dashboard</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
