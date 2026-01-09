import { prisma } from "./prisma";
import { auth } from "@/auth";

/**
 * Sistema de Permisos (RBAC básico)
 * 
 * Mientras no exista el modelo Permission completo,
 * usamos permisos basados en rol con esta configuración
 */

// Definición de permisos por recurso y acción
export type Resource =
    | "users"
    | "projects"
    | "clients"
    | "leads"
    | "tasks"
    | "timeentries"
    | "documents"
    | "expenses"
    | "invoices"
    | "settings"
    | "analytics";

export type Action = "create" | "read" | "update" | "delete" | "approve";

// Matriz de permisos por rol
// true = permitido, false = denegado, "own" = solo propios recursos
const PERMISSIONS: Record<string, Record<Resource, Record<Action, boolean | "own">>> = {
    ADMIN: {
        users: { create: true, read: true, update: true, delete: true, approve: true },
        projects: { create: true, read: true, update: true, delete: true, approve: true },
        clients: { create: true, read: true, update: true, delete: true, approve: true },
        leads: { create: true, read: true, update: true, delete: true, approve: true },
        tasks: { create: true, read: true, update: true, delete: true, approve: true },
        timeentries: { create: true, read: true, update: true, delete: true, approve: true },
        documents: { create: true, read: true, update: true, delete: true, approve: true },
        expenses: { create: true, read: true, update: true, delete: true, approve: true },
        invoices: { create: true, read: true, update: true, delete: true, approve: true },
        settings: { create: true, read: true, update: true, delete: true, approve: true },
        analytics: { create: true, read: true, update: true, delete: true, approve: true },
    },
    MANAGER: {
        users: { create: false, read: true, update: false, delete: false, approve: false },
        projects: { create: true, read: true, update: true, delete: false, approve: true },
        clients: { create: true, read: true, update: true, delete: false, approve: true },
        leads: { create: true, read: true, update: true, delete: true, approve: true },
        tasks: { create: true, read: true, update: true, delete: true, approve: true },
        timeentries: { create: true, read: true, update: true, delete: "own", approve: true },
        documents: { create: true, read: true, update: true, delete: "own", approve: true },
        expenses: { create: true, read: true, update: "own", delete: "own", approve: true },
        invoices: { create: true, read: true, update: true, delete: false, approve: true },
        settings: { create: false, read: true, update: "own", delete: false, approve: false },
        analytics: { create: false, read: true, update: false, delete: false, approve: false },
    },
    WORKER: {
        users: { create: false, read: false, update: false, delete: false, approve: false },
        projects: { create: false, read: true, update: false, delete: false, approve: false },
        clients: { create: false, read: true, update: false, delete: false, approve: false },
        leads: { create: true, read: true, update: "own", delete: false, approve: false },
        tasks: { create: true, read: true, update: "own", delete: false, approve: false },
        timeentries: { create: true, read: "own", update: "own", delete: "own", approve: false },
        documents: { create: true, read: true, update: "own", delete: "own", approve: false },
        expenses: { create: true, read: "own", update: "own", delete: "own", approve: false },
        invoices: { create: false, read: false, update: false, delete: false, approve: false },
        settings: { create: false, read: "own", update: "own", delete: false, approve: false },
        analytics: { create: false, read: false, update: false, delete: false, approve: false },
    },
    CLIENT: {
        users: { create: false, read: false, update: false, delete: false, approve: false },
        projects: { create: false, read: "own", update: false, delete: false, approve: false },
        clients: { create: false, read: "own", update: false, delete: false, approve: false },
        leads: { create: false, read: false, update: false, delete: false, approve: false },
        tasks: { create: false, read: "own", update: false, delete: false, approve: false },
        timeentries: { create: false, read: false, update: false, delete: false, approve: false },
        documents: { create: false, read: "own", update: false, delete: false, approve: false },
        expenses: { create: false, read: false, update: false, delete: false, approve: false },
        invoices: { create: false, read: "own", update: false, delete: false, approve: false },
        settings: { create: false, read: "own", update: "own", delete: false, approve: false },
        analytics: { create: false, read: false, update: false, delete: false, approve: false },
    },
};

/**
 * Verificar si un usuario tiene permiso para una acción
 */
export function hasPermission(
    role: string,
    resource: Resource,
    action: Action
): boolean | "own" {
    const rolePerms = PERMISSIONS[role];
    if (!rolePerms) return false;

    const resourcePerms = rolePerms[resource];
    if (!resourcePerms) return false;

    return resourcePerms[action] ?? false;
}

/**
 * Verificar permiso con contexto de sesión actual
 * Lanza error si no tiene permiso
 */
export async function checkPermission(
    resource: Resource,
    action: Action,
    ownerId?: string
): Promise<void> {
    const session = await auth();

    if (!session?.user) {
        throw new Error("No autenticado");
    }

    const userRole = session.user.role as string;
    const userId = session.user.id as string;
    const permission = hasPermission(userRole, resource, action);

    if (permission === false) {
        // Log intento denegado
        await logActivity(
            userId,
            `DENIED_${action.toUpperCase()}`,
            resource,
            undefined,
            `Permiso denegado: ${resource}.${action}`
        );
        throw new Error(`Sin permiso para ${action} en ${resource}`);
    }

    if (permission === "own" && ownerId && ownerId !== userId) {
        // Log intento denegado
        await logActivity(
            userId,
            `DENIED_${action.toUpperCase()}`,
            resource,
            ownerId,
            `Permiso denegado: recurso de otro usuario`
        );
        throw new Error(`Solo puedes ${action} tus propios ${resource}`);
    }

    // Permiso concedido, no hacer nada
}

/**
 * Versión no-throw para checks condicionales en UI
 */
export async function canDo(
    resource: Resource,
    action: Action,
    ownerId?: string
): Promise<boolean> {
    try {
        await checkPermission(resource, action, ownerId);
        return true;
    } catch {
        return false;
    }
}

/**
 * Registrar actividad en el sistema
 */
export async function logActivity(
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    details?: string
): Promise<void> {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                entityId,
                details: details ? `[${entityType}] ${details}` : `[${entityType}]`,
            },
        });
    } catch (error) {
        // No fallar si el log falla, solo console
        console.error("[Audit] Error logging activity:", error);
    }
}

/**
 * Helper para loggear CRUD operations
 */
export async function auditCrud(
    action: "CREATE" | "READ" | "UPDATE" | "DELETE",
    entityType: string,
    entityId: string,
    changes?: Record<string, any>
): Promise<void> {
    const session = await auth();
    if (!session?.user?.id) return;

    const details = changes
        ? JSON.stringify(changes).substring(0, 500)
        : undefined;

    await logActivity(
        session.user.id as string,
        action,
        entityType,
        entityId,
        details
    );
}
