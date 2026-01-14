'use client';

import { useState, useEffect } from 'react';
import { getActivityLogs } from './actions';
import { Loader2, Shield, Activity, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function LogsPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN']}>
            <LogsContent />
        </ProtectedRoute>
    );
}

function LogsContent() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            setLoading(true);
            try {
                const data = await getActivityLogs();
                setLogs(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleString('es-ES', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-theme-primary border-l-4 border-olive-500 pl-4">Auditoría de Seguridad</h1>
                    <p className="text-theme-tertiary ml-5 mt-1 text-sm">Registro de actividad y cambios en el sistema</p>
                </div>
            </div>

            <div className="card-lg overflow-hidden">
                <div className="p-6 border-b border-theme-secondary flex items-center gap-2">
                    <Activity className="w-5 h-5 text-olive-600" />
                    <h2 className="font-bold text-theme-primary">Logs Recientes</h2>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center items-center">
                        <Loader2 className="w-8 h-8 text-olive-600 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-theme-primary text-sm">
                            <thead className="surface-tertiary">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold text-theme-secondary">Fecha/Hora</th>
                                    <th className="px-6 py-4 text-left font-semibold text-theme-secondary">Usuario</th>
                                    <th className="px-6 py-4 text-left font-semibold text-theme-secondary">Acción</th>
                                    <th className="px-6 py-4 text-left font-semibold text-theme-secondary">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-secondary">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-theme-tertiary">
                                            No hay actividad registrada reciente
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            key={log.id}
                                            className="table-row"
                                        >
                                            <td className="px-6 py-4 text-theme-tertiary font-mono text-xs">
                                                {formatDate(log.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full surface-tertiary flex items-center justify-center text-xs font-bold text-theme-secondary">
                                                        {log.user?.name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-theme-primary">{log.user?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-theme-tertiary">{log.user?.role}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-md text-xs font-bold ${log.action.includes('INVITE') ? 'bg-blue-50 text-blue-700' :
                                                    log.action.includes('UPDATE') ? 'bg-amber-50 text-amber-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 max-w-md">
                                                <code className="text-xs text-theme-tertiary break-words block surface-tertiary p-1 rounded border border-theme-secondary">
                                                    {log.details || '-'}
                                                </code>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
