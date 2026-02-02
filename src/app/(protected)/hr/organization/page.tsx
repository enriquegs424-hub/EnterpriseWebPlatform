'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Building2, Users, ChevronLeft, ChevronDown, ChevronRight,
    User, Briefcase, Mail, Phone
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getEmployeesWithHRData } from '../actions';

interface Employee {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role: string;
    department: string;
    employeeCode?: string | null;
    isActive?: boolean;
}

interface DepartmentGroup {
    name: string;
    employees: Employee[];
    managers: Employee[];
}

export default function OrganizationPage() {
    return (
        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'MANAGER']}>
            <OrganizationContent />
        </ProtectedRoute>
    );
}

function OrganizationContent() {
    const [loading, setLoading] = useState(true);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = await getEmployeesWithHRData();
                // Filter to only show ACTIVE employees in the org chart
                const activeEmployees = data.filter((e: Employee) => e.isActive !== false);
                setEmployees(activeEmployees);
                // Expand all departments by default
                const depts = new Set(activeEmployees.map((e: Employee) => e.department || 'OTHER'));
                setExpandedDepts(depts);
            } catch (error) {
                console.error('Error fetching employees:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Group employees by department
    const departments: DepartmentGroup[] = (() => {
        const grouped: Record<string, DepartmentGroup> = {};

        employees.forEach(emp => {
            const dept = emp.department || 'OTHER';
            if (!grouped[dept]) {
                grouped[dept] = { name: dept, employees: [], managers: [] };
            }
            if (['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(emp.role)) {
                grouped[dept].managers.push(emp);
            } else {
                grouped[dept].employees.push(emp);
            }
        });

        return Object.values(grouped).sort((a, b) => {
            // Put departments with managers first
            if (a.managers.length > 0 && b.managers.length === 0) return -1;
            if (a.managers.length === 0 && b.managers.length > 0) return 1;
            return a.name.localeCompare(b.name);
        });
    })();

    // Get executives (SUPERADMIN, ADMIN)
    const executives = employees.filter(e => ['SUPERADMIN', 'ADMIN'].includes(e.role));

    const toggleDept = (dept: string) => {
        const newExpanded = new Set(expandedDepts);
        if (newExpanded.has(dept)) {
            newExpanded.delete(dept);
        } else {
            newExpanded.add(dept);
        }
        setExpandedDepts(newExpanded);
    };

    const formatDeptName = (dept: string) => {
        const names: Record<string, string> = {
            'CIVIL_DESIGN': 'Diseño y Civil',
            'ELECTRICAL': 'Ingeniería Eléctrica',
            'INSTRUMENTATION': 'Instrumentación',
            'ADMINISTRATION': 'Administración',
            'IT': 'Tecnología / IT',
            'MARKETING': 'Marketing',
            'OTHER': 'Otros'
        };
        return names[dept] || dept;
    };

    const getRoleBadge = (role: string) => {
        const colors: Record<string, { bg: string; text: string }> = {
            SUPERADMIN: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400' },
            ADMIN: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400' },
            MANAGER: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400' },
            WORKER: { bg: 'bg-neutral-100 dark:bg-neutral-700', text: 'text-neutral-700 dark:text-neutral-300' }
        };
        const labels: Record<string, string> = {
            SUPERADMIN: 'Super Admin',
            ADMIN: 'Administrador',
            MANAGER: 'Manager',
            WORKER: 'Empleado'
        };
        const c = colors[role] || colors.WORKER;
        return (
            <span className={`px-2 py-0.5 text-xs rounded-full ${c.bg} ${c.text}`}>
                {labels[role] || role}
            </span>
        );
    };

    const PersonCard = ({ person, size = 'md' }: { person: Employee; size?: 'sm' | 'md' | 'lg' }) => {
        const sizeClasses = {
            sm: { avatar: 'w-10 h-10 text-sm', name: 'text-sm' },
            md: { avatar: 'w-12 h-12 text-lg', name: 'text-base' },
            lg: { avatar: 'w-16 h-16 text-xl', name: 'text-lg' }
        };
        const s = sizeClasses[size];

        return (
            <Link href={`/hr/employees/${person.id}`}>
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 hover:shadow-lg transition-shadow cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className={`${s.avatar} rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-600 font-semibold flex-shrink-0`}>
                            {person.image ? (
                                <img src={person.image} alt="" className={`${s.avatar} rounded-full object-cover`} />
                            ) : (
                                person.name?.charAt(0) || '?'
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className={`font-medium text-neutral-900 dark:text-white truncate ${s.name}`}>
                                {person.name}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                {person.employeeCode || person.email}
                            </p>
                            <div className="mt-1">
                                {getRoleBadge(person.role)}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </Link>
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
                            Organigrama
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            Estructura organizacional de la empresa
                        </p>
                    </div>
                </div>
            </div>

            {/* Executive Level */}
            {executives.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-olive-50 to-olive-100 dark:from-olive-900/20 dark:to-olive-900/10 rounded-xl p-6 border border-olive-200 dark:border-olive-800"
                >
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-olive-600" />
                        Dirección
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {executives.map(person => (
                            <PersonCard key={person.id} person={person} size="lg" />
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Departments */}
            <div className="space-y-4">
                {departments.map((dept, index) => (
                    <motion.div
                        key={dept.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
                    >
                        {/* Department Header */}
                        <button
                            onClick={() => toggleDept(dept.name)}
                            className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-olive-100 dark:bg-olive-900/30 rounded-lg">
                                    <Briefcase className="w-5 h-5 text-olive-600 dark:text-olive-400" />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                                        {formatDeptName(dept.name)}
                                    </h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                        {dept.managers.length + dept.employees.length} personas
                                        {dept.managers.length > 0 && ` • ${dept.managers.length} manager${dept.managers.length > 1 ? 's' : ''}`}
                                    </p>
                                </div>
                            </div>
                            {expandedDepts.has(dept.name) ? (
                                <ChevronDown className="w-5 h-5 text-neutral-400" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-neutral-400" />
                            )}
                        </button>

                        {/* Department Content */}
                        {expandedDepts.has(dept.name) && (
                            <div className="px-6 pb-6">
                                {/* Managers */}
                                {dept.managers.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            Responsables
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                            {dept.managers
                                                .filter(m => !executives.find(e => e.id === m.id))
                                                .map(person => (
                                                    <PersonCard key={person.id} person={person} size="md" />
                                                ))}
                                        </div>
                                    </div>
                                )}

                                {/* Employees */}
                                {dept.employees.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-3 flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            Equipo
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                            {dept.employees.map(person => (
                                                <PersonCard key={person.id} person={person} size="sm" />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {dept.managers.length === 0 && dept.employees.length === 0 && (
                                    <p className="text-center text-neutral-500 py-4">
                                        No hay empleados en este departamento
                                    </p>
                                )}
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 text-center">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{employees.length}</p>
                    <p className="text-sm text-neutral-500">Total empleados</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 text-center">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{departments.length}</p>
                    <p className="text-sm text-neutral-500">Departamentos</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 text-center">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">{executives.length}</p>
                    <p className="text-sm text-neutral-500">Directivos</p>
                </div>
                <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 text-center">
                    <p className="text-2xl font-bold text-neutral-900 dark:text-white">
                        {employees.filter(e => e.role === 'MANAGER').length}
                    </p>
                    <p className="text-sm text-neutral-500">Managers</p>
                </div>
            </div>
        </div>
    );
}
