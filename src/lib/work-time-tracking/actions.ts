'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { TimeEntryStatus, Department, Role } from '@prisma/client';

// ============================================
// AUTHENTICATION & AUTHORIZATION HELPERS
// ============================================

async function getAuthenticatedUser() {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error('No autenticado');
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            companyId: true,
            dailyWorkHours: true,
            hourCost: true,
        }
    });

    if (!user) {
        throw new Error('Usuario no encontrado');
    }

    return user;
}

function canManageUser(currentUser: { role: Role; department: Department; id: string }, targetUserId: string, targetDepartment?: Department): boolean {
    if (currentUser.role === 'SUPERADMIN' || currentUser.role === 'ADMIN') {
        return true;
    }
    if (currentUser.role === 'MANAGER') {
        // Managers can manage their department
        return targetDepartment === currentUser.department || currentUser.id === targetUserId;
    }
    return currentUser.id === targetUserId;
}

// ============================================
// TIME ENTRY CRUD OPERATIONS
// ============================================

export interface CreateTimeEntryInput {
    date: Date | string;
    projectId: string;
    hours: number;
    startTime?: string;
    endTime?: string;
    notes?: string;
}

export async function createTimeEntry(input: CreateTimeEntryInput) {
    const user = await getAuthenticatedUser();

    const entryDate = new Date(input.date);
    entryDate.setHours(0, 0, 0, 0);

    // Validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (entryDate > today) {
        throw new Error('No se pueden crear entradas para fechas futuras');
    }

    // Check if project exists and is active
    const project = await prisma.project.findUnique({
        where: { id: input.projectId },
        select: { id: true, isActive: true, name: true }
    });

    if (!project) {
        throw new Error('Proyecto no encontrado');
    }

    if (!project.isActive) {
        throw new Error('No se pueden agregar horas a un proyecto inactivo');
    }

    // Check daily limit
    const existingEntries = await prisma.timeEntry.findMany({
        where: {
            userId: user.id,
            date: entryDate
        },
        select: { hours: true }
    });

    const existingHours = existingEntries.reduce((sum, e) => sum + e.hours, 0);
    const maxDaily = user.dailyWorkHours * 1.5; // Allow up to 150% of daily hours

    if (existingHours + input.hours > maxDaily) {
        throw new Error(`Las horas totales del día (${existingHours + input.hours}h) exceden el máximo permitido (${maxDaily}h)`);
    }

    const entry = await prisma.timeEntry.create({
        data: {
            userId: user.id,
            projectId: input.projectId,
            date: entryDate,
            hours: input.hours,
            startTime: input.startTime,
            endTime: input.endTime,
            notes: input.notes,
            status: 'DRAFT'
        },
        include: {
            project: {
                select: { id: true, code: true, name: true }
            }
        }
    });

    // Update reporting status
    await updateWorkerReportingStatus(user.id);

    revalidatePath('/hours');
    revalidatePath('/control-horas');

    return entry;
}

export async function updateTimeEntry(
    entryId: string,
    input: Partial<CreateTimeEntryInput>
) {
    const user = await getAuthenticatedUser();

    const entry = await prisma.timeEntry.findUnique({
        where: { id: entryId },
        include: { user: { select: { department: true } } }
    });

    if (!entry) {
        throw new Error('Entrada no encontrada');
    }

    // Check permissions
    if (!canManageUser(user, entry.userId, entry.user.department)) {
        throw new Error('No tienes permisos para editar esta entrada');
    }

    // Cannot edit approved entries (unless admin)
    if (entry.status === 'APPROVED' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
        throw new Error('No se pueden editar entradas aprobadas');
    }

    const updated = await prisma.timeEntry.update({
        where: { id: entryId },
        data: {
            ...(input.hours !== undefined && { hours: input.hours }),
            ...(input.startTime !== undefined && { startTime: input.startTime }),
            ...(input.endTime !== undefined && { endTime: input.endTime }),
            ...(input.notes !== undefined && { notes: input.notes }),
            ...(input.projectId && { projectId: input.projectId }),
            // Reset to draft if edited
            status: entry.status === 'REJECTED' ? 'DRAFT' : entry.status
        },
        include: {
            project: {
                select: { id: true, code: true, name: true }
            }
        }
    });

    revalidatePath('/hours');
    revalidatePath('/control-horas');

    return updated;
}

