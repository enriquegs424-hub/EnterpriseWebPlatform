'use client';

import { Bell, Search, X } from 'lucide-react';
import UserMenu from './UserMenu';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead, getUnreadCount } from '@/app/(protected)/notifications/actions';
import Link from 'next/link';

export default function Header() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const router = useRouter();

    useEffect(() => {
        loadNotifications();
        // Actualizar cada 30 segundos
        const interval = setInterval(loadNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadNotifications = async () => {
        const [notifs, count] = await Promise.all([
            getMyNotifications(),
            getUnreadCount()
        ]);
        setNotifications(notifs);
        setUnreadCount(count);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.isRead) {
            await markNotificationAsRead(notification.id);
            loadNotifications();
        }
        if (notification.link) {
            router.push(notification.link);
        }
        setShowNotifications(false);
    };

    const handleMarkAllAsRead = async () => {
        await markAllNotificationsAsRead();
        loadNotifications();
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'TASK_ASSIGNED': return '📋';
            case 'TASK_COMPLETED': return '✅';
            case 'TASK_COMMENT': return '💬';
            case 'TASK_DUE_SOON': return '⏰';
            case 'HOURS_APPROVED': return '👍';
            case 'PROJECT_ASSIGNED': return '🎯';
            default: return '🔔';
        }
    };

    return (
        <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 sticky top-0 z-20 shadow-sm">
            <div className="flex-1 max-w-md">
                <form onSubmit={handleSearch} className="relative group">
                    <Search className="w-5 h-5 text-neutral-400 group-focus-within:text-olive-600 absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none transition-colors" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Buscar proyectos, usuarios, clientes..."
                        className="w-full pl-10 pr-10 py-2.5 border border-neutral-200 rounded-full text-sm focus:outline-none focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 bg-neutral-50 hover:bg-white transition-all placeholder:text-neutral-400"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full p-1 transition-all"
                            title="Limpiar búsqueda"
                        >
                            <X size={16} />
                        </button>
                    )}
                </form>
            </div>

            <div className="flex items-center space-x-4 ml-6">
                {/* Notifications */}
                <div className="relative">
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="relative p-2 text-neutral-600 hover:bg-neutral-100 rounded-full transition-all"
                        title="Notificaciones"
                    >
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-error-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                        )}
                    </button>

                    <AnimatePresence>
                        {showNotifications && (
                            <>
                                <div
                                    className="fixed inset-0 z-30"
                                    onClick={() => setShowNotifications(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-neutral-200 z-40 max-h-[600px] overflow-hidden flex flex-col"
                                >
                                    <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
                                        <h3 className="font-bold text-neutral-900">Notificaciones</h3>
                                        {unreadCount > 0 && (
                                            <button
                                                onClick={handleMarkAllAsRead}
                                                className="text-xs text-olive-600 hover:text-olive-700 font-bold"
                                            >
                                                Marcar todas como leídas
                                            </button>
                                        )}
                                    </div>

                                    <div className="overflow-y-auto flex-1">
                                        {notifications.length === 0 ? (
                                            <div className="p-12 text-center">
                                                <Bell size={48} className="mx-auto text-neutral-200 mb-3" />
                                                <p className="text-neutral-400 font-medium">Sin notificaciones</p>
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <button
                                                    key={notif.id}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`w-full p-4 text-left hover:bg-neutral-50 transition-all border-b border-neutral-100 ${!notif.isRead ? 'bg-olive-50/30' : ''
                                                        }`}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <span className="text-2xl">{getNotificationIcon(notif.type)}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-sm font-bold ${!notif.isRead ? 'text-neutral-900' : 'text-neutral-600'}`}>
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                                                                {notif.message}
                                                            </p>
                                                            <p className="text-xs text-neutral-400 mt-1">
                                                                {new Date(notif.createdAt).toLocaleString('es-ES', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                        {!notif.isRead && (
                                                            <div className="w-2 h-2 bg-olive-600 rounded-full flex-shrink-0 mt-1"></div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>

                                    {notifications.length > 0 && (
                                        <Link
                                            href="/notifications"
                                            className="p-3 text-center text-sm font-bold text-olive-600 hover:bg-olive-50 border-t border-neutral-100 transition-all"
                                            onClick={() => setShowNotifications(false)}
                                        >
                                            Ver todas las notificaciones
                                        </Link>
                                    )}
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <UserMenu />
            </div>
        </header>
    );
}
