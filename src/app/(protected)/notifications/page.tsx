'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, Trash2, Clock, CheckCircle, AlertCircle, Info, Calendar, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from './actions';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const router = useRouter();

    const fetchNotifications = useCallback(async () => {
        try {
            const data = await getMyNotifications();
            setNotifications(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        await markNotificationAsRead(id);
        router.refresh(); // Refresh server components layout for badges
    };

    const handleMarkAllAsRead = async () => {
        // Optimistic update
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        await markAllNotificationsAsRead();
        router.refresh();
    };

    const handleDelete = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.filter(n => n.id !== id));
        await deleteNotification(id);
        router.refresh();
    };

    const handleNotificationClick = async (notification: any) => {
        if (!notification.isRead) {
            await handleMarkAsRead(notification.id);
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.isRead;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getIcon = (type: string) => {
        switch (type) {
            case 'TASK_ASSIGNED': return <CheckCircle className="text-blue-500" size={20} />;
            case 'TASK_COMPLETED': return <CheckCircle className="text-green-500" size={20} />;
            case 'TASK_DUE_SOON': return <AlertCircle className="text-amber-500" size={20} />;
            case 'PROJECT_ASSIGNED': return <FileText className="text-purple-500" size={20} />;
            case 'HOURS_APPROVED': return <Clock className="text-green-500" size={20} />;
            default: return <Info className="text-neutral-500" size={20} />;
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-50 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 tracking-tight">Notificaciones</h1>
                    <p className="text-neutral-600 font-medium">Mantente al día con tu actividad</p>
                </div>

                <div className="flex items-center space-x-3">
                    <div className="bg-white p-1 rounded-xl shadow-sm border border-neutral-200 flex">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-olive-100 text-olive-700' : 'text-neutral-600 hover:bg-neutral-50'}`}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center space-x-2 ${filter === 'unread' ? 'bg-olive-100 text-olive-700' : 'text-neutral-600 hover:bg-neutral-50'}`}
                        >
                            <span>No leídas</span>
                            {unreadCount > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center space-x-2 bg-white text-neutral-600 px-4 py-2.5 rounded-xl hover:bg-neutral-100 transition-all border border-neutral-200 font-bold text-sm shadow-sm"
                        >
                            <Check size={16} />
                            <span>Marcar todo leído</span>
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="w-8 h-8 border-4 border-olive-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-neutral-400">
                        <Bell size={48} className="mb-4 opacity-20" />
                        <p className="font-medium">No tienes notificaciones {filter === 'unread' ? 'sin leer' : ''}</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-w-4xl mx-auto">
                        <AnimatePresence>
                            {filteredNotifications.map((notification) => (
                                <motion.div
                                    key={notification.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className={`
                                        group relative p-4 rounded-2xl border transition-all hover:shadow-md cursor-pointer
                                        ${notification.isRead ? 'bg-white border-neutral-200' : 'bg-blue-50/50 border-blue-100 shadow-sm'}
                                    `}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className={`
                                            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                                            ${notification.isRead ? 'bg-neutral-100' : 'bg-white shadow-sm'}
                                        `}>
                                            {getIcon(notification.type)}
                                        </div>

                                        <div className="flex-1 pt-1">
                                            <div className="flex justify-between items-start">
                                                <h3 className={`text-sm font-bold ${notification.isRead ? 'text-neutral-700' : 'text-neutral-900'}`}>
                                                    {notification.title}
                                                </h3>
                                                <span className="text-xs text-neutral-400 whitespace-nowrap ml-2">
                                                    {format(new Date(notification.createdAt), "d MMM, HH:mm", { locale: es })}
                                                </span>
                                            </div>
                                            <p className={`text-sm mt-1 ${notification.isRead ? 'text-neutral-500' : 'text-neutral-700'}`}>
                                                {notification.message}
                                            </p>
                                        </div>

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col space-y-2 pt-1">
                                            {!notification.isRead && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkAsRead(notification.id);
                                                    }}
                                                    className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-blue-600 transition-colors"
                                                    title="Marcar como leída"
                                                >
                                                    <Check size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(notification.id);
                                                }}
                                                className="p-1.5 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-red-600 transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    {!notification.isRead && (
                                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-blue-500 rounded-r-lg"></div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
