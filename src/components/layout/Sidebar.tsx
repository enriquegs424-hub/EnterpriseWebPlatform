'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Briefcase, Users, Settings,
    Clock, FileText, FileCheck, BarChart, CheckSquare, FolderOpen, Calendar, Bell, MessageSquare, Activity, TrendingUp, Shield, Building2, UserCog
} from 'lucide-react';
import Image from 'next/image';

const navItems = [
    {
        section: 'SuperAdmin', items: [
            { label: 'Panel Global', href: '/superadmin', icon: Shield, desc: 'Panel de control global' },
            { label: 'Empresas', href: '/superadmin/companies', icon: Building2, desc: 'Gestión de empresas' },
            { label: 'Festivos', href: '/superadmin/holidays', icon: Calendar, desc: 'Calendario festivo' },
            { label: 'Logs Globales', href: '/superadmin/logs', icon: Activity, desc: 'Auditoría de toda la plataforma' },
        ], roles: ['SUPERADMIN']
    },
    {
        section: 'Principal', items: [
            { label: 'Inicio', href: '/dashboard', icon: LayoutDashboard, desc: 'Panel de control personal' },
            { label: 'Calendario', href: '/calendar', icon: Calendar, desc: 'Eventos y reuniones' },
            { label: 'Chat', href: '/chat', icon: MessageSquare, desc: 'Mensajes y comunicación' },
            { label: 'Mis Tareas', href: '/tasks', icon: CheckSquare, desc: 'Gestionar tareas asignadas' },
            { label: 'Documentos', href: '/documents', icon: FolderOpen, desc: 'Gestión de archivos' },
            { label: 'Registro Diario', href: '/hours', icon: Clock, desc: 'Registrar y ver mis horas' },
            { label: 'Notificaciones', href: '/notifications', icon: Bell, desc: 'Centro de avisos' },
        ], roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'WORKER']
    },
    {
        section: 'Control Horas', items: [
            { label: 'Mi Hoja', href: '/control-horas/mi-hoja', icon: Calendar, desc: 'Mi hoja mensual de horas' },
            { label: 'Equipo', href: '/control-horas/equipo', icon: Users, desc: 'Vista global del equipo', managerOnly: true },
            { label: 'Por Proyecto', href: '/control-horas/proyectos', icon: Briefcase, desc: 'Horas por proyecto', managerOnly: true },
            { label: 'Anual', href: '/control-horas/anual', icon: BarChart, desc: 'Resumen anual', managerOnly: true },
        ], roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'WORKER']
    },
    {
        section: 'Gestión', items: [
            { label: 'CRM', href: '/crm', icon: TrendingUp, desc: 'Gestión de leads y clientes' },
            { label: 'Presupuestos', href: '/quotes', icon: FileCheck, desc: 'Gestión de presupuestos' },
            { label: 'Facturas', href: '/invoices', icon: FileText, desc: 'Facturación y cobros' },
            { label: 'Proyectos', href: '/admin/projects', icon: Briefcase, desc: 'Códigos y clientes' },
            { label: 'Clientes', href: '/admin/clients', icon: Users, desc: 'Cartera de clientes' },
        ], roles: ['SUPERADMIN', 'ADMIN', 'MANAGER']
    },
    {
        section: 'Administración', items: [
            { label: 'Analytics', href: '/analytics', icon: BarChart, desc: 'Métricas y reportes' },
            { label: 'Horas Global', href: '/admin/hours', icon: Clock, desc: 'Control horario de usuarios' },
            { label: 'Usuarios', href: '/admin/users', icon: Users, desc: 'Gestión de equipo' },
            { label: 'Departamentos', href: '/admin/departments', icon: Building2, desc: 'Configuración por áreas' },
            { label: 'Equipos', href: '/admin/teams', icon: UserCog, desc: 'Organización de equipos' },
            { label: 'Auditoría', href: '/admin/logs', icon: Activity, desc: 'Logs del sistema' },
            { label: 'Configuración', href: '/settings', icon: Settings, desc: 'Preferencias personales' },
        ], roles: ['SUPERADMIN', 'ADMIN']
    }
];

import { useSession } from 'next-auth/react';

import { getUnreadCount } from '@/app/(protected)/notifications/actions';
import { getUnreadCount as getChatUnreadCount } from '@/app/(protected)/chat/actions';
import { getCurrentUser } from '@/app/(protected)/settings/actions';
import { useState, useEffect } from 'react';

