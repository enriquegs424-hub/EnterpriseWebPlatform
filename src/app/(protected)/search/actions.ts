'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function globalSearch(query: string) {
    const session = await auth();
    if (!session) return { error: 'No autorizado' };

    if (!query || query.length < 2) return { results: [] };

    const [projects, tasks, documents] = await Promise.all([
        prisma.project.findMany({
            where: {
                OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { code: { contains: query, mode: 'insensitive' } },
                ],
            },
            take: 5,
        }),
        prisma.task.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { description: { contains: query, mode: 'insensitive' } },
                ]
            },
            take: 5,
            include: { project: true }
        }),
        prisma.document.findMany({
            where: {
                name: { contains: query, mode: 'insensitive' }
            },
            take: 5,
            include: { project: true }
        })
    ]);

    return {
        results: [
            ...projects.map((p: any) => ({ id: p.id, type: 'PROYECTO', title: p.name, subtitle: p.code, link: `/projects/${p.id}` })),
            ...tasks.map((t: any) => ({ id: t.id, type: 'TAREA', title: t.title, subtitle: t.project.name, link: `/projects/${t.projectId}/tasks` })),
            ...documents.map((d: any) => ({ id: d.id, type: 'DOCUMENTO', title: d.name, subtitle: d.project?.name || 'General', link: d.project ? `/projects/${d.projectId}/documents` : '/documents' })),
        ]
    };
}