export async function deleteTimeEntry(entryId: string) {
    const user = await getAuthenticatedUser();

    const entry = await prisma.timeEntry.findUnique({
        where: { id: entryId },
        include: { user: { select: { department: true } } }
    });

    if (!entry) {
        throw new Error('Entrada no encontrada');
    }

    // Check permissions
    if (!canManageUser(user, entry.userId, entry.user.department)) {
        throw new Error('No tienes permisos para eliminar esta entrada');
    }

    // Cannot delete approved entries (unless admin)
    if (entry.status === 'APPROVED' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
        throw new Error('No se pueden eliminar entradas aprobadas');
    }

    await prisma.timeEntry.delete({
        where: { id: entryId }
    });

    // Update reporting status
    await updateWorkerReportingStatus(entry.userId);

    revalidatePath('/hours');
    revalidatePath('/control-horas');

    return { success: true };
}

// ============================================
// TIME ENTRY QUERIES
// ============================================

export async function getTimeEntriesForDate(date: Date | string, userId?: string) {
    const user = await getAuthenticatedUser();
    const targetUserId = userId || user.id;

    // Check permissions for viewing other users
    if (targetUserId !== user.id) {
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { department: true }
        });
        if (!canManageUser(user, targetUserId, targetUser?.department)) {
            throw new Error('No tienes permisos para ver las entradas de este usuario');
        }
    }

    const entryDate = new Date(date);
    entryDate.setHours(0, 0, 0, 0);

    const entries = await prisma.timeEntry.findMany({
        where: {
            userId: targetUserId,
            date: entryDate
        },
        include: {
            project: {
                select: { id: true, code: true, name: true, department: true }
            },
            approvedBy: {
                select: { id: true, name: true }
            }
        },
        orderBy: { createdAt: 'asc' }
    });

    return entries;
}

export async function getTimeEntriesForMonth(year: number, month: number, userId?: string) {
    const user = await getAuthenticatedUser();
    const targetUserId = userId || user.id;

    // Check permissions
    if (targetUserId !== user.id) {
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { department: true }
        });
        if (!canManageUser(user, targetUserId, targetUser?.department)) {
            throw new Error('No tienes permisos para ver las entradas de este usuario');
        }
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const entries = await prisma.timeEntry.findMany({
        where: {
            userId: targetUserId,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            project: {
                select: { id: true, code: true, name: true, department: true }
            }
        },
        orderBy: { date: 'asc' }
    });

    return entries;
}

// ============================================
// APPROVAL WORKFLOW
// ============================================

export async function submitTimeEntriesForApproval(entryIds: string[]) {
    const user = await getAuthenticatedUser();

    // Verify all entries belong to user and are in DRAFT status
    const entries = await prisma.timeEntry.findMany({
        where: {
            id: { in: entryIds },
            userId: user.id
        }
    });

    if (entries.length !== entryIds.length) {
        throw new Error('Algunas entradas no fueron encontradas o no te pertenecen');
    }

    const nonDraftEntries = entries.filter(e => e.status !== 'DRAFT');
    if (nonDraftEntries.length > 0) {
        throw new Error('Solo se pueden enviar entradas en estado borrador');
    }

    await prisma.timeEntry.updateMany({
        where: { id: { in: entryIds } },
        data: {
            status: 'SUBMITTED',
            submittedAt: new Date()
        }
    });

    revalidatePath('/hours');
    revalidatePath('/control-horas');

    return { success: true, count: entries.length };
}

