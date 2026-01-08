'use client';

import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: number; // percentage change
    subtitle?: string;
    variant?: 'default' | 'success' | 'warning' | 'danger';
}

export default function KPICard({
    title,
    value,
    icon: Icon,
    trend,
    subtitle,
    variant = 'default'
}: KPICardProps) {
    const variantStyles = {
        default: 'from-olive-500 to-olive-600',
        success: 'from-green-500 to-green-600',
        warning: 'from-yellow-500 to-yellow-600',
        danger: 'from-red-500 to-red-600'
    };

    const getTrendIcon = () => {
        if (trend === undefined || trend === 0) return Minus;
        return trend > 0 ? TrendingUp : TrendingDown;
    };

    const getTrendColor = () => {
        if (trend === undefined || trend === 0) return 'text-neutral-400';
        return trend > 0 ? 'text-green-600' : 'text-red-600';
    };

    const TrendIcon = getTrendIcon();

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 p-6 overflow-hidden hover:shadow-md transition-shadow"
        >
            {/* Background gradient */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${variantStyles[variant]} opacity-5 rounded-full blur-3xl -mr-16 -mt-16`}></div>

            {/* Content */}
            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                            {title}
                        </p>
                        {subtitle && (
                            <p className="text-xs text-neutral-400 mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${variantStyles[variant]} shadow-lg`}>
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                </div>

                {/* Value */}
                <div className="mb-3">
                    <h3 className="text-4xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                        {value}
                    </h3>
                </div>

                {/* Trend */}
                {trend !== undefined && (
                    <div className={`flex items-center gap-1.5 ${getTrendColor()}`}>
                        <TrendIcon className="w-4 h-4" />
                        <span className="text-sm font-bold">
                            {Math.abs(trend).toFixed(1)}%
                        </span>
                        <span className="text-xs text-neutral-500 ml-1">
                            vs período anterior
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
