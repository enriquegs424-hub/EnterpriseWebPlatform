"use client";

import { ReactNode } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import type { Role } from "@prisma/client";

type Resource =
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

type Action = "create" | "read" | "update" | "delete" | "approve" | "export";

interface PermissionGuardProps {
    children: ReactNode;
    resource?: Resource;
    action?: Action;
    requiredRole?: Role;
    fallback?: ReactNode;
    showMessage?: boolean;
}

/**
 * Componente wrapper para mostrar/ocultar contenido según permisos
 * 
 * @example
 * <PermissionGuard resource="expenses" action="approve">
 *   <ApproveButton />
 * </PermissionGuard>
 * 
 * @example
 * <PermissionGuard requiredRole="ADMIN" fallback={<UpgradePrompt />}>
 *   <AdminPanel />
 * </PermissionGuard>
 */
export function PermissionGuard({
    children,
    resource,
    action,
    requiredRole,
    fallback = null,
    showMessage = false,
}: PermissionGuardProps) {
    const { can, hasMinimumRole, loading } = usePermissions();

    // Mostrar nada mientras carga
    if (loading) {
        return null;
    }

    // Verificar por recurso+acción
    if (resource && action) {
        if (!can(resource, action)) {
            if (showMessage) {
                return (
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                        No tienes permisos para esta acción
                    </div>
                );
            }
            return <>{fallback}</>;
        }
    }

    // Verificar por rol mínimo
    if (requiredRole) {
        if (!hasMinimumRole(requiredRole)) {
            if (showMessage) {
                return (
                    <div className="text-sm text-neutral-500 dark:text-neutral-400 p-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                        Acceso restringido
                    </div>
                );
            }
            return <>{fallback}</>;
        }
    }

    return <>{children}</>;
}

/**
 * Componente para mostrar contenido solo a admins (ADMIN o SUPERADMIN)
 */
export function AdminOnly({
    children,
    fallback = null,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) {
    return (
        <PermissionGuard requiredRole="ADMIN" fallback={fallback}>
            {children}
        </PermissionGuard>
    );
}

/**
 * Componente para mostrar contenido solo a SUPERADMIN
 */
export function SuperAdminOnly({
    children,
    fallback = null,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) {
    const { isSuperAdmin, loading } = usePermissions();

    if (loading) return null;
    if (!isSuperAdmin) return <>{fallback}</>;

    return <>{children}</>;
}

/**
 * Componente para mostrar contenido a managers+ (MANAGER, ADMIN, SUPERADMIN)
 */
export function ManagerOnly({
    children,
    fallback = null,
}: {
    children: ReactNode;
    fallback?: ReactNode;
}) {
    return (
        <PermissionGuard requiredRole="MANAGER" fallback={fallback}>
            {children}
        </PermissionGuard>
    );
}

export default PermissionGuard;
