'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ChevronLeft, Edit2, Calendar, Briefcase, Mail, Phone, Clock,
    FileText, AlertCircle, CheckCircle, User, Building2, CreditCard,
    CalendarDays, Shield
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getEmployeeById, getVacationBalance, updateEmployeeHRData, generateEmployeeCode, toggleEmployeeActive, updateEmployeeSalary } from '../../actions';
import { useToast } from '@/components/ui/Toast';

export default function EmployeeDetailPage() {
    return (
        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'MANAGER']}>
            <EmployeeDetailContent />
        </ProtectedRoute>
    );
}

function EmployeeDetailContent() {
    const params = useParams();
    const router = useRouter();
    const [employee, setEmployee] = useState<any>(null);
    const [vacationBalance, setVacationBalance] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [togglingActive, setTogglingActive] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const toast = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [empData, balance] = await Promise.all([
                    getEmployeeById(params.id as string),
                    getVacationBalance(params.id as string)
                ]);
                setEmployee(empData);
                setVacationBalance(balance);
                setFormData({
                    employeeCode: empData.employeeCode || '',
                    hireDate: empData.hireDate ? new Date(empData.hireDate).toISOString().split('T')[0] : '',
                    contractType: empData.contractType || '',
                    contractEndDate: empData.contractEndDate ? new Date(empData.contractEndDate).toISOString().split('T')[0] : '',
                    vacationDays: empData.vacationDays || 22,
                    salary: empData.salary || '',
                    bankAccount: empData.bankAccount || '',
                    ssNumber: empData.ssNumber || '',
                    emergencyContact: empData.emergencyContact || { name: '', phone: '', relation: '' }
                });
            } catch (error) {
                console.error('Error fetching employee:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params.id]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateEmployeeHRData(params.id as string, {
                employeeCode: formData.employeeCode || undefined,
                hireDate: formData.hireDate ? new Date(formData.hireDate) : undefined,
                contractType: formData.contractType || undefined,
                contractEndDate: formData.contractEndDate ? new Date(formData.contractEndDate) : null,
                vacationDays: parseInt(formData.vacationDays) || 22,
                salary: formData.salary ? parseFloat(formData.salary) : undefined,
                bankAccount: formData.bankAccount || undefined,
                ssNumber: formData.ssNumber || undefined,
                emergencyContact: formData.emergencyContact?.name ? formData.emergencyContact : undefined
            });
            setEditing(false);
            // Refresh data
            const empData = await getEmployeeById(params.id as string);
            setEmployee(empData);
            toast.success('Datos guardados correctamente');
        } catch (error: any) {
            console.error('Error saving:', error);
            toast.error(error.message || 'Error al guardar los datos');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateCode = async () => {
        const code = await generateEmployeeCode();
        setFormData({ ...formData, employeeCode: code });
    };

    const handleToggleActive = async () => {
        setTogglingActive(true);
        try {
            const result = await toggleEmployeeActive(params.id as string);
            setEmployee({ ...employee, isActive: result.isActive });
            toast.success(result.message);
        } catch (error: any) {
            toast.error(error.message || 'Error al cambiar estado');
        } finally {
            setTogglingActive(false);
        }
    };

    const handleSalarySave = async () => {
        if (!formData.salary) return;
        setSaving(true);
        try {
            await updateEmployeeSalary(params.id as string, parseFloat(formData.salary));
            const empData = await getEmployeeById(params.id as string);
            setEmployee(empData);
            toast.success('Salario actualizado');
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar salario');
        } finally {
            setSaving(false);
        }
    };

    const getContractLabel = (type: string) => {
        const labels: Record<string, string> = {
            INDEFINIDO: 'Indefinido',
            TEMPORAL: 'Temporal',
            OBRA_SERVICIO: 'Obra/Servicio',
            PRACTICAS: 'Prácticas',
            FORMACION: 'Formación'
        };
        return labels[type] || type || 'No especificado';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-600"></div>
            </div>
        );
    }

    if (!employee) {
        return (
            <div className="p-6 text-center text-neutral-500">
                Empleado no encontrado
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/hr/employees" className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-600 text-2xl font-bold">
                            {employee.image ? (
                                <img src={employee.image} alt="" className="w-16 h-16 rounded-full object-cover" />
                            ) : (
                                employee.name?.charAt(0)
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                                    {employee.name}
                                </h1>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${employee.isActive
                                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    {employee.isActive ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                            <p className="text-neutral-500 dark:text-neutral-400">
                                {employee.employeeCode || 'Sin código'} • {employee.role}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    {editing ? (
                        <>
                            <button
                                onClick={() => setEditing(false)}
                                className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50"
                            >
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleToggleActive}
                                disabled={togglingActive}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${employee.isActive
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'}`}
                            >
                                {togglingActive ? 'Cambiando...' : (employee.isActive ? 'Desactivar' : 'Activar')}
                            </button>
                            <button
                                onClick={() => setEditing(true)}
                                className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 flex items-center gap-2"
                            >
                                <Edit2 className="w-4 h-4" />
                                Editar
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Basic Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700"
                >
                    <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
                        <User className="w-4 h-4" /> Información Básica
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                            <Mail className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm">{employee.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                            <Building2 className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm">{employee.department?.replace(/_/g, ' ') || 'Sin departamento'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                            <Shield className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm">{employee.role}</span>
                        </div>
                        <div className="flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
                            <Clock className="w-4 h-4 text-neutral-400" />
                            <span className="text-sm">{employee.dailyWorkHours || 8}h/día</span>
                        </div>
                    </div>
                </motion.div>

                {/* Contract Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700"
                >
                    <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Contrato
                    </h3>
                    {editing ? (
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-neutral-500">Código Empleado</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={formData.employeeCode}
                                        onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                                        className="flex-1 px-3 py-1.5 text-sm rounded border dark:bg-neutral-900 dark:border-neutral-700"
                                        placeholder="EMP-001"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleGenerateCode}
                                        className="px-2 py-1 text-xs bg-olive-100 text-olive-600 rounded"
                                    >
                                        Auto
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-neutral-500">Tipo Contrato</label>
                                <select
                                    value={formData.contractType}
                                    onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                                    className="w-full px-3 py-1.5 text-sm rounded border dark:bg-neutral-900 dark:border-neutral-700"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="INDEFINIDO">Indefinido</option>
                                    <option value="TEMPORAL">Temporal</option>
                                    <option value="OBRA_SERVICIO">Obra/Servicio</option>
                                    <option value="PRACTICAS">Prácticas</option>
                                    <option value="FORMACION">Formación</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-neutral-500">Fecha Ingreso</label>
                                <input
                                    type="date"
                                    value={formData.hireDate}
                                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                                    className="w-full px-3 py-1.5 text-sm rounded border dark:bg-neutral-900 dark:border-neutral-700"
                                />
                            </div>
                            {formData.contractType === 'TEMPORAL' && (
                                <div>
                                    <label className="text-xs text-neutral-500">Fin Contrato</label>
                                    <input
                                        type="date"
                                        value={formData.contractEndDate}
                                        onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                                        className="w-full px-3 py-1.5 text-sm rounded border dark:bg-neutral-900 dark:border-neutral-700"
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-neutral-500">Tipo:</span>
                                <span className="text-sm font-medium">{getContractLabel(employee.contractType)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-neutral-500">Ingreso:</span>
                                <span className="text-sm font-medium">
                                    {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('es-ES') : '-'}
                                </span>
                            </div>
                            {employee.contractType === 'TEMPORAL' && employee.contractEndDate && (
                                <div className="flex justify-between">
                                    <span className="text-sm text-neutral-500">Fin:</span>
                                    <span className="text-sm font-medium text-orange-600">
                                        {new Date(employee.contractEndDate).toLocaleDateString('es-ES')}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Vacation Balance */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-olive-600 to-olive-700 rounded-xl p-5 text-white"
                >
                    <h3 className="text-sm font-semibold text-olive-200 mb-4 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" /> Vacaciones {new Date().getFullYear()}
                    </h3>
                    {editing ? (
                        <div>
                            <label className="text-xs text-olive-200">Días anuales</label>
                            <input
                                type="number"
                                value={formData.vacationDays}
                                onChange={(e) => setFormData({ ...formData, vacationDays: e.target.value })}
                                className="w-full px-3 py-1.5 text-sm rounded border bg-white/10 border-olive-500 text-white"
                                min="0"
                                max="60"
                            />
                        </div>
                    ) : vacationBalance ? (
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-olive-200">Total:</span>
                                <span className="font-bold">{vacationBalance.total} días</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-olive-200">Usados:</span>
                                <span className="font-bold">{vacationBalance.used} días</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-olive-200">Pendientes:</span>
                                <span className="font-bold">{vacationBalance.pending} días</span>
                            </div>
                            <hr className="border-olive-500" />
                            <div className="flex justify-between text-lg">
                                <span className="text-olive-200">Disponibles:</span>
                                <span className="font-bold">{vacationBalance.available} días</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-olive-200">Cargando...</p>
                    )}
                </motion.div>
            </div>

            {/* Salary Card - ADMIN only */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white dark:bg-neutral-800 rounded-xl p-5 border border-neutral-200 dark:border-neutral-700"
            >
                <h3 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400 mb-4 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Información Salarial
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs text-neutral-500 mb-1 block">Salario Base Mensual</label>
                        {editing ? (
                            <input
                                type="number"
                                value={formData.salary}
                                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded border dark:bg-neutral-900 dark:border-neutral-700"
                                placeholder="0.00"
                                step="100"
                                min="0"
                            />
                        ) : (
                            <p className="text-xl font-bold text-neutral-900 dark:text-white">
                                {employee.salary
                                    ? new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(Number(employee.salary))
                                    : 'No definido'}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-neutral-500 mb-1 block">Cuenta Bancaria (IBAN)</label>
                        {editing ? (
                            <input
                                type="text"
                                value={formData.bankAccount}
                                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded border dark:bg-neutral-900 dark:border-neutral-700"
                                placeholder="ES00 0000 0000 00 0000000000"
                            />
                        ) : (
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 font-mono">
                                {employee.bankAccount || 'No registrado'}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="text-xs text-neutral-500 mb-1 block">Nº Seguridad Social</label>
                        {editing ? (
                            <input
                                type="text"
                                value={formData.ssNumber}
                                onChange={(e) => setFormData({ ...formData, ssNumber: e.target.value })}
                                className="w-full px-3 py-2 text-sm rounded border dark:bg-neutral-900 dark:border-neutral-700"
                                placeholder="00/00000000/00"
                            />
                        ) : (
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 font-mono">
                                {employee.ssNumber || 'No registrado'}
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Additional Info */}
            {editing && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-800 rounded-xl p-6 border border-neutral-200 dark:border-neutral-700"
                >
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                        Datos Adicionales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Número Seguridad Social
                            </label>
                            <input
                                type="text"
                                value={formData.ssNumber}
                                onChange={(e) => setFormData({ ...formData, ssNumber: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border dark:bg-neutral-900 dark:border-neutral-700"
                                placeholder="XX/XXXXXXXX/XX"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Cuenta Bancaria (IBAN)
                            </label>
                            <input
                                type="text"
                                value={formData.bankAccount}
                                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border dark:bg-neutral-900 dark:border-neutral-700"
                                placeholder="ESXX XXXX XXXX XXXX XXXX"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Contacto de Emergencia
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    value={formData.emergencyContact?.name || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        emergencyContact: { ...formData.emergencyContact, name: e.target.value }
                                    })}
                                    className="px-3 py-2 rounded-lg border dark:bg-neutral-900 dark:border-neutral-700"
                                    placeholder="Nombre"
                                />
                                <input
                                    type="tel"
                                    value={formData.emergencyContact?.phone || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        emergencyContact: { ...formData.emergencyContact, phone: e.target.value }
                                    })}
                                    className="px-3 py-2 rounded-lg border dark:bg-neutral-900 dark:border-neutral-700"
                                    placeholder="Teléfono"
                                />
                                <input
                                    type="text"
                                    value={formData.emergencyContact?.relation || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        emergencyContact: { ...formData.emergencyContact, relation: e.target.value }
                                    })}
                                    className="px-3 py-2 rounded-lg border dark:bg-neutral-900 dark:border-neutral-700"
                                    placeholder="Relación"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Links */}
            <div className="flex gap-4">
                <Link
                    href={`/hr/absences?user=${params.id}`}
                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 flex items-center gap-2"
                >
                    <CalendarDays className="w-4 h-4" />
                    Ver Ausencias
                </Link>
                <Link
                    href={`/admin/users`}
                    className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 flex items-center gap-2"
                >
                    <User className="w-4 h-4" />
                    Ir a Admin Usuarios
                </Link>
            </div>
        </div>
    );
}
