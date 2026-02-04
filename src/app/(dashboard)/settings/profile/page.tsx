'use client';

import * as React from 'react';
import { User, Mail, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, useToast } from '@/components/ui';
import { useAuth } from '@/providers';
import { profileSchema } from '@/lib/utils/validation';

export default function ProfilePage() {
    const { user, refetch } = useAuth();
    const { success, error: showError } = useToast();

    const [username, setUsername] = React.useState(user?.username || '');
    const [email, setEmail] = React.useState(user?.email || '');
    const [errors, setErrors] = React.useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = React.useState(false);

    React.useEffect(() => {
        if (user) {
            setUsername(user.username);
            setEmail(user.email);
        }
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        const result = profileSchema.safeParse({ username, email });
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
            // await updateProfile({ username, email });
            success('Profile updated', 'Your changes have been saved');
            refetch();
        } catch (err) {
            showError('Update failed', err instanceof Error ? err.message : 'Please try again');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Avatar */}
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-600 text-2xl font-bold text-white">
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p className="font-medium text-white">{user?.username}</p>
                            <p className="text-sm text-neutral-400 capitalize">{user?.role}</p>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                            label="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            error={errors.username}
                            leftIcon={<User className="h-4 w-4" />}
                            disabled={isLoading}
                        />
                        <Input
                            type="email"
                            label="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            error={errors.email}
                            leftIcon={<Mail className="h-4 w-4" />}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" isLoading={isLoading}>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
