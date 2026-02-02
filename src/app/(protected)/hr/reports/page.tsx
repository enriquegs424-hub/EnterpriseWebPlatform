'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart, Users, Calendar, DollarSign, TrendingUp, TrendingDown,
    ChevronLeft, Download, PieChart, Clock, Briefcase, Building2
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
    getHRDashboardStats,
    getEmployeesWithHRData,
    getAllAbsences,
    getPayrollSummary,
    getExpiringContracts
} from '../actions';

export default function ReportsPage() {
    return (
        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN']}>
            <ReportsContent />
        </ProtectedRoute>
    );
}

function ReportsContent() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [employees, setEmployees] = useState<any[]>([]);
    const [absences, setAbsences] = useState<any[]>([]);
    const [payrollSummary, setPayrollSummary] = useState<any>(null);
    const [expiringContracts, setExpiringContracts] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const now = new Date();
                const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

                const [statsData, employeesData, absencesData, payrollData, contractsData] = await Promise.all([
                    getHRDashboardStats(),
                    getEmployeesWithHRData(),
                    getAllAbsences({ status: 'APPROVED' }),
                    getPayrollSummary(currentPeriod),
                    getExpiringContracts(60) // 60 days
                ]);

                setStats(statsData);
                setEmployees(employeesData);
                setAbsences(absencesData);
                setPayrollSummary(payrollData);
                setExpiringContracts(contractsData);
            } catch (error) {
                console.error('Error fetching report data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Calculate department distribution (only active employees)
    const activeEmployees = employees.filter((e: any) => e.isActive !== false);
    const departmentStats = activeEmployees.reduce((acc, emp) => {
        const dept = emp.department || 'Sin departamento';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Calculate contract type distribution (only active employees)
    const contractStats = activeEmployees.reduce((acc, emp) => {
        const type = emp.contractType || 'Sin definir';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Calculate absence type distribution (from last 30 days)
    const absenceTypeStats = absences.reduce((acc, abs) => {
        const type = abs.type || 'OTHER';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(value);
    };

    const formatDeptName = (dept: string) => {
        const names: Record<string, string> = {
            'CIVIL_DESIGN': 'Diseño/Civil',
            'ELECTRICAL': 'Eléctrico',
            'INSTRUMENTATION': 'Instrumentación',
            'ADMINISTRATION': 'Administración',
            'IT': 'Informática',
            'MARKETING': 'Marketing',
            'OTHER': 'Otros',
            'Sin departamento': 'Sin asignar'
        };
        return names[dept] || dept;
    };

    const formatContractType = (type: string) => {
        const names: Record<string, string> = {
            'INDEFINIDO': 'Indefinido',
            'TEMPORAL': 'Temporal',
            'OBRA_SERVICIO': 'Obra/Servicio',
            'PRACTICAS': 'Prácticas',
            'FORMACION': 'Formación',
            'Sin definir': 'Sin definir'
        };
        return names[type] || type;
    };

    const formatAbsenceType = (type: string) => {
        const names: Record<string, string> = {
            'VACATION': 'Vacaciones',
            'SICK': 'Enfermedad',
            'PERSONAL': 'Personal',
            'MATERNITY': 'Maternidad',
            'PATERNITY': 'Paternidad',
            'UNPAID': 'Sin sueldo',
            'OTHER': 'Otros'
        };
        return names[type] || type;
    };

    const getDeptColor = (index: number) => {
        const colors = [
            'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
            'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-orange-500'
        ];
        return colors[index % colors.length];
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
                            Informes RRHH
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            Estadísticas y reportes de recursos humanos
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{stats?.totalEmployees || 0}</p>
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
                            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Coste Mensual</p>
                            <p className="text-xl font-bold text-neutral-900 dark:text-white">
                                {formatCurrency(payrollSummary?.totals?.netSalary || 0)}
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
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Ausencias (mes)</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{absences.length}</p>
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
                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                            <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Contratos por Vencer</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-white">{expiringContracts.length}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Department Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
                >
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Distribución por Departamento
                    </h2>
                    <div className="space-y-3">
                        {Object.entries(departmentStats).map(([dept, count], index) => {
                            const percentage = activeEmployees.length > 0
                                ? ((count as number) / activeEmployees.length) * 100
                                : 0;
                            return (
                                <div key={dept} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-400">{formatDeptName(dept)}</span>
                                        <span className="text-neutral-900 dark:text-white font-medium">{count as number}</span>
                                    </div>
                                    <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2">
                                        <div
                                            className={`${getDeptColor(index)} h-2 rounded-full transition-all`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Contract Type Distribution */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
                >
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Tipos de Contrato
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(contractStats).map(([type, count]) => (
                            <div
                                key={type}
                                className="p-4 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg text-center"
                            >
                                <p className="text-2xl font-bold text-neutral-900 dark:text-white">{count as number}</p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{formatContractType(type)}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Absence Types */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
                >
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Tipos de Ausencias
                    </h2>
                    <div className="space-y-3">
                        {Object.entries(absenceTypeStats).length > 0 ? (
                            Object.entries(absenceTypeStats).map(([type, count], index) => (
                                <div key={type} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
                                    <span className="text-neutral-600 dark:text-neutral-400">{formatAbsenceType(type)}</span>
                                    <span className="font-semibold text-neutral-900 dark:text-white">{count as number}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-neutral-500 py-4">No hay ausencias registradas</p>
                        )}
                    </div>
                </motion.div>

                {/* Expiring Contracts */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
                >
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <TrendingDown className="w-5 h-5 text-red-500" />
                        Contratos por Vencer (60 días)
                    </h2>
                    {expiringContracts.length > 0 ? (
                        <div className="space-y-3">
                            {expiringContracts.map((emp) => {
                                const daysLeft = Math.ceil((new Date(emp.contractEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                return (
                                    <div key={emp.id} className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-neutral-700 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-600 text-sm font-semibold">
                                                {emp.image ? (
                                                    <img src={emp.image} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    emp.name?.charAt(0) || '?'
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-neutral-900 dark:text-white text-sm">{emp.name}</p>
                                                <p className="text-xs text-neutral-500">{emp.employeeCode}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-sm font-medium ${daysLeft < 15 ? 'text-red-600' : 'text-yellow-600'}`}>
                                                {daysLeft} días
                                            </p>
                                            <p className="text-xs text-neutral-500">
                                                {new Date(emp.contractEndDate).toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-neutral-500 py-4">No hay contratos por vencer</p>
                    )}
                </motion.div>
            </div>
        </div>
    );
}
