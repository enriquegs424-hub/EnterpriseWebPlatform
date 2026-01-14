"use client";

import { useEffect, useState, use } from "react";
import { getCompanySettings, updateCompanySettings, getCompanyById } from "../../../actions";
import Link from "next/link";
import { ArrowLeft, Shield, Save, Settings, Check, X } from "lucide-react";

const VETO_OPTIONS = [
    { key: "canCreateUsers", label: "Crear usuarios", description: "Permitir al ADMIN crear nuevos usuarios" },
    { key: "canDeleteUsers", label: "Eliminar usuarios", description: "Permitir al ADMIN eliminar usuarios" },
    { key: "canChangeRoles", label: "Cambiar roles", description: "Permitir al ADMIN cambiar roles de usuarios" },
    { key: "canAccessInvoicing", label: "Acceso a facturación", description: "Permitir acceso al módulo de facturas" },
    { key: "canAccessReports", label: "Acceso a reportes", description: "Permitir acceso a reportes financieros" },
    { key: "canExportData", label: "Exportar datos", description: "Permitir exportación de datos" },
    { key: "canViewAuditLogs", label: "Ver logs de auditoría", description: "Permitir ver logs de actividad" },
    { key: "canCreateGuests", label: "Crear invitados", description: "Permitir crear usuarios GUEST" },
];

const MODULES = [
    { key: "projects", label: "Proyectos" },
    { key: "tasks", label: "Tareas" },
    { key: "documents", label: "Documentos" },
    { key: "hours", label: "Control horario" },
    { key: "expenses", label: "Gastos" },
    { key: "invoices", label: "Facturas" },
    { key: "crm", label: "CRM" },
    { key: "analytics", label: "Analytics" },
    { key: "quotes", label: "Presupuestos" },
];

export default function CompanySettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [company, setCompany] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const [companyData, settingsData] = await Promise.all([
                    getCompanyById(id),
                    getCompanySettings(id),
                ]);
                setCompany(companyData);
                setSettings(settingsData);
            } catch (error) {
                console.error("Error loading settings:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [id]);

    async function handleSave() {
        setSaving(true);
        try {
            await updateCompanySettings(id, settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error("Error saving settings:", error);
        } finally {
            setSaving(false);
        }
    }

    function toggleVeto(key: string) {
        setSettings({ ...settings, [key]: !settings[key] });
    }

    function toggleModule(module: string) {
        const modules = settings.modulesEnabled || [];
        const newModules = modules.includes(module)
            ? modules.filter((m: string) => m !== module)
            : [...modules, module];
        setSettings({ ...settings, modulesEnabled: newModules });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/superadmin/companies"
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
                        <Shield className="w-6 h-6 text-purple-600" />
                        Configuración de Permisos
                    </h1>
                    <p className="text-neutral-500">
                        {company?.name} - Controla qué puede hacer el ADMIN de esta empresa
                    </p>
                </div>
            </div>

            {/* Vetos Section */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-purple-600" />
                    Permisos del ADMIN
                </h2>
                <p className="text-sm text-neutral-500 mb-6">
                    Configura las acciones que el administrador de esta empresa puede realizar.
                    Las opciones desactivadas impedirán al ADMIN ejecutar esa acción.
                </p>

                <div className="space-y-4">
                    {VETO_OPTIONS.map((option) => (
                        <div
                            key={option.key}
                            className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-900 rounded-xl"
                        >
                            <div>
                                <p className="font-medium text-neutral-900 dark:text-white">
                                    {option.label}
                                </p>
                                <p className="text-sm text-neutral-500">{option.description}</p>
                            </div>
                            <button
                                onClick={() => toggleVeto(option.key)}
                                className={`relative w-14 h-8 rounded-full transition-colors ${settings?.[option.key]
                                    ? "bg-green-500"
                                    : "bg-neutral-300 dark:bg-neutral-600"
                                    }`}
                            >
                                <div
                                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${settings?.[option.key] ? "translate-x-7" : "translate-x-1"
                                        }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Modules Section */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">
                    Módulos Habilitados
                </h2>
                <p className="text-sm text-neutral-500 mb-6">
                    Los módulos desactivados no aparecerán en el menú de la empresa.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {MODULES.map((module) => {
                        const enabled = settings?.modulesEnabled?.includes(module.key);
                        return (
                            <button
                                key={module.key}
                                onClick={() => toggleModule(module.key)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${enabled
                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                    : "border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900"
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`font-medium ${enabled
                                            ? "text-green-700 dark:text-green-400"
                                            : "text-neutral-600 dark:text-neutral-400"
                                            }`}
                                    >
                                        {module.label}
                                    </span>
                                    {enabled ? (
                                        <Check className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <X className="w-5 h-5 text-neutral-400" />
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all ${saved
                        ? "bg-green-600 text-white"
                        : "bg-purple-600 hover:bg-purple-700 text-white"
                        } disabled:opacity-50`}
                >
                    {saved ? (
                        <>
                            <Check className="w-5 h-5" />
                            Guardado
                        </>
                    ) : saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Guardar Cambios
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
