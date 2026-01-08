'use client';

import { useEffect, useRef, useState } from 'react';
import Message from './Message';
import MessageComposer from './MessageComposer';
import { Loader2, MessageSquare } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
    id: string;
    content: string;
    author: {
        id: string;
        name: string;
        email: string;
    };
    createdAt: Date;
    isEdited?: boolean;
    deletedAt?: Date | null;
    replyTo?: {
        id: string;
        content: string;
        author: {
            name: string;
        };
    } | null;
}

interface ChatWindowProps {
    chatId: string;
    chatName?: string;
    messages: ChatMessage[];
    currentUserId: string;
    onSendMessage: (content: string, replyToId?: string) => Promise<void>;
    onEditMessage: (messageId: string, content: string) => Promise<void>;
    onDeleteMessage: (messageId: string) => Promise<void>;
    isLoading?: boolean;
}

// Helper to format date separators
function getDateSeparator(date: Date): string {
    if (isToday(date)) return 'Hoy';
    if (isYesterday(date)) return 'Ayer';

    const daysAgo = differenceInDays(new Date(), date);
    if (daysAgo < 7) {
        return format(date, 'EEEE', { locale: es }); // Day name
    }

    return format(date, 'dd/MM/yyyy');
}

export default function ChatWindow({
    chatId,
    chatName,
    messages,
    currentUserId,
    onSendMessage,
    onEditMessage,
    onDeleteMessage,
    isLoading = false
}: ChatWindowProps) {
    const [replyingTo, setReplyingTo] = useState<{
        id: string;
        author: string;
        content: string;
    } | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);

    // Poll for typing users
    useEffect(() => {
        if (!chatId) return;

        const pollTyping = async () => {
            try {
                const { getTypingUsers } = await import('@/app/(protected)/chat/actions');
                const users = await getTypingUsers(chatId);
                setTypingUsers(users);
            } catch (error) {
                // Silent fail
            }
        };

        pollTyping();
        const interval = setInterval(pollTyping, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [chatId]);

    // Auto-scroll to bottom on new messages (only if already at bottom)
    useEffect(() => {
        if (shouldAutoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length, shouldAutoScroll]);

    // Detect if user scrolled up
    const handleScroll = () => {
        if (messagesContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShouldAutoScroll(isNearBottom);
        }
    };

    const handleReply = (messageId: string) => {
        const message = messages.find(m => m.id === messageId);
        if (message) {
            setReplyingTo({
                id: message.id,
                author: message.author.name,
                content: message.content
            });
        }
    };

    const handleSendMessage = async (content: string, replyToId?: string) => {
        await onSendMessage(content, replyToId);
        setReplyingTo(null);
        setShouldAutoScroll(true); // Auto-scroll when sending
    };

    // Group messages by date
    const messagesByDate: { [key: string]: ChatMessage[] } = {};
    messages.forEach(message => {
        const dateKey = format(new Date(message.createdAt), 'yyyy-MM-dd');
        if (!messagesByDate[dateKey]) {
            messagesByDate[dateKey] = [];
        }
        messagesByDate[dateKey].push(message);
    });

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-neutral-50/50">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-olive-600 animate-spin mx-auto mb-3" />
                    <p className="text-neutral-500 text-sm font-medium">Cargando mensajes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-neutral-50/30">
            {/* Header */}
            {chatName && (
                <div className="px-6 py-4 border-b border-neutral-200 bg-white shadow-sm">
                    <h2 className="font-bold text-base text-neutral-900">{chatName}</h2>
                </div>
            )}

            {/* Messages */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto"
            >
                {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <EmptyState
                            icon={MessageSquare}
                            title="No hay mensajes aún"
                            description="Sé el primero en enviar un mensaje en esta conversación."
                        />
                    </div>
                ) : (
                    <div className="py-4">
                        {Object.keys(messagesByDate).sort().map(dateKey => (
                            <div key={dateKey}>
                                {/* Date Separator */}
                                <div className="flex items-center gap-3 px-6 py-4 my-2">
                                    <div className="flex-1 h-px bg-neutral-200"></div>
                                    <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider px-3 py-1 bg-white rounded-full border border-neutral-200">
                                        {getDateSeparator(new Date(dateKey))}
                                    </span>
                                    <div className="flex-1 h-px bg-neutral-200"></div>
                                </div>

                                {/* Messages for this date */}
                                {messagesByDate[dateKey].map((message) => (
                                    <Message
                                        key={message.id}
                                        {...message}
                                        isOwnMessage={message.author.id === currentUserId}
                                        onReply={handleReply}
                                        onEdit={onEditMessage}
                                        onDelete={onDeleteMessage}
                                    />
                                ))}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Typing Indicator */}
            <AnimatePresence>
                {typingUsers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-6 py-2 border-t border-neutral-100 bg-neutral-50"
                    >
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-olive-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-olive-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-olive-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                            <span className="text-xs text-neutral-500 italic">
                                {typingUsers.length === 1
                                    ? `${typingUsers[0].userName} está escribiendo...`
                                    : `${typingUsers.length} personas están escribiendo...`}
                            </span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Composer */}
            <MessageComposer
                chatId={chatId}
                onSendMessage={handleSendMessage}
                replyingTo={replyingTo}
                onCancelReply={() => setReplyingTo(null)}
            />
        </div>
    );
}
