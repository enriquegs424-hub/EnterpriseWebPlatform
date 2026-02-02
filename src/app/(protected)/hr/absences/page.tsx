'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    CalendarDays, Plus, Filter, CheckCircle, XCircle, Clock,
    ChevronLeft, Search, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getAllAbsences, processAbsenceRequest, getMyAbsences, requestAbsence, getVacationBalance, cancelMyAbsence } from '../actions';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/Toast';

export default function AbsencesPage() {
    return (
        <ProtectedRoute>
            <AbsencesContent />
        </ProtectedRoute>
    );
}

function AbsencesContent() {
    const { data: session } = useSession();
    const [absences, setAbsences] = useState<any[]>([]);
    const [vacationBalance, setVacationBalance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [showNewRequest, setShowNewRequest] = useState(false);
    const [isManager, setIsManager] = useState(false);
    const [viewAll, setViewAll] = useState(false);
    const toast = useToast();

    // New request form
    const [newRequest, setNewRequest] = useState({
        type: 'VACATION' as const,
        startDate: '',
        endDate: '',
        reason: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const balance = await getVacationBalance();
                setVacationBalance(balance);

                // Check if user is manager/admin
                const userRole = (session?.user as any)?.role;
                const canManage = ['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(userRole);
                setIsManager(canManage);

                if (canManage && viewAll) {
                    const allAbsences = await getAllAbsences(
                        filter !== 'all' ? { status: filter as any } : undefined
                    );
                    setAbsences(allAbsences);
                } else {
                    const myAbsences = await getMyAbsences();
                    setAbsences(myAbsences);
                }
            } catch (error) {
                console.error('Error fetching absences:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filter, viewAll, session]);

    const handleSubmitRequest = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate dates
        const start = new Date(newRequest.startDate);
        const end = new Date(newRequest.endDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (start < today) {
            toast.error('La fecha de inicio no puede ser anterior a hoy');
            return;
        }
        if (end < start) {
            toast.error('La fecha de fin no puede ser anterior a la de inicio');
            return;
        }

        try {
            await requestAbsence({
                type: newRequest.type,
                startDate: start,
                endDate: end,
                reason: newRequest.reason
            });
            setShowNewRequest(false);
            setNewRequest({ type: 'VACATION', startDate: '', endDate: '', reason: '' });
            toast.success('Solicitud enviada correctamente');
            // Refresh data
            const myAbsences = await getMyAbsences();
            setAbsences(myAbsences);
            const balance = await getVacationBalance();
            setVacationBalance(balance);
        } catch (error: any) {
            console.error('Error requesting absence:', error);
            toast.error(error.message || 'Error al solicitar ausencia');
        }
    };

    const handleApprove = async (absenceId: string) => {
        try {
            await processAbsenceRequest(absenceId, 'APPROVED');
            const allAbsences = await getAllAbsences(
                filter !== 'all' ? { status: filter as any } : undefined
            );
            setAbsences(allAbsences);
        } catch (error) {
            console.error('Error approving absence:', error);
        }
    };

    const handleReject = async (absenceId: string) => {
        const note = prompt('Motivo del rechazo:');
        if (note === null) return;
        try {
            await processAbsenceRequest(absenceId, 'REJECTED', note);
            const allAbsences = await getAllAbsences(
                filter !== 'all' ? { status: filter as any } : undefined
            );
            setAbsences(allAbsences);
        } catch (error) {
            console.error('Error rejecting absence:', error);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pendiente</span>;
            case 'APPROVED':
                return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Aprobada</span>;
            case 'REJECTED':
                return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Rechazada</span>;
            case 'CANCELLED':
                return <span className="px-2 py-1 text-xs rounded-full bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-400">Cancelada</span>;
            default:
                return null;
        }
    };

    const getTypeName = (type: string) => {
        const types: Record<string, string> = {
            VACATION: 'Vacaciones',
            SICK: 'Enfermedad',
            PERSONAL: 'Personal',
            MATERNITY: 'Maternidad',
            PATERNITY: 'Paternidad',
            UNPAID: 'Sin sueldo',
            OTHER: 'Otro'
        };
        return types[type] || type;
    };

    if (loading) {
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
                            Vacaciones y Ausencias
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            Gestiona tus solicitudes de ausencia
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/hr/absences/calendar"
                        className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors flex items-center gap-2"
                    >
                        <Calendar className="w-4 h-4" />
                        Ver Calendario
                    </Link>
                    <button
                        onClick={() => setShowNewRequest(true)}
                        className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Solicitud
                    </button>
                </div>
            </div>

            {/* Vacation Balance Card */}
            {vacationBalance && (
                <div className="bg-gradient-to-r from-olive-600 to-olive-700 rounded-xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-4">Tu Balance de Vacaciones {new Date().getFullYear()}</h3>
                    <div className="grid grid-cols-4 gap-4">
                        <div>
                            <p className="text-olive-200 text-sm">Total Anual</p>
                            <p className="text-3xl font-bold">{vacationBalance.total}</p>
                            <p className="text-olive-200 text-sm">días</p>
                        </div>
                        <div>
                            <p className="text-olive-200 text-sm">Usados</p>
                            <p className="text-3xl font-bold">{vacationBalance.used}</p>
                            <p className="text-olive-200 text-sm">días</p>
                        </div>
                        <div>
                            <p className="text-olive-200 text-sm">Pendientes</p>
                            <p className="text-3xl font-bold">{vacationBalance.pending}</p>
                            <p className="text-olive-200 text-sm">días</p>
                        </div>
                        <div>
                            <p className="text-olive-200 text-sm">Disponibles</p>
                            <p className="text-3xl font-bold">{vacationBalance.available}</p>
                            <p className="text-olive-200 text-sm">días</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-4">
                {isManager && (
                    <button
                        onClick={() => setViewAll(!viewAll)}
                        className={`px-4 py-2 rounded-lg transition-colors ${viewAll
                            ? 'bg-olive-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                            }`}
                    >
                        {viewAll ? 'Ver todas las solicitudes' : 'Ver solo mis solicitudes'}
                    </button>
                )}
                <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                >
                    <option value="all">Todos los estados</option>
                    <option value="PENDING">Pendientes</option>
                    <option value="APPROVED">Aprobadas</option>
                    <option value="REJECTED">Rechazadas</option>
                </select>
            </div>

            {/* Absences List */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                {absences.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                        <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No hay solicitudes de ausencia</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                        {absences.map((absence) => (
                            <motion.div
                                key={absence.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="p-4 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-4">
                                    {viewAll && absence.user && (
                                        <div className="w-10 h-10 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-600 font-semibold">
                                            {absence.user.name?.charAt(0) || '?'}
                                        </div>
                                    )}
                                    <div>
                                        {viewAll && absence.user && (
                                            <p className="font-medium text-neutral-900 dark:text-white">
                                                {absence.user.name}
                                            </p>
                                        )}
                                        <p className="text-neutral-600 dark:text-neutral-300">
                                            {getTypeName(absence.type)}
                                        </p>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                            {new Date(absence.startDate).toLocaleDateString('es-ES')} - {new Date(absence.endDate).toLocaleDateString('es-ES')}
                                            {' • '}{absence.totalDays} días
                                        </p>
                                        {absence.reason && (
                                            <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1">
                                                {absence.reason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(absence.status)}
                                    {viewAll && absence.status === 'PENDING' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(absence.id)}
                                                className="p-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 rounded-lg text-green-600 transition-colors"
                                                title="Aprobar"
                                            >
                                                <CheckCircle className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleReject(absence.id)}
                                                className="p-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-lg text-red-600 transition-colors"
                                                title="Rechazar"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                    {/* Cancel button for own pending absences */}
                                    {!viewAll && absence.status === 'PENDING' && (
                                        <button
                                            onClick={async () => {
                                                try {
                                                    await cancelMyAbsence(absence.id);
                                                    const myAbsences = await getMyAbsences();
                                                    setAbsences(myAbsences);
                                                    toast.success('Solicitud cancelada');
                                                } catch (error: any) {
                                                    toast.error(error.message || 'Error al cancelar');
                                                }
                                            }}
                                            className="p-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 rounded-lg text-neutral-600 dark:text-neutral-300 transition-colors"
                                            title="Cancelar solicitud"
                                        >
                                            <XCircle className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* New Request Modal */}
            {showNewRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-neutral-800 rounded-xl p-6 w-full max-w-md mx-4"
                    >
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
                            Nueva Solicitud de Ausencia
                        </h2>
                        <form onSubmit={handleSubmitRequest} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Tipo de Ausencia
                                </label>
                                <select
                                    value={newRequest.type}
                                    onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value as any })}
                                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                                    required
                                >
                                    <option value="VACATION">Vacaciones</option>
                                    <option value="SICK">Enfermedad</option>
                                    <option value="PERSONAL">Asuntos Personales</option>
                                    <option value="OTHER">Otro</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Fecha Inicio
                                    </label>
                                    <input
                                        type="date"
                                        value={newRequest.startDate}
                                        onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Fecha Fin
                                    </label>
                                    <input
                                        type="date"
                                        value={newRequest.endDate}
                                        onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Motivo (opcional)
                                </label>
                                <textarea
                                    value={newRequest.reason}
                                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                                    rows={3}
                                    placeholder="Describe el motivo de la ausencia..."
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewRequest(false)}
                                    className="flex-1 px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700"
                                >
                                    Enviar Solicitud
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
