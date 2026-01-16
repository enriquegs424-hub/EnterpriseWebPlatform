'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getAllUsersHours(filters?: {
    userId?: string;
    department?: string;
    projectId?: string;
    startDate?: string;
    endDate?: string;
}) {
    const session = await auth();
    // @ts-ignore
    const role = session?.user?.role;
    // @ts-ignore
    const companyId = session?.user?.companyId;

    console.log('[HOURS] getAllUsersHours called, role:', role, 'companyId:', companyId);

    if (!role || !['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(role as string)) {
        console.log('[HOURS] Unauthorized - role not allowed:', role);
        return { error: 'Unauthorized' };
    }

    // Build where clause
    const where: any = {};

    // Company filter - build user filter object
    const userFilter: any = {};
    if (companyId) {
        userFilter.companyId = companyId;
    }
    if (filters?.department) {
        userFilter.department = filters.department;
    }
    // Only add user filter if we have conditions
    if (Object.keys(userFilter).length > 0) {
        where.user = userFilter;
    }

    if (filters?.userId) {
        where.userId = filters.userId;
    }

    if (filters?.projectId) {
        where.projectId = filters.projectId;
    }

    if (filters?.startDate || filters?.endDate) {
        where.date = {};
        if (filters.startDate) {
            where.date.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
            where.date.lte = new Date(filters.endDate);
        }
    }

    console.log('[HOURS] Query where:', JSON.stringify(where));

    const entries = await prisma.timeEntry.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    department: true,
                    image: true,
                }
            },
            project: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                }
            }
        },
        orderBy: { date: 'desc' },
        take: 500, // Limit for performance
    });

    console.log('[HOURS] Found', entries.length, 'entries');

    return entries;
}

export async function getTeamStats(period: 'week' | 'month' | 'year' = 'month') {
    const session = await auth();
    // @ts-ignore
    const role = session?.user?.role;
    // @ts-ignore
    const companyId = session?.user?.companyId;

    if (!role || !['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(role as string)) {
        return { error: 'Unauthorized' };
    }

    const now = new Date();
    let startDate = new Date();

    if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
    } else {
        startDate.setFullYear(now.getFullYear() - 1);
    }

    // Build where clause with optional company filter
    const whereClause: any = {
        date: {
            gte: startDate,
            lte: now,
        }
    };

    if (companyId) {
        whereClause.user = { companyId };
    }

    const entries = await prisma.timeEntry.findMany({
        where: whereClause,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    department: true,
                }
            },
            project: {
                select: {
                    code: true,
                    name: true,
                }
            }
        }
    });

    // Calculate stats
    const totalHours = entries.reduce((sum: number, e: any) => sum + e.hours, 0);
    const avgHoursPerDay = totalHours / Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const userStats = entries.reduce((acc: any, e: any) => {
        if (!acc[e.userId]) {
            acc[e.userId] = {
                userId: e.userId,
                userName: e.user.name,
                department: e.user.department,
                totalHours: 0,
                entries: 0,
            };
        }
        acc[e.userId].totalHours += e.hours;
        acc[e.userId].entries += 1;
        return acc;
    }, {});

    const topUsers = Object.values(userStats)
        .sort((a: any, b: any) => b.totalHours - a.totalHours)
        .slice(0, 10);

    const projectStats = entries.reduce((acc: any, e: any) => {
        const key = e.project.code;
        if (!acc[key]) {
            acc[key] = {
                code: e.project.code,
                name: e.project.name,
                totalHours: 0,
                entries: 0,
            };
        }
        acc[key].totalHours += e.hours;
        acc[key].entries += 1;
        return acc;
    }, {});

    const topProjects = Object.values(projectStats)
        .sort((a: any, b: any) => b.totalHours - a.totalHours)
        .slice(0, 10);

    return {
        totalHours: Math.round(totalHours * 10) / 10,
        avgHoursPerDay: Math.round(avgHoursPerDay * 10) / 10,
        totalEntries: entries.length,
        topUsers,
        topProjects,
        period,
    };
}

export async function getAllUsers() {
    const session = await auth();
    // @ts-ignore
    const role = session?.user?.role;
    // @ts-ignore
    const companyId = session?.user?.companyId;

    if (!role || !['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(role as string)) {
        return [];
    }

    return await prisma.user.findMany({
        where: { isActive: true, companyId },
        select: {
            id: true,
            name: true,
            email: true,
            department: true,
            image: true,
        },
        orderBy: { name: 'asc' },
    });
}

export async function getProjects() {
    const session = await auth();
    // @ts-ignore
    const role = session?.user?.role;
    // @ts-ignore
    const companyId = session?.user?.companyId;

    console.log('[HOURS] getProjects called, role:', role, 'companyId:', companyId);

    if (!role || !['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(role as string)) {
        console.log('[HOURS] getProjects: Unauthorized');
        return [];
    }

    const projects = await prisma.project.findMany({
        where: companyId ? { companyId } : {},
        select: {
            id: true,
            code: true,
            name: true,
        },
        orderBy: { code: 'asc' },
    });

    console.log('[HOURS] getProjects found:', projects.length, 'projects');
    return projects;
}

export async function getDepartments() {
    const session = await auth();
    // @ts-ignore
    const role = session?.user?.role;
    // @ts-ignore
    const companyId = session?.user?.companyId;

    console.log('[HOURS] getDepartments called, role:', role, 'companyId:', companyId);

    if (!role || !['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(role as string)) {
        console.log('[HOURS] getDepartments: Unauthorized');
        return [];
    }

    // Get unique departments from users
    const users = await prisma.user.findMany({
        where: companyId ? { companyId, isActive: true } : { isActive: true },
        select: { department: true },
        distinct: ['department'],
    });

    const departments = users
        .map(u => u.department)
        .filter((d): d is NonNullable<typeof d> => d !== null)
        .sort() as string[];

    console.log('[HOURS] getDepartments found:', departments.length, 'departments:', departments);
    return departments;
}
