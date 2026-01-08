import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'secondary';
    };
    className?: string;
    children?: ReactNode;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    className = '',
    children
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex flex-col items-center justify-center py-16 px-6 ${className}`}
            role="status"
            aria-live="polite"
        >
            {/* Icon Container */}
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-olive-100 dark:bg-olive-900/30 rounded-full blur-2xl opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-br from-olive-50 to-olive-100 dark:from-olive-900/50 dark:to-olive-900/30 p-6 rounded-full border-2 border-olive-200 dark:border-olive-800 shadow-lg">
                    <Icon className="w-12 h-12 text-olive-600 dark:text-olive-400" strokeWidth={1.5} />
                </div>
            </div>

            {/* Text Content */}
            <h3 className="text-xl font-bold text-theme-primary mb-2 text-center">
                {title}
            </h3>
            <p className="text-theme-secondary text-center max-w-md mb-8">
                {description}
            </p>

            {/* Action Button */}
            {action && (
                <button
                    onClick={action.onClick}
                    className={`
                        px-6 py-3 rounded-xl font-bold transition-all duration-200
                        ${action.variant === 'secondary'
                            ? 'surface-secondary text-theme-primary border-2 border-theme-primary hover:surface-tertiary'
                            : 'bg-olive-600 text-white hover:bg-olive-700 shadow-lg hover:shadow-xl'
                        }
                    `}
                    aria-label={action.label}
                >
                    {action.label}
                </button>
            )}

            {/* Custom children */}
            {children}
        </motion.div>
    );
}

// Preset Empty States
export function NoResultsState({
    searchQuery,
    onClear
}: {
    searchQuery?: string;
    onClear?: () => void;
}) {
    const { Search } = require('lucide-react');

    return (
        <EmptyState
            icon={Search}
            title="No se encontraron resultados"
            description={
                searchQuery
                    ? `No encontramos nada para "${searchQuery}". Intenta con otros términos.`
                    : "No hay resultados que coincidan con tu búsqueda."
            }
            action={onClear ? {
                label: "Limpiar búsqueda",
                onClick: onClear,
                variant: 'secondary'
            } : undefined}
        />
    );
}

export function NoDataState({
    onAction,
    actionLabel = "Crear nuevo"
}: {
    onAction?: () => void;
    actionLabel?: string;
}) {
    const { Database } = require('lucide-react');

    return (
        <EmptyState
            icon={Database}
            title="Aún no hay datos"
            description="Comienza creando tu primer elemento para ver tu contenido aquí."
            action={onAction ? {
                label: actionLabel,
                onClick: onAction
            } : undefined}
        />
    );
}
