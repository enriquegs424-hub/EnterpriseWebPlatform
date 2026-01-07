'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Briefcase, FileText, CheckSquare, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { globalSearch } from '@/app/(protected)/search/actions';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (!isOpen) onClose();
            }
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true);
                const data = await globalSearch(query);
                if (data.results) setResults(data.results);
                setLoading(false);
            } else {
                setResults([]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (link: string) => {
        router.push(link);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity"
                />

                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="mx-auto max-w-2xl transform divide-y divide-gray-100 overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/5 transition-all"
                >
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm outline-none"
                            placeholder="Buscar proyectos, tareas, documentos..."
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button onClick={onClose} className="absolute right-3 top-3 p-1 hover:bg-gray-100 rounded-md">
                            <span className="sr-only">Cerrar</span>
                            <kbd className="inline-flex items-center rounded border border-gray-200 px-1 font-sans text-xs text-gray-400">Esc</kbd>
                        </button>
                    </div>

                    {(query === '' && results.length === 0) && (
                        <div className="py-14 text-center text-sm sm:px-14">
                            <Briefcase className="mx-auto h-6 w-6 text-gray-400" />
                            <p className="mt-4 font-semibold text-gray-900">Busca en todo MEPProjects</p>
                            <p className="mt-2 text-gray-500">Busca proyectos por nombre o código, tareas pendientes y documentos importantes.</p>
                        </div>
                    )}

                    {results.length > 0 && (
                        <ul className="max-h-96 scroll-py-3 overflow-y-auto p-3">
                            {results.map((item) => {
                                const Icon = item.type === 'PROYECTO' ? Briefcase : item.type === 'TAREA' ? CheckSquare : FileText;
                                return (
                                    <li key={item.id + item.type}>
                                        <button
                                            onClick={() => handleSelect(item.link)}
                                            className="group flex cursor-default select-none items-center rounded-xl p-3 hover:bg-olive-50 w-full text-left transition-colors"
                                        >
                                            <div className={`flex h-10 w-10 flex-none items-center justify-center rounded-lg ${item.type === 'PROYECTO' ? 'bg-info-50 text-info-600' :
                                                    item.type === 'TAREA' ? 'bg-orange-50 text-orange-600' :
                                                        'bg-purple-50 text-purple-600'
                                                }`}>
                                                <Icon className="h-6 w-6" aria-hidden="true" />
                                            </div>
                                            <div className="ml-4 flex-auto">
                                                <p className="text-sm font-medium text-gray-900 group-hover:text-olive-900">
                                                    {item.title}
                                                </p>
                                                <p className="text-xs text-gray-500 group-hover:text-olive-700">
                                                    {item.subtitle}
                                                </p>
                                            </div>
                                            <ArrowRight className="hidden h-5 w-5 flex-none text-olive-400 group-hover:block" />
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}

                    {query !== '' && results.length === 0 && !loading && (
                        <div className="py-14 text-center text-sm sm:px-14">
                            <p className="mt-4 font-semibold text-gray-900">No se encontraron resultados</p>
                            <p className="mt-2 text-gray-500">No encontramos nada para "{query}". Intenta con otros términos.</p>
                        </div>
                    )}

                    {loading && (
                        <div className="py-14 text-center text-sm sm:px-14 flex justify-center">
                            <Loader2 className="animate-spin h-6 w-6 text-olive-600" />
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
