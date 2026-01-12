'use server';

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function getAllClients() {
    const session = await auth();
    // @ts-ignore
    const userCompanyId = session?.user?.companyId;

    // Fallback: return all clients if no companyId (dev mode)
    const whereClause = userCompanyId ? { companyId: userCompanyId } : {};

    return await prisma.client.findMany({
        where: whereClause,
        include: {
            _count: {
                select: { projects: true }
            }
        },
        orderBy: { name: 'asc' }
    });
}

export async function createClient(data: any) {
    const session = await auth();
    await prisma.client.create({
        data: {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            companyName: data.company || data.companyName || null, // Use companyName (client's company name)
            address: data.address || null,
            isActive: true,
            // @ts-ignore
            companyId: session?.user?.companyId, // Tenant owner
        }
    });
    revalidatePath('/admin/clients');
}

export async function updateClient(id: string, data: any) {
    await prisma.client.update({
        where: { id },
        data: {
            name: data.name,
            email: data.email || null,
            phone: data.phone || null,
            companyName: data.company || data.companyName || null,
            address: data.address || null,
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
