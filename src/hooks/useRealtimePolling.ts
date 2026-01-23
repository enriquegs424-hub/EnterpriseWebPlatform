import { useEffect, useRef, useCallback } from 'react';

interface UseRealtimePollingOptions {
    onPoll: () => void | Promise<void>;
    interval?: number; // milliseconds
    enabled?: boolean;
}

/**
 * Hook para polling inteligente con soporte para Visibility API
 * - Pausa el polling cuando la pestaña está inactiva
 * - Reanuda automáticamente al volver a la pestaña
 * - Cleanup automático
 */
export function useRealtimePolling({
    onPoll,
    interval = 5000, // 5 segundos por defecto
    enabled = true
}: UseRealtimePollingOptions) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const isPollingRef = useRef(false);

    const startPolling = useCallback(() => {
        if (!enabled || isPollingRef.current) return;

        isPollingRef.current = true;
        intervalRef.current = setInterval(async () => {
            try {
                await onPoll();
            } catch (error) {
                console.error('[useRealtimePolling] Error during poll:', error);
            }
        }, interval);

        console.log('[useRealtimePolling] Started polling with interval:', interval);
    }, [onPoll, interval, enabled]);

    const stopPolling = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            isPollingRef.current = false;
            console.log('[useRealtimePolling] Stopped polling');
        }
    }, []);

    // Handle visibility change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                console.log('[useRealtimePolling] Tab hidden, pausing polling');
                stopPolling();
            } else {
                console.log('[useRealtimePolling] Tab visible, resuming polling');
                // Poll immediately when tab becomes visible
                onPoll();
                startPolling();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [startPolling, stopPolling, onPoll]);

    // Start/stop polling based on enabled flag
    useEffect(() => {
        if (enabled && !document.hidden) {
            startPolling();
        } else {
            stopPolling();
        }

        return () => {
            stopPolling();
        };
    }, [enabled, startPolling, stopPolling]);

    return {
        startPolling,
        stopPolling,
        isPolling: isPollingRef.current
    };
}
