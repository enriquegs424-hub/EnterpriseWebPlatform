"use client";

import { useState, useEffect } from "react";
import { getAllDepartmentPermissions, updateDepartmentPermissions, getDepartmentInfo } from "./actions";
import {
    Building2, Users, Shield, Save, Loader2, Check, X, Minus, Info, ChevronDown, ChevronUp,
    CheckSquare, FolderOpen, FileText, Clock, Receipt, FileCheck, Briefcase, TrendingUp,
    Ruler, Zap, Gauge, Monitor, Coins, Megaphone, Package
} from "lucide-react";
import { motion } from "framer-motion";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function DepartmentsPage() {
    return (
        <ProtectedRoute allowedRoles={["ADMIN"]}>
            <DepartmentsContent />
        </ProtectedRoute>
    );
}

// Recursos y acciones (coinciden con el menú lateral)
const RESOURCES = [
    { id: "tasks", label: "Tareas", Icon: CheckSquare },
    { id: "projects", label: "Proyectos", Icon: Briefcase },
    { id: "documents", label: "Documentos", Icon: FolderOpen },
    { id: "timeentries", label: "Registro Diario", Icon: Clock },
    { id: "expenses", label: "Gastos", Icon: Receipt },
    { id: "invoices", label: "Facturas", Icon: FileText },
    { id: "quotes", label: "Presupuestos", Icon: FileCheck },
    { id: "clients", label: "Clientes", Icon: Users },
    { id: "leads", label: "CRM", Icon: TrendingUp },
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
    { id: "CIVIL_DESIGN", label: "Diseño y Civil", Icon: Ruler, accent: "border-l-olive-500" },
    { id: "ELECTRICAL", label: "Eléctrico", Icon: Zap, accent: "border-l-olive-500" },
    { id: "INSTRUMENTATION", label: "Instrumentación", Icon: Gauge, accent: "border-l-olive-500" },
    { id: "ADMINISTRATION", label: "Administración", Icon: Briefcase, accent: "border-l-olive-500" },
    { id: "IT", label: "Informática", Icon: Monitor, accent: "border-l-olive-500" },
    { id: "ECONOMIC", label: "Económico", Icon: Coins, accent: "border-l-olive-500" },
    { id: "MARKETING", label: "Marketing", Icon: Megaphone, accent: "border-l-olive-500" },
    { id: "OTHER", label: "Otros", Icon: Package, accent: "border-l-neutral-400" },
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
                            className={`bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden border-l-4 ${dept.accent}`}
                        >
                            {/* Department Header */}
                            <div
                                role="button"
                                tabIndex={0}
                                onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        setExpandedDept(isExpanded ? null : dept.id);
                                    }
                                }}
                                className="w-full px-6 py-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
                                        <dept.Icon className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
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
                            </div>

                            {/* Permissions Grid */}
                            {isExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-neutral-200 dark:border-neutral-800 p-6"
                                >
                                    {/* Permissions Card Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {RESOURCES.map(resource => (
                                            <div
                                                key={resource.id}
                                                className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700"
                                            >
                                                {/* Resource Header */}
                                                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                                    <resource.Icon className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                                                    <h4 className="font-semibold text-neutral-900 dark:text-neutral-100">
                                                        {resource.label}
                                                    </h4>
                                                </div>

                                                {/* Actions Grid */}
                                                <div className="grid grid-cols-3 gap-2">
                                                    {ACTIONS.map(action => {
                                                        const state = permissions[dept.id]?.[resource.id]?.[action.id] ?? null;
                                                        return (
                                                            <button
                                                                key={action.id}
                                                                onClick={() => togglePermission(dept.id, resource.id, action.id)}
                                                                className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all hover:scale-105 ${state === true
                                                                    ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                                                    : state === false
                                                                        ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                                                                        : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600'
                                                                    }`}
                                                            >
                                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center mb-1 ${state === true
                                                                    ? 'bg-green-500 text-white'
                                                                    : state === false
                                                                        ? 'bg-red-500 text-white'
                                                                        : 'bg-neutral-300 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300'
                                                                    }`}>
                                                                    {state === true ? <Check className="w-3.5 h-3.5" /> :
                                                                        state === false ? <X className="w-3.5 h-3.5" /> :
                                                                            <Minus className="w-3.5 h-3.5" />}
                                                                </div>
                                                                <span className={`text-[10px] font-bold uppercase tracking-wide ${state === true
                                                                    ? 'text-green-700 dark:text-green-400'
                                                                    : state === false
                                                                        ? 'text-red-700 dark:text-red-400'
                                                                        : 'text-neutral-500 dark:text-neutral-400'
                                                                    }`}>
                                                                    {action.label}
                                                                </span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Users in Department */}
                                    {info?.users && info.users.length > 0 && (
                                        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
                                                    <Users className="w-4 h-4" />
                                                    Usuarios en este departamento
                                                    <span className="ml-2 px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded-full text-xs">
                                                        {info.userCount}
                                                    </span>
                                                </h4>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                                {info.users.map((user: any) => (
                                                    <div
                                                        key={user.id}
                                                        className="flex items-center gap-3 p-3 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition-all"
                                                    >
                                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${user.role === 'ADMIN' ? 'bg-purple-500' :
                                                            user.role === 'MANAGER' ? 'bg-blue-500' :
                                                                'bg-olive-500'
                                                            }`}>
                                                            {user.name?.[0]?.toUpperCase() || '?'}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="font-bold text-neutral-900 dark:text-neutral-100 truncate text-sm">
                                                                {user.name}
                                                            </p>
                                                            <span className={`inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                                                                user.role === 'MANAGER' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                                                    'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400'
                                                                }`}>
                                                                {user.role}
                                                            </span>
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
