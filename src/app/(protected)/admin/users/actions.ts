'use server';

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { checkPermission, auditCrud } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { hash } from 'bcryptjs';

export async function getUsers(params?: {
    search?: string;
    role?: string;
    department?: string;
    status?: string;
    page?: number;
    limit?: number;
}) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("users", "read");

    const {
        search = '',
        role,
        department,
        status,
        page = 1,
        limit = 50
    } = params || {};

    const where: any = {
        companyId: user.companyId as string,
    };

    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
        ];
    }

    if (role && role !== 'ALL') where.role = role;
    if (department && department !== 'ALL') where.department = department;
    if (status && status !== 'ALL') where.isActive = status === 'ACTIVE';

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                department: true,
                dailyWorkHours: true,
                createdAt: true,
            },
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ where })
    ]);

    return { users, total, pages: Math.ceil(total / limit) };
}

export async function updateUser(id: string, data: any) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("users", "update");

    // Get existing user for validation
    const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true, companyId: true }
    });

    if (!targetUser) throw new Error("Usuario no encontrado");
    if (targetUser.companyId !== user.companyId) throw new Error("Usuario no pertenece a tu empresa");

    // MANAGER restrictions
    if (user.role === 'MANAGER') {
        if (['ADMIN', 'MANAGER'].includes(targetUser.role)) {
            throw new Error('Managers no pueden editar Admin o Manager');
        }
        if (['ADMIN', 'MANAGER'].includes(data.role)) {
            throw new Error('Managers no pueden promover a Admin o Manager');
        }
    }

    if (data.email) {
        const existing = await prisma.user.findFirst({
            where: {
                email: data.email,
                NOT: { id },
                companyId: user.companyId as string
            }
        });
        if (existing) throw new Error('Email ya está en uso');
    }

    const updated = await prisma.user.update({
        where: { id },
        data: {
            name: data.name,
            email: data.email,
            role: data.role,
            department: data.department,
            isActive: data.isActive,
            dailyWorkHours: typeof data.dailyWorkHours === 'string'
                ? parseFloat(data.dailyWorkHours)
                : data.dailyWorkHours || 8.0,
        }
    });

    await auditCrud('UPDATE', 'User', id, { before: targetUser, after: updated });
    revalidatePath('/admin/users');

    return updated;
}

export async function inviteUser(data: {
    name: string;
    email: string;
    role: string;
    department: string;
}) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("users", "create");

    // MANAGER restrictions
    if (user.role === 'MANAGER') {
        if (['ADMIN', 'MANAGER'].includes(data.role)) {
            throw new Error('Managers no pueden invitar Admins o Managers');
        }
    }

    const existing = await prisma.user.findFirst({
        where: {
            email: data.email,
            companyId: user.companyId as string
        }
    });
    if (existing) throw new Error('Usuario ya existe');

    const hashedPassword = await hash('Mep1234!', 10); // Default password

    const newUser = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            role: data.role as any,
            department: data.department as any,
            passwordHash: hashedPassword,
            isActive: true,
            dailyWorkHours: 8.0,
            companyId: user.companyId as string,
        }
    });

    await auditCrud('CREATE', 'User', newUser.id, newUser);
    revalidatePath('/admin/users');

    return newUser;
}

export async function deleteUser(id: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("users", "delete");

    const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { role: true, companyId: true, email: true }
    });

    if (!targetUser) throw new Error("Usuario no encontrado");
    if (targetUser.companyId !== user.companyId) throw new Error("Usuario no pertenece a tu empresa");

    // Cannot delete own account
    if (id === user.id) throw new Error("No puedes eliminar tu propia cuenta");

    // Only ADMIN can delete other users
    if (user.role !== 'ADMIN') {
        throw new Error("Solo ADMIN puede eliminar usuarios");
    }

    await prisma.user.delete({ where: { id } });
    await auditCrud('DELETE', 'User', id, { email: targetUser.email });
    revalidatePath('/admin/users');

    return { success: true };
}
