"use client";

import { useState, useEffect } from "react";
import { getUserPermissions, updateUserPermissions } from "./actions";
import { Shield, Check, X, Minus, Info, Save, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Definir recursos y acciones disponibles
const RESOURCES = [
    { id: "tasks", label: "Tareas" },
    { id: "projects", label: "Proyectos" },
    { id: "documents", label: "Documentos" },
    { id: "timeentries", label: "Horas" },
    { id: "expenses", label: "Gastos" },
    { id: "invoices", label: "Facturas" },
    { id: "quotes", label: "Presupuestos" },
    { id: "clients", label: "Clientes" },
    { id: "leads", label: "Leads" },
    { id: "users", label: "Usuarios" },
    { id: "teams", label: "Equipos" },
    { id: "analytics", label: "Analíticas" },
    { id: "settings", label: "Configuración" },
];

const ACTIONS = [
    { id: "create", label: "Crear", icon: "+" },
    { id: "read", label: "Ver", icon: "👁️" },
    { id: "update", label: "Editar", icon: "✏️" },
    { id: "delete", label: "Borrar", icon: "🗑️" },
    { id: "approve", label: "Aprobar", icon: "✓" },
    { id: "export", label: "Exportar", icon: "📤" },
];

type PermissionState = boolean | null; // true = granted, false = denied, null = default

interface PermissionsModalProps {
    userId: string;
    userName: string;
    userRole: string;
    userDepartment: string;
    onClose: () => void;
    onSave?: () => void;
}

export function PermissionsModal({
    userId,
    userName,
    userRole,
    userDepartment,
    onClose,
    onSave,
}: PermissionsModalProps) {
    const [permissions, setPermissions] = useState<Record<string, Record<string, PermissionState>>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadPermissions();
    }, [userId]);

    const loadPermissions = async () => {
        setLoading(true);
        try {
            const userPerms = await getUserPermissions(userId);

            // Inicializar matriz de permisos
            const matrix: Record<string, Record<string, PermissionState>> = {};
            RESOURCES.forEach(resource => {
                matrix[resource.id] = {};
                ACTIONS.forEach(action => {
                    // Buscar si hay override
                    const override = userPerms.find(
                        (p: any) => p.resource === resource.id && p.action === action.id
                    );
                    matrix[resource.id][action.id] = override ? override.granted : null;
                });
            });

            setPermissions(matrix);
        } catch (error) {
            console.error("Error loading permissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (resource: string, action: string) => {
        setPermissions(prev => {
            const current = prev[resource]?.[action] ?? null;
            let next: PermissionState;

            // Ciclo: null → true → false → null
            if (current === null) next = true;
            else if (current === true) next = false;
            else next = null;

            return {
                ...prev,
                [resource]: {
                    ...prev[resource],
                    [action]: next,
                },
            };
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Convertir matriz a array de permisos
            const permissionsArray: Array<{
                resource: string;
                action: string;
                granted: boolean | null;
            }> = [];

            Object.entries(permissions).forEach(([resource, actions]) => {
                Object.entries(actions).forEach(([action, granted]) => {
                    permissionsArray.push({ resource, action, granted });
                });
            });

            await updateUserPermissions(userId, permissionsArray);
            onSave?.();
            onClose();
        } catch (error) {
            console.error("Error saving permissions:", error);
            alert("Error al guardar permisos");
        } finally {
            setSaving(false);
        }
    };

    const getPermissionIcon = (state: PermissionState) => {
        if (state === true) return <Check className="w-4 h-4 text-success-600" />;
        if (state === false) return <X className="w-4 h-4 text-error-600" />;
        return <Minus className="w-4 h-4 text-neutral-400" />;
    };

    const getPermissionColor = (state: PermissionState) => {
        if (state === true) return "bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800";
        if (state === false) return "bg-error-50 dark:bg-error-900/20 border-error-200 dark:border-error-800";
        return "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-200 dark:border-neutral-700";
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-neutral-200 dark:border-neutral-800"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-gradient-to-r from-olive-50 to-transparent dark:from-olive-900/10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-olive-600 dark:text-olive-500" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                                    Permisos Granulares
                                </h3>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {userName} • {userRole} • {userDepartment}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-2"
                        >
                            ×
                        </button>
                    </div>

                    {/* Info Banner */}
                    <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs flex items-start gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <div>
                            <strong>Leyenda:</strong> ✓ = Permitido (override) | ✗ = Denegado (override) | − = Por defecto (heredado de rol + departamento)
                        </div>
                    </div>

                    {/* Permissions Grid */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-olive-600 animate-spin" />
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-neutral-50 dark:bg-neutral-800">
                                            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 sticky left-0 bg-neutral-50 dark:bg-neutral-800 z-10">
                                                Recurso
                                            </th>
                                            {ACTIONS.map(action => (
                                                <th
                                                    key={action.id}
                                                    className="px-3 py-3 text-center text-xs font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                                                >
                                                    <div>{action.icon}</div>
                                                    <div className="mt-1">{action.label}</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {RESOURCES.map(resource => (
                                            <tr key={resource.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                                                <td className="px-4 py-2 text-sm font-medium text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 sticky left-0 bg-white dark:bg-neutral-900 z-10">
                                                    {resource.label}
                                                </td>
                                                {ACTIONS.map(action => {
                                                    const state = permissions[resource.id]?.[action.id] ?? null;
                                                    return (
                                                        <td
                                                            key={action.id}
                                                            className="border border-neutral-200 dark:border-neutral-700 p-1"
                                                        >
                                                            <button
                                                                onClick={() => togglePermission(resource.id, action.id)}
                                                                className={`w-full h-10 rounded-lg border-2 transition-all flex items-center justify-center hover:scale-105 ${getPermissionColor(state)}`}
                                                                title={`Click para cambiar: ${state === null ? "Default" : state ? "Permitido" : "Denegado"}`}
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
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/30">
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                            Los permisos "por defecto" (−) se heredan del rol y departamento
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 font-bold transition-all shadow-lg shadow-olive-600/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
