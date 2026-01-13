/**
 * Time Entry Export Module
 *
 * Export time entries to CSV, Excel, and PDF formats
 */

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { checkPermission } from "@/lib/permissions";

export interface ExportFilters {
    projectId?: string;
    userId?: string;
    startDate?: Date;
    endDate?: Date;
    status?: string;
    billable?: boolean;
}

/**
 * ==========================================
 * CSV EXPORT
 * ==========================================
 */

/**
 * Generate CSV string from time entries
 */
export async function exportTimeEntriesToCSV(filters?: ExportFilters): Promise<string> {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "read");

    const where: any = {};

    // RBAC: Users solo ven sus propias entradas, MANAGER/ADMIN ven todas
    if (user.role === 'WORKER' || user.role === 'CLIENT') {
        where.userId = user.id;
    } else {
        if (filters?.userId) {
            where.userId = filters.userId;
        } else {
            where.user = {
                companyId: user.companyId as string
            };
        }
    }

    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.startDate || filters?.endDate) {
        where.date = {};
        if (filters.startDate) where.date.gte = filters.startDate;
        if (filters.endDate) where.date.lte = filters.endDate;
    }
    if (filters?.status) where.status = filters.status;
    if (filters?.billable !== undefined) where.billable = filters.billable;

    const entries = await prisma.timeEntry.findMany({
        where,
        orderBy: [
            { date: 'desc' },
            { projectId: 'asc' }
        ],
        include: {
            project: {
                select: {
                    code: true,
                    name: true,
                    client: {
                        select: { name: true }
                    }
                }
            },
            user: {
                select: {
                    name: true,
                    email: true
                }
            }
        }
    });

    // CSV Header
    const headers = [
        'ID',
        'Fecha',
        'Usuario',
        'Email',
        'Proyecto',
        'Código Proyecto',
        'Cliente',
        'Horas',
        'Hora Inicio',
        'Hora Fin',
        'Facturable',
        'Estado',
        'Notas'
    ];

    // CSV Rows
    const rows = entries.map(entry => [
        entry.id,
        new Date(entry.date).toLocaleDateString('es-ES'),
        entry.user.name,
        entry.user.email,
        entry.project.name,
        entry.project.code,
        entry.project.client?.name || '-',
        Number(entry.hours).toFixed(2),
        (entry as any).startTime || '-',
        (entry as any).endTime || '-',
        (entry as any).billable ? 'Sí' : 'No',
        (entry as any).status || 'DRAFT',
        entry.notes ? `"${entry.notes.replace(/"/g, '""')}"` : '-' // Escape quotes
    ]);

    // Build CSV
    const csvLines = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ];

    return csvLines.join('\n');
}

/**
 * ==========================================
 * EXCEL EXPORT (CSV compatible with Excel)
 * ==========================================
 */

/**
 * Generate Excel-compatible CSV with BOM for proper encoding
 */
export async function exportTimeEntriesToExcel(filters?: ExportFilters): Promise<string> {
    const csv = await exportTimeEntriesToCSV(filters);

    // Add BOM for proper UTF-8 encoding in Excel
    const BOM = '\uFEFF';
    return BOM + csv;
}

/**
 * ==========================================
 * SUMMARY REPORTS
 * ==========================================
 */

/**
 * Generate summary report by project
 */
