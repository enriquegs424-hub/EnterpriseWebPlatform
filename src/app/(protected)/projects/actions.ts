"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { checkPermission, auditCrud } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

export async function getProjects() {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("projects", "read");

    const projects = await prisma.project.findMany({
        where: {
            companyId: user.companyId as string,
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
            year: "desc",
        },
    });

    return projects;
}

export async function createProject(data: {
    name: string;
    description?: string;
    clientId: string;
    year: number;
}) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("projects", "create");

    // Generate project code
    const count = await prisma.project.count({
        where: { companyId: user.companyId as string },
    });
    const code = `PRJ-${(count + 1).toString().padStart(4, "0")}`;

    const project = await prisma.project.create({
        data: {
            name: data.name,
            clientId: data.clientId,
            year: data.year,
            code,
            companyId: user.companyId as string,
            isActive: true,
        },
    });

    // AUTO-CREATE: Project folder in Documents
    try {
        await prisma.folder.create({
            data: {
                name: code, // Use project code as folder name
                description: `Carpeta del proyecto ${data.name}`,
                projectId: project.id,
                createdById: user.id,
            },
        });
    } catch (error) {
        console.error('Error creating project folder:', error);
    }

    // AUTO-CREATE: Project chat (type: PROJECT)
    try {
        const chat = await prisma.chat.create({
            data: {
                type: 'PROJECT',
                name: data.name,
                projectId: project.id,
            },
        });

        // Add creator as first member
        await prisma.chatMember.create({
            data: {
                chatId: chat.id,
                userId: user.id,
                role: 'ADMIN',
            },
        });
    } catch (error) {
        console.error('Error creating project chat:', error);
    }

    await auditCrud("CREATE", "Project", project.id, project);
    revalidatePath("/projects");

    return project;
}

export async function updateProject(
    id: string,
    data: {
        name?: string;
        isActive?: boolean;
    }
) {
    const user = await getAuthenticatedUser();
    if (!user) throw new Error("No autenticado");

    await checkPermission("projects", "update");

    const project = await prisma.project.findUnique({
        where: { id },
    });

    if (!project || project.companyId !== user.companyId) {
        throw new Error("Proyecto no encontrado");
    }

    const updated = await prisma.project.update({
        where: { id },
        data,
    });

    await auditCrud("UPDATE", "Project", id, { before: project, after: updated });
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);

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
                },
            },
        },
    });

    if (!project || project.companyId !== user.companyId) {
        throw new Error("Proyecto no encontrado");
    }

    // Prevent deletion if has tasks or invoices
    if (project._count.tasks > 0 || project._count.invoices > 0) {
        throw new Error("No se puede eliminar un proyecto con tareas o facturas asociadas");
    }

    await prisma.project.delete({ where: { id } });
    await auditCrud("DELETE", "Project", id, project);
    revalidatePath("/projects");

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

    return {
        total,
        active,
        completed,
    };
}
