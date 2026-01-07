'use client';

import { useState } from 'react';
import { deleteTimeEntry } from '@/app/hours/actions';
import { Trash2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeleteButton({ entryId }: { entryId: string }) {
    const [isConfirming, setIsConfirming] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        const result = await deleteTimeEntry(entryId);

        if (result.error) {
            setError(result.error);
        } else {
            setIsConfirming(false);
            window.location.reload();
        }
    };

    return (
        <>
            <button
                onClick={() => setIsConfirming(true)}
                className="p-2 text-neutral-400 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all"
                title="Eliminar entrada"
            >
                <Trash2 size={16} />
            </button>

            <AnimatePresence>
                {isConfirming && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-neutral-200"
                        >
                            <div className="text-center">
                                <div className="w-12 h-12 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertTriangle className="w-6 h-6 text-error-600" />
                                </div>
                                <h3 className="text-xl font-bold text-neutral-900 mb-2">¿Eliminar registro?</h3>
                                <p className="text-neutral-600 text-sm mb-6">
                                    Esta acción no se puede deshacer. El registro de horas será eliminado permanentemente.
                                </p>

                                {error && (
                                    <div className="mb-4 p-3 bg-error-50 text-error-700 rounded-xl text-sm">
                                        {error}
                                    </div>
                                )}

                                <div className="flex space-x-3">
                                    <button
                                        onClick={() => setIsConfirming(false)}
                                        className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 font-medium transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        className="flex-1 px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 font-bold transition-all"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
