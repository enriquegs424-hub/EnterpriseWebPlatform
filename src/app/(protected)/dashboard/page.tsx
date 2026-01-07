import { getDashboardStats } from "./actions";
import { Clock, TrendingUp, AlertCircle, Target, Calendar, Award } from "lucide-react";

export default async function DashboardPage() {
    const stats = await getDashboardStats();

    if (!stats) return <div>Error cargando estadísticas.</div>;

    // Calculate project breakdown if not already in stats
    // @ts-ignore
    const projectBreakdown = stats.projectBreakdown || [];

    const progressPercentage = stats.targetHours > 0 ? Math.min((stats.monthHours / stats.targetHours) * 100, 100) : 0;
    const isOnTrack = stats.diff >= 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900">Panel de Control</h1>
                <p className="text-neutral-500">Resumen de tu actividad para este mes.</p>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Hours This Month */}
                <div className="bg-gradient-to-br from-olive-500 to-olive-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                    <div className="relative">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 opacity-90" />
                            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Este mes</span>
                        </div>
                        <p className="text-4xl font-bold mb-1">{stats.monthHours}h</p>
                        <p className="text-sm opacity-90">Objetivo: {stats.targetHours}h</p>

                        {/* Progress Bar */}
                        <div className="mt-4 bg-white/20 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-white h-full rounded-full transition-all duration-500"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        <p className="text-xs mt-1 opacity-75">{Math.round(progressPercentage)}% completado</p>
                    </div>
                </div>

                {/* Difference Card */}
                <div className={`rounded-2xl p-6 shadow-sm border ${isOnTrack
                    ? 'bg-gradient-to-br from-success-50 to-success-100 border-success-200'
                    : 'bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className={`w-8 h-8 ${isOnTrack ? 'text-success-600' : 'text-warning-600'}`} />
                        <span className={`text-xs font-bold px-2 py-1 rounded ${isOnTrack ? 'bg-success-200 text-success-700' : 'bg-warning-200 text-warning-700'
                            }`}>
                            {isOnTrack ? 'Al día' : 'Pendiente'}
                        </span>
                    </div>
                    <p className={`text-4xl font-bold mb-1 ${isOnTrack ? 'text-success-700' : 'text-warning-700'}`}>
                        {stats.diff > 0 ? '+' : ''}{stats.diff}h
                    </p>
                    <p className={`text-sm ${isOnTrack ? 'text-success-600' : 'text-warning-600'}`}>
                        {isOnTrack ? 'Vas por buen camino' : 'Necesitas recuperar'}
                    </p>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                    <div className="flex items-center justify-between mb-2">
                        <Target className="w-8 h-8 text-info-600" />
                        <Award className="w-6 h-6 text-olive-500" />
                    </div>
                    <p className="text-4xl font-bold text-neutral-900 mb-1">Activo</p>
                    <p className="text-sm text-neutral-500">Sin incidencias</p>
                </div>
            </div>

            {/* Project Breakdown & Heatmap Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Project Breakdown */}
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 flex flex-col">
                    <h3 className="font-bold text-neutral-900 flex items-center mb-6">
                        <TrendingUp className="w-5 h-5 mr-2 text-olive-600" />
                        Desglose por Proyecto
                    </h3>
                    <div className="space-y-4 flex-1">
                        {projectBreakdown.length === 0 ? (
                            <p className="text-neutral-500 text-sm italic text-center py-8">No hay datos suficientes para mostrar el desglose.</p>
                        ) : (
                            projectBreakdown.map((item: any) => {
                                const percentage = stats.monthHours > 0 ? Math.round((item.hours / stats.monthHours) * 100) : 0;
                                return (
                                    <div key={item.code} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-neutral-700">{item.code} - {item.name}</span>
                                            <span className="font-bold text-olive-700">{item.hours}h ({percentage}%)</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 rounded-full h-2 overflow-hidden">
                                            <div
                                                className="bg-olive-500 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Monthly Calendar Heatmap Preview */}
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-neutral-900 flex items-center">
                            <Calendar className="w-5 h-5 mr-2 text-olive-600" />
                            Actividad del Mes
                        </h3>
                        <a href="/hours/summary" className="text-sm text-olive-600 hover:text-olive-700 font-medium">
                            Ver resumen completo →
                        </a>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 28 }).map((_, i) => {
                            const hasActivity = i % 3 === 0; // Simulación
                            return (
                                <div
                                    key={i}
                                    className={`aspect-square rounded-lg transition-all ${hasActivity
                                        ? 'bg-olive-100 hover:bg-olive-200 border border-olive-300'
                                        : 'bg-neutral-50 hover:bg-neutral-100 border border-neutral-200'
                                        }`}
                                    title={`Día ${i + 1}`}
                                />
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-between mt-4 text-xs text-neutral-500">
                        <span>Menos actividad</span>
                        <div className="flex items-center space-x-1">
                            <div className="w-4 h-4 bg-neutral-50 border border-neutral-200 rounded" />
                            <div className="w-4 h-4 bg-olive-50 border border-olive-200 rounded" />
                            <div className="w-4 h-4 bg-olive-100 border border-olive-300 rounded" />
                            <div className="w-4 h-4 bg-olive-200 border border-olive-400 rounded" />
                        </div>
                        <span>Más actividad</span>
                    </div>
                </div>
            </div>

            {/* Bottom Section: Latest Entries and Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Latest Entries (Span 2) */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-neutral-50 to-olive-50/20 px-6 py-4 border-b border-neutral-200">
                        <h3 className="font-bold text-neutral-900">Últimos registros</h3>
                    </div>
                    {stats.latestEntries.length === 0 ? (
                        <div className="p-12 text-center text-neutral-400">
                            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No hay registros recientes</p>
                            <a href="/hours/daily" className="text-olive-600 hover:text-olive-700 text-sm font-medium mt-2 inline-block">
                                Registrar tus horas →
                            </a>
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100">
                            {stats.latestEntries.map((e: { id: string; date: Date; hours: number }) => (
                                <div key={e.id} className="px-6 py-4 hover:bg-neutral-50 transition-colors flex justify-between items-center">
                                    <div>
                                        <span className="text-sm font-medium text-neutral-600">
                                            {new Date(e.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </span>
                                    </div>
                                    <span className="text-lg font-bold text-olive-700">{e.hours}h</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions (Span 1) */}
                <div className="space-y-4">
                    <a
                        href="/hours/daily"
                        className="flex flex-col bg-olive-600 hover:bg-olive-700 text-white rounded-2xl p-6 transition-all shadow-lg shadow-olive-600/20 group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <Clock className="w-8 h-8 opacity-80 group-hover:scale-110 transition-transform" />
                        </div>
                        <h4 className="font-bold text-lg mb-1">Registrar Horas</h4>
                        <p className="text-sm opacity-90">Añade tus horas de hoy</p>
                    </a>

                    <a
                        href="/hours/summary"
                        className="flex flex-col bg-white hover:bg-neutral-50 border border-neutral-200 rounded-2xl p-6 transition-all group"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <TrendingUp className="w-8 h-8 text-neutral-400 group-hover:text-olive-600 group-hover:scale-110 transition-all" />
                        </div>
                        <h4 className="font-bold text-lg mb-1 text-neutral-900">Ver Resumen</h4>
                        <p className="text-sm text-neutral-500">Analiza tu actividad histórica</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
