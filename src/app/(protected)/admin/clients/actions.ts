'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAllClients() {
    return await prisma.client.findMany({
        include: {
            _count: {
                select: { projects: true }
            }
        },
        orderBy: { name: 'asc' }
    });
}

export async function createClient(data: any) {
    await prisma.client.create({
        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            address: data.address,
            isActive: true,
        }
    });
    revalidatePath('/admin/clients');
}

export async function updateClient(id: string, data: any) {
    await prisma.client.update({
        where: { id },
        data: {
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            address: data.address,
            isActive: data.isActive,
        }
    });
    revalidatePath('/admin/clients');
}

export async function toggleClientStatus(id: string) {
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) return;
    
    await prisma.client.update({
        where: { id },
        data: { isActive: !client.isActive }
    });
    revalidatePath('/admin/clients');
}