export async function approveTimeEntries(entryIds: string[]) {
    const user = await getAuthenticatedUser();

    if (user.role !== 'MANAGER' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
        throw new Error('No tienes permisos para aprobar entradas');
    }

    // Verify entries exist and are submitted
    const entries = await prisma.timeEntry.findMany({
        where: { id: { in: entryIds } },
        include: { user: { select: { id: true, department: true } } }
    });

    if (entries.length !== entryIds.length) {
        throw new Error('Algunas entradas no fueron encontradas');
    }

    // Check permissions for each entry
    for (const entry of entries) {
        if (!canManageUser(user, entry.userId, entry.user.department)) {
            throw new Error('No tienes permisos para aprobar algunas de las entradas');
        }
        if (entry.status !== 'SUBMITTED') {
            throw new Error('Solo se pueden aprobar entradas enviadas');
        }
        if (entry.userId === user.id) {
            throw new Error('No puedes aprobar tus propias entradas');
        }
    }

    await prisma.timeEntry.updateMany({
        where: { id: { in: entryIds } },
        data: {
            status: 'APPROVED',
            approvedAt: new Date(),
            approvedById: user.id
        }
    });

    // Update stats for affected users
    const uniqueUserIds = [...new Set(entries.map(e => e.userId))];
    for (const userId of uniqueUserIds) {
        await updateWorkerReportingStatus(userId);
    }

    revalidatePath('/hours');
    revalidatePath('/control-horas');

    return { success: true, count: entries.length };
}

export async function rejectTimeEntries(entryIds: string[], reason: string) {
    const user = await getAuthenticatedUser();

    if (user.role !== 'MANAGER' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
        throw new Error('No tienes permisos para rechazar entradas');
    }

    if (!reason?.trim()) {
        throw new Error('Se requiere un motivo de rechazo');
    }

    const entries = await prisma.timeEntry.findMany({
        where: { id: { in: entryIds } },
        include: { user: { select: { id: true, department: true } } }
    });

    // Check permissions
    for (const entry of entries) {
        if (!canManageUser(user, entry.userId, entry.user.department)) {
            throw new Error('No tienes permisos para rechazar algunas de las entradas');
        }
    }

    await prisma.timeEntry.updateMany({
        where: { id: { in: entryIds } },
        data: {
            status: 'REJECTED',
            rejectionReason: reason
        }
    });

    revalidatePath('/hours');
    revalidatePath('/control-horas');

    return { success: true, count: entries.length };
}

export async function getPendingApprovals() {
    const user = await getAuthenticatedUser();

    if (user.role !== 'MANAGER' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
        return [];
    }

    const whereClause: any = {
        status: 'SUBMITTED'
    };

    // Managers only see their department
    if (user.role === 'MANAGER') {
        whereClause.user = {
            department: user.department
        };
    }

    const entries = await prisma.timeEntry.findMany({
        where: whereClause,
        include: {
            user: {
                select: { id: true, name: true, email: true, department: true, image: true }
            },
            project: {
                select: { id: true, code: true, name: true }
            }
        },
        orderBy: [
            { date: 'desc' },
            { submittedAt: 'asc' }
        ]
    });

    return entries;
}

// ============================================
// WORKER CALENDAR CONFIGURATION
// ============================================

export async function getWorkerCalendarConfig(userId?: string, year?: number, month?: number) {
    const user = await getAuthenticatedUser();
    const targetUserId = userId || user.id;

    // Check permissions
    if (targetUserId !== user.id) {
        const targetUser = await prisma.user.findUnique({
            where: { id: targetUserId },
            select: { department: true }
        });
        if (!canManageUser(user, targetUserId, targetUser?.department)) {
            throw new Error('No tienes permisos para ver la configuración de este usuario');
        }
    }

    // Try to find specific config, then year config, then permanent config
    const configs = await prisma.workerCalendarConfig.findMany({
        where: {
            userId: targetUserId,
            OR: [
                { year, month },
                { year, month: null },
                { year: null, month: null }
            ]
        },
        orderBy: [
            { year: 'desc' },
            { month: 'desc' }
        ]
    });

    // Return most specific config or default
    const config = configs[0] || {
        dailyHours: 8.0,
        workMonday: true,
        workTuesday: true,
        workWednesday: true,
        workThursday: true,
        workFriday: true,
        workSaturday: false,
        workSunday: false,
        nonWorkingDates: []
    };

    return config;
}

