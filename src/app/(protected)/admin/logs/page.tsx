'use client';

import { useState, useEffect } from 'react';
import { getActivityLogs } from '@/app/admin/actions';
import { Loader2, Shield, Activity, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LogsPage() {
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
                    <h1 className="text-2xl font-bold text-neutral-900 border-l-4 border-olive-500 pl-4">Auditoría de Seguridad</h1>
                    <p className="text-neutral-500 ml-5 mt-1 text-sm">Registro de actividad y cambios en el sistema</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-6 border-b border-neutral-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-olive-600" />
                    <h2 className="font-bold text-neutral-800">Logs Recientes</h2>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center items-center">
                        <Loader2 className="w-8 h-8 text-olive-600 animate-spin" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 text-sm">
                            <thead className="bg-neutral-50">
                                <tr>
                                    <th className="px-6 py-4 text-left font-semibold text-neutral-600">Fecha/Hora</th>
                                    <th className="px-6 py-4 text-left font-semibold text-neutral-600">Usuario</th>
                                    <th className="px-6 py-4 text-left font-semibold text-neutral-600">Acción</th>
                                    <th className="px-6 py-4 text-left font-semibold text-neutral-600">Detalles</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-neutral-500">
                                            No hay actividad registrada reciente
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <motion.tr
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            key={log.id}
                                            className="hover:bg-neutral-50"
                                        >
                                            <td className="px-6 py-4 text-neutral-500 font-mono text-xs">
                                                {formatDate(log.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-600">
                                                        {log.user?.name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-neutral-900">{log.user?.name || 'Unknown'}</p>
                                                        <p className="text-xs text-neutral-500">{log.user?.role}</p>
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
                                                <code className="text-xs text-neutral-500 break-words block bg-neutral-50 p-1 rounded border border-neutral-100">
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
