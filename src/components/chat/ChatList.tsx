'use client';

import { useState, useEffect } from 'react';
import { Search, MessageSquare, Users as UsersIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import Badge from '@/components/ui/Badge';
import { searchUsers } from '@/app/(protected)/chat/actions';

interface Chat {
    id: string;
    name?: string | null;
    type: 'PROJECT' | 'DIRECT';
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
}

export default function ChatList({
    chats,
    selectedChatId,
    currentUserId,
    onSelectChat,
    onSelectUser
}: ChatListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);

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

    const filteredChats = chats.filter(chat => {
        const searchLower = searchQuery.toLowerCase();

        if (chat.type === 'PROJECT') {
            return chat.project?.name.toLowerCase().includes(searchLower) ||
                chat.project?.code.toLowerCase().includes(searchLower);
        } else {
            // For DMs, search in participant names
            return chat.members.some(m =>
                m.user.id !== currentUserId &&
                m.user.name.toLowerCase().includes(searchLower)
            );
        }
    });

    const getChatDisplayName = (chat: Chat) => {
        if (chat.type === 'PROJECT') {
            return chat.project?.name || chat.name || 'Proyecto';
        } else {
            // For DMs, show the other user's name
            const otherMember = chat.members.find(m => m.user.id !== currentUserId);
            return otherMember?.user.name || 'Chat Directo';
        }
    };

    const getChatSubtitle = (chat: Chat) => {
        if (chat.type === 'PROJECT') {
            return `Proyecto: ${chat.project?.code || ''}`;
        } else {
            const otherMember = chat.members.find(m => m.user.id !== currentUserId);
            return otherMember?.user.email || '';
        }
    };

    // Filter out users who already have a DM chat with current user
    const availableUsers = searchResults.filter(user => {
        return !chats.some(chat =>
            chat.type === 'DIRECT' &&
            chat.members.some(m => m.user.id === user.id)
        );
    });

    const showResults = searchQuery.trim().length >= 2;

    return (
        <div className="w-80 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex flex-col h-full transition-colors">
            {/* Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-black text-neutral-900 dark:text-neutral-100">Mensajes</h2>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar personas o chats..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-neutral-200 dark:border-neutral-700 rounded-lg focus:border-olive-500 focus:outline-none bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
                    />
                </div>
            </div>

            {/* Chat List */}
            <div className="flex-1 overflow-y-auto">
                {/* Existing Chats */}
                {filteredChats.length === 0 && !showResults ? (
                    <div className="p-8 text-center">
                        <MessageSquare className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            No hay conversaciones
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
                            Busca un compañero para iniciar un chat
                        </p>
                    </div>
                ) : (
                    <>
                        {filteredChats.length > 0 && (
                            <div className="py-2">
                                {searchQuery && (
                                    <div className="px-4 py-2">
                                        <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                                            Conversaciones
                                        </h3>
                                    </div>
                                )}
                                {filteredChats.map((chat) => {
                                    const isSelected = chat.id === selectedChatId;
                                    const displayName = getChatDisplayName(chat);
                                    const subtitle = getChatSubtitle(chat);

                                    return (
                                        <button
                                            key={chat.id}
                                            onClick={() => onSelectChat(chat.id)}
                                            className={`w-full px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-l-4 ${isSelected
                                                ? 'bg-olive-50 dark:bg-olive-900/20 border-olive-600'
                                                : 'border-transparent'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className={`font-bold text-sm truncate ${isSelected ? 'text-olive-900 dark:text-olive-300' : 'text-neutral-900 dark:text-neutral-100'
                                                        }`}>
                                                        {displayName}
                                                    </h3>
                                                    <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                                        {subtitle}
                                                    </p>
                                                </div>
                                                {chat.unreadCount && chat.unreadCount > 0 && (
                                                    <Badge variant="error" size="sm">
                                                        {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                                                    </Badge>
                                                )}
                                            </div>

                                            {/* Last Message */}
                                            {chat.lastMessage && (
                                                <div className="flex items-baseline gap-2 mt-1">
                                                    <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate flex-1">
                                                        <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                                                            {chat.lastMessage.author.name}:
                                                        </span>{' '}
                                                        {chat.lastMessage.content}
                                                    </p>
                                                    <span className="text-xs text-neutral-400 dark:text-neutral-500 flex-shrink-0">
                                                        {formatDistanceToNow(new Date(chat.lastMessage.createdAt), {
                                                            addSuffix: false,
                                                            locale: es
                                                        })}
                                                    </span>
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Available Users to Chat With */}
                        {showResults && availableUsers.length > 0 && (
                            <div className="py-2 border-t border-neutral-200 dark:border-neutral-800">
                                <div className="px-4 py-2">
                                    <h3 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide flex items-center gap-2">
                                        <UsersIcon className="w-3 h-3" />
                                        Personas
                                    </h3>
                                </div>
                                {availableUsers.map((user) => (
                                    <button
                                        key={user.id}
                                        onClick={() => onSelectUser(user.id)}
                                        className="w-full px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors border-l-4 border-transparent hover:border-olive-300"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-700 dark:text-olive-400 font-bold text-sm flex-shrink-0">
                                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100 truncate">
                                                    {user.name}
                                                </h3>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">
                                                    {user.email}
                                                </p>
                                                <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                                                    {user.department} • {user.role}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {showResults && filteredChats.length === 0 && availableUsers.length === 0 && !isSearching && (
                            <div className="p-8 text-center">
                                <Search className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    No se encontraron resultados
                                </p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
