'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Calendar, User, Clock, CheckCircle, XCircle,
    AlertCircle, CalendarDays, FileText, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { processAbsenceRequest, getAllAbsences } from '../../actions';
import { useToast } from '@/components/ui/Toast';

export default function AbsenceDetailPage() {
    return (
        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'MANAGER']}>
            <AbsenceDetailContent />
        </ProtectedRoute>
    );
}

function AbsenceDetailContent() {
    const params = useParams();
    const router = useRouter();
    const toast = useToast();
    const [absence, setAbsence] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [rejectionNote, setRejectionNote] = useState('');
    const [showRejectDialog, setShowRejectDialog] = useState(false);

    useEffect(() => {
        const fetchAbsence = async () => {
            try {
                // Get all absences and find the one with matching ID
                const absences = await getAllAbsences({});
                const found = absences.find((a: any) => a.id === params.id);
                if (found) {
                    setAbsence(found);
                }
            } catch (error) {
                console.error('Error fetching absence:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAbsence();
    }, [params.id]);

    const handleApprove = async () => {
        setProcessing(true);
        try {
            await processAbsenceRequest(params.id as string, 'APPROVED');
            toast.success('Ausencia aprobada correctamente');
            router.push('/hr/absences');
        } catch (error: any) {
            toast.error(error.message || 'Error al aprobar');
        } finally {
            setProcessing(false);
        }
    };

    const handleReject = async () => {
        setProcessing(true);
        try {
            await processAbsenceRequest(params.id as string, 'REJECTED', rejectionNote);
            toast.success('Ausencia rechazada');
            router.push('/hr/absences');
        } catch (error: any) {
            toast.error(error.message || 'Error al rechazar');
        } finally {
            setProcessing(false);
            setShowRejectDialog(false);
        }
    };

    const getTypeName = (type: string) => {
        const names: Record<string, string> = {
            VACATION: 'Vacaciones',
            SICK: 'Baja por enfermedad',
            PERSONAL: 'Asuntos personales',
            MATERNITY: 'Maternidad',
            PATERNITY: 'Paternidad',
            UNPAID: 'Sin sueldo',
            OTHER: 'Otros'
        };
        return names[type] || type;
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            VACATION: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            SICK: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
            PERSONAL: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            MATERNITY: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
            PATERNITY: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
            UNPAID: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300',
            OTHER: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        };
        return colors[type] || colors.OTHER;
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, { bg: string; text: string; icon: any; label: string }> = {
            PENDING: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', icon: Clock, label: 'Pendiente' },
            APPROVED: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', icon: CheckCircle, label: 'Aprobada' },
            REJECTED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', icon: XCircle, label: 'Rechazada' },
            CANCELLED: { bg: 'bg-neutral-100 dark:bg-neutral-700', text: 'text-neutral-600 dark:text-neutral-400', icon: AlertCircle, label: 'Cancelada' }
        };
        const s = styles[status] || styles.PENDING;
        const Icon = s.icon;
        return (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${s.bg} ${s.text}`}>
                <Icon className="w-5 h-5" />
                <span className="font-medium">{s.label}</span>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-600"></div>
            </div>
        );
    }

    if (!absence) {
        return (
            <div className="p-6 text-center">
                <p className="text-neutral-500 mb-4">Ausencia no encontrada</p>
                <Link href="/hr/absences" className="text-olive-600 hover:underline">
                    Volver a ausencias
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/hr/absences" className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                            Solicitud de Ausencia
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            {getTypeName(absence.type)}
                        </p>
                    </div>
                </div>
                {getStatusBadge(absence.status)}
            </div>

            {/* Employee Info */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
            >
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Solicitante
                </h2>
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-600 text-2xl font-semibold">
                        {absence.user?.image ? (
                            <img src={absence.user.image} alt="" className="w-16 h-16 rounded-full object-cover" />
                        ) : (
                            absence.user?.name?.charAt(0) || '?'
                        )}
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-neutral-900 dark:text-white">
                            {absence.user?.name}
                        </p>
                        <p className="text-neutral-500">{absence.user?.email}</p>
                        <p className="text-sm text-neutral-400 mt-1">
                            {absence.user?.department?.replace(/_/g, ' ')}
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Absence Details */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
            >
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5" />
                    Detalles
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-neutral-500 mb-1">Tipo de ausencia</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm ${getTypeColor(absence.type)}`}>
                            {getTypeName(absence.type)}
                        </span>
                    </div>
                    <div>
                        <p className="text-sm text-neutral-500 mb-1">Duración</p>
                        <p className="text-lg font-semibold text-neutral-900 dark:text-white">
                            {absence.totalDays} día{absence.totalDays !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-neutral-500 mb-1">Fecha inicio</p>
                        <p className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            {new Date(absence.startDate).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm text-neutral-500 mb-1">Fecha fin</p>
                        <p className="font-medium text-neutral-900 dark:text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-neutral-400" />
                            {new Date(absence.endDate).toLocaleDateString('es-ES', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                {absence.reason && (
                    <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                        <p className="text-sm text-neutral-500 mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" />
                            Motivo
                        </p>
                        <p className="text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-700/50 p-4 rounded-lg">
                            {absence.reason}
                        </p>
                    </div>
                )}

                <div className="mt-4 text-sm text-neutral-500">
                    Solicitado el {new Date(absence.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </motion.div>

            {/* Approval Info (if already processed) */}
            {absence.status !== 'PENDING' && absence.approvedBy && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
                >
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        {absence.status === 'APPROVED' ? 'Aprobación' : 'Rechazo'}
                    </h2>
                    <div className="flex items-center gap-4">
                        <p className="text-neutral-600 dark:text-neutral-400">
                            {absence.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'} por{' '}
                            <span className="font-medium text-neutral-900 dark:text-white">
                                {absence.approvedBy?.name}
                            </span>
                            {' '}el{' '}
                            {new Date(absence.approvedAt).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}
                        </p>
                    </div>
                    {absence.rejectionNote && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                            <p className="text-sm text-red-800 dark:text-red-200">
                                <strong>Motivo del rechazo:</strong> {absence.rejectionNote}
                            </p>
                        </div>
                    )}
                </motion.div>
            )}

            {/* Action Buttons (only for PENDING) */}
            {absence.status === 'PENDING' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
                >
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                        Acciones
                    </h2>

                    {!showRejectDialog ? (
                        <div className="flex gap-4">
                            <button
                                onClick={handleApprove}
                                disabled={processing}
                                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Aprobar Ausencia
                            </button>
                            <button
                                onClick={() => setShowRejectDialog(true)}
                                disabled={processing}
                                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                            >
                                <XCircle className="w-5 h-5" />
                                Rechazar
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Motivo del rechazo (opcional)
                                </label>
                                <textarea
                                    value={rejectionNote}
                                    onChange={(e) => setRejectionNote(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 resize-none"
                                    rows={3}
                                    placeholder="Explica el motivo del rechazo..."
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRejectDialog(false)}
                                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleReject}
                                    disabled={processing}
                                    className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                >
                                    {processing ? 'Rechazando...' : 'Confirmar Rechazo'}
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    );
}
