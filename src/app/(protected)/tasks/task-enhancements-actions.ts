'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/(protected)/notifications/actions";

// ============================================
// TASK ATTACHMENTS
// ============================================

export async function addTaskAttachment(taskId: string, data: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'No autenticado' };
    }

    try {
        const attachment = await prisma.taskAttachment.create({
            data: {
                taskId,
                fileName: data.fileName,
                fileUrl: data.fileUrl,
                fileSize: data.fileSize,
                mimeType: data.mimeType,
                uploadedById: session.user.id
            },
            include: {
                uploadedBy: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        revalidatePath('/tasks');
        return { success: true, data: attachment };
    } catch (error) {
        console.error('[addTaskAttachment] Error:', error);
        return { success: false, error: 'Error al subir archivo' };
    }
}

export async function deleteTaskAttachment(attachmentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'No autenticado' };
    }

    try {
        await prisma.taskAttachment.delete({
            where: { id: attachmentId }
        });

        revalidatePath('/tasks');
        return { success: true };
    } catch (error) {
        console.error('[deleteTaskAttachment] Error:', error);
        return { success: false, error: 'Error al eliminar archivo' };
    }
}

// ============================================
// TASK LABELS
// ============================================

export async function addTaskLabel(taskId: string, data: {
    name: string;
    color: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'No autenticado' };
    }

    try {
        const label = await prisma.taskLabel.create({
            data: {
                taskId,
                name: data.name,
                color: data.color
            }
        });

        revalidatePath('/tasks');
        return { success: true, data: label };
    } catch (error) {
        console.error('[addTaskLabel] Error:', error);
        return { success: false, error: 'Error al crear etiqueta' };
    }
}

export async function deleteTaskLabel(labelId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'No autenticado' };
    }

    try {
        await prisma.taskLabel.delete({
            where: { id: labelId }
        });

        revalidatePath('/tasks');
        return { success: true };
    } catch (error) {
        console.error('[deleteTaskLabel] Error:', error);
        return { success: false, error: 'Error al eliminar etiqueta' };
    }
}

// ============================================
// TASK CHECKLIST ITEMS
// ============================================

export async function addChecklistItem(taskId: string, text: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'No autenticado' };
    }

    try {
        const maxOrder = await prisma.taskChecklistItem.findFirst({
            where: { taskId },
            orderBy: { order: 'desc' },
            select: { order: true }
        });

        const item = await prisma.taskChecklistItem.create({
            data: {
                taskId,
                text,
                order: (maxOrder?.order ?? -1) + 1
            }
        });

        revalidatePath('/tasks');
        return { success: true, data: item };
    } catch (error) {
        console.error('[addChecklistItem] Error:', error);
        return { success: false, error: 'Error al crear elemento' };
    }
}

export async function toggleChecklistItem(itemId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'No autenticado' };
    }

    try {
        const item = await prisma.taskChecklistItem.findUnique({
            where: { id: itemId }
        });

        if (!item) {
            return { success: false, error: 'Elemento no encontrado' };
        }

        const updated = await prisma.taskChecklistItem.update({
            where: { id: itemId },
            data: { completed: !item.completed }
        });

        revalidatePath('/tasks');
        return { success: true, data: updated };
    } catch (error) {
        console.error('[toggleChecklistItem] Error:', error);
        return { success: false, error: 'Error al actualizar elemento' };
    }
}

export async function deleteChecklistItem(itemId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'No autenticado' };
    }

    try {
        await prisma.taskChecklistItem.delete({
            where: { id: itemId }
        });

        revalidatePath('/tasks');
        return { success: true };
    } catch (error) {
        console.error('[deleteChecklistItem] Error:', error);
        return { success: false, error: 'Error al eliminar elemento' };
    }
}

// ============================================
// TASK COMMENTS
// ============================================

export async function addTaskComment(taskId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'No autenticado' };
    }

    try {
        const comment = await prisma.taskComment.create({
            data: {
                taskId,
                content,
                userId: session.user.id
            },
            include: {
                user: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: {
                assignedTo: true,
                assignees: true
            }
        });

        if (task) {
            const assigneeIds = new Set<string>();
            if (task.assignedToId && task.assignedToId !== session.user.id) {
                assigneeIds.add(task.assignedToId);
            }
            task.assignees?.forEach(a => {
                if (a.id !== session.user.id) assigneeIds.add(a.id);
            });

            for (const userId of assigneeIds) {
                await createNotification({
                    userId,
                    type: 'TASK_COMMENT',
                    title: 'Nuevo comentario en tarea',
                    message: `${session.user.name} comentó en "${task.title}"`,
                    link: `/tasks?taskId=${taskId}`
                });
            }
        }

        revalidatePath('/tasks');
        return { success: true, data: comment };
    } catch (error) {
        console.error('[addTaskComment] Error:', error);
        return { success: false, error: 'Error al crear comentario' };
    }
}

export async function deleteTaskComment(commentId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: 'No autenticado' };
    }

    try {
        const comment = await prisma.taskComment.findUnique({
            where: { id: commentId }
        });

        if (!comment || (comment.userId !== session.user.id && session.user.role !== 'ADMIN')) {
            return { success: false, error: 'No autorizado' };
        }

        await prisma.taskComment.delete({
            where: { id: commentId }
        });

        revalidatePath('/tasks');
        return { success: true };
    } catch (error) {
        console.error('[deleteTaskComment] Error:', error);
        return { success: false, error: 'Error al eliminar comentario' };
    }
}
