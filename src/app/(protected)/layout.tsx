import Sidebar from '@/components/layout/Sidebar';
import MobileSidebar from '@/components/layout/MobileSidebar';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SessionProvider from '@/components/providers/SessionProvider';
import { ToastProvider } from '@/components/ui/Toast';
import ErrorBoundary from '@/components/ErrorBoundary';
import ChatNotificationObserver from '@/components/chat/ChatNotificationObserver';
import ActivityHeartbeat from '@/components/ActivityHeartbeat';
import { SidebarProvider } from '@/components/layout/SidebarContext';
import MainLayoutWrapper from '@/components/layout/MainLayoutWrapper';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();

    if (!session) {
        redirect('/login');
    }

    return (
        <SessionProvider>
            <ErrorBoundary>
                <ToastProvider>
                    <ChatNotificationObserver />
                    <ActivityHeartbeat />
                    <SidebarProvider>
                        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex font-sans text-neutral-900 dark:text-neutral-100 transition-colors">
                            {/* Desktop Sidebar */}
                            <div className="hidden lg:block">
                                <Sidebar />
                            </div>

                            {/* Mobile Sidebar */}
                            <MobileSidebar />

                            {/* Dynamic Main Content & Header */}
                            <MainLayoutWrapper>
                                {children}
                            </MainLayoutWrapper>
                        </div>
                    </SidebarProvider>
                </ToastProvider>
            </ErrorBoundary>
        </SessionProvider>
    );
}
