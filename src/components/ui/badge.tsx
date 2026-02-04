import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
    {
        variants: {
            variant: {
                default: 'bg-neutral-700 text-neutral-200',
                primary: 'bg-primary-600/20 text-primary-400 border border-primary-600/30',
                success: 'bg-success-500/20 text-success-500 border border-success-500/30',
                warning: 'bg-warning-500/20 text-warning-500 border border-warning-500/30',
                error: 'bg-error-500/20 text-error-500 border border-error-500/30',
                info: 'bg-info-500/20 text-info-500 border border-info-500/30',
                outline: 'border border-neutral-600 text-neutral-300',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    }
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

// Status Badge with indicator dot
export interface StatusBadgeProps {
    status: 'online' | 'offline' | 'idle';
    showText?: boolean;
    className?: string;
}

function StatusBadge({ status, showText = true, className }: StatusBadgeProps) {
    const statusConfig = {
        online: {
            dot: 'bg-green-500',
            text: 'Online',
            variant: 'success' as const,
        },
        offline: {
            dot: 'bg-neutral-500',
            text: 'Offline',
            variant: 'default' as const,
        },
        idle: {
            dot: 'bg-yellow-500',
            text: 'Idle',
            variant: 'warning' as const,
        },
    };

    const config = statusConfig[status];

    return (
        <Badge variant={config.variant} className={cn('gap-1.5', className)}>
            <span
                className={cn('h-2 w-2 rounded-full', config.dot)}
                aria-hidden="true"
            />
            {showText && <span>{config.text}</span>}
            {!showText && <span className="sr-only">{config.text}</span>}
        </Badge>
    );
}

export { Badge, badgeVariants, StatusBadge };
