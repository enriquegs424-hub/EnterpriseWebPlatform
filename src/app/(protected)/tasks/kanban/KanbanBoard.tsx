'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import KanbanCard from './KanbanCard';
import { Plus } from 'lucide-react';

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

interface Column {
    id: string;
    title: string;
    status: string;
    color: string;
    tasks: Task[];
}

interface KanbanBoardProps {
    initialTasks: Task[];
    onUpdateStatus: (taskId: string, newStatus: string) => void;
    onEdit?: (task: Task) => void;
    onDelete?: (taskId: string) => void;
    onCreateTask?: (status: string) => void;
}

export default function KanbanBoard({
    initialTasks,
    onUpdateStatus,
    onEdit,
    onDelete,
    onCreateTask
}: KanbanBoardProps) {
    const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

    const columns: Column[] = [
        {
            id: 'pending',
            title: 'Pendiente',
            status: 'PENDING',
            color: 'neutral',
            tasks: initialTasks.filter(t => t.status === 'PENDING')
        },
        {
            id: 'in-progress',
            title: 'En Progreso',
            status: 'IN_PROGRESS',
            color: 'info',
            tasks: initialTasks.filter(t => t.status === 'IN_PROGRESS')
        },
        {
            id: 'completed',
            title: 'Completada',
            status: 'COMPLETED',
            color: 'success',
            tasks: initialTasks.filter(t => t.status === 'COMPLETED')
        }
    ];

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggedTaskId(taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, newStatus: string) => {
        e.preventDefault();
        if (draggedTaskId) {
            onUpdateStatus(draggedTaskId, newStatus);
            setDraggedTaskId(null);
        }
    };

    const getColumnHeaderColor = (color: string) => {
        switch (color) {
            case 'neutral': return 'bg-neutral-100 text-neutral-700';
            case 'info': return 'bg-info-100 text-info-700';
            case 'success': return 'bg-success-100 text-success-700';
            default: return 'bg-neutral-100 text-neutral-700';
        }
    };

    const getColumnBorderColor = (color: string) => {
        switch (color) {
            case 'neutral': return 'border-neutral-200';
            case 'info': return 'border-info-200';
            case 'success': return 'border-success-200';
            default: return 'border-neutral-200';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => (
                <div
                    key={column.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.status)}
                    className={`bg-neutral-50 rounded-2xl p-4 border-2 ${getColumnBorderColor(column.color)} min-h-[600px]`}
                >
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <h3 className={`font-bold px-4 py-2 rounded-xl ${getColumnHeaderColor(column.color)}`}>
                                {column.title}
                            </h3>
                            <span className="text-sm font-bold text-neutral-500">
                                {column.tasks.length}
                            </span>
                        </div>
                        {onCreateTask && (
                            <button
                                onClick={() => onCreateTask(column.status)}
                                className="p-2 hover:bg-white rounded-lg transition-all"
                                title="Nueva tarea"
                            >
                                <Plus size={18} className="text-neutral-400" />
                            </button>
                        )}
                    </div>

                    {/* Tasks */}
                    <div className="space-y-3">
                        <AnimatePresence>
                            {column.tasks.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-12"
                                >
                                    <p className="text-neutral-400 text-sm font-medium">
                                        Sin tareas
                                    </p>
                                </motion.div>
                            ) : (
                                column.tasks.map((task) => (
                                    <KanbanCard
                                        key={task.id}
                                        task={task}
                                        onDragStart={handleDragStart}
                                        onEdit={onEdit}
                                        onDelete={onDelete}
                                    />
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Drop Zone Indicator */}
                    {draggedTaskId && (
                        <div className="mt-4 p-4 border-2 border-dashed border-neutral-300 rounded-xl text-center text-neutral-400 text-sm">
                            Soltar aquí para mover a "{column.title}"
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
