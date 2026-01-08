'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Briefcase, Calendar, Clock, FileText, CheckSquare,
    TrendingUp, Users, ArrowRight, MoreVertical, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { getProjectDetails, getProjectStats, getProjectTeam } from './actions';
import Link from 'next/link';

import { useAppLocale } from '@/providers/LocaleContext';
import ProjectChat from '@/components/chat/ProjectChat';

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
    const { locale } = useAppLocale();
    const [project, setProject] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [team, setTeam] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projData, statsData, teamData] = await Promise.all([
                    getProjectDetails(params.id),
                    getProjectStats(params.id),
                    getProjectTeam(params.id)
                ]);
                setProject(projData);
                setStats(statsData);
                setTeam(teamData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params.id]);

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center bg-neutral-50 dark:bg-neutral-950">
                <div className="w-10 h-10 border-4 border-olive-600 dark:border-olive-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!project) return <div className="dark:text-white">Proyecto no encontrado</div>;

    return (
        <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-950 p-6 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                    <div>
                        <div className="flex items-center space-x-3 mb-2">
                            <span className="bg-olive-100 dark:bg-olive-900/30 text-olive-700 dark:text-olive-400 text-xs font-black px-2 py-1 rounded-md uppercase tracking-wider">
                                {project.code}
                            </span>
                            {project.client && (
                                <span className="text-neutral-400 dark:text-neutral-500 text-sm font-medium">
                                    {project.client.name}
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">{project.name}</h1>
                    </div>

                    <div className="flex items-center space-x-4 w-full md:w-auto">
                        <div className="flex flex-col items-end mr-4">
                            <span className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-1">Progreso</span>
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl font-black text-olive-600 dark:text-olive-500">{project.progress}%</span>
                                <div className="w-24 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-olive-500 rounded-full transition-all duration-1000"
                                        style={{ width: `${project.progress}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        <button className="bg-neutral-900 dark:bg-white text-white dark:text-black px-5 py-3 rounded-xl font-bold hover:bg-black dark:hover:bg-neutral-200 transition-all shadow-lg">
                            Editar
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (Main Content) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Tasks Section */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center">
                                <CheckSquare className="mr-2 text-olive-600 dark:text-olive-500" size={24} />
                                Tareas Recientes
                            </h2>
                            <Link href={`./${project.id}/tasks`} className="text-sm font-bold text-olive-600 hover:text-olive-700 dark:text-olive-500 dark:hover:text-olive-400 flex items-center">
                                Ver todas <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>

                        <div className="space-y-3">
                            {project.tasks.length === 0 ? (
                                <div className="text-center py-8 text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                                    <CheckSquare size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No hay tareas pendientes</p>
                                </div>
                            ) : (
                                project.tasks.slice(0, 5).map((task: any) => (
                                    <div key={task.id} className="flex items-center p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors border border-transparent hover:border-neutral-100 dark:hover:border-neutral-700 group">
                                        <div className={`w-3 h-3 rounded-full mr-4 ${task.priority === 'URGENT' ? 'bg-red-500' :
                                            task.priority === 'HIGH' ? 'bg-orange-500' :
                                                task.priority === 'MEDIUM' ? 'bg-blue-500' : 'bg-green-500'
                                            }`}></div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-neutral-800 dark:text-neutral-200">{task.title}</h3>
                                            <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                {task.assignedTo && <span className="mr-3 flex items-center"><Users size={12} className="mr-1" /> {task.assignedTo.name}</span>}
                                                {task.dueDate && <span className="flex items-center"><Calendar size={12} className="mr-1" /> {format(new Date(task.dueDate), 'd MMM', { locale })}</span>}
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 uppercase">
                                            {task.status}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Documents Section */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center">
                                <FileText className="mr-2 text-olive-600 dark:text-olive-500" size={24} />
                                Documentos Recientes
                            </h2>
                            <Link href={`./${project.id}/documents`} className="text-sm font-bold text-olive-600 hover:text-olive-700 dark:text-olive-500 dark:hover:text-olive-400 flex items-center">
                                Ver todos <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {project.documents.length === 0 ? (
                                <div className="col-span-full text-center py-8 text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                                    <FileText size={32} className="mx-auto mb-2 opacity-50" />
                                    <p>No hay documentos</p>
                                </div>
                            ) : (
                                project.documents.slice(0, 4).map((doc: any) => (
                                    <div key={doc.id} className="flex items-center p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800 hover:border-olive-200 dark:hover:border-olive-800 transition-colors cursor-pointer">
                                        <div className="bg-white dark:bg-neutral-900 p-2 rounded-lg shadow-sm mr-3 text-olive-600 dark:text-olive-500">
                                            <FileText size={20} />
                                        </div>
                                        <div className="overflow-hidden">
                                            <h3 className="font-bold text-neutral-800 dark:text-neutral-200 text-sm truncate">{doc.name}</h3>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                {format(new Date(doc.createdAt), 'd MMM yyyy', { locale })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Chat Section */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center">
                                <svg className="mr-2 text-olive-600 dark:text-olive-500" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                </svg>
                                Chat del Proyecto
                            </h2>
                            <Link href={`/chat?projectId=${project.id}`} className="text-sm font-bold text-olive-600 hover:text-olive-700 dark:text-olive-500 dark:hover:text-olive-400 flex items-center">
                                Ir a Chat completo <ArrowRight size={16} className="ml-1" />
                            </Link>
                        </div>

                        <ProjectChat projectId={project.id} projectName={project.name} />
                    </div>
                </div>

                {/* Right Column (Widgets) */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="bg-neutral-900 dark:bg-black text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-olive-500 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                        <h2 className="text-lg font-bold mb-6 relative z-10 flex items-center">
                            <TrendingUp className="mr-2" size={20} /> Rendimiento
                        </h2>

                        <div className="grid grid-cols-2 gap-4 relative z-10">
                            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                <span className="text-neutral-400 text-xs font-bold uppercase block mb-1">Horas Totales</span>
                                <span className="text-3xl font-black">{stats?.totalHours || 0}</span>
                                <span className="text-xs text-neutral-400 ml-1">h</span>
                            </div>
                            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm">
                                <span className="text-neutral-400 text-xs font-bold uppercase block mb-1">Tareas</span>
                                <span className="text-3xl font-black">{project.tasks.filter((t: any) => t.status === 'COMPLETED').length}/{project.tasks.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Events */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center">
                                <Calendar className="mr-2 text-olive-600 dark:text-olive-500" size={20} />
                                Próximos Eventos
                            </h2>
                            <Link href={`./${project.id}/events`} className="text-xs font-bold text-olive-600 hover:text-olive-700 dark:text-olive-500 dark:hover:text-olive-400">
                                Ver Calendario
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {project.events.length === 0 ? (
                                <p className="text-neutral-400 dark:text-neutral-500 text-sm">No hay eventos programados</p>
                            ) : (
                                project.events.map((event: any) => (
                                    <div key={event.id} className="flex space-x-3 border-l-2 border-olive-500 pl-3 py-1">
                                        <div className="flex flex-col text-center min-w-[3rem]">
                                            <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase">
                                                {format(new Date(event.startDate), 'MMM', { locale })}
                                            </span>
                                            <span className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                                                {format(new Date(event.startDate), 'd')}
                                            </span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-neutral-900 dark:text-neutral-100 text-sm">{event.title}</h4>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 flex items-center mt-1">
                                                <Clock size={10} className="mr-1" />
                                                {format(new Date(event.startDate), 'HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Team */}
                    <div className="bg-white dark:bg-neutral-900 p-6 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-800">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center">
                                <Users className="mr-2 text-olive-600 dark:text-olive-500" size={20} />
                                Equipo
                            </h2>
                            <span className="text-xs font-bold text-neutral-400 dark:text-neutral-500">{team.length} miembros</span>
                        </div>
                        <div className="space-y-3">
                            {team.length === 0 ? (
                                <p className="text-neutral-400 dark:text-neutral-500 text-sm">No hay miembros asignados</p>
                            ) : (
                                team.map((member: any) => (
                                    <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-700 dark:text-olive-400 font-bold">
                                            {member.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-neutral-800 dark:text-neutral-200 text-sm">{member.name}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{member.email}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

