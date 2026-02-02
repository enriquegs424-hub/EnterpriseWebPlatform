'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Briefcase, Users, Settings,
    Clock, FileText, FileCheck, BarChart, CheckSquare, FolderOpen, Calendar, Bell, MessageSquare, Activity, TrendingUp, Shield, Building2, UserCog,
    DollarSign, PieChart, Package, ClipboardList
} from 'lucide-react';
import Image from 'next/image';

interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
    managerOnly?: boolean;
    adminOnly?: boolean;
}

interface NavSection {
    section: string;
    items: NavItem[];
    roles: string[];
}

const navItems: NavSection[] = [
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
            { label: 'Panel Global', href: '/control-horas/global', icon: ClipboardList, desc: 'Dashboard global de horas', adminOnly: true },
            { label: 'Anual', href: '/control-horas/anual', icon: BarChart, desc: 'Resumen anual', managerOnly: true },
        ], roles: ['SUPERADMIN', 'ADMIN', 'MANAGER', 'WORKER']
    },
    {
        section: 'Gestión', items: [
            { label: 'CRM', href: '/crm', icon: TrendingUp, desc: 'Gestión de leads y clientes' },
            { label: 'Presupuestos', href: '/quotes', icon: FileCheck, desc: 'Gestión de presupuestos' },
            { label: 'Facturas', href: '/invoices', icon: FileText, desc: 'Facturación y cobros' },
            { label: 'Gastos', href: '/expenses', icon: DollarSign, desc: 'Control de gastos' },
            { label: 'Proyectos', href: '/admin/projects', icon: Briefcase, desc: 'Códigos y clientes' },
            { label: 'Clientes', href: '/admin/clients', icon: Users, desc: 'Cartera de clientes' },
        ], roles: ['SUPERADMIN', 'ADMIN', 'MANAGER']
    },
    {
        section: 'RRHH', items: [
            { label: 'Dashboard RRHH', href: '/hr', icon: Users, desc: 'Panel de Recursos Humanos' },
            { label: 'Empleados', href: '/hr/employees', icon: Users, desc: 'Gestión de empleados' },
            { label: 'Ausencias', href: '/hr/absences', icon: Calendar, desc: 'Vacaciones y ausencias' },
            { label: 'Nóminas', href: '/hr/payroll', icon: DollarSign, desc: 'Gestión de nóminas', adminOnly: true },
            { label: 'Informes RRHH', href: '/hr/reports', icon: BarChart, desc: 'Reportes y estadísticas', adminOnly: true },
            { label: 'Organigrama', href: '/hr/organization', icon: Building2, desc: 'Estructura organizacional' },
        ], roles: ['SUPERADMIN', 'ADMIN', 'MANAGER']
    },
    {
        section: 'Administración', items: [
            { label: 'Analytics', href: '/analytics', icon: BarChart, desc: 'Métricas y reportes' },
            { label: 'Finanzas', href: '/finance', icon: PieChart, desc: 'Resumen financiero' },
            { label: 'Horas Global', href: '/admin/hours', icon: Clock, desc: 'Control horario de usuarios' },
            { label: 'Productos', href: '/admin/products', icon: Package, desc: 'Catálogo de productos/servicios' },
            { label: 'Usuarios', href: '/admin/users', icon: Users, desc: 'Gestión de equipo' },
            { label: 'Departamentos', href: '/admin/departments', icon: Building2, desc: 'Configuración por áreas' },
            { label: 'Equipos', href: '/admin/teams', icon: UserCog, desc: 'Organización de equipos' },
            { label: 'Auditoría', href: '/admin/logs', icon: Activity, desc: 'Logs del sistema' },
            { label: 'Configuración', href: '/settings', icon: Settings, desc: 'Preferencias personales' },
        ], roles: ['SUPERADMIN', 'ADMIN']
    }
];


import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { getUnreadCount } from '@/app/(protected)/notifications/actions';
import { getUnreadCount as getChatUnreadCount } from '@/app/(protected)/chat/actions';
import { getCurrentUser } from '@/app/(protected)/settings/actions';


