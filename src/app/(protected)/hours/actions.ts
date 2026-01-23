'use server';

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { checkPermission, auditCrud } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
    validateCreateTimeEntry,
    validateUpdateTimeEntry,
    validateCanDelete,
    validateCanSubmit,
    validateCanApprove,
    calculateHoursFromTime
} from "@/lib/time-entry-validator";

/**
 * ==========================================
 * SCHEMAS & TYPES
 * ==========================================
 */

const TimeEntryCreateSchema = z.object({
    projectId: z.string().min(1, "Proyecto requerido"),
    date: z.string().or(z.date()),
    hours: z.number().min(0.1, "Mínimo 0.1 horas").max(24, "Máximo 24 horas"),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    notes: z.string().optional(),
    billable: z.boolean().optional(),
});

const TimeEntryUpdateSchema = z.object({
    projectId: z.string().optional(),
    date: z.string().or(z.date()).optional(),
    hours: z.number().min(0.1).max(24).optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    notes: z.string().optional(),
    billable: z.boolean().optional(),
});

export type TimeEntryFilters = {
    userId?: string;
    projectId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    billable?: boolean;
    page?: number;
    limit?: number;
};

/**
 * ==========================================
 * CRUD OPERATIONS
 * ==========================================
 */

/**
 * Get all time entries with filters and pagination
 */
export async function getTimeEntries(filters?: TimeEntryFilters) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "read");

    const {
        userId: filterUserId,
        projectId,
        startDate,
        endDate,
        status,
        billable,
        page = 1,
        limit = 50
    } = filters || {};

    const where: any = {};

    // Determine target userId
    const targetUserId = filterUserId || user.id;

    // RBAC: If fetching for another user
    if (targetUserId !== user.id) {
        // Must be at least MANAGER
        if (!['MANAGER', 'ADMIN', 'SUPERADMIN'].includes(user.role)) {
            throw new Error("No tienes permiso para ver horas de otros usuarios");
        }

        // TODO: Enforce Department check for Managers if strict strictness required.
        // For now, relying on accessible lists and role check.
    }

    where.userId = targetUserId;

    if (projectId) where.projectId = projectId;

    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
    }

    // Soporte para campos opcionales del schema mejorado
    if (status !== undefined) where.status = status;
    if (billable !== undefined) where.billable = billable;

    const [entries, total] = await Promise.all([
        prisma.timeEntry.findMany({
            where,
            take: limit,
            skip: (page - 1) * limit,
            orderBy: { date: 'desc' },
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
                        name: true,
                        email: true
                    }
                }
            }
        }),
        prisma.timeEntry.count({ where })
    ]);

    return {
        entries,
        total,
        pages: Math.ceil(total / limit),
        currentPage: page
    };
}

/**
 * Get single time entry by ID
 */
export async function getTimeEntryById(id: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "read");

    const entry = await prisma.timeEntry.findUnique({
        where: { id },
        include: {
            project: {
                select: {
                    id: true,
                    code: true,
                    name: true,
                    isActive: true
                }
            },
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true
                }
            }
        }
    });

    if (!entry) {
        throw new Error("Entrada no encontrada");
    }

    // RBAC: Solo el propietario o MANAGER/ADMIN pueden ver la entrada
    if (entry.userId !== user.id && !['MANAGER', 'ADMIN'].includes(user.role)) {
        throw new Error("No tienes permiso para ver esta entrada");
    }

    return entry;
}

/**
 * Create new time entry with comprehensive validation
 */
