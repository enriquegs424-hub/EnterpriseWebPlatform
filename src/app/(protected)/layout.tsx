import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SessionProvider from '@/components/providers/SessionProvider';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    return (
        <SessionProvider>
            <div className="min-h-screen bg-neutral-50 flex font-sans text-neutral-900">
                <Sidebar />
                <div className="flex-1 ml-64 flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-1 p-6 overflow-auto">
                        {children}
                    </main>
                </div>
            </div>
        </SessionProvider>
    );
}
