'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import ChatList from '@/components/chat/ChatList';
import ChatWindow from '@/components/chat/ChatWindow';
import EmptyState from '@/components/ui/EmptyState';
import { MessageSquare, Loader2 } from 'lucide-react';
import { getUserChats, sendMessage, editMessage, deleteMessage, getMessages, getOrCreateDirectChat } from './actions';
import { useToast } from '@/components/ui/Toast';
import { useSearchParams } from 'next/navigation';

export default function ChatPage() {
    const { data: session } = useSession();
    const toast = useToast();
    const [chats, setChats] = useState<any[]>([]);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);

    // Polling for new messages
    useEffect(() => {
        if (!selectedChatId) return;

        const pollInterval = setInterval(async () => {
            try {
                const latestMessages = await getMessages(selectedChatId);

                // Check if there are new messages
                if (latestMessages.length > messages.length) {
                    const newMessages = latestMessages.slice(messages.length);

                    // Show notification for new messages from others
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
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(pollInterval);
    }, [selectedChatId, messages.length, session]);

    const searchParams = useSearchParams();
    const projectIdParam = searchParams.get('projectId');
    const chatIdParam = searchParams.get('chatId');

    // Load user chats on mount
    useEffect(() => {
        loadChats();
    }, []);

    // Handle query params for auto-selection
    useEffect(() => {
        const handleAutoSelect = async () => {
            if (projectIdParam) {
                try {
                    // Dynamic import to avoid circular deps if needed, though actions are safe
                    const { getOrCreateProjectChat } = await import('./actions');
                    const chat = await getOrCreateProjectChat(projectIdParam);
                    if (chat) {
                        setSelectedChatId(chat.id);
                        // Add to list if not present (optimization)
                        setChats(prev => {
                            if (prev.some(c => c.id === chat.id)) return prev;
                            return [chat, ...prev];
                        });
                    }
                } catch (error) {
                    console.error('Error loading project chat:', error);
                }
            } else if (chatIdParam) {
                setSelectedChatId(chatIdParam);
            }
        };

        if (!isLoadingChats) {
            handleAutoSelect();
        }
    }, [projectIdParam, chatIdParam, isLoadingChats]);

    // Load messages when chat is selected
    useEffect(() => {
        if (selectedChatId) {
            loadMessages(selectedChatId);
        }
    }, [selectedChatId]);

    const loadChats = async () => {
        try {
            setIsLoadingChats(true);
            const userChats = await getUserChats();
            setChats(userChats);
        } catch (error: any) {
            toast.error('Error', error.message || 'No se pudieron cargar los chats');
        } finally {
            setIsLoadingChats(false);
        }
    };

    const loadMessages = async (chatId: string) => {
        try {
            setIsLoadingMessages(true);
            const chatMessages = await getMessages(chatId);
            setMessages(chatMessages);
        } catch (error: any) {
            toast.error('Error', error.message || 'No se pudieron cargar los mensajes');
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const handleSendMessage = async (content: string, replyToId?: string, attachments?: any[]) => {
        if (!selectedChatId) return;

        try {
            const newMessage = await sendMessage(selectedChatId, content, attachments, replyToId);
            setMessages(prev => [...prev, newMessage]);
            toast.success('Mensaje enviado', 'Tu mensaje ha sido enviado correctamente');
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

    const handleSelectUser = async (userId: string) => {
        try {
            // Create or get direct chat with this user
            const directChat = await getOrCreateDirectChat(userId);

            // Add to chats list if new
            setChats(prev => {
                const exists = prev.some(c => c.id === directChat.id);
                if (exists) return prev;
                return [directChat, ...prev];
            });

            // Select the chat
            setSelectedChatId(directChat.id);

            toast.success('Chat abierto', 'Conversación iniciada correctamente');
        } catch (error: any) {
            toast.error('Error', error.message || 'No se pudo abrir el chat');
        }
    };

    if (isLoadingChats) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 text-olive-600 animate-spin mx-auto mb-2" />
                    <p className="text-neutral-600">Cargando chats...</p>
                </div>
            </div>
        );
    }

    const selectedChat = chats.find(c => c.id === selectedChatId);
    // @ts-ignore
    const currentUserId = session?.user?.id || '';

    return (
        <div className="h-[calc(100vh-5rem)] flex bg-neutral-50">
            {/* Chat List */}
            <ChatList
                chats={chats}
                selectedChatId={selectedChatId || undefined}
                currentUserId={currentUserId}
                onSelectChat={setSelectedChatId}
                onSelectUser={handleSelectUser}
            />

            {/* Chat Window */}
            {selectedChatId ? (
                <ChatWindow
                    chatId={selectedChatId}
                    chatName={
                        selectedChat?.type === 'PROJECT'
                            ? selectedChat?.project?.name
                            : selectedChat?.members?.find((m: any) => m.user.id !== currentUserId)?.user.name
                    }
                    messages={messages}
                    currentUserId={currentUserId}
                    onSendMessage={handleSendMessage}
                    onEditMessage={handleEditMessage}
                    onDeleteMessage={handleDeleteMessage}
                    isLoading={isLoadingMessages}
                />
            ) : (
                <div className="flex-1 flex items-center justify-center bg-white">
                    <EmptyState
                        icon={MessageSquare}
                        title="Selecciona una conversación"
                        description="Elige un chat de la lista para comenzar a conversar con tu equipo."
                    />
                </div>
            )}
        </div>
    );
}
