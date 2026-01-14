"use client";

import { useState, useEffect } from "react";
import { getAllDepartmentPermissions, updateDepartmentPermissions, getDepartmentInfo } from "./actions";
import { Building2, Users, Shield, Save, Loader2, Check, X, Minus, Info, ChevronDown, ChevronUp } from "lucide-react";
import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DepartmentsPage() {
    return (
        <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DepartmentsContent />
        </ProtectedRoute>
    );
}

// Recursos y acciones (igual que en PermissionsModal)
const RESOURCES = [
    { id: "tasks", label: "Tareas", icon: "📋" },
    { id: "projects", label: "Proyectos", icon: "📁" },
    { id: "documents", label: "Documentos", icon: "📄" },
    { id: "timeentries", label: "Horas", icon: "⏱️" },
    { id: "expenses", label: "Gastos", icon: "💰" },
    { id: "invoices", label: "Facturas", icon: "🧾" },
    { id: "quotes", label: "Presupuestos", icon: "📝" },
    { id: "clients", label: "Clientes", icon: "👥" },
    { id: "leads", label: "Leads", icon: "🎯" },
];

const ACTIONS = [
    { id: "create", label: "Crear" },
    { id: "read", label: "Ver" },
    { id: "update", label: "Editar" },
    { id: "delete", label: "Borrar" },
    { id: "approve", label: "Aprobar" },
    { id: "export", label: "Exportar" },
];

const DEPARTMENTS = [
    { id: "CIVIL_DESIGN", label: "Diseño y Civil", icon: "📐", color: "text-blue-600 dark:text-blue-400" },
    { id: "ELECTRICAL", label: "Eléctrico", icon: "⚡", color: "text-yellow-600 dark:text-yellow-400" },
    { id: "INSTRUMENTATION", label: "Instrumentación", icon: "🎛️", color: "text-purple-600 dark:text-purple-400" },
    { id: "ADMINISTRATION", label: "Administración", icon: "💼", color: "text-green-600 dark:text-green-400" },
    { id: "IT", label: "Informática", icon: "💻", color: "text-cyan-600 dark:text-cyan-400" },
    { id: "ECONOMIC", label: "Económico", icon: "💰", color: "text-emerald-600 dark:text-emerald-400" },
    { id: "MARKETING", label: "Marketing", icon: "📢", color: "text-pink-600 dark:text-pink-400" },
    { id: "OTHER", label: "Otros", icon: "📦", color: "text-gray-600 dark:text-gray-400" },
];

type PermissionState = boolean | null;