export async function createTimeEntry(data: z.infer<typeof TimeEntryCreateSchema>) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "create");

    // Validate input
    const validated = TimeEntryCreateSchema.parse(data);

    // Auto-calculate hours from startTime/endTime if provided
    let finalHours = validated.hours;
    if (validated.startTime && validated.endTime) {
        finalHours = calculateHoursFromTime(validated.startTime, validated.endTime);
    }

    // Comprehensive business validation
    const validation = await validateCreateTimeEntry({
        userId: user.id,
        projectId: validated.projectId,
        date: new Date(validated.date),
        startTime: validated.startTime,
        endTime: validated.endTime,
        hours: finalHours
    });

    if (!validation.valid) {
        throw new Error(validation.errors.join('; '));
    }

    // Create entry
    const entry = await prisma.timeEntry.create({
        data: {
            userId: user.id,
            projectId: validated.projectId,
            date: new Date(validated.date),
            hours: finalHours,
            notes: validated.notes || null,
            // Campos opcionales del schema mejorado (comentados si no existen)
            // startTime: validated.startTime || null,
            // endTime: validated.endTime || null,
            // billable: validated.billable ?? true,
            // status: 'DRAFT' as any,
        } as any // Use 'as any' para campos opcionales
    });

    await auditCrud('CREATE', 'TimeEntry', entry.id, entry);
    revalidatePath('/hours');
    revalidatePath('/hours/daily');
    revalidatePath('/dashboard');

    return {
        success: true,
        entry,
        warnings: validation.warnings
    };
}

/**
 * Update existing time entry
 */
export async function updateTimeEntry(id: string, data: z.infer<typeof TimeEntryUpdateSchema>) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "update");

    // Get existing entry
    const existingEntry = await prisma.timeEntry.findUnique({
        where: { id }
    });

    if (!existingEntry) {
        throw new Error("Entrada no encontrada");
    }

    // Validate input
    const validated = TimeEntryUpdateSchema.parse(data);

    // Merge with existing data
    const projectId = validated.projectId || existingEntry.projectId;
    const date = validated.date ? new Date(validated.date) : existingEntry.date;
    let hours = validated.hours || Number(existingEntry.hours);

    // Recalculate hours if times provided
    if (validated.startTime && validated.endTime) {
        hours = calculateHoursFromTime(validated.startTime, validated.endTime);
    }

    // Comprehensive validation
    const validation = await validateUpdateTimeEntry({
        entryId: id,
        userId: user.id,
        userRole: user.role,
        projectId,
        date,
        startTime: validated.startTime,
        endTime: validated.endTime,
        hours
    });

    if (!validation.valid) {
        throw new Error(validation.errors.join('; '));
    }

    // Update entry
    const updated = await prisma.timeEntry.update({
        where: { id },
        data: {
            ...(validated.projectId && { projectId: validated.projectId }),
            ...(validated.date && { date: new Date(validated.date) }),
            hours,
            ...(validated.notes !== undefined && { notes: validated.notes }),
            // Campos opcionales del schema mejorado (comentados si no existen)
            // ...(validated.startTime !== undefined && { startTime: validated.startTime }),
            // ...(validated.endTime !== undefined && { endTime: validated.endTime }),
            // ...(validated.billable !== undefined && { billable: validated.billable }),
        } as any
    });

    await auditCrud('UPDATE', 'TimeEntry', id, { before: existingEntry, after: updated });
    revalidatePath('/hours');
    revalidatePath('/hours/daily');
    revalidatePath('/dashboard');

    return {
        success: true,
        entry: updated,
        warnings: validation.warnings
    };
}

/**
 * Delete time entry
 */
export async function deleteTimeEntry(id: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "delete");

    // Validate can delete
    const validation = await validateCanDelete({
        entryId: id,
        userId: user.id,
        userRole: user.role
    });

    if (!validation.valid) {
        throw new Error(validation.error!);
    }

    const entry = await prisma.timeEntry.findUnique({ where: { id } });

    await prisma.timeEntry.delete({
        where: { id }
    });

    await auditCrud('DELETE', 'TimeEntry', id, { hours: entry?.hours, projectId: entry?.projectId });
    revalidatePath('/hours');
    revalidatePath('/hours/daily');
    revalidatePath('/dashboard');

    return { success: true, message: "Entrada eliminada correctamente" };
}

/**
 * ==========================================
 * APPROVAL WORKFLOW
 * ==========================================
 */

/**
 * Submit time entry for approval
 */
