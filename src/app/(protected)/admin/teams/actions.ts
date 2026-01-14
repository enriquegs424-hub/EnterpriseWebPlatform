"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { checkPermission, logActivity } from "@/lib/permissions";

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

export async function updateTeam(id: string, data: { name?: string; description?: string; managerId?: string | null }) {
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
