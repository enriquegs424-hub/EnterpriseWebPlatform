'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ChatWindow from '@/components/chat/ChatWindow';
import { getOrCreateProjectChat, sendMessage, editMessage, deleteMessage, getMessages } from '@/app/(protected)/chat/actions';
import { useToast } from '@/components/ui/Toast';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ProjectChatProps {
    projectId: string;
    projectName: string;
}

export default function ProjectChat({ projectId, projectName }: ProjectChatProps) {
    const { data: session } = useSession();
    const toast = useToast();
    const [chatId, setChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize project chat
    useEffect(() => {
        const initChat = async () => {
            try {
                setIsLoading(true);
                const chat = await getOrCreateProjectChat(projectId);
                setChatId(chat.id);
                setMessages(chat.messages);
            } catch (error: any) {
                toast.error('Error', error.message || 'No se pudo cargar el chat del proyecto');
            } finally {
                setIsLoading(false);
            }
        };

        initChat();
    }, [projectId]);

    // Poll for new messages
    useEffect(() => {
        if (!chatId) return;

        const pollInterval = setInterval(async () => {
            try {
                const latestMessages = await getMessages(chatId);

                if (latestMessages.length > messages.length) {
                    const newMessages = latestMessages.slice(messages.length);

                    newMessages.forEach(msg => {
                        // @ts-ignore
                        if (msg.author.id !== session?.user?.id) {
                            toast.info('Nuevo mensaje', `${msg.author.name}: ${msg.content.slice(0, 50)}...`);
                        }
                    });

                    setMessages(latestMessages);
                }
            } catch (error) {
                console.error('Error polling messages:', error);
            }
        }, 3000);

        return () => clearInterval(pollInterval);
    }, [chatId, messages.length, session]);

    const handleSendMessage = async (content: string, replyToId?: string, attachments?: any[]) => {
        if (!chatId) return;

        try {
            const newMessage = await sendMessage(chatId, content, attachments, replyToId);
            setMessages(prev => [...prev, newMessage]);
        } catch (error: any) {
            toast.error('Error', error.message || 'No se pudo enviar el mensaje');
        }
    };

    const handleEditMessage = async (messageId: string, newContent: string) => {
        try {
            const updated = await editMessage(messageId, newContent);
            setMessages(prev =>
                prev.map(msg => (msg.id === messageId ? updated : msg))
            );
            toast.success('Editado', 'Mensaje actualizado correctamente');
        } catch (error: any) {
            toast.error('Error', error.message || 'No se pudo editar el mensaje');
        }
    };

    const handleDeleteMessage = async (messageId: string) => {
        if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;

        try {
            await deleteMessage(messageId);
            setMessages(prev =>
                prev.map(msg =>
                    msg.id === messageId
                        ? { ...msg, content: '_Mensaje eliminado_', deletedAt: new Date() }
                        : msg
                )
            );
            toast.success('Eliminado', 'Mensaje eliminado correctamente');
        } catch (error: any) {
            toast.error('Error', error.message || 'No se pudo eliminar el mensaje');
        }
    };

    if (isLoading) {
        return (
            <div className="h-[600px] flex items-center justify-center bg-neutral-50/30 rounded-lg">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-olive-600 animate-spin mx-auto mb-3" />
                    <p className="text-neutral-600">Cargando chat del proyecto...</p>
                </div>
            </div>
        );
    }

    if (!chatId) {
        return (
            <div className="h-[600px] flex items-center justify-center bg-neutral-50/30 rounded-lg">
                <p className="text-neutral-500">No se pudo cargar el chat del proyecto</p>
            </div>
        );
    }

    // @ts-ignore
    const currentUserId = session?.user?.id || '';

    return (
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden h-[600px]">
            <ChatWindow
                chatId={chatId}
                chatName={`Chat del proyecto: ${projectName}`}
                messages={messages}
                currentUserId={currentUserId}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
            />
        </div>
    );
}
