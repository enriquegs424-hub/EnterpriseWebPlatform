'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    BarChart3, Users, Clock, CheckCircle2,
    TrendingUp, DollarSign, FolderKanban, Zap
} from 'lucide-react';
import KPICard from '@/components/analytics/KPICard';
import ChartCard from '@/components/analytics/ChartCard';
import { getGeneralKPIs, getProjectAnalytics, getDailyMetrics, getResourceAnalytics, getFinancialAnalytics } from './actions';
import { generateAnalyticsReport } from '@/utils/pdf-generator';
import { Loader2, Download } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AnalyticsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [kpis, setKpis] = useState<any>(null);
    const [projectMetrics, setProjectMetrics] = useState<any>(null);
    const [dailyMetrics, setDailyMetrics] = useState<any[]>([]);
    const [teamMetrics, setTeamMetrics] = useState<any[]>([]);
    const [financialMetrics, setFinancialMetrics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [selectedTab, setSelectedTab] = useState<'overview' | 'projects' | 'team' | 'financial'>('overview');

    // Access control
    useEffect(() => {
        // @ts-ignore
        if (session?.user && !['ADMIN', 'MANAGER'].includes(session.user.role)) {
            router.push('/dashboard');
        }
    }, [session, router]);

    // Load Data
    useEffect(() => {
        const loadTab = async () => {
            try {
                setIsLoading(true);
                // Load all analytics data
                const [kpisData, projectsData, dailyData, teamData, financialData] = await Promise.all([
                    getGeneralKPIs(),
                    getProjectAnalytics(),
                    getDailyMetrics(30),
                    getResourceAnalytics(),
                    getFinancialAnalytics()
                ]);

                setKpis(kpisData);
                setProjectMetrics(projectsData);
                setDailyMetrics(dailyData);
                setTeamMetrics(teamData);
                setFinancialMetrics(financialData);
            } catch (error) {
                console.error('Error loading analytics:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadTab();
    }, []);

    const handleExport = async () => {
        try {
            setIsExporting(true);
            await generateAnalyticsReport(
                kpis,
                projectMetrics,
                teamMetrics,
                financialMetrics,
                'Últimos 30 días'
            );
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // Chart Data Preparation
    const tasksTrendData = {
        labels: dailyMetrics.map(d => format(new Date(d.date), 'dd MMM', { locale: es })),
        datasets: [
            {
                label: 'Tareas Completadas',
                data: dailyMetrics.map(d => d.tasks),
                borderColor: '#10b981', // green-500
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Horas Totales',
                data: dailyMetrics.map(d => d.hours),
                borderColor: '#848440', // olive-600
                backgroundColor: 'rgba(132, 132, 64, 0.05)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y1'
            }
        ]
    };

    const projectStatusData = {
        labels: ['Activos', 'Completados', 'Inactivos'],
        datasets: [{
            data: [
                projectMetrics?.summary?.active || 0,
                projectMetrics?.summary?.completed || 0,
                projectMetrics?.summary?.inactive || 0
            ],
            backgroundColor: ['#848440', '#10b981', '#d4d4d4'], // olive, green, neutral-300
            borderWidth: 0
        }]
    };

    if (isLoading) {
        return (
            <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-olive-600 animate-spin mx-auto mb-3" />
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">Cargando analytics...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-900 overflow-auto">
            {/* Header */}
            <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-8 py-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight flex items-center gap-3">
                            <BarChart3 className="w-8 h-8 text-olive-600" />
                            Analytics Dashboard
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                            Métricas y rendimiento del negocio en tiempo real
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 hover:text-olive-700 dark:hover:text-olive-400 transition-colors disabled:opacity-50"
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Exportar Reporte
                        </button>
                        <select
                            className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-olive-500 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                            defaultValue="30d"
                        >
                            <option value="7d">Últimos 7 días</option>
                            <option value="30d">Últimos 30 días</option>
                            <option value="90d">Últimos 90 días</option>
                            <option value="1y">Último año</option>
                        </select>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mt-6">
                    {[
                        { id: 'overview', label: 'Overview', icon: TrendingUp },
                        { id: 'projects', label: 'Proyectos', icon: FolderKanban },
                        { id: 'team', label: 'Equipo', icon: Users },
                        { id: 'financial', label: 'Financiero', icon: DollarSign }
                    ].map((tab) => {
                        const TabIcon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setSelectedTab(tab.id as any)}
                                className={`px-4 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${selectedTab === tab.id
                                    ? 'bg-olive-600 text-white shadow-md'
                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                    }`}
                            >
                                <TabIcon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-8">
                {selectedTab === 'overview' && (
                    <motion.div
                        key="overview"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* KPI Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KPICard
                                title="Proyectos Activos"
                                value={kpis?.activeProjects || 0}
                                icon={FolderKanban}
                                variant="default"
                                subtitle="En progreso"
                            />
                            <KPICard
                                title="Tareas Completadas"
                                value={kpis?.completedTasks || 0}
                                icon={CheckCircle2}
                                trend={kpis?.trends?.tasks}
                                variant="success"
                                subtitle={`${kpis?.taskCompletionRate?.toFixed(1) || 0}% del total`}
                            />
                            <KPICard
                                title="Horas Facturables"
                                value={`${kpis?.billableHours?.toFixed(1) || 0}h`}
                                icon={Clock}
                                variant="warning"
                                subtitle={`${kpis?.billableRate?.toFixed(1) || 0}% del total`}
                            />
                            <KPICard
                                title="Usuarios Activos"
                                value={kpis?.activeUsers || 0}
                                icon={Zap}
                                variant="success"
                                subtitle="Última semana"
                            />
                        </div>

                        {/* Charts Section */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <ChartCard
                                title="Actividad Diaria"
                                subtitle="Tareas completadas vs Horas registradas"
                                type="line"
                                data={tasksTrendData}
                                className="lg:col-span-2"
                                options={{
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            title: { display: true, text: 'Tareas' }
                                        },
                                        y1: {
                                            position: 'right',
                                            beginAtZero: true,
                                            grid: { display: false },
                                            title: { display: true, text: 'Horas' }
                                        }
                                    }
                                }}
                            />
                            <ChartCard
                                title="Estado de Proyectos"
                                subtitle="Distribución total"
                                type="doughnut"
                                data={projectStatusData}
                            />
                        </div>

                        {/* Recent Projects Table (Keep placeholder for now or implement) */}
                        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
                            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">Rendimiento Reciente de Proyectos</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-neutral-500 dark:text-neutral-400 uppercase bg-neutral-50 dark:bg-neutral-900/50">
                                        <tr>
                                            <th className="px-4 py-3">Proyecto</th>
                                            <th className="px-4 py-3">Código</th>
                                            <th className="px-4 py-3 w-32">Tareas</th>
                                            <th className="px-4 py-3 w-32">Horas</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {projectMetrics?.projects?.map((project: any) => (
                                            <tr key={project.id} className="border-b border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                                                <td className="px-4 py-3 font-medium text-neutral-900 dark:text-neutral-200">{project.name}</td>
                                                <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">{project.code}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-green-500" style={{ width: '60%' }}></div>
                                                        </div>
                                                        <span className="text-xs text-neutral-500">{project.taskCount}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-neutral-600 font-medium">
                                                    {project.timeEntryCount}h
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {selectedTab === 'projects' && (
                    <motion.div
                        key="projects"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard
                                title="Tareas por Proyecto"
                                type="bar"
                                data={{
                                    labels: projectMetrics?.projects?.map((p: any) => p.code) || [],
                                    datasets: [{
                                        label: 'Tareas',
                                        data: projectMetrics?.projects?.map((p: any) => p.taskCount) || [],
                                        backgroundColor: '#848440'
                                    }]
                                }}
                            />
                            <ChartCard
                                title="Horas por Proyecto"
                                type="bar"
                                data={{
                                    labels: projectMetrics?.projects?.map((p: any) => p.code) || [],
                                    datasets: [{
                                        label: 'Horas',
                                        data: projectMetrics?.projects?.map((p: any) => p.timeEntryCount) || [],
                                        backgroundColor: '#10b981'
                                    }]
                                }}
                            />
                        </div>
                    </motion.div>
                )}

                {selectedTab === 'team' && (
                    <motion.div
                        key="team"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard
                                title="Productividad del Equipo"
                                subtitle="Tareas completadas"
                                type="bar"
                                data={{
                                    labels: teamMetrics?.map((u: any) => u.name) || [],
                                    datasets: [{
                                        label: 'Tareas Completadas',
                                        data: teamMetrics?.map((u: any) => u.completedTasks) || [],
                                        backgroundColor: '#848440',
                                        borderRadius: 4
                                    }]
                                }}
                                options={{ indexAxis: 'y' }}
                            />
                            <ChartCard
                                title="Registro de Horas"
                                subtitle="Últimos 30 días"
                                type="doughnut"
                                data={{
                                    labels: teamMetrics?.map((u: any) => u.name) || [],
                                    datasets: [{
                                        data: teamMetrics?.map((u: any) => u.totalHours) || [],
                                        backgroundColor: [
                                            '#848440', '#10b981', '#f59e0b', '#3b82f6',
                                            '#ef4444', '#8b5cf6', '#ec4899', '#6366f1'
                                        ],
                                        borderWidth: 0
                                    }]
                                }}
                            />
                        </div>
                    </motion.div>
                )}

                {selectedTab === 'financial' && (
                    <motion.div
                        key="financial"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        {/* Financial Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Ingresos Totales Estimados</h3>
                                <div className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
                                    €{financialMetrics?.totalRevenue?.toLocaleString() || '0'}
                                </div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-2">
                                    Calculado base €50/hr promedio
                                </div>
                            </div>
                            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 shadow-sm">
                                <h3 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-1">Costo Operativo Estimado</h3>
                                <div className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
                                    €{(kpis?.totalHours * 35)?.toLocaleString() || '0'}
                                </div>
                                <div className="text-xs text-neutral-500 mt-2">
                                    Calculado base €35/hr coste
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <ChartCard
                                title="Ingresos por Proyecto"
                                subtitle="Top 5 proyectos"
                                type="bar"
                                data={{
                                    labels: financialMetrics?.projects?.slice(0, 5).map((p: any) => p.projectName) || [],
                                    datasets: [{
                                        label: 'Ingresos (€)',
                                        data: financialMetrics?.projects?.slice(0, 5).map((p: any) => p.estimatedRevenue) || [],
                                        backgroundColor: '#10b981',
                                        borderRadius: 4
                                    }]
                                }}
                                options={{
                                    indexAxis: 'y',
                                    scales: {
                                        x: {
                                            ticks: {
                                                callback: (value: any) => `€${value}`
                                            }
                                        }
                                    }
                                }}
                            />
                            <ChartCard
                                title="Rentabilidad"
                                subtitle="Ingresos vs Costos (Estimado)"
                                type="pie"
                                data={{
                                    labels: ['Margen', 'Costos'],
                                    datasets: [{
                                        data: [
                                            (financialMetrics?.totalRevenue || 0) - ((kpis?.totalHours || 0) * 35),
                                            (kpis?.totalHours || 0) * 35
                                        ],
                                        backgroundColor: ['#10b981', '#ef4444'],
                                        borderWidth: 0
                                    }]
                                }}
                            />
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
