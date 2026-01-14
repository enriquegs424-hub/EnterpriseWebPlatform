import { prisma } from "./prisma";
import { auth } from "@/auth";
import type { Role } from "@prisma/client";

/**
 * Sistema de Permisos Avanzado (RBAC + Granular)
 * 
 * 5 niveles jerárquicos:
 * - SUPERADMIN: Dios del sistema (cross-tenant)
 * - ADMIN: Administrador de empresa
 * - MANAGER: Gestor de equipo
 * - WORKER: Empleado operativo
 * - GUEST: Invitado (solo lectura compartida)
 */

// Definición de recursos y acciones
export type Resource =
    | "users"
    | "companies"
    | "projects"
    | "clients"
    | "leads"
    | "tasks"
    | "timeentries"
    | "documents"
    | "expenses"
    | "invoices"
    | "quotes"
    | "settings"
    | "analytics"
    | "teams"
    | "permissions"
    | "audit";

export type Action = "create" | "read" | "update" | "delete" | "approve" | "export";

// Jerarquía de roles (nivel más bajo = más poder)
export const ROLE_HIERARCHY: Record<Role, number> = {
    SUPERADMIN: 0,
    ADMIN: 1,
    MANAGER: 2,
    WORKER: 3,
    GUEST: 4,
};

// Matriz de permisos BASE por rol
// true = permitido, false = denegado, "own" = solo propios recursos, "team" = equipo del usuario
type PermissionValue = boolean | "own" | "team";

const BASE_PERMISSIONS: Record<Role, Partial<Record<Resource, Record<Action, PermissionValue>>>> = {
    SUPERADMIN: {
        companies: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        users: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        projects: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        clients: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        leads: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        tasks: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        timeentries: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        documents: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        expenses: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        invoices: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        quotes: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        settings: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        analytics: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        teams: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        permissions: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        audit: { create: false, read: true, update: false, delete: false, approve: false, export: true },
    },
    ADMIN: {
        companies: { create: false, read: "own", update: "own", delete: false, approve: false, export: "own" },
        users: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        projects: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        clients: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        leads: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        tasks: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        timeentries: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        documents: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        expenses: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        invoices: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        quotes: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        settings: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        analytics: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        teams: { create: true, read: true, update: true, delete: true, approve: true, export: true },
        permissions: { create: true, read: true, update: true, delete: true, approve: false, export: false },
        audit: { create: false, read: true, update: false, delete: false, approve: false, export: true },
    },
    MANAGER: {
        companies: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        users: { create: false, read: "team", update: false, delete: false, approve: false, export: false },
        projects: { create: true, read: "team", update: "team", delete: false, approve: true, export: "team" },
        clients: { create: true, read: "team", update: "team", delete: false, approve: true, export: false },
        leads: { create: true, read: "team", update: "team", delete: "team", approve: true, export: false },
        tasks: { create: true, read: "team", update: "team", delete: "team", approve: true, export: false },
        timeentries: { create: true, read: "team", update: "own", delete: "own", approve: "team", export: false },
        documents: { create: true, read: "team", update: "own", delete: "own", approve: true, export: false },
        expenses: { create: true, read: "team", update: "own", delete: "own", approve: "team", export: false },
        invoices: { create: false, read: "team", update: false, delete: false, approve: false, export: false },
        quotes: { create: true, read: "team", update: "team", delete: false, approve: true, export: false },
        settings: { create: false, read: "own", update: "own", delete: false, approve: false, export: false },
        analytics: { create: false, read: "team", update: false, delete: false, approve: false, export: false },
        teams: { create: false, read: "team", update: false, delete: false, approve: false, export: false },
        permissions: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        audit: { create: false, read: false, update: false, delete: false, approve: false, export: false },
    },
    WORKER: {
        companies: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        users: { create: false, read: false, update: "own", delete: false, approve: false, export: false },
        projects: { create: false, read: true, update: false, delete: false, approve: false, export: false },
        clients: { create: false, read: true, update: false, delete: false, approve: false, export: false },
        leads: { create: true, read: "own", update: "own", delete: false, approve: false, export: false },
        tasks: { create: false, read: "own", update: "own", delete: false, approve: false, export: false },
        timeentries: { create: true, read: "own", update: "own", delete: "own", approve: false, export: false },
        documents: { create: true, read: true, update: "own", delete: "own", approve: false, export: false },
        expenses: { create: true, read: "own", update: "own", delete: "own", approve: false, export: false },
        invoices: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        quotes: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        settings: { create: false, read: "own", update: "own", delete: false, approve: false, export: false },
        analytics: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        teams: { create: false, read: "team", update: false, delete: false, approve: false, export: false },
        permissions: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        audit: { create: false, read: false, update: false, delete: false, approve: false, export: false },
    },
    GUEST: {
        companies: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        users: { create: false, read: false, update: "own", delete: false, approve: false, export: false },
        projects: { create: false, read: "own", update: false, delete: false, approve: false, export: false },
        clients: { create: false, read: "own", update: false, delete: false, approve: false, export: false },
        leads: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        tasks: { create: false, read: "own", update: false, delete: false, approve: false, export: false },
        timeentries: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        documents: { create: false, read: "own", update: false, delete: false, approve: false, export: false },
        expenses: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        invoices: { create: false, read: "own", update: false, delete: false, approve: false, export: false },
        quotes: { create: false, read: "own", update: false, delete: false, approve: false, export: false },
        settings: { create: false, read: "own", update: "own", delete: false, approve: false, export: false },
        analytics: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        teams: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        permissions: { create: false, read: false, update: false, delete: false, approve: false, export: false },
        audit: { create: false, read: false, update: false, delete: false, approve: false, export: false },
    },
};

