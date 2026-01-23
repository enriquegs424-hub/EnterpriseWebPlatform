'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/app/(protected)/notifications/actions";
import { auditCrud, checkPermission } from "@/lib/permissions";
import { TaskStateMachine } from "@/lib/state-machine";

export async function getAllTasks(filters?: {
    status?: string;
    priority?: string;
    assignedToId?: string;
    projectId?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Check permission
    await checkPermission('tasks', 'read');

    const where: any = {};

    // Si no es admin, solo ver tareas asignadas (directa o múltiples) o creadas por el usuario
    if (session.user.role !== 'ADMIN') {
        where.OR = [
            { assignedToId: session.user.id },
            { assignees: { some: { id: session.user.id } } },
            { createdById: session.user.id }
        ];
    }

    if (filters?.status) where.status = filters.status;
    if (filters?.priority) where.priority = filters.priority;
    if (filters?.projectId) where.projectId = filters.projectId;

    // Filter by assignee (check both fields)
    if (filters?.assignedToId) {
        // If specific logic implies filtering by WHO is assigned
        // We override the OR above if we want specific filtering, but usually filters are ANDed with permissions.
        // We need to be careful not to break the permission scope.
        // Actually, if a user filters by "assignedToId=X", they want tasks assigned to X.
        const assigneeFilter = {
            OR: [
                { assignedToId: filters.assignedToId },
                { assignees: { some: { id: filters.assignedToId } } }
            ]
        };

        if (where.OR) {
            where.AND = [assigneeFilter];
        } else {
            where.OR = assigneeFilter.OR;
        }
    }

    return await prisma.task.findMany({
        where,
        include: {
            assignedTo: {
                select: { id: true, name: true, email: true, image: true }
            },
            assignees: {
                select: { id: true, name: true, email: true, image: true }
            },
            createdBy: {
                select: { id: true, name: true, image: true }
            },
            project: {
                select: { id: true, code: true, name: true }
            },
            comments: {
                include: {
                    user: {
                        select: { id: true, name: true, image: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            },
            attachments: {
                include: {
                    uploadedBy: {
                        select: { id: true, name: true, image: true }
                    }
                },
                orderBy: { createdAt: 'desc' }
            },
            labels: {
                orderBy: { createdAt: 'asc' }
            },
            checklistItems: {
                orderBy: { order: 'asc' }
            }
        },
        orderBy: [
            { status: 'asc' },
            { priority: 'desc' },
            { dueDate: 'asc' }
        ]
    } as any);
}

// Obtener mis tareas
export async function getMyTasks() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await prisma.task.findMany({
        where: {
            OR: [
                { assignedToId: session.user.id },
                { assignees: { some: { id: session.user.id } } }
            ],
            status: { not: 'COMPLETED' }
        },
        include: {
            createdBy: {
                select: { id: true, name: true }
            },
            project: {
                select: { id: true, code: true, name: true }
            },
            assignees: {
                select: { id: true, name: true, image: true }
            }
        },
        orderBy: [
            { priority: 'desc' },
            { dueDate: 'asc' }
        ]
    } as any);
}

// Crear tarea
export async function createTask(data: {
    title: string;
    description?: string;
    priority: string;
    type: string;
    dueDate?: string;
    assignedToId?: string;       // Legacy / Primary
    assignedToIds?: string[];    // New multiple
    projectId?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    // Check permission
    await checkPermission('tasks', 'create');

    try {
        // Prepare assignees
        const assigneeIds = new Set<string>();
        if (data.assignedToIds) data.assignedToIds.forEach(id => assigneeIds.add(id));
        if (data.assignedToId) assigneeIds.add(data.assignedToId);

        const assigneesList = Array.from(assigneeIds);
        const primaryAssignee = data.assignedToId || assigneesList[0] || null;

        const task = await prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                priority: data.priority as any,
                type: data.type as any,
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                assignedToId: primaryAssignee || undefined,
                createdById: session.user.id,
                projectId: data.projectId || null,
                assignees: {
                    connect: assigneesList.map(id => ({ id }))
                }
            } as any,
            include: {
                assignedTo: true,
                assignees: true,
                project: true
            } as any
        });

        // Crear notificación para los asignados
        for (const userId of assigneesList) {
            if (userId !== session.user.id) { // Don't notify self
                await createNotification({
                    userId,
                    type: 'TASK_ASSIGNED',
                    title: 'Nueva tarea asignada',
                    message: `${session.user.name} te ha asignado: ${data.title}`,
                    link: `/tasks/${task.id}`,
                    senderId: session.user.id
                });
            }
        }

        // Audit log
        await auditCrud('CREATE', 'Task', task.id, { title: data.title, assignees: assigneesList });

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

        // Check permission with ownership
        await checkPermission('tasks', 'update', { ownerId: task.createdById });

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
                link: `/tasks/${taskId}`,
                senderId: session.user.id
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

        // Check permission with ownership (delete requires ownership or admin)
        await checkPermission('tasks', 'delete', { ownerId: task.createdById });

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
        if (task.assignedToId && task.assignedToId !== session.user.id) {
            await createNotification({
                userId: task.assignedToId,
                type: 'TASK_COMMENT',
                title: 'Nuevo comentario en tarea',
                message: `${session.user.name} comentó en: ${task.title}`,
                link: `/tasks/${taskId}`,
                senderId: session.user.id
            });
        }

        // Notificar al creador si no es quien comenta
        if (task.createdById !== session.user.id && task.createdById !== task.assignedToId) {
            await createNotification({
                userId: task.createdById,
                type: 'TASK_COMMENT',
                title: 'Nuevo comentario en tarea',
                message: `${session.user.name} comentó en: ${task.title}`,
                link: `/tasks/${taskId}`,
                senderId: session.user.id
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

// Obtener usuarios para asignar tareas (versión ligera sin permisos de admin)
export async function getUsersForAssignment() {
    const session = await auth();
    if (!session?.user?.id) return [];

    // Solo requiere estar autenticado y en la misma empresa
    // No requiere "users:read" permiso estricto

    const users = await prisma.user.findMany({
        where: {
            companyId: (session.user as any).companyId as string,
            isActive: true,
        },
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            image: true,
            isActive: true
        },
        orderBy: {
            name: 'asc'
        }
    });

    console.log(`[getUsersForAssignment] Found ${users.length} users for company ${(session.user as any).companyId}`);
    return users;
}
