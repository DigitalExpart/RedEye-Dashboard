import { Skeleton } from '@/components/ui';

export default function Loading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-neutral-950">
            <div className="flex flex-col items-center gap-4">
                <div className="relative h-12 w-12">
                    <div className="absolute inset-0 rounded-full border-4 border-neutral-700" />
                    <div className="absolute inset-0 rounded-full border-4 border-primary-500 border-t-transparent animate-spin" />
                </div>
                <p className="text-sm text-neutral-400">Loading...</p>
            </div>
        </div>
    );
}
