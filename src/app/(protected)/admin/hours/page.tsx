'use client';

import { useState, useEffect } from 'react';
import { getAllUsersHours, getTeamStats, getAllUsers } from './actions';
import { BarChart3, Users, Clock, TrendingUp, Filter, Download, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminHoursPage() {
    const [entries, setEntries] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');

    const [filters, setFilters] = useState({
        userId: '',
        startDate: '',
        endDate: '',
    });

    useEffect(() => {
        loadData();
    }, [filters, period]);

    const loadData = async () => {
        setLoading(true);
        const [entriesData, statsData, usersData] = await Promise.all([
            getAllUsersHours(filters.userId || filters.startDate || filters.endDate ? filters : undefined),
            getTeamStats(period),
            getAllUsers(),
        ]);

        if (!Array.isArray(entriesData)) {
            setEntries([]);
        } else {
            setEntries(entriesData);
        }
        setStats(statsData);
        setUsers(usersData);
        setLoading(false);
    };

    const exportToCSV = () => {
        const headers = ['Fecha', 'Usuario', 'Proyecto', 'Horas', 'Notas'];
        const rows = entries.map(e => [
            new Date(e.date).toLocaleDateString(),
            e.user.name,
            `${e.project.code} - ${e.project.name}`,
            e.hours,
            e.notes || '',
        ]);

        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-horas-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading && !stats) return <div className="p-8 text-center text-neutral-500">Cargando datos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-l-4 border-olive-500 pl-4">Monitor Global de Horas</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 ml-5">Vista en tiempo real de todas las horas del equipo</p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center space-x-2 bg-olive-600 text-white px-4 py-2.5 rounded-xl hover:bg-olive-700 transition-all font-bold shadow-lg shadow-olive-600/20"
                >
                    <Download size={18} />
                    <span>Exportar CSV</span>
                </button>
            </div>

            {/* Period Selector */}
            <div className="flex items-center space-x-2 bg-white dark:bg-neutral-800 rounded-xl p-1 border border-neutral-200 dark:border-neutral-700 w-fit">
                {['week', 'month', 'year'].map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p as any)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${period === p
                            ? 'bg-olive-600 text-white shadow-sm'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                            }`}
                    >
                        {p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Año'}
                    </button>
                ))}
            </div>

            {/* Stats Cards */}
            {stats && !stats.error && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-olive-500 to-olive-600 rounded-2xl p-6 text-white shadow-lg"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="w-8 h-8 opacity-80" />
                            <span className="text-xs font-medium bg-white/20 px-2 py-1 rounded">Total</span>
                        </div>
                        <p className="text-3xl font-bold">{stats.totalHours}h</p>
                        <p className="text-sm opacity-90 mt-1">Horas totales</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-success-600" />
                        </div>
                        <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.avgHoursPerDay}h</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Promedio diario</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-info-600" />
                        </div>
                        <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.topUsers.length}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Usuarios activos</p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <BarChart3 className="w-8 h-8 text-warning-600" />
                        </div>
                        <p className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">{stats.totalEntries}</p>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Registros totales</p>
                    </motion.div>
                </div>
            )}

            {/* Collective Summary Section */}
            {stats && !stats.error && (
                <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-neutral-50 to-neutral-100 dark:from-neutral-800 dark:to-neutral-700/50 px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                        <h3 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-olive-600" />
                            Análisis Colectivo del Equipo
                        </h3>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wider">Carga por Departamento</p>
                            <div className="space-y-4">
                                {Object.entries(
                                    entries.reduce((acc: any, e: any) => {
                                        const dept = e.user?.department || 'General';
                                        acc[dept] = (acc[dept] || 0) + e.hours;
                                        return acc;
                                    }, {})
                                ).map(([dept, hours]: [string, any]) => (
                                    <div key={dept} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-neutral-700 dark:text-neutral-300">{dept}</span>
                                            <span className="font-bold text-olive-700 dark:text-olive-400">{hours}h</span>
                                        </div>
                                        <div className="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-2">
                                            <div
                                                className="bg-olive-500 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${Math.min((hours / (stats.totalHours || 1)) * 100, 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-4 uppercase tracking-wider">Top 8 Distribución de Horas</p>
                            <div className="h-48 flex items-end justify-between space-x-2">
                                {(stats.topUsers || []).slice(0, 8).map((user: any) => {
                                    const maxHours = stats.topUsers[0]?.totalHours || 1;
                                    const height = (user.totalHours / maxHours) * 100;
                                    return (
                                        <div key={user.userId} className="flex-1 flex flex-col items-center group relative">
                                            <div className="absolute -top-8 bg-neutral-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-lg">
                                                {user.totalHours}h
                                            </div>
                                            <div
                                                className="w-full bg-olive-500/60 group-hover:bg-olive-600 rounded-t-md transition-all duration-700"
                                                style={{ height: `${height}%` }}
                                            />
                                            <p className="text-[10px] text-neutral-400 mt-2 truncate w-full text-center font-medium">{user.userName.split(' ')[0]}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
                <div className="flex items-center space-x-2 mb-4">
                    <Filter className="w-5 h-5 text-olive-600" />
                    <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Filtros de Búsqueda</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Usuario</label>
                        <select
                            value={filters.userId}
                            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                            className="w-full p-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200"
                        >
                            <option value="">Todos los usuarios</option>
                            {users.map((u) => (
                                <option key={u.id} value={u.id}>{u.name} ({u.department})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Desde</label>
                        <input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            className="w-full p-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Hasta</label>
                        <input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            className="w-full p-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-200"
                        />
                    </div>
                </div>
            </div>

            {/* Top Rankings */}
            {stats && !stats.error && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Users */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-olive-50 to-olive-100/50 dark:from-olive-900/30 dark:to-olive-900/20 px-6 py-4 border-b border-olive-100 dark:border-olive-800/30">
                            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-olive-600" />
                                Top Usuarios
                            </h3>
                        </div>
                        <div className="p-6 space-y-3">
                            {stats.topUsers.map((user: any, idx: number) => (
                                <div key={user.userId} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <span className="flex items-center justify-center w-6 h-6 bg-neutral-100 dark:bg-neutral-700 rounded-full text-xs font-bold text-neutral-600 dark:text-neutral-300">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{user.userName}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.department}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-olive-700">{user.totalHours}h</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Projects */}
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm">
                        <div className="bg-gradient-to-r from-info-50 to-info-100/50 dark:from-info-900/30 dark:to-info-900/20 px-6 py-4 border-b border-info-100 dark:border-info-800/30">
                            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center">
                                <BarChart3 className="w-5 h-5 mr-2 text-info-600" />
                                Top Proyectos
                            </h3>
                        </div>
                        <div className="p-6 space-y-3">
                            {stats.topProjects.map((project: any, idx: number) => (
                                <div key={project.code} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <span className="flex items-center justify-center w-6 h-6 bg-neutral-100 dark:bg-neutral-700 rounded-full text-xs font-bold text-neutral-600 dark:text-neutral-300">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <p className="font-mono text-sm font-bold text-info-600 dark:text-info-400">{project.code}</p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{project.name}</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-info-700">{project.totalHours}h</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Entries Table */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="bg-neutral-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Registros Recientes</h3>
                    <span className="text-sm text-neutral-500">{entries.length} entradas</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700 text-sm">
                        <thead className="bg-neutral-50 dark:bg-neutral-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-neutral-600 dark:text-neutral-400">Fecha</th>
                                <th className="px-6 py-3 text-left font-semibold text-neutral-600 dark:text-neutral-400">Usuario</th>
                                <th className="px-6 py-3 text-left font-semibold text-neutral-600 dark:text-neutral-400">Proyecto</th>
                                <th className="px-6 py-3 text-left font-semibold text-neutral-600 dark:text-neutral-400">Horas</th>
                                <th className="px-6 py-3 text-left font-semibold text-neutral-600 dark:text-neutral-400">Notas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {entries.slice(0, 50).map((entry) => (
                                <tr key={entry.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                                            <Calendar size={14} className="mr-2 text-neutral-400" />
                                            {new Date(entry.date).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-semibold text-neutral-900 dark:text-neutral-200">{entry.user.name}</p>
                                            <p className="text-xs text-neutral-500">{entry.user.department}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-mono text-olive-600 dark:text-olive-400 font-bold text-xs">{entry.project.code}</p>
                                            <p className="text-xs text-neutral-600 dark:text-neutral-400">{entry.project.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-olive-700 dark:text-olive-400">{entry.hours}h</span>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs">
                                        <p className="text-neutral-600 dark:text-neutral-400 truncate text-xs">{entry.notes || '—'}</p>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