export async function updateWorkerCalendarConfig(
    userId: string,
    config: {
        year?: number | null;
        month?: number | null;
        dailyHours?: number;
        workMonday?: boolean;
        workTuesday?: boolean;
        workWednesday?: boolean;
        workThursday?: boolean;
        workFriday?: boolean;
        workSaturday?: boolean;
        workSunday?: boolean;
        nonWorkingDates?: Date[];
        notes?: string;
    }
) {
    const user = await getAuthenticatedUser();

    // Only admin/manager can change other users' config
    if (userId !== user.id) {
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { department: true }
        });
        if (!canManageUser(user, userId, targetUser?.department)) {
            throw new Error('No tienes permisos para modificar la configuración de este usuario');
        }
    }

    const result = await prisma.workerCalendarConfig.upsert({
        where: {
            userId_year_month: {
                userId,
                year: config.year ?? 0,
                month: config.month ?? 0
            }
        },
        create: {
            userId,
            year: config.year,
            month: config.month,
            dailyHours: config.dailyHours ?? 8.0,
            workMonday: config.workMonday ?? true,
            workTuesday: config.workTuesday ?? true,
            workWednesday: config.workWednesday ?? true,
            workThursday: config.workThursday ?? true,
            workFriday: config.workFriday ?? true,
            workSaturday: config.workSaturday ?? false,
            workSunday: config.workSunday ?? false,
            nonWorkingDates: config.nonWorkingDates ?? [],
            notes: config.notes
        },
        update: {
            dailyHours: config.dailyHours,
            workMonday: config.workMonday,
            workTuesday: config.workTuesday,
            workWednesday: config.workWednesday,
            workThursday: config.workThursday,
            workFriday: config.workFriday,
            workSaturday: config.workSaturday,
            workSunday: config.workSunday,
            nonWorkingDates: config.nonWorkingDates,
            notes: config.notes
        }
    });

    revalidatePath('/control-horas');
    revalidatePath('/admin/hours-config');

    return result;
}

// ============================================
// STATISTICS & CALCULATIONS
// ============================================

export async function calculateMonthlyStats(userId: string, year: number, month: number) {
    const user = await getAuthenticatedUser();

    // Check permissions
    if (userId !== user.id) {
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { department: true, dailyWorkHours: true }
        });
        if (!canManageUser(user, userId, targetUser?.department)) {
            throw new Error('No tienes permisos');
        }
    }

    const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { dailyWorkHours: true }
    });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    // Get calendar config
    const config = await getWorkerCalendarConfig(userId, year, month);
    const dailyHours = config.dailyHours || targetUser?.dailyWorkHours || 8.0;

    // Get holidays
    const holidays = await prisma.holiday.findMany({
        where: {
            year,
            date: {
                gte: startDate,
                lte: endDate
            }
        }
    });
    const holidayDates = new Set(holidays.map(h => h.date.toISOString().split('T')[0]));

    // Calculate working days
    let workingDays = 0;
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        const dateStr = currentDate.toISOString().split('T')[0];

        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidayDates.has(dateStr);
        const isNonWorking = config.nonWorkingDates?.some(
            (d: Date) => new Date(d).toISOString().split('T')[0] === dateStr
        );

        // Check if this day is configured as a working day
        const dayConfig: Record<number, boolean> = {
            0: config.workSunday ?? false,
            1: config.workMonday ?? true,
            2: config.workTuesday ?? true,
            3: config.workWednesday ?? true,
            4: config.workThursday ?? true,
            5: config.workFriday ?? true,
            6: config.workSaturday ?? false
        };

        if (dayConfig[dayOfWeek] && !isHoliday && !isNonWorking) {
            workingDays++;
        }

        currentDate.setDate(currentDate.getDate() + 1);
    }

    const expectedHours = workingDays * dailyHours;

    // Get time entries
    const entries = await prisma.timeEntry.findMany({
        where: {
            userId,
            date: {
                gte: startDate,
                lte: endDate
            }
        }
    });

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const approvedHours = entries.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.hours, 0);
    const pendingHours = entries.filter(e => e.status === 'DRAFT' || e.status === 'SUBMITTED').reduce((sum, e) => sum + e.hours, 0);

    const datesWithEntries = new Set(entries.map(e => e.date.toISOString().split('T')[0]));
    const daysWithEntries = datesWithEntries.size;
    const daysWithoutEntries = workingDays - daysWithEntries;

    const difference = totalHours - expectedHours;
    const compliancePercent = expectedHours > 0 ? (totalHours / expectedHours) * 100 : 0;

    const lastEntry = entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    // Upsert stats
    const stats = await prisma.workerMonthlyStats.upsert({
        where: {
            userId_year_month: { userId, year, month }
        },
        create: {
            userId,
            year,
            month,
            workingDays,
            expectedHours,
            totalHours,
            approvedHours,
            pendingHours,
            difference,
            compliancePercent,
            lastEntryDate: lastEntry?.date,
            daysWithEntries,
            daysWithoutEntries,
            calculatedAt: new Date()
        },
        update: {
            workingDays,
            expectedHours,
            totalHours,
            approvedHours,
            pendingHours,
            difference,
            compliancePercent,
            lastEntryDate: lastEntry?.date,
            daysWithEntries,
            daysWithoutEntries,
            calculatedAt: new Date()
        }
    });

    return stats;
}

