'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, User, ChevronDown, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UserMenu() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!session?.user) return null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-3 p-1 rounded-full hover:bg-neutral-100 transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-olive-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-olive-100">
                    {session.user.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-neutral-900 leading-tight">
                        {session.user.name}
                    </p>
                    <p className="text-xs text-olive-600 font-medium">
                        {/* @ts-ignore */}
                        {session.user.role || 'Usuario'}
                    </p>
                </div>
                <ChevronDown size={16} className={`text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-200 py-2 z-50 overflow-hidden"
                    >
                        <div className="px-4 py-3 border-b border-neutral-100">
                            <p className="text-sm font-semibold text-neutral-900">{session.user.name}</p>
                            <p className="text-xs text-neutral-500 truncate">{session.user.email}</p>
                        </div>

                        <div className="py-1">
                            <button className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                                <User size={16} className="mr-3 text-neutral-400" />
                                Mi Perfil
                            </button>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">
                                <UserCheck size={16} className="mr-3 text-neutral-400" />
                                Configuración
                            </button>
                        </div>

                        <div className="pt-1 border-t border-neutral-100">
                            <button
                                onClick={() => signOut()}
                                className="flex items-center w-full px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors"
                            >
                                <LogOut size={16} className="mr-3" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
