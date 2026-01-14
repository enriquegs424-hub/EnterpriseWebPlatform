"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { checkPermission, logActivity, hasMinimumRole } from "@/lib/permissions";
import bcrypt from "bcryptjs";

/**
 * Verificar que el usuario es SUPERADMIN
 */
async function requireSuperAdmin() {
    const session = await auth();
    if (!session?.user) {
        throw new Error("No autenticado");
    }
    if ((session.user.role as string) !== "SUPERADMIN") {
        throw new Error("Acceso denegado: Solo SUPERADMIN");
    }
    return session.user;
}

// ============================================
// COMPANIES
// ============================================

export async function getCompanies() {
    await requireSuperAdmin();

    return prisma.company.findMany({
        include: {
            _count: {
                select: { users: true, projects: true },
            },
            settings: true,
        } as any,
        orderBy: { createdAt: "desc" },
    });
}

export async function getCompanyById(id: string) {
    await requireSuperAdmin();

    return prisma.company.findUnique({
        where: { id },
        include: {
            settings: true,
            users: {
                where: { role: "ADMIN" as any },
                select: { id: true, name: true, email: true, isActive: true },
            },
            _count: {
                select: { users: true, projects: true, invoices: true },
            },
        } as any,
    });
}

export async function createCompany(data: {
    name: string;
    slug: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
}) {
    const user = await requireSuperAdmin();

    // Check slug uniqueness
    const existing = await prisma.company.findUnique({
        where: { slug: data.slug },
    });
    if (existing) {
        throw new Error("El slug ya está en uso");
    }

    const company = await prisma.company.create({
        data: {
            ...data,
            settings: {
                create: {}, // Default settings
            },
        } as any,
    });

    await logActivity(user.id as string, "CREATE", "company", company.id, `Empresa creada: ${company.name}`);
    revalidatePath("/superadmin/companies");

    return company;
}

export async function updateCompany(
    id: string,
    data: {
        name?: string;
        slug?: string;
        email?: string;
        phone?: string;
        address?: string;
        taxId?: string;
        logo?: string;
        isActive?: boolean;
    }
) {
    const user = await requireSuperAdmin();

    // Check slug uniqueness if changing
    if (data.slug) {
        const existing = await prisma.company.findFirst({
            where: { slug: data.slug, NOT: { id } },
        });
        if (existing) {
            throw new Error("El slug ya está en uso");
        }
    }

    const company = await prisma.company.update({
        where: { id },
        data,
    });

    await logActivity(user.id as string, "UPDATE", "company", company.id, `Empresa actualizada: ${company.name}`);
    revalidatePath("/superadmin/companies");
    revalidatePath(`/superadmin/companies/${id}`);

    return company;
}

export async function deleteCompany(id: string) {
    const user = await requireSuperAdmin();

    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
        throw new Error("Empresa no encontrada");
    }

    // Soft delete - just deactivate
    await prisma.company.update({
        where: { id },
        data: { isActive: false },
    });

    await logActivity(user.id as string, "DELETE", "company", id, `Empresa desactivada: ${company.name}`);
    revalidatePath("/superadmin/companies");

    return { success: true };
}

// ============================================
// COMPANY SETTINGS (VETOS)
// ============================================

export async function getCompanySettings(companyId: string) {
    await requireSuperAdmin();

    let settings = await (prisma as any).companySettings.findUnique({
        where: { companyId },
    });

    // Create default settings if not exists
    if (!settings) {
        settings = await (prisma as any).companySettings.create({
            data: { companyId },
        });
    }

    return settings;
}

export async function updateCompanySettings(
    companyId: string,
    data: {
        canCreateUsers?: boolean;
        canDeleteUsers?: boolean;
        canChangeRoles?: boolean;
        canAccessInvoicing?: boolean;
        canAccessReports?: boolean;
        canExportData?: boolean;
        canViewAuditLogs?: boolean;
        canCreateGuests?: boolean;
        modulesEnabled?: string[];
    }
) {
    const user = await requireSuperAdmin();

    const settings = await (prisma as any).companySettings.upsert({
        where: { companyId },
        update: data,
        create: { companyId, ...data },
    });

    await logActivity(
        user.id as string,
        "UPDATE",
        "companySettings",
        companyId,
        `Configuración de empresa actualizada: ${JSON.stringify(data)}`
    );
    revalidatePath(`/superadmin/companies/${companyId}/settings`);

    return settings;
}

// ============================================
// ADMIN USERS
// ============================================

export async function createAdminForCompany(
    companyId: string,
    data: {
        name: string;
        email: string;
        password: string;
    }
) {
    const user = await requireSuperAdmin();

    // Check email uniqueness
    const existing = await prisma.user.findUnique({
        where: { email: data.email },
    });
    if (existing) {
        throw new Error("El email ya está registrado");
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const admin = await prisma.user.create({
        data: {
            name: data.name,
            email: data.email,
            passwordHash,
            role: "ADMIN",
            companyId,
        },
    });

    await logActivity(
        user.id as string,
        "CREATE",
        "user",
        admin.id,
        `Admin creado para empresa ${companyId}: ${admin.email}`
    );
    revalidatePath(`/superadmin/companies/${companyId}`);

    return { id: admin.id, name: admin.name, email: admin.email };
}

// ============================================
// GLOBAL AUDIT LOGS
// ============================================

export async function getGlobalLogs(options?: {
    page?: number;
    limit?: number;
    action?: string;
    companyId?: string;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
}) {
    await requireSuperAdmin();

    const page = options?.page ?? 1;
    const limit = options?.limit ?? 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options?.action) where.action = options.action;
    if (options?.companyId) where.companyId = options.companyId;
    if (options?.userId) where.userId = options.userId;
    if (options?.dateFrom || options?.dateTo) {
        where.createdAt = {};
        if (options.dateFrom) where.createdAt.gte = options.dateFrom;
        if (options.dateTo) where.createdAt.lte = options.dateTo;
    }

    const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
            where,
            include: {
                user: { select: { name: true, email: true } },
                company: { select: { name: true } },
            } as any,
            orderBy: { createdAt: "desc" },
            take: limit,
            skip,
        }),
        prisma.activityLog.count({ where }),
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}

// ============================================
// PLATFORM METRICS
// ============================================

export async function getPlatformMetrics() {
    await requireSuperAdmin();

    const [
        totalCompanies,
        activeCompanies,
        totalUsers,
        activeUsers,
        totalProjects,
        totalInvoices,
        recentLogs,
    ] = await Promise.all([
        prisma.company.count(),
        prisma.company.count({ where: { isActive: true } }),
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.project.count(),
        prisma.invoice.count(),
        prisma.activityLog.count({
            where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        }),
    ]);

    // Users by role
    const usersByRole = await prisma.user.groupBy({
        by: ["role"],
        _count: { role: true },
    });

    return {
        companies: { total: totalCompanies, active: activeCompanies },
        users: { total: totalUsers, active: activeUsers },
        projects: totalProjects,
        invoices: totalInvoices,
        activityLast24h: recentLogs,
        usersByRole: usersByRole.reduce(
            (acc, r) => ({ ...acc, [r.role]: r._count.role }),
            {} as Record<string, number>
        ),
    };
}
