"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPermission, auditCrud } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function getProjects() {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado");

    checkPermission(session.user.role, "projects", "read");

    const projects = await prisma.project.findMany({
        where: {
            companyId: session.user.companyId,
        },
        include: {
            client: {
                select: {
                    id: true,
                    name: true,
                },
            },
            _count: {
                select: {
                    tasks: true,
                    events: true,
                    documents: true,
                },
            },
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    return projects;
}

export async function createProject(data: {
    name: string;
    description?: string;
    clientId: string;
    startDate: Date;
    endDate?: Date;
    budget?: number;
}) {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado");

    checkPermission(session.user.role, "projects", "create");

    // Generate project code
    const count = await prisma.project.count({
        where: { companyId: session.user.companyId },
    });
    const code = `PRJ-${(count + 1).toString().padStart(4, "0")}`;

    const project = await prisma.project.create({
        data: {
            ...data,
            code,
            companyId: session.user.companyId,
            isActive: true,
        },
    });

    await auditCrud("CREATE", "Project", project.id, session.user.id, project);
    revalidatePath("/projects");

    return project;
}

export async function updateProject(
    id: string,
    data: {
        name?: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        budget?: number;
        isActive?: boolean;
    }
) {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado");

    checkPermission(session.user.role, "projects", "update");

    const project = await prisma.project.findUnique({
        where: { id },
    });

    if (!project || project.companyId !== session.user.companyId) {
        throw new Error("Proyecto no encontrado");
    }

    const updated = await prisma.project.update({
        where: { id },
        data,
    });

    await auditCrud("UPDATE", "Project", id, session.user.id, { before: project, after: updated });
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);

    return updated;
}

export async function deleteProject(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado");

    checkPermission(session.user.role, "projects", "delete");

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    tasks: true,
                    invoices: true,
                },
            },
        },
    });

    if (!project || project.companyId !== session.user.companyId) {
        throw new Error("Proyecto no encontrado");
    }

    // Prevent deletion if has tasks or invoices
    if (project._count.tasks > 0 || project._count.invoices > 0) {
        throw new Error("No se puede eliminar un proyecto con tareas o facturas asociadas");
    }

    await prisma.project.delete({ where: { id } });
    await auditCrud("DELETE", "Project", id, session.user.id, project);
    revalidatePath("/projects");

    return { success: true };
}

export async function getProjectStats() {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado");

    checkPermission(session.user.role, "projects", "read");

    const [total, active, completed, totalBudget] = await Promise.all([
        prisma.project.count({
            where: { companyId: session.user.companyId },
        }),
        prisma.project.count({
            where: {
                companyId: session.user.companyId,
                isActive: true,
                endDate: { gt: new Date() },
            },
        }),
        prisma.project.count({
            where: {
                companyId: session.user.companyId,
                isActive: false,
            },
        }),
        prisma.project.aggregate({
            where: { companyId: session.user.companyId },
            _sum: { budget: true },
        }),
    ]);

    return {
        total,
        active,
        completed,
        totalBudget: totalBudget._sum.budget || 0,
    };
}
