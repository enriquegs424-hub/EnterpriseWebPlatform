'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign, ChevronLeft, Edit2, Save, CheckCircle, Clock,
    User, Building2, CreditCard, FileText, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getPayrollById, updatePayrollStatus } from '../../actions';
import { useToast } from '@/components/ui/Toast';

export default function PayrollDetailPage() {
    return (
        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
            <PayrollDetailContent />
        </ProtectedRoute>
    );
}

function PayrollDetailContent() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const [record, setRecord] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        const fetchRecord = async () => {
            try {
                const data = await getPayrollById(params.id as string);
                setRecord(data);
            } catch (error: any) {
                toast.error(error.message || 'Error al cargar nómina');
            } finally {
                setLoading(false);
            }
        };
        fetchRecord();
    }, [params.id]);

    const handleStatusChange = async (status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'PAID') => {
        setUpdating(true);
        try {
            await updatePayrollStatus(record.id, status);
            setRecord({ ...record, status, paidAt: status === 'PAID' ? new Date() : record.paidAt });
            toast.success('Estado actualizado correctamente');
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar');
        } finally {
            setUpdating(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    };

    const formatPeriod = (period: string) => {
        const [year, month] = period.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, 1);
        return date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-600"></div>
            </div>
        );
    }

    if (!record) {
        return (
            <div className="p-6 text-center">
                <p className="text-neutral-500">Nómina no encontrada</p>
                <Link href="/hr/payroll" className="text-olive-600 hover:underline">
                    Volver a nóminas
                </Link>
            </div>
        );
    }

    const getStatusInfo = (status: string) => {
        const info: Record<string, { bg: string; text: string; icon: any; label: string }> = {
            DRAFT: { bg: 'bg-neutral-100 dark:bg-neutral-700', text: 'text-neutral-600 dark:text-neutral-300', icon: FileText, label: 'Borrador' },
            PROCESSING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: Clock, label: 'Procesando' },
            COMPLETED: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', icon: CheckCircle, label: 'Completado' },
            PAID: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: CreditCard, label: 'Pagado' }
        };
        return info[status] || info.DRAFT;
    };

    const statusInfo = getStatusInfo(record.status);
    const StatusIcon = statusInfo.icon;

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/hr/payroll" className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                            Nómina - {formatPeriod(record.period)}
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            {record.user?.name}
                        </p>
                    </div>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${statusInfo.bg} ${statusInfo.text}`}>
                    <StatusIcon className="w-5 h-5" />
                    <span className="font-medium">{statusInfo.label}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Employee Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
                >
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Empleado
                    </h2>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-600 text-2xl font-semibold">
                            {record.user?.image ? (
                                <img src={record.user.image} alt="" className="w-16 h-16 rounded-full object-cover" />
                            ) : (
                                record.user?.name?.charAt(0) || '?'
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-neutral-900 dark:text-white text-lg">{record.user?.name}</p>
                            <p className="text-sm text-neutral-500">{record.user?.email}</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                            <FileText className="w-4 h-4" />
                            <span>Código: {record.user?.employeeCode || 'Sin asignar'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                            <Building2 className="w-4 h-4" />
                            <span>{record.user?.department?.replace(/_/g, ' ') || 'Sin departamento'}</span>
                        </div>
                        {record.user?.salary && (
                            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                                <DollarSign className="w-4 h-4" />
                                <span>Salario base: {formatCurrency(Number(record.user.salary))}</span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Salary Breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
                >
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Desglose
                    </h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-neutral-200 dark:border-neutral-700">
                            <span className="text-neutral-600 dark:text-neutral-400">Salario Base</span>
                            <span className="font-mono text-lg text-neutral-900 dark:text-white">
                                {formatCurrency(Number(record.baseSalary))}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-neutral-200 dark:border-neutral-700">
                            <span className="text-neutral-600 dark:text-neutral-400">Horas Extra</span>
                            <span className="font-mono text-lg text-neutral-700 dark:text-neutral-300">
                                {Number(record.overtime) > 0 ? `+${formatCurrency(Number(record.overtime))}` : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-neutral-200 dark:border-neutral-700">
                            <span className="text-neutral-600 dark:text-neutral-400">Bonificaciones</span>
                            <span className="font-mono text-lg text-green-600 dark:text-green-400">
                                {Number(record.bonuses) > 0 ? `+${formatCurrency(Number(record.bonuses))}` : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-neutral-200 dark:border-neutral-700">
                            <span className="text-neutral-600 dark:text-neutral-400">Deducciones</span>
                            <span className="font-mono text-lg text-red-600 dark:text-red-400">
                                {Number(record.deductions) > 0 ? `-${formatCurrency(Number(record.deductions))}` : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-4 bg-olive-50 dark:bg-olive-900/20 -mx-6 px-6 rounded-b-xl">
                            <span className="text-lg font-semibold text-neutral-900 dark:text-white">NETO A PERCIBIR</span>
                            <span className="font-mono text-2xl font-bold text-olive-600 dark:text-olive-400">
                                {formatCurrency(Number(record.netSalary))}
                            </span>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Status Actions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
            >
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                    Cambiar Estado
                </h2>
                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => handleStatusChange('DRAFT')}
                        disabled={updating || record.status === 'DRAFT'}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors
                            ${record.status === 'DRAFT'
                                ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed'
                                : 'bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300'}`}
                    >
                        <FileText className="w-4 h-4" />
                        Borrador
                    </button>
                    <button
                        onClick={() => handleStatusChange('PROCESSING')}
                        disabled={updating || record.status === 'PROCESSING'}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors
                            ${record.status === 'PROCESSING'
                                ? 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 cursor-not-allowed'
                                : 'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 text-yellow-700 dark:text-yellow-400'}`}
                    >
                        <Clock className="w-4 h-4" />
                        Procesando
                    </button>
                    <button
                        onClick={() => handleStatusChange('COMPLETED')}
                        disabled={updating || record.status === 'COMPLETED'}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors
                            ${record.status === 'COMPLETED'
                                ? 'bg-blue-200 dark:bg-blue-900/50 text-blue-800 cursor-not-allowed'
                                : 'bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400'}`}
                    >
                        <CheckCircle className="w-4 h-4" />
                        Completado
                    </button>
                    <button
                        onClick={() => handleStatusChange('PAID')}
                        disabled={updating || record.status === 'PAID'}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors
                            ${record.status === 'PAID'
                                ? 'bg-green-200 dark:bg-green-900/50 text-green-800 cursor-not-allowed'
                                : 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400'}`}
                    >
                        <CreditCard className="w-4 h-4" />
                        Pagado
                    </button>
                </div>
                {record.paidAt && (
                    <p className="mt-4 text-sm text-neutral-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Pagado el {new Date(record.paidAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </p>
                )}
            </motion.div>

            {/* Notes */}
            {record.notes && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
                >
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                        Notas
                    </h2>
                    <p className="text-neutral-600 dark:text-neutral-400">{record.notes}</p>
                </motion.div>
            )}
        </div>
    );
}
