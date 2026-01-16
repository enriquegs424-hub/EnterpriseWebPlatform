'use server';

import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helpers';

/**
 * Get dashboard data for the home page
 */
export async function getDashboardData() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('No autenticado');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);

    // Get tasks for today
    const tasksToday = await prisma.task.findMany({
        where: {
            assignedToId: user.id,
            status: { not: 'COMPLETED' },
            dueDate: {
                gte: today,
                lt: tomorrow
            }
        },
        include: {
            project: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            }
        },
        orderBy: { priority: 'desc' },
        take: 10
    });

    // Get upcoming events this week
    const upcomingEvents = await prisma.event.findMany({
        where: {
            OR: [
                { userId: user.id },
                { attendees: { some: { userId: user.id } } }
            ],
            startDate: {
                gte: today,
                lte: weekFromNow
            }
        },
        orderBy: { startDate: 'asc' },
        take: 5
    });

    // Get recent notifications
    const notifications = await prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    // Get stats
    const [
        totalTasksToday,
        activeProjects,
        eventsThisWeek
    ] = await Promise.all([
        prisma.task.count({
            where: {
                assignedToId: user.id,
                status: { not: 'COMPLETED' },
                dueDate: {
                    gte: today,
                    lt: tomorrow
                }
            }
        }),
        prisma.project.count({
            where: {
                companyId: user.companyId as string,
                isActive: true
            }
        }),
        prisma.event.count({
            where: {
                OR: [
                    { userId: user.id },
                    { attendees: { some: { userId: user.id } } }
                ],
                startDate: {
                    gte: today,
                    lte: weekFromNow
                }
            }
        })
    ]);

    return {
        tasks: tasksToday,
        events: upcomingEvents,
        notifications,
        stats: {
            tasksToday: totalTasksToday,
            activeProjects,
            eventsThisWeek
        }
    };
}

/**
 * Get quick stats for dashboard cards
 */
export async function getDashboardStats() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error('No autenticado');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [myTasksCount, projectsCount, pendingDocsCount, unreadNotificationsCount] = await Promise.all([
        prisma.task.count({
            where: {
                assignedToId: user.id,
                status: { not: 'COMPLETED' }
            }
        }),
        prisma.project.count({
            where: {
                companyId: user.companyId as string,
                isActive: true
            }
        }),
        prisma.document.count({
            where: {
                uploadedById: user.id,
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                }
            }
        }),
        prisma.notification.count({
            where: {
                userId: user.id,
                isRead: false
            }
        })
    ]);

    return {
        myTasks: myTasksCount,
        projects: projectsCount,
        recentDocs: pendingDocsCount,
        unreadNotifications: unreadNotificationsCount
    };
}
