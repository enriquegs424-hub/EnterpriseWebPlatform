import Link from 'next/link';
import { Hexagon } from 'lucide-react';

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
            <header className="h-16 bg-white border-b border-neutral-200 flex items-center justify-between px-6 sticky top-0 z-20">
                <div className="flex items-center gap-2">
                    <div className="bg-olive-600 p-1.5 rounded-lg text-white">
                        <Hexagon size={20} fill="currentColor" />
                    </div>
                    <span className="font-bold text-lg tracking-tight">MEP<span className="text-olive-600">Portal</span></span>
                </div>
                <div>
                    <Link href="/portal/login" className="text-sm font-semibold text-neutral-500 hover:text-olive-600">
                        Ayuda
                    </Link>
                </div>
            </header>
            <main className="p-6 max-w-7xl mx-auto">
                {children}
            </main>
        </div>
    );
}
