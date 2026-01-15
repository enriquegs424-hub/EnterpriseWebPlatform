"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getTeamById, updateTeam, addTeamMember, removeTeamMember, getAvailableUsers, getManagerCandidates, getProjectsForTeam, createTeamChat, createTeamTask } from "../actions";
import { Users, ArrowLeft, Save, Loader2, UserPlus, UserMinus, Search, Edit2, X, Check, MessageSquare, Briefcase, ExternalLink, ClipboardList } from "lucide-react";
import Link from "next/link";

export default function TeamDetailPage() {
    const params = useParams();
    const router = useRouter();
    const teamId = params.id as string;

    const [team, setTeam] = useState<any>(null);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);
    const [managers, setManagers] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [creatingChat, setCreatingChat] = useState(false);
    const [creatingTask, setCreatingTask] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: "", description: "", managerId: "", projectId: "" });
    const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "MEDIUM", type: "GENERAL", dueDate: "" });

    useEffect(() => {
        loadTeam();
    }, [teamId]);

    async function loadTeam() {
        try {
            const [teamData, available, managersData, projectsData] = await Promise.all([
                getTeamById(teamId),
                getAvailableUsers(teamId),
                getManagerCandidates(),
                getProjectsForTeam(),
            ]);
            setTeam(teamData);
            setAvailableUsers(available);
            setManagers(managersData);
            setProjects(projectsData);
            if (teamData) {
                setEditForm({
                    name: teamData.name,
                    description: teamData.description || "",
                    managerId: teamData.managerId || "",
                    projectId: teamData.projectId || "",
                });
            }
        } catch (error) {
            console.error("Error loading team:", error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            await updateTeam(teamId, {
                name: editForm.name,
                description: editForm.description || undefined,
                managerId: editForm.managerId || null,
                projectId: editForm.projectId || null,
            });
            setIsEditing(false);
            loadTeam();
        } catch (error) {
            console.error("Error saving:", error);
        } finally {
            setSaving(false);
        }
    }

    async function handleCreateChat() {
        if (team.chatId) {
            router.push(`/chat?chatId=${team.chatId}`);
            return;
        }
        setCreatingChat(true);
        try {
            await createTeamChat(teamId);
            loadTeam();
            alert("Chat de equipo creado exitosamente. Los miembros han sido notificados.");
        } catch (error: any) {
            alert(error.message || "Error al crear el chat");
        } finally {
            setCreatingChat(false);
        }
    }

    async function handleCreateTask(e: React.FormEvent) {
        e.preventDefault();
        if (!taskForm.title.trim()) return;

        setCreatingTask(true);
        try {
            const result = await createTeamTask(teamId, {
                title: taskForm.title,
                description: taskForm.description || undefined,
                priority: taskForm.priority as any,
                type: taskForm.type as any,
                dueDate: taskForm.dueDate || undefined,
            });
            setShowTaskModal(false);
            setTaskForm({ title: "", description: "", priority: "MEDIUM", type: "GENERAL", dueDate: "" });
            alert(`¡Éxito! Se han creado ${result.count} tareas para el equipo. Los miembros han sido notificados.`);
        } catch (error: any) {
            alert(error.message || "Error al crear las tareas");
        } finally {
            setCreatingTask(false);
        }
    }

    async function handleAddMember(userId: string) {
        try {
            await addTeamMember(teamId, userId);
            loadTeam();
        } catch (error) {
            console.error("Error adding member:", error);
        }
    }

    async function handleRemoveMember(userId: string, userName: string) {
        if (confirm(`¿Eliminar a ${userName} del equipo?`)) {
            try {
                await removeTeamMember(teamId, userId);
                loadTeam();
            } catch (error) {
                console.error("Error removing member:", error);
            }
        }
    }

    const filteredAvailable = availableUsers.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            MANAGER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            WORKER: "bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-400",
        };
        return colors[role] || colors.WORKER;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 text-olive-600 animate-spin" />
            </div>
        );
    }

    if (!team) {
        return (
            <div className="text-center py-12">
                <p className="text-neutral-500">Equipo no encontrado</p>
                <Link href="/admin/teams" className="text-olive-600 hover:underline mt-2 inline-block">
                    Volver a equipos
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/teams"
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
                            <Users className="w-7 h-7 text-olive-600" />
                            {isEditing ? "Editando Equipo" : team.name}
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                            {team.members?.length || 0} miembros
                        </p>
                    </div>
                </div>
                {!isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg font-medium transition-colors"
                    >
                        <Edit2 className="w-4 h-4" />
                        Editar
                    </button>
                )}
            </div>

            {/* Edit Form */}
            {isEditing && (
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white mb-4">Información del Equipo</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Nombre *
                            </label>
                            <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Manager
                            </label>
                            <select
                                value={editForm.managerId}
                                onChange={(e) => setEditForm({ ...editForm, managerId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500 outline-none"
                            >
                                <option value="">Sin manager</option>
                                {managers.map((m) => (
                                    <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Proyecto Vinculado
                            </label>
                            <select
                                value={editForm.projectId}
                                onChange={(e) => setEditForm({ ...editForm, projectId: e.target.value })}
                                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500 outline-none"
                            >
                                <option value="">Sin proyecto</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Descripción
                            </label>
                            <textarea
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500 outline-none resize-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving || !editForm.name}
                            className="flex items-center gap-2 px-4 py-2 bg-olive-600 hover:bg-olive-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Guardar
                        </button>
                    </div>
                </div>
            )}

            {/* Team Info & Quick Actions */}
            {!isEditing && (
                <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 p-6">
                    {/* Description */}
                    {team.description && (
                        <p className="text-neutral-600 dark:text-neutral-400 mb-4">{team.description}</p>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Manager */}
                        {team.manager && (
                            <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                                {team.manager.image ? (
                                    <img src={team.manager.image} alt={team.manager.name} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-700 dark:text-olive-400 font-bold">
                                        {team.manager.name?.[0]?.toUpperCase() || "?"}
                                    </div>
                                )}
                                <div>
                                    <p className="font-semibold text-neutral-900 dark:text-white text-sm">{team.manager.name}</p>
                                    <p className="text-xs text-neutral-500">Manager</p>
                                </div>
                            </div>
                        )}

                        {/* Linked Project */}
                        {team.project ? (
                            <Link
                                href={`/admin/projects`}
                                className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            >
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-neutral-900 dark:text-white text-sm truncate">{team.project.code}</p>
                                    <p className="text-xs text-neutral-500 truncate">{team.project.name}</p>
                                </div>
                                <ExternalLink className="w-4 h-4 text-neutral-400" />
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg text-neutral-400">
                                <Briefcase className="w-5 h-5" />
                                <span className="text-sm">Sin proyecto vinculado</span>
                            </div>
                        )}

                        {/* Chat Action */}
                        <button
                            onClick={handleCreateChat}
                            disabled={creatingChat}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${team.chatId
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100'
                                : 'bg-olive-50 dark:bg-olive-900/20 text-olive-700 dark:text-olive-400 hover:bg-olive-100'
                                }`}
                        >
                            {creatingChat ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <MessageSquare className="w-5 h-5" />
                            )}
                            <span className="text-sm font-medium">
                                {team.chatId ? "Ir al Chat" : "Crear Chat"}
                            </span>
                        </button>

                        {/* Assign Task Action */}
                        <button
                            onClick={() => setShowTaskModal(true)}
                            className="flex items-center gap-3 p-3 rounded-lg transition-colors bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 hover:bg-purple-100"
                        >
                            <ClipboardList className="w-5 h-5" />
                            <span className="text-sm font-medium">Asignar Tarea</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Members Section */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-olive-600" />
                        Miembros ({team.members?.length || 0})
                    </h2>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-olive-600 hover:bg-olive-700 text-white rounded-lg font-bold transition-colors"
                    >
                        <UserPlus className="w-4 h-4" />
                        Añadir Miembro
                    </button>
                </div>

                {team.members?.length > 0 ? (
                    <div className="divide-y divide-neutral-200 dark:divide-neutral-700">
                        {team.members.map((member: any) => (
                            <div
                                key={member.id}
                                className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    {member.image ? (
                                        <img src={member.image} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-bold">
                                            {member.name?.[0]?.toUpperCase() || "?"}
                                        </div>
                                    )}
                                    <div>
                                        <p className="font-semibold text-neutral-900 dark:text-white">{member.name}</p>
                                        <p className="text-sm text-neutral-500">{member.email}</p>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${getRoleBadge(member.role)}`}>
                                        {member.role}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleRemoveMember(member.id, member.name)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Eliminar del equipo"
                                >
                                    <UserMinus className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="px-6 py-12 text-center">
                        <Users className="w-12 h-12 mx-auto text-neutral-300 dark:text-neutral-600 mb-3" />
                        <p className="text-neutral-500">Este equipo no tiene miembros</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="mt-3 text-olive-600 hover:text-olive-700 font-medium"
                        >
                            Añadir el primer miembro
                        </button>
                    </div>
                )}
            </div>

            {/* Add Member Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">Añadir Miembro</h2>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar usuario..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 pb-4">
                            {filteredAvailable.length > 0 ? (
                                <div className="space-y-2">
                                    {filteredAvailable.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg"
                                        >
                                            <div className="flex items-center gap-3">
                                                {user.image ? (
                                                    <img src={user.image} alt={user.name} className="w-9 h-9 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-9 h-9 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-300 font-bold text-sm">
                                                        {user.name?.[0]?.toUpperCase() || "?"}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-medium text-neutral-900 dark:text-white">{user.name}</p>
                                                    <p className="text-xs text-neutral-500">{user.email}</p>
                                                </div>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded ${getRoleBadge(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleAddMember(user.id)}
                                                className="p-2 bg-olive-100 dark:bg-olive-900/30 text-olive-600 hover:bg-olive-200 rounded-lg transition-colors"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-neutral-500">
                                        {searchTerm ? "No se encontraron usuarios" : "No hay usuarios disponibles"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Task Assignment Modal */}
            {showTaskModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full">
                        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <ClipboardList className="w-5 h-5 text-purple-600" />
                                Asignar Tarea al Equipo
                            </h2>
                            <button
                                onClick={() => setShowTaskModal(false)}
                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="p-6 space-y-4">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 -mt-2 mb-4">
                                Se creará una tarea individual para cada uno de los {team?.members?.length || 0} miembros del equipo.
                            </p>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Título de la tarea *
                                </label>
                                <input
                                    type="text"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    placeholder="Ej: Revisar documentación del proyecto"
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    placeholder="Detalles adicionales..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Prioridad
                                    </label>
                                    <select
                                        value={taskForm.priority}
                                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="LOW">Baja</option>
                                        <option value="MEDIUM">Media</option>
                                        <option value="HIGH">Alta</option>
                                        <option value="URGENT">Urgente</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Tipo
                                    </label>
                                    <select
                                        value={taskForm.type}
                                        onChange={(e) => setTaskForm({ ...taskForm, type: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    >
                                        <option value="GENERAL">General</option>
                                        <option value="PROJECT">Proyecto</option>
                                        <option value="MEETING">Reunión</option>
                                        <option value="REVIEW">Revisión</option>
                                        <option value="MAINTENANCE">Mantenimiento</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                        Fecha límite
                                    </label>
                                    <input
                                        type="date"
                                        value={taskForm.dueDate}
                                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowTaskModal(false)}
                                    className="flex-1 px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingTask || !taskForm.title.trim()}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                                >
                                    {creatingTask ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <ClipboardList className="w-4 h-4" />
                                    )}
                                    Crear Tareas
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
