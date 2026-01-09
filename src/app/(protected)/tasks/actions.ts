'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/(protected)/notifications/actions";
import { auditCrud } from "@/lib/permissions";
import { TaskStateMachine } from "@/lib/state-machine";

// Obtener todas las tareas
export async function getAllTasks(filters?: {
    status?: string;
    priority?: string;
    assignedToId?: string;
    projectId?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return [];

    const where: any = {};

    // Si no es admin, solo ver tareas asignadas o creadas por el usuario
    if (session.user.role !== 'ADMIN') {
        where.OR = [
            { assignedToId: session.user.id },
            { createdById: session.user.id }
        ];
    }

    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.projectId) where.projectId = filters.projectId;

    return await prisma.task.findMany({
        where,
        include: {
            assignedTo: {
                select: { id: true, name: true, email: true }
            },
            createdBy: {
                select: { id: true, name: true }
            },
            project: {
                select: { id: true, code: true, name: true }
            },
            comments: {
                include: {
                    user: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }
        },
        orderBy: [
            { status: 'asc' },
            { priority: 'desc' },
            { dueDate: 'asc' }
        ]
    });
}

// Obtener mis tareas
export async function getMyTasks() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await prisma.task.findMany({
        where: {
            assignedToId: session.user.id,
            status: { not: 'COMPLETED' }
        },
        include: {
            createdBy: {
                select: { id: true, name: true }
            },
            project: {
                select: { id: true, code: true, name: true }
            }
        },
        orderBy: [
            { priority: 'desc' },
            { dueDate: 'asc' }
        ]
    });
}

// Crear tarea
export async function createTask(data: {
    title: string;
    description?: string;
    priority: string;
    type: string;
    dueDate?: string;
    assignedToId: string;
    projectId?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                priority: data.priority as any,
                type: data.type as any,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                assignedToId: data.assignedToId,
                createdById: session.user.id,
                projectId: data.projectId || null,
            },
            include: {
                assignedTo: true,
                project: true
            }
        });

        // Crear notificación para el asignado
        await createNotification({
            userId: data.assignedToId,
            type: 'TASK_ASSIGNED',
            title: 'Nueva tarea asignada',
            message: `${session.user.name} te ha asignado: ${data.title}`,
            link: `/tasks/${task.id}`
        });

        // Audit log
        await auditCrud('CREATE', 'Task', task.id, { title: data.title, assignedToId: data.assignedToId });

        revalidatePath('/tasks');
        return { success: true, task };
    } catch (error) {
        console.error('Error creating task:', error);
        return { error: 'Error al crear la tarea' };
    }
}

// Actualizar tarea
export async function updateTask(taskId: string, data: {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    dueDate?: string;
    assignedToId?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { assignedTo: true, createdBy: true }
        });

        if (!task) return { error: 'Tarea no encontrada' };

        // Solo el creador, asignado o admin pueden actualizar
        const canUpdate = session.user.role === 'ADMIN' ||
            task.createdById === session.user.id ||
            task.assignedToId === session.user.id;

        if (!canUpdate) return { error: 'No tienes permiso para actualizar esta tarea' };

        // Validar transición de estado si se está cambiando
        if (data.status && data.status !== task.status) {
            try {
                TaskStateMachine.transition(task.status, data.status);
            } catch (e: any) {
                return { error: e.message };
            }
        }

        const updated = await prisma.task.update({
            where: { id: taskId },
            data: {
                ...(data.title && { title: data.title }),
                ...(data.description !== undefined && { description: data.description }),
                ...(data.status && {
                    status: data.status as any,
                    ...(data.status === 'COMPLETED' && { completedAt: new Date() })
                }),
                ...(data.priority && { priority: data.priority as any }),
                ...(data.dueDate && { dueDate: new Date(data.dueDate) }),
                ...(data.assignedToId && { assignedToId: data.assignedToId }),
            }
        });

        // Audit log
        await auditCrud('UPDATE', 'Task', taskId, data);

        // Notificar si se completó
        if (data.status === 'COMPLETED' && task.createdById !== session.user.id) {
            await createNotification({
                userId: task.createdById,
                type: 'TASK_COMPLETED',
                title: 'Tarea completada',
                message: `${session.user.name} ha completado: ${task.title}`,
                link: `/tasks/${taskId}`
            });
        }

        revalidatePath('/tasks');
        return { success: true, task: updated };
    } catch (error) {
        console.error('Error updating task:', error);
        return { error: 'Error al actualizar la tarea' };
    }
}

// Eliminar tarea
export async function deleteTask(taskId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId }
        });

        if (!task) return { error: 'Tarea no encontrada' };

        // Solo el creador o admin pueden eliminar
        if (session.user.role !== 'ADMIN' && task.createdById !== session.user.id) {
            return { error: 'No tienes permiso para eliminar esta tarea' };
        }

        await prisma.task.delete({
            where: { id: taskId }
        });

        // Audit log
        await auditCrud('DELETE', 'Task', taskId, { title: task.title });

        revalidatePath('/tasks');
        return { success: true };
    } catch (error) {
        return { error: 'Error al eliminar la tarea' };
    }
}

// Agregar comentario
export async function addTaskComment(taskId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { assignedTo: true, createdBy: true }
        });

        if (!task) return { error: 'Tarea no encontrada' };

        const comment = await prisma.taskComment.create({
            data: {
                content,
                taskId,
                userId: session.user.id
            },
            include: {
                user: {
                    select: { id: true, name: true }
                }
            }
        });

        // Notificar al asignado si no es quien comenta
        if (task.assignedToId !== session.user.id) {
            await createNotification({
                userId: task.assignedToId,
                type: 'TASK_COMMENT',
                title: 'Nuevo comentario en tarea',
                message: `${session.user.name} comentó en: ${task.title}`,
                link: `/tasks/${taskId}`
            });
        }

        // Notificar al creador si no es quien comenta
        if (task.createdById !== session.user.id && task.createdById !== task.assignedToId) {
            await createNotification({
                userId: task.createdById,
                type: 'TASK_COMMENT',
                title: 'Nuevo comentario en tarea',
                message: `${session.user.name} comentó en: ${task.title}`,
                link: `/tasks/${taskId}`
            });
        }

        revalidatePath(`/tasks/${taskId}`);
        return { success: true, comment };
    } catch (error) {
        return { error: 'Error al agregar comentario' };
    }
}

// Obtener estadísticas de tareas
export async function getTaskStats(projectId?: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    const where: any = {};

    if (session.user.role !== 'ADMIN') {
        where.OR = [
            { assignedToId: session.user.id },
            { createdById: session.user.id }
        ];
    }

    if (projectId) {
        where.projectId = projectId;
    }

    const [total, pending, inProgress, completed, overdue] = await Promise.all([
        prisma.task.count({ where }),
        prisma.task.count({ where: { ...where, status: 'PENDING' } }),
        prisma.task.count({ where: { ...where, status: 'IN_PROGRESS' } }),
        prisma.task.count({ where: { ...where, status: 'COMPLETED' } }),
        prisma.task.count({
            where: {
                ...where,
                status: { not: 'COMPLETED' },
                dueDate: { lt: new Date() }
            }
        })
    ]);

    return { total, pending, inProgress, completed, overdue };
}
