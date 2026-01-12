'use server';

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { hasPermission, Resource, Action } from "./permissions";

/**
 * Mapeo de rutas a recursos y acciones requeridas
 */
export const ROUTE_PERMISSIONS: Record<string, { resource: Resource; action: Action; roles?: string[] }> = {
    // Admin routes - solo ADMIN y MANAGER
    '/admin/users': { resource: 'users', action: 'read', roles: ['ADMIN'] },
    '/admin/clients': { resource: 'clients', action: 'read', roles: ['ADMIN', 'MANAGER'] },
    '/admin/projects': { resource: 'projects', action: 'read', roles: ['ADMIN', 'MANAGER'] },
    '/admin/hours': { resource: 'timeentries', action: 'read', roles: ['ADMIN', 'MANAGER'] },
    '/admin/logs': { resource: 'settings', action: 'read', roles: ['ADMIN'] },

    // Management routes - ADMIN y MANAGER
    '/invoices': { resource: 'invoices', action: 'read', roles: ['ADMIN', 'MANAGER'] },
    '/quotes': { resource: 'invoices', action: 'read', roles: ['ADMIN', 'MANAGER'] },
    '/crm': { resource: 'leads', action: 'read', roles: ['ADMIN', 'MANAGER'] },
    '/analytics': { resource: 'analytics', action: 'read', roles: ['ADMIN', 'MANAGER'] },

    // Worker accessible routes (all authenticated users)
    '/dashboard': { resource: 'projects', action: 'read' },
    '/tasks': { resource: 'tasks', action: 'read' },
    '/hours': { resource: 'timeentries', action: 'read' },
    '/documents': { resource: 'documents', action: 'read' },
    '/calendar': { resource: 'tasks', action: 'read' },
    '/notifications': { resource: 'settings', action: 'read' },
    '/settings': { resource: 'settings', action: 'read' },
    '/chat': { resource: 'tasks', action: 'read' },
};

/**
 * Verificar acceso a una ruta específica
 * Retorna true si tiene acceso, false si no
 */
export async function checkRouteAccess(pathname: string): Promise<{ allowed: boolean; reason?: string }> {
    const session = await auth();

    if (!session?.user) {
        return { allowed: false, reason: 'No autenticado' };
    }

    const userRole = (session.user as any).role as string || 'WORKER';

    // Encontrar la regla de permiso que aplica
    let matchedRule: typeof ROUTE_PERMISSIONS[string] | null = null;

    for (const [route, config] of Object.entries(ROUTE_PERMISSIONS)) {
        if (pathname.startsWith(route)) {
            matchedRule = config;
            break;
        }
    }

    // Si no hay regla, permitir (rutas públicas dentro de protected)
    if (!matchedRule) {
        return { allowed: true };
    }

    // Verificar por rol específico si está definido
    if (matchedRule.roles && !matchedRule.roles.includes(userRole)) {
        return {
            allowed: false,
            reason: `Acceso restringido. Requiere rol: ${matchedRule.roles.join(' o ')}`
        };
    }

    // Verificar por permiso de recurso
    const permission = hasPermission(userRole, matchedRule.resource, matchedRule.action);

    if (permission === false) {
        return {
            allowed: false,
            reason: `Sin permiso para acceder a ${matchedRule.resource}`
        };
    }

    return { allowed: true };
}

/**
 * Proteger una página del lado del servidor
 * Usar en el inicio de cada page.tsx que requiera protección
 */
export async function requireAccess(pathname: string): Promise<void> {
    const { allowed, reason } = await checkRouteAccess(pathname);

    if (!allowed) {
        console.warn(`[RBAC] Acceso denegado a ${pathname}: ${reason}`);
        redirect('/dashboard?error=access_denied');
    }
}

/**
 * Obtener información del usuario actual
 */
export async function getCurrentUser() {
    const session = await auth();

    if (!session?.user) {
        return null;
    }

    return {
        id: session.user.id as string,
        name: session.user.name,
        email: session.user.email,
        role: (session.user as any).role as string || 'WORKER',
        companyId: (session.user as any).companyId as string | undefined,
    };
}

/**
 * Verificar si el usuario actual tiene un rol específico
 */
export async function hasRole(...roles: string[]): Promise<boolean> {
    const user = await getCurrentUser();
    if (!user) return false;
    return roles.includes(user.role);
}
