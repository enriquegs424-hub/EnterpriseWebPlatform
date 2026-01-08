'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { subDays, startOfMonth } from 'date-fns';

/**
 * Get general KPIs for the dashboard
 * Simplified version using only existing schema fields
 */
export async function getGeneralKPIs(dateRange?: { start: Date; end: Date }) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true }
    });

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
        throw new Error('Acceso denegado - Solo ADMIN y MANAGER');
    }

    // Default to last 30 days
    const end = dateRange?.end || new Date();
    const start = dateRange?.start || subDays(end, 30);

    // Active projects
    const activeProjects = await prisma.project.count({
        where: {
            isActive: true
        }
    });

    // Completed tasks (in date range)
    const completedTasks = await prisma.task.count({
        where: {
            status: 'COMPLETED',
            completedAt: {
                gte: start,
                lte: end
            }
        }
    });

    // Total tasks
    const totalTasks = await prisma.task.count();

    // Total hours (in date range)
    const totalHoursResult = await prisma.timeEntry.aggregate({
        where: {
            date: {
                gte: start,
                lte: end
            }
        },
        _sum: {
            hours: true
        }
    });

    const totalHours = totalHoursResult._sum?.hours || 0;

    // Active users (users with time entries in last 7 days)
    const activeUsers = await prisma.user.count({
        where: {
            timeEntries: {
                some: {
                    date: {
                        gte: subDays(new Date(), 7)
                    }
                }
            }
        }
    });

    // Calculate trends (compare with previous period)
    const periodLength = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const prevStart = subDays(start, periodLength);
    const prevEnd = start;

    const prevCompletedTasks = await prisma.task.count({
        where: {
            status: 'COMPLETED',
            completedAt: {
                gte: prevStart,
                lte: prevEnd
            }
        }
    });

    const tasksTrend = prevCompletedTasks > 0
        ? ((completedTasks - prevCompletedTasks) / prevCompletedTasks) * 100
        : 0;

    return {
        activeProjects,
        completedTasks,
        totalTasks,
        taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        totalHours,
        activeUsers,
        trends: {
            tasks: tasksTrend
        },
        dateRange: { start, end }
    };
}

/**
 * Get project analytics
 * Simplified to use existing schema fields
 */
export async function getProjectAnalytics(projectId?: string, dateRange?: { start: Date; end: Date }) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true }
    });

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
        throw new Error('Acceso denegado');
    }

    const end = dateRange?.end || new Date();
    const start = dateRange?.start || subDays(end, 90);

    // If specific project
    if (projectId) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: {
                tasks: true,
                timeEntries: true
            }
        });

        if (!project) throw new Error('Proyecto no encontrado');

        const totalTasks = project.tasks.length;
        const completedTasks = project.tasks.filter((t: any) => t.status === 'COMPLETED').length;
        const totalHours = project.timeEntries.reduce((sum: number, entry: any) => sum + entry.hours, 0);

        return {
            project: {
                id: project.id,
                name: project.name,
                code: project.code,
                totalTasks,
                completedTasks,
                totalHours,
                tasksByStatus: {
                    PENDING: project.tasks.filter((t: any) => t.status === 'PENDING').length,
                    IN_PROGRESS: project.tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
                    COMPLETED: completedTasks,
                    CANCELLED: project.tasks.filter((t: any) => t.status === 'CANCELLED').length
                }
            }
        };
    }

    // All projects summary
    const projects = await prisma.project.findMany({
        where: {
            isActive: true
        },
        include: {
            _count: {
                select: {
                    tasks: true,
                    timeEntries: true
                }
            }
        },
        take: 10
    });

    return {
        projects: projects.map((p: any) => ({
            id: p.id,
            name: p.name,
            code: p.code,
            taskCount: p._count.tasks,
            timeEntryCount: p._count.timeEntries
        })),
        summary: {
            total: await prisma.project.count(),
            active: await prisma.project.count({ where: { isActive: true } }),
            inactive: await prisma.project.count({ where: { isActive: false } })
        }
    };
}

