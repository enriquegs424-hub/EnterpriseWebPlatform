'use server';

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Update user activity to mark them as online.
 * Called periodically by the client to maintain online status.
 */
export async function updateActivity() {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        await prisma.activityLog.create({
            data: {
                userId: session.user.id,
                action: 'HEARTBEAT',
                details: JSON.stringify({ timestamp: new Date().toISOString() })
            }
        });
        return { success: true };
    } catch (error) {
        console.error('[ACTIVITY] Failed to update activity:', error);
        return { success: false };
    }
}
