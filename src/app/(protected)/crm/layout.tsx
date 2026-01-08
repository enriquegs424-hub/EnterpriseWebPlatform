'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, KanbanSquare } from 'lucide-react';

export default function CRMLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const tabs = [
        { name: 'Dashboard', href: '/crm', icon: LayoutDashboard },
        { name: 'Pipeline', href: '/crm/pipeline', icon: KanbanSquare },
        { name: 'Clientes', href: '/crm/clients', icon: Users },
    ];

    return (
        <div className="h-full flex flex-col bg-neutral-50 dark:bg-neutral-900">
            {/* CRM Header / Navigation */}
            <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">CRM</h1>
                </div>

                <div className="flex gap-1">
                    {tabs.map((tab) => {
                        const isActive = pathname === tab.href;
                        const Icon = tab.icon;
                        return (
                            <Link
                                key={tab.href}
                                href={tab.href}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${isActive
                                    ? 'bg-olive-50 dark:bg-olive-900/30 text-olive-700 dark:text-olive-400'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.name}
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {children}
            </div>
        </div>
    );
}
