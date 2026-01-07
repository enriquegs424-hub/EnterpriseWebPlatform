'use server';

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// Crear notificación
export async function createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    link?: string;
}) {
    try {
        await prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type as any,
                title: data.title,
                message: data.message,
                link: data.link,
            }
        });
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// Obtener notificaciones del usuario
export async function getMyNotifications() {
    const session = await auth();
    if (!session?.user?.id) return [];

    return await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
    });
}

// Marcar notificación como leída
export async function markNotificationAsRead(notificationId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        await prisma.notification.update({
            where: { id: notificationId },
            data: { isRead: true }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { error: 'Error al marcar notificación' };
    }
}

// Marcar todas como leídas
export async function markAllNotificationsAsRead() {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                isRead: false
            },
            data: { isRead: true }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { error: 'Error al marcar notificaciones' };
    }
}

// Obtener contador de no leídas
export async function getUnreadCount() {
    const session = await auth();
    if (!session?.user?.id) return 0;

    return await prisma.notification.count({
        where: {
            userId: session.user.id,
            isRead: false
        }
    });
}

// Eliminar notificación
export async function deleteNotification(notificationId: string) {
    const session = await auth();
    if (!session?.user?.id) return { error: 'No autorizado' };

    try {
        await prisma.notification.delete({
            where: { id: notificationId }
        });
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        return { error: 'Error al eliminar notificación' };
    }
}
