'use client';

import { useState, useEffect } from 'react';
import { getUsers, updateUser, inviteUser } from '@/app/admin/actions';
import {
    User, Shield, Briefcase, Mail, CheckCircle, XCircle, MoreVertical, Edit2,
    Search, Filter, Plus, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [pages, setPages] = useState(1);

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        role: 'ALL',
        department: 'ALL',
        status: 'ALL',
        page: 1
    });

    // Modals
    const [editingUser, setEditingUser] = useState<any>(null);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteData, setInviteData] = useState({
        name: '',
        email: '',
        role: 'WORKER',
        department: 'ENGINEERING'
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await getUsers(filters);
            setUsers(data.users);
            setTotal(data.total);
            setPages(data.pages);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchUsers, 300);
        return () => clearTimeout(timeout);
    }, [filters]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await inviteUser(inviteData);
            setShowInviteModal(false);
            setInviteData({ name: '', email: '', role: 'WORKER', department: 'ENGINEERING' });
            fetchUsers();
        } catch (error) {
            alert('Error invitando usuario');
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        await updateUser(editingUser.id, editingUser);
        setEditingUser(null);
        fetchUsers();
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-l-4 border-olive-500 pl-4">Gestión de Usuarios</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 ml-5 mt-1 text-sm">Administra el acceso y roles del equipo</p>
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors font-bold shadow-lg shadow-olive-600/20"
                >
                    <Plus size={18} />
                    Invitar Usuario
                </button>
            </div>

            {/* Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="relative md:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 w-4 h-4" />
                    <input
                        placeholder="Buscar por nombre..."
                        className="w-full pl-9 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm focus:ring-2 focus:ring-olive-500/20 outline-none"
                        value={filters.search}
                        onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    />
                </div>

                <select
                    className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm outline-none focus:border-olive-500"
                    value={filters.role}
                    onChange={e => setFilters({ ...filters, role: e.target.value, page: 1 })}
                >
                    <option value="ALL">Todos los Roles</option>
                    <option value="ADMIN">Administradores</option>
                    <option value="MANAGER">Managers</option>
                    <option value="WORKER">Trabajadores</option>
                    <option value="CLIENT">Clientes</option>
                </select>

                <select
                    className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm outline-none focus:border-olive-500"
                    value={filters.department}
                    onChange={e => setFilters({ ...filters, department: e.target.value, page: 1 })}
                >
                    <option value="ALL">Todos los Deptos</option>
                    <option value="ENGINEERING">Ingeniería</option>
                    <option value="ARCHITECTURE">Arquitectura</option>
                    <option value="ADMINISTRATION">Administración</option>
                </select>

                <select
                    className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg text-sm outline-none focus:border-olive-500"
                    value={filters.status}
                    onChange={e => setFilters({ ...filters, status: e.target.value, page: 1 })}
                >
                    <option value="ALL">Cualquier Estado</option>
                    <option value="ACTIVE">Activos</option>
                    <option value="INACTIVE">Inactivos</option>
                </select>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center items-center">
                        <Loader2 className="w-8 h-8 text-olive-600 animate-spin" />
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                                <thead className="bg-neutral-50 dark:bg-neutral-800">
                                    <tr>
                                        <th className="px-6 py-4 text-left font-semibold text-neutral-600 dark:text-neutral-400">Usuario</th>
                                        <th className="px-6 py-4 text-left font-semibold text-neutral-600 dark:text-neutral-400">Rol</th>
                                        <th className="px-6 py-4 text-left font-semibold text-neutral-600 dark:text-neutral-400">Departamento</th>
                                        <th className="px-6 py-4 text-left font-semibold text-neutral-600 dark:text-neutral-400">Horas/Día</th>
                                        <th className="px-6 py-4 text-left font-semibold text-neutral-600 dark:text-neutral-400">Estado</th>
                                        <th className="px-6 py-4 text-right font-semibold text-neutral-600 dark:text-neutral-400">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {users.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-neutral-500 dark:text-neutral-400">
                                                No se encontraron usuarios
                                            </td>
                                        </tr>
                                    ) : (
                                        users.map((user) => (
                                            <motion.tr
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                key={user.id}
                                                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="w-8 h-8 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-700 dark:text-olive-400 font-bold mr-3">
                                                            {user.name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-neutral-900 dark:text-neutral-100">{user.name}</p>
                                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' :
                                                        user.role === 'MANAGER' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' :
                                                            user.role === 'CLIENT' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                                                                'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                                                        }`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                                                    {user.department}
                                                </td>
                                                <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 font-mono">
                                                    {user.dailyWorkHours || 8}h
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`flex items-center text-xs font-bold ${user.isActive ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'
                                                        }`}>
                                                        {user.isActive ? <CheckCircle size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}
                                                        {user.isActive ? 'ACTIVO' : 'INACTIVO'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => setEditingUser({ ...user })}
                                                        className="p-2 text-neutral-400 hover:text-olive-600 dark:hover:text-olive-400 hover:bg-olive-50 dark:hover:bg-olive-900/20 rounded-lg transition-all"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-neutral-50/50 dark:bg-neutral-800/10">
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                Mostrando {users.length} de {total} usuarios
                            </span>
                            <div className="flex gap-2">
                                <button
                                    disabled={filters.page === 1}
                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                    className="p-1 rounded hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-50 text-neutral-600 dark:text-neutral-400 transition-colors"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="px-3 py-1 bg-white dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700 text-xs font-semibold flex items-center text-neutral-900 dark:text-neutral-100">
                                    {filters.page} / {pages || 1}
                                </span>
                                <button
                                    disabled={filters.page >= pages}
                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                    className="p-1 rounded hover:bg-white dark:hover:bg-neutral-700 disabled:opacity-50 text-neutral-600 dark:text-neutral-400 transition-colors"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {editingUser && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-neutral-200 dark:border-neutral-800"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Editar Usuario</h3>
                                        <button onClick={() => setEditingUser(null)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">&times;</button>
                                    </div>

                                    <form onSubmit={handleUpdate} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Nombre</label>
                                            <input
                                                value={editingUser.name}
                                                onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                                className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={editingUser.email}
                                                onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                                className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Rol</label>
                                                <select
                                                    value={editingUser.role}
                                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                                    className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                                >
                                                    <option value="ADMIN">ADMIN</option>
                                                    <option value="MANAGER">MANAGER</option>
                                                    <option value="WORKER">WORKER</option>
                                                    <option value="CLIENT">CLIENT</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Dpto.</label>
                                                <select
                                                    value={editingUser.department}
                                                    onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                                                    className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                                >
                                                    <option value="ADMINISTRATION">ADMINISTRATION</option>
                                                    <option value="ENGINEERING">ENGINEERING</option>
                                                    <option value="ARCHITECTURE">ARCHITECTURE</option>
                                                    <option value="OTHER">OTHER</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Carga Diaria (Horas)</label>
                                            <input
                                                type="number" step="0.5"
                                                value={editingUser.dailyWorkHours || 8}
                                                onChange={e => setEditingUser({ ...editingUser, dailyWorkHours: e.target.value })}
                                                className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-3 pt-2">
                                            <input
                                                type="checkbox"
                                                checked={editingUser.isActive}
                                                onChange={e => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                                                className="w-4 h-4 text-olive-600 rounded border-neutral-300 focus:ring-olive-500"
                                            />
                                            <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Usuario Activo</label>
                                        </div>

                                        <div className="pt-6 flex space-x-3">
                                            <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium transition-colors">Cancelar</button>
                                            <button type="submit" className="flex-1 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 font-bold transition-all shadow-lg shadow-olive-600/20">Guardar Cambios</button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}

                        {/* Invite Modal */}
                        {showInviteModal && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-neutral-200 dark:border-neutral-800"
                                >
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center">
                                                <Mail className="w-5 h-5 text-olive-600 dark:text-olive-500" />
                                            </div>
                                            <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Invitar Usuario</h3>
                                        </div>
                                        <button onClick={() => setShowInviteModal(false)} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">&times;</button>
                                    </div>

                                    <form onSubmit={handleInvite} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Nombre Completo</label>
                                            <input
                                                required
                                                value={inviteData.name}
                                                onChange={e => setInviteData({ ...inviteData, name: e.target.value })}
                                                className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                                placeholder="Ej. Juan Pérez"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Email Corporativo</label>
                                            <input
                                                required
                                                type="email"
                                                value={inviteData.email}
                                                onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
                                                className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                                placeholder="usuario@mep-projects.com"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Rol Inicial</label>
                                                <select
                                                    value={inviteData.role}
                                                    onChange={e => setInviteData({ ...inviteData, role: e.target.value })}
                                                    className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                                >
                                                    <option value="WORKER">WORKER</option>
                                                    <option value="MANAGER">MANAGER</option>
                                                    <option value="ADMIN">ADMIN</option>
                                                    <option value="CLIENT">CLIENT</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Departamento</label>
                                                <select
                                                    value={inviteData.department}
                                                    onChange={e => setInviteData({ ...inviteData, department: e.target.value })}
                                                    className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                                >
                                                    <option value="ENGINEERING">ENGINEERING</option>
                                                    <option value="ARCHITECTURE">ARCHITECTURE</option>
                                                    <option value="ADMINISTRATION">ADMINISTRATION</option>
                                                    <option value="OTHER">OTHER</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-3 rounded-lg text-xs flex gap-2">
                                            <Shield className="w-4 h-4 flex-shrink-0" />
                                            <span>Se creará una cuenta con contraseña temporal <strong>Mep1234!</strong></span>
                                        </div>

                                        <div className="pt-4 flex space-x-3">
                                            <button type="button" onClick={() => setShowInviteModal(false)} className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium transition-colors">Cancelar</button>
                                            <button type="submit" className="flex-1 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 font-bold transition-all shadow-lg shadow-olive-600/20">Enviar Invitación</button>
                                        </div>
                                    </form>
                                </motion.div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
