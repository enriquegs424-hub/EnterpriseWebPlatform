'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getAllTasks, createTask, updateTask, deleteTask, getTaskStats, getUsersForAssignment } from '@/app/(protected)/tasks/actions';
import { getProjects } from '@/app/(protected)/projects/actions';
import {
    CheckSquare, Plus, Filter, Calendar, User, Flag,
    Clock, MessageSquare, Trash2, Edit2, X, AlertCircle,
    LayoutList, LayoutGrid, ArrowDownLeft, ArrowUpRight
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
    const { data: session } = useSession();
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [filterType, setFilterType] = useState<'all' | 'assigned_to_me' | 'assigned_by_me'>('all'); // New Filter State
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

    // Filter tasks based on the selected filter pill
    const filteredTasks = tasks.filter(task => {
        if (filterType === 'all') return true;

        const isAssignedToMe = task.assignedToId === session?.user?.id;

        if (filterType === 'assigned_to_me') {
            return isAssignedToMe;
        }

        if (filterType === 'assigned_by_me') {
            return task.createdById === session?.user?.id && task.assignedToId !== session?.user?.id;
        }

        return true;
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
            getUsersForAssignment(),
            getProjects(),
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
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 flex items-center">
                        <CheckSquare className="w-8 h-8 mr-3 text-olive-600 dark:text-olive-500" />
                        Tareas {projectId ? ' del Proyecto' : ''}
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 font-medium">Organiza y asigna tareas al equipo</p>
                </div>
                <div className="flex items-center space-x-3">
                    {/* View Switcher */}
                    <div className="flex items-center space-x-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-neutral-700/50'
                                }`}
                            title="Vista Lista"
                        >
                            <LayoutList size={20} className={viewMode === 'list' ? 'text-olive-600 dark:text-olive-400' : 'text-neutral-600 dark:text-neutral-400'} />
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-neutral-700/50'
                                }`}
                            title="Vista Kanban"
                        >
                            <LayoutGrid size={20} className={viewMode === 'kanban' ? 'text-olive-600 dark:text-olive-400' : 'text-neutral-600 dark:text-neutral-400'} />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-neutral-700 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-neutral-700/50'
                                }`}
                            title="Vista Calendario"
                        >
                            <Calendar size={20} className={viewMode === 'calendar' ? 'text-olive-600 dark:text-olive-400' : 'text-neutral-600 dark:text-neutral-400'} />
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
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                        <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Total</p>
                        <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100">{stats.total}</p>
                    </div>
                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700">
                        <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Pendientes</p>
                        <p className="text-3xl font-black text-neutral-700 dark:text-neutral-200">{stats.pending}</p>
                    </div>
                    <div className="bg-info-50 dark:bg-info-900/20 rounded-2xl p-5 border border-info-200 dark:border-info-800">
                        <p className="text-xs font-bold text-info-600 dark:text-info-400 uppercase tracking-wider mb-1">En Progreso</p>
                        <p className="text-3xl font-black text-info-700 dark:text-info-300">{stats.inProgress}</p>
                    </div>
                    <div className="bg-success-50 dark:bg-success-900/20 rounded-2xl p-5 border border-success-200 dark:border-success-800">
                        <p className="text-xs font-bold text-success-600 dark:text-success-400 uppercase tracking-wider mb-1">Completadas</p>
                        <p className="text-3xl font-black text-success-700 dark:text-success-300">{stats.completed}</p>
                    </div>
                    <div className="bg-error-50 dark:bg-error-900/20 rounded-2xl p-5 border border-error-200 dark:border-error-800">
                        <p className="text-xs font-bold text-error-600 dark:text-error-400 uppercase tracking-wider mb-1">Vencidas</p>
                        <p className="text-3xl font-black text-error-700 dark:text-error-300">{stats.overdue}</p>
                    </div>
                </div>
            )}

            {/* Filters - Only show in list view */}
            {viewMode === 'list' && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex items-center space-x-2 mb-4">
                        <Filter className="w-5 h-5 text-neutral-400" />
                        <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Filtros</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100"
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
                            className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100"
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
                            className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100"
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
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-olive-600 dark:border-olive-500 border-t-transparent"></div>
                    <p className="mt-4 text-neutral-500 dark:text-neutral-400 font-medium">Cargando tareas...</p>
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
                            className="space-y-3"
                        >
                            {filteredTasks.length === 0 ? (
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-3xl p-20 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-700">
                                    <CheckSquare size={64} className="mx-auto text-neutral-200 dark:text-neutral-600 mb-4" />
                                    <h3 className="text-xl font-bold text-neutral-400 dark:text-neutral-500 mb-2">Sin tareas</h3>
                                    <p className="text-neutral-400 dark:text-neutral-500">No hay tareas que coincidan con el filtro</p>
                                </div>
                            ) : (
                                filteredTasks.map((task) => (
                                    <motion.div
                                        key={task.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onClick={() => {
                                            setSelectedTask(task);
                                            // setIsDetailsOpen(true);
                                        }}
                                        className={`group bg-white dark:bg-neutral-900 rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-neutral-200 dark:border-neutral-800 relative overflow-hidden ${task.assignedToId === session?.user?.id
                                                ? 'border-l-[6px] border-l-olive-600 dark:border-l-olive-500'
                                                : 'border-l-[6px] border-l-neutral-300 dark:border-l-neutral-600 border-l-dashed'
                                            }`}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                            {/* Left: Status & Info - SIMPLIFIED */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    {/* Minimized Status Badge */}
                                                    <div className={`w-2 h-2 rounded-full ${task.status === 'COMPLETED' ? 'bg-green-500' :
                                                            task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
                                                                'bg-neutral-400'
                                                        }`} />
                                                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                                                        {task.status === 'IN_PROGRESS' ? 'En Curso' : task.status}
                                                    </span>

                                                    {/* My Task Badge (only if assigned to me) */}
                                                    {task.assignedToId === session?.user?.id && (
                                                        <span className="bg-olive-100 text-olive-700 dark:bg-olive-900/30 dark:text-olive-400 text-[10px] font-bold px-1.5 py-0.5 rounded ml-2">
                                                            PARA MÍ
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="font-bold text-neutral-900 dark:text-neutral-100 truncate text-base leading-tight">
                                                    {task.title}
                                                </h3>

                                                {task.project && (
                                                    <p className="text-xs text-neutral-400 mt-1 font-medium">
                                                        {task.project.code} • {task.project.name}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Right: User Info & Meta - SIMPLIFIED */}
                                            <div className="flex items-center gap-5 text-sm">
                                                {/* Priority Dot */}
                                                <div className="flex items-center gap-1.5" title={`Prioridad: ${task.priority}`}>
                                                    <div className={`w-2 h-2 rounded-full ${task.priority === 'URGENT' ? 'bg-red-500' :
                                                            task.priority === 'HIGH' ? 'bg-orange-500' :
                                                                task.priority === 'MEDIUM' ? 'bg-blue-500' :
                                                                    'bg-neutral-300'
                                                        }`} />
                                                </div>

                                                {task.dueDate && (
                                                    <div className={`flex items-center gap-1.5 text-xs ${new Date(task.dueDate) < new Date() ? 'text-error-600 font-bold' : 'text-neutral-500'
                                                        }`}>
                                                        <Calendar size={14} />
                                                        <span>{new Date(task.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</span>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-2 pl-4 border-l border-neutral-100 dark:border-neutral-800">
                                                    <div className="text-right hidden sm:block">
                                                        <p className="text-[10px] font-bold uppercase tracking-wide opacity-50">
                                                            {task.assignedToId === session?.user?.id ? 'De' : 'Para'}
                                                        </p>
                                                        <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300 truncate max-w-[80px]">
                                                            {task.assignedToId === session?.user?.id ? task.createdBy.name.split(' ')[0] : task.assignedTo.name.split(' ')[0]}
                                                        </p>
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300 ring-2 ring-white dark:ring-neutral-700 shadow-sm">
                                                        {(task.assignedToId === session?.user?.id ? task.createdBy.name : task.assignedTo.name)?.charAt(0)}
                                                    </div>
                                                </div>
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
                            className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-2xl w-full p-8 border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">Nueva Tarea {projectId ? ' del Proyecto' : ''}</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTask} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Título *</label>
                                    <input
                                        type="text"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                                        required
                                        placeholder="Ej: Revisar planos estructurales"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Descripción</label>
                                    <textarea
                                        value={newTask.description}
                                        onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none resize-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                                        placeholder="Describe los detalles de la tarea..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Prioridad *</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100"
                                            required
                                        >
                                            <option value="LOW">Baja</option>
                                            <option value="MEDIUM">Media</option>
                                            <option value="HIGH">Alta</option>
                                            <option value="URGENT">Urgente</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Tipo *</label>
                                        <select
                                            value={newTask.type}
                                            onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100"
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
                                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Asignar a *</label>
                                        <select
                                            value={newTask.assignedToId}
                                            onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100"
                                            required
                                        >
                                            <option value="">Seleccionar usuario...</option>
                                            {users.filter(u => u.isActive).map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Fecha límite</label>
                                        <input
                                            type="date"
                                            value={newTask.dueDate}
                                            onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100"
                                        />
                                    </div>
                                </div>

                                {!projectId && (
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Proyecto (opcional)</label>
                                        <select
                                            value={newTask.projectId}
                                            onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100"
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
                                        className="flex-1 px-6 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 font-bold transition-all"
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
