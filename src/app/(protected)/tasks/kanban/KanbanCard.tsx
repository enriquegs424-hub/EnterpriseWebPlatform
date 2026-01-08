'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Flag, User, MessageSquare, Calendar, MoreVertical, Trash2, Edit2 } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    description?: string;
    priority: string;
    status: string;
    dueDate?: Date;
    assignedTo: {
        id: string;
        name: string;
    };
    project?: {
        code: string;
        name: string;
    };
    comments: any[];
}

interface KanbanCardProps {
    task: Task;
    onDragStart: (e: React.DragEvent, taskId: string) => void;
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
}

export default function KanbanCard({ task, onDragStart, onEdit, onDelete }: KanbanCardProps) {
    const [showMenu, setShowMenu] = useState(false);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'border-l-4 border-l-error-600 bg-error-50/30 dark:bg-error-900/10';
            case 'HIGH': return 'border-l-4 border-l-orange-600 bg-orange-50/30 dark:bg-orange-900/10';
            case 'MEDIUM': return 'border-l-4 border-l-info-600 bg-info-50/30 dark:bg-info-900/10';
            case 'LOW': return 'border-l-4 border-l-neutral-400 bg-white dark:bg-neutral-800';
            default: return 'border-l-4 border-l-neutral-400';
        }
    };

    const getPriorityBadgeColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400';
            case 'HIGH': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
            case 'MEDIUM': return 'bg-info-100 text-info-700 dark:bg-info-900/30 dark:text-info-400';
            case 'LOW': return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400';
            default: return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400';
        }
    };

    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            draggable
            onDragStart={(e) => onDragStart(e as any, task.id)}
            onClick={() => onEdit && onEdit(task)}
            className={`bg-white dark:bg-neutral-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer ${getPriorityColor(task.priority)} relative group`}
        >
            {/* Menu Button */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(!showMenu);
                    }}
                    className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                >
                    <MoreVertical size={16} className="text-neutral-400" />
                </button>

                {showMenu && (
                    <div className="absolute right-0 top-8 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 z-10 min-w-[120px]">
                        {onEdit && (
                            <button
                                onClick={() => {
                                    onEdit(task);
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 dark:text-neutral-200 flex items-center space-x-2"
                            >
                                <Edit2 size={14} />
                                <span>Editar</span>
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={() => {
                                    if (confirm('¿Eliminar esta tarea?')) {
                                        onDelete(task.id);
                                    }
                                    setShowMenu(false);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-error-50 dark:hover:bg-error-900/20 text-error-600 dark:text-error-400 flex items-center space-x-2"
                            >
                                <Trash2 size={14} />
                                <span>Eliminar</span>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Priority Badge */}
            <div className="flex items-center justify-between mb-3">
                <span className={`px-2 py-1 rounded-md text-xs font-bold ${getPriorityBadgeColor(task.priority)}`}>
                    {task.priority}
                </span>
                {task.project && (
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{task.project.code}</span>
                )}
            </div>

            {/* Title */}
            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-2 text-sm">
                {task.title}
            </h4>

            {/* Description */}
            {task.description && (
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-3 line-clamp-2">
                    {task.description}
                </p>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center space-x-3">
                    {/* Assigned To */}
                    <div className="flex items-center space-x-1" title={task.assignedTo.name}>
                        <User size={12} />
                        <span className="truncate max-w-[80px]">{task.assignedTo.name.split(' ')[0]}</span>
                    </div>

                    {/* Comments */}
                    {task.comments.length > 0 && (
                        <div className="flex items-center space-x-1">
                            <MessageSquare size={12} />
                            <span>{task.comments.length}</span>
                        </div>
                    )}
                </div>

                {/* Due Date */}
                {task.dueDate && (
                    <div className={`flex items-center space-x-1 ${isOverdue ? 'text-error-600 dark:text-error-400 font-bold' : ''}`}>
                        <Calendar size={12} />
                        <span>
                            {new Date(task.dueDate).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short'
                            })}
                        </span>
                    </div>
                )}
            </div>
        </motion.div>
    );
}
