'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';

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
}

interface CalendarViewProps {
    tasks: Task[];
    onTaskClick?: (task: Task) => void;
}

export default function CalendarView({ tasks, onTaskClick }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentDate);

    const previousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1));
    };

    const getTasksForDay = (day: number) => {
        return tasks.filter(task => {
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return (
                taskDate.getDate() === day &&
                taskDate.getMonth() === month &&
                taskDate.getFullYear() === year
            );
        });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-error-600';
            case 'HIGH': return 'bg-orange-600';
            case 'MEDIUM': return 'bg-info-600';
            case 'LOW': return 'bg-neutral-400';
            default: return 'bg-neutral-400';
        }
    };

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const isToday = (day: number) => {
        const today = new Date();
        return (
            day === today.getDate() &&
            month === today.getMonth() &&
            year === today.getFullYear()
        );
    };

    return (
        <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-6 h-6 text-olive-600" />
                    <h2 className="text-2xl font-black text-neutral-900">
                        {monthNames[month]} {year}
                    </h2>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={previousMonth}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
                    >
                        <ChevronLeft size={20} className="text-neutral-600" />
                    </button>
                    <button
                        onClick={() => setCurrentDate(new Date())}
                        className="px-4 py-2 text-sm font-bold text-olive-600 hover:bg-olive-50 rounded-lg transition-all"
                    >
                        Hoy
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-all"
                    >
                        <ChevronRight size={20} className="text-neutral-600" />
                    </button>
                </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-neutral-500 uppercase py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {/* Empty cells for days before month starts */}
                {Array.from({ length: startingDayOfWeek }).map((_, index) => (
                    <div key={`empty-${index}`} className="aspect-square" />
                ))}

                {/* Days of the month */}
                {Array.from({ length: daysInMonth }).map((_, index) => {
                    const day = index + 1;
                    const dayTasks = getTasksForDay(day);
                    const today = isToday(day);

                    return (
                        <motion.div
                            key={day}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.01 }}
                            className={`aspect-square border-2 rounded-xl p-2 transition-all hover:shadow-md ${today
                                    ? 'border-olive-600 bg-olive-50'
                                    : dayTasks.length > 0
                                        ? 'border-neutral-200 bg-white hover:border-olive-300'
                                        : 'border-neutral-100 bg-neutral-50'
                                }`}
                        >
                            <div className="flex flex-col h-full">
                                {/* Day number */}
                                <div className={`text-sm font-bold mb-1 ${today ? 'text-olive-700' : 'text-neutral-900'
                                    }`}>
                                    {day}
                                </div>

                                {/* Tasks */}
                                <div className="flex-1 space-y-1 overflow-y-auto">
                                    {dayTasks.slice(0, 3).map(task => (
                                        <button
                                            key={task.id}
                                            onClick={() => onTaskClick?.(task)}
                                            className={`w-full text-left px-2 py-1 rounded text-xs font-medium text-white truncate ${getPriorityColor(task.priority)} hover:opacity-80 transition-all`}
                                            title={task.title}
                                        >
                                            {task.title}
                                        </button>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <div className="text-xs text-neutral-500 font-bold px-2">
                                            +{dayTasks.length - 3} más
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
                <p className="text-xs font-bold text-neutral-500 uppercase mb-3">Leyenda de Prioridades</p>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-error-600"></div>
                        <span className="text-sm text-neutral-600">Urgente</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-orange-600"></div>
                        <span className="text-sm text-neutral-600">Alta</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-info-600"></div>
                        <span className="text-sm text-neutral-600">Media</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-neutral-400"></div>
                        <span className="text-sm text-neutral-600">Baja</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
