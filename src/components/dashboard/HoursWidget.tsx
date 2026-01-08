'use client';

import { Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface HoursWidgetProps {
    totalHours: number;
    targetHours: number;
    monthlyTrend: number;
}

export default function HoursWidget({ totalHours, targetHours, monthlyTrend }: HoursWidgetProps) {
    const percentage = Math.min((totalHours / targetHours) * 100, 100);
    const isOnTrack = totalHours >= targetHours * 0.8;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-olive-50 dark:bg-olive-900/20 rounded-xl">
                        <Clock className="w-6 h-6 text-olive-600 dark:text-olive-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Horas del Mes</h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Objetivo: {targetHours}h</p>
                    </div>
                </div>
                {isOnTrack ? (
                    <div className="flex items-center space-x-1 text-success-600 dark:text-success-400">
                        <TrendingUp size={16} />
                        <span className="text-xs font-bold">En camino</span>
                    </div>
                ) : (
                    <div className="flex items-center space-x-1 text-error-600 dark:text-error-400">
                        <AlertCircle size={16} />
                        <span className="text-xs font-bold">Atención</span>
                    </div>
                )}
            </div>

            {/* Gráfico Circular */}
            <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="transform -rotate-90 w-32 h-32">
                    {/* Background circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        className="text-neutral-100 dark:text-neutral-800"
                    />
                    {/* Progress circle */}
                    <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                        className={isOnTrack ? 'text-olive-600 dark:text-olive-500' : 'text-error-600 dark:text-error-500'}
                        strokeLinecap="round"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-neutral-900 dark:text-neutral-100">{totalHours}</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">horas</span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-neutral-600 dark:text-neutral-400 font-medium">Progreso</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{percentage.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className={`h-full rounded-full ${isOnTrack ? 'bg-olive-600 dark:bg-olive-500' : 'bg-error-600 dark:bg-error-500'}`}
                    />
                </div>
                <div className="flex justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span>Faltan {Math.max(targetHours - totalHours, 0).toFixed(1)}h</span>
                    {monthlyTrend !== 0 && (
                        <span className={monthlyTrend > 0 ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}>
                            {monthlyTrend > 0 ? '+' : ''}{monthlyTrend.toFixed(1)}h vs mes anterior
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
