import { Resource, Action } from "./permissions";

/**
 * Mapeo de rutas a recursos y acciones requeridas
 * Este archivo no tiene 'use server' porque exporta un objeto
 */
export const ROUTE_PERMISSIONS: Record<string, { resource: Resource; action: Action; roles?: string[] }> = {
    // Admin routes - solo ADMIN
    '/admin/users': { resource: 'users', action: 'read', roles: ['ADMIN'] },
    '/admin/logs': { resource: 'settings', action: 'read', roles: ['ADMIN'] },

    // Admin routes - ADMIN y MANAGER
    '/admin/clients': { resource: 'clients', action: 'read', roles: ['ADMIN', 'MANAGER'] },
    '/admin/projects': { resource: 'projects', action: 'read', roles: ['ADMIN', 'MANAGER'] },
    '/admin/hours': { resource: 'timeentries', action: 'read', roles: ['ADMIN', 'MANAGER'] },

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
