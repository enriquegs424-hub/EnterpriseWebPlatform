'use client';

import { useState, useEffect } from 'react';
import { getAllTasks } from '../actions';
import CalendarView from './CalendarView';
import { LayoutList, Calendar as CalendarIcon, LayoutGrid } from 'lucide-react';
import Link from 'next/link';

export default function CalendarPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setLoading(true);
        const data = await getAllTasks();
        setTasks(data);
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900">Vista Calendario</h1>
                    <p className="text-neutral-500 font-medium mt-1">
                        Visualiza tus tareas por fecha
                    </p>
                </div>

                {/* View Switcher */}
                <div className="flex items-center space-x-2 bg-neutral-100 p-1 rounded-xl">
                    <Link
                        href="/tasks"
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white transition-all"
                        title="Vista Lista"
                    >
                        <LayoutList size={20} className="text-neutral-600" />
                    </Link>
                    <Link
                        href="/tasks/kanban"
                        className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white transition-all"
                        title="Vista Kanban"
                    >
                        <LayoutGrid size={20} className="text-neutral-600" />
                    </Link>
                    <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                        <CalendarIcon size={20} className="text-olive-600" />
                    </div>
                </div>
            </div>

            {/* Calendar */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-olive-600 border-t-transparent"></div>
                    <p className="mt-4 text-neutral-500 font-medium">Cargando calendario...</p>
                </div>
            ) : (
                <CalendarView tasks={tasks} />
            )}
        </div>
    );
}
