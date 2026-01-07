'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function globalSearch(query: string) {
    const session = await auth();
    if (!session) return { error: 'No autorizado' };

    if (!query || query.length < 2) return { results: [] };

    const [projects, users, clients] = await Promise.all([
        prisma.project.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { code: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: 10,
        }),
        prisma.user.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { email: { contains: query, mode: 'insensitive' } },
                ],
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                department: true,
            },
            take: 10,
        }),
        prisma.client.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { company: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: 10,
        }),
    ]);

    return {
        results: [
            ...projects.map((p: any) => ({ id: p.id, type: 'PROYECTO', title: p.name, subtitle: p.code, link: `/admin/projects` })),
            ...users.map((u: any) => ({ id: u.id, type: 'USUARIO', title: u.name, subtitle: `${u.role} - ${u.department}`, link: `/admin/users` })),
            ...clients.map((c: any) => ({ id: c.id, type: 'CLIENTE', title: c.name, subtitle: c.company || '—', link: `/admin/clients` })),
        ]
    };
}
