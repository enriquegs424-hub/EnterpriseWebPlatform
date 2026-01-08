import { getDashboardStats, getMyPendingTasks } from "./actions";
import HoursWidget from "@/components/dashboard/HoursWidget";
import TasksWidget from "@/components/dashboard/TasksWidget";
import QuickActions from "@/components/dashboard/QuickActions";
import { Clock, TrendingUp, AlertCircle, Target, Calendar, Award, BarChart3 } from "lucide-react";
import { auth } from "@/auth";

export default async function DashboardPage() {
    const session = await auth();
    const language = (session?.user as any)?.preferences?.language || 'es-ES';

    const [stats, pendingTasks] = await Promise.all([
        getDashboardStats(),
        getMyPendingTasks()
    ]);

    if (!stats) return <div>Error cargando estadísticas.</div>;

    const projectBreakdown = stats.projectBreakdown || [];
    const progressPercentage = stats.targetHours > 0 ? Math.min((stats.monthHours / stats.targetHours) * 100, 100) : 0;
    const isOnTrack = stats.diff >= 0;

    // Calcular tendencia mensual (simplificado)
    const monthlyTrend = stats.diff;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-theme-primary">Panel de Control</h1>
                <p className="text-theme-tertiary font-medium mt-1">Resumen de tu actividad y tareas pendientes</p>
            </div>

            {/* Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Hours Widget */}
                <HoursWidget
                    totalHours={stats.monthHours}
                    targetHours={stats.targetHours}
                    monthlyTrend={monthlyTrend}
                />

                {/* Tasks Widget */}
                <TasksWidget tasks={pendingTasks} />

                {/* Quick Actions */}
                <QuickActions />
            </div>

            {/* Project Breakdown */}
            {projectBreakdown.length > 0 && (
                <div className="card-lg p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-success-600 dark:text-success-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-theme-primary">Distribución por Proyecto</h3>
                            <p className="text-sm text-theme-tertiary">Horas registradas este mes</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {projectBreakdown.map((project: any) => {
                            const percentage = stats.monthHours > 0 ? (project.hours / stats.monthHours) * 100 : 0;
                            return (
                                <div key={project.projectId} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <span className="font-bold text-theme-primary">{project.code}</span>
                                            <span className="text-sm text-theme-tertiary">{project.name}</span>
                                        </div>
                                        <span className="font-bold text-theme-primary">{project.hours}h</span>
                                    </div>
                                    <div className="h-2 surface-tertiary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-olive-500 to-olive-600 rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-theme-muted">
                                        <span>{percentage.toFixed(1)}% del total</span>
                                        <span>{project.entries} {project.entries === 1 ? 'entrada' : 'entradas'}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent Entries */}
            {stats.recentEntries.length > 0 && (
                <div className="card-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-info-50 dark:bg-info-900/20 rounded-xl">
                                <Clock className="w-6 h-6 text-info-600 dark:text-info-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-theme-primary">Registros Recientes</h3>
                                <p className="text-sm text-theme-tertiary">Últimas {stats.recentEntries.length} entradas</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {stats.recentEntries.map((entry: any) => (
                            <div key={entry.id} className="flex items-center justify-between p-4 surface-tertiary rounded-xl interactive border border-theme-secondary">
                                <div className="flex items-center space-x-4">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 surface-secondary rounded-lg border border-theme-primary">
                                        <span className="text-xs font-bold text-theme-tertiary">
                                            {new Date(entry.date).toLocaleDateString(language, { month: 'short' })}
                                        </span>
                                        <span className="text-lg font-black text-theme-primary">
                                            {new Date(entry.date).getDate()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-theme-primary">{entry.project.code}</p>
                                        <p className="text-sm text-theme-tertiary">{entry.project.name}</p>
                                        {entry.notes && (
                                            <p className="text-xs text-theme-muted mt-1 line-clamp-1">{entry.notes}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-olive-600 dark:text-olive-500">{entry.hours}h</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {stats.recentEntries.length === 0 && (
                <div className="surface-tertiary rounded-3xl p-20 text-center border-2 border-dashed border-theme-primary">
                    <Clock size={64} className="mx-auto text-theme-muted mb-4" />
                    <h3 className="text-xl font-bold text-theme-tertiary mb-2">Sin registros este mes</h3>
                    <p className="text-theme-muted mb-6">Comienza a registrar tus horas de trabajo</p>
                    <a
                        href="/hours/daily"
                        className="inline-block px-6 py-3 bg-olive-600 hover:bg-olive-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-olive-600/20"
                    >
                        Registrar Horas
                    </a>
                </div>
            )}
        </div>
    );
}
