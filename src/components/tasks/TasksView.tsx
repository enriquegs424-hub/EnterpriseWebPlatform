'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getAllTasks, createTask, updateTask, deleteTask, getTaskStats, getUsersForAssignment } from '@/app/(protected)/tasks/actions';
import { getProjects } from '@/app/(protected)/projects/actions';
import {
    CheckSquare, Plus, Calendar, Trash2, X, Check,
    LayoutList, LayoutGrid, Clock, AlertCircle, ChevronDown,
    User, Users, ArrowRight, Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TaskDetailsModal from '@/components/tasks/TaskDetailsModal';
import KanbanBoard from '@/app/(protected)/tasks/kanban/KanbanBoard';
import CalendarView from '@/app/(protected)/tasks/calendar/CalendarView';
import { useRealtimePolling } from '@/hooks/useRealtimePolling';

type ViewMode = 'list' | 'kanban' | 'calendar';
type TabView = 'my-tasks' | 'all-tasks' | 'delegated';

interface TasksViewProps {
    projectId?: string;
}

export default function TasksView({ projectId }: TasksViewProps) {
    const { data: session } = useSession();
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [tabView, setTabView] = useState<TabView>('my-tasks');
    const [tasks, setTasks] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [quickTaskInput, setQuickTaskInput] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'week' | 'overdue'>('all');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
        const activeFilters = projectId ? { ...filters, projectId } : filters;

        const [tasksData, usersData, projectsData, statsData] = await Promise.all([
            getAllTasks(activeFilters),
            getUsersForAssignment(),
            getProjects(),
            getTaskStats(projectId)
        ]);

        console.log('[TasksView] Users loaded:', usersData.length);
        console.log('[TasksView] Tasks loaded:', tasksData.length);
        setTasks(tasksData);
        setUsers(usersData);
        setProjects(projectsData);
        setStats(statsData);
        setLoading(false);
    };

    // Real-time polling for automatic updates
    useRealtimePolling({
        onPoll: async () => {
            console.log('[TasksView] Polling for updates...');
            const activeFilters = projectId ? { ...filters, projectId } : filters;
            const tasksData = await getAllTasks(activeFilters);
            setTasks(tasksData);
        },
        interval: 5000, // 5 seconds
        enabled: true
    });

    // Filter tasks based on tab view
    const getFilteredTasksByTab = () => {
        return tasks.filter(task => {
            const isAssignedToMe = task.assignedToId === session?.user?.id ||
                task.assignees?.some((u: any) => u.id === session?.user?.id);

            if (tabView === 'my-tasks') {
                return isAssignedToMe;
            } else if (tabView === 'delegated') {
                return task.createdById === session?.user?.id && !isAssignedToMe;
            }
            return true; // all-tasks
        });
    };

    // Apply date filters
    const getFilteredTasksByDate = () => {
        const tabFiltered = getFilteredTasksByTab();

        if (activeFilter === 'all') return tabFiltered;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);

        return tabFiltered.filter(task => {
            if (!task.dueDate) return false;
            const dueDate = new Date(task.dueDate);

            if (activeFilter === 'today') {
                return dueDate.toDateString() === today.toDateString();
            } else if (activeFilter === 'week') {
                return dueDate >= today && dueDate <= weekEnd;
            } else if (activeFilter === 'overdue') {
                return dueDate < today && task.status !== 'COMPLETED';
            }
            return true;
        });
    };

    const filteredTasks = getFilteredTasksByDate();

    // Count tasks for badges
    const getTaskCounts = () => {
        const myTasks = tasks.filter(t =>
            t.assignedToId === session?.user?.id ||
            t.assignees?.some((u: any) => u.id === session?.user?.id)
        );
        const delegated = tasks.filter(t =>
            t.createdById === session?.user?.id &&
            !(t.assignedToId === session?.user?.id || t.assignees?.some((u: any) => u.id === session?.user?.id))
        );

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayTasks = myTasks.filter(t => {
            if (!t.dueDate) return false;
            return new Date(t.dueDate).toDateString() === today.toDateString();
        });
        const overdueTasks = myTasks.filter(t => {
            if (!t.dueDate || t.status === 'COMPLETED') return false;
            return new Date(t.dueDate) < today;
        });

        return {
            myTasks: myTasks.length,
            allTasks: tasks.length,
            delegated: delegated.length,
            today: todayTasks.length,
            overdue: overdueTasks.length
        };
    };

    const counts = getTaskCounts();

    // Quick task creation
    const handleQuickTaskCreate = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && quickTaskInput.trim()) {
            const tempId = `temp-${Date.now()}`;
            const tempTask = {
                id: tempId,
                title: quickTaskInput.trim(),
                description: '',
                status: 'PENDING',
                priority: 'MEDIUM',
                type: 'GENERAL',
                dueDate: null,
                projectId: projectId || null,
                assignedToId: session?.user?.id,
                createdById: session?.user?.id,
                createdBy: {
                    id: session?.user?.id,
                    name: session?.user?.name,
                    image: session?.user?.image
                },
                assignedTo: {
                    id: session?.user?.id,
                    name: session?.user?.name,
                    image: session?.user?.image
                },
                assignees: [],
                comments: [],
                attachments: [],
                labels: [],
                checklistItems: [],
                createdAt: new Date(),
                updatedAt: new Date()
            };

            // Optimistic UI update
            setTasks(prevTasks => [tempTask, ...prevTasks]);
            setQuickTaskInput('');

            const result = await createTask({
                title: quickTaskInput.trim(),
                priority: 'MEDIUM',
                type: 'GENERAL',
                assignedToId: session?.user?.id || '',
                projectId: projectId || ''
            });

            if (result.success) {
                // Replace temp task with real one from server
                const tasksData = await getAllTasks(projectId ? { ...filters, projectId } : filters);
                setTasks(tasksData);
            } else {
                // Remove temp task on error
                setTasks(prevTasks => prevTasks.filter(t => t.id !== tempId));
            }
        }
    };

    // Inline actions - IMPROVED: Allow changing from any status
    const handleToggleComplete = async (taskId: string, currentStatus: string, e: React.MouseEvent) => {
        e.stopPropagation();
        console.log('[handleToggleComplete] Task:', taskId, 'Current status:', currentStatus);

        // Smart toggle: COMPLETED -> PENDING, anything else -> COMPLETED
        const newStatus = currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

        // Optimistic UI update - update immediately for instant feedback
        setTasks(prevTasks =>
            prevTasks.map(task =>
                task.id === taskId
                    ? { ...task, status: newStatus }
                    : task
            )
        );

        try {
            const result = await updateTask(taskId, { status: newStatus });
            if (result.success) {
                // Server confirmed, data will be refreshed by polling
                console.log('[handleToggleComplete] Update confirmed');
            } else {
                // Revert optimistic update on error
                console.error('[handleToggleComplete] Update failed:', result.error);
                setTasks(prevTasks =>
                    prevTasks.map(task =>
                        task.id === taskId
                            ? { ...task, status: currentStatus }
                            : task
                    )
                );
            }
        } catch (error) {
            console.error('[handleToggleComplete] Error:', error);
            // Revert optimistic update on error
            setTasks(prevTasks =>
                prevTasks.map(task =>
                    task.id === taskId
                        ? { ...task, status: currentStatus }
                        : task
                )
            );
        }
    };

    const handleQuickDelete = async (taskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('¿Eliminar esta tarea?')) {
            await deleteTask(taskId);
            fetchData();
        }
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

    // Priority styles - COLORS BY PRIORITY
    const getPriorityStyles = (priority: string) => {
        switch (priority) {
            case 'URGENT':
                return {
                    bg: 'bg-red-50 dark:bg-red-950/20',
                    border: 'border-l-red-500 dark:border-l-red-400',
                    text: 'text-red-700 dark:text-red-400',
                    badge: 'bg-red-500 text-white'
                };
            case 'HIGH':
                return {
                    bg: 'bg-orange-50 dark:bg-orange-950/20',
                    border: 'border-l-orange-500 dark:border-l-orange-400',
                    text: 'text-orange-700 dark:text-orange-400',
                    badge: 'bg-orange-500 text-white'
                };
            case 'MEDIUM':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-950/20',
                    border: 'border-l-blue-500 dark:border-l-blue-400',
                    text: 'text-blue-700 dark:text-blue-400',
                    badge: 'bg-blue-500 text-white'
                };
            case 'LOW':
                return {
                    bg: 'bg-neutral-50 dark:bg-neutral-900',
                    border: 'border-l-neutral-300 dark:border-l-neutral-600',
                    text: 'text-neutral-600 dark:text-neutral-400',
                    badge: 'bg-neutral-400 text-white'
                };
            default:
                return {
                    bg: 'bg-white dark:bg-neutral-900',
                    border: 'border-l-neutral-300 dark:border-l-neutral-600',
                    text: 'text-neutral-600 dark:text-neutral-400',
                    badge: 'bg-neutral-400 text-white'
                };
        }
    };

    const getPriorityLabel = (priority: string) => {
        const labels: Record<string, string> = {
            'URGENT': 'Urgente',
            'HIGH': 'Alta',
            'MEDIUM': 'Media',
            'LOW': 'Baja'
        };
        return labels[priority] || priority;
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
            <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                            <CheckSquare className="w-8 h-8 text-olive-600 dark:text-olive-500" />
                            Mis Tareas
                        </h1>
                        <p className="text-neutral-600 dark:text-neutral-400 mt-1 font-medium">
                            Gestiona tu trabajo de forma eficiente
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {/* View Switcher */}
                        <div className="flex items-center space-x-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`px-4 py-2 rounded-lg transition-all font-bold ${viewMode === 'list'
                                    ? 'bg-olive-600 dark:bg-olive-700 text-white shadow-sm'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                    }`}
                            >
                                <LayoutList size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`px-4 py-2 rounded-lg transition-all font-bold ${viewMode === 'kanban'
                                    ? 'bg-olive-600 dark:bg-olive-700 text-white shadow-sm'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                    }`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('calendar')}
                                className={`px-4 py-2 rounded-lg transition-all font-bold ${viewMode === 'calendar'
                                    ? 'bg-olive-600 dark:bg-olive-700 text-white shadow-sm'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                    }`}
                            >
                                <Calendar size={18} />
                            </button>
                        </div>

                        {/* New Task Button */}
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="flex items-center space-x-2 bg-olive-600 hover:bg-olive-700 dark:bg-olive-700 dark:hover:bg-olive-600 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm"
                        >
                            <Plus size={20} />
                            <span>Nueva Tarea</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Task Input */}
            {viewMode === 'list' && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <input
                        type="text"
                        value={quickTaskInput}
                        onChange={(e) => setQuickTaskInput(e.target.value)}
                        onKeyDown={handleQuickTaskCreate}
                        placeholder="Añadir tarea rápida... (presiona Enter)"
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 dark:focus:border-olive-600 outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 font-medium transition-all"
                    />
                </div>
            )}

            {/* Tabs */}
            {viewMode === 'list' && (
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-neutral-900 rounded-xl p-4 border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setTabView('my-tasks')}
                            className={`px-4 py-2 rounded-lg font-bold transition-all ${tabView === 'my-tasks'
                                ? 'bg-olive-600 dark:bg-olive-700 text-white shadow-sm'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                }`}
                        >
                            Mis Tareas
                            {counts.myTasks > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-md text-xs font-black ${tabView === 'my-tasks' ? 'bg-white/20' : 'bg-olive-100 dark:bg-olive-900/30 text-olive-700 dark:text-olive-400'
                                    }`}>
                                    {counts.myTasks}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setTabView('all-tasks')}
                            className={`px-4 py-2 rounded-lg font-bold transition-all ${tabView === 'all-tasks'
                                ? 'bg-olive-600 dark:bg-olive-700 text-white shadow-sm'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                }`}
                        >
                            Todas
                            {counts.allTasks > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-md text-xs font-black ${tabView === 'all-tasks' ? 'bg-white/20' : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                    }`}>
                                    {counts.allTasks}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setTabView('delegated')}
                            className={`px-4 py-2 rounded-lg font-bold transition-all ${tabView === 'delegated'
                                ? 'bg-olive-600 dark:bg-olive-700 text-white shadow-sm'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                }`}
                        >
                            Delegadas
                            {counts.delegated > 0 && (
                                <span className={`ml-2 px-2 py-0.5 rounded-md text-xs font-black ${tabView === 'delegated' ? 'bg-white/20' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                    }`}>
                                    {counts.delegated}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Quick Filters */}
                    <div className="flex gap-2 items-center flex-wrap">
                        <button
                            onClick={() => setActiveFilter('today')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeFilter === 'today'
                                ? 'bg-yellow-500 dark:bg-yellow-600 text-white shadow-sm'
                                : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
                                }`}
                        >
                            <Clock size={14} className="inline mr-1" />
                            Hoy {counts.today > 0 && `(${counts.today})`}
                        </button>
                        <button
                            onClick={() => setActiveFilter('week')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeFilter === 'week'
                                ? 'bg-blue-500 dark:bg-blue-600 text-white shadow-sm'
                                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800'
                                }`}
                        >
                            <Calendar size={14} className="inline mr-1" />
                            Esta Semana
                        </button>
                        <button
                            onClick={() => setActiveFilter('overdue')}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${activeFilter === 'overdue'
                                ? 'bg-red-500 dark:bg-red-600 text-white shadow-sm'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800'
                                }`}
                        >
                            <AlertCircle size={14} className="inline mr-1" />
                            Vencidas {counts.overdue > 0 && `(${counts.overdue})`}
                        </button>
                        {activeFilter !== 'all' && (
                            <button
                                onClick={() => setActiveFilter('all')}
                                className="px-3 py-1.5 rounded-lg text-sm font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all border border-neutral-200 dark:border-neutral-700"
                            >
                                <X size={14} className="inline mr-1" /> Limpiar
                            </button>
                        )}
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className="px-3 py-1.5 rounded-lg text-sm font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all border border-neutral-200 dark:border-neutral-700"
                        >
                            Más filtros <ChevronDown size={14} className={`inline ml-1 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
            )}

            {/* Advanced Filters */}
            <AnimatePresence>
                {viewMode === 'list' && showAdvancedFilters && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="bg-white dark:bg-neutral-900 rounded-xl p-5 border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
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
                                className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
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
                                className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
                            >
                                <option value="">Todos los usuarios</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-14 w-14 border-4 border-olive-600 dark:border-olive-500 border-t-transparent"></div>
                    <p className="mt-4 text-neutral-500 dark:text-neutral-400 font-medium text-lg">Cargando tareas...</p>
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
                            className="space-y-2.5"
                        >
                            {filteredTasks.length === 0 ? (
                                <div className="bg-neutral-50 dark:bg-neutral-800 rounded-2xl p-16 text-center border-2 border-dashed border-neutral-300 dark:border-neutral-700">
                                    <CheckSquare size={56} className="mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
                                    <h3 className="text-lg font-bold text-neutral-500 dark:text-neutral-400 mb-1">Sin tareas</h3>
                                    <p className="text-neutral-400 dark:text-neutral-500 text-sm">
                                        {activeFilter !== 'all' ? 'No hay tareas que coincidan con este filtro' : 'No hay tareas asignadas'}
                                    </p>
                                </div>
                            ) : (
                                filteredTasks.map((task) => {
                                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED';
                                    const priorityStyles = getPriorityStyles(task.priority);
                                    const assignees = task.assignees && task.assignees.length > 0 ? task.assignees : (task.assignedTo ? [task.assignedTo] : []);

                                    return (
                                        <motion.div
                                            key={task.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            onClick={() => setSelectedTask(task)}
                                            className={`group ${priorityStyles.bg} rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${priorityStyles.border} border-r border-t border-b border-neutral-200 dark:border-neutral-800`}
                                        >
                                            <div className="flex items-start gap-4">
                                                {/* Checkbox - FIXED */}
                                                <button
                                                    onClick={(e) => handleToggleComplete(task.id, task.status, e)}
                                                    className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all mt-0.5 ${task.status === 'COMPLETED'
                                                        ? 'bg-green-500 dark:bg-green-600 border-green-500 dark:border-green-600'
                                                        : 'border-neutral-300 dark:border-neutral-600 hover:border-olive-500 dark:hover:border-olive-400 hover:bg-olive-50 dark:hover:bg-olive-900/20'
                                                        }`}
                                                >
                                                    {task.status === 'COMPLETED' && <Check size={16} className="text-white font-bold" />}
                                                </button>

                                                {/* Task Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-3 mb-2">
                                                        <div className="flex-1">
                                                            <h3 className={`font-bold text-base text-neutral-900 dark:text-neutral-100 mb-1 ${task.status === 'COMPLETED' ? 'line-through opacity-60' : ''
                                                                }`}>
                                                                {task.title}
                                                            </h3>

                                                            {/* Creator and Assignees - CLEAR DISTINCTION */}
                                                            <div className="flex items-center gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                                                                {/* Creator */}
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-medium">De:</span>
                                                                    <div className="flex items-center gap-1">
                                                                        {task.createdBy?.image ? (
                                                                            <img
                                                                                src={task.createdBy.image}
                                                                                alt={task.createdBy.name}
                                                                                className="w-5 h-5 rounded-full object-cover"
                                                                            />
                                                                        ) : (
                                                                            <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px] font-bold">
                                                                                {task.createdBy?.name?.charAt(0)}
                                                                            </div>
                                                                        )}
                                                                        <span className="font-medium">{task.createdBy?.name}</span>
                                                                    </div>
                                                                </div>

                                                                <ArrowRight size={12} className="text-neutral-400" />

                                                                {/* Assignees */}
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-medium">Para:</span>
                                                                    <div className="flex items-center gap-1">
                                                                        {assignees.length > 0 ? (
                                                                            <>
                                                                                {assignees.slice(0, 2).map((assignee: any, idx: number) => (
                                                                                    <div key={assignee.id} className="flex items-center gap-1">
                                                                                        {assignee.image ? (
                                                                                            <img
                                                                                                src={assignee.image}
                                                                                                alt={assignee.name}
                                                                                                className="w-5 h-5 rounded-full object-cover"
                                                                                            />
                                                                                        ) : (
                                                                                            <div className="w-5 h-5 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-[10px] font-bold text-olive-700 dark:text-olive-400">
                                                                                                {assignee.name?.charAt(0)}
                                                                                            </div>
                                                                                        )}
                                                                                        {idx === 0 && <span className="font-medium">{assignee.name}</span>}
                                                                                    </div>
                                                                                ))}
                                                                                {assignees.length > 2 && (
                                                                                    <span className="text-[10px] font-bold bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded">
                                                                                        +{assignees.length - 2}
                                                                                    </span>
                                                                                )}
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-neutral-400">Sin asignar</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {task.project && (
                                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                                                                    📁 {task.project.code}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Priority Badge */}
                                                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${priorityStyles.badge} flex-shrink-0`}>
                                                            {getPriorityLabel(task.priority)}
                                                        </span>
                                                    </div>

                                                    {/* Meta Info */}
                                                    <div className="flex items-center gap-3 text-sm">
                                                        {task.dueDate && (
                                                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs ${isOverdue
                                                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400'
                                                                }`}>
                                                                <Calendar size={13} />
                                                                <span>
                                                                    {new Date(task.dueDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Delete Button */}
                                                        <button
                                                            onClick={(e) => handleQuickDelete(task.id, e)}
                                                            className="ml-auto opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all text-neutral-400 hover:text-red-600 dark:hover:text-red-400"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })
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
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-2xl w-full p-7 border border-neutral-200 dark:border-neutral-800 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-neutral-900 dark:text-neutral-100">Nueva Tarea</h3>
                                <button
                                    onClick={() => setShowCreateModal(false)}
                                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                                >
                                    <X size={22} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Título *</label>
                                    <input
                                        type="text"
                                        value={newTask.title}
                                        onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 font-medium"
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
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none resize-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 font-medium"
                                        placeholder="Describe los detalles de la tarea..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Prioridad *</label>
                                        <select
                                            value={newTask.priority}
                                            onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
                                            required
                                        >
                                            <option value="LOW">Baja</option>
                                            <option value="MEDIUM">Media</option>
                                            <option value="HIGH">Alta</option>
                                            <option value="URGENT">Urgente</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Asignar a *</label>
                                        <select
                                            value={newTask.assignedToId}
                                            onChange={(e) => setNewTask({ ...newTask, assignedToId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
                                            required
                                        >
                                            <option value="">Seleccionar usuario...</option>
                                            {users.filter(u => u.isActive).map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                            ))}
                                        </select>
                                        {users.length === 0 && (
                                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">⚠️ No hay usuarios disponibles. Revisa la consola.</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Fecha y hora límite</label>
                                    <input
                                        type="datetime-local"
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
                                    />
                                </div>

                                {!projectId && (
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Proyecto (opcional)</label>
                                        <select
                                            value={newTask.projectId}
                                            onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
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
                                        className="flex-1 px-6 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 font-bold transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 px-6 py-2.5 bg-olive-600 dark:bg-olive-700 text-white rounded-lg hover:bg-olive-700 dark:hover:bg-olive-600 font-bold transition-all shadow-sm"
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
