'use client';

import { Plus, Clock, CheckSquare, BarChart } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function QuickActions() {
    const actions = [
        {
            icon: Clock,
            label: 'Registrar Horas',
            href: '/hours/daily',
            color: 'olive',
            description: 'Añadir entrada de tiempo'
        },
        {
            icon: CheckSquare,
            label: 'Nueva Tarea',
            href: '/tasks',
            color: 'info',
            description: 'Crear tarea rápida'
        },
        {
            icon: BarChart,
            label: 'Ver Resumen',
            href: '/hours/summary',
            color: 'success',
            description: 'Informe mensual'
        }
    ];

    const getColorClasses = (color: string) => {
        switch (color) {
            case 'olive':
                return 'bg-olive-50 hover:bg-olive-100 text-olive-700 border-olive-200';
            case 'info':
                return 'bg-info-50 hover:bg-info-100 text-info-700 border-info-200';
            case 'success':
                return 'bg-success-50 hover:bg-success-100 text-success-700 border-success-200';
            default:
                return 'bg-neutral-50 hover:bg-neutral-100 text-neutral-700 border-neutral-200';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm"
        >
            <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-neutral-50 rounded-xl">
                    <Plus className="w-6 h-6 text-neutral-600" />
                </div>
                <div>
                    <h3 className="font-bold text-neutral-900">Acciones Rápidas</h3>
                    <p className="text-sm text-neutral-500">Atajos frecuentes</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                        <motion.div
                            key={action.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                        >
                            <Link
                                href={action.href}
                                className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all ${getColorClasses(action.color)}`}
                            >
                                <div className="flex-shrink-0">
                                    <Icon size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm">{action.label}</p>
                                    <p className="text-xs opacity-75">{action.description}</p>
                                </div>
                                <div className="flex-shrink-0">
                                    <span className="text-xl">→</span>
                                </div>
                            </Link>
                        </motion.div>
                    );
                })}
            </div>

            {/* Keyboard Shortcuts Hint */}
            <div className="mt-4 p-3 bg-neutral-50 rounded-xl">
                <p className="text-xs text-neutral-500 font-medium mb-2">💡 Atajos de teclado:</p>
                <div className="space-y-1 text-xs text-neutral-600">
                    <div className="flex justify-between">
                        <span>Registrar horas</span>
                        <kbd className="px-2 py-1 bg-white rounded border border-neutral-200 font-mono">Ctrl + H</kbd>
                    </div>
                    <div className="flex justify-between">
                        <span>Nueva tarea</span>
                        <kbd className="px-2 py-1 bg-white rounded border border-neutral-200 font-mono">Ctrl + T</kbd>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
