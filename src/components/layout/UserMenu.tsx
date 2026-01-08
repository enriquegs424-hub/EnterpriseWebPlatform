'use client';

import { useState, useRef, useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { LogOut, User, ChevronDown, UserCheck, Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/providers/ThemeProvider';

export default function UserMenu() {
    const { data: session } = useSession();
    const { setTheme, theme } = useTheme();
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
                className="flex items-center space-x-3 p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
                {session.user.image ? (
                    <img src={session.user.image} alt="Avatar" className="w-8 h-8 rounded-full object-cover ring-2 ring-olive-100 dark:ring-olive-900" />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-olive-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-olive-100 dark:ring-olive-900">
                        {session.user.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                )}
                <div className="hidden md:block text-left">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
                        {session.user.name}
                    </p>
                    <p className="text-xs text-olive-600 dark:text-olive-400 font-medium">
                        {/* @ts-ignore */}
                        {session.user.role || 'Usuario'}
                    </p>
                </div>
                <ChevronDown size={16} className={`text-neutral-400 dark:text-neutral-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-56 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-2 z-50 overflow-hidden"
                    >
                        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-700">
                            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{session.user.name}</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{session.user.email}</p>
                        </div>

                        <div className="py-1">
                            <button className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                                <User size={16} className="mr-3 text-neutral-400 dark:text-neutral-500" />
                                Mi Perfil
                            </button>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors">
                                <UserCheck size={16} className="mr-3 text-neutral-400 dark:text-neutral-500" />
                                Configuración
                            </button>
                        </div>

                        <div className="py-1 border-t border-neutral-100 dark:border-neutral-700">
                            <div className="px-4 py-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase">Tema</span>
                                <div className="flex bg-neutral-100 dark:bg-neutral-700 rounded-lg p-1">
                                    <button onClick={() => setTheme('light')} className={`p-1 rounded-md ${theme === 'light' ? 'bg-white dark:bg-neutral-600 shadow-sm text-olive-600 dark:text-olive-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                        <Sun size={14} />
                                    </button>
                                    <button onClick={() => setTheme('dark')} className={`p-1 rounded-md ${theme === 'dark' ? 'bg-white dark:bg-neutral-600 shadow-sm text-olive-600 dark:text-olive-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                        <Moon size={14} />
                                    </button>
                                    <button onClick={() => setTheme('system')} className={`p-1 rounded-md ${theme === 'system' ? 'bg-white dark:bg-neutral-600 shadow-sm text-olive-600 dark:text-olive-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
                                        <Monitor size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-1 border-t border-neutral-100 dark:border-neutral-700">
                            <button
                                onClick={() => signOut()}
                                className="flex items-center w-full px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/30 transition-colors"
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
