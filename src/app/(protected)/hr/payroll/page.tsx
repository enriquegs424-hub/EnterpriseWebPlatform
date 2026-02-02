'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, Calendar, Users, ChevronLeft, Plus, Download,
    FileText, Clock, CheckCircle, CreditCard, AlertCircle, Filter, RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getPayrollRecords, getPayrollSummary, getPayrollPeriods, generateMonthlyPayroll } from '../actions';
import { useToast } from '@/components/ui/Toast';

export default function PayrollPage() {
    return (
        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
            <PayrollContent />
        </ProtectedRoute>
    );
}

function PayrollContent() {
    const [records, setRecords] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [periods, setPeriods] = useState<{ value: string; label: string }[]>([]);
    const [selectedPeriod, setSelectedPeriod] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const toast = useToast();

    useEffect(() => {
        const init = async () => {
            try {
                const periodsData = await getPayrollPeriods();
                setPeriods(periodsData);
                // Default to current month
                const now = new Date();
                const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
                setSelectedPeriod(currentPeriod);
            } catch (error) {
                console.error('Error loading periods:', error);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (selectedPeriod) {
            fetchData();
        }
    }, [selectedPeriod, statusFilter]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [recordsData, summaryData] = await Promise.all([
                getPayrollRecords({
                    period: selectedPeriod,
                    ...(statusFilter && { status: statusFilter as any })
                }),
                getPayrollSummary(selectedPeriod)
            ]);
            setRecords(recordsData);
            setSummary(summaryData);
        } catch (error) {
            console.error('Error fetching payroll data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        if (!selectedPeriod) return;
        setGenerating(true);
        try {
            const result = await generateMonthlyPayroll(selectedPeriod);
            toast.success(`Nóminas generadas: ${result.created.length}. Omitidas: ${result.skipped.length}`);
            fetchData();
        } catch (error: any) {
            toast.error(error.message || 'Error generando nóminas');
        } finally {
            setGenerating(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; label: string }> = {
            DRAFT: { bg: 'bg-neutral-100 dark:bg-neutral-700', text: 'text-neutral-600 dark:text-neutral-300', label: 'Borrador' },
            PROCESSING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', label: 'Procesando' },
            COMPLETED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Completado' },
            PAID: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Pagado' }
        };
        const s = styles[status] || styles.DRAFT;
        return (
            <span className={`px-2 py-1 text-xs rounded-full ${s.bg} ${s.text}`}>
                {s.label}
            </span>
        );
    };

    if (loading && !records.length) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/hr" className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                            Gestión de Nóminas
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            Genera y gestiona las nóminas de los empleados
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {generating ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                            <Plus className="w-4 h-4" />
                        )}
                        Generar Nóminas
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-olive-100 dark:bg-olive-900/30 rounded-lg">
                                <Users className="w-5 h-5 text-olive-600 dark:text-olive-400" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Nóminas</p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    {summary.totals.count}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Salario Base</p>
                                <p className="text-xl font-bold text-neutral-900 dark:text-white">
                                    {formatCurrency(summary.totals.baseSalary)}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <CreditCard className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Neto</p>
                                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(summary.totals.netSalary)}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Pendientes</p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    {summary.byStatus.DRAFT + summary.byStatus.PROCESSING}
                                </p>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700"
                    >
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">Pagadas</p>
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    {summary.byStatus.PAID}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-neutral-500" />
                        <select
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                        >
                            {periods.map((p) => (
                                <option key={p.value} value={p.value}>
                                    {p.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-neutral-500" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                        >
                            <option value="">Todos los estados</option>
                            <option value="DRAFT">Borrador</option>
                            <option value="PROCESSING">Procesando</option>
                            <option value="COMPLETED">Completado</option>
                            <option value="PAID">Pagado</option>
                        </select>
                    </div>
                    <button
                        onClick={fetchData}
                        className="ml-auto p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                        title="Actualizar"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Payroll Table */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50 dark:bg-neutral-700/50">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Empleado</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Código</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Base</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Extras</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Bonos</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Deducciones</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Neto</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Estado</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {records.map((record) => (
                                <motion.tr
                                    key={record.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-600 font-semibold">
                                                {record.user?.image ? (
                                                    <img src={record.user.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    record.user?.name?.charAt(0) || '?'
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-neutral-900 dark:text-white">{record.user?.name}</p>
                                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{record.user?.department?.replace(/_/g, ' ')}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
                                            {record.user?.employeeCode || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-neutral-700 dark:text-neutral-300">
                                        {formatCurrency(Number(record.baseSalary))}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-neutral-600 dark:text-neutral-400">
                                        {Number(record.overtime) > 0 ? formatCurrency(Number(record.overtime)) : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-green-600 dark:text-green-400">
                                        {Number(record.bonuses) > 0 ? `+${formatCurrency(Number(record.bonuses))}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm text-red-600 dark:text-red-400">
                                        {Number(record.deductions) > 0 ? `-${formatCurrency(Number(record.deductions))}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-neutral-900 dark:text-white">
                                        {formatCurrency(Number(record.netSalary))}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {getStatusBadge(record.status)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/hr/payroll/${record.id}`}
                                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                                                title="Ver detalle"
                                            >
                                                <FileText className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                            </Link>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {records.length === 0 && (
                    <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                        <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No hay nóminas para este período</p>
                        <button
                            onClick={handleGenerate}
                            disabled={generating}
                            className="mt-4 px-4 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700"
                        >
                            Generar nóminas
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
