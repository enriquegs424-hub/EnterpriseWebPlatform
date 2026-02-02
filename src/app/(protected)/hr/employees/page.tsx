'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Search, Filter, ChevronLeft, Edit2, Eye, Briefcase,
    Calendar, FileText, Clock, AlertCircle, CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getEmployeesWithHRData } from '../actions';

export default function EmployeesPage() {
    return (
        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'MANAGER']}>
            <EmployeesContent />
        </ProtectedRoute>
    );
}

function EmployeesContent() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        department: '',
        contractType: '',
        status: ''
    });

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const data = await getEmployeesWithHRData();
                setEmployees(data);
            } catch (error) {
                console.error('Error fetching employees:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchEmployees();
    }, []);

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = !search ||
            emp.name?.toLowerCase().includes(search.toLowerCase()) ||
            emp.email?.toLowerCase().includes(search.toLowerCase()) ||
            emp.employeeCode?.toLowerCase().includes(search.toLowerCase());

        const matchesDept = !filters.department || emp.department === filters.department;
        const matchesContract = !filters.contractType || emp.contractType === filters.contractType;
        const matchesStatus = !filters.status ||
            (filters.status === 'active' && emp.isActive) ||
            (filters.status === 'inactive' && !emp.isActive);

        return matchesSearch && matchesDept && matchesContract && matchesStatus;
    });

    const getContractBadge = (type: string | null) => {
        if (!type) return null;
        const colors: Record<string, string> = {
            INDEFINIDO: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
            TEMPORAL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
            OBRA_SERVICIO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            PRACTICAS: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
            FORMACION: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
        };
        const labels: Record<string, string> = {
            INDEFINIDO: 'Indefinido',
            TEMPORAL: 'Temporal',
            OBRA_SERVICIO: 'Obra/Servicio',
            PRACTICAS: 'Prácticas',
            FORMACION: 'Formación'
        };
        return (
            <span className={`px-2 py-0.5 text-xs rounded-full ${colors[type] || 'bg-neutral-100 text-neutral-700'}`}>
                {labels[type] || type}
            </span>
        );
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
                            Gestión de Empleados
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            {filteredEmployees.length} empleados
                        </p>
                    </div>
                </div>
                <Link
                    href="/admin/users"
                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors flex items-center gap-2"
                >
                    <Users className="w-4 h-4" />
                    Ir a Admin Usuarios
                </Link>
            </div>

            {/* Search and Filters */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                <div className="flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[300px]">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, email o código..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                            />
                        </div>
                    </div>
                    <select
                        value={filters.department}
                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                        className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    >
                        <option value="">Todos los departamentos</option>
                        <option value="CIVIL_DESIGN">Diseño y Civil</option>
                        <option value="ELECTRICAL">Eléctrico</option>
                        <option value="INSTRUMENTATION">Instrumentación</option>
                        <option value="ADMINISTRATION">Administración</option>
                        <option value="IT">Informática</option>
                        <option value="MARKETING">Marketing</option>
                    </select>
                    <select
                        value={filters.contractType}
                        onChange={(e) => setFilters({ ...filters, contractType: e.target.value })}
                        className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    >
                        <option value="">Tipo de contrato</option>
                        <option value="INDEFINIDO">Indefinido</option>
                        <option value="TEMPORAL">Temporal</option>
                        <option value="OBRA_SERVICIO">Obra/Servicio</option>
                        <option value="PRACTICAS">Prácticas</option>
                    </select>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        className="px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
                    >
                        <option value="">Estado</option>
                        <option value="active">Activo</option>
                        <option value="inactive">Inactivo</option>
                    </select>
                </div>
            </div>

            {/* Employees Table */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50 dark:bg-neutral-700/50">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Empleado</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Código</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Departamento</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Contrato</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">F. Ingreso</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Vacaciones</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Estado</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-600 dark:text-neutral-300 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                            {filteredEmployees.map((emp) => (
                                <motion.tr
                                    key={emp.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-600 font-semibold">
                                                {emp.image ? (
                                                    <img src={emp.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    emp.name?.charAt(0) || '?'
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium text-neutral-900 dark:text-white">{emp.name}</p>
                                                <p className="text-sm text-neutral-500 dark:text-neutral-400">{emp.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="font-mono text-sm text-neutral-600 dark:text-neutral-400">
                                            {emp.employeeCode || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                                        {emp.department?.replace(/_/g, ' ') || '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        {getContractBadge(emp.contractType)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                                        {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('es-ES') : '-'}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4 text-neutral-400" />
                                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                                {emp.vacationDays || 22} días
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {emp.isActive ? (
                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                                <CheckCircle className="w-4 h-4" />
                                                <span className="text-xs">Activo</span>
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-neutral-400">
                                                <AlertCircle className="w-4 h-4" />
                                                <span className="text-xs">Inactivo</span>
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                href={`/hr/employees/${emp.id}`}
                                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                                                title="Ver perfil"
                                            >
                                                <Eye className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                                            </Link>
                                            <Link
                                                href={`/hr/employees/${emp.id}`}
                                                className="p-2 hover:bg-olive-100 dark:hover:bg-olive-900/30 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4 text-olive-600 dark:text-olive-400" />
                                            </Link>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredEmployees.length === 0 && (
                    <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No se encontraron empleados</p>
                    </div>
                )}
            </div>
        </div>
    );
}
