'use client';

import { useSidebar } from './SidebarContext';
import Header from './Header';

export default function MainLayoutWrapper({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar();

    return (
        <div
            className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'
                }`}
        >
            <Header />
            <main className="flex-1 p-4 md:p-6 overflow-auto">
                {children}
            </main>
        </div>
    );
}
