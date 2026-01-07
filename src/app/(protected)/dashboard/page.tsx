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
                <h1 className="text-3xl font-black text-neutral-900">Panel de Control</h1>
                <p className="text-neutral-500 font-medium mt-1">Resumen de tu actividad y tareas pendientes</p>
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
                <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                    <div className="flex items-center space-x-3 mb-6">
                        <div className="p-3 bg-success-50 rounded-xl">
                            <BarChart3 className="w-6 h-6 text-success-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-neutral-900">Distribución por Proyecto</h3>
                            <p className="text-sm text-neutral-500">Horas registradas este mes</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {projectBreakdown.map((project: any) => {
                            const percentage = stats.monthHours > 0 ? (project.hours / stats.monthHours) * 100 : 0;
                            return (
                                <div key={project.projectId} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-3">
                                            <span className="font-bold text-neutral-900">{project.code}</span>
                                            <span className="text-sm text-neutral-500">{project.name}</span>
                                        </div>
                                        <span className="font-bold text-neutral-900">{project.hours}h</span>
                                    </div>
                                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-olive-500 to-olive-600 rounded-full transition-all duration-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-xs text-neutral-500">
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
                <div className="bg-white rounded-2xl p-6 border border-neutral-200 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 bg-info-50 rounded-xl">
                                <Clock className="w-6 h-6 text-info-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-neutral-900">Registros Recientes</h3>
                                <p className="text-sm text-neutral-500">Últimas {stats.recentEntries.length} entradas</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {stats.recentEntries.map((entry: any) => (
                            <div key={entry.id} className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-neutral-100 transition-all">
                                <div className="flex items-center space-x-4">
                                    <div className="flex flex-col items-center justify-center w-12 h-12 bg-white rounded-lg border border-neutral-200">
                                        <span className="text-xs font-bold text-neutral-500">
                                            {new Date(entry.date).toLocaleDateString(language, { month: 'short' })}
                                        </span>
                                        <span className="text-lg font-black text-neutral-900">
                                            {new Date(entry.date).getDate()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-bold text-neutral-900">{entry.project.code}</p>
                                        <p className="text-sm text-neutral-500">{entry.project.name}</p>
                                        {entry.notes && (
                                            <p className="text-xs text-neutral-400 mt-1 line-clamp-1">{entry.notes}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-olive-600">{entry.hours}h</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {stats.recentEntries.length === 0 && (
                <div className="bg-neutral-50 rounded-3xl p-20 text-center border-2 border-dashed border-neutral-200">
                    <Clock size={64} className="mx-auto text-neutral-200 mb-4" />
                    <h3 className="text-xl font-bold text-neutral-400 mb-2">Sin registros este mes</h3>
                    <p className="text-neutral-400 mb-6">Comienza a registrar tus horas de trabajo</p>
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
