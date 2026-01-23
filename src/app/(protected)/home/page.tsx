'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    CheckCircle, Clock, Calendar, Bell, Plus,
    Briefcase, FileText, Users, TrendingUp, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getDashboardData } from './actions';

export default function HomePage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const dashboardData = await getDashboardData();
            setTasks(dashboardData.tasks);
            setEvents(dashboardData.events);
            setNotifications(dashboardData.notifications);
            setStats(dashboardData.stats);
            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-olive-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
                    Panel de Control
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Bienvenido de nuevo. Aquí está tu resumen de hoy.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <CheckCircle className="w-6 h-6 opacity-80" />
                        <span className="text-2xl font-bold">{stats?.tasksToday || 0}</span>
                    </div>
                    <p className="text-sm opacity-90">Tareas de Hoy</p>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Briefcase className="w-6 h-6 opacity-80" />
                        <span className="text-2xl font-bold">{stats?.activeProjects || 0}</span>
                    </div>
                    <p className="text-sm opacity-90">Proyectos Activos</p>
                </div>

                <div className="bg-gradient-to-br from-olive-500 to-olive-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Calendar className="w-6 h-6 opacity-80" />
                        <span className="text-2xl font-bold">{stats?.eventsThisWeek || 0}</span>
                    </div>
                    <p className="text-sm opacity-90">Eventos Esta Semana</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Bell className="w-6 h-6 opacity-80" />
                        <span className="text-2xl font-bold">{notifications.filter(n => !n.isRead).length}</span>
                    </div>
                    <p className="text-sm opacity-90">Notificaciones Nuevas</p>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Tasks */}
                <div className="lg:col-span-2 space-y-6">
                    {/* My Tasks Today */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                                Mis Tareas de Hoy
                            </h2>
                            <Link
                                href="/tasks"
                                className="text-sm text-olive-600 hover:text-olive-700 font-medium flex items-center gap-1"
                            >
                                Ver todas <ArrowRight size={14} />
                            </Link>
                        </div>

                        {tasks.length === 0 ? (
                            <div className="text-center py-8 text-neutral-500">
                                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No tienes tareas pendientes para hoy</p>
                                <p className="text-sm mt-1">¡Buen trabajo!</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {tasks.slice(0, 5).map((task) => (
                                    <Link
                                        key={task.id}
                                        href={`/tasks/${task.id}`}
                                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors group"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={task.status === 'COMPLETED'}
                                            className="w-4 h-4 rounded border-neutral-300"
                                            readOnly
                                        />
                                        <div className="flex-1">
                                            <p className="font-medium group-hover:text-olive-600 transition-colors">
                                                {task.title}
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {task.project?.name}
                                            </p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                                                task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                                    'bg-neutral-100 text-neutral-700'
                                            }`}>
                                            {task.priority}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Upcoming Events */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-purple-600" />
                                Próximos Eventos
                            </h2>
                            <Link
                                href="/calendar"
                                className="text-sm text-olive-600 hover:text-olive-700 font-medium flex items-center gap-1"
                            >
                                Ver calendario <ArrowRight size={14} />
                            </Link>
                        </div>

                        {events.length === 0 ? (
                            <p className="text-neutral-500 text-center py-8">
                                No tienes eventos próximos
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {events.slice(0, 4).map((event) => (
                                    <div
                                        key={event.id}
                                        className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800"
                                    >
                                        <div className="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex flex-col items-center justify-center flex-shrink-0">
                                            <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                                                {format(new Date(event.startDate), 'MMM', { locale: es }).toUpperCase()}
                                            </p>
                                            <p className="text-lg font-black text-purple-900 dark:text-purple-300">
                                                {format(new Date(event.startDate), 'd')}
                                            </p>
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{event.title}</p>
                                            <p className="text-sm text-neutral-500">
                                                {format(new Date(event.startDate), 'HH:mm')} - {event.location || 'Sin ubicación'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column - Quick Actions & Notifications */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                        <h2 className="text-lg font-bold mb-4">Acciones Rápidas</h2>
                        <div className="space-y-2">
                            <Link
                                href="/tasks/new"
                                className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                                    <Plus className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-blue-900 dark:text-blue-100">Nueva Tarea</p>
                                    <p className="text-xs text-blue-600 dark:text-blue-400">Crear tarea rápida</p>
                                </div>
                            </Link>

                            <Link
                                href="/projects/new"
                                className="flex items-center gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-purple-900 dark:text-purple-100">Nuevo Proyecto</p>
                                    <p className="text-xs text-purple-600 dark:text-purple-400">Iniciar proyecto</p>
                                </div>
                            </Link>

                            <Link
                                href="/chat"
                                className="flex items-center gap-3 p-3 rounded-lg bg-olive-50 dark:bg-olive-900/20 hover:bg-olive-100 dark:hover:bg-olive-900/30 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-olive-600 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-olive-900 dark:text-olive-100">Abrir Chat</p>
                                    <p className="text-xs text-olive-600 dark:text-olive-400">Comunicarse</p>
                                </div>
                            </Link>

                            <Link
                                href="/documents"
                                className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-amber-900 dark:text-amber-100">Documentos</p>
                                    <p className="text-xs text-amber-600 dark:text-amber-400">Ver archivos</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    {/* Recent Notifications */}
                    <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold">Notificaciones</h2>
                            <Link
                                href="/notifications"
                                className="text-sm text-olive-600 hover:text-olive-700 font-medium"
                            >
                                Ver todas
                            </Link>
                        </div>

                        {notifications.length === 0 ? (
                            <p className="text-neutral-500 text-center py-8 text-sm">
                                No tienes notificaciones
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {notifications.slice(0, 5).map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`p-3 rounded-lg ${!notif.isRead
                                                ? 'bg-blue-50 dark:bg-blue-900/20'
                                                : 'bg-neutral-50 dark:bg-neutral-800'
                                            }`}
                                    >
                                        <p className="font-medium text-sm">{notif.title}</p>
                                        <p className="text-xs text-neutral-500 mt-1">{notif.message}</p>
                                        <p className="text-xs text-neutral-400 mt-1">
                                            {format(new Date(notif.createdAt), 'HH:mm')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
