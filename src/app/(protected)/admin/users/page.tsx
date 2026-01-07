'use client';

import { useState, useEffect } from 'react';
import { getAllUsers, updateUser } from '@/app/admin/actions';
import { User, Shield, Briefcase, Mail, CheckCircle, XCircle, MoreVertical, Edit2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [editingUser, setEditingUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        setLoading(true);
        const data = await getAllUsers();
        setUsers(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        await updateUser(editingUser.id, editingUser);
        setEditingUser(null);
        fetchUsers();
    };

    if (loading && users.length === 0) return <div className="p-8 text-center text-neutral-500">Cargando usuarios...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-neutral-900 border-l-4 border-olive-500 pl-4">Gestión de Usuarios</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <table className="min-w-full divide-y divide-neutral-200 text-sm">
                    <thead className="bg-neutral-50">
                        <tr>
                            <th className="px-6 py-4 text-left font-semibold text-neutral-600">Usuario</th>
                            <th className="px-6 py-4 text-left font-semibold text-neutral-600">Rol</th>
                            <th className="px-6 py-4 text-left font-semibold text-neutral-600">Departamento</th>
                            <th className="px-6 py-4 text-left font-semibold text-neutral-600">Horas/Día</th>
                            <th className="px-6 py-4 text-left font-semibold text-neutral-600">Estado</th>
                            <th className="px-6 py-4 text-right font-semibold text-neutral-600">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {users.map((user) => (
                            <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                key={user.id}
                                className="hover:bg-neutral-50 transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-olive-100 flex items-center justify-center text-olive-700 font-bold mr-3">
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-neutral-900">{user.name}</p>
                                            <p className="text-xs text-neutral-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-neutral-600">
                                    {user.department}
                                </td>
                                <td className="px-6 py-4 text-neutral-600 font-mono">
                                    {user.dailyWorkHours || 8}h
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`flex items-center text-xs font-bold ${user.isActive ? 'text-success-600' : 'text-error-600'
                                        }`}>
                                        {user.isActive ? <CheckCircle size={14} className="mr-1" /> : <XCircle size={14} className="mr-1" />}
                                        {user.isActive ? 'ACTIVO' : 'INACTIVO'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => setEditingUser({ ...user })}
                                        className="p-2 text-neutral-400 hover:text-olive-600 hover:bg-olive-50 rounded-lg transition-all"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editingUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-neutral-200"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-neutral-900">Editar Usuario</h3>
                            <button onClick={() => setEditingUser(null)} className="text-neutral-400 hover:text-neutral-600">&times;</button>
                        </div>

                        <form onSubmit={handleUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Nombre</label>
                                <input disabled value={editingUser.name} className="w-full p-2 border border-neutral-200 rounded-lg bg-neutral-50 text-neutral-500" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Rol</label>
                                    <select
                                        value={editingUser.role}
                                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                        className="w-full p-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-olive-500/20"
                                    >
                                        <option value="ADMIN">ADMIN</option>
                                        <option value="WORKER">WORKER</option>
                                        <option value="CLIENT">CLIENT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Dpto.</label>
                                    <select
                                        value={editingUser.department}
                                        onChange={e => setEditingUser({ ...editingUser, department: e.target.value })}
                                        className="w-full p-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-olive-500/20"
                                    >
                                        <option value="ADMINISTRATION">ADMINISTRATION</option>
                                        <option value="ENGINEERING">ENGINEERING</option>
                                        <option value="ARCHITECTURE">ARCHITECTURE</option>
                                        <option value="OTHER">OTHER</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-neutral-700 mb-1">Carga Diaria (Horas)</label>
                                <input
                                    type="number" step="0.5"
                                    value={editingUser.dailyWorkHours || 8}
                                    onChange={e => setEditingUser({ ...editingUser, dailyWorkHours: e.target.value })}
                                    className="w-full p-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-olive-500/20"
                                />
                            </div>

                            <div className="flex items-center space-x-3 pt-2">
                                <input
                                    type="checkbox"
                                    checked={editingUser.isActive}
                                    onChange={e => setEditingUser({ ...editingUser, isActive: e.target.checked })}
                                    className="w-4 h-4 text-olive-600 rounded border-neutral-300 focus:ring-olive-500"
                                />
                                <label className="text-sm font-medium text-neutral-700">Usuario Activo</label>
                            </div>

                            <div className="pt-6 flex space-x-3">
                                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 font-bold transition-all shadow-lg shadow-olive-600/20">Guardar Cambios</button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
