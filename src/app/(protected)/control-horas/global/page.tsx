'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    AlertTriangle,
    Clock,
    Calendar,
    TrendingUp,
    TrendingDown,
    Filter,
    Download,
    RefreshCw,
    ChevronDown,
    Search,
    Building2
} from 'lucide-react';
import { getGlobalDashboardData, getPendingApprovals, approveTimeEntries, rejectTimeEntries } from '@/lib/work-time-tracking/actions';
import { Department } from '@prisma/client';

// Department labels and colors
const DEPARTMENT_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    CIVIL_DESIGN: { label: 'Diseño y Civil', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    ELECTRICAL: { label: 'Eléctrico', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    INSTRUMENTATION: { label: 'Instrumentación', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    ADMINISTRATION: { label: 'Administración', color: 'text-green-700', bgColor: 'bg-green-100' },
    IT: { label: 'Informática', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
    ECONOMIC: { label: 'Económico', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    MARKETING: { label: 'Marketing', color: 'text-pink-700', bgColor: 'bg-pink-100' },
    OTHER: { label: 'Otros', color: 'text-neutral-700', bgColor: 'bg-neutral-100' }
};

interface WorkerStatus {
    userId: string;
    userName: string;
    userEmail: string;
    userImage: string | null;
    department: string;
    dailyHours: number;
    lastEntryDate: Date | null | undefined;
    daysSinceLastEntry: number;
    currentMonthExpected: number;
    currentMonthActual: number;
    currentMonthDiff: number;
    ytdExpectedHours: number;
    ytdActualHours: number;
    ytdDifference: number;
    needsAttention: boolean;
    hasPendingApprovals: boolean;
}

interface PendingApproval {
    id: string;
    userId: string;
    date: Date;
    hours: number;
    notes: string | null;
    status: string;
    user: {
        id: string;
        name: string;
        email: string;
        department: string;
        image: string | null;
    };
    project: {
        id: string;
        code: string;
        name: string;
    };
}

export default function GlobalHoursControlPage() {
    const [workers, setWorkers] = useState<WorkerStatus[]>([]);
    const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [showOnlyAlerts, setShowOnlyAlerts] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Approval modal
    const [selectedApprovals, setSelectedApprovals] = useState<Set<string>>(new Set());
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [processingApproval, setProcessingApproval] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [workersData, approvalsData] = await Promise.all([
                getGlobalDashboardData({
                    department: selectedDepartment !== 'all' ? selectedDepartment as Department : undefined,
                    year: selectedYear,
                    onlyNeedsAttention: showOnlyAlerts
                }),
                getPendingApprovals()
            ]);
            setWorkers(workersData);
            setPendingApprovals(approvalsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedDepartment, selectedYear, showOnlyAlerts]);

    // Filter workers by search term
    const filteredWorkers = useMemo(() => {
        if (!searchTerm) return workers;
        const term = searchTerm.toLowerCase();
        return workers.filter(w =>
            w.userName.toLowerCase().includes(term) ||
            w.userEmail.toLowerCase().includes(term)
        );
    }, [workers, searchTerm]);

    // Group workers by department
    const workersByDepartment = useMemo(() => {
        const grouped: Record<string, WorkerStatus[]> = {};
        filteredWorkers.forEach(worker => {
            if (!grouped[worker.department]) {
                grouped[worker.department] = [];
            }
            grouped[worker.department].push(worker);
        });
        return grouped;
    }, [filteredWorkers]);

    // Summary stats
    const stats = useMemo(() => {
        const total = workers.length;
        const needingAttention = workers.filter(w => w.needsAttention).length;
        const withPending = workers.filter(w => w.hasPendingApprovals).length;
        const totalExpected = workers.reduce((sum, w) => sum + w.currentMonthExpected, 0);
        const totalActual = workers.reduce((sum, w) => sum + w.currentMonthActual, 0);

        return {
            total,
            needingAttention,
            withPending,
            totalExpected,
            totalActual,
            compliance: totalExpected > 0 ? (totalActual / totalExpected) * 100 : 0
        };
    }, [workers]);

    // Handle approval actions
    const handleApprove = async () => {
        if (selectedApprovals.size === 0) return;
        setProcessingApproval(true);
        try {
            await approveTimeEntries(Array.from(selectedApprovals));
            setSelectedApprovals(new Set());
            fetchData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error al aprobar');
        } finally {
            setProcessingApproval(false);
        }
    };

    const handleReject = async () => {
        if (selectedApprovals.size === 0 || !rejectReason.trim()) return;
        setProcessingApproval(true);
        try {
            await rejectTimeEntries(Array.from(selectedApprovals), rejectReason);
            setSelectedApprovals(new Set());
            setRejectReason('');
            setShowRejectModal(false);
            fetchData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error al rechazar');
        } finally {
            setProcessingApproval(false);
        }
    };

    const toggleApprovalSelection = (id: string) => {
        const newSet = new Set(selectedApprovals);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedApprovals(newSet);
    };

    const selectAllApprovals = () => {
        if (selectedApprovals.size === pendingApprovals.length) {
            setSelectedApprovals(new Set());
        } else {
            setSelectedApprovals(new Set(pendingApprovals.map(a => a.id)));
        }
    };

    const formatDate = (date: Date | null | undefined) => {
        if (!date) return 'Nunca';
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short'
        });
    };

    const formatHours = (hours: number) => {
        return hours.toFixed(1) + 'h';
    };

    const formatDiff = (diff: number) => {
        const prefix = diff >= 0 ? '+' : '';
        return prefix + diff.toFixed(1) + 'h';
    };

    return (
        <div className="flex flex-col min-h-full bg-neutral-50 dark:bg-neutral-900 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                        Control Global de Horas
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                        Estado de imputación de todos los trabajadores
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Trabajadores</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{stats.total}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Requieren Atención</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.needingAttention}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Pendientes Aprobación</p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendingApprovals.length}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700"
                >
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stats.compliance >= 90 ? 'bg-green-100 dark:bg-green-900/30' : stats.compliance >= 70 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            {stats.compliance >= 90 ? (
                                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                            ) : (
                                <TrendingDown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Cumplimiento Mes</p>
                            <p className={`text-2xl font-bold ${stats.compliance >= 90 ? 'text-green-600' : stats.compliance >= 70 ? 'text-amber-600' : 'text-red-600'}`}>
                                {stats.compliance.toFixed(0)}%
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-neutral-500" />
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">Filtros:</span>
                    </div>

                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Buscar trabajador..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-sm w-48"
                        />
                    </div>

                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-sm"
                    >
                        <option value="all">Todos los departamentos</option>
                        {Object.entries(DEPARTMENT_CONFIG).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-sm"
                    >
                        {years.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showOnlyAlerts}
                            onChange={(e) => setShowOnlyAlerts(e.target.checked)}
                            className="w-4 h-4 rounded border-neutral-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm text-neutral-700 dark:text-neutral-300">Solo alertas</span>
                    </label>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800">
                    {error}
                </div>
            )}

            {/* Pending Approvals Section */}
            {pendingApprovals.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
                >
                    <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="font-bold text-neutral-900 dark:text-neutral-100">Entradas Pendientes de Aprobación</h2>
                                <p className="text-sm text-neutral-500">{pendingApprovals.length} entradas esperando revisión</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {selectedApprovals.size > 0 && (
                                <>
                                    <button
                                        onClick={handleApprove}
                                        disabled={processingApproval}
                                        className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-bold disabled:opacity-50"
                                    >
                                        Aprobar ({selectedApprovals.size})
                                    </button>
                                    <button
                                        onClick={() => setShowRejectModal(true)}
                                        disabled={processingApproval}
                                        className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm font-bold disabled:opacity-50"
                                    >
                                        Rechazar
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectedApprovals.size === pendingApprovals.length && pendingApprovals.length > 0}
                                            onChange={selectAllApprovals}
                                            className="w-4 h-4 rounded border-neutral-300"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">Trabajador</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">Proyecto</th>
                                    <th className="px-4 py-3 text-right text-xs font-bold text-neutral-500 uppercase">Horas</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">Notas</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                {pendingApprovals.map(approval => (
                                    <tr key={approval.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                                        <td className="px-4 py-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedApprovals.has(approval.id)}
                                                onChange={() => toggleApprovalSelection(approval.id)}
                                                className="w-4 h-4 rounded border-neutral-300"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-bold">
                                                    {approval.user.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-neutral-900 dark:text-neutral-100">{approval.user.name}</p>
                                                    <p className="text-xs text-neutral-500">{DEPARTMENT_CONFIG[approval.user.department]?.label}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                                            {new Date(approval.date).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-neutral-900 dark:text-neutral-100">{approval.project.code}</span>
                                            <span className="text-neutral-500 ml-2">{approval.project.name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                                            {approval.hours.toFixed(2)}h
                                        </td>
                                        <td className="px-4 py-3 text-neutral-500 text-sm max-w-xs truncate">
                                            {approval.notes || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* Workers Table by Department */}
            <div className="space-y-6">
                {Object.entries(workersByDepartment).map(([dept, deptWorkers]) => {
                    const config = DEPARTMENT_CONFIG[dept] || DEPARTMENT_CONFIG.OTHER;

                    return (
                        <motion.div
                            key={dept}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
                        >
                            <div className={`p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-3 ${config.bgColor} dark:bg-opacity-20`}>
                                <Building2 className={`w-5 h-5 ${config.color}`} />
                                <h2 className={`font-bold ${config.color}`}>{config.label}</h2>
                                <span className="text-sm text-neutral-500">({deptWorkers.length} trabajadores)</span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">Trabajador</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-neutral-500 uppercase">Última Entrada</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-neutral-500 uppercase">Días Sin Imputar</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-neutral-500 uppercase">Previstas Mes</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-neutral-500 uppercase">Reales Mes</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-neutral-500 uppercase">Diferencia</th>
                                            <th className="px-4 py-3 text-right text-xs font-bold text-neutral-500 uppercase">YTD</th>
                                            <th className="px-4 py-3 text-center text-xs font-bold text-neutral-500 uppercase">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                                        {deptWorkers.map(worker => (
                                            <tr key={worker.userId} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-bold">
                                                            {worker.userName.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-neutral-900 dark:text-neutral-100">{worker.userName}</p>
                                                            <p className="text-xs text-neutral-500">{worker.userEmail}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center text-neutral-700 dark:text-neutral-300">
                                                    {formatDate(worker.lastEntryDate)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${worker.daysSinceLastEntry > 5 ? 'bg-red-100 text-red-700' : worker.daysSinceLastEntry > 2 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                                        {worker.daysSinceLastEntry}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-neutral-700 dark:text-neutral-300">
                                                    {formatHours(worker.currentMonthExpected)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                                                    {formatHours(worker.currentMonthActual)}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-bold ${worker.currentMonthDiff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatDiff(worker.currentMonthDiff)}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-medium ${worker.ytdDifference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {formatDiff(worker.ytdDifference)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {worker.needsAttention && (
                                                            <span className="w-3 h-3 rounded-full bg-red-500" title="Requiere atención" />
                                                        )}
                                                        {worker.hasPendingApprovals && (
                                                            <span className="w-3 h-3 rounded-full bg-amber-500" title="Tiene pendientes" />
                                                        )}
                                                        {!worker.needsAttention && !worker.hasPendingApprovals && (
                                                            <span className="w-3 h-3 rounded-full bg-green-500" title="OK" />
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-4 border-olive-600 border-t-transparent rounded-full animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredWorkers.length === 0 && (
                <div className="text-center py-12 text-neutral-500">
                    <Users size={48} className="mx-auto mb-4 opacity-30" />
                    <p className="text-lg font-medium">No se encontraron trabajadores</p>
                    <p className="text-sm">Intenta ajustar los filtros</p>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-full max-w-md"
                    >
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                            Rechazar Entradas
                        </h3>
                        <p className="text-sm text-neutral-500 mb-4">
                            Se rechazarán {selectedApprovals.size} entradas. Por favor, indica el motivo:
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Motivo del rechazo..."
                            className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 resize-none h-24"
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                }}
                                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || processingApproval}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50"
                            >
                                Rechazar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
