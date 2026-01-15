"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { checkPermission, logActivity } from "@/lib/permissions";
import { createNotification } from "@/app/(protected)/notifications/actions";

/**
 * Get current user's company ID
 */
async function getCompanyId(): Promise<string> {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado");

    const companyId = (session.user as any).companyId;
    if (!companyId) throw new Error("Usuario sin empresa asignada");

    return companyId;
}

// ============================================
// TEAMS
// ============================================

export async function getTeams() {
    const companyId = await getCompanyId();
    await checkPermission("teams", "read");

    return prisma.team.findMany({
        where: { companyId },
        include: {
            manager: { select: { id: true, name: true, email: true, image: true } },
            _count: { select: { members: true } },
        },
        orderBy: { name: "asc" },
    });
}

export async function getTeamById(id: string) {
    const companyId = await getCompanyId();
    await checkPermission("teams", "read");

    return prisma.team.findFirst({
        where: { id, companyId },
        include: {
            manager: { select: { id: true, name: true, email: true, image: true } },
            members: { select: { id: true, name: true, email: true, image: true, role: true } },
            project: { select: { id: true, code: true, name: true } },
        },
    });
}

export async function createTeam(data: { name: string; description?: string; managerId?: string }) {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado");

    const companyId = await getCompanyId();
    await checkPermission("teams", "create");

    const team = await prisma.team.create({
        data: {
            name: data.name,
            description: data.description,
            companyId,
            managerId: data.managerId,
        },
    });

    await logActivity(session.user.id as string, "CREATE", "team", team.id, `Equipo creado: ${team.name}`);
    revalidatePath("/admin/teams");

    return team;
}

export async function updateTeam(id: string, data: { name?: string; description?: string; managerId?: string | null; projectId?: string | null }) {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado");

    const companyId = await getCompanyId();
    await checkPermission("teams", "update");

    // Verify team belongs to company
    const existing = await prisma.team.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Equipo no encontrado");

    const team = await prisma.team.update({
        where: { id },
        data,
    });

    await logActivity(session.user.id as string, "UPDATE", "team", team.id, `Equipo actualizado: ${team.name}`);
    revalidatePath("/admin/teams");
    revalidatePath(`/admin/teams/${id}`);

    return team;
}

export async function deleteTeam(id: string) {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado");

    const companyId = await getCompanyId();
    await checkPermission("teams", "delete");

    const team = await prisma.team.findFirst({ where: { id, companyId } });
    if (!team) throw new Error("Equipo no encontrado");

    await prisma.team.delete({ where: { id } });

    await logActivity(session.user.id as string, "DELETE", "team", id, `Equipo eliminado: ${team.name}`);
    revalidatePath("/admin/teams");

    return { success: true };
}

export async function addTeamMember(teamId: string, userId: string) {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado");

    const companyId = await getCompanyId();
    await checkPermission("teams", "update");

    // Verify team belongs to company
    const team = await prisma.team.findFirst({ where: { id: teamId, companyId } });
    if (!team) throw new Error("Equipo no encontrado");

    // Verify user belongs to same company
    const user = await prisma.user.findFirst({ where: { id: userId, companyId } });
    if (!user) throw new Error("Usuario no encontrado");

    await prisma.team.update({
        where: { id: teamId },
        data: {
            members: { connect: { id: userId } },
        },
    });

    await logActivity(
        session.user.id as string,
        "UPDATE",
        "team",
        teamId,
        `Miembro añadido: ${user.name}`
    );

    // Send notification to the added user
    await createNotification({
        userId,
        type: "SYSTEM",
        title: "Has sido añadido a un equipo",
        message: `Ahora eres miembro del equipo "${team.name}"`,
        link: `/admin/teams/${teamId}`,
    });

    revalidatePath(`/admin/teams/${teamId}`);

    return { success: true };
}

export async function removeTeamMember(teamId: string, userId: string) {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado");

    const companyId = await getCompanyId();
    await checkPermission("teams", "update");

    const team = await prisma.team.findFirst({ where: { id: teamId, companyId } });
    if (!team) throw new Error("Equipo no encontrado");

    await prisma.team.update({
        where: { id: teamId },
        data: {
            members: { disconnect: { id: userId } },
        },
    });

    await logActivity(
        session.user.id as string,
        "UPDATE",
        "team",
        teamId,
        `Miembro eliminado: ${userId}`
    );
    revalidatePath(`/admin/teams/${teamId}`);

    return { success: true };
}

// ============================================
// USERS FOR TEAM ASSIGNMENT
// ============================================

export async function getCompanyUsers() {
    const companyId = await getCompanyId();
    await checkPermission("users", "read");

    return prisma.user.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true, email: true, image: true, role: true },
        orderBy: { name: "asc" },
    });
}