export async function getWorkerMonthlyStats(userId: string, year: number, month: number) {
    const user = await getAuthenticatedUser();

    if (userId !== user.id) {
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { department: true }
        });
        if (!canManageUser(user, userId, targetUser?.department)) {
            throw new Error('No tienes permisos');
        }
    }

    let stats = await prisma.workerMonthlyStats.findUnique({
        where: {
            userId_year_month: { userId, year, month }
        }
    });

    // Calculate if stale or missing
    if (!stats || new Date().getTime() - stats.calculatedAt.getTime() > 5 * 60 * 1000) {
        stats = await calculateMonthlyStats(userId, year, month);
    }

    return stats;
}

// ============================================
// GLOBAL DASHBOARD DATA
// ============================================

async function updateWorkerReportingStatus(userId: string) {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Get last entry
    const lastEntry = await prisma.timeEntry.findFirst({
        where: { userId },
        orderBy: { date: 'desc' },
        select: { date: true }
    });

    // Calculate days since last entry
    const daysSinceLastEntry = lastEntry
        ? Math.floor((today.getTime() - new Date(lastEntry.date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

    // Get current month stats
    const monthStats = await calculateMonthlyStats(userId, currentYear, currentMonth);

    // Get YTD stats
    let ytdExpected = 0;
    let ytdActual = 0;

    for (let m = 1; m <= currentMonth; m++) {
        const stats = await prisma.workerMonthlyStats.findUnique({
            where: { userId_year_month: { userId, year: currentYear, month: m } }
        });
        if (stats) {
            ytdExpected += stats.expectedHours;
            ytdActual += stats.totalHours;
        }
    }

    // Check for pending approvals
    const pendingCount = await prisma.timeEntry.count({
        where: {
            userId,
            status: { in: ['DRAFT', 'SUBMITTED'] }
        }
    });

    // Get settings for attention threshold
    const settings = await prisma.hoursControlSettings.findFirst();
    const threshold = settings?.reminderThresholdDays ?? 3;

    await prisma.workerReportingStatus.upsert({
        where: { userId },
        create: {
            userId,
            lastEntryDate: lastEntry?.date,
            daysSinceLastEntry,
            currentMonthExpected: monthStats.expectedHours,
            currentMonthActual: monthStats.totalHours,
            currentMonthDiff: monthStats.difference,
            ytdExpectedHours: ytdExpected,
            ytdActualHours: ytdActual,
            ytdDifference: ytdActual - ytdExpected,
            needsAttention: daysSinceLastEntry >= threshold,
            hasPendingApprovals: pendingCount > 0,
            calculatedAt: new Date()
        },
        update: {
            lastEntryDate: lastEntry?.date,
            daysSinceLastEntry,
            currentMonthExpected: monthStats.expectedHours,
            currentMonthActual: monthStats.totalHours,
            currentMonthDiff: monthStats.difference,
            ytdExpectedHours: ytdExpected,
            ytdActualHours: ytdActual,
            ytdDifference: ytdActual - ytdExpected,
            needsAttention: daysSinceLastEntry >= threshold,
            hasPendingApprovals: pendingCount > 0,
            calculatedAt: new Date()
        }
    });
}

export async function getGlobalDashboardData(filters?: {
    department?: Department;
    year?: number;
    onlyNeedsAttention?: boolean;
}) {
    const user = await getAuthenticatedUser();

    if (user.role !== 'MANAGER' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
        throw new Error('No tienes permisos para ver el panel global');
    }

    const year = filters?.year || new Date().getFullYear();

    // Build user filter
    const userWhere: any = {
        isActive: true,
        role: { in: ['WORKER', 'MANAGER'] }
    };

    if (user.role === 'MANAGER') {
        userWhere.department = user.department;
    } else if (filters?.department) {
        userWhere.department = filters.department;
    }

    // Get all workers
    const workers = await prisma.user.findMany({
        where: userWhere,
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            department: true,
            dailyWorkHours: true
        },
        orderBy: [
            { department: 'asc' },
            { name: 'asc' }
        ]
    });

    // Get reporting status for all workers
    const statuses = await prisma.workerReportingStatus.findMany({
        where: {
            userId: { in: workers.map(w => w.id) }
        }
    });

    const statusMap = new Map(statuses.map(s => [s.userId, s]));

    // Combine data
    let result = workers.map(worker => {
        const status = statusMap.get(worker.id);
        return {
            userId: worker.id,
            userName: worker.name,
            userEmail: worker.email,
            userImage: worker.image,
            department: worker.department,
            dailyHours: worker.dailyWorkHours,
            lastEntryDate: status?.lastEntryDate,
            daysSinceLastEntry: status?.daysSinceLastEntry ?? 999,
            currentMonthExpected: status?.currentMonthExpected ?? 0,
            currentMonthActual: status?.currentMonthActual ?? 0,
            currentMonthDiff: status?.currentMonthDiff ?? 0,
            ytdExpectedHours: status?.ytdExpectedHours ?? 0,
            ytdActualHours: status?.ytdActualHours ?? 0,
            ytdDifference: status?.ytdDifference ?? 0,
            needsAttention: status?.needsAttention ?? true,
            hasPendingApprovals: status?.hasPendingApprovals ?? false
        };
    });

    if (filters?.onlyNeedsAttention) {
        result = result.filter(r => r.needsAttention);
    }

    return result;
}

// ============================================
// PROJECT AGGREGATION
// ============================================

export async function calculateProjectHoursAggregate(projectId: string, year: number, month?: number) {
    const startDate = month
        ? new Date(year, month - 1, 1)
        : new Date(year, 0, 1);
    const endDate = month
        ? new Date(year, month, 0)
        : new Date(year, 11, 31);

    const entries = await prisma.timeEntry.findMany({
        where: {
            projectId,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            user: {
                select: { hourCost: true }
            }
        }
    });

    const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    const approvedHours = entries.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.hours, 0);
    const pendingHours = entries.filter(e => e.status !== 'APPROVED').reduce((sum, e) => sum + e.hours, 0);

    // Calculate cost
    let totalCost = 0;
    for (const entry of entries) {
        const hourCost = entry.user.hourCost ? Number(entry.user.hourCost) : 0;
        totalCost += entry.hours * hourCost;
    }

    const uniqueUsers = new Set(entries.map(e => e.userId));

    const aggregate = await prisma.projectHoursAggregate.upsert({
        where: {
            projectId_year_month: { projectId, year, month: month ?? 0 }
        },
        create: {
            projectId,
            year,
            month,
            totalHours,
            approvedHours,
            pendingHours,
            totalCost,
            contributorCount: uniqueUsers.size,
            calculatedAt: new Date()
        },
        update: {
            totalHours,
            approvedHours,
            pendingHours,
            totalCost,
            contributorCount: uniqueUsers.size,
            calculatedAt: new Date()
        }
    });

    return aggregate;
}

export async function getProjectHoursSummary(year: number, department?: Department) {
    const user = await getAuthenticatedUser();

    if (user.role !== 'MANAGER' && user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
        throw new Error('No tienes permisos');
    }

    const projectWhere: any = {
        isActive: true
    };

    if (user.role === 'MANAGER') {
        projectWhere.department = user.department;
    } else if (department) {
        projectWhere.department = department;
    }

    const projects = await prisma.project.findMany({
        where: projectWhere,
        select: {
            id: true,
            code: true,
            name: true,
            department: true
        },
        orderBy: { code: 'asc' }
    });

    // Get aggregates for each project
    const result = [];

    for (const project of projects) {
        const monthlyData: Record<number, number> = {};

        // Get or calculate monthly aggregates
        for (let month = 1; month <= 12; month++) {
            let aggregate = await prisma.projectHoursAggregate.findUnique({
                where: {
                    projectId_year_month: { projectId: project.id, year, month }
                }
            });

            if (!aggregate) {
                aggregate = await calculateProjectHoursAggregate(project.id, year, month);
            }

            monthlyData[month] = aggregate.totalHours;
        }

        const totalHours = Object.values(monthlyData).reduce((sum, h) => sum + h, 0);

        // Get breakdown by user
        const userBreakdown = await prisma.timeEntry.groupBy({
            by: ['userId'],
            where: {
                projectId: project.id,
                date: {
                    gte: new Date(year, 0, 1),
                    lte: new Date(year, 11, 31)
                }
            },
            _sum: { hours: true }
        });

        const userIds = userBreakdown.map(u => u.userId);
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true }
        });

        const userMap = new Map(users.map(u => [u.id, u.name]));

        result.push({
            projectId: project.id,
            projectCode: project.code,
            projectName: project.name,
            department: project.department,
            monthlyHours: monthlyData,
            totalHours,
            contributors: userBreakdown.map(u => ({
                userId: u.userId,
                userName: userMap.get(u.userId) || 'Desconocido',
                hours: u._sum.hours || 0
            }))
        });
    }

    return result;
}

