'use client';

import { CheckSquare, Clock, Flag } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Task {
    id: string;
    title: string;
    priority: string;
    dueDate?: Date | null;
    project?: {
        code: string;
        name: string;
    } | null;
}

interface TasksWidgetProps {
    tasks: Task[];
}

export default function TasksWidget({ tasks }: TasksWidgetProps) {
    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'text-error-600 bg-error-50';
            case 'HIGH': return 'text-orange-600 bg-orange-50';
            case 'MEDIUM': return 'text-info-600 bg-info-50';
            case 'LOW': return 'text-neutral-600 bg-neutral-50';
            default: return 'text-neutral-600 bg-neutral-50';
        }
    };

    const isOverdue = (dueDate?: Date) => {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-md transition-all"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <div className="p-3 bg-info-50 rounded-xl">
                        <CheckSquare className="w-6 h-6 text-info-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-neutral-900">Mis Tareas</h3>
                        <p className="text-sm text-neutral-500">{tasks.length} pendientes</p>
                    </div>
                </div>
                <Link
                    href="/tasks"
                    className="text-sm font-bold text-olive-600 hover:text-olive-700 transition-colors"
                >
                    Ver todas →
                </Link>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
                {tasks.length === 0 ? (
                    <div className="text-center py-12">
                        <CheckSquare size={48} className="mx-auto text-neutral-200 mb-3" />
                        <p className="text-neutral-400 font-medium">¡Sin tareas pendientes!</p>
                        <p className="text-sm text-neutral-400 mt-1">Buen trabajo 🎉</p>
                    </div>
                ) : (
                    tasks.map((task, index) => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-all cursor-pointer border border-neutral-100"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                        </span>
                                        {task.project && (
                                            <span className="text-xs text-neutral-500 font-medium">
                                                {task.project.code}
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="font-bold text-neutral-900 text-sm mb-1 line-clamp-2">
                                        {task.title}
                                    </h4>
                                    {task.dueDate && (
                                        <div className={`flex items-center space-x-1 text-xs ${isOverdue(task.dueDate) ? 'text-error-600' : 'text-neutral-500'}`}>
                                            <Clock size={12} />
                                            <span className="font-medium">
                                                {isOverdue(task.dueDate) ? 'Vencida: ' : 'Vence: '}
                                                {new Date(task.dueDate).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short'
                                                })}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {tasks.length > 0 && (
                <Link
                    href="/tasks"
                    className="mt-4 block w-full py-3 bg-olive-50 hover:bg-olive-100 text-olive-700 font-bold text-center rounded-xl transition-all"
                >
                    Gestionar Tareas
                </Link>
            )}
        </motion.div>
    );
}
