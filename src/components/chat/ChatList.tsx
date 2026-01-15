'use client';

import { useState, useEffect } from 'react';
import { Search, MessageSquare, Users as UsersIcon, Star, Pin, MoreVertical, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Badge from '@/components/ui/Badge';
import { searchUsers, toggleChatFavorite } from '@/app/(protected)/chat/actions';
import CreateGroupDialog from './CreateGroupDialog';
import { useToast } from '@/components/ui/Toast';

interface Chat {
    id: string;
    name?: string | null;
    type: 'PROJECT' | 'DIRECT' | 'GROUP';
    isFavorite: boolean;
    role: string;
    project?: {
        id: string;
        name: string;
        code: string;
    } | null;
    members: Array<{
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    lastMessage?: {
        content: string;
        createdAt: Date;
        author: {
            name: string;
        };
    } | null;
    unreadCount?: number;
    updatedAt: Date;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
}

interface ChatListProps {
    chats: Chat[];
    selectedChatId?: string;
    currentUserId: string;
    onSelectChat: (chatId: string) => void;
    onSelectUser: (userId: string) => void;
    onRefreshRequest?: () => void;
}

export default function ChatList({
    chats,
    selectedChatId,
    currentUserId,
    onSelectChat,
    onSelectUser,
    onRefreshRequest
}: ChatListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
    const [localChats, setLocalChats] = useState<Chat[]>(chats);
    const { error: toastError } = useToast();

    // Sync local state when props change
    useEffect(() => {
        setLocalChats(chats);
    }, [chats]);

    // Favorites logic based on local state
    const favorites = localChats.filter(c => c.isFavorite);
    const otherChats = localChats.filter(c => !c.isFavorite);

    // Search for users when query changes
    useEffect(() => {
        const search = async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const users = await searchUsers(searchQuery);
                setSearchResults(users);
            } catch (error) {
                console.error('Error searching users:', error);
                setSearchResults([]);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery]);

    const handleToggleFavorite = async (e: React.MouseEvent, chatId: string) => {
        e.stopPropagation(); // Prevent chat selection

        // Optimistic update
        setLocalChats(prev => prev.map(c =>
            c.id === chatId ? { ...c, isFavorite: !c.isFavorite } : c
        ));

        try {
            await toggleChatFavorite(chatId);
            onRefreshRequest?.();
        } catch (error) {
            console.error('Error toggling favorite:', error);
            // Revert on error
            setLocalChats(prev => prev.map(c =>
                c.id === chatId ? { ...c, isFavorite: !c.isFavorite } : c
            ));
            toastError('Error', 'No se pudo actualizar el estado de favorito.');
        }
    };

    const handleChatSelect = (chatId: string) => {
        // Optimistic read receipt
        setLocalChats(prev => prev.map(c =>
            c.id === chatId ? { ...c, unreadCount: 0 } : c
        ));
        onSelectChat(chatId);
    };

    const ChatItem = ({ chat }: { chat: Chat }) => {
        const isSelected = selectedChatId === chat.id;
        const otherMember = chat.members.find(m => m.user.id !== currentUserId)?.user;

        let title = chat.name || otherMember?.name || 'Chat';
        if (chat.type === 'PROJECT') title = chat.project?.name || 'Proyecto';
        if (chat.type === 'GROUP') title = chat.name || 'Grupo sin nombre';

        // Presence indicator (simulated for now)
        const isOnline = true;

        // Avatar logic
        const initials = title.substring(0, 2).toUpperCase();

        return (
            <div
                onClick={() => handleChatSelect(chat.id)}
                className={`group relative flex items-center gap-3 p-3 cursor-pointer rounded-lg transition-all ${isSelected
                    ? 'bg-olive-100 dark:bg-olive-900/30 ring-1 ring-olive-500/20'
                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
            >
                <div className="relative flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${isSelected
                        ? 'bg-white text-olive-700 border-olive-200'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-transparent'
                        }`}>
                        {initials}
                    </div>
                    {/* Presence dot */}
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-neutral-950 ${isOnline ? 'bg-emerald-500' : 'bg-neutral-400'
                        }`} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        <span className={`font-semibold truncate text-sm ${isSelected ? 'text-olive-900 dark:text-olive-100' : 'text-neutral-900 dark:text-neutral-100'
                            }`}>
                            {title}
                        </span>
                        {chat.lastMessage && (
                            <span className="text-[10px] text-neutral-400 flex-shrink-0 ml-2">
                                {formatDistanceToNow(new Date(chat.lastMessage.createdAt), { addSuffix: false, locale: es }).replace('alrededor de ', '')}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between">
                        <div className={`text-xs truncate ${isSelected ? 'text-olive-700/80 dark:text-olive-200/70' : 'text-neutral-500'
                            }`}>
                            {chat.lastMessage ? (
                                <span className="flex items-center gap-1">
                                    <span className="font-medium text-neutral-800 dark:text-neutral-300">
                                        {chat.lastMessage.author.name.split(' ')[0]}:
                                    </span>
                                    {chat.lastMessage.content}
                                </span>
                            ) : (
                                <span className="italic">No hay mensajes</span>
                            )}
                        </div>

                        {/* Actions / Badge */}
                        <div className="flex items-center gap-2">
                            {chat.unreadCount && chat.unreadCount > 0 ? (
                                <Badge variant="error" size="sm" className="h-5 min-w-[20px] px-1.5 flex items-center justify-center">
                                    {chat.unreadCount}
                                </Badge>
                            ) : null}

                            {/* Star button matches Teams behavior (visible on hover or if favorite) */}
                            <button
                                onClick={(e) => handleToggleFavorite(e, chat.id)}
                                className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700 ${chat.isFavorite ? 'opacity-100 text-amber-400' : 'text-neutral-400'
                                    }`}
                                title={chat.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                            >
                                <Star className={`w-3.5 h-3.5 ${chat.isFavorite ? 'fill-current' : ''}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 w-80">
            {/* Header / Search */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-lg">Chat</h2>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setIsGroupDialogOpen(true)}
                            className="p-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400 tooltip"
                            title="Nuevo Grupo"
                        >
                            <UsersIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Buscar personas o mensajes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-neutral-100 dark:bg-neutral-800 border-transparent focus:bg-white dark:focus:bg-neutral-950 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm transition-all outline-none focus:ring-2 focus:ring-olive-500/20"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
                {searchQuery.length >= 2 ? (
                    <div className="p-2 space-y-1">
                        <div className="px-3 py-2 text-xs font-bold text-neutral-500 uppercase">
                            Resultados de búsqueda
                        </div>
                        {searchResults.map(user => (
                            <div
                                key={user.id}
                                onClick={() => onSelectUser(user.id)}
                                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-olive-100 flex items-center justify-center text-olive-700 font-bold text-xs">
                                    {user.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{user.name}</div>
                                    <div className="text-xs text-neutral-500">{user.department}</div>
                                </div>
                            </div>
                        ))}
                        {searchResults.length === 0 && !isSearching && (
                            <div className="text-center py-8 text-neutral-500 text-sm">
                                No se encontraron usuarios
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-2 space-y-4">
                        {/* Favorites Section */}
                        {favorites.length > 0 && (
                            <div className="space-y-1">
                                <div className="px-3 flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                    <Star className="w-3 h-3" />
                                    <span>Favoritos</span>
                                </div>
                                {favorites.map(chat => (
                                    <ChatItem key={chat.id} chat={chat} />
                                ))}
                            </div>
                        )}

                        {/* Other Chats Section */}
                        <div className="space-y-1">
                            <div className="px-3 flex items-center gap-2 text-xs font-bold text-neutral-500 uppercase tracking-wider">
                                <MessageSquare className="w-3 h-3" />
                                <span>Chats Recientes</span>
                            </div>
                            {otherChats.map(chat => (
                                <ChatItem key={chat.id} chat={chat} />
                            ))}
                            {chats.length === 0 && (
                                <div className="text-center py-10 px-4">
                                    <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <MessageSquare className="w-6 h-6 text-neutral-400" />
                                    </div>
                                    <h3 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">No hay chats aún</h3>
                                    <p className="text-xs text-neutral-500 mt-1">Busca un usuario arriba para comenzar una conversación.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <CreateGroupDialog
                isOpen={isGroupDialogOpen}
                onClose={() => setIsGroupDialogOpen(false)}
                onGroupCreated={() => {
                    // Trigger refresh
                    onRefreshRequest?.();
                }}
            />
        </div>
    );
}