export async function exportProjectSummaryCSV(filters?: Omit<ExportFilters, 'projectId'>): Promise<string> {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "read");

    const where: any = {
        user: {
            companyId: user.companyId as string
        }
    };

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.startDate || filters?.endDate) {
        where.date = {};
        if (filters.startDate) where.date.gte = filters.startDate;
        if (filters.endDate) where.date.lte = filters.endDate;
    }
    if (filters?.status) where.status = filters.status;
    if (filters?.billable !== undefined) where.billable = filters.billable;

    // Group by project
    const projects = await prisma.timeEntry.groupBy({
        by: ['projectId'],
        where,
        _sum: {
            hours: true
        },
        _count: {
            id: true
        },
        orderBy: {
            _sum: {
                hours: 'desc'
            }
        }
    });

    // Get project details
    const projectIds = projects.map(p => p.projectId);
    const projectDetails = await prisma.project.findMany({
        where: { id: { in: projectIds } },
        select: {
            id: true,
            code: true,
            name: true,
            client: {
                select: { name: true }
            }
        }
    });

    // CSV Header
    const headers = [
        'Código Proyecto',
        'Nombre Proyecto',
        'Cliente',
        'Total Horas',
        'Número de Entradas',
        'Promedio Horas/Entrada'
    ];

    // CSV Rows
    const rows = projects.map(p => {
        const project = projectDetails.find(pd => pd.id === p.projectId);
        const totalHours = Number(p._sum.hours || 0);
        const count = p._count.id;
        const avgHours = count > 0 ? totalHours / count : 0;

        return [
            project?.code || 'N/A',
            project?.name || 'N/A',
            project?.client?.name || '-',
            totalHours.toFixed(2),
            count,
            avgHours.toFixed(2)
        ];
    });

    // Add total row
    const totalHours = projects.reduce((sum, p) => sum + Number(p._sum.hours || 0), 0);
    const totalEntries = projects.reduce((sum, p) => sum + p._count.id, 0);
    rows.push([
        '',
        'TOTAL',
        '',
        totalHours.toFixed(2),
        totalEntries.toString(),
        (totalEntries > 0 ? totalHours / totalEntries : 0).toFixed(2)
    ]);

    const csvLines = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ];

    return csvLines.join('\n');
}

/**
 * Generate summary report by user
 */
export async function exportUserSummaryCSV(filters?: Omit<ExportFilters, 'userId'>): Promise<string> {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "read");

    const where: any = {
        user: {
            companyId: user.companyId as string
        }
    };

    if (filters?.projectId) where.projectId = filters.projectId;
    if (filters?.startDate || filters?.endDate) {
        where.date = {};
        if (filters.startDate) where.date.gte = filters.startDate;
        if (filters.endDate) where.date.lte = filters.endDate;
    }
    if (filters?.status) where.status = filters.status;
    if (filters?.billable !== undefined) where.billable = filters.billable;

    // Group by user
    const users = await prisma.timeEntry.groupBy({
        by: ['userId'],
        where,
        _sum: {
            hours: true
        },
        _count: {
            id: true
        },
        orderBy: {
            _sum: {
                hours: 'desc'
            }
        }
    });

    // Get user details
    const userIds = users.map(u => u.userId);
    const userDetails = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true
        }
    });

    // CSV Header
    const headers = [
        'Usuario',
        'Email',
        'Rol',
        'Departamento',
        'Total Horas',
        'Número de Entradas',
        'Promedio Horas/Día'
    ];

    // CSV Rows
    const rows = users.map(u => {
        const userDetail = userDetails.find(ud => ud.id === u.userId);
        const totalHours = Number(u._sum.hours || 0);
        const count = u._count.id;

        // Calculate working days in period
        const start = filters?.startDate || new Date(0);
        const end = filters?.endDate || new Date();
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        const avgHoursPerDay = diffDays > 0 ? totalHours / diffDays : 0;

        return [
            userDetail?.name || 'N/A',
            userDetail?.email || 'N/A',
            userDetail?.role || '-',
            userDetail?.department || '-',
            totalHours.toFixed(2),
            count,
            avgHoursPerDay.toFixed(2)
        ];
    });

    // Add total row
    const totalHours = users.reduce((sum, u) => sum + Number(u._sum.hours || 0), 0);
    const totalEntries = users.reduce((sum, u) => sum + u._count.id, 0);
    rows.push([
        'TOTAL',
        '',
        '',
        '',
        totalHours.toFixed(2),
        totalEntries.toString(),
        ''
    ]);

    const csvLines = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ];

    return csvLines.join('\n');
}

