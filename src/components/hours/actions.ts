'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function saveTimerEntry(data: {
    hours: number;
    projectId: string;
    notes?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await prisma.timeEntry.create({
            data: {
                userId: session.user.id,
                projectId: data.projectId,
                date: today,
                hours: data.hours,
                notes: data.notes || null,
            }
        });

        revalidatePath('/hours/daily');
        revalidatePath('/dashboard');

        return { success: true };
    } catch (error) {
        console.error('Error saving timer entry:', error);
        return { error: 'Error al guardar el registro' };
    }
}
