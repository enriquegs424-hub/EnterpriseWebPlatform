"use client";

import { useEffect, useState } from "react";
import { getCompanies, createCompany, updateCompany, deleteCompany } from "../actions";
import Link from "next/link";
import {
    Building2,
    Plus,
    Search,
    Settings,
    Users,
    Briefcase,
    MoreVertical,
    Edit,
    Trash2,
    Power,
    ChevronRight,
} from "lucide-react";

export default function CompaniesPage() {
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        slug: "",
        email: "",
        phone: "",
        address: "",
        taxId: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        loadCompanies();
    }, []);

    async function loadCompanies() {
        try {
            const data = await getCompanies();
            setCompanies(data);
        } catch (error) {
            console.error("Error loading companies:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError("");

        try {
            await createCompany(formData);
            setShowCreateModal(false);
            setFormData({ name: "", slug: "", email: "", phone: "", address: "", taxId: "" });
            loadCompanies();
        } catch (err: any) {
            setError(err.message || "Error al crear empresa");
        } finally {
            setSubmitting(false);
        }
    }

    async function handleToggleActive(id: string, currentActive: boolean) {
        if (confirm(currentActive ? "¿Desactivar esta empresa?" : "¿Reactivar esta empresa?")) {
            try {
                await updateCompany(id, { isActive: !currentActive });
                loadCompanies();
            } catch (error) {
                console.error("Error toggling company:", error);
            }
        }
    }

    const filteredCompanies = companies.filter(
        (c) =>
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
                        <Building2 className="w-8 h-8 text-purple-600" />
                        Gestión de Empresas
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Administra todas las empresas de la plataforma
                    </p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Empresa
                </button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar empresas..."
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                />
            </div>

            {/* Companies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCompanies.map((company) => (
                    <div
                        key={company.id}
                        className={`bg-white dark:bg-neutral-800 rounded-2xl border-2 p-6 transition-all hover:shadow-lg ${company.isActive
                                ? "border-neutral-200 dark:border-neutral-700"
                                : "border-red-200 dark:border-red-900 opacity-60"
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                    {company.name}
                                </h3>
                                <p className="text-sm text-neutral-500">/{company.slug}</p>
                            </div>
                            <div
                                className={`px-2 py-1 rounded-full text-xs font-bold ${company.isActive
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    }`}
                            >
                                {company.isActive ? "Activa" : "Inactiva"}
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
                            <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {company._count.users}
                            </span>
                            <span className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {company._count.projects}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                href={`/superadmin/companies/${company.id}`}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                Editar
                            </Link>
                            <Link
                                href={`/superadmin/companies/${company.id}/settings`}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-lg text-sm font-medium text-purple-700 dark:text-purple-400 transition-colors"
                            >
                                <Settings className="w-4 h-4" />
                                Permisos
                            </Link>
                            <button
                                onClick={() => handleToggleActive(company.id, company.isActive)}
                                className={`p-2 rounded-lg transition-colors ${company.isActive
                                        ? "bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200"
                                        : "bg-green-100 dark:bg-green-900/30 text-green-600 hover:bg-green-200"
                                    }`}
                                title={company.isActive ? "Desactivar" : "Activar"}
                            >
                                <Power className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredCompanies.length === 0 && (
                <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-900 rounded-2xl">
                    <Building2 className="w-16 h-16 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
                    <p className="text-neutral-500">No se encontraron empresas</p>
                </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full p-8">
                        <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-6">
                            Nueva Empresa
                        </h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="Constructora López S.L."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Slug (URL) *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.slug}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                                        })
                                    }
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="constructora-lopez"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Teléfono
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    NIF/CIF
                                </label>
                                <input
                                    type="text"
                                    value={formData.taxId}
                                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-6 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                                >
                                    {submitting ? "Creando..." : "Crear Empresa"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
