'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================
// EMPLOYEE HR DATA MANAGEMENT
// ============================================

/**
 * Get all employees with HR data (for HR managers)
 */
export async function getEmployeesWithHRData() {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!user) throw new Error('Usuario no encontrado');

    // Only ADMIN, MANAGER can view HR data
    if (!['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(user.role)) {
        throw new Error('No tienes permisos para ver datos de RRHH');
    }

    // Get ALL employees (including inactive) - status filter is handled in UI
    const employees = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            department: true,
            employeeCode: true,
            hireDate: true,
            contractType: true,
            contractEndDate: true,
            vacationDays: true,
            isActive: true,
            createdAt: true,
            // Count absences
            _count: {
                select: {
                    absences: true
                }
            }
        },
        orderBy: { name: 'asc' }
    });

    return employees;
}

/**
 * Update HR data for an employee
 */
export async function updateEmployeeHRData(
    userId: string,
    data: {
        employeeCode?: string;
        hireDate?: Date;
        contractType?: 'INDEFINIDO' | 'TEMPORAL' | 'OBRA_SERVICIO' | 'PRACTICAS' | 'FORMACION';
        contractEndDate?: Date | null;
        salary?: number;
        bankAccount?: string;
        ssNumber?: string;
        emergencyContact?: { name: string; phone: string; relation: string };
        vacationDays?: number;
    }
) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    // Only ADMIN can update HR data
    if (!['SUPERADMIN', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('No tienes permisos para actualizar datos de RRHH');
    }

    const updated = await prisma.user.update({
        where: { id: userId },
        data: {
            employeeCode: data.employeeCode,
            hireDate: data.hireDate,
            contractType: data.contractType,
            contractEndDate: data.contractEndDate,
            salary: data.salary,
            bankAccount: data.bankAccount,
            ssNumber: data.ssNumber,
            emergencyContact: data.emergencyContact,
            vacationDays: data.vacationDays
        }
    });

    revalidatePath('/hr');
    revalidatePath('/hr/employees');
    return updated;
}

/**
 * Generate next employee code
 */
export async function generateEmployeeCode(): Promise<string> {
    const lastEmployee = await prisma.user.findFirst({
        where: {
            employeeCode: { not: null }
        },
        orderBy: { employeeCode: 'desc' },
        select: { employeeCode: true }
    });

    if (!lastEmployee?.employeeCode) {
        return 'EMP-001';
    }

    const match = lastEmployee.employeeCode.match(/EMP-(\d+)/);
    if (!match) return 'EMP-001';

    const nextNumber = parseInt(match[1], 10) + 1;
    return `EMP-${nextNumber.toString().padStart(3, '0')}`;
}

/**
 * Toggle employee active/inactive status
 */
export async function toggleEmployeeActive(userId: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    // Only ADMIN can toggle employee status
    if (!['SUPERADMIN', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('No tienes permisos para cambiar el estado del empleado');
    }

    // Get current status
    const employee = await prisma.user.findUnique({
        where: { id: userId },
        select: { isActive: true, name: true }
    });
    if (!employee) throw new Error('Empleado no encontrado');

    // Toggle status
    const updated = await prisma.user.update({
        where: { id: userId },
        data: { isActive: !employee.isActive }
    });

    revalidatePath('/hr');
    revalidatePath('/hr/employees');
    revalidatePath(`/hr/employees/${userId}`);

    return {
        isActive: updated.isActive,
        message: updated.isActive ? 'Empleado activado' : 'Empleado desactivado'
    };
}

/**
 * Update employee salary (restricted to ADMIN only)
 */
export async function updateEmployeeSalary(userId: string, salary: number) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    // Only ADMIN can update salary
    if (!['SUPERADMIN', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('No tienes permisos para modificar el salario');
    }

    if (salary < 0) throw new Error('El salario no puede ser negativo');

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { salary }
    });

    revalidatePath('/hr');
    revalidatePath('/hr/employees');
    revalidatePath(`/hr/employees/${userId}`);

    return { salary: updated.salary };
}

/**
 * Get single employee by ID with full HR data
 */
