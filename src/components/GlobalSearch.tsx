'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, FileText, CheckSquare, Folder, Users, Building2, X, Command } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface SearchResult {
    id: string;
    type: 'task' | 'project' | 'document' | 'client' | 'user';
    title: string;
    subtitle?: string;
    url: string;
}

export default function GlobalSearch() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const router = useRouter();

    // Keyboard shortcut: Ctrl+K or Cmd+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(true);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, results, selectedIndex]);

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
        }, 300);

        return () => clearTimeout(timer);
    }, [query, performSearch]);

    const handleSelectResult = (result: SearchResult) => {
        router.push(result.url);
        setIsOpen(false);
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-20">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: -20 }}
                className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-neutral-200"
            >
                {/* Search Input */}
                <div className="p-6 border-b border-neutral-200">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-neutral-400" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar tareas, proyectos, documentos..."
                            className="w-full pl-14 pr-12 py-4 text-lg bg-neutral-50 border border-neutral-200 rounded-2xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none"
                            autoFocus
                        />
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-neutral-100 rounded-lg transition-all"
                        >
                            <X size={20} className="text-neutral-400" />
                        </button>
                    </div>
                    <div className="flex items-center justify-between mt-3 text-xs text-neutral-500">
                        <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                                <kbd className="px-2 py-1 bg-neutral-100 rounded border border-neutral-200">↑↓</kbd>
                                <span>Navegar</span>
                            </span>
                            <span className="flex items-center space-x-1">
                                <kbd className="px-2 py-1 bg-neutral-100 rounded border border-neutral-200">Enter</kbd>
                                <span>Abrir</span>
                            </span>
                            <span className="flex items-center space-x-1">
                                <kbd className="px-2 py-1 bg-neutral-100 rounded border border-neutral-200">Esc</kbd>
                                <span>Cerrar</span>
                            </span>
                        </div>
                        <span className="flex items-center space-x-1">
                            <Command size={12} />
                            <span>K para abrir</span>
                        </span>
                    </div>
                </div>

                {/* Results */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-olive-600 border-t-transparent"></div>
                            <p className="mt-4 text-neutral-500">Buscando...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="p-2">
                            {results.map((result, index) => (
                                <button
                                    key={result.id}
                                    onClick={() => handleSelectResult(result)}
                                    className={`w-full p-4 rounded-xl transition-all flex items-center space-x-4 ${index === selectedIndex
                                            ? 'bg-olive-50 border-2 border-olive-600'
                                            : 'hover:bg-neutral-50 border-2 border-transparent'
                                        }`}
                                >
                                    <div className="flex-shrink-0">
                                        {getIcon(result.type)}
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center space-x-2">
                                            <h4 className="font-bold text-neutral-900">{result.title}</h4>
                                            <span className="px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded text-xs font-medium">
                                                {getTypeLabel(result.type)}
                                            </span>
                                        </div>
                                        {result.subtitle && (
                                            <p className="text-sm text-neutral-500 mt-1">{result.subtitle}</p>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : query.trim() ? (
                        <div className="p-12 text-center">
                            <Search size={48} className="mx-auto text-neutral-200 mb-4" />
                            <h3 className="text-lg font-bold text-neutral-400 mb-2">Sin resultados</h3>
                            <p className="text-neutral-400">No se encontraron resultados para "{query}"</p>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <Search size={48} className="mx-auto text-neutral-200 mb-4" />
                            <h3 className="text-lg font-bold text-neutral-400 mb-2">Búsqueda Global</h3>
                            <p className="text-neutral-400">Busca tareas, proyectos, documentos y más...</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
