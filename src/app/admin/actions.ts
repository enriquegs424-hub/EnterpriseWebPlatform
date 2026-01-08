'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAllProjects() {
    return await prisma.project.findMany({
        orderBy: { year: 'desc' },
        include: {
            client: {
                select: {
                    name: true
                }
            }
        }
    });
}

export async function toggleProjectStatus(id: string) {
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return;

    await prisma.project.update({
        where: { id },
        data: { isActive: !project.isActive }
    });
    revalidatePath('/admin/projects');
}

import { hash } from 'bcryptjs';

import { auth } from "@/auth";
import { logActivity } from "@/lib/logger";

export async function getUsers(params?: {
    search?: string;
    role?: string;
    department?: string;
    status?: string;
    page?: number;
    limit?: number;
}) {
    const session = await auth();
    // @ts-ignore
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user?.role)) {
        throw new Error('Unauthorized');
    }

    const {
        search = '',
        role,
        department,
        status,
        page = 1,
        limit = 50
    } = params || {};

    const where: any = {};

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

// Deprecated: use getUsers instead
export async function getAllUsers() {
    const session = await auth();
    // @ts-ignore
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user?.role)) return [];

    const result = await getUsers();
    return result.users;
}

export async function updateUser(id: string, data: any) {
    const session = await auth();
    // @ts-ignore
    const currentUserRole = session?.user?.role;
    if (!currentUserRole || !['ADMIN', 'MANAGER'].includes(currentUserRole)) {
        throw new Error('Unauthorized');
    }

    // MANAGER restrictions
    if (currentUserRole === 'MANAGER') {
        const targetUser = await prisma.user.findUnique({ where: { id }, select: { role: true } });
        if (targetUser?.role === 'ADMIN' || targetUser?.role === 'MANAGER') {
            throw new Error('Managers cannot edit Admin or Manager accounts');
        }
        if (['ADMIN', 'MANAGER'].includes(data.role)) {
            throw new Error('Managers cannot promote users to Admin or Manager');
        }
    }

    if (data.email) {
        // Check uniqueness if email is changing
        const existing = await prisma.user.findFirst({
            where: {
                email: data.email,
                NOT: { id }
            }
        });
        if (existing) throw new Error('Email ya está en uso');
    }

    await prisma.user.update({
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

    // @ts-ignore
    logActivity(session.user.id, 'USER_UPDATE', id, { ...data });

    revalidatePath('/admin/users');
}

export async function inviteUser(data: {
    name: string;
    email: string;
    role: string;
    department: string;
}) {
    const session = await auth();
    // @ts-ignore
    const currentUserRole = session?.user?.role;
    if (!currentUserRole || !['ADMIN', 'MANAGER'].includes(currentUserRole)) {
        throw new Error('Unauthorized');
    }

    // MANAGER restrictions
    if (currentUserRole === 'MANAGER') {
        if (['ADMIN', 'MANAGER'].includes(data.role)) {
            throw new Error('Managers cannot invite Admins or Managers');
        }
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
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
            dailyWorkHours: 8.0
        }
    });

    // @ts-ignore
    logActivity(session.user.id, 'USER_INVITE', newUser.id, { email: data.email, role: data.role });

    revalidatePath('/admin/users');
}

export async function getActivityLogs(limit = 50) {
    const session = await auth();
    // @ts-ignore
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user?.role)) return [];

    return await prisma.activityLog.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { name: true, email: true, role: true }
            }
        }
    });
}

export async function createProject(data: any) {
    await prisma.project.create({
        data: {
            code: data.code,
            name: data.name,
            year: parseInt(data.year),
            department: data.department,
            isActive: true,
            clientId: data.clientId || null,
        }
    });
    revalidatePath('/admin/projects');
}

export async function updateProject(id: string, data: any) {
    await prisma.project.update({
        where: { id },
        data: {
            code: data.code,
            name: data.name,
            year: parseInt(data.year),
            department: data.department,
            isActive: data.isActive,
            clientId: data.clientId || null,
        }
    });
    revalidatePath('/admin/projects');
}
