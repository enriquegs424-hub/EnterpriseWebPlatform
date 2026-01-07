'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { globalSearch } from './actions';
import { Search, Briefcase, User, Building2, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export default function SearchPage() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [results, setResults] = useState<any[]>([]);
    const [isPending, startTransition] = useTransition();
    const [activeFilter, setActiveFilter] = useState('TODO');

    useEffect(() => {
        if (query) {
            startTransition(async () => {
                const data = await globalSearch(query);
                if (data.results) {
                    setResults(data.results);
                }
            });
        }
    }, [query]);

    const filteredResults = activeFilter === 'TODO'
        ? results
        : results.filter(r => r.type === activeFilter);

    const icons: Record<string, any> = {
        PROYECTO: Briefcase,
        USUARIO: User,
        CLIENTE: Building2
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex flex-col space-y-4">
                <h1 className="text-3xl font-black text-neutral-900">Resultados para "{query}"</h1>
                <p className="text-neutral-500 font-medium">{results.length} coincidencias encontradas</p>

                <div className="flex space-x-2 overflow-x-auto pb-2">
                    {['TODO', 'PROYECTO', 'USUARIO', 'CLIENTE'].map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap ${activeFilter === f
                                    ? 'bg-olive-600 text-white border-olive-600 shadow-lg shadow-olive-600/20'
                                    : 'bg-white text-neutral-500 border-neutral-200 hover:border-olive-300'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {isPending ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-12 h-12 text-olive-600 animate-spin" />
                    <p className="font-bold text-neutral-400">Buscando en la base de datos...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode="popLayout">
                        {filteredResults.length > 0 ? (
                            filteredResults.map((result, idx) => {
                                const Icon = icons[result.type] || Search;
                                return (
                                    <motion.div
                                        key={result.id + result.type}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Link
                                            href={result.link}
                                            className="group flex items-center p-5 bg-white rounded-2xl border border-neutral-200 hover:border-olive-500 hover:shadow-xl hover:shadow-olive-600/5 transition-all"
                                        >
                                            <div className={`p-4 rounded-xl mr-4 transition-colors ${result.type === 'PROYECTO' ? 'bg-info-50 text-info-600 group-hover:bg-info-600 group-hover:text-white' :
                                                    result.type === 'USUARIO' ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white' :
                                                        'bg-olive-50 text-olive-600 group-hover:bg-olive-600 group-hover:text-white'
                                                }`}>
                                                <Icon size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${result.type === 'PROYECTO' ? 'bg-info-50 text-info-700' :
                                                            result.type === 'USUARIO' ? 'bg-purple-50 text-purple-700' :
                                                                'bg-olive-50 text-olive-700'
                                                        }`}>
                                                        {result.type}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-neutral-900 text-lg">{result.title}</h3>
                                                <p className="text-neutral-500 text-sm font-medium">{result.subtitle}</p>
                                            </div>
                                            <ArrowRight className="text-neutral-300 group-hover:text-olive-600 group-hover:translate-x-1 transition-all" />
                                        </Link>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="text-center py-20 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200">
                                <Search size={48} className="mx-auto text-neutral-200 mb-4" />
                                <h3 className="text-xl font-bold text-neutral-400">Sin resultados hallados</h3>
                                <p className="text-neutral-400">Intenta con otros términos de búsqueda</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
