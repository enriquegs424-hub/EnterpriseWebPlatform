'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { presenceHeartbeat, markOffline } from '@/app/(protected)/presence/actions';

const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes until marked as away

/**
 * Enhanced ActivityHeartbeat with idle detection and browser close handling.
 * Implements Teams-style presence detection.
 */
export default function ActivityHeartbeat() {
    const { data: session } = useSession();
    const [isActive, setIsActive] = useState(true);
    const [lastActivity, setLastActivity] = useState(Date.now());

    // Update last activity on user interaction
    const handleActivity = useCallback(() => {
        setLastActivity(Date.now());
        if (!isActive) {
            setIsActive(true);
        }
    }, [isActive]);

    // Check for idle state
    useEffect(() => {
        const checkIdle = setInterval(() => {
            const idleTime = Date.now() - lastActivity;
            if (idleTime >= IDLE_TIMEOUT && isActive) {
                setIsActive(false);
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(checkIdle);
    }, [lastActivity, isActive]);

    // Set up activity listeners
    useEffect(() => {
        if (!session?.user) return;

        // Events that indicate user is active
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

        events.forEach(event => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleActivity);
            });
        };
    }, [session?.user, handleActivity]);

    // Send heartbeats
    useEffect(() => {
        if (!session?.user) return;

        // Send initial heartbeat
        presenceHeartbeat(true);

        // Send heartbeat at regular intervals
        const interval = setInterval(() => {
            presenceHeartbeat(isActive);
        }, HEARTBEAT_INTERVAL);

        return () => clearInterval(interval);
    }, [session?.user, isActive]);

    // Handle browser/tab close - mark as offline
    useEffect(() => {
        if (!session?.user) return;

        const handleBeforeUnload = () => {
            // Use sendBeacon for reliable delivery on page close
            // Note: We can't use async functions here, so we use a synchronous approach
            markOffline();
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // Page is being hidden (tab switch, minimize, etc.)
                // Send a quick heartbeat as "away" 
                presenceHeartbeat(false);
            } else if (document.visibilityState === 'visible') {
                // Page is visible again
                handleActivity();
                presenceHeartbeat(true);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [session?.user, handleActivity]);

    return null; // This component renders nothing
}
