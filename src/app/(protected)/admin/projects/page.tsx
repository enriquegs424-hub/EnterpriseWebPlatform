'use client';

import { useState, useEffect } from 'react';
import { getAllProjects, createProject, updateProject, toggleProjectStatus } from '@/app/admin/actions';
import { getAllClients } from '@/app/(protected)/admin/clients/actions';
import { Briefcase, Plus, Edit2, Power, PowerOff, Calendar, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function ProjectsPage() {
    return (
        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <ProjectsContent />
        </ProtectedRoute>
    );
}

function ProjectsContent() {
    const [projects, setProjects] = useState<any[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [editingProject, setEditingProject] = useState<any>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        const [projectsData, clientsData] = await Promise.all([
            getAllProjects(),
            getAllClients()
        ]);
        setProjects(projectsData);
        setClients(clientsData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject) return;

        await createProject(editingProject);
        setEditingProject(null);
        setIsCreating(false);
        fetchData();
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProject) return;

        await updateProject(editingProject.id, editingProject);
        setEditingProject(null);
        fetchData();
    };

    const handleToggle = async (id: string) => {
        await toggleProjectStatus(id);
        fetchData();
    };

    const openCreateModal = () => {
        setEditingProject({
            code: '',
            name: '',
            year: new Date().getFullYear(),
            department: 'ENGINEERING',
            clientId: '',
            isActive: true
        });
        setIsCreating(true);
    };

    if (loading && projects.length === 0) return <div className="p-8 text-center text-neutral-500">Cargando proyectos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 border-l-4 border-olive-500 pl-4">Gestión de Proyectos</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center space-x-2 bg-olive-600 text-white px-4 py-2.5 rounded-xl hover:bg-olive-700 transition-all font-bold shadow-lg shadow-olive-600/20"
                >
                    <Plus size={20} />
                    <span>Nuevo Proyecto</span>
                </button>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-800 text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800">
                        <tr>
                            <th className="px-6 py-4 text-left font-semibold text-neutral-600 dark:text-neutral-400">Código</th>
                            <th className="px-6 py-4 text-left font-semibold text-neutral-600 dark:text-neutral-400">Nombre</th>
                            <th className="px-6 py-4 text-left font-semibold text-neutral-600 dark:text-neutral-400">Cliente</th>
                            <th className="px-6 py-4 text-left font-semibold text-neutral-600 dark:text-neutral-400">Año</th>
                            <th className="px-6 py-4 text-left font-semibold text-neutral-600 dark:text-neutral-400">Departamento</th>
                            <th className="px-6 py-4 text-left font-semibold text-neutral-600 dark:text-neutral-400">Estado</th>
                            <th className="px-6 py-4 text-right font-semibold text-neutral-600 dark:text-neutral-400">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {projects.map((project) => (
                            <motion.tr
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                key={project.id}
                                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                            >
                                <td className="px-6 py-4 font-mono text-olive-700 dark:text-olive-500 font-bold">{project.code}</td>
                                <td className="px-6 py-4 font-semibold text-neutral-900 dark:text-neutral-100">{project.name}</td>
                                <td className="px-6 py-4">
                                    {project.client ? (
                                        <div className="flex items-center text-xs text-neutral-600 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-800 px-2 py-1 rounded w-fit">
                                            <Building2 size={12} className="mr-1 text-olive-500" />
                                            {project.client.name}
                                        </div>
                                    ) : (
                                        <span className="text-xs text-neutral-400 italic">Sin cliente</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-neutral-600 dark:text-neutral-400 flex items-center">
                                    <Calendar size={14} className="mr-2 text-neutral-400" />
                                    {project.year}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-full text-xs text-neutral-600 dark:text-neutral-400 font-medium">
                                        {project.department}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <button
                                        onClick={() => handleToggle(project.id)}
                                        className={`flex items-center text-xs font-bold px-3 py-1.5 rounded-full transition-all ${project.isActive
                                            ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 hover:bg-success-100 dark:hover:bg-success-900/30'
                                            : 'bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 hover:bg-error-100 dark:hover:bg-error-900/30'
                                            }`}
                                    >
                                        {project.isActive ? <Power size={12} className="mr-1" /> : <PowerOff size={12} className="mr-1" />}
                                        {project.isActive ? 'ACTIVO' : 'INACTIVO'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => { setEditingProject({ ...project }); setIsCreating(false); }}
                                        className="p-2 text-neutral-400 hover:text-olive-600 dark:hover:text-olive-400 hover:bg-olive-50 dark:hover:bg-olive-900/20 rounded-lg transition-all"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <AnimatePresence>
                {editingProject && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-neutral-200 dark:border-neutral-800"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center">
                                    <Briefcase className="w-5 h-5 mr-3 text-olive-600 dark:text-olive-500" />
                                    {isCreating ? 'Nuevo Proyecto' : 'Editar Proyecto'}
                                </h3>
                                <button onClick={() => { setEditingProject(null); setIsCreating(false); }} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 text-2xl">&times;</button>
                            </div>

                            <form onSubmit={isCreating ? handleCreate : handleUpdate} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Código</label>
                                        <input
                                            value={editingProject.code}
                                            onChange={e => setEditingProject({ ...editingProject, code: e.target.value })}
                                            placeholder="P-25-001"
                                            className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 font-mono outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Año</label>
                                        <input
                                            type="number"
                                            value={editingProject.year}
                                            onChange={e => setEditingProject({ ...editingProject, year: e.target.value })}
                                            className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Nombre del Proyecto</label>
                                    <input
                                        value={editingProject.name}
                                        onChange={e => setEditingProject({ ...editingProject, name: e.target.value })}
                                        placeholder="Instalaciones MEP Edificio Corporativo"
                                        className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Cliente</label>
                                    <select
                                        value={editingProject.clientId || ''}
                                        onChange={e => setEditingProject({ ...editingProject, clientId: e.target.value })}
                                        className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                    >
                                        <option value="">Seleccionar cliente (Opcional)</option>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Departamento</label>
                                    <select
                                        value={editingProject.department}
                                        onChange={e => setEditingProject({ ...editingProject, department: e.target.value })}
                                        className="w-full p-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                    >
                                        <option value="ENGINEERING">ENGINEERING</option>
                                        <option value="ARCHITECTURE">ARCHITECTURE</option>
                                        <option value="ADMINISTRATION">ADMINISTRATION</option>
                                        <option value="OTHER">OTHER</option>
                                    </select>
                                </div>

                                {!isCreating && (
                                    <div className="flex items-center space-x-3 pt-2">
                                        <input
                                            type="checkbox"
                                            checked={editingProject.isActive}
                                            onChange={e => setEditingProject({ ...editingProject, isActive: e.target.checked })}
                                            className="w-4 h-4 text-olive-600 rounded border-neutral-300 focus:ring-olive-500"
                                        />
                                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Proyecto Activo</label>
                                    </div>
                                )}

                                <div className="pt-6 flex space-x-3">
                                    <button type="button" onClick={() => { setEditingProject(null); setIsCreating(false); }} className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 font-medium transition-colors">Cancelar</button>
                                    <button type="submit" className="flex-1 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 font-bold transition-all shadow-lg shadow-olive-600/20">
                                        {isCreating ? 'Crear Proyecto' : 'Guardar Cambios'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
