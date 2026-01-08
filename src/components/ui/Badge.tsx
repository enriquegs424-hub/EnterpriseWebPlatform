interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'olive';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    pulse?: boolean;
}

export default function Badge({
    children,
    variant = 'default',
    size = 'md',
    className = '',
    pulse = false
}: BadgeProps) {
    const variants = {
        default: 'bg-neutral-100 text-neutral-800 border-neutral-200',
        success: 'bg-success-100 text-success-800 border-success-200',
        error: 'bg-error-100 text-error-800 border-error-200',
        warning: 'bg-orange-100 text-orange-800 border-orange-200',
        info: 'bg-blue-100 text-blue-800 border-blue-200',
        olive: 'bg-olive-100 text-olive-800 border-olive-200'
    };

    const sizes = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5'
    };

    return (
        <span
            className={`
                inline-flex items-center justify-center
                font-bold rounded-full border
                ${variants[variant]}
                ${sizes[size]}
                ${pulse ? 'animate-pulse' : ''}
                ${className}
            `}
        >
            {children}
        </span>
    );
}

// Notification Badge (with count)
export function NotificationBadge({ count, max = 99 }: { count: number; max?: number }) {
    if (count === 0) return null;

    const displayCount = count > max ? `${max}+` : count;

    return (
        <Badge
            variant="error"
            size="sm"
            className="absolute -top-1 -right-1 min-w-[20px] h-5"
            pulse={count > 0}
        >
            {displayCount}
        </Badge>
    );
}

// Status Badge
export function StatusBadge({
    status
}: {
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
}) {
    const config = {
        PENDING: { label: 'Pendiente', variant: 'warning' as const },
        IN_PROGRESS: { label: 'En Progreso', variant: 'info' as const },
        COMPLETED: { label: 'Completado', variant: 'success' as const },
        CANCELLED: { label: 'Cancelado', variant: 'default' as const }
    };

    const { label, variant } = config[status];

    return <Badge variant={variant}>{label}</Badge>;
}

// Priority Badge
export function PriorityBadge({
    priority
}: {
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
}) {
    const config = {
        LOW: { label: 'Baja', variant: 'default' as const },
        MEDIUM: { label: 'Media', variant: 'info' as const },
        HIGH: { label: 'Alta', variant: 'warning' as const },
        URGENT: { label: 'Urgente', variant: 'error' as const }
    };

    const { label, variant } = config[priority];

    return <Badge variant={variant}>{label}</Badge>;
}
