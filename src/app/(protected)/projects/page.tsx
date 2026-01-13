'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Plus, Eye, Users, CheckSquare, Calendar, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import DataTable, { type Column } from '@/components/DataTable';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getProjects, getProjectStats } from './actions';

interface Project {
    id: string;
    code: string;
    name: string;
    year: number;
    isActive: boolean;
    companyId: string | null;
    client: {
        id: string;
        name: string;
    } | null;
    _count: {
        tasks: number;
        events: number;
        documents: number;
    };
}

interface Stats {
    total: number;
    active: number;
    completed: number;
}

const STATUS_COLORS = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

const STATUS_LABELS = {
    active: 'Activo',
    inactive: 'Completado',
};

export default function ProjectsPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'WORKER']}>
            <ProjectsContent />
        </ProtectedRoute>
    );
}

function ProjectsContent() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats>({ total: 0, active: 0, completed: 0 });
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed'>('all');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        filterProjects();
    }, [projects, filterStatus]);

    async function loadData() {
        setLoading(true);
        try {
            const [projectsData, statsData] = await Promise.all([
                getProjects(),
                getProjectStats()
            ]);
            setProjects(projectsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    }

    function filterProjects() {
        if (filterStatus === 'all') {
            setFilteredProjects(projects);
        } else if (filterStatus === 'active') {
            setFilteredProjects(projects.filter(p => p.isActive));
        } else {
            setFilteredProjects(projects.filter(p => !p.isActive));
        }
    }

    const columns: Column<Project>[] = [
        {
            key: 'code',
            label: 'Código',
            sortable: true,
            render: (project) => (
                <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                    <Link
                        href={`/projects/${project.id}`}
                        className="font-medium text-olive-600 hover:text-olive-700 dark:text-olive-400 hover:underline"
                    >
                        {project.code}
                    </Link>
                </div>
            ),
        },
        {
            key: 'name',
            label: 'Nombre',
            sortable: true,
            render: (project) => (
                <div>
                    <div className="font-medium text-gray-900 dark:text-white">{project.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Año {project.year}</div>
                </div>
            ),
        },
        {
            key: 'client.name',
            label: 'Cliente',
            sortable: true,
            render: (project) => project.client ? (
                <span className="text-gray-900 dark:text-white">{project.client.name}</span>
            ) : (
                <span className="text-gray-400 dark:text-gray-500">Sin cliente</span>
            ),
        },
        {
            key: 'tasks',
            label: 'Tareas',
            sortable: false,
            className: 'text-center',
            render: (project) => (
                <div className="flex items-center justify-center gap-2">
                    <CheckSquare className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{project._count.tasks}</span>
                </div>
            ),
        },
        {
            key: 'documents',
            label: 'Documentos',
            sortable: false,
            className: 'text-center',
            render: (project) => (
                <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{project._count.documents}</span>
                </div>
            ),
        },
        {
            key: 'events',
            label: 'Eventos',
            sortable: false,
            className: 'text-center',
            render: (project) => (
                <div className="flex items-center justify-center gap-2">
                    <Users className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-gray-900 dark:text-white">{project._count.events}</span>
                </div>
            ),
        },
        {
            key: 'isActive',
            label: 'Estado',
            sortable: true,
            render: (project) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${project.isActive ? STATUS_COLORS.active : STATUS_COLORS.inactive}`}>
                    {project.isActive ? STATUS_LABELS.active : STATUS_LABELS.inactive}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Acciones',
            sortable: false,
            render: (project) => (
                <div className="flex gap-2 justify-end">
                    <Link
                        href={`/projects/${project.id}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title="Ver detalles"
                    >
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proyectos</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Gestión de proyectos y seguimiento</p>
                </div>
                <Link
                    href="/admin/projects"
                    className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors dark:bg-olive-500 dark:hover:bg-olive-600"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Proyecto
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Proyectos</p>
                        <Briefcase className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Activos</p>
                        <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">{stats.active}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completados</p>
                        <CheckSquare className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                            filterStatus === 'all'
                                ? 'bg-olive-600 text-white dark:bg-olive-500'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        Todos ({stats.total})
                    </button>
                    <button
                        onClick={() => setFilterStatus('active')}
                        className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                            filterStatus === 'active'
                                ? 'bg-olive-600 text-white dark:bg-olive-500'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        Activos ({stats.active})
                    </button>
                    <button
                        onClick={() => setFilterStatus('completed')}
                        className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                            filterStatus === 'completed'
                                ? 'bg-olive-600 text-white dark:bg-olive-500'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        Completados ({stats.completed})
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600"></div>
                        <p className="ml-4 text-gray-600 dark:text-gray-400">Cargando proyectos...</p>
                    </div>
                ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-12">
                        <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">
                            {filterStatus === 'all' && 'No hay proyectos creados'}
                            {filterStatus === 'active' && 'No hay proyectos activos'}
                            {filterStatus === 'completed' && 'No hay proyectos completados'}
                        </p>
                        {filterStatus === 'all' && (
                            <Link
                                href="/admin/projects"
                                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Crear primer proyecto
                            </Link>
                        )}
                    </div>
                ) : (
                    <DataTable
                        data={filteredProjects}
                        columns={columns}
                        keyExtractor={(project) => project.id}
                    />
                )}
            </div>
        </div>
    );
}
