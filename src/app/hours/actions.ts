'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkPermission } from "@/lib/permissions";

const TimeEntrySchema = z.object({
    projectId: z.string().min(1, "Project is required"),
    date: z.string(),
    hours: z.number().min(0.1, "Minimum 0.1 hours").max(24, "Maximum 24 hours"),
    notes: z.string().optional(),
});

export async function submitTimeEntry(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    // Check permission
    await checkPermission('timeentries', 'create');

    const rawData = {
        projectId: formData.get("projectId"),
        date: formData.get("date"),
        hours: Number(formData.get("hours")),
        notes: formData.get("notes"),
    };

    const validatedFields = TimeEntrySchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            error: "Validation failed",
            issues: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { projectId, date, hours, notes } = validatedFields.data;

    // Business Logic: Check if project is active
    const project = await prisma.project.findUnique({
        where: { id: projectId },
    });

    if (!project || !project.isActive) {
        return { error: "Project is not active or does not exist." };
    }

    // Create entry
    try {
        await prisma.timeEntry.create({
            data: {
                userId: session.user.id,
                projectId,
                date: new Date(date),
                hours,
                notes,
            },
        });
    } catch (error) {
        console.error(error);
        return { error: "Database error: Failed to create entry." };
    }

    revalidatePath("/hours/daily");
    return { success: true, message: "Entry saved successfully!" };
}

export async function getActiveProjects() {
    try {
        return await prisma.project.findMany({
            where: { isActive: true },
            orderBy: { code: 'asc' },
            select: { id: true, code: true, name: true },
        });
    } catch (e) {
        return [];
    }
}

export async function updateTimeEntry(id: string, data: any) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    // Get the entry
    const entry = await prisma.timeEntry.findUnique({
        where: { id },
    });

    if (!entry) {
        return { error: "Entrada no encontrada" };
    }

    // Check permission with ownership
    await checkPermission('timeentries', 'update', entry.userId);

    // Check permission: Own entry + within 24h OR admin
    const isOwner = entry.userId === session.user.id;
    const createdAt = new Date(entry.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const within24h = hoursSinceCreation < 24;

    // @ts-ignore
    const isAdmin = session.user.role === 'ADMIN';
    const canEdit = isAdmin || (isOwner && within24h);

    if (!canEdit) {
        return { error: "No tienes permiso para editar esta entrada (límite de 24h superado)" };
    }

    // Validate project is active
    const project = await prisma.project.findUnique({
        where: { id: data.projectId },
    });

    if (!project || !project.isActive) {
        return { error: "El proyecto no está activo" };
    }

    try {
        await prisma.timeEntry.update({
            where: { id },
            data: {
                projectId: data.projectId,
                date: new Date(data.date),
                hours: parseFloat(data.hours),
                notes: data.notes,
            },
        });

        revalidatePath('/hours/daily');
        return { success: true, message: "Entrada actualizada correctamente" };
    } catch (error) {
        return { error: "Error al actualizar la entrada" };
    }
}

export async function deleteTimeEntry(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: "Unauthorized" };
    }

    const entry = await prisma.timeEntry.findUnique({
        where: { id },
    });

    if (!entry) {
        return { error: "Entrada no encontrada" };
    }

    // Check permission
    const isOwner = entry.userId === session.user.id;
    const createdAt = new Date(entry.createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    const within24h = hoursSinceCreation < 24;

    // @ts-ignore
    const isAdmin = session.user.role === 'ADMIN';
    const canDelete = isAdmin || (isOwner && within24h);

    if (!canDelete) {
        return { error: "No tienes permiso para eliminar esta entrada (límite de 24h superado)" };
    }

    try {
        await prisma.timeEntry.delete({
            where: { id },
        });

        revalidatePath('/hours/daily');
        return { success: true, message: "Entrada eliminada correctamente" };
    } catch (error) {
        return { error: "Error al eliminar la entrada" };
    }
}

export async function getDailyEntries(dateParam: string) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const date = new Date(dateParam);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return await prisma.timeEntry.findMany({
        where: {
            userId: session.user.id,
            date: {
                gte: start,
                lte: end,
            },
        },
        include: {
            project: { select: { code: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}
