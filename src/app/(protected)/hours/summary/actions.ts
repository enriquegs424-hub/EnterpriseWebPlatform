'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function getUserSummary(year: number) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const entries = await prisma.timeEntry.findMany({
        where: {
            userId: session.user.id,
            date: {
                gte: new Date(year, 0, 1),
                lte: new Date(year, 11, 31, 23, 59, 59),
            },
        },
        include: {
            project: true,
        },
        orderBy: { date: 'asc' },
    });

    // Pivot by month and project
    const projectMonths: Record<string, Record<number, number>> = {};
    const monthlyTotals: Record<number, number> = {};
    const projectTotals: Record<string, number> = {};

    entries.forEach(e => {
        const month = new Date(e.date).getMonth(); // 0-11
        const projectKey = `${e.project.code} · ${e.project.name}`;

        if (!projectMonths[projectKey]) projectMonths[projectKey] = {};
        projectMonths[projectKey][month] = (projectMonths[projectKey][month] || 0) + e.hours;

        monthlyTotals[month] = (monthlyTotals[month] || 0) + e.hours;
        projectTotals[projectKey] = (projectTotals[projectKey] || 0) + e.hours;
    });

    return {
        projectMonths,
        monthlyTotals,
        projectTotals,
        year
    };
}
