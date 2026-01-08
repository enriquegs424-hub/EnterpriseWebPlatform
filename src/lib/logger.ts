
import { prisma } from "@/lib/prisma";

export async function logActivity(
    userId: string | undefined, // Allow undefined to handle edge cases gracefully, though usually required
    action: string,
    entityId?: string,
    details?: any
) {
    if (!userId) return; // Cannot log without user

    // Fire and forget - don't await to avoid blocking main thread
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                entityId,
                details: details ? JSON.stringify(details) : null
            }
        });
    } catch (error) {
        console.error("Failed to create activity log:", error);
        // Don't throw, just log error so main flow isn't interrupted
    }
}