/**
 * Obtener permiso base del rol
 */
export function getBasePermission(
    role: Role,
    resource: Resource,
    action: Action
): PermissionValue {
    const rolePerms = BASE_PERMISSIONS[role];
    if (!rolePerms) return false;

    const resourcePerms = rolePerms[resource];
    if (!resourcePerms) return false;

    return resourcePerms[action] ?? false;
}

/**
 * Obtener permisos efectivos del usuario (rol base + departamento + overrides)
 * Prioridad: Override individual > Departamento > Rol base
 */
export async function getEffectivePermission(
    userId: string,
    role: Role,
    department: string | null,
    resource: Resource,
    action: Action
): Promise<PermissionValue> {
    // 1. Permiso base del rol
    const basePermission = getBasePermission(role, resource, action);

    // 2. Permiso del departamento (si existe)
    let departmentPermission: PermissionValue = basePermission;
    if (department) {
        const deptPerm = await (prisma as any).departmentPermission.findUnique({
            where: {
                department_resource_action: {
                    department,
                    resource,
                    action,
                },
            },
        });

        if (deptPerm) {
            // Si tiene scope, usar scope (own/team/all), sino usar granted (boolean)
            departmentPermission = deptPerm.scope || deptPerm.granted;
        }
    }

    // 3. Override específico del usuario (máxima prioridad)
    const override = await prisma.permission.findUnique({
        where: {
            userId_resource_action: {
                userId,
                resource,
                action,
            },
        },
    });

    // Aplicar prioridad: override > department > base
    if (override) {
        return override.granted;
    }

    return departmentPermission;
}


/**
 * Verificar vetos de empresa (SUPERADMIN sobre ADMIN)
 */
export async function checkCompanyVeto(
    companyId: string,
    vetoKey: keyof Omit<
        NonNullable<Awaited<ReturnType<typeof prisma.companySettings.findUnique>>>,
        "id" | "companyId" | "createdAt" | "updatedAt" | "modulesEnabled"
    >
): Promise<boolean> {
    const settings = await prisma.companySettings.findUnique({
        where: { companyId },
    });

    // Si no hay settings, todo permitido por defecto
    if (!settings) return true;

    return settings[vetoKey] ?? true;
}

/**
 * Verificar si un módulo está habilitado para una empresa
 */
export async function isModuleEnabled(
    companyId: string,
    moduleName: string
): Promise<boolean> {
    const settings = await prisma.companySettings.findUnique({
        where: { companyId },
    });

    // Si no hay settings, todos los módulos habilitados por defecto
    if (!settings) return true;

    return settings.modulesEnabled.includes(moduleName);
}

/**
 * Verificar permiso con contexto de sesión actual
 * Lanza error si no tiene permiso
 */
