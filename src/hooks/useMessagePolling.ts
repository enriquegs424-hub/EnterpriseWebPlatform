'use client';

import { useEffect, useRef } from 'react';
import { getMessages } from '@/app/(protected)/chat/actions';

interface UseMessagePollingOptions {
    chatId: string | null;
    currentMessages: any[];
    onNewMessages: (messages: any[]) => void;
    onNewMessageNotification?: (message: any) => void;
    interval?: number;
    enabled?: boolean;
}

/**
 * Hook for polling new messages in a chat
 * Polls every X seconds and notifies when new messages arrive
 */
export function useMessagePolling({
    chatId,
    currentMessages,
    onNewMessages,
    onNewMessageNotification,
    interval = 3000, // 3 seconds
    enabled = true
}: UseMessagePollingOptions) {
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastMessageIdRef = useRef<string | null>(null);

    useEffect(() => {
        // Update last message ID when messages change
        if (currentMessages.length > 0) {
            lastMessageIdRef.current = currentMessages[currentMessages.length - 1].id;
        }
    }, [currentMessages]);

    useEffect(() => {
        if (!chatId || !enabled) {
            // Clear interval if disabled or no chat selected
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        const pollMessages = async () => {
            try {
                // Fetch all messages
                const messages = await getMessages(chatId, 50);

                // Check if there are new messages
                if (messages.length > currentMessages.length) {
                    const newMessages = messages.slice(currentMessages.length);

                    // Update messages
                    onNewMessages(messages);

                    // Notify about each new message
                    if (onNewMessageNotification) {
                        newMessages.forEach(msg => onNewMessageNotification(msg));
                    }
                }
            } catch (error) {
                console.error('Error polling messages:', error);
            }
        };

        // Start polling
        intervalRef.current = setInterval(pollMessages, interval);

        // Cleanup on unmount or when dependencies change
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [chatId, enabled, interval, currentMessages.length, onNewMessages, onNewMessageNotification]);
}
