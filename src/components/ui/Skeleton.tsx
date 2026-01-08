interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    animate?: boolean;
}

export default function Skeleton({
    className = '',
    variant = 'text',
    width,
    height,
    animate = true
}: SkeletonProps) {
    const baseClasses = animate ? 'animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%]' : 'bg-neutral-200';

    const variantClasses = {
        text: 'rounded',
        circular: 'rounded-full',
        rectangular: 'rounded-lg'
    };

    const style: React.CSSProperties = {};
    if (width) style.width = typeof width === 'number' ? `${width}px` : width;
    if (height) style.height = typeof height === 'number' ? `${height}px` : height;

    return (
        <div
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            style={style}
            role="status"
            aria-label="Cargando contenido..."
        />
    );
}

// Skeleton presets for common use cases
export function CardSkeleton() {
    return (
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
            <div className="flex items-center space-x-4">
                <Skeleton variant="circular" width={48} height={48} />
                <div className="flex-1 space-y-2">
                    <Skeleton width="60%" height={20} />
                    <Skeleton width="40%" height={16} />
                </div>
            </div>
            <Skeleton width="100%" height={100} variant="rectangular" />
            <div className="flex justify-between">
                <Skeleton width="30%" height={16} />
                <Skeleton width="20%" height={16} />
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
            {/* Header */}
            <div className="border-b border-neutral-200 p-4 flex space-x-4">
                <Skeleton width="20%" height={16} />
                <Skeleton width="30%" height={16} />
                <Skeleton width="25%" height={16} />
                <Skeleton width="15%" height={16} />
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="border-b border-neutral-100 p-4 flex space-x-4">
                    <Skeleton width="20%" height={20} />
                    <Skeleton width="30%" height={20} />
                    <Skeleton width="25%" height={20} />
                    <Skeleton width="15%" height={20} />
                </div>
            ))}
        </div>
    );
}

export function DocumentGridSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-4">
                    <div className="flex items-center justify-center h-32 bg-neutral-100 rounded-xl">
                        <Skeleton variant="rectangular" width={80} height={80} />
                    </div>
                    <Skeleton width="80%" height={20} />
                    <Skeleton width="60%" height={16} />
                    <div className="flex justify-between pt-2">
                        <Skeleton width="40%" height={14} />
                        <Skeleton width="30%" height={14} />
                    </div>
                </div>
            ))}
        </div>
    );
}
