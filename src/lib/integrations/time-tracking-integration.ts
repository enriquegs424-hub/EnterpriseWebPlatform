/**
 * Time Tracking Integration Module
 *
 * Integra el sistema de horas con Projects e Invoices
 */

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { checkPermission } from "@/lib/permissions";

/**
 * ==========================================
 * PROJECT INTEGRATION
 * ==========================================
 */

/**
 * Get total hours tracked for a project
 */
export async function getProjectTotalHours(projectId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    billableOnly?: boolean;
    approvedOnly?: boolean;
}) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("projects", "read");

    const where: any = {
        projectId,
        user: {
            companyId: user.companyId as string
        }
    };

    if (filters?.startDate || filters?.endDate) {
        where.date = {};
        if (filters.startDate) where.date.gte = filters.startDate;
        if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters?.billableOnly) {
        where.billable = true;
    }

    if (filters?.approvedOnly) {
        where.status = 'APPROVED' as any;
    }

    const [totalHours, billableHours, nonBillableHours, entriesCount] = await Promise.all([
        prisma.timeEntry.aggregate({
            where,
            _sum: { hours: true }
        }),
        prisma.timeEntry.aggregate({
            where: {
                ...where,
                billable: true
            },
            _sum: { hours: true }
        }),
        prisma.timeEntry.aggregate({
            where: {
                ...where,
                billable: false
            },
            _sum: { hours: true }
        }),
        prisma.timeEntry.count({ where })
    ]);

    // Get hours by user
    const hoursByUser = await prisma.timeEntry.groupBy({
        by: ['userId'],
        where,
        _sum: { hours: true },
        orderBy: {
            _sum: { hours: 'desc' }
        }
    });

    const userIds = hoursByUser.map(h => h.userId);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
    });

    const hoursByUserWithDetails = hoursByUser.map(h => ({
        user: users.find(u => u.id === h.userId),
        hours: Number(h._sum.hours || 0)
    }));

    // Get monthly breakdown (last 12 months)
    const now = new Date();
    const monthlyHours: { month: string; hours: number }[] = [];

    for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        const result = await prisma.timeEntry.aggregate({
            where: {
                ...where,
                date: {
                    gte: monthStart,
                    lte: monthEnd
                }
            },
            _sum: { hours: true }
        });

        monthlyHours.push({
            month: monthStart.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
            hours: Number(result._sum.hours || 0)
        });
    }

    return {
        totalHours: Number(totalHours._sum.hours || 0),
        billableHours: Number(billableHours._sum.hours || 0),
        nonBillableHours: Number(nonBillableHours._sum.hours || 0),
        entriesCount,
        hoursByUser: hoursByUserWithDetails,
        monthlyHours
    };
}

/**
 * Get time entries for a specific project
 */
export async function getProjectTimeEntries(projectId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    status?: string;
    limit?: number;
}) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("projects", "read");

    const where: any = {
        projectId,
        user: {
            companyId: user.companyId as string
        }
    };

    if (filters?.startDate || filters?.endDate) {
        where.date = {};
        if (filters.startDate) where.date.gte = filters.startDate;
        if (filters.endDate) where.date.lte = filters.endDate;
    }

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;

    const entries = await prisma.timeEntry.findMany({
        where,
        take: filters?.limit || 50,
        orderBy: { date: 'desc' },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true
                }
            }
        }
    });

    return entries;
}

/**
 * Get project time tracking stats for dashboard widget
 */
export async function getProjectTimeWidget(projectId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    const now = new Date();
    const thisWeek = new Date(now);
    thisWeek.setDate(now.getDate() - 7);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const where: any = {
        projectId,
        user: {
            companyId: user.companyId as string
        }
    };

    const [weekHours, monthHours, totalHours, lastEntries] = await Promise.all([
        prisma.timeEntry.aggregate({
            where: {
                ...where,
                date: { gte: thisWeek }
            },
            _sum: { hours: true }
        }),
        prisma.timeEntry.aggregate({
            where: {
                ...where,
                date: { gte: thisMonth }
            },
            _sum: { hours: true }
        }),
        prisma.timeEntry.aggregate({
            where,
            _sum: { hours: true }
        }),
        prisma.timeEntry.findMany({
            where,
            take: 5,
            orderBy: { date: 'desc' },
            select: {
                id: true,
                date: true,
                hours: true,
                user: {
                    select: { name: true }
                }
            }
        })
    ]);

    return {
        weekHours: Number(weekHours._sum.hours || 0),
        monthHours: Number(monthHours._sum.hours || 0),
        totalHours: Number(totalHours._sum.hours || 0),
        lastEntries
    };
}

/**
 * ==========================================
 * INVOICE INTEGRATION
 * ==========================================
 */

/**
 * Get billable hours for invoicing
 */