export async function submitTimeEntryForApproval(id: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "update");

    const validation = await validateCanSubmit({
        entryId: id,
        userId: user.id
    });

    if (!validation.valid) {
        throw new Error(validation.error!);
    }

    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) throw new Error('Entrada no encontrada');

    // Only allow submitting DRAFT entries
    if (entry.status !== 'DRAFT') {
        throw new Error('Solo se pueden enviar entradas en borrador');
    }

    const updated = await prisma.timeEntry.update({
        where: { id },
        data: {
            status: 'SUBMITTED',
            submittedAt: new Date()
        }
    });

    await auditCrud('UPDATE', 'TimeEntry', id, { action: 'submit_for_approval' });
    revalidatePath('/hours');
    revalidatePath('/hours/approvals');
    revalidatePath('/control-horas');
    revalidatePath('/control-horas/global');

    return { success: true, message: "Entrada enviada para aprobación", entry: updated };
}

/**
 * Approve time entry (MANAGER/ADMIN only)
 */
export async function approveTimeEntry(id: string, notes?: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "approve" as any);

    const validation = await validateCanApprove({
        entryId: id,
        approverRole: user.role,
        approverId: user.id
    });

    if (!validation.valid) {
        throw new Error(validation.error!);
    }

    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) throw new Error('Entrada no encontrada');

    // Only allow approving SUBMITTED entries
    if (entry.status !== 'SUBMITTED') {
        throw new Error('Solo se pueden aprobar entradas enviadas');
    }

    // Cannot approve own entries
    if (entry.userId === user.id) {
        throw new Error('No puedes aprobar tus propias entradas');
    }

    const updated = await prisma.timeEntry.update({
        where: { id },
        data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedById: user.id,
            notes: notes ? `${entry.notes || ''} [Aprobado: ${notes}]`.trim() : entry.notes
        }
    });

    await auditCrud('UPDATE', 'TimeEntry', id, {
        action: 'approve',
        approvedBy: user.id,
        notes
    });

    revalidatePath('/hours');
    revalidatePath('/hours/approvals');
    revalidatePath('/admin/hours');
    revalidatePath('/control-horas');
    revalidatePath('/control-horas/global');

    return { success: true, message: "Entrada aprobada correctamente", entry: updated };
}

/**
 * Reject time entry (MANAGER/ADMIN only)
 */
export async function rejectTimeEntry(id: string, reason: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "approve" as any);

    if (!reason || reason.trim().length === 0) {
        throw new Error("Debe proporcionar un motivo de rechazo");
    }

    const validation = await validateCanApprove({
        entryId: id,
        approverRole: user.role,
        approverId: user.id
    });

    if (!validation.valid) {
        throw new Error(validation.error!);
    }

    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) throw new Error('Entrada no encontrada');

    // Cannot reject own entries
    if (entry.userId === user.id) {
        throw new Error('No puedes rechazar tus propias entradas');
    }

    const updated = await prisma.timeEntry.update({
        where: { id },
        data: {
            status: 'REJECTED',
            rejectionReason: reason
        }
    });

    await auditCrud('UPDATE', 'TimeEntry', id, {
        action: 'reject',
        rejectedBy: user.id,
        reason
    });

    revalidatePath('/hours');
    revalidatePath('/hours/approvals');
    revalidatePath('/admin/hours');
    revalidatePath('/control-horas');
    revalidatePath('/control-horas/global');

    return { success: true, message: "Entrada rechazada", entry: updated };
}

/**
 * Bulk approve time entries
 */
