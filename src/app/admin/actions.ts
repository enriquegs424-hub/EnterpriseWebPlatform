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

export async function getAllUsers() {
    return await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            department: true,
            dailyWorkHours: true,
        }
    });
}

export async function updateUser(id: string, data: any) {
    await prisma.user.update({
        where: { id },
        data: {
            role: data.role,
            department: data.department,
            isActive: data.isActive,
            dailyWorkHours: parseFloat(data.dailyWorkHours) || 8.0,
        }
    });
    revalidatePath('/admin/users');
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
