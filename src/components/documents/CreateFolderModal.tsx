'use client';

import { useState } from 'react';
import { X, Folder, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { createFolder } from '@/app/(protected)/documents/actions';

interface CreateFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    projectId?: string;
    parentId?: string;
}

export default function CreateFolderModal({ isOpen, onClose, onSuccess, projectId, parentId }: CreateFolderModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await createFolder({
                name,
                description: description || undefined,
                projectId,
                parentId,
            });

            setName('');
            setDescription('');
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating folder:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-neutral-900">Nueva Carpeta</h3>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-neutral-400 hover:text-neutral-600 p-2 hover:bg-neutral-100 rounded-lg transition-all"
                    >
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">
                            Nombre de la Carpeta *
                        </label>
                        <div className="relative">
                            <Folder className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Planos Arquitectónicos"
                                className="w-full pl-12 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-2">
                            Descripción (opcional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Describe el contenido de esta carpeta..."
                            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none resize-none"
                        />
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1 px-6 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 font-bold transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name}
                            className="flex-1 px-6 py-3 bg-olive-600 text-white rounded-xl hover:bg-olive-700 font-bold transition-all shadow-lg shadow-olive-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                        >
                            <Plus size={20} />
                            <span>{loading ? 'Creando...' : 'Crear Carpeta'}</span>
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
