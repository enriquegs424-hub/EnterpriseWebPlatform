'use client';

import { useState } from 'react';
import { Menu, X, Home, FolderOpen, CheckSquare, Clock, Calendar, FileText, Bell, Settings, Users, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileSidebarProps {
    notificationCount?: number;
}

export default function MobileSidebar({ notificationCount = 0 }: MobileSidebarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const menuItems = [
        { icon: Home, label: 'Dashboard', href: '/dashboard' },
        { icon: Calendar, label: 'Calendario', href: '/calendar' },
        { icon: MessageSquare, label: 'Chat', href: '/chat' },
        { icon: FolderOpen, label: 'Proyectos', href: '/projects' },
        { icon: CheckSquare, label: 'Tareas', href: '/tasks' },
        { icon: Clock, label: 'Horas', href: '/hours/daily' },
        { icon: FileText, label: 'Documentos', href: '/documents' },
        { icon: Users, label: 'Clientes', href: '/clients' },
        { icon: Bell, label: 'Notificaciones', href: '/notifications', badge: notificationCount },
        { icon: Settings, label: 'Configuración', href: '/settings' },
    ];

    const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

    return (
        <>
            {/* Hamburger Button */}
            <button
                onClick={() => setIsOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white rounded-xl shadow-lg border border-neutral-200 hover:bg-neutral-50 transition-colors"
                aria-label="Abrir menú"
            >
                <Menu className="w-6 h-6 text-neutral-900" />
            </button>

            {/* Mobile Drawer */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => setIsOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                        />

                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: '-100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-neutral-200 z-50 shadow-2xl"
                            role="dialog"
                            aria-modal="true"
                            aria-label="Menú de navegación"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
                                <h2 className="text-2xl font-black text-olive-600">
                                    MEP Projects
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                                    aria-label="Cerrar menú"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Navigation */}
                            <nav className="p-4 overflow-y-auto h-[calc(100%-5rem)]">
                                <ul className="space-y-1">
                                    {menuItems.map((item) => {
                                        const Icon = item.icon;
                                        const active = isActive(item.href);

                                        return (
                                            <li key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    onClick={() => setIsOpen(false)}
                                                    className={`
                                                        flex items-center justify-between px-4 py-3 rounded-xl
                                                        font-bold transition-all relative
                                                        ${active
                                                            ? 'bg-olive-600 text-white shadow-lg'
                                                            : 'text-neutral-600 hover:bg-neutral-100'
                                                        }
                                                    `}
                                                >
                                                    <div className="flex items-center space-x-3">
                                                        <Icon className="w-5 h-5" />
                                                        <span>{item.label}</span>
                                                    </div>
                                                    {item.badge && item.badge > 0 && (
                                                        <span className="px-2 py-1 text-xs font-bold bg-error-600 text-white rounded-full min-w-[20px] text-center">
                                                            {item.badge > 99 ? '99+' : item.badge}
                                                        </span>
                                                    )}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </nav>
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