export async function getEmployeeById(userId: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    // Only ADMIN, MANAGER can view HR data
    if (!['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
        throw new Error('No tienes permisos para ver datos de RRHH');
    }

    const employee = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            department: true,
            dailyWorkHours: true,
            isActive: true,
            createdAt: true,
            // HR fields
            employeeCode: true,
            hireDate: true,
            contractType: true,
            contractEndDate: true,
            salary: true,
            bankAccount: true,
            ssNumber: true,
            emergencyContact: true,
            vacationDays: true,
            // Relations
            absences: {
                take: 10,
                orderBy: { startDate: 'desc' },
                select: {
                    id: true,
                    type: true,
                    startDate: true,
                    endDate: true,
                    totalDays: true,
                    status: true
                }
            },
            memberOfTeams: {
                select: { id: true, name: true }
            }
        }
    });

    if (!employee) throw new Error('Empleado no encontrado');

    // Convert Decimal to number for client serialization
    return {
        ...employee,
        salary: employee.salary ? Number(employee.salary) : null
    };
}

// ============================================
// ABSENCE / VACATION MANAGEMENT
// ============================================

/**
 * Request an absence (vacation, sick leave, etc.)
 */
export async function requestAbsence(data: {
    type: 'VACATION' | 'SICK' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'UNPAID' | 'OTHER';
    startDate: Date;
    endDate: Date;
    reason?: string;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!user) throw new Error('Usuario no encontrado');

    // Calculate total days (simple - not accounting for weekends)
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const absence = await prisma.absence.create({
        data: {
            userId: user.id,
            type: data.type,
            startDate: data.startDate,
            endDate: data.endDate,
            totalDays,
            reason: data.reason,
            status: 'PENDING'
        }
    });

    revalidatePath('/hr');
    revalidatePath('/hr/absences');
    return absence;
}

/**
 * Approve or reject an absence request
 */
export async function processAbsenceRequest(
    absenceId: string,
    action: 'APPROVED' | 'REJECTED',
    note?: string
) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    // Only ADMIN/MANAGER can approve
    if (!['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
        throw new Error('No tienes permisos para aprobar ausencias');
    }

    const absence = await prisma.absence.update({
        where: { id: absenceId },
        data: {
            status: action,
            approvedById: currentUser.id,
            approvedAt: new Date(),
            rejectionNote: action === 'REJECTED' ? note : null
        }
    });

    revalidatePath('/hr');
    revalidatePath('/hr/absences');
    return absence;
}

/**
 * Cancel own absence request (only if pending)
 */
export async function cancelMyAbsence(absenceId: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    // Check if this absence belongs to the current user
    const absence = await prisma.absence.findUnique({
        where: { id: absenceId }
    });
    if (!absence) throw new Error('Ausencia no encontrada');

    if (absence.userId !== currentUser.id) {
        throw new Error('Solo puedes cancelar tus propias solicitudes');
    }

    if (absence.status !== 'PENDING') {
        throw new Error('Solo puedes cancelar solicitudes pendientes');
    }

    const updated = await prisma.absence.update({
        where: { id: absenceId },
        data: { status: 'CANCELLED' }
    });

    revalidatePath('/hr');
    revalidatePath('/hr/absences');
    return updated;
}

/**
 * Get absences for current user
 */
export async function getMyAbsences() {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!user) throw new Error('Usuario no encontrado');

    const absences = await prisma.absence.findMany({
        where: { userId: user.id },
        orderBy: { startDate: 'desc' },
        include: {
            approvedBy: {
                select: { name: true }
            }
        }
    });

    return absences;
}

/**
 * Get all absences (for managers)
 */
export async function getAllAbsences(filters?: {
    status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
    type?: string;
    startDate?: Date;
    endDate?: Date;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    // Only ADMIN/MANAGER can view all absences
    if (!['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
        throw new Error('No tienes permisos para ver todas las ausencias');
    }

    const absences = await prisma.absence.findMany({
        where: {
            ...(filters?.status && { status: filters.status }),
            ...(filters?.type && { type: filters.type as any }),
            ...(filters?.startDate && { startDate: { gte: filters.startDate } }),
            ...(filters?.endDate && { endDate: { lte: filters.endDate } })
        },
        orderBy: { createdAt: 'desc' },
        include: {
            user: {
                select: { id: true, name: true, email: true, image: true, department: true }
            },
            approvedBy: {
                select: { name: true }
            }
        }
    });

    return absences;
}

/**
 * Get vacation balance for a user
 */
export async function getVacationBalance(userId?: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    let targetUserId = userId;

    if (!targetUserId) {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });
        if (!user) throw new Error('Usuario no encontrado');
        targetUserId = user.id;
    }

    const user = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { vacationDays: true }
    });

    if (!user) throw new Error('Usuario no encontrado');

    // Get approved vacation days this year
    const currentYear = new Date().getFullYear();
    const usedDays = await prisma.absence.aggregate({
        where: {
            userId: targetUserId,
            type: 'VACATION',
            status: 'APPROVED',
            startDate: {
                gte: new Date(`${currentYear}-01-01`),
                lte: new Date(`${currentYear}-12-31`)
            }
        },
        _sum: { totalDays: true }
    });

    const pendingDays = await prisma.absence.aggregate({
        where: {
            userId: targetUserId,
            type: 'VACATION',
            status: 'PENDING',
            startDate: {
                gte: new Date(`${currentYear}-01-01`),
                lte: new Date(`${currentYear}-12-31`)
            }
        },
        _sum: { totalDays: true }
    });

    return {
        total: user.vacationDays,
        used: usedDays._sum.totalDays || 0,
        pending: pendingDays._sum.totalDays || 0,
        available: user.vacationDays - (usedDays._sum.totalDays || 0)
    };
}

