import { Eye } from 'lucide-react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-neutral-950 flex">
            {/* Left side - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-neutral-900 via-neutral-900 to-primary-950 items-center justify-center p-12">
                <div className="max-w-md text-center">
                    <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-600 shadow-lg shadow-primary-600/30">
                        <Eye className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Red<span className="text-primary-500">EYE</span>
                    </h1>
                    <p className="text-lg text-neutral-400">
                        Android Device Monitoring Dashboard
                    </p>
                    <p className="mt-4 text-sm text-neutral-500">
                        Real-time monitoring and management of your Android device fleet.
                    </p>
                </div>
            </div>

            {/* Right side - Auth Form */}
            <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden text-center mb-8">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-600">
                            <Eye className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white">
                            Red<span className="text-primary-500">EYE</span>
                        </h1>
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
