'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, UserPlus, CalendarDays, ClipboardList, Clock,
    TrendingUp, AlertCircle, CheckCircle, XCircle, Calendar
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getHRDashboardStats, getAllAbsences } from './actions';

export default function HRPage() {
    return (
        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'MANAGER']}>
            <HRDashboard />
        </ProtectedRoute>
    );
}

function HRDashboard() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        activeEmployees: 0,
        pendingAbsences: 0,
        absencesToday: 0,
        contractsExpiringSoon: 0
    });
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, absencesData] = await Promise.all([
                    getHRDashboardStats(),
                    getAllAbsences({ status: 'PENDING' })
                ]);
                setStats(statsData);
                setPendingRequests(absencesData.slice(0, 5));
            } catch (error) {
                console.error('Error fetching HR data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

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
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                        Recursos Humanos
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400">
                        Gestión de empleados, ausencias y nóminas
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link
                        href="/hr/absences"
                        className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors flex items-center gap-2"
                    >
                        <CalendarDays className="w-4 h-4" />
                        Gestionar Ausencias
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Empleados</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.totalEmployees}</p>
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
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Activos</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.activeEmployees}</p>
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
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Solicitudes Pendientes</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.pendingAbsences}</p>
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
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Ausentes Hoy</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.absencesToday}</p>
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
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Contratos por Vencer</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats.contractsExpiringSoon}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Quick Links and Pending Requests */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Links */}
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Acceso Rápido</h2>
                    <div className="space-y-3">
                        <Link
                            href="/hr/employees"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                        >
                            <Users className="w-5 h-5 text-olive-600" />
                            <span className="text-neutral-700 dark:text-neutral-300">Gestión de Empleados</span>
                        </Link>
                        <Link
                            href="/hr/absences"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                        >
                            <CalendarDays className="w-5 h-5 text-olive-600" />
                            <span className="text-neutral-700 dark:text-neutral-300">Vacaciones y Ausencias</span>
                        </Link>
                        <Link
                            href="/hr/payroll"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                        >
                            <TrendingUp className="w-5 h-5 text-olive-600" />
                            <span className="text-neutral-700 dark:text-neutral-300">Gestión de Nóminas</span>
                        </Link>
                        <Link
                            href="/hr/reports"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                        >
                            <ClipboardList className="w-5 h-5 text-olive-600" />
                            <span className="text-neutral-700 dark:text-neutral-300">Informes RRHH</span>
                        </Link>
                        <Link
                            href="/hr/organization"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                        >
                            <Calendar className="w-5 h-5 text-olive-600" />
                            <span className="text-neutral-700 dark:text-neutral-300">Organigrama</span>
                        </Link>
                    </div>
                </div>

                {/* Pending Absence Requests */}
                <div className="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Solicitudes Pendientes</h2>
                        <Link
                            href="/hr/absences?status=PENDING"
                            className="text-sm text-olive-600 hover:text-olive-700"
                        >
                            Ver todas
                        </Link>
                    </div>
                    {pendingRequests.length === 0 ? (
                        <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay solicitudes pendientes</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-600 font-semibold">
                                            {request.user?.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-neutral-900 dark:text-white">
                                                {request.user?.name}
                                            </p>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                                {request.type === 'VACATION' ? 'Vacaciones' :
                                                    request.type === 'SICK' ? 'Enfermedad' :
                                                        request.type === 'PERSONAL' ? 'Personal' : request.type}
                                                {' • '}
                                                {request.totalDays} días
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-neutral-600 dark:text-neutral-300">
                                            {new Date(request.startDate).toLocaleDateString('es-ES')}
                                        </p>
                                        <Link
                                            href={`/hr/absences/${request.id}`}
                                            className="text-xs text-olive-600 hover:text-olive-700"
                                        >
                                            Revisar
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