export async function checkPermission(
    resource: Resource,
    action: Action,
    options?: {
        ownerId?: string;
        teamId?: string;
        skipVetoCheck?: boolean;
    }
): Promise<void> {
    const session = await auth();

    if (!session?.user) {
        throw new Error("No autenticado");
    }

    const userRole = session.user.role as Role;
    const userId = session.user.id as string;
    const companyId = (session.user as any).companyId as string | undefined;

    // SUPERADMIN bypassa todo
    if (userRole === "SUPERADMIN") {
        return;
    }

    // Verificar vetos de empresa para ADMIN
    if (userRole === "ADMIN" && companyId && !options?.skipVetoCheck) {
        const vetoMap: Partial<Record<string, keyof typeof BASE_PERMISSIONS.ADMIN>> = {
            "users:create": "canCreateUsers" as any,
            "users:delete": "canDeleteUsers" as any,
            // ... más mapeos
        };

        const vetoKey = vetoMap[`${resource}:${action}`];
        if (vetoKey) {
            const allowed = await checkCompanyVeto(companyId, vetoKey as any);
            if (!allowed) {
                await logActivity(
                    userId,
                    `VETOED_${action.toUpperCase()}`,
                    resource,
                    options?.ownerId,
                    `Acción vetada por SUPERADMIN`
                );
                throw new Error("Esta acción ha sido restringida por el administrador del sistema");
            }
        }
    }

    // Obtener permiso efectivo (incluye departamento si existe)
    const userDepartment = (session.user as any).department as string | null;
    const permission = await getEffectivePermission(userId, userRole, userDepartment, resource, action);

    if (permission === false) {
        await logActivity(
            userId,
            `DENIED_${action.toUpperCase()}`,
            resource,
            options?.ownerId,
            `Permiso denegado: ${resource}.${action}`
        );
        throw new Error(`Sin permiso para ${action} en ${resource}`);
    }

    // Verificar scope "own"
    if (permission === "own" && options?.ownerId && options.ownerId !== userId) {
        await logActivity(
            userId,
            `DENIED_${action.toUpperCase()}`,
            resource,
            options.ownerId,
            `Permiso denegado: recurso de otro usuario`
        );
        throw new Error(`Solo puedes ${action} tus propios ${resource}`);
    }

    // Verificar scope "team"
    if (permission === "team" && options?.ownerId) {
        const userTeams = await prisma.team.findMany({
            where: {
                OR: [
                    { managerId: userId },
                    { members: { some: { id: userId } } },
                ],
            },
            select: { id: true, members: { select: { id: true } } },
        });

        const teamMemberIds = userTeams.flatMap((t) => t.members.map((m) => m.id));
        if (!teamMemberIds.includes(options.ownerId) && options.ownerId !== userId) {
            await logActivity(
                userId,
                `DENIED_${action.toUpperCase()}`,
                resource,
                options.ownerId,
                `Permiso denegado: recurso fuera de tu equipo`
            );
            throw new Error(`Solo puedes ${action} recursos de tu equipo`);
        }
    }

    // Permiso concedido
}

/**
 * Versión no-throw para checks condicionales en UI
 */
export async function canDo(
    resource: Resource,
    action: Action,
    options?: {
        ownerId?: string;
        teamId?: string;
    }
): Promise<boolean> {
    try {
        await checkPermission(resource, action, options);
        return true;
    } catch {
        return false;
    }
}

/**
 * Verificar si usuario tiene rol suficiente
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
    return ROLE_HIERARCHY[userRole] <= ROLE_HIERARCHY[requiredRole];
}

/**
 * Registrar actividad en el sistema
 */
export async function logActivity(
    userId: string,
    action: string,
    entityType: string,
    entityId?: string,
    details?: string,
    extra?: { ipAddress?: string; userAgent?: string }
): Promise<void> {
    try {
        // Obtener companyId del usuario
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { companyId: true },
        });

        await prisma.activityLog.create({
            data: {
                userId,
                companyId: user?.companyId,
                action,
                entityType,
                entityId,
                details: details ? `[${entityType}] ${details}` : `[${entityType}]`,
                ipAddress: extra?.ipAddress,
                userAgent: extra?.userAgent,
            },
        });
    } catch (error) {
        console.error("[Audit] Error logging activity:", error);
    }
}

/**
 * Helper para loggear CRUD operations
 */
export async function auditCrud(
    action: "CREATE" | "READ" | "UPDATE" | "DELETE" | "APPROVE",
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

/**
 * Obtener todos los permisos override de un usuario
 */
export async function getUserPermissionOverrides(userId: string) {
    return prisma.permission.findMany({
        where: { userId },
    });
}

/**
 * Establecer override de permiso para un usuario
 */
export async function setUserPermissionOverride(
    userId: string,
    resource: Resource,
    action: Action,
    granted: boolean
): Promise<void> {
    await prisma.permission.upsert({
        where: {
            userId_resource_action: {
                userId,
                resource,
                action,
            },
        },
        update: { granted },
        create: {
            userId,
            resource,
            action,
            granted,
        },
    });

    await auditCrud("UPDATE", "permissions", userId, { resource, action, granted });
}

/**
 * Eliminar override de permiso (volver al permiso base del rol)
 */
export async function removeUserPermissionOverride(
    userId: string,
    resource: Resource,
    action: Action
): Promise<void> {
    await prisma.permission.deleteMany({
        where: {
            userId,
            resource,
            action,
        },
    });

    await auditCrud("DELETE", "permissions", userId, { resource, action });
}