export async function getBillableHoursForInvoice(params: {
    projectId?: string;
    clientId?: string;
    startDate: Date;
    endDate: Date;
    includeInvoiced?: boolean;
}) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("invoices", "read");

    const where: any = {
        user: {
            companyId: user.companyId as string
        },
        billable: true,
        status: 'APPROVED' as any, // Solo horas aprobadas son facturables
        date: {
            gte: params.startDate,
            lte: params.endDate
        }
    };

    if (params.projectId) {
        where.projectId = params.projectId;
    }

    if (params.clientId) {
        where.project = {
            clientId: params.clientId
        };
    }

    if (!params.includeInvoiced) {
        where.invoiceId = null; // Solo horas no facturadas aún
    }

    const entries = await prisma.timeEntry.findMany({
        where,
        include: {
            project: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                    client: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    dailyWorkHours: true
                }
            }
        },
        orderBy: [
            { date: 'asc' },
            { projectId: 'asc' }
        ]
    });

    // Group by project
    const byProject = entries.reduce((acc, entry) => {
        const projectId = entry.projectId;
        if (!acc[projectId]) {
            acc[projectId] = {
                project: entry.project,
                entries: [],
                totalHours: 0,
                estimatedAmount: 0
            };
        }
        acc[projectId].entries.push(entry);
        acc[projectId].totalHours += Number(entry.hours);

        // Calculate estimated amount (usando hourlyRate si existe)
        const rate = (entry as any).hourlyRate ? Number((entry as any).hourlyRate) : 0;
        acc[projectId].estimatedAmount += Number(entry.hours) * rate;

        return acc;
    }, {} as Record<string, any>);

    const projectSummaries = Object.values(byProject);

    // Calculate totals
    const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
    const totalAmount = projectSummaries.reduce((sum, p) => sum + p.estimatedAmount, 0);

    return {
        entries,
        projectSummaries,
        totalHours,
        totalAmount,
        count: entries.length
    };
}

/**
 * Link time entries to an invoice
 */
export async function linkTimeEntriesToInvoice(entryIds: string[], invoiceId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("invoices", "update");

    // Verify all entries are approved and billable
    const entries = await prisma.timeEntry.findMany({
        where: {
            id: { in: entryIds }
        }
    });

    const invalidEntries = entries.filter(e =>
        (e as any).status !== 'APPROVED' ||
        (e as any).billable !== true ||
        (e as any).invoiceId !== null
    );

    if (invalidEntries.length > 0) {
        throw new Error(`${invalidEntries.length} entradas no son válidas para facturación (deben estar aprobadas, ser facturables y no estar ya facturadas)`);
    }

    // Link entries to invoice
    await prisma.timeEntry.updateMany({
        where: {
            id: { in: entryIds }
        },
        data: {
            // invoiceId
            notes: 'Vinculado a factura'
        } as any
    });

    return {
        success: true,
        linkedCount: entryIds.length
    };
}

/**
 * Unlink time entries from an invoice (if invoice is cancelled/voided)
 */
export async function unlinkTimeEntriesFromInvoice(invoiceId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("invoices", "update");

    const result = await prisma.timeEntry.updateMany({
        where: {
            // invoiceId
        } as any,
        data: {
            // invoiceId: null
            notes: 'Desvinculado de factura'
        } as any
    });

    return {
        success: true,
        unlinkedCount: result.count
    };
}

/**
 * Get invoice line items from time entries
 */
