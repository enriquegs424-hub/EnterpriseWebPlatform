'use server';

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { checkPermission, auditCrud } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function getAllProjects() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("projects", "read");

    return await prisma.project.findMany({
        where: {
            companyId: user.companyId as string,
        },
        orderBy: { year: 'desc' },
        include: {
            client: {
                select: {
                    id: true,
                    name: true
                }
            },
            _count: {
                select: {
                    tasks: true,
                    documents: true,
                    invoices: true,
                }
            }
        }
    });
}

export async function createProject(data: {
    name: string;
    year: number;
    department: string;
    clientId?: string;
}) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("projects", "create");

    // Generate unique project code
    const count = await prisma.project.count({
        where: { companyId: user.companyId as string },
    });
    const code = `PRJ-${(count + 1).toString().padStart(4, "0")}`;

    const project = await prisma.project.create({
        data: {
            code,
            name: data.name,
            year: data.year,
            department: data.department as any,
            isActive: true,
            companyId: user.companyId as string,
            clientId: data.clientId || null,
        }
    });

    await auditCrud('CREATE', 'Project', project.id, project);
    revalidatePath('/admin/projects');
    revalidatePath('/projects');

    return project;
}

export async function updateProject(id: string, data: {
    name?: string;
    year?: number;
    department?: string;
    isActive?: boolean;
    clientId?: string | null;
}) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("projects", "update");

    const project = await prisma.project.findUnique({
        where: { id },
    });

    if (!project) throw new Error("Proyecto no encontrado");
    if (project.companyId !== user.companyId) throw new Error("Proyecto no pertenece a tu empresa");

    const updated = await prisma.project.update({
        where: { id },
        data: {
            name: data.name,
            year: data.year,
            department: data.department as any,
            isActive: data.isActive,
            clientId: data.clientId,
        }
    });

    await auditCrud('UPDATE', 'Project', id, { before: project, after: updated });
    revalidatePath('/admin/projects');
    revalidatePath('/projects');
    revalidatePath(`/projects/${id}`);

    return updated;
}

export async function toggleProjectStatus(id: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("projects", "update");

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) throw new Error("Proyecto no encontrado");
    if (project.companyId !== user.companyId) throw new Error("Proyecto no pertenece a tu empresa");

    const updated = await prisma.project.update({
        where: { id },
        data: { isActive: !project.isActive }
    });

    await auditCrud('UPDATE', 'Project', id, {
        action: 'toggle_status',
        from: project.isActive,
        to: updated.isActive
    });
    revalidatePath('/admin/projects');
    revalidatePath('/projects');

    return updated;
}

export async function deleteProject(id: string) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("projects", "delete");

    const project = await prisma.project.findUnique({
        where: { id },
        include: {
            _count: {
                select: {
                    tasks: true,
                    invoices: true,
                    timeEntries: true,
                }
            }
        }
    });

    if (!project) throw new Error("Proyecto no encontrado");
    if (project.companyId !== user.companyId) throw new Error("Proyecto no pertenece a tu empresa");

    // Prevent deletion if has related data
    if (project._count.tasks > 0 || project._count.invoices > 0 || project._count.timeEntries > 0) {
        throw new Error("No se puede eliminar un proyecto con tareas, facturas o horas registradas");
    }

    await prisma.project.delete({ where: { id } });
    await auditCrud('DELETE', 'Project', id, { code: project.code, name: project.name });
    revalidatePath('/admin/projects');
    revalidatePath('/projects');

    return { success: true };
}

export async function getProjectStats() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("projects", "read");

    const [total, active, completed] = await Promise.all([
        prisma.project.count({
            where: { companyId: user.companyId as string },
        }),
        prisma.project.count({
            where: {
                companyId: user.companyId as string,
                isActive: true,
            },
        }),
        prisma.project.count({
            where: {
                companyId: user.companyId as string,
                isActive: false,
            },
        }),
    ]);

    return { total, active, completed };
}