// ============================================
// PROJECTS LIST
// ============================================

export async function getActiveProjects() {
    const user = await getAuthenticatedUser();

    const projects = await prisma.project.findMany({
        where: {
            isActive: true,
            ...(user.companyId && { companyId: user.companyId })
        },
        select: {
            id: true,
            code: true,
            name: true,
            department: true
        },
        orderBy: [
            { department: 'asc' },
            { code: 'asc' }
        ]
    });

    return projects;
}

// ============================================
// HOLIDAY MANAGEMENT
// ============================================

export async function getHolidays(year: number, companyId?: string) {
    const user = await getAuthenticatedUser();

    const holidays = await prisma.holiday.findMany({
        where: {
            year,
            OR: [
                { companyId: null },
                { companyId: companyId || user.companyId }
            ]
        },
        orderBy: { date: 'asc' }
    });

    return holidays;
}

export async function createHoliday(data: {
    date: Date | string;
    name: string;
    type?: string;
    companyId?: string;
}) {
    const user = await getAuthenticatedUser();

    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
        throw new Error('No tienes permisos para crear festivos');
    }

    const holidayDate = new Date(data.date);
    const year = holidayDate.getFullYear();

    const holiday = await prisma.holiday.create({
        data: {
            date: holidayDate,
            name: data.name,
            type: data.type || 'COMPANY',
            year,
            companyId: data.companyId || user.companyId
        }
    });

    revalidatePath('/admin/holidays');
    revalidatePath('/control-horas');

    return holiday;
}

