"use client";

import { useEffect, useState } from "react";
import { getPlatformMetrics, getCompanies } from "./actions";
import Link from "next/link";
import {
    Building2,
    Users,
    Briefcase,
    FileText,
    Activity,
    TrendingUp,
    Settings,
    Shield,
    ChevronRight,
} from "lucide-react";

export default function SuperAdminDashboard() {
    const [metrics, setMetrics] = useState<any>(null);
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [metricsData, companiesData] = await Promise.all([
                    getPlatformMetrics(),
                    getCompanies(),
                ]);
                setMetrics(metricsData);
                setCompanies(companiesData.slice(0, 5)); // Top 5
            } catch (error) {
                console.error("Error loading superadmin data:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-olive-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
                        <Shield className="w-8 h-8 text-purple-600" />
                        Panel SUPERADMIN
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Gestión global de la plataforma
                    </p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Building2 className="w-8 h-8 opacity-80" />
                        <span className="text-sm opacity-80">Empresas</span>
                    </div>
                    <p className="text-4xl font-black">{metrics?.companies?.total || 0}</p>
                    <p className="text-sm opacity-80 mt-1">
                        {metrics?.companies?.active || 0} activas
                    </p>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Users className="w-8 h-8 opacity-80" />
                        <span className="text-sm opacity-80">Usuarios</span>
                    </div>
                    <p className="text-4xl font-black">{metrics?.users?.total || 0}</p>
                    <p className="text-sm opacity-80 mt-1">
                        {metrics?.users?.active || 0} activos
                    </p>
                </div>

                <div className="bg-gradient-to-br from-olive-500 to-olive-700 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Briefcase className="w-8 h-8 opacity-80" />
                        <span className="text-sm opacity-80">Proyectos</span>
                    </div>
                    <p className="text-4xl font-black">{metrics?.projects || 0}</p>
                    <p className="text-sm opacity-80 mt-1">en toda la plataforma</p>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <Activity className="w-8 h-8 opacity-80" />
                        <span className="text-sm opacity-80">Actividad 24h</span>
                    </div>
                    <p className="text-4xl font-black">{metrics?.activityLast24h || 0}</p>
                    <p className="text-sm opacity-80 mt-1">acciones registradas</p>
                </div>
            </div>

            {/* Users by Role */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                    Distribución de Usuarios por Rol
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {["SUPERADMIN", "ADMIN", "MANAGER", "WORKER", "GUEST"].map((role) => (
                        <div
                            key={role}
                            className="text-center p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl"
                        >
                            <p className="text-2xl font-black text-neutral-900 dark:text-white">
                                {metrics?.usersByRole?.[role] || 0}
                            </p>
                            <p className="text-xs font-bold text-neutral-500 uppercase tracking-wider mt-1">
                                {role}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions & Recent Companies */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                        Acciones Rápidas
                    </h3>
                    <div className="space-y-3">
                        <Link
                            href="/superadmin/companies"
                            className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <Building2 className="w-5 h-5 text-purple-600" />
                                <span className="font-medium text-neutral-900 dark:text-white">
                                    Gestionar Empresas
                                </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                            href="/superadmin/logs"
                            className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-neutral-900 dark:text-white">
                                    Logs de Auditoría
                                </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                            href="/superadmin/companies/new"
                            className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/30 rounded-xl hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-purple-600" />
                                <span className="font-medium text-purple-900 dark:text-purple-300">
                                    Crear Nueva Empresa
                                </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>

                {/* Recent Companies */}
                <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            Empresas Recientes
                        </h3>
                        <Link
                            href="/superadmin/companies"
                            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                            Ver todas
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {companies.length === 0 ? (
                            <p className="text-neutral-500 text-center py-8">
                                No hay empresas registradas
                            </p>
                        ) : (
                            companies.map((company) => (
                                <Link
                                    key={company.id}
                                    href={`/superadmin/companies/${company.id}`}
                                    className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    <div>
                                        <p className="font-medium text-neutral-900 dark:text-white">
                                            {company.name}
                                        </p>
                                        <p className="text-sm text-neutral-500">
                                            {company._count.users} usuarios • {company._count.projects} proyectos
                                        </p>
                                    </div>
                                    <div
                                        className={`px-2 py-1 rounded-full text-xs font-bold ${company.isActive
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                            }`}
                                    >
                                        {company.isActive ? "Activa" : "Inactiva"}
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
