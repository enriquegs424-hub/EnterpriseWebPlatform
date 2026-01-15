'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, CheckSquare, Folder, Users, Building2, X, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFocusTrap } from '@/hooks/useAccessibility';

interface SearchResult {
    id: string;
    type: 'task' | 'project' | 'document' | 'client' | 'user';
    title: string;
    subtitle?: string;
    url: string;
}

interface GlobalSearchProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    // Focus trap for accessibility
    const modalRef = useFocusTrap(isOpen);

    // Reset state when closed
    useEffect(() => {
        if (!isOpen) {
            setQuery('');
            setResults([]);
            setSelectedIndex(0);
        }
    }, [isOpen]);

    // Handle navigation with arrow keys
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter' && results[selectedIndex]) {
                e.preventDefault();
                handleSelectResult(results[selectedIndex]);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex, onClose]);

    // Search function
    const performSearch = useCallback(async (searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([]);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();
            setResults(data.results || []);
            setSelectedIndex(0);
        } catch (error) {
            console.error('Search error:', error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            performSearch(query);
        }, 150);

        return () => clearTimeout(timer);
    }, [query, performSearch]);

    const handleSelectResult = (result: SearchResult) => {
        router.push(result.url);
        onClose();
        setQuery('');
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'task': return <CheckSquare size={20} className="text-olive-600" />;
            case 'project': return <Folder size={20} className="text-info-600" />;
            case 'document': return <FileText size={20} className="text-error-600" />;
            case 'client': return <Building2 size={20} className="text-purple-600" />;
            case 'user': return <Users size={20} className="text-orange-600" />;
            default: return <Search size={20} />;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'task': return 'Tarea';
            case 'project': return 'Proyecto';
            case 'document': return 'Documento';
            case 'client': return 'Cliente';
            case 'user': return 'Usuario';
            default: return type;
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-20"
                    onClick={onClose}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="search-title"
                >
                    <motion.div
                        ref={modalRef}
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.98, opacity: 0, y: -10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.98, opacity: 0, y: -10 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-neutral-200 dark:border-neutral-800"
                    >
                        {/* Search Input */}
                        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-400" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Buscar tareas, proyectos, documentos..."
                                    className="w-full pl-14 pr-12 py-4 text-lg bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 transition-all"
                                    autoFocus
                                />
                                <button
                                    onClick={onClose}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all"
                                >
                                    <X size={20} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300" />
                                </button>
                            </div>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="p-12 text-center">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-olive-600 border-t-transparent"></div>
                                    <p className="mt-4 text-neutral-500 dark:text-neutral-400">Buscando...</p>
                                </div>
                            ) : results.length > 0 ? (
                                <div className="p-2">
                                    {results.map((result, index) => (
                                        <button
                                            key={result.id}
                                            onClick={() => handleSelectResult(result)}
                                            className={`w-full p-4 rounded-xl transition-all flex items-center space-x-4 ${index === selectedIndex
                                                ? 'bg-olive-50 dark:bg-olive-900/20 border-2 border-olive-600 dark:border-olive-500'
                                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 border-2 border-transparent'
                                                }`}
                                        >
                                            <div className="flex-shrink-0">
                                                {getIcon(result.type)}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="flex items-center space-x-2">
                                                    <h4 className="font-bold text-neutral-900 dark:text-neutral-100">{result.title}</h4>
                                                    <span className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 rounded text-xs font-medium">
                                                        {getTypeLabel(result.type)}
                                                    </span>
                                                </div>
                                                {result.subtitle && (
                                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{result.subtitle}</p>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : query.trim() ? (
                                <div className="p-12 text-center">
                                    <Search size={48} className="mx-auto text-neutral-200 dark:text-neutral-700 mb-4" />
                                    <h3 className="text-lg font-bold text-neutral-400 dark:text-neutral-500 mb-2">Sin resultados</h3>
                                    <p className="text-neutral-400 dark:text-neutral-500">No se encontraron resultados para "{query}"</p>
                                </div>
                            ) : (
                                <div className="p-12 text-center">
                                    <Search size={48} className="mx-auto text-neutral-200 dark:text-neutral-700 mb-4" />
                                    <h3 className="text-lg font-bold text-neutral-400 dark:text-neutral-500 mb-2">Búsqueda Global</h3>
                                    <p className="text-neutral-400 dark:text-neutral-500">Busca tareas, proyectos, documentos y más...</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
