import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');

        if (!query || query.trim().length < 2) {
            return NextResponse.json({ results: [] });
        }

        const searchTerm = query.trim().toLowerCase();

        // Search in parallel
        const [tasks, projects, documents, clients, users] = await Promise.all([
            // Search tasks
            prisma.task.findMany({
                where: {
                    OR: [
                        { title: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    title: true,
                    status: true,
                    priority: true,
                    project: {
                        select: {
                            code: true,
                            name: true,
                        },
                    },
                },
                take: 5,
            }),

            // Search projects
            prisma.project.findMany({
                where: {
                    OR: [
                        { code: { contains: searchTerm, mode: 'insensitive' } },
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    code: true,
                    name: true,
                    client: {
                        select: {
                            name: true,
                        },
                    },
                },
                take: 5,
            }),

            // Search documents
            prisma.document.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { description: { contains: searchTerm, mode: 'insensitive' } },
                        { fileName: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    fileType: true,
                    project: {
                        select: {
                            code: true,
                        },
                    },
                },
                take: 5,
            }),

            // Search clients
            prisma.client.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { company: { contains: searchTerm, mode: 'insensitive' } },
                        { email: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                },
                select: {
                    id: true,
                    name: true,
                    company: true,
                    email: true,
                },
                take: 5,
            }),

            // Search users
            prisma.user.findMany({
                where: {
                    OR: [
                        { name: { contains: searchTerm, mode: 'insensitive' } },
                        { email: { contains: searchTerm, mode: 'insensitive' } },
                    ],
                    isActive: true,
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    department: true,
                },
                take: 5,
            }),
        ]);

        // Format results
        const results = [
            ...tasks.map(task => ({
                id: task.id,
                type: 'task' as const,
                title: task.title,
                subtitle: task.project ? `${task.project.code} - ${task.status}` : task.status,
                url: `/tasks/${task.id}`,
            })),
            ...projects.map(project => ({
                id: project.id,
                type: 'project' as const,
                title: `${project.code} - ${project.name}`,
                subtitle: project.client?.name,
                url: `/projects/${project.id}`,
            })),
            ...documents.map(doc => ({
                id: doc.id,
                type: 'document' as const,
                title: doc.name,
                subtitle: doc.project ? `Proyecto: ${doc.project.code}` : 'Sin proyecto',
                url: `/documents?id=${doc.id}`,
            })),
            ...clients.map(client => ({
                id: client.id,
                type: 'client' as const,
                title: client.name,
                subtitle: client.company || client.email || '',
                url: `/clients/${client.id}`,
            })),
            ...users.map(user => ({
                id: user.id,
                type: 'user' as const,
                title: user.name,
                subtitle: `${user.role} - ${user.department}`,
                url: `/admin/users/${user.id}`,
            })),
        ];

        return NextResponse.json({ results });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ error: 'Search failed', results: [] }, { status: 500 });
    }
}
