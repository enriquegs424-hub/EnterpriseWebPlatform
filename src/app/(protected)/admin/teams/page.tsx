"use client";

import { useEffect, useState } from "react";
import { getTeams, createTeam, deleteTeam, getManagerCandidates } from "./actions";
import Link from "next/link";
import { Users, Plus, Search, Trash2, Edit, UserCircle } from "lucide-react";

export default function TeamsPage() {
    const [teams, setTeams] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ name: "", description: "", managerId: "" });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [teamsData, managersData] = await Promise.all([
                getTeams(),
                getManagerCandidates(),
            ]);
            setTeams(teamsData);
            setManagers(managersData);
        } catch (error) {
            console.error("Error loading teams:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        try {
            await createTeam({
                name: formData.name,
                description: formData.description || undefined,
                managerId: formData.managerId || undefined,
            });
            setShowModal(false);
            setFormData({ name: "", description: "", managerId: "" });
            loadData();
        } catch (error) {
            console.error("Error creating team:", error);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(id: string, name: string) {
        if (confirm(`¿Eliminar el equipo "${name}"?`)) {
            try {
                await deleteTeam(id);
                loadData();
            } catch (error) {
                console.error("Error deleting team:", error);
            }
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-olive-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-olive-600" />
                        Gestión de Equipos
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Organiza a tus empleados en equipos
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 bg-olive-600 hover:bg-olive-700 text-white px-6 py-3 rounded-xl font-bold transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Equipo
                </button>
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                    <div
                        key={team.id}
                        className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                                    {team.name}
                                </h3>
                                {team.description && (
                                    <p className="text-sm text-neutral-500 mt-1">{team.description}</p>
                                )}
                            </div>
                            <span className="px-3 py-1 bg-olive-100 dark:bg-olive-900/30 text-olive-700 dark:text-olive-400 rounded-full text-sm font-bold">
                                {team._count.members} miembros
                            </span>
                        </div>

                        {/* Manager */}
                        <div className="flex items-center gap-3 mb-4 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xl">
                            {team.manager ? (
                                <>
                                    <div className="w-10 h-10 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center">
                                        {team.manager.image ? (
                                            <img
                                                src={team.manager.image}
                                                alt=""
                                                className="w-10 h-10 rounded-full object-cover"
                                            />
                                        ) : (
                                            <UserCircle className="w-6 h-6 text-olive-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                            {team.manager.name}
                                        </p>
                                        <p className="text-xs text-neutral-500">Manager</p>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm text-neutral-400 italic">Sin manager asignado</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <Link
                                href={`/admin/teams/${team.id}`}
                                className="flex-1 flex items-center justify-center gap-2 py-2 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-lg text-sm font-medium transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                Editar
                            </Link>
                            <button
                                onClick={() => handleDelete(team.id, team.name)}
                                className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {teams.length === 0 && (
                <div className="text-center py-12 bg-neutral-50 dark:bg-neutral-900 rounded-2xl">
                    <Users className="w-16 h-16 mx-auto text-neutral-300 dark:text-neutral-600 mb-4" />
                    <p className="text-neutral-500">No hay equipos creados</p>
                    <button
                        onClick={() => setShowModal(true)}
                        className="mt-4 text-olive-600 hover:text-olive-700 font-medium"
                    >
                        Crear el primer equipo
                    </button>
                </div>
            )}

            {/* Create Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full p-8">
                        <h2 className="text-2xl font-black text-neutral-900 dark:text-white mb-6">
                            Nuevo Equipo
                        </h2>

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
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-olive-500 outline-none"
                                    placeholder="Equipo de Ingeniería"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-olive-500 outline-none resize-none"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Manager
                                </label>
                                <select
                                    value={formData.managerId}
                                    onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                                    className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-olive-500 outline-none"
                                >
                                    <option value="">Sin manager</option>
                                    {managers.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.name} ({m.email})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 px-6 py-3 border border-neutral-200 dark:border-neutral-700 rounded-xl font-bold hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-6 py-3 bg-olive-600 hover:bg-olive-700 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                                >
                                    {submitting ? "Creando..." : "Crear Equipo"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
