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
    attachments?: any;
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
    onSendMessage: (content: string, replyToId?: string, attachments?: any[]) => Promise<void>;
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

    const handleSendMessage = async (content: string, replyToId?: string, attachments?: any[]) => {
        await onSendMessage(content, replyToId, attachments);
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
            <div className="flex-1 flex items-center justify-center bg-neutral-50/50 dark:bg-neutral-900">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-olive-600 animate-spin mx-auto mb-3" />
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium">Cargando mensajes...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-neutral-900">
            {/* Teams-like Header */}
            {chatName && (
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        {/* Avatar with presence indicator */}
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-olive-600 flex items-center justify-center text-white font-bold text-sm">
                                {chatName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </div>
                            {/* Presence indicator - green dot */}
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full"></span>
                        </div>

                        {/* Name and tabs */}
                        <div className="flex-1">
                            <div className="flex items-center gap-4">
                                <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">{chatName}</h2>
                            </div>
                            {/* Tabs like Teams */}
                            <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm font-medium text-olive-600 dark:text-olive-400 border-b-2 border-olive-600 pb-1">Chat</span>
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors">
                                <MessageSquare size={18} />
                            </button>
                        </div>
                    </div>
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
                                    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800"></div>
                                    <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider px-3 py-1 bg-white dark:bg-neutral-800 rounded-full border border-neutral-200 dark:border-neutral-700">
                                        {getDateSeparator(new Date(dateKey))}
                                    </span>
                                    <div className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800"></div>
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
                        className="px-6 py-2 border-t border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900"
                    >
                        <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-olive-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-olive-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-olive-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400 italic">
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
