'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';

interface ProtectedRouteProps {
    children: ReactNode;
    allowedRoles?: string[];
    fallback?: ReactNode;
}

/**
 * Componente de protección de rutas del lado del cliente
 * Verifica el rol del usuario y redirige si no tiene permiso
 */
export function ProtectedRoute({
    children,
    allowedRoles = ['ADMIN', 'MANAGER', 'WORKER'],
    fallback
}: ProtectedRouteProps) {
    const { data: session, status } = useSession();
    const router = useRouter();

    const userRole = (session?.user as any)?.role as string || 'WORKER';
    // SUPERADMIN siempre tiene acceso, o si el rol está en la lista permitida
    const isAllowed = session?.user && (userRole === 'SUPERADMIN' || allowedRoles.includes(userRole));

    useEffect(() => {
        if (status === 'loading') return;

        if (!session?.user) {
            router.replace('/login');
            return;
        }

        if (!isAllowed) {
            console.warn(`[RBAC] Acceso denegado. Rol: ${userRole}, Requerido: ${allowedRoles.join(', ')}`);
            router.replace('/dashboard?error=access_denied');
        }
    }, [session, status, isAllowed, router, userRole, allowedRoles]);

    // Loading state
    if (status === 'loading') {
        return fallback || (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600"></div>
            </div>
        );
    }

    // Not allowed
    if (!isAllowed) {
        return fallback || (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Acceso Restringido</h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                    No tienes permisos para acceder a esta sección.
                    Contacta con un administrador si crees que esto es un error.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}

/**
 * Hook para verificar permisos en componentes
 */
export function useHasRole(...roles: string[]): boolean {
    const { data: session } = useSession();
    const userRole = (session?.user as any)?.role as string || 'WORKER';
    return roles.includes(userRole);
}

/**
 * Hook para obtener el rol del usuario actual
 */
export function useUserRole(): string {
    const { data: session } = useSession();
    return (session?.user as any)?.role as string || 'WORKER';
}
