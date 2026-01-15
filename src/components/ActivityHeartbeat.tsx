'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { updateActivity } from '@/app/(protected)/activity/actions';

/**
 * Silent component that sends heartbeats to keep user activity status updated.
 * Should be placed in the protected layout.
 */
export default function ActivityHeartbeat() {
    const { data: session } = useSession();

    useEffect(() => {
        if (!session?.user) return;

        // Send initial heartbeat
        updateActivity();

        // Send heartbeat every 5 minutes
        const interval = setInterval(() => {
            updateActivity();
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [session?.user]);

    return null; // This component renders nothing
}