export async function bulkApproveTimeEntries(ids: string[], notes?: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    if (!['MANAGER', 'ADMIN', 'SUPERADMIN'].includes(user.role)) {
        throw new Error("Solo managers y admins pueden aprobar horas");
    }

    const results = await Promise.allSettled(
        ids.map(id => approveTimeEntry(id, notes))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    revalidatePath('/hours');
    revalidatePath('/hours/approvals');
    revalidatePath('/control-horas');
    revalidatePath('/control-horas/global');

    return {
        success: true,
        message: `${succeeded} entradas aprobadas, ${failed} fallaron`,
        succeeded,
        failed
    };
}

/**
 * Bulk submit time entries for approval
 */
export async function bulkSubmitTimeEntries(ids: string[]) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "update");

    // Verify all entries belong to user and are in DRAFT status
    const entries = await prisma.timeEntry.findMany({
        where: {
            id: { in: ids },
            userId: user.id
        }
    });

    if (entries.length !== ids.length) {
        throw new Error('Algunas entradas no fueron encontradas o no te pertenecen');
    }

    const nonDraftEntries = entries.filter(e => e.status !== 'DRAFT');
    if (nonDraftEntries.length > 0) {
        throw new Error('Solo se pueden enviar entradas en estado borrador');
    }

    await prisma.timeEntry.updateMany({
        where: { id: { in: ids } },
        data: {
            status: 'SUBMITTED',
            submittedAt: new Date()
        }
    });

    await auditCrud('UPDATE', 'TimeEntry', ids.join(','), { action: 'bulk_submit_for_approval', count: ids.length });

    revalidatePath('/hours');
    revalidatePath('/hours/daily');
    revalidatePath('/hours/approvals');
    revalidatePath('/control-horas');
    revalidatePath('/control-horas/global');

    return { success: true, count: entries.length, message: `${entries.length} entradas enviadas para aprobación` };
}

/**
 * Bulk reject time entries
 */
export async function bulkRejectTimeEntries(ids: string[], reason: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    if (!['MANAGER', 'ADMIN', 'SUPERADMIN'].includes(user.role)) {
        throw new Error("Solo managers y admins pueden rechazar horas");
    }

    if (!reason?.trim()) {
        throw new Error("Se requiere un motivo de rechazo");
    }

    const results = await Promise.allSettled(
        ids.map(id => rejectTimeEntry(id, reason))
    );

    const succeeded = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    revalidatePath('/hours');
    revalidatePath('/hours/approvals');
    revalidatePath('/control-horas');
    revalidatePath('/control-horas/global');

    return {
        success: true,
        message: `${succeeded} entradas rechazadas, ${failed} fallaron`,
        succeeded,
        failed
    };
}

/**
 * ==========================================
 * QUERIES & REPORTS
 * ==========================================
 */

/**
 * Get daily entries for a specific date
 */
