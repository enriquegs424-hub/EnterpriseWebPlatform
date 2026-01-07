'use client';

import { useState, useEffect } from 'react';
import { getAllTasks, createTask, updateTask, deleteTask, getTaskStats } from '@/app/(protected)/tasks/actions';
import { getAllUsers } from '@/app/admin/actions';
import { getAllProjects } from '@/app/admin/actions';
import {
    CheckSquare, Plus, Filter, Calendar, User, Flag,
    Clock, MessageSquare, Trash2, Edit2, X, AlertCircle,
    LayoutList, LayoutGrid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import TaskDetailsModal from '@/components/tasks/TaskDetailsModal';
import KanbanBoard from '@/app/(protected)/tasks/kanban/KanbanBoard';
import CalendarView from '@/app/(protected)/tasks/calendar/CalendarView';

type ViewMode = 'list' | 'kanban' | 'calendar';

interface TasksViewProps {
    projectId?: string;
}

export default function TasksView({ projectId }: TasksViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [tasks, setTasks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        assignedToId: '',
        projectId: projectId || ''
    });

    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'MEDIUM',
        type: 'GENERAL',
        dueDate: '',
        assignedToId: '',
        projectId: projectId || ''
    });

    useEffect(() => {
        fetchData();
    }, [filters, projectId]);

    const fetchData = async () => {
        setLoading(true);
        // Force projectId filter if prop is passed
        const activeFilters = projectId ? { ...filters, projectId } : filters;

        const [tasksData, usersData, projectsData, statsData] = await Promise.all([
            getAllTasks(activeFilters),
            getAllUsers(),
            getAllProjects(),
            getTaskStats(projectId)
        ]);
        setTasks(tasksData);
        setUsers(usersData);
        setProjects(projectsData);
        setStats(statsData);
        setLoading(false);
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await createTask({ ...newTask, projectId: projectId || newTask.projectId });
        if (result.success) {
            setShowCreateModal(false);
            setNewTask({
                title: '',
                description: '',
                priority: 'MEDIUM',
                type: 'GENERAL',
                dueDate: '',
                assignedToId: '',
                projectId: projectId || ''
            });
            fetchData();
        }
    };

    const handleUpdateStatus = async (taskId: string, status: string) => {
        await updateTask(taskId, { status });
        fetchData();
    };

    const handleDeleteTask = async (taskId: string) => {
        if (confirm('¿Eliminar esta tarea?')) {
            await deleteTask(taskId);
            fetchData();
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'URGENT': return 'bg-error-50 text-error-700 border-error-200';
            case 'HIGH': return 'bg-orange-50 text-orange-700 border-orange-200';
            case 'MEDIUM': return 'bg-info-50 text-info-700 border-info-200';
            case 'LOW': return 'bg-neutral-50 text-neutral-600 border-neutral-200';
            default: return 'bg-neutral-50 text-neutral-600';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-success-50 text-success-700';
            case 'IN_PROGRESS': return 'bg-info-50 text-info-700';
            case 'PENDING': return 'bg-neutral-50 text-neutral-600';
            case 'CANCELLED': return 'bg-error-50 text-error-700';
            default: return 'bg-neutral-50 text-neutral-600';
        }
    };

    return (
        <div className="space-y-6">
            <TaskDetailsModal
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                onUpdate={() => {
                    setSelectedTask(null);
                    fetchData();
                }}
            />

            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 flex items-center">
                        <CheckSquare className="w-8 h-8 mr-3 text-olive-600" />
                        Tareas {projectId ? ' del Proyecto' : ''}
                    </h1>
                    <p className="text-neutral-500 mt-1 font-medium">Organiza y asigna tareas al equipo</p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* View Switcher */}
                    <div className="flex items-center space-x-2 bg-neutral-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                                }`}
                            title="Vista Lista"
                        >
                            <LayoutList size={20} className={viewMode === 'list' ? 'text-olive-600' : 'text-neutral-600'} />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                                }`}
                            title="Vista Kanban"
                        >
                            <LayoutGrid size={20} className={viewMode === 'kanban' ? 'text-olive-600' : 'text-neutral-600'} />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                                }`}
                            title="Vista Calendario"
                        >
                            <Calendar size={20} className={viewMode === 'calendar' ? 'text-olive-600' : 'text-neutral-600'} />
                        </button>
                    </div>

                    {/* New Task Button */}
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center space-x-2 bg-olive-600 hover:bg-olive-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-olive-600/20"
                    >
                        <Plus size={20} />
                        <span>Nueva Tarea</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm">
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Total</p>
                        <p className="text-3xl font-black text-neutral-900">{stats.total}</p>
                    </div>
                    <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200">
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">Pendientes</p>
                        <p className="text-3xl font-black text-neutral-700">{stats.pending}</p>
                    </div>
                    <div className="bg-info-50 rounded-2xl p-5 border border-info-200">
                        <p className="text-xs font-bold text-info-600 uppercase tracking-wider mb-1">En Progreso</p>
                        <p className="text-3xl font-black text-info-700">{stats.inProgress}</p>
                    </div>
                    <div className="bg-success-50 rounded-2xl p-5 border border-success-200">
                        <p className="text-xs font-bold text-success-600 uppercase tracking-wider mb-1">Completadas</p>
                        <p className="text-3xl font-black text-success-700">{stats.completed}</p>
                    </div>
                    <div className="bg-error-50 rounded-2xl p-5 border border-error-200">
                        <p className="text-xs font-bold text-error-600 uppercase tracking-wider mb-1">Vencidas</p>
                        <p className="text-3xl font-black text-error-700">{stats.overdue}</p>
                    </div>
                </div>
            )}

            {/* Filters - Only show in list view */}
            {viewMode === 'list' && (
                <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                        <Filter className="w-5 h-5 text-neutral-400" />
                        <h3 className="font-bold text-neutral-900">Filtros</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none"
                        >
                            <option value="">Todos los estados</option>
                            <option value="PENDING">Pendiente</option>
                            <option value="IN_PROGRESS">En Progreso</option>
                            <option value="COMPLETED">Completada</option>
                            <option value="CANCELLED">Cancelada</option>
                        </select>
                        <select
                            value={filters.priority}
                            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                            className="px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none"
                        >
                            <option value="">Todas las prioridades</option>
                            <option value="URGENT">Urgente</option>
                            <option value="HIGH">Alta</option>
                            <option value="MEDIUM">Media</option>
                            <option value="LOW">Baja</option>
                        </select>
                        <select
                            value={filters.assignedToId}
                            onChange={(e) => setFilters({ ...filters, assignedToId: e.target.value })}
                            className="px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none"
                        >
                            <option value="">Todos los usuarios</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {/* Content - Switch between views */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-olive-600 border-t-transparent"></div>
                    <p className="mt-4 text-neutral-500 font-medium">Cargando tareas...</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {viewMode === 'list' && (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {tasks.length === 0 ? (
                                <div className="bg-neutral-50 rounded-3xl p-20 text-center border-2 border-dashed border-neutral-200">
                                    <CheckSquare size={64} className="mx-auto text-neutral-200 mb-4" />
                                    <h3 className="text-xl font-bold text-neutral-400 mb-2">Sin tareas</h3>
                                    <p className="text-neutral-400">Crea la primera tarea para empezar</p>
                                </div>
                            ) : (
                                tasks.map((task) => (
                                    <motion.div
                                        key={task.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-3">
                                                    <h3 className="text-lg font-bold text-neutral-900">{task.title}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getPriorityColor(task.priority)}`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(task.status)}`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                {task.description && (
                                                    <p className="text-neutral-600 mb-4">{task.description}</p>
                                                )}
                                                <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                                                    <div className="flex items-center space-x-2">
                                                        <User size={16} className="text-neutral-400" />
                                                        <span>{task.assignedTo.name}</span>
                                                    </div>
                                                    {task.project && (
                                                        <div className="flex items-center space-x-2">
                                                            <Flag size={16} className="text-neutral-400" />
                                                            <span>{task.project.code}</span>
                                                        </div>
                                                    )}
                                                    {task.dueDate && (
                                                        <div className="flex items-center space-x-2">
                                                            <Calendar size={16} className="text-neutral-400" />
                                                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                                                        </div>
                                                    )}
                                                    {task.comments.length > 0 && (
                                                        <div className="flex items-center space-x-2">
                                                            <MessageSquare size={16} className="text-neutral-400" />
                                                            <span>{task.comments.length} comentarios</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 ml-4">
                                                {task.status !== 'COMPLETED' && (
                                                    <button
                                                        onClick={() => handleUpdateStatus(task.id, task.status === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED')}
                                                        className="p-2 text-success-600 hover:bg-success-50 rounded-lg transition-all"
                                                        title={task.status === 'PENDING' ? 'Iniciar' : 'Completar'}
                                                    >
                                                        <CheckSquare size={20} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setSelectedTask(task)}
                                                    className="p-2 text-neutral-600 hover:bg-neutral-50 rounded-lg transition-all"
                                                    title="Ver detalles"
                                                >
                                                    <Edit2 size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="p-2 text-error-600 hover:bg-error-50 rounded-lg transition-all"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </motion.div>
                    )}

                    {viewMode === 'kanban' && (
                        <motion.div
                            key="kanban"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <KanbanBoard
                                initialTasks={tasks}
                                onUpdateStatus={handleUpdateStatus}
                                onDelete={handleDeleteTask}
                                onEdit={(task) => setSelectedTask(task)}
                            />
                        </motion.div>
                    )}

                    {viewMode === 'calendar' && (
                        <motion.div
                            key="calendar"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <CalendarView
                                tasks={tasks}
                                onTaskClick={(task) => setSelectedTask(task)}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Create Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 border border-neutral-200 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-neutral-900">Nueva Tarea {projectId ? ' del Proyecto' : ''}</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-neutral-400 hover:text-neutral-600 p-2 hover:bg-neutral-100 rounded-lg transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTask} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 mb-2">Título *</label>
                                    <input
                                        type="text"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none"
                                        required
                                        placeholder="Ej: Revisar planos estructurales"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 mb-2">Descripción</label>
                                    <textarea
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none resize-none"
                                        placeholder="Describe los detalles de la tarea..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-2">Prioridad *</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none"
                                            required
                                        >
                                            <option value="LOW">Baja</option>
                                            <option value="MEDIUM">Media</option>
                                            <option value="HIGH">Alta</option>
                                            <option value="URGENT">Urgente</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-2">Tipo *</label>
                                        <select
                                            value={newTask.type}
                                            onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none"
                                            required
                                        >
                                            <option value="GENERAL">General</option>
                                            <option value="PROJECT">Proyecto</option>
                                            <option value="MEETING">Reunión</option>
                                            <option value="REVIEW">Revisión</option>
                                            <option value="MAINTENANCE">Mantenimiento</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-2">Asignar a *</label>
                                        <select
                                            value={newTask.assignedToId}
                                            onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none"
                                            required
                                        >
                                            <option value="">Seleccionar usuario...</option>
                                            {users.filter(u => u.isActive).map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-2">Fecha límite</label>
                                        <input
                                            type="date"
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none"
                                        />
                                    </div>
                                </div>

                                {!projectId && (
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-2">Proyecto (opcional)</label>
                                        <select
                                            value={newTask.projectId}
                                            onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none"
                                        >
                                            <option value="">Sin proyecto asociado</option>
                                            {projects.filter(p => p.isActive).map(p => (
                                                <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateModal(false)}
                                        className="flex-1 px-6 py-3 border border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 font-bold transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-3 bg-olive-600 text-white rounded-xl hover:bg-olive-700 font-bold transition-all shadow-lg shadow-olive-600/20"
                                    >
                                        Crear Tarea
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