export async function getManagerCandidates() {
    const companyId = await getCompanyId();
    await checkPermission("users", "read");

    return prisma.user.findMany({
        where: {
            companyId,
            isActive: true,
            role: { in: ["ADMIN", "MANAGER"] },
        },
        select: { id: true, name: true, email: true },
        orderBy: { name: "asc" },
    });
}

/**
 * Get users available to add to a specific team (not already members)
 */
export async function getAvailableUsers(teamId: string) {
    const companyId = await getCompanyId();
    await checkPermission("teams", "read");

    // Get current team members
    const team = await prisma.team.findFirst({
        where: { id: teamId, companyId },
        select: { members: { select: { id: true } } },
    });

    const memberIds = team?.members.map(m => m.id) || [];

    return prisma.user.findMany({
        where: {
            companyId,
            isActive: true,
            id: { notIn: memberIds },
        },
        select: { id: true, name: true, email: true, image: true, role: true, department: true },
        orderBy: { name: "asc" },
    });
}

/**
 * Get projects for linking to a team
 */
export async function getProjectsForTeam() {
    const companyId = await getCompanyId();
    await checkPermission("projects", "read");

    return prisma.project.findMany({
        where: { companyId, isActive: true },
        select: { id: true, code: true, name: true },
        orderBy: { name: "asc" },
    });
}

/**
 * Create a GROUP chat for the team members
 */
export async function createTeamChat(teamId: string) {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado");

    const companyId = await getCompanyId();
    await checkPermission("teams", "update");

    const team = await prisma.team.findFirst({
        where: { id: teamId, companyId },
        include: { members: { select: { id: true } }, manager: { select: { id: true } } },
    });

    if (!team) throw new Error("Equipo no encontrado");
    if (team.chatId) throw new Error("Este equipo ya tiene un chat");

    // Collect all member IDs including manager
    const memberIds = team.members.map(m => m.id);
    if (team.manager && !memberIds.includes(team.manager.id)) {
        memberIds.push(team.manager.id);
    }

    if (memberIds.length < 2) {
        throw new Error("El equipo necesita al menos 2 miembros para crear un chat");
    }

    // Create the GROUP chat
    const chat = await prisma.chat.create({
        data: {
            type: "GROUP",
            name: team.name,  // Just the team name, no prefix
            members: {
                create: memberIds.map(userId => ({
                    userId,
                    role: userId === team.managerId ? "ADMIN" : "MEMBER",
                })),
            },
        },
    });

    // Update team with chatId
    await prisma.team.update({
        where: { id: teamId },
        data: { chatId: chat.id },
    });

    await logActivity(
        session.user.id as string,
        "CREATE",
        "chat",
        chat.id,
        `Chat de equipo creado: ${team.name}`
    );

    // Notify all members about the new chat
    for (const userId of memberIds) {
        if (userId !== session.user.id) {
            await createNotification({
                userId,
                type: "SYSTEM",
                title: "Nuevo chat de equipo",
                message: `Se ha creado un chat para el equipo "${team.name}"`,
                link: `/chat`,
            });
        }
    }

    revalidatePath(`/admin/teams/${teamId}`);

    return chat;
}

/**
 * Create a task for all team members
 */
export async function createTeamTask(teamId: string, taskData: {
    title: string;
    description?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    type: 'GENERAL' | 'PROJECT' | 'MEETING' | 'REVIEW' | 'MAINTENANCE';
    dueDate?: string;
    projectId?: string;
}) {
    const session = await auth();
    if (!session?.user) throw new Error("No autenticado");

    const companyId = await getCompanyId();
    await checkPermission("tasks", "create");

    // Get team with members
    const team = await prisma.team.findFirst({
        where: { id: teamId, companyId },
        include: {
            members: { select: { id: true, name: true } },
            project: { select: { id: true } }
        },
    });

    if (!team) throw new Error("Equipo no encontrado");
    if (team.members.length === 0) throw new Error("El equipo no tiene miembros");

    const createdTasks: any[] = [];

    // Use team's linked project if not specified
    const projectId = taskData.projectId || team.project?.id || null;

    // Create a task for each member
    for (const member of team.members) {
        const task = await prisma.task.create({
            data: {
                title: taskData.title,
                description: taskData.description,
                priority: taskData.priority,
                type: taskData.type,
                dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
                assignedToId: member.id,
                createdById: session.user.id as string,
                projectId,
            },
        });

        createdTasks.push(task);

        // Notify each team member
        await createNotification({
            userId: member.id,
            type: "TASK_ASSIGNED",
            title: "Nueva tarea de equipo",
            message: `${session.user.name} ha asignado al equipo "${team.name}": ${taskData.title}`,
            link: `/tasks`,
        });
    }

    await logActivity(
        session.user.id as string,
        "CREATE",
        "task",
        teamId,
        `Tarea de equipo creada: ${taskData.title} (${createdTasks.length} tareas)`
    );

    revalidatePath("/tasks");
    revalidatePath(`/admin/teams/${teamId}`);

    return { success: true, count: createdTasks.length };
}
