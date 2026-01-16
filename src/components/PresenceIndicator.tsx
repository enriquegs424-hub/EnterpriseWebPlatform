'use client';

// Define locally until Prisma client is regenerated
export type PresenceStatus = 'AVAILABLE' | 'BUSY' | 'DO_NOT_DISTURB' | 'BE_RIGHT_BACK' | 'AWAY' | 'OFFLINE';

const PRESENCE_COLORS: Record<PresenceStatus, { bg: string; ring: string }> = {
    AVAILABLE: { bg: 'bg-green-500', ring: 'ring-green-400' },
    BUSY: { bg: 'bg-red-500', ring: 'ring-red-400' },
    DO_NOT_DISTURB: { bg: 'bg-red-500', ring: 'ring-red-400' },
    BE_RIGHT_BACK: { bg: 'bg-yellow-500', ring: 'ring-yellow-400' },
    AWAY: { bg: 'bg-yellow-500', ring: 'ring-yellow-400' },
    OFFLINE: { bg: 'bg-gray-400', ring: 'ring-gray-300' },
};

interface PresenceIndicatorProps {
    status: PresenceStatus;
    size?: 'sm' | 'md' | 'lg';
    showRing?: boolean;
    className?: string;
}

export default function PresenceIndicator({
    status,
    size = 'md',
    showRing = false,
    className = ''
}: PresenceIndicatorProps) {
    const colors = PRESENCE_COLORS[status] || PRESENCE_COLORS.OFFLINE;

    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    return (
        <span
            className={`
                inline-block rounded-full
                ${colors.bg}
                ${sizeClasses[size]}
                ${showRing ? `ring-2 ${colors.ring} ring-offset-1 ring-offset-white dark:ring-offset-neutral-800` : ''}
                ${className}
            `}
            title={status.replace(/_/g, ' ')}
        />
    );
}

// Export presence labels for UI
export const PRESENCE_LABELS: Record<PresenceStatus, string> = {
    AVAILABLE: 'Disponible',
    BUSY: 'Ocupado',
    DO_NOT_DISTURB: 'No molestar',
    BE_RIGHT_BACK: 'Vuelvo enseguida',
    AWAY: 'Ausente',
    OFFLINE: 'Desconectado',
};
