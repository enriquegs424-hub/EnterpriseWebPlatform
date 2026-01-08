import Sidebar from '@/components/layout/Sidebar';
import MobileSidebar from '@/components/layout/MobileSidebar';
import Header from '@/components/layout/Header';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SessionProvider from '@/components/providers/SessionProvider';
import { ToastProvider } from '@/components/ui/Toast';
import ErrorBoundary from '@/components/ErrorBoundary';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    return (
        <SessionProvider>
            <ErrorBoundary>
                <ToastProvider>
                    <div className="min-h-screen bg-neutral-50 flex font-sans text-neutral-900">
                        {/* Desktop Sidebar */}
                        <div className="hidden lg:block">
                            <Sidebar />
                        </div>

                        {/* Mobile Sidebar */}
                        <MobileSidebar />

                        <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
                            <Header />
                            <main className="flex-1 p-4 md:p-6 overflow-auto">
                                {children}
                            </main>
                        </div>
                    </div>
                </ToastProvider>
            </ErrorBoundary>
        </SessionProvider>
    );
}
