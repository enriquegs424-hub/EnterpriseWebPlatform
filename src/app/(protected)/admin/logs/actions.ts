'use server';

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { checkPermission } from "@/lib/permissions";

export async function getActivityLogs(params?: {
    limit?: number;
    offset?: number;
    userId?: string;
    action?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
}) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("analytics", "read"); // Activity logs are analytics

    const {
        limit = 50,
        offset = 0,
        userId,
        action,
        entityId,
        startDate,
        endDate
    } = params || {};

    const where: any = {};

    // Filter by company users
    where.user = {
        companyId: user.companyId as string
    };

    if (userId) where.userId = userId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (entityId) where.entityId = entityId;

    if (startDate || endDate) {
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
            where,
            take: limit,
            skip: offset,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            }
        }),
        prisma.activityLog.count({ where })
    ]);

    return { logs, total, pages: Math.ceil(total / limit) };
}

export async function getActivityLogStats() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("analytics", "read");

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - 7);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayCount, weekCount, monthCount, totalCount] = await Promise.all([
        prisma.activityLog.count({
            where: {
                user: { companyId: user.companyId as string },
                createdAt: { gte: today }
            }
        }),
        prisma.activityLog.count({
            where: {
                user: { companyId: user.companyId as string },
                createdAt: { gte: thisWeek }
            }
        }),
        prisma.activityLog.count({
            where: {
                user: { companyId: user.companyId as string },
                createdAt: { gte: thisMonth }
            }
        }),
        prisma.activityLog.count({
            where: {
                user: { companyId: user.companyId as string }
            }
        })
    ]);

    // Get action type distribution
    const actionTypes = await prisma.activityLog.groupBy({
        by: ['action'],
        where: {
            user: { companyId: user.companyId as string }
        },
        _count: {
            action: true
        },
        orderBy: {
            _count: {
                action: 'desc'
            }
        },
        take: 10
    });

    // Get most active users
    const activeUsers = await prisma.activityLog.groupBy({
        by: ['userId'],
        where: {
            user: { companyId: user.companyId as string },
            createdAt: { gte: thisMonth }
        },
        _count: {
            userId: true
        },
        orderBy: {
            _count: {
                userId: 'desc'
            }
        },
        take: 5
    });

    // Get user details for active users
    const userIds = activeUsers.map(u => u.userId);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
    });

    const activeUsersWithDetails = activeUsers.map(au => ({
        ...au,
        user: users.find(u => u.id === au.userId)
    }));

    return {
        todayCount,
        weekCount,
        monthCount,
        totalCount,
        actionTypes,
        activeUsers: activeUsersWithDetails
    };
}

export async function getUserActivityTimeline(userId: string, limit: number = 20) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("analytics", "read");

    // Verify user belongs to same company
    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true }
    });

    if (!targetUser || targetUser.companyId !== user.companyId) {
        throw new Error("Usuario no encontrado");
    }

    return await prisma.activityLog.findMany({
        where: { userId },
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    role: true
                }
            }
        }
    });
}

export async function clearOldLogs(daysOld: number = 90) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    // Only ADMIN can clear logs
    if (user.role !== 'ADMIN') {
        throw new Error("Solo ADMIN puede eliminar logs");
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await prisma.activityLog.deleteMany({
        where: {
            user: { companyId: user.companyId as string },
            createdAt: { lt: cutoffDate }
        }
    });

    return { deleted: result.count };
}
