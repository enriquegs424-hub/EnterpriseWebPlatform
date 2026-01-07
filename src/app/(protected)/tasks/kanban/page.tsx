'use client';

import { useState, useEffect } from 'react';
import { getAllTasks, updateTask, deleteTask } from '../actions';
import KanbanBoard from './KanbanBoard';
import { Filter, Search, X, Plus, LayoutList, LayoutGrid, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function KanbanPage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        priority: '',
        assignedToId: '',
        projectId: ''
    });

    useEffect(() => {
        loadTasks();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [tasks, searchQuery, filters]);

    const loadTasks = async () => {
        setLoading(true);
        const data = await getAllTasks();
        setTasks(data);
        setLoading(false);
    };

    const applyFilters = () => {
        let filtered = [...tasks];

        // Search
        if (searchQuery) {
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Priority filter
        if (filters.priority) {
            filtered = filtered.filter(task => task.priority === filters.priority);
        }

        // Assigned to filter
        if (filters.assignedToId) {
            filtered = filtered.filter(task => task.assignedToId === filters.assignedToId);
        }

        // Project filter
        if (filters.projectId) {
            filtered = filtered.filter(task => task.projectId === filters.projectId);
        }

        setFilteredTasks(filtered);
    };

    const handleUpdateStatus = async (taskId: string, newStatus: string) => {
        const result = await updateTask(taskId, { status: newStatus });
        if (result.success) {
            loadTasks();
        }
    };

    const handleDelete = async (taskId: string) => {
        const result = await deleteTask(taskId);
        if (result.success) {
            loadTasks();
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setFilters({
            priority: '',
            assignedToId: '',
            projectId: ''
        });
    };

    const hasActiveFilters = searchQuery || filters.priority || filters.assignedToId || filters.projectId;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900">Vista Kanban</h1>
                    <p className="text-neutral-500 font-medium mt-1">
                        Gestiona tus tareas visualmente
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* View Switcher */}
                    <div className="flex items-center space-x-2 bg-neutral-100 p-1 rounded-xl">
                        <Link
                            href="/tasks"
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white transition-all"
                            title="Vista Lista"
                        >
                            <LayoutList size={20} className="text-neutral-600" />
                        </Link>
                        <div className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-sm">
                            <LayoutGrid size={20} className="text-olive-600" />
                        </div>
                        <Link
                            href="/tasks/calendar"
                            className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-white transition-all"
                            title="Vista Calendario"
                        >
                            <Calendar size={20} className="text-neutral-600" />
                        </Link>
                    </div>

                    {/* New Task Button */}
                    <Link
                        href="/tasks"
                        className="flex items-center space-x-2 bg-olive-600 hover:bg-olive-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-olive-600/20"
                    >
                        <Plus size={20} />
                        <span>Nueva Tarea</span>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <Filter className="w-5 h-5 text-neutral-400" />
                        <h3 className="font-bold text-neutral-900">Filtros y Búsqueda</h3>
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm font-bold text-error-600 hover:text-error-700 flex items-center space-x-1"
                        >
                            <X size={16} />
                            <span>Limpiar filtros</span>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Buscar tareas..."
                            className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-sm"
                        />
                    </div>

                    {/* Priority Filter */}
                    <select
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                        className="px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-sm"
                    >
                        <option value="">Todas las prioridades</option>
                        <option value="URGENT">Urgente</option>
                        <option value="HIGH">Alta</option>
                        <option value="MEDIUM">Media</option>
                        <option value="LOW">Baja</option>
                    </select>

                    {/* Placeholder filters - will be populated dynamically */}
                    <select
                        value={filters.assignedToId}
                        onChange={(e) => setFilters({ ...filters, assignedToId: e.target.value })}
                        className="px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-sm"
                    >
                        <option value="">Todos los usuarios</option>
                    </select>

                    <select
                        value={filters.projectId}
                        onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
                        className="px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-sm"
                    >
                        <option value="">Todos los proyectos</option>
                    </select>
                </div>

                {/* Results count */}
                <div className="mt-4 text-sm text-neutral-500">
                    Mostrando <span className="font-bold text-neutral-900">{filteredTasks.length}</span> de{' '}
                    <span className="font-bold text-neutral-900">{tasks.length}</span> tareas
                </div>
            </div>

            {/* Kanban Board */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-olive-600 border-t-transparent"></div>
                    <p className="mt-4 text-neutral-500 font-medium">Cargando tareas...</p>
                </div>
            ) : (
                <KanbanBoard
                    initialTasks={filteredTasks}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}
