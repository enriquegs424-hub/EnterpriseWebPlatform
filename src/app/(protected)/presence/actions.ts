'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Define locally until Prisma client is regenerated
export type PresenceStatus = 'AVAILABLE' | 'BUSY' | 'DO_NOT_DISTURB' | 'BE_RIGHT_BACK' | 'AWAY' | 'OFFLINE';

const IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes for auto-away
const OFFLINE_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes without heartbeat = offline

/**
 * Update user presence status manually
 */
export async function updatePresence(
    status: PresenceStatus,
    durationMinutes?: number
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Not authenticated' };
    }

    const data: any = {
        presenceStatus: status,
        presenceManual: true,
        lastActiveAt: new Date(),
    };

    // If duration is set, calculate expiration time
    if (durationMinutes && durationMinutes > 0) {
        data.presenceExpiresAt = new Date(Date.now() + durationMinutes * 60 * 1000);
    } else {
        data.presenceExpiresAt = null;
    }

    // @ts-ignore - Fields not yet in generated client
    await prisma.user.update({
        where: { id: session.user.id },
        data,
    });

    revalidatePath('/admin/users');
    return { success: true };
}

/**
 * Reset presence to automatic mode (AVAILABLE or AWAY based on activity)
 */
export async function resetPresence() {
    const session = await auth();
    if (!session?.user?.id) {
        return { error: 'Not authenticated' };
    }

    // @ts-ignore - Fields not yet in generated client
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            presenceStatus: 'AVAILABLE',
            presenceManual: false,
            presenceExpiresAt: null,
            lastActiveAt: new Date(),
        },
    });

    revalidatePath('/admin/users');
    return { success: true };
}

/**
 * Heartbeat to keep user presence updated
 * @param isActive - true if user is actively interacting, false if idle
 */
export async function presenceHeartbeat(isActive: boolean = true) {
    const session = await auth();
    if (!session?.user?.id) return;

    // @ts-ignore - Fields not yet in generated client
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            // @ts-ignore
            presenceStatus: true,
            // @ts-ignore
            presenceManual: true,
            // @ts-ignore
            presenceExpiresAt: true,
        },
    }) as any;

    if (!user) return;

    const now = new Date();
    const data: any = {
        lastActiveAt: now,
    };

    // Check if manual status has expired
    if (user.presenceExpiresAt && new Date(user.presenceExpiresAt) < now) {
        // Status expired, reset to automatic
        data.presenceStatus = isActive ? 'AVAILABLE' : 'AWAY';
        data.presenceManual = false;
        data.presenceExpiresAt = null;
    } else if (!user.presenceManual) {
        // Automatic mode: set based on activity
        if (isActive) {
            if (user.presenceStatus === 'AWAY' || user.presenceStatus === 'OFFLINE') {
                data.presenceStatus = 'AVAILABLE';
            }
        } else {
            if (user.presenceStatus === 'AVAILABLE') {
                data.presenceStatus = 'AWAY';
            }
        }
    }

    // @ts-ignore - Fields not yet in generated client
    await prisma.user.update({
        where: { id: session.user.id },
        data,
    });
}

/**
 * Mark user as offline (called on browser close)
 */
export async function markOffline() {
    const session = await auth();
    if (!session?.user?.id) return;

    // @ts-ignore - Fields not yet in generated client
    await prisma.user.update({
        where: { id: session.user.id },
        data: {
            presenceStatus: 'OFFLINE',
            presenceManual: false,
            presenceExpiresAt: null,
        },
    });
}

/**
 * Get current user's presence status
 */
export async function getMyPresence() {
    const session = await auth();
    if (!session?.user?.id) return null;

    // @ts-ignore - Fields not yet in generated client
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            // @ts-ignore
            presenceStatus: true,
            // @ts-ignore
            presenceManual: true,
            // @ts-ignore
            presenceExpiresAt: true,
            // @ts-ignore
            lastActiveAt: true,
        },
    }) as any;

    return user;
}

/**
 * Get presence for all users (for displaying in UI)
 */
export async function getAllUsersPresence() {
    const session = await auth();
    if (!session?.user?.id) return [];

    // @ts-ignore
    const companyId = session.user.companyId;

    // Update users who haven't sent heartbeat in 2 minutes to OFFLINE
    const offlineThreshold = new Date(Date.now() - OFFLINE_TIMEOUT_MS);

    // @ts-ignore - Fields not yet in generated client
    await prisma.user.updateMany({
        where: {
            companyId: companyId || undefined,
            isActive: true,
            // @ts-ignore
            presenceStatus: { not: 'OFFLINE' },
            // @ts-ignore
            lastActiveAt: { lt: offlineThreshold },
        },
        data: {
            presenceStatus: 'OFFLINE',
            presenceManual: false,
        },
    });

    // @ts-ignore - Fields not yet in generated client
    return await prisma.user.findMany({
        where: companyId ? { companyId, isActive: true } : { isActive: true },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            // @ts-ignore
            presenceStatus: true,
            // @ts-ignore
            lastActiveAt: true,
        },
        orderBy: { name: 'asc' },
    });
}

// Presence status configuration for UI

