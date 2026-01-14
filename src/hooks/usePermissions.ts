"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
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

// Role hierarchy for client-side checks
const ROLE_HIERARCHY: Record<Role, number> = {
    SUPERADMIN: 0,
    ADMIN: 1,
    MANAGER: 2,
    WORKER: 3,
    GUEST: 4,
};

// Simplified client-side permission check (base permissions only)
// For accurate checks including overrides, use server-side canDo()
const CLIENT_PERMISSIONS: Record<Role, Partial<Record<Resource, Action[]>>> = {
    SUPERADMIN: {
        users: ["create", "read", "update", "delete", "approve", "export"],
        companies: ["create", "read", "update", "delete", "approve", "export"],
        projects: ["create", "read", "update", "delete", "approve", "export"],
        clients: ["create", "read", "update", "delete", "approve", "export"],
        leads: ["create", "read", "update", "delete", "approve", "export"],
        tasks: ["create", "read", "update", "delete", "approve", "export"],
        timeentries: ["create", "read", "update", "delete", "approve", "export"],
        documents: ["create", "read", "update", "delete", "approve", "export"],
        expenses: ["create", "read", "update", "delete", "approve", "export"],
        invoices: ["create", "read", "update", "delete", "approve", "export"],
        quotes: ["create", "read", "update", "delete", "approve", "export"],
        settings: ["create", "read", "update", "delete", "approve", "export"],
        analytics: ["create", "read", "update", "delete", "approve", "export"],
        teams: ["create", "read", "update", "delete", "approve", "export"],
        permissions: ["create", "read", "update", "delete", "approve", "export"],
        audit: ["read", "export"],
    },
    ADMIN: {
        users: ["create", "read", "update", "delete", "approve", "export"],
        companies: ["read", "update"],
        projects: ["create", "read", "update", "delete", "approve", "export"],
        clients: ["create", "read", "update", "delete", "approve", "export"],
        leads: ["create", "read", "update", "delete", "approve", "export"],
        tasks: ["create", "read", "update", "delete", "approve", "export"],
        timeentries: ["create", "read", "update", "delete", "approve", "export"],
        documents: ["create", "read", "update", "delete", "approve", "export"],
        expenses: ["create", "read", "update", "delete", "approve", "export"],
        invoices: ["create", "read", "update", "delete", "approve", "export"],
        quotes: ["create", "read", "update", "delete", "approve", "export"],
        settings: ["create", "read", "update", "delete", "approve", "export"],
        analytics: ["create", "read", "update", "delete", "approve", "export"],
        teams: ["create", "read", "update", "delete", "approve", "export"],
        permissions: ["create", "read", "update", "delete"],
        audit: ["read", "export"],
    },
    MANAGER: {
        users: ["read"],
        projects: ["create", "read", "update", "approve"],
        clients: ["create", "read", "update", "approve"],
        leads: ["create", "read", "update", "delete", "approve"],
        tasks: ["create", "read", "update", "delete", "approve"],
        timeentries: ["create", "read", "update", "delete", "approve"],
        documents: ["create", "read", "update", "delete", "approve"],
        expenses: ["create", "read", "update", "delete", "approve"],
        invoices: ["read"],
        quotes: ["create", "read", "update", "approve"],
        settings: ["read", "update"],
        analytics: ["read"],
        teams: ["read"],
    },
    WORKER: {
        users: ["update"], // own only
        projects: ["read"],
        clients: ["read"],
        leads: ["create", "read", "update"],
        tasks: ["read", "update"],
        timeentries: ["create", "read", "update", "delete"],
        documents: ["create", "read", "update", "delete"],
        expenses: ["create", "read", "update", "delete"],
        settings: ["read", "update"],
        teams: ["read"],
    },
    GUEST: {
        users: ["update"], // own only
        projects: ["read"],
        tasks: ["read"],
        documents: ["read"],
        invoices: ["read"],
        quotes: ["read"],
        settings: ["read", "update"],
    },
};

interface UsePermissionsReturn {
    role: Role | null;
    loading: boolean;
    can: (resource: Resource, action: Action) => boolean;
    hasMinimumRole: (requiredRole: Role) => boolean;
    isSuperAdmin: boolean;
    isAdmin: boolean;
    isManager: boolean;
    isWorker: boolean;
    isGuest: boolean;
}

/**
 * Hook para verificar permisos en el cliente
 * NOTA: Para verificaciones precisas con overrides, usar server actions
 */
export function usePermissions(): UsePermissionsReturn {
    const { data: session, status } = useSession();
    const [role, setRole] = useState<Role | null>(null);

    useEffect(() => {
        if (session?.user?.role) {
            setRole(session.user.role as Role);
        }
    }, [session]);

    const loading = status === "loading";

    const can = (resource: Resource, action: Action): boolean => {
        if (!role) return false;

        const rolePerms = CLIENT_PERMISSIONS[role];
        if (!rolePerms) return false;

        const resourceActions = rolePerms[resource];
        if (!resourceActions) return false;

        return resourceActions.includes(action);
    };

    const hasMinimumRole = (requiredRole: Role): boolean => {
        if (!role) return false;
        return ROLE_HIERARCHY[role] <= ROLE_HIERARCHY[requiredRole];
    };

    return {
        role,
        loading,
        can,
        hasMinimumRole,
        isSuperAdmin: role === "SUPERADMIN",
        isAdmin: role === "ADMIN" || role === "SUPERADMIN",
        isManager: hasMinimumRole("MANAGER"),
        isWorker: hasMinimumRole("WORKER"),
        isGuest: role === "GUEST",
    };
}

export default usePermissions;
