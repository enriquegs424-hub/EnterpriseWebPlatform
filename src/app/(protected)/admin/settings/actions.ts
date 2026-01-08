'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

// SYSTEM SETTINGS
export async function getSystemSettings() {
    const settings = await prisma.systemSetting.findMany();
    // Convert array to object
    return settings.reduce((acc: Record<string, any>, curr) => {
        acc[curr.key] = JSON.parse(curr.value);
        return acc;
    }, {} as Record<string, any>);
}

export async function updateSystemSetting(key: string, value: any) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') throw new Error('Unauthorized');

    await prisma.systemSetting.upsert({
        where: { key },
        update: { value: JSON.stringify(value) },
        create: { key, value: JSON.stringify(value) }
    });
    revalidatePath('/admin/settings');
}

// TEAMS
export async function getTeams() {
    return prisma.team.findMany({
        include: {
            _count: { select: { members: true } }
        }
    });
}

export async function createTeam(name: string, description?: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') throw new Error('Unauthorized');

    await prisma.team.create({
        data: { name, description }
    });
    revalidatePath('/admin/settings');
}

export async function deleteTeam(id: string) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') throw new Error('Unauthorized');

    await prisma.team.delete({ where: { id } });
    revalidatePath('/admin/settings');
}
