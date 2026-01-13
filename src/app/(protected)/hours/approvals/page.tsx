'use client';

import { useState, useEffect } from 'react';
import { getPendingApprovals, approveTimeEntry, rejectTimeEntry, bulkApproveTimeEntries } from '../actions';

interface TimeEntry {
    id: string;
    date: Date;
    hours: number;
    startTime?: string | null;
    endTime?: string | null;
    notes?: string | null;
    billable?: boolean;
    submittedAt?: Date;
    user: {
        id: string;
        name: string;
        email: string;
    };
    project: {
        id: string;
        code: string;
        name: string;
    };
}

function ApprovalsContent() {
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectEntryId, setRejectEntryId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [approvalNotes, setApprovalNotes] = useState('');

    useEffect(() => {
        loadPendingApprovals();
    }, []);

    const loadPendingApprovals = async () => {
        setLoading(true);
        try {
            const result = await getPendingApprovals();
            setEntries(result);
        } catch (error) {
            console.error('Error loading approvals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectToggle = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === entries.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(entries.map(e => e.id)));
        }
    };

    const handleApprove = async (id: string) => {
        setActionLoading(id);
        try {
            const result = await approveTimeEntry(id, approvalNotes);
            if (result.success) {
                await loadPendingApprovals();
                setApprovalNotes('');
            } else {
                alert(result.message || 'Error al aprobar');
            }
        } catch (error: any) {
            alert(error.message || 'Error al aprobar la entrada');
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.size === 0) return;

        setActionLoading('bulk');
        try {
            const result = await bulkApproveTimeEntries(Array.from(selectedIds), approvalNotes);
            if (result.success) {
                alert(result.message);
                setSelectedIds(new Set());
                setApprovalNotes('');
                await loadPendingApprovals();
            }
        } catch (error: any) {
            alert(error.message || 'Error en aprobación masiva');
        } finally {
            setActionLoading(null);
        }
    };

    const openRejectModal = (id: string) => {
        setRejectEntryId(id);
        setRejectModalOpen(true);
        setRejectReason('');
    };

    const handleReject = async () => {
        if (!rejectEntryId || !rejectReason.trim()) {
            alert('Debe proporcionar un motivo de rechazo');
            return;
        }

        setActionLoading(rejectEntryId);
        try {
            const result = await rejectTimeEntry(rejectEntryId, rejectReason);
            if (result.success) {
                setRejectModalOpen(false);
                setRejectEntryId(null);
                setRejectReason('');
                await loadPendingApprovals();
            } else {
                alert(result.message || 'Error al rechazar');
            }
        } catch (error: any) {
            alert(error.message || 'Error al rechazar la entrada');
        } finally {
            setActionLoading(null);
        }
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-ES', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (time?: string) => {
        if (!time) return null;
        return time;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2 text-neutral-500">
                    <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando aprobaciones pendientes...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                        Aprobaciones Pendientes
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 mt-1">
                        {entries.length} {entries.length === 1 ? 'entrada' : 'entradas'} esperando aprobación
                    </p>
                </div>

                {selectedIds.size > 0 && (
                    <div className="flex items-center space-x-3">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {selectedIds.size} seleccionadas
                        </span>
                        <button
                            onClick={handleBulkApprove}
                            disabled={actionLoading === 'bulk'}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                        >
                            {actionLoading === 'bulk' ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Aprobando...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Aprobar seleccionadas</span>
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Approval Notes (Global) */}
            <div className="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700">
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Notas de aprobación (opcional, se aplicarán a todas las aprobaciones)
                </label>
                <input
                    type="text"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    placeholder="Ej: Aprobado según revisión mensual"
                    className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-neutral-100"
                />
            </div>

            {/* Entries List */}
            {entries.length === 0 ? (
                <div className="bg-white dark:bg-neutral-800 p-12 rounded-lg border border-neutral-200 dark:border-neutral-700 text-center">
                    <svg className="w-16 h-16 mx-auto text-neutral-400 dark:text-neutral-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                        No hay aprobaciones pendientes
                    </h3>
                    <p className="text-neutral-600 dark:text-neutral-400">
                        Todas las entradas de horas han sido procesadas.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                    {/* Table Header */}
                    <div className="bg-neutral-50 dark:bg-neutral-700/50 px-6 py-3 border-b border-neutral-200 dark:border-neutral-700">
                        <div className="flex items-center space-x-4">
                            <input
                                type="checkbox"
                                checked={selectedIds.size === entries.length && entries.length > 0}
                                onChange={handleSelectAll}
                                className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                            />
                            <div className="grid grid-cols-12 gap-4 flex-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 uppercase tracking-wider">
                                <div className="col-span-2">Usuario</div>
                                <div className="col-span-2">Proyecto</div>
                                <div className="col-span-2">Fecha</div>
                                <div className="col-span-1">Horario</div>
                                <div className="col-span-1">Horas</div>
                                <div className="col-span-2">Notas</div>
                                <div className="col-span-2 text-right">Acciones</div>
                            </div>
                        </div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                        {entries.map((entry) => (
                            <div key={entry.id} className="px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                                <div className="flex items-start space-x-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(entry.id)}
                                        onChange={() => handleSelectToggle(entry.id)}
                                        className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500 mt-1"
                                    />
                                    <div className="grid grid-cols-12 gap-4 flex-1">
                                        {/* User */}
                                        <div className="col-span-2">
                                            <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                                {entry.user.name}
                                            </p>
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                {entry.user.email}
                                            </p>
                                        </div>

                                        {/* Project */}
                                        <div className="col-span-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900/30 text-xs font-medium text-blue-800 dark:text-blue-300">
                                                {entry.project.code}
                                            </span>
                                            <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                                                {entry.project.name}
                                            </p>
                                        </div>

                                        {/* Date */}
                                        <div className="col-span-2">
                                            <p className="text-sm text-neutral-900 dark:text-white">
                                                {formatDate(entry.date)}
                                            </p>
                                            {entry.submittedAt && (
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                    Enviado {formatDate(entry.submittedAt)}
                                                </p>
                                            )}
                                        </div>

                                        {/* Time Range */}
                                        <div className="col-span-1">
                                            {entry.startTime && entry.endTime ? (
                                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                                    {formatTime(entry.startTime)} - {formatTime(entry.endTime)}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-neutral-400">-</p>
                                            )}
                                        </div>

                                        {/* Hours */}
                                        <div className="col-span-1">
                                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                                                {Number(entry.hours).toFixed(2)}h
                                            </p>
                                            {entry.billable !== undefined && (
                                                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
                                                    entry.billable
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
                                                }`}>
                                                    {entry.billable ? 'Facturable' : 'No facturable'}
                                                </span>
                                            )}
                                        </div>

                                        {/* Notes */}
                                        <div className="col-span-2">
                                            <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
                                                {entry.notes || <span className="text-neutral-400">Sin notas</span>}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="col-span-2 flex justify-end space-x-2">
                                            <button
                                                onClick={() => handleApprove(entry.id)}
                                                disabled={actionLoading === entry.id}
                                                className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
                                            >
                                                {actionLoading === entry.id ? (
                                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                                <span>Aprobar</span>
                                            </button>
                                            <button
                                                onClick={() => openRejectModal(entry.id)}
                                                disabled={actionLoading === entry.id}
                                                className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 flex items-center space-x-1"
                                            >
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span>Rechazar</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                            Rechazar entrada de horas
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
                            Proporciona un motivo claro para el rechazo. El usuario recibirá esta notificación.
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-neutral-700 dark:text-neutral-100"
                            placeholder="Ej: Las horas registradas no coinciden con el proyecto asignado..."
                            required
                        />
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setRejectModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-600"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || actionLoading === rejectEntryId}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                            >
                                {actionLoading === rejectEntryId ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Rechazando...</span>
                                    </>
                                ) : (
                                    <span>Confirmar rechazo</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function ApprovalsPage() {
    // Sin ProtectedRoute por ahora - agregar después si existe el componente
    return <ApprovalsContent />;
}