function DepartmentsContent() {
    const [loading, setLoading] = useState(true);
    const [expandedDept, setExpandedDept] = useState<string | null>(null);
    const [departmentData, setDepartmentData] = useState<Record<string, any>>({});
    const [permissions, setPermissions] = useState<Record<string, Record<string, Record<string, PermissionState>>>>({});
    const [saving, setSaving] = useState<string | null>(null);

    useEffect(() => {
        loadAllDepartments();
    }, []);

    const loadAllDepartments = async () => {
        setLoading(true);
        try {
            const data = await getAllDepartmentPermissions();

            const permMatrix: Record<string, Record<string, Record<string, PermissionState>>> = {};
            const deptData: Record<string, any> = {};

            for (const item of data) {
                permMatrix[item.department] = {};

                RESOURCES.forEach(resource => {
                    permMatrix[item.department][resource.id] = {};
                    ACTIONS.forEach(action => {
                        const perm = item.permissions.find(
                            (p: any) => p.resource === resource.id && p.action === action.id
                        );
                        permMatrix[item.department][resource.id][action.id] = perm?.granted ?? null;
                    });
                });

                // Cargar info del departamento
                const info = await getDepartmentInfo(item.department as any);
                deptData[item.department] = info;
            }

            setPermissions(permMatrix);
            setDepartmentData(deptData);
        } catch (error) {
            console.error("Error loading departments:", error);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (dept: string, resource: string, action: string) => {
        setPermissions(prev => {
            const current = prev[dept]?.[resource]?.[action] ?? null;
            let next: PermissionState;

            if (current === null) next = true;
            else if (current === true) next = false;
            else next = null;

            return {
                ...prev,
                [dept]: {
                    ...prev[dept],
                    [resource]: {
                        ...prev[dept]?.[resource],
                        [action]: next,
                    },
                },
            };
        });
    };

    const handleSave = async (dept: string) => {
        setSaving(dept);
        try {
            const permissionsArray: Array<{
                resource: string;
                action: string;
                granted: boolean;
                scope?: string | null;
            }> = [];

            Object.entries(permissions[dept] || {}).forEach(([resource, actions]) => {
                Object.entries(actions).forEach(([action, granted]) => {
                    if (granted !== null) {
                        permissionsArray.push({
                            resource,
                            action,
                            granted: granted as boolean,
                            scope: null,
                        });
                    }
                });
            });

            await updateDepartmentPermissions(dept as any, permissionsArray);
            await loadAllDepartments(); // Recargar
        } catch (error) {
            console.error("Error saving:", error);
            alert("Error al guardar permisos");
        } finally {
            setSaving(null);
        }
    };

    const getPermissionIcon = (state: PermissionState) => {
        if (state === true) return <Check className="w-4 h-4 text-success-600" />;
        if (state === false) return <X className="w-4 h-4 text-error-600" />;
        return <Minus className="w-4 h-4 text-neutral-400" />;
    };

    const getPermissionColor = (state: PermissionState) => {
        if (state === true) return "bg-success-50 dark:bg-success-900/20 border-success-200";
        if (state === false) return "bg-error-50 dark:bg-error-900/20 border-error-200";
        return "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200";
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-olive-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-l-4 border-olive-500 pl-4">
                    Configuración de Departamentos
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 ml-5 mt-1 text-sm">
                    Define permisos automáticos por departamento. Los usuarios heredan estos permisos al ser asignados.
                </p>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-xl text-sm flex items-start gap-3">
                <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                    <strong>¿Cómo funciona?</strong> Cuando asignas un usuario a un departamento, automáticamente recibe los permisos configurados aquí.
                    Los usuarios pueden tener <strong>overrides individuales</strong> que tienen prioridad sobre estos permisos.
                </div>
            </div>

            {/* Departments List */}
            <div className="space-y-4">
                {DEPARTMENTS.map(dept => {
                    const isExpanded = expandedDept === dept.id;
                    const info = departmentData[dept.id];

                    return (
                        <motion.div
                            key={dept.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden"
                        >
                            {/* Department Header */}
                            <button
                                onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl">{dept.icon}</div>
                                    <div className="text-left">
                                        <h3 className={`text-lg font-bold ${dept.color}`}>
                                            {dept.label}
                                        </h3>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            {info?.userCount || 0} usuarios
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {isExpanded && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleSave(dept.id);
                                            }}
                                            disabled={saving === dept.id}
                                            className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 font-bold transition-all shadow-lg shadow-olive-600/20 flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {saving === dept.id ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Guardando...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4" />
                                                    Guardar
                                                </>
                                            )}
                                        </button>
                                    )}
                                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                                </div>
                            </button>

                            {/* Permissions Grid */}
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-neutral-200 dark:border-neutral-800 p-6"
                                >
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-neutral-50 dark:bg-neutral-800">
                                                    <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                                        Recurso
                                                    </th>
                                                    {ACTIONS.map(action => (
                                                        <th
                                                            key={action.id}
                                                            className="px-3 py-3 text-center text-xs font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                                                        >
                                                            {action.label}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {RESOURCES.map(resource => (
                                                    <tr key={resource.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                                                        <td className="px-4 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700">
                                                            <span className="flex items-center gap-2">
                                                                <span>{resource.icon}</span>
                                                                {resource.label}
                                                            </span>
                                                        </td>
                                                        {ACTIONS.map(action => {
                                                            const state = permissions[dept.id]?.[resource.id]?.[action.id] ?? null;
                                                            return (
                                                                <td
                                                                    key={action.id}
                                                                    className="border border-neutral-200 dark:border-neutral-700 p-1"
                                                                >
                                                                    <button
                                                                        onClick={() => togglePermission(dept.id, resource.id, action.id)}
                                                                        className={`w-full h-10 rounded-lg border-2 transition-all flex items-center justify-center hover:scale-105 ${getPermissionColor(state)}`}
                                                                    >
                                                                        {getPermissionIcon(state)}
                                                                    </button>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Users in Department */}
                                    {info?.users && info.users.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                                            <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Usuarios en este departamento ({info.userCount})
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {info.users.map((user: any) => (
                                                    <div
                                                        key={user.id}
                                                        className="flex items-center gap-2 p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg text-sm"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-700 dark:text-olive-400 font-bold">
                                                            {user.name[0]}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                                                                {user.name}
                                                            </p>
                                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                                {user.role}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
