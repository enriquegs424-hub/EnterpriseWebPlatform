'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export async function getProjectDetails(projectId: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
            client: true,
            tasks: {
                include: {
                    assignedTo: {
                        select: { name: true }
                    }
                },
                orderBy: { dueDate: 'asc' },
                take: 5 // Last 5 tasks
            },
            documents: {
                orderBy: { createdAt: 'desc' },
                take: 5
            },
            events: {
                where: {
                    startDate: { gte: new Date() }
                },
                orderBy: { startDate: 'asc' },
                take: 3
            },
            _count: {
                select: {
                    tasks: true,
                    documents: true,
                    events: true
                }
            }
        }
    });

    if (!project) throw new Error('Project not found');

    // Calculate progress based on tasks
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(t => t.status === 'COMPLETED').length;
    const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return { ...project, progress };
}

export async function getProjectStats(projectId: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('Unauthorized');

    const totalHours = await prisma.timeEntry.aggregate({
        where: { projectId },
        _sum: { hours: true }
    });

    return {
        totalHours: totalHours._sum.hours || 0
    };
}

export async function getProjectTeam(projectId: string) {
    const session = await auth();
    if (!session?.user?.email) return [];

    const users = await prisma.user.findMany({
        where: {
            assignedTasks: {
                some: {
                    projectId: projectId
                }
            }
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true
        }
    });

    return users;
}