/**
 * Get absences calendar data
 */
export async function getAbsencesCalendar(month: number, year: number) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0);

    const absences = await prisma.absence.findMany({
        where: {
            status: 'APPROVED',
            OR: [
                {
                    startDate: { gte: startOfMonth, lte: endOfMonth }
                },
                {
                    endDate: { gte: startOfMonth, lte: endOfMonth }
                },
                {
                    AND: [
                        { startDate: { lte: startOfMonth } },
                        { endDate: { gte: endOfMonth } }
                    ]
                }
            ]
        },
        include: {
            user: {
                select: { id: true, name: true, image: true, department: true }
            }
        }
    });

    return absences;
}

// ============================================
// HR DASHBOARD STATS
// ============================================

/**
 * Get HR dashboard statistics
 */
export async function getHRDashboardStats() {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    // Only ADMIN/MANAGER can view HR dashboard
    if (!['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
        throw new Error('No tienes permisos para ver el dashboard de RRHH');
    }

    const [
        totalEmployees,
        activeEmployees,
        pendingAbsences,
        absencesToday,
        contractsExpiringSoon
    ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.absence.count({ where: { status: 'PENDING' } }),
        prisma.absence.count({
            where: {
                status: 'APPROVED',
                startDate: { lte: new Date() },
                endDate: { gte: new Date() }
            }
        }),
        prisma.user.count({
            where: {
                contractType: 'TEMPORAL',
                contractEndDate: {
                    gte: new Date(),
                    lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
                }
            }
        })
    ]);

    return {
        totalEmployees,
        activeEmployees,
        pendingAbsences,
        absencesToday,
        contractsExpiringSoon
    };
}

// ============================================
// PAYROLL MANAGEMENT
// ============================================

/**
 * Get all payroll records with optional filters
 */
export async function getPayrollRecords(filters?: {
    period?: string;
    status?: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'PAID';
    userId?: string;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    // Only ADMIN can view payroll
    if (!['SUPERADMIN', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('No tienes permisos para ver nóminas');
    }

    const records = await prisma.payrollRecord.findMany({
        where: {
            ...(filters?.period && { period: filters.period }),
            ...(filters?.status && { status: filters.status }),
            ...(filters?.userId && { userId: filters.userId })
        },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    department: true,
                    employeeCode: true
                }
            }
        },
        orderBy: [
            { period: 'desc' },
            { createdAt: 'desc' }
        ]
    });

    return records;
}

/**
 * Get single payroll record by ID
 */
export async function getPayrollById(id: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    if (!['SUPERADMIN', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('No tienes permisos para ver nóminas');
    }

    const record = await prisma.payrollRecord.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    department: true,
                    employeeCode: true,
                    salary: true,
                    bankAccount: true
                }
            }
        }
    });

    if (!record) throw new Error('Nómina no encontrada');
    return record;
}

/**
 * Create a payroll record for an employee
 */
export async function createPayrollRecord(data: {
    userId: string;
    period: string; // YYYY-MM
    baseSalary: number;
    overtime?: number;
    bonuses?: number;
    deductions?: number;
    notes?: string;
}) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    if (!['SUPERADMIN', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('No tienes permisos para crear nóminas');
    }

    // Check if payroll already exists for this user/period
    const existing = await prisma.payrollRecord.findUnique({
        where: {
            userId_period: {
                userId: data.userId,
                period: data.period
            }
        }
    });

    if (existing) {
        throw new Error(`Ya existe una nómina para este empleado en el período ${data.period}`);
    }

    const netSalary = data.baseSalary + (data.overtime || 0) + (data.bonuses || 0) - (data.deductions || 0);

    const record = await prisma.payrollRecord.create({
        data: {
            userId: data.userId,
            period: data.period,
            baseSalary: data.baseSalary,
            overtime: data.overtime || 0,
            bonuses: data.bonuses || 0,
            deductions: data.deductions || 0,
            netSalary,
            notes: data.notes,
            status: 'DRAFT'
        },
        include: {
            user: {
                select: { name: true, email: true }
            }
        }
    });

    revalidatePath('/hr/payroll');
    return record;
}

