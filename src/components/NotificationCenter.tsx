'use client';

import { useState, useEffect } from 'react';
import { Bell, X, Check, Clock, AlertCircle, CheckCircle, MessageSquare, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

import { useToast } from '@/components/ui/Toast';

export default function NotificationCenter() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const { info, success, warning, error: errorToast } = useToast();

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => fetchNotifications(true), 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async (isPolling = false) => {
        try {
            const response = await fetch('/api/notifications');
            const data = await response.json();

            // Check for new notifications to show toast
            if (isPolling && data.notifications?.length > notifications.length) {
                const newNotification = data.notifications[0]; // Assuming sorted by date desc
                if (!newNotification.isRead) {
                    info(newNotification.title, newNotification.message);
                }
            }

            setNotifications(data.notifications || []);
            setUnreadCount(data.notifications?.filter((n: Notification) => !n.isRead).length || 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, isRead: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/read-all', { method: 'POST' });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'TASK_ASSIGNED':
            case 'TASK_COMPLETED':
                return <CheckCircle size={20} className="text-olive-600" />;
            case 'TASK_COMMENT':
                return <MessageSquare size={20} className="text-info-600" />;
            case 'TASK_DUE_SOON':
                return <AlertCircle size={20} className="text-warning-600" />;
            case 'HOURS_APPROVED':
                return <Clock size={20} className="text-success-600" />;
            case 'PROJECT_ASSIGNED':
                return <FileText size={20} className="text-purple-600" />;
            default:
                return <Bell size={20} className="text-neutral-600" />;
        }
    };

    const getTimeAgo = (date: string) => {
        const now = new Date();
        const then = new Date(date);
        const diff = now.getTime() - then.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `Hace ${days} día${days > 1 ? 's' : ''}`;
        if (hours > 0) return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
        return 'Ahora mismo';
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 hover:bg-neutral-100 rounded-lg transition-all"
            >
                <Bell size={20} className="text-neutral-600" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-error-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-neutral-200 z-50 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-neutral-200 bg-neutral-50">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-neutral-900">Notificaciones</h3>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-olive-600 hover:text-olive-700 font-bold"
                                        >
                                            Marcar todas como leídas
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Notifications List */}
                            <div className="max-h-96 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <Bell size={48} className="mx-auto text-neutral-200 mb-4" />
                                        <p className="text-neutral-400 font-medium">Sin notificaciones</p>
                                        <p className="text-sm text-neutral-300 mt-1">Te avisaremos cuando haya novedades</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-neutral-100">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                className={`p-4 hover:bg-neutral-50 transition-all cursor-pointer ${!notification.isRead ? 'bg-olive-50/30' : ''
                                                    }`}
                                                onClick={() => {
                                                    if (!notification.isRead) {
                                                        markAsRead(notification.id);
                                                    }
                                                    if (notification.link) {
                                                        window.location.href = notification.link;
                                                    }
                                                }}
                                            >
                                                <div className="flex items-start space-x-3">
                                                    <div className="flex-shrink-0 mt-1">
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between">
                                                            <p className="font-bold text-sm text-neutral-900">
                                                                {notification.title}
                                                            </p>
                                                            {!notification.isRead && (
                                                                <div className="w-2 h-2 bg-olive-600 rounded-full ml-2 flex-shrink-0 mt-1.5" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-neutral-600 mt-1">
                                                            {notification.message}
                                                        </p>
                                                        <p className="text-xs text-neutral-400 mt-2">
                                                            {getTimeAgo(notification.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="p-3 border-t border-neutral-200 bg-neutral-50">
                                    <Link
                                        href="/notifications"
                                        className="block text-center text-sm text-olive-600 hover:text-olive-700 font-bold"
                                        onClick={() => setIsOpen(false)}
                                    >
                                        Ver todas las notificaciones
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
