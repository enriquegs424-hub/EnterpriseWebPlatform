'use client';

import { useEffect, useRef } from 'react';
import { useToast } from '@/components/ui/Toast';
import { getUnreadMessages } from '@/app/(protected)/chat/actions';
import { usePathname } from 'next/navigation';

export default function ChatNotificationObserver() {
    const { info } = useToast();
    const pathname = usePathname();
    const lastCheckRef = useRef<Date>(new Date());

    useEffect(() => {
        // Initial check timestamp
        lastCheckRef.current = new Date();

        const checkMessages = async () => {
            try {
                const now = new Date();
                const messages = await getUnreadMessages(lastCheckRef.current);

                // Update last check
                lastCheckRef.current = now;

                if (messages && messages.length > 0) {
                    messages.forEach(msg => {
                        // Don't notify if we are in the chat page (handled by UI update?)
                        // Actually, we might want to notify unless we are in THAT specific chat.
                        // For now, let's notify always if outside /chat, or maybe standard toast.

                        // Simple logic: Trigger toast
                        const title = msg.chat.type === 'DIRECT'
                            ? `Mensaje de ${msg.author.name}`
                            : `Nuevo mensaje en ${msg.chat.name || 'Grupo'}`;

                        info(title, msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''));
                    });
                }
            } catch (error) {
                console.error('Error polling messages:', error);
            }
        };

        // Poll every 10 seconds
        const interval = setInterval(checkMessages, 10000);
        return () => clearInterval(interval);
    }, [info]);

    return null;
}