/**
 * Get resource (team) analytics
 */
export async function getResourceAnalytics(userId?: string, dateRange?: { start: Date; end: Date }) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true }
    });

    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
        throw new Error('Acceso denegado');
    }

    const end = dateRange?.end || new Date();
    const start = dateRange?.start || subDays(end, 30);

    // Get users with their time entries
    const users = await prisma.user.findMany({
        where: userId ? { id: userId } : {},
        include: {
            timeEntries: {
                where: {
                    date: {
                        gte: start,
                        lte: end
                    }
                }
            },
            assignedTasks: {
                where: {
                    completedAt: {
                        gte: start,
                        lte: end
                    }
                }
            }
        }
    });

    return users.map((u: any) => {
        const totalHours = u.timeEntries.reduce((sum: number, entry: any) => sum + entry.hours, 0);

        return {
            id: u.id,
            name: u.name,
            email: u.email,
            department: u.department,
            totalHours,
            completedTasks: u.assignedTasks.length,
            productivity: totalHours > 0 ? u.assignedTasks.length / (totalHours / 8) : 0 // tasks per day
        };
    });
}

/**
 * Get financial analytics (ADMIN only)
 * Simplified - basic hours tracking
 */
export async function getFinancialAnalytics(dateRange?: { start: Date; end: Date }) {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autorizado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
        throw new Error('Acceso denegado - Solo ADMIN');
    }

    const end = dateRange?.end || new Date();
    const start = dateRange?.start || startOfMonth(new Date());

    // Get hours by project
    const projects = await prisma.project.findMany({
        include: {
            timeEntries: {
                where: {
                    date: {
                        gte: start,
                        lte: end
                    }
                }
            }
        }
    });

    const financialData = projects.map((p: any) => {
        const totalHours = p.timeEntries.reduce((sum: number, e: any) => sum + e.hours, 0);
        // Assuming average rate of €50/hour
        const estimatedRevenue = totalHours * 50;

        return {
            projectId: p.id,
            projectName: p.name,
            totalHours,
            estimatedRevenue
        };
    });

    const totalRevenue = financialData.reduce((sum: number, p: any) => sum + p.estimatedRevenue, 0);

    return {
        totalRevenue,
        projects: financialData.filter((p: any) => p.totalHours > 0),
        dateRange: { start, end }
    };
}

/**
 * Get daily metrics for charts
 */
export async function getDailyMetrics(days: number = 30) {
    const session = await auth();
    if (!session?.user?.email) return [];

    const end = new Date();
    const start = subDays(end, days);

    // Get time entries grouped by day
    const entries = await prisma.timeEntry.findMany({
        where: {
            date: {
                gte: start,
                lte: end
            }
        },
        select: {
            date: true,
            hours: true
        }
    });

    // Get completed tasks by day
    const tasks = await prisma.task.findMany({
        where: {
            status: 'COMPLETED',
            completedAt: {
                gte: start,
                lte: end
            }
        },
        select: {
            completedAt: true
        }
    });

    // Group by date
    const dailyMap = new Map<string, { date: Date; hours: number; tasks: number }>();

    // Initialize all days
    for (let i = 0; i <= days; i++) {
        const date = subDays(end, days - i);
        const dateKey = date.toISOString().split('T')[0];
        dailyMap.set(dateKey, { date, hours: 0, tasks: 0 });
    }

    // Fill data
    entries.forEach((e: any) => {
        const dateKey = e.date.toISOString().split('T')[0];
        if (dailyMap.has(dateKey)) {
            const current = dailyMap.get(dateKey)!;
            current.hours += e.hours;
        }
    });

    tasks.forEach((t: any) => {
        if (t.completedAt) {
            const dateKey = t.completedAt.toISOString().split('T')[0];
            if (dailyMap.has(dateKey)) {
                const current = dailyMap.get(dateKey)!;
                current.tasks += 1;
            }
        }
    });

    return Array.from(dailyMap.values());
}