export async function deleteHoliday(holidayId: string) {
    const user = await getAuthenticatedUser();

    if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
        throw new Error('No tienes permisos para eliminar festivos');
    }

    await prisma.holiday.delete({
        where: { id: holidayId }
    });

    revalidatePath('/admin/holidays');
    revalidatePath('/control-horas');

    return { success: true };
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

export async function exportTimeEntriesCSV(
    userId: string,
    year: number,
    month?: number
) {
    const user = await getAuthenticatedUser();

    // Check permissions
    if (userId !== user.id) {
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { department: true, name: true }
        });
        if (!canManageUser(user, userId, targetUser?.department)) {
            throw new Error('No tienes permisos');
        }
    }

    const startDate = month
        ? new Date(year, month - 1, 1)
        : new Date(year, 0, 1);
    const endDate = month
        ? new Date(year, month, 0)
        : new Date(year, 11, 31);

    const entries = await prisma.timeEntry.findMany({
        where: {
            userId,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            project: {
                select: { code: true, name: true }
            }
        },
        orderBy: { date: 'asc' }
    });

    // Build CSV
    const headers = ['Fecha', 'Proyecto', 'Código', 'Horas', 'Inicio', 'Fin', 'Estado', 'Notas'];
    const rows = entries.map(e => [
        new Date(e.date).toLocaleDateString('es-ES'),
        e.project.name,
        e.project.code,
        e.hours.toFixed(2),
        e.startTime || '',
        e.endTime || '',
        e.status,
        e.notes || ''
    ]);

    const csv = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csv;
}
