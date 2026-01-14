"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { checkPermission, logActivity } from "@/lib/permissions";
import type { Department } from "@prisma/client";

/**
 * Obtener configuración de permisos de todos los departamentos
 */
export async function getAllDepartmentPermissions() {
    await checkPermission("settings", "read");

    const departments: Department[] = [
        "CIVIL_DESIGN" as any,
        "ELECTRICAL" as any,
        "INSTRUMENTATION" as any,
        "ADMINISTRATION" as any,
        "IT" as any,
        "ECONOMIC" as any,
        "MARKETING" as any,
        "OTHER" as any
    ];

    const departmentConfigs = await Promise.all(
        departments.map(async (dept) => {
            const permissions = await (prisma as any).departmentPermission.findMany({
                where: { department: dept },
                orderBy: { resource: "asc" },
            });

            return {
                department: dept,
                permissions,
            };
        })
    );

    return departmentConfigs;
}

/**
 * Obtener permisos de un departamento específico
 */
export async function getDepartmentPermissions(department: Department) {
    await checkPermission("settings", "read");

    const permissions = await (prisma as any).departmentPermission.findMany({
        where: { department },
        orderBy: [{ resource: "asc" }, { action: "asc" }],
    });

    return permissions;
}

/**
 * Actualizar permisos de un departamento
 */
export async function updateDepartmentPermissions(
    department: Department,
    permissions: Array<{
        resource: string;
        action: string;
        granted: boolean;
        scope?: string | null;
    }>
) {
    await checkPermission("settings", "update");

    const session = await auth();
    const userId = session!.user!.id as string;

    // Eliminar permisos existentes del departamento
    await (prisma as any).departmentPermission.deleteMany({
        where: { department },
    });

    // Crear nuevos permisos
    if (permissions.length > 0) {
        await (prisma as any).departmentPermission.createMany({
            data: permissions.map(p => ({
                department,
                resource: p.resource,
                action: p.action,
                granted: p.granted,
                scope: p.scope || null,
            })),
        });
    }

    await logActivity(
        userId,
        "UPDATE",
        "departmentPermissions",
        department,
        `Permisos de departamento actualizados: ${department} (${permissions.length} reglas)`
    );

    revalidatePath("/admin/departments");

    return { success: true, count: permissions.length };
}

/**
 * Obtener información detallada de un departamento (usuarios, permisos, etc.)
 */
export async function getDepartmentInfo(department: Department) {
    await checkPermission("settings", "read");

    const session = await auth();
    const companyId = (session?.user as any)?.companyId;

    const [users, permissions] = await Promise.all([
        // Usuarios del departamento
        prisma.user.findMany({
            where: {
                department,
                companyId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { name: "asc" },
        }),
        // Permisos configurados
        (prisma as any).departmentPermission.findMany({
            where: { department },
            orderBy: [{ resource: "asc" }, { action: "asc" }],
        }),
    ]);

    return {
        department,
        userCount: users.length,
        users,
        permissions,
    };
}

/**
 * Aplicar permisos del departamento a usuarios existentes
 * (Útil cuando se cambia la configuración y se quiere propagar)
 */
export async function applyDepartmentPermissionsToUsers(department: Department, overwriteExisting: boolean = false) {
    await checkPermission("permissions", "update");

    const session = await auth();
    const userId = session!.user!.id as string;
    const companyId = (session?.user as any)?.companyId;

    // Obtener usuarios del departamento
    const users = await prisma.user.findMany({
        where: {
            department,
            companyId,
            isActive: true,
        },
        select: { id: true },
    });

    if (!overwriteExisting) {
        // Solo aplicar a usuarios sin overrides
        // (Esta es la lógica predeterminada, los permisos de departamento se aplican automáticamente al asignar)
        await logActivity(
            userId,
            "INFO",
            "departmentPermissions",
            department,
            `Los permisos de departamento se aplican automáticamente. ${users.length} usuarios activos en ${department}.`
        );

        return { success: true, message: "Los permisos se aplicarán automáticamente", userCount: users.length };
    } else {
        // Borrar todos los overrides de estos usuarios (peligroso, requiere confirmación)
        let deletedCount = 0;
        for (const user of users) {
            const result = await (prisma as any).permission.deleteMany({
                where: { userId: user.id },
            });
            deletedCount += result.count || 0;
        }

        await logActivity(
            userId,
            "UPDATE",
            "departmentPermissions",
            department,
            `Permisos individuales eliminados para forzar uso de permisos de departamento: ${deletedCount} overrides eliminados`
        );

        revalidatePath("/admin/users");
        revalidatePath("/admin/departments");

        return { success: true, deletedOverrides: deletedCount, userCount: users.length };
    }
}