import { useSidebar } from './SidebarContext';
import { Menu, ChevronLeft } from 'lucide-react';

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { isCollapsed, toggleSidebar } = useSidebar();
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
        <aside
            className={`
                fixed left-0 top-0 h-screen z-20 flex flex-col surface-secondary border-r border-theme-primary overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out
                ${isCollapsed ? 'w-20' : 'w-64'}
            `}
        >
            {/* ... header ... */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-theme-primary bg-gradient-to-r from-white to-olive-50/20 dark:from-neutral-900 dark:to-neutral-900 shrink-0">
                <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                    <div className="w-8 h-8 relative shrink-0">
                        <Image src="/M_max.png" alt="Logo" fill className="object-contain" />
                    </div>
                    {!isCollapsed && (
                        <span className="font-black text-lg text-olive-900 dark:text-olive-500 ml-3 whitespace-nowrap">MEP Projects</span>
                    )}
                </div>
                {!isCollapsed && (
                    <button
                        onClick={toggleSidebar}
                        className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500"
                    >
                        <ChevronLeft size={20} />
                    </button>
                )}
            </div>

            {/* Collapse toggle button centered when collapsed */}
            {isCollapsed && (
                <div className="flex justify-center py-2 border-b border-theme-primary/50">
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-olive-100 dark:hover:bg-neutral-800 text-olive-600 transition-colors"
                    >
                        <Menu size={20} />
                    </button>
                </div>
            )}

            <nav className="flex-1 py-4 px-3 space-y-4">
                {navItems.map((section) => {
                    // Role-based visibility using roles array
                    const userRole = (session?.user as any)?.role as string || 'WORKER';

                    // Check if user's role is in the section's allowed roles
                    if (section.roles && !section.roles.includes(userRole)) return null;

                    return (
                        <div key={section.section}>
                            {!isCollapsed ? (
                                <div className="px-3 mb-2 text-[10px] font-black text-theme-muted uppercase tracking-widest flex items-center">
                                    <span className="flex-1 truncate">{section.section}</span>
                                    <div className="h-px bg-theme-primary flex-1 ml-2"></div>
                                </div>
                            ) : (
                                <div className="flex justify-center mb-2">
                                    <div className="h-px w-8 bg-theme-primary"></div>
                                </div>
                            )}

                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                    const isNotificationItem = item.href === '/notifications';
                                    const isChatItem = item.href === '/chat';

                                    // Hide Logs for non-admins
                                    if (item.label === 'Auditoría' && !['SUPERADMIN', 'ADMIN'].includes(userRole)) return null;

                                    // Hide managerOnly items from WORKER
                                    if (item.managerOnly && userRole === 'WORKER') return null;

                                    // Hide adminOnly items from WORKER and MANAGER
                                    if (item.adminOnly && !['SUPERADMIN', 'ADMIN'].includes(userRole)) return null;

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`group flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all relative ${isActive
                                                ? 'bg-olive-600 text-white shadow-lg shadow-olive-600/20'
                                                : 'sidebar-item'
                                                } ${isCollapsed ? 'justify-center' : ''}`}
                                            title={isCollapsed ? item.label : item.desc}
                                        >
                                            <div className="relative flex items-center justify-center">
                                                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-theme-muted'} ${!isCollapsed ? 'mr-3' : ''}`} />

                                                {/* Badges */}
                                                {isNotificationItem && unreadCount > 0 && (
                                                    <span className={`absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 ${isActive ? 'bg-red-400 border-olive-600' : 'bg-red-500 border-white dark:border-neutral-900'}`}></span>
                                                )}
                                                {isChatItem && chatUnreadCount > 0 && (
                                                    <span className={`absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full border-2 ${isActive ? 'bg-blue-400 border-olive-600' : 'bg-blue-500 border-white dark:border-neutral-900'}`}></span>
                                                )}
                                            </div>

                                            {!isCollapsed && (
                                                <>
                                                    <span className="flex-1 truncate">{item.label}</span>
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
                                                </>
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
            <div className="p-4 border-t border-theme-primary surface-tertiary shrink-0">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
                    {userImage ? (
                        <img src={userImage} alt="Avatar" className={`w-9 h-9 rounded-full object-cover border border-olive-200 dark:border-olive-900 ${!isCollapsed ? 'mr-3' : ''}`} />
                    ) : (
                        <div className={`w-9 h-9 rounded-full bg-olive-100 dark:bg-olive-900/50 flex items-center justify-center text-olive-700 dark:text-olive-300 text-xs font-bold border border-olive-200 dark:border-olive-800 ${!isCollapsed ? 'mr-3' : ''}`}>
                            {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                    )}
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-theme-primary truncate w-full">{session?.user?.name || 'Usuario'}</p>
                            <p className="text-xs text-olive-600 dark:text-olive-400 font-medium truncate">
                                {/* @ts-ignore */}
                                {session?.user?.role || 'Trabajador'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