/**
 * Update payroll record status
 */
export async function updatePayrollStatus(
    id: string,
    status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'PAID',
    paidAt?: Date
) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    if (!['SUPERADMIN', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('No tienes permisos para actualizar nóminas');
    }

    const record = await prisma.payrollRecord.update({
        where: { id },
        data: {
            status,
            ...(status === 'PAID' && { paidAt: paidAt || new Date() })
        }
    });

    revalidatePath('/hr/payroll');
    return record;
}

/**
 * Generate monthly payroll records for all active employees
 */
export async function generateMonthlyPayroll(period: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    if (!['SUPERADMIN', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('No tienes permisos para generar nóminas');
    }

    // Get all active employees with salary
    const employees = await prisma.user.findMany({
        where: {
            isActive: true,
            salary: { not: null }
        },
        select: {
            id: true,
            name: true,
            salary: true
        }
    });

    const created: string[] = [];
    const skipped: string[] = [];

    for (const emp of employees) {
        // Check if already exists
        const existing = await prisma.payrollRecord.findUnique({
            where: {
                userId_period: {
                    userId: emp.id,
                    period
                }
            }
        });

        if (existing) {
            skipped.push(emp.name || emp.id);
            continue;
        }

        const baseSalary = Number(emp.salary);
        await prisma.payrollRecord.create({
            data: {
                userId: emp.id,
                period,
                baseSalary,
                overtime: 0,
                bonuses: 0,
                deductions: 0,
                netSalary: baseSalary,
                status: 'DRAFT'
            }
        });
        created.push(emp.name || emp.id);
    }

    revalidatePath('/hr/payroll');
    return { created, skipped };
}

/**
 * Get payroll summary for a period
 */
export async function getPayrollSummary(period: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    if (!['SUPERADMIN', 'ADMIN'].includes(currentUser.role)) {
        throw new Error('No tienes permisos para ver resumen de nóminas');
    }

    const records = await prisma.payrollRecord.findMany({
        where: { period }
    });

    const totals = records.reduce((acc, r) => ({
        count: acc.count + 1,
        baseSalary: acc.baseSalary + Number(r.baseSalary),
        overtime: acc.overtime + Number(r.overtime),
        bonuses: acc.bonuses + Number(r.bonuses),
        deductions: acc.deductions + Number(r.deductions),
        netSalary: acc.netSalary + Number(r.netSalary)
    }), { count: 0, baseSalary: 0, overtime: 0, bonuses: 0, deductions: 0, netSalary: 0 });

    const byStatus = {
        DRAFT: records.filter(r => r.status === 'DRAFT').length,
        PROCESSING: records.filter(r => r.status === 'PROCESSING').length,
        COMPLETED: records.filter(r => r.status === 'COMPLETED').length,
        PAID: records.filter(r => r.status === 'PAID').length
    };

    return { totals, byStatus };
}

// ============================================
// NOTIFICATIONS & ALERTS
// ============================================

/**
 * Get employees with expiring contracts (within X days)
 */
export async function getExpiringContracts(days: number = 30) {
    const session = await auth();
    if (!session?.user?.email) throw new Error('No autorizado');

    const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
    });
    if (!currentUser) throw new Error('Usuario no encontrado');

    if (!['SUPERADMIN', 'ADMIN', 'MANAGER'].includes(currentUser.role)) {
        throw new Error('No tienes permisos');
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const employees = await prisma.user.findMany({
        where: {
            isActive: true,
            contractEndDate: {
                gte: new Date(),
                lte: futureDate
            }
        },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            department: true,
            employeeCode: true,
            contractType: true,
            contractEndDate: true
        },
        orderBy: { contractEndDate: 'asc' }
    });

    return employees;
}

/**
 * Get available payroll periods (last 12 months + next month)
 */
export async function getPayrollPeriods() {
    const periods: { value: string; label: string }[] = [];
    const now = new Date();

    // Add next month
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    periods.push({
        value: `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`,
        label: nextMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    });

    // Add current and last 11 months
    for (let i = 0; i < 12; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        periods.push({
            value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
            label: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        });
    }

    return periods;
}
