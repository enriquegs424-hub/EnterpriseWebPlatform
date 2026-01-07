'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
    const session = await auth();
    if (!session?.user?.id) return null;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [monthEntries, user] = await Promise.all([
        prisma.timeEntry.findMany({
            where: {
                userId: session.user.id,
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            include: {
                project: {
                    select: {
                        code: true,
                        name: true,
                    }
                }
            }
        }),
        prisma.user.findUnique({
            where: { id: session.user.id }
        })
    ]);

    const monthHours = monthEntries.reduce((acc: number, e: { hours: number }) => acc + e.hours, 0);

    // Calculate project breakdown
    const breakdownMap = monthEntries.reduce((acc: Record<string, { code: string; name: string; hours: number }>, e: any) => {
        const key = e.projectId;
        if (!acc[key]) {
            acc[key] = {
                code: e.project.code,
                name: e.project.name,
                hours: 0,
            };
        }
        acc[key].hours += e.hours;
        return acc;
    }, {});

    const projectBreakdown = Object.values(breakdownMap).sort((a: any, b: any) => b.hours - a.hours);

    // Example Target: Weekdays * dailyHours
    // Simplified: 20 days * dailyWorkHours
    const targetHours = (user?.dailyWorkHours || 8) * 20;

    return {
        monthHours,
        targetHours,
        diff: Math.round((monthHours - targetHours) * 10) / 10,
        recentEntries: monthEntries.slice(-5).reverse(), // Last 5 entries
        projectBreakdown: projectBreakdown.map((p: any, index) => ({
            ...p,
            projectId: Object.keys(breakdownMap)[index],
            entries: monthEntries.filter((e: any) => e.project.code === p.code).length
        })),
    };
}

// Obtener tareas pendientes del usuario
export async function getMyPendingTasks() {
    const session = await auth();
    if (!session?.user?.id) return [];

    try {
        const tasks = await prisma.task.findMany({
            where: {
                assignedToId: session.user.id,
                status: {
                    in: ['PENDING', 'IN_PROGRESS']
                }
            },
            include: {
                project: {
                    select: {
                        code: true,
                        name: true
                    }
                }
            },
            orderBy: [
                { priority: 'desc' },
                { dueDate: 'asc' }
            ],
            take: 5
        });

        return tasks;
    } catch (error) {
        console.error('Error fetching pending tasks:', error);
        return [];
    }
}
