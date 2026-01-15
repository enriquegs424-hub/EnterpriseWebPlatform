'use client';

import { useEffect, useRef, useState } from 'react';
import Message from './Message';
import MessageComposer from './MessageComposer';
import { Loader2, MessageSquare, Search, FileText, X, Download, Settings, Trash2, UserPlus, UserMinus, Camera } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { searchMessagesInChat, getChatAttachments, getChatInfo, updateGroupChat, deleteGroupChat, searchUsers } from '@/app/(protected)/chat/actions';
import { useRouter } from 'next/navigation';

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
    chatType?: 'PROJECT' | 'DIRECT' | 'GROUP';
    chatMembers?: Array<{ user: { id: string; name: string; email: string } }>;
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
    chatType,
    chatMembers,
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
    const [showMembers, setShowMembers] = useState(false);
    const [activeTab, setActiveTab] = useState<'chat' | 'files'>('chat');

    // Search State
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Files State
    const [files, setFiles] = useState<any[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);

    // Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [chatInfo, setChatInfo] = useState<any>(null);
    const [newName, setNewName] = useState('');
    const [newImage, setNewImage] = useState('');

    // Member Management State
    const [memberQuery, setMemberQuery] = useState('');
    const [memberResults, setMemberResults] = useState<any[]>([]);
    const [isSearchingMembers, setIsSearchingMembers] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const [typingUsers, setTypingUsers] = useState<{ userId: string; userName: string }[]>([]);
    const router = useRouter();

    // Group search results by month
    function groupByMonth(results: any[]): { [key: string]: any[] } {
        const groups: { [key: string]: any[] } = {};
        results.forEach(msg => {
            const monthKey = format(new Date(msg.createdAt), 'MMMM yyyy', { locale: es });
            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push(msg);
        });
        return groups;
    }

    // Scroll to a specific message
    function scrollToMessage(messageId: string) {
        const element = document.getElementById(`message-${messageId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-yellow-100', 'dark:bg-yellow-900/30');
            setTimeout(() => {
                element.classList.remove('bg-yellow-100', 'dark:bg-yellow-900/30');
            }, 2000);
        }
        setShowSearch(false);
    }

    // Load chat info for permissions
    useEffect(() => {
        if (chatType === 'GROUP') {
            getChatInfo(chatId).then(info => setChatInfo(info)).catch(console.error);
        }
    }, [chatId, chatType]);

    // Load files when files tab is active
    useEffect(() => {
        if (activeTab === 'files' && files.length === 0) {
            loadFiles();
        }
    }, [activeTab]);

    async function loadFiles() {
        setLoadingFiles(true);
        try {
            const attachments = await getChatAttachments(chatId);
            setFiles(attachments);
        } catch (error) {
            console.error('Error loading files:', error);
        } finally {
            setLoadingFiles(false);
        }
    }

    async function handleSearch() {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const results = await searchMessagesInChat(chatId, searchQuery);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching:', error);
        } finally {
            setIsSearching(false);
        }
    }

    async function handleSearchMembers(query: string) {
        if (!query.trim()) {
            setMemberResults([]);
            return;
        }
        setIsSearchingMembers(true);
        try {
            const results = await searchUsers(query);
            // Filter out existing members
            const existingIds = chatInfo?.members?.map((m: any) => m.user.id) || [];
            setMemberResults(results.filter((u: any) => !existingIds.includes(u.id)));
        } catch (error) {
            console.error('Error searching users:', error);
        } finally {
            setIsSearchingMembers(false);
        }
    }

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
        <div className="flex-1 flex flex-col h-full bg-white dark:bg-neutral-900 relative overflow-hidden">
            {/* Teams-like Header */}
            {chatName && (
                <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                    <div className="flex items-center gap-3">
                        {/* Avatar with presence indicator */}
                        <div className="relative">
                            {chatType === 'GROUP' && chatInfo?.image ? (
                                <img src={chatInfo.image} alt={chatName} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${chatType === 'GROUP' ? 'bg-blue-600' : 'bg-olive-600'
                                    }`}>
                                    {chatName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                </div>
                            )}
                            {/* Presence indicator - green dot */}
                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-neutral-900 rounded-full"></span>
                        </div>

                        {/* Name and tabs */}
                        <div className="flex-1">
                            <div className="flex items-center gap-4">
                                <h2 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">{chatName}</h2>
                            </div>
                            {/* Tabs */}
                            <div className="flex items-center gap-4 mt-1">
                                <button
                                    onClick={() => setActiveTab('chat')}
                                    className={`text-sm font-medium pb-1 transition-colors ${activeTab === 'chat'
                                        ? 'text-olive-600 dark:text-olive-400 border-b-2 border-olive-600'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                        }`}
                                >
                                    Chat
                                </button>
                                <button
                                    onClick={() => setActiveTab('files')}
                                    className={`text-sm font-medium pb-1 transition-colors flex items-center gap-1 ${activeTab === 'files'
                                        ? 'text-olive-600 dark:text-olive-400 border-b-2 border-olive-600'
                                        : 'text-neutral-500 hover:text-neutral-700'
                                        }`}
                                >
                                    <FileText size={14} />
                                    Archivos
                                </button>
                                {chatType === 'GROUP' && chatMembers && (
                                    <button
                                        onClick={() => setShowMembers(!showMembers)}
                                        className="text-xs text-neutral-500 hover:text-olive-600 flex items-center gap-1 ml-auto"
                                    >
                                        <span>{chatMembers.length} miembros</span>
                                        <span className="text-[10px]">{showMembers ? '▲' : '▼'}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className={`p-2 rounded-lg transition-colors ${showSearch ? 'bg-olive-100 text-olive-600' : 'text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100'}`}
                                title="Buscar en chat"
                            >
                                <Search size={18} />
                            </button>
                            {chatType === 'GROUP' && chatInfo?.canEdit && (
                                <button
                                    onClick={() => { setShowSettings(true); setNewName(chatName || ''); setNewImage(chatInfo?.image || ''); }}
                                    className="p-2 rounded-lg transition-colors text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100"
                                    title="Configuración del grupo"
                                >
                                    <Settings size={18} />
                                </button>
                            )}
                        </div>
                    </div>


                    {/* Expandable member list for GROUP */}
                    {chatType === 'GROUP' && showMembers && chatMembers && (
                        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                            <p className="text-xs font-semibold text-neutral-500 uppercase mb-2">Miembros del grupo</p>
                            <div className="flex flex-wrap gap-2">
                                {chatMembers.map((member) => (
                                    <div
                                        key={member.user.id}
                                        className="flex items-center gap-2 px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg"
                                    >
                                        <div className="w-6 h-6 rounded-full bg-olive-200 dark:bg-olive-900/50 flex items-center justify-center text-olive-700 dark:text-olive-300 text-xs font-bold">
                                            {member.user.name?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">{member.user.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Files Tab Content */}
            {activeTab === 'files' && (
                <div className="flex-1 overflow-y-auto p-4">
                    {loadingFiles ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="w-6 h-6 animate-spin text-olive-600" />
                        </div>
                    ) : files.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <EmptyState
                                icon={FileText}
                                title="No hay archivos"
                                description="Los archivos compartidos en este chat aparecerán aquí."
                            />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs text-neutral-500 font-medium uppercase mb-3">{files.length} archivos</p>
                            {files.map((file, idx) => (
                                <div
                                    key={file.messageId + '-' + idx}
                                    className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-neutral-900 dark:text-white truncate">
                                            {file.name || 'Archivo'}
                                        </p>
                                        <p className="text-xs text-neutral-500">
                                            {file.uploadedBy} • {format(new Date(file.uploadedAt), 'dd/MM/yyyy')}
                                        </p>
                                    </div>
                                    {file.url && (
                                        <a
                                            href={file.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-olive-600 hover:bg-olive-100 rounded-lg transition-colors"
                                            title="Descargar"
                                        >
                                            <Download className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Messages (Chat Tab) */}
            {activeTab === 'chat' && (
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
                                        <div key={message.id} id={`message-${message.id}`} className="transition-colors duration-500">
                                            <Message
                                                {...message}
                                                isOwnMessage={message.author.id === currentUserId}
                                                onReply={handleReply}
                                                onEdit={onEditMessage}
                                                onDelete={onDeleteMessage}
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            )}

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

            {/* Teams-style Search Side Panel */}
            <AnimatePresence>
                {showSearch && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute top-0 right-0 w-full md:w-80 h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 shadow-lg z-20 flex flex-col"
                    >
                        {/* Panel Header */}
                        <div className="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <h3 className="font-semibold text-neutral-900 dark:text-white">Buscar en el chat</h3>
                            <button
                                onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                                className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Search Input */}
                        <div className="p-3 border-b border-neutral-100 dark:border-neutral-800">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => { setSearchQuery(e.target.value); if (e.target.value.length >= 1) handleSearch(); }}
                                    placeholder="Buscar..."
                                    className="w-full px-3 py-2 pr-16 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-olive-500"
                                    autoFocus
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 text-xs font-medium hover:underline"
                                    >
                                        Borrar
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Results */}
                        <div className="flex-1 overflow-y-auto">
                            {isSearching ? (
                                <div className="flex items-center justify-center h-32">
                                    <Loader2 className="w-5 h-5 animate-spin text-olive-600" />
                                </div>
                            ) : searchResults.length > 0 ? (
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {Object.entries(groupByMonth(searchResults)).map(([month, msgs]) => (
                                        <div key={month}>
                                            <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-800 text-xs font-semibold text-neutral-500 capitalize">
                                                {month}
                                            </div>
                                            {msgs.map((msg: any) => (
                                                <button
                                                    key={msg.id}
                                                    onClick={() => scrollToMessage(msg.id)}
                                                    className="w-full text-left px-4 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-start gap-3"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-700 text-xs font-bold flex-shrink-0">
                                                        {msg.author.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium text-neutral-900 dark:text-white">{msg.author.name}</span>
                                                            <span className="text-[10px] text-neutral-400">{format(new Date(msg.createdAt), 'd/M')}</span>
                                                        </div>
                                                        <p className="text-xs text-neutral-600 dark:text-neutral-400 truncate mt-0.5">
                                                            {msg.content}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ) : searchQuery ? (
                                <div className="text-center py-8 text-neutral-500 text-sm">
                                    No se encontraron mensajes
                                </div>
                            ) : null}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showSettings && chatInfo && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between sticky top-0 bg-white dark:bg-neutral-800 z-10">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <Settings className="w-5 h-5 text-olive-600" />
                                Configuración del grupo
                            </h2>
                            <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Edit Name & Image */}
                            {/* Header: Image & Name */}
                            <div className="flex items-start gap-4 p-4 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-100 dark:border-neutral-700/50">
                                {/* Image Upload */}
                                <div className="relative group cursor-pointer w-16 h-16 rounded-full overflow-hidden bg-white dark:bg-neutral-800 border-2 border-white dark:border-neutral-700 shadow-sm flex-shrink-0">
                                    {newImage ? (
                                        <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-neutral-400 bg-neutral-100 dark:bg-neutral-800">
                                            <Settings className="w-8 h-8 opacity-50" />
                                        </div>
                                    )}
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer">
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={async (e) => {
                                                const file = e.target.files?.[0];
                                                if (!file) return;

                                                const formData = new FormData();
                                                formData.append('file', file);

                                                try {
                                                    // Optimistic preview
                                                    const reader = new FileReader();
                                                    reader.onload = (ev) => setNewImage(ev.target?.result as string);
                                                    reader.readAsDataURL(file);

                                                    const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                                    if (res.ok) {
                                                        const json = await res.json();
                                                        setNewImage(json.url);
                                                    } else {
                                                        console.error("Upload failed");
                                                        alert("Error al subir la imagen");
                                                    }
                                                } catch (err) {
                                                    console.error("Upload error", err);
                                                    alert("Error de conexión al subir imagen");
                                                }
                                            }}
                                        />
                                        <Camera className="w-6 h-6" />
                                    </label>
                                </div>

                                {/* Name Input */}
                                <div className="flex-1 space-y-1">
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                                        Nombre del grupo
                                    </label>
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        placeholder="Escribe un nombre..."
                                        className="w-full px-0 py-2 bg-transparent border-b-2 border-neutral-200 dark:border-neutral-700 focus:border-olive-500 text-lg font-semibold text-neutral-900 dark:text-white outline-none transition-colors placeholder:text-neutral-400"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={async () => {
                                        if (newName.trim() || newImage.trim()) {
                                            await updateGroupChat(chatId, {
                                                name: newName.trim() || undefined,
                                                image: newImage.trim() || undefined
                                            });
                                            setShowSettings(false);
                                            window.location.reload();
                                        }
                                    }}
                                    disabled={!newName.trim()}
                                    className="px-4 py-2 bg-olive-600 hover:bg-olive-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                                >
                                    Guardar Cambios
                                </button>
                            </div>

                            {/* Add Members */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Añadir miembros
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={memberQuery}
                                        onChange={(e) => {
                                            setMemberQuery(e.target.value);
                                            handleSearchMembers(e.target.value);
                                        }}
                                        placeholder="Buscar usuarios..."
                                        className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-olive-500"
                                    />
                                    {memberResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                                            {memberResults.map((user) => (
                                                <button
                                                    key={user.id}
                                                    onClick={async () => {
                                                        await updateGroupChat(chatId, { addMemberIds: [user.id] });
                                                        setChatInfo({
                                                            ...chatInfo,
                                                            members: [...chatInfo.members, { user: { id: user.id, name: user.name, email: user.email }, role: 'MEMBER' }]
                                                        });
                                                        setMemberQuery('');
                                                        setMemberResults([]);
                                                        alert(`Usuario ${user.name} añadido`);
                                                    }}
                                                    className="w-full text-left px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-2"
                                                >
                                                    <div className="w-6 h-6 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-700 text-xs font-bold">
                                                        {user.name?.[0]?.toUpperCase()}
                                                    </div>
                                                    <span className="text-sm text-neutral-900 dark:text-white">{user.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Members List */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                    Miembros ({chatInfo.members?.length || 0})
                                </label>
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {chatInfo.members?.map((m: any) => (
                                        <div key={m.user.id} className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-olive-700 text-xs font-bold">
                                                    {m.user.name?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-neutral-900 dark:text-white">{m.user.name}</p>
                                                    <p className="text-xs text-neutral-500">{m.role}</p>
                                                </div>
                                            </div>
                                            {m.role !== 'ADMIN' && chatInfo.canEdit && (
                                                <button
                                                    onClick={async () => {
                                                        if (confirm(`¿Eliminar a ${m.user.name} del grupo?`)) {
                                                            await updateGroupChat(chatId, { removeMemberIds: [m.user.id] });
                                                            window.location.reload();
                                                        }
                                                    }}
                                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                    title="Eliminar del grupo"
                                                >
                                                    <UserMinus className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Delete Group (only SUPERADMIN/ADMIN) */}
                            {chatInfo.canDelete && (
                                <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                    <button
                                        onClick={async () => {
                                            if (confirm('¿Estás seguro de eliminar este grupo? Esta acción no se puede deshacer.')) {
                                                await deleteGroupChat(chatId);
                                                router.push('/chat');
                                            }
                                        }}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar grupo
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}