// ... (imports)

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const [unreadCount, setUnreadCount] = useState(0);
    const [chatUnreadCount, setChatUnreadCount] = useState(0);
    const [userImage, setUserImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchUnread = async () => {
            const count = await getUnreadCount();
            setUnreadCount(count);

            // Fetch chat unread count
            const chatCount = await getChatUnreadCount();
            setChatUnreadCount(chatCount);
        };

        const fetchUserImage = async () => {
            const user = await getCurrentUser();
            if (user?.image) {
                setUserImage(user.image);
            }
        };

        if (session?.user) {
            fetchUnread();
            fetchUserImage();
            // Simple polling every 30 seconds
            const interval = setInterval(fetchUnread, 30000);
            return () => clearInterval(interval);
        }
    }, [session, pathname]); // Re-fetch on navigation too

    return (
        <aside className="w-64 surface-secondary border-r border-theme-primary flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-20 transition-colors">
            {/* ... header ... */}
            <div className="h-16 flex items-center px-6 border-b border-theme-primary bg-gradient-to-r from-white to-olive-50/20 dark:from-neutral-900 dark:to-neutral-900">
                <div className="w-8 h-8 relative mr-3">
                    <Image src="/M_max.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="font-black text-lg text-olive-900 dark:text-olive-500">MEP Projects</span>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-8">
                {navItems.map((section) => {
                    // Role-based visibility using roles array
                    // @ts-ignore
                    const userRole = session?.user?.role as string;

                    // Check if user's role is in the section's allowed roles
                    if (section.roles && !section.roles.includes(userRole)) return null;

                    return (
                        <div key={section.section}>
                            <div className="px-3 mb-3 text-[10px] font-black text-theme-muted uppercase tracking-widest flex items-center">
                                <span className="flex-1">{section.section}</span>
                                <div className="h-px bg-theme-primary flex-1 ml-2"></div>
                            </div>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                    const isNotificationItem = item.href === '/notifications';
                                    const isChatItem = item.href === '/chat';

                                    // Hide Logs for non-admins
                                    if (item.label === 'Auditoría' && !['SUPERADMIN', 'ADMIN'].includes(userRole)) return null;

                                    // Hide managerOnly items from WORKER
                                    if ((item as any).managerOnly && userRole === 'WORKER') return null;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`group flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all relative ${isActive
                                                ? 'bg-olive-600 text-white shadow-lg shadow-olive-600/20'
                                                : 'sidebar-item'
                                                }`}
                                            title={item.desc}
                                        >
                                            <div className="relative">
                                                <item.icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-theme-muted'}`} />
                                                {isNotificationItem && unreadCount > 0 && (
                                                    <span className={`absolute -top-1 right-2 w-2.5 h-2.5 rounded-full border-2 ${isActive ? 'bg-red-400 border-olive-600' : 'bg-red-500 border-white dark:border-neutral-900'}`}></span>
                                                )}
                                                {isChatItem && chatUnreadCount > 0 && (
                                                    <span className={`absolute -top-1 right-2 w-2.5 h-2.5 rounded-full border-2 ${isActive ? 'bg-blue-400 border-olive-600' : 'bg-blue-500 border-white dark:border-neutral-900'}`}></span>
                                                )}
                                            </div>
                                            <span className="flex-1">{item.label}</span>
                                            {isNotificationItem && unreadCount > 0 && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-auto ${isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                                                    {unreadCount}
                                                </span>
                                            )}
                                            {isChatItem && chatUnreadCount > 0 && (
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-auto ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'}`}>
                                                    {chatUnreadCount}
                                                </span>
                                            )}
                                            {!isNotificationItem && !isChatItem && isActive && (
                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse ml-auto"></div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* ... user ... */}
            <div className="p-4 border-t border-theme-primary surface-tertiary">
                <div className="flex items-center">
                    {userImage ? (
                        <img src={userImage} alt="Avatar" className="w-9 h-9 rounded-full object-cover mr-3 border border-olive-200 dark:border-olive-900" />
                    ) : (
                        <div className="w-9 h-9 rounded-full bg-olive-100 dark:bg-olive-900/50 flex items-center justify-center text-olive-700 dark:text-olive-300 text-xs font-bold mr-3 border border-olive-200 dark:border-olive-800">
                            {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-theme-primary truncate">{session?.user?.name || 'Usuario'}</p>
                        <p className="text-xs text-olive-600 dark:text-olive-400 font-medium truncate">
                            {/* @ts-ignore */}
                            {session?.user?.role || 'Trabajador'}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
