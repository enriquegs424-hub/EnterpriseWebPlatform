'use server';

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { checkPermission, auditCrud } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { validateCreateTimeEntry } from "@/lib/time-entry-validator";

/**
 * Save timer entry with full RBAC and validation
 */
export async function saveTimerEntry(data: {
    hours: number;
    projectId: string;
    notes?: string;
    startTime?: string;
    endTime?: string;
}) {
    const user = await getAuthenticatedUser();
    if (!user) return { error: 'No autorizado' };

    try {
        // RBAC check
        await checkPermission('timeentries', 'create');

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Validate project is active
        const project = await prisma.project.findUnique({
            where: { id: data.projectId },
        });

        if (!project || !project.isActive) {
            return { error: 'El proyecto no está activo o no existe' };
        }

        // Business validation
        const validation = await validateCreateTimeEntry({
            userId: user.id,
            projectId: data.projectId,
            date: today,
            startTime: data.startTime,
            endTime: data.endTime,
            hours: data.hours
        });

        if (!validation.valid) {
            return { error: validation.errors.join('; '), errors: validation.errors };
        }

        // Create entry
        const entry = await prisma.timeEntry.create({
            data: {
                userId: user.id,
                projectId: data.projectId,
                date: today,
                hours: data.hours,
                notes: data.notes || null,
                // Campos opcionales del schema mejorado
                // startTime: data.startTime || null,
                // endTime: data.endTime || null,
                // billable: true,
                // status: 'DRAFT' as any,
            } as any
        });

        await auditCrud('CREATE', 'TimeEntry', entry.id, entry);

        revalidatePath('/hours/daily');
        revalidatePath('/hours');
        revalidatePath('/dashboard');

        return {
            success: true,
            entry,
            warnings: validation.warnings
        };
    } catch (error: any) {
        console.error('Error saving timer entry:', error);
        return { error: error.message || 'Error al guardar el registro' };
    }
}
