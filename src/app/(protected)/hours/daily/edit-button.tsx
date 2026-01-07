'use client';

import { useState } from 'react';
import { updateTimeEntry } from '@/app/hours/actions';
import { Edit, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EditButton({ entry, projects }: { entry: any; projects: any[] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        projectId: entry.projectId,
        date: new Date(entry.date).toISOString().split('T')[0],
        hours: entry.hours,
        notes: entry.notes || '',
    });
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await updateTimeEntry(entry.id, formData);

        if (result.error) {
            setError(result.error);
        } else {
            setIsEditing(false);
            window.location.reload();
        }
    };

    return (
        <>
            <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-neutral-400 hover:text-olive-600 hover:bg-olive-50 rounded-lg transition-all"
                title="Editar entrada"
            >
                <Edit size={16} />
            </button>

            <AnimatePresence>
                {isEditing && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-neutral-200"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-neutral-900 flex items-center">
                                    <Edit className="w-5 h-5 mr-3 text-olive-600" />
                                    Editar Registro
                                </h3>
                                <button onClick={() => setIsEditing(false)} className="text-neutral-400 hover:text-neutral-600 text-2xl">&times;</button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-error-50 text-error-700 rounded-xl text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-700 mb-1">Fecha</label>
                                        <input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            className="w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-neutral-700 mb-1">Horas</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0.5"
                                            max="24"
                                            value={formData.hours}
                                            onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
                                            className="w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Proyecto</label>
                                    <select
                                        value={formData.projectId}
                                        onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                                        className="w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                                        required
                                    >
                                        {projects.map((p) => (
                                            <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Notas</label>
                                    <textarea
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        rows={2}
                                        className="w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none resize-none"
                                        placeholder="Descripción del trabajo realizado..."
                                    />
                                </div>

                                <div className="pt-4 flex space-x-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 font-medium transition-colors"
                                    >
                                        <X size={16} />
                                        <span>Cancelar</span>
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 font-bold transition-all shadow-lg shadow-olive-600/20"
                                    >
                                        <Save size={16} />
                                        <span>Guardar</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