export async function getDailyEntries(date: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "read");

    const targetDate = new Date(date);
    const start = new Date(targetDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(targetDate);
    end.setHours(23, 59, 59, 999);

    return await prisma.timeEntry.findMany({
        where: {
            userId: user.id,
            date: {
                gte: start,
                lte: end
            }
        },
        include: {
            project: {
                select: {
                    id: true,
                    code: true,
                    name: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

/**
 * Get user time summary (daily, weekly, monthly, yearly)
 */
export async function getUserSummary(userId?: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "read");

    const targetUserId = userId || user.id;

    // RBAC: Solo propietario o MANAGER/ADMIN pueden ver resumen de otro usuario
    if (targetUserId !== user.id && !['MANAGER', 'ADMIN'].includes(user.role)) {
        throw new Error("No tienes permiso para ver el resumen de otro usuario");
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(today);
    thisWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    const [todayHours, weekHours, monthHours, yearHours] = await Promise.all([
        prisma.timeEntry.aggregate({
            where: {
                userId: targetUserId,
                date: { gte: today }
            },
            _sum: { hours: true }
        }),
        prisma.timeEntry.aggregate({
            where: {
                userId: targetUserId,
                date: { gte: thisWeek }
            },
            _sum: { hours: true }
        }),
        prisma.timeEntry.aggregate({
            where: {
                userId: targetUserId,
                date: { gte: thisMonth }
            },
            _sum: { hours: true }
        }),
        prisma.timeEntry.aggregate({
            where: {
                userId: targetUserId,
                date: { gte: thisYear }
            },
            _sum: { hours: true }
        })
    ]);

    // Get monthly breakdown for chart (last 12 months)
    const monthlyTotals: number[] = [];
    for (let i = 11; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

        const result = await prisma.timeEntry.aggregate({
            where: {
                userId: targetUserId,
                date: {
                    gte: monthStart,
                    lte: monthEnd
                }
            },
            _sum: { hours: true }
        });

        monthlyTotals.push(Number(result._sum.hours || 0));
    }

    // Get top projects this month
    const topProjects = await prisma.timeEntry.groupBy({
        by: ['projectId'],
        where: {
            userId: targetUserId,
            date: { gte: thisMonth }
        },
        _sum: { hours: true },
        orderBy: {
            _sum: { hours: 'desc' }
        },
        take: 5
    });

    // Get project details
    const projectIds = topProjects.map(tp => tp.projectId);
    const projects = await prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: { id: true, code: true, name: true }
    });

    const topProjectsWithDetails = topProjects.map(tp => ({
        project: projects.find(p => p.id === tp.projectId),
        hours: Number(tp._sum.hours || 0)
    }));

    return {
        today: Number(todayHours._sum.hours || 0),
        week: Number(weekHours._sum.hours || 0),
        month: Number(monthHours._sum.hours || 0),
        year: Number(yearHours._sum.hours || 0),
        monthlyTotals,
        topProjects: topProjectsWithDetails
    };
}

/**
 * Get project hours summary
 */
export async function getProjectHoursSummary(projectId: string, startDate?: Date, endDate?: Date) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("projects", "read");

    const where: any = {
        projectId,
        user: {
            companyId: user.companyId as string
        }
    };

    if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date.gte = startDate;
        if (endDate) where.date.lte = endDate;
    }

    const [totalHours, billableHours, entries, userBreakdown] = await Promise.all([
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
        prisma.timeEntry.count({ where }),
        prisma.timeEntry.groupBy({
            by: ['userId'],
            where,
            _sum: { hours: true },
            orderBy: {
                _sum: { hours: 'desc' }
            }
        })
    ]);

    // Get user details
    const userIds = userBreakdown.map(ub => ub.userId);
    const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true }
    });

    const userBreakdownWithDetails = userBreakdown.map(ub => ({
        user: users.find(u => u.id === ub.userId),
        hours: Number(ub._sum.hours || 0)
    }));

    return {
        totalHours: Number(totalHours._sum.hours || 0),
        billableHours: Number(billableHours._sum.hours || 0),
        nonBillableHours: Number(totalHours._sum.hours || 0) - Number(billableHours._sum.hours || 0),
        entries,
        userBreakdown: userBreakdownWithDetails
    };
}

/**
 * Get pending approvals (for MANAGER/ADMIN)
 */
export async function getPendingApprovals() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    if (!['MANAGER', 'ADMIN', 'SUPERADMIN'].includes(user.role)) {
        throw new Error("Solo managers y admins pueden ver aprobaciones pendientes");
    }

    const whereClause: any = {
        status: 'SUBMITTED',
        user: {
            companyId: user.companyId as string
        }
    };

    // Managers only see their department
    if (user.role === 'MANAGER') {
        whereClause.user.department = user.department;
    }

    const entries = await prisma.timeEntry.findMany({
        where: whereClause,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    department: true,
                    image: true
                }
            },
            project: {
                select: {
                    id: true,
                    code: true,
                    name: true
                }
            }
        },
        orderBy: [
            { date: 'desc' },
            { submittedAt: 'asc' }
        ]
    });

    return entries;
}

/**
 * ==========================================
 * UTILITY FUNCTIONS
 * ==========================================
 */

/**
 * Get active projects (for dropdowns)
 */
export async function getActiveProjects() {
    const user = await getAuthenticatedUser();
    if (!user) return [];

    // Build where clause - if user has companyId, filter by it
    // If not, or if user is ADMIN, show all active projects
    const where: any = {
        isActive: true
    };

    // Only filter by companyId if user has one and is not ADMIN
    if (user.companyId && user.role !== 'ADMIN') {
        where.companyId = user.companyId;
    }

    return await prisma.project.findMany({
        where,
        orderBy: { code: 'asc' },
        select: {
            id: true,
            code: true,
            name: true
        }
    });
}
