'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Briefcase, Users, Settings,
    Clock, FileText, BarChart, CheckSquare, FolderOpen, Calendar, Bell
} from 'lucide-react';
import Image from 'next/image';

const navItems = [
    {
        section: 'Principal', items: [
            { label: 'Inicio', href: '/dashboard', icon: LayoutDashboard, desc: 'Panel de control personal' },
            { label: 'Calendario', href: '/calendar', icon: Calendar, desc: 'Eventos y reuniones' },
            { label: 'Mis Tareas', href: '/tasks', icon: CheckSquare, desc: 'Gestionar tareas asignadas' },
            { label: 'Documentos', href: '/documents', icon: FolderOpen, desc: 'Gestión de archivos' },
            { label: 'Registro Diario', href: '/hours/daily', icon: Clock, desc: 'Registrar horas del día' },
            { label: 'Notificaciones', href: '/notifications', icon: Bell, desc: 'Centro de avisos' },
        ]
    },
    {
        section: 'Gestión', items: [
            { label: 'Proyectos', href: '/admin/projects', icon: Briefcase, desc: 'Códigos y clientes' },
            { label: 'Clientes', href: '/admin/clients', icon: Users, desc: 'Cartera de clientes' },
        ]
    },
    {
        section: 'Administración', items: [
            { label: 'Monitor de Horas', href: '/admin/hours', icon: BarChart, desc: 'Supervisión en tiempo real' },
            { label: 'Usuarios', href: '/admin/users', icon: Users, desc: 'Gestión de equipo' },
            { label: 'Configuración', href: '/settings', icon: Settings, desc: 'Preferencias personales' },
        ]
    }
];

import { useSession } from 'next-auth/react';

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <aside className="w-64 bg-white border-r border-neutral-200 flex flex-col h-screen fixed left-0 top-0 overflow-y-auto z-20">
            <div className="h-16 flex items-center px-6 border-b border-neutral-200 bg-gradient-to-r from-white to-olive-50/20">
                <div className="w-8 h-8 relative mr-3">
                    <Image src="/M_max.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="font-black text-lg text-olive-900">MEP Projects</span>
            </div>

            <nav className="flex-1 py-6 px-3 space-y-8">
                {navItems.map((section) => {
                    // Role-based visibility
                    // @ts-ignore
                    const isUserAdmin = session?.user?.role === 'ADMIN';
                    if (section.section === 'Administración' && !isUserAdmin) return null;
                    if (section.section === 'Gestión' && !isUserAdmin) return null;

                    return (
                        <div key={section.section}>
                            <div className="px-3 mb-3 text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center">
                                <span className="flex-1">{section.section}</span>
                                <div className="h-px bg-neutral-200 flex-1 ml-2"></div>
                            </div>
                            <div className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`group flex items-center px-3 py-2.5 text-sm font-semibold rounded-xl transition-all relative ${isActive
                                                ? 'bg-olive-600 text-white shadow-lg shadow-olive-600/20'
                                                : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                                                }`}
                                            title={item.desc}
                                        >
                                            <item.icon className={`w-5 h-5 mr-3 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                                            <span className="flex-1">{item.label}</span>
                                            {isActive && (
                                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                            )}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-neutral-200 bg-neutral-50/50">
                <div className="flex items-center">
                    <div className="w-9 h-9 rounded-full bg-olive-100 flex items-center justify-center text-olive-700 text-xs font-bold mr-3 border border-olive-200">
                        {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{session?.user?.name || 'Usuario'}</p>
                        <p className="text-xs text-olive-600 font-medium truncate">
                            {/* @ts-ignore */}
                            {session?.user?.role || 'Trabajador'}
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