/**
 * Generate monthly summary report
 */
export async function exportMonthlySummaryCSV(year: number, filters?: Omit<ExportFilters, 'startDate' | 'endDate'>): Promise<string> {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("timeentries", "read");

    const headers = [
        'Mes',
        'Total Horas',
        'Horas Facturables',
        'Horas No Facturables',
        'Entradas',
        'Horas Aprobadas',
        'Horas Pendientes'
    ];

    const rows: string[][] = [];

    for (let month = 0; month < 12; month++) {
        const monthStart = new Date(year, month, 1);
        const monthEnd = new Date(year, month + 1, 0, 23, 59, 59);

        const where: any = {
            user: {
                companyId: user.companyId as string
            },
            date: {
                gte: monthStart,
                lte: monthEnd
            }
        };

        if (filters?.projectId) where.projectId = filters.projectId;
        if (filters?.userId) where.userId = filters.userId;

        const [total, billable, nonBillable, approved, pending] = await Promise.all([
            prisma.timeEntry.aggregate({
                where,
                _sum: { hours: true }
            }),
            prisma.timeEntry.aggregate({
                where: { ...where, billable: true },
                _sum: { hours: true }
            }),
            prisma.timeEntry.aggregate({
                where: { ...where, billable: false },
                _sum: { hours: true }
            }),
            prisma.timeEntry.aggregate({
                where: { ...where, status: 'APPROVED' as any },
                _sum: { hours: true }
            }),
            prisma.timeEntry.aggregate({
                where: { ...where, status: { in: ['DRAFT', 'SUBMITTED'] as any } },
                _sum: { hours: true }
            })
        ]);

        const count = await prisma.timeEntry.count({ where });

        rows.push([
            monthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
            Number(total._sum.hours || 0).toFixed(2),
            Number(billable._sum.hours || 0).toFixed(2),
            Number(nonBillable._sum.hours || 0).toFixed(2),
            count.toString(),
            Number(approved._sum.hours || 0).toFixed(2),
            Number(pending._sum.hours || 0).toFixed(2)
        ]);
    }

    // Add totals
    const yearTotals = rows.reduce((acc, row) => ({
        total: acc.total + parseFloat(row[1]),
        billable: acc.billable + parseFloat(row[2]),
        nonBillable: acc.nonBillable + parseFloat(row[3]),
        count: acc.count + parseInt(row[4]),
        approved: acc.approved + parseFloat(row[5]),
        pending: acc.pending + parseFloat(row[6])
    }), { total: 0, billable: 0, nonBillable: 0, count: 0, approved: 0, pending: 0 });

    rows.push([
        `TOTAL ${year}`,
        yearTotals.total.toFixed(2),
        yearTotals.billable.toFixed(2),
        yearTotals.nonBillable.toFixed(2),
        yearTotals.count.toString(),
        yearTotals.approved.toFixed(2),
        yearTotals.pending.toFixed(2)
    ]);

    const csvLines = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ];

    return csvLines.join('\n');
}

/**
 * ==========================================
 * EXPORT UTILITY FUNCTIONS
 * ==========================================
 */

/**
 * Generate filename for export
 */
export function generateExportFilename(type: 'entries' | 'project-summary' | 'user-summary' | 'monthly', format: 'csv' | 'xlsx'): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const typeNames = {
        'entries': 'horas',
        'project-summary': 'resumen-proyectos',
        'user-summary': 'resumen-usuarios',
        'monthly': 'resumen-mensual'
    };

    return `${typeNames[type]}_${timestamp}.${format}`;
}

/**
 * Create downloadable blob from CSV string
 */
export function createCSVBlob(csvString: string): Blob {
    return new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Trigger download in browser
 */
export function downloadCSV(csvString: string, filename: string) {
    const blob = createCSVBlob(csvString);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