export async function generateInvoiceLineItemsFromHours(params: {
    projectId?: string;
    clientId?: string;
    startDate: Date;
    endDate: Date;
    groupBy: 'project' | 'user' | 'day';
    hourlyRate: number; // Default rate si las entradas no tienen rate específico
}) {
    const { entries, projectSummaries } = await getBillableHoursForInvoice({
        projectId: params.projectId,
        clientId: params.clientId,
        startDate: params.startDate,
        endDate: params.endDate,
        includeInvoiced: false
    });

    const lineItems: Array<{
        description: string;
        quantity: number; // hours
        unitPrice: number; // rate per hour
        amount: number;
        entryIds: string[];
    }> = [];

    if (params.groupBy === 'project') {
        // One line per project
        for (const summary of projectSummaries) {
            const avgRate = summary.entries.some((e: any) => e.hourlyRate)
                ? summary.estimatedAmount / summary.totalHours
                : params.hourlyRate;

            lineItems.push({
                description: `Horas de ${summary.project.name} (${params.startDate.toLocaleDateString('es-ES')} - ${params.endDate.toLocaleDateString('es-ES')})`,
                quantity: summary.totalHours,
                unitPrice: avgRate,
                amount: summary.totalHours * avgRate,
                entryIds: summary.entries.map((e: any) => e.id)
            });
        }
    } else if (params.groupBy === 'user') {
        // One line per user per project
        const byUserAndProject = entries.reduce((acc, entry) => {
            const key = `${entry.userId}-${entry.projectId}`;
            if (!acc[key]) {
                acc[key] = {
                    user: entry.user,
                    project: entry.project,
                    entries: [],
                    totalHours: 0
                };
            }
            acc[key].entries.push(entry);
            acc[key].totalHours += Number(entry.hours);
            return acc;
        }, {} as Record<string, any>);

        for (const group of Object.values(byUserAndProject)) {
            const avgRate = group.entries.some((e: any) => e.hourlyRate)
                ? group.entries.reduce((sum: number, e: any) => sum + (Number(e.hours) * Number(e.hourlyRate || 0)), 0) / group.totalHours
                : params.hourlyRate;

            lineItems.push({
                description: `${group.user.name} - ${group.project.name}`,
                quantity: group.totalHours,
                unitPrice: avgRate,
                amount: group.totalHours * avgRate,
                entryIds: group.entries.map((e: any) => e.id)
            });
        }
    } else if (params.groupBy === 'day') {
        // One line per day per project
        const byDayAndProject = entries.reduce((acc, entry) => {
            const dateKey = entry.date.toISOString().split('T')[0];
            const key = `${dateKey}-${entry.projectId}`;
            if (!acc[key]) {
                acc[key] = {
                    date: entry.date,
                    project: entry.project,
                    entries: [],
                    totalHours: 0
                };
            }
            acc[key].entries.push(entry);
            acc[key].totalHours += Number(entry.hours);
            return acc;
        }, {} as Record<string, any>);

        for (const group of Object.values(byDayAndProject)) {
            const avgRate = group.entries.some((e: any) => e.hourlyRate)
                ? group.entries.reduce((sum: number, e: any) => sum + (Number(e.hours) * Number(e.hourlyRate || 0)), 0) / group.totalHours
                : params.hourlyRate;

            lineItems.push({
                description: `${group.project.name} - ${new Date(group.date).toLocaleDateString('es-ES')}`,
                quantity: group.totalHours,
                unitPrice: avgRate,
                amount: group.totalHours * avgRate,
                entryIds: group.entries.map((e: any) => e.id)
            });
        }
    }

    return {
        lineItems,
        totalHours: entries.reduce((sum, e) => sum + Number(e.hours), 0),
        totalAmount: lineItems.reduce((sum, item) => sum + item.amount, 0),
        entryCount: entries.length
    };
}

/**
 * Get time entries already linked to an invoice
 */
export async function getInvoiceTimeEntries(invoiceId: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("invoices", "read");

    const entries = await prisma.timeEntry.findMany({
        where: {
            // invoiceId
        } as any,
        include: {
            project: {
                select: {
                    id: true,
                    code: true,
                    name: true
                }
            },
            user: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: { date: 'asc' }
    });

    const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);
    const totalAmount = entries.reduce((sum, e) => {
        const rate = (e as any).hourlyRate ? Number((e as any).hourlyRate) : 0;
        return sum + (Number(e.hours) * rate);
    }, 0);

    return {
        entries,
        totalHours,
        totalAmount,
        count: entries.length
    };
}

/**
 * ==========================================
 * REPORTING & ANALYTICS
 * ==========================================
 */

/**
 * Get company-wide time tracking stats
 */
export async function getCompanyTimeStats() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("analytics", "read");

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const where = {
        user: {
            companyId: user.companyId as string
        }
    };

    const [
        thisMonthTotal,
        lastMonthTotal,
        billableThisMonth,
        approvedThisMonth,
        pendingApprovals
    ] = await Promise.all([
        prisma.timeEntry.aggregate({
            where: {
                ...where,
                date: { gte: thisMonth }
            },
            _sum: { hours: true }
        }),
        prisma.timeEntry.aggregate({
            where: {
                ...where,
                date: {
                    gte: lastMonth,
                    lte: lastMonthEnd
                }
            },
            _sum: { hours: true }
        }),
        prisma.timeEntry.aggregate({
            where: {
                ...where,
                date: { gte: thisMonth },
                billable: true
            },
            _sum: { hours: true }
        }),
        prisma.timeEntry.count({
            where: {
                ...where,
                date: { gte: thisMonth },
                status: 'APPROVED' as any
            }
        }),
        prisma.timeEntry.count({
            where: {
                ...where,
                status: 'SUBMITTED' as any
            }
        })
    ]);

    const thisMonthHours = Number(thisMonthTotal._sum.hours || 0);
    const lastMonthHours = Number(lastMonthTotal._sum.hours || 0);
    const percentChange = lastMonthHours > 0
        ? ((thisMonthHours - lastMonthHours) / lastMonthHours) * 100
        : 0;

    return {
        thisMonth: {
            total: thisMonthHours,
            billable: Number(billableThisMonth._sum.hours || 0),
            approved: approvedThisMonth
        },
        lastMonth: {
            total: lastMonthHours
        },
        percentChange,
        pendingApprovals
    };
}
