'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMentionAutocomplete } from '@/hooks/useMentionAutocomplete';

interface MessageComposerProps {
    chatId?: string;
    onSendMessage: (content: string, replyToId?: string) => void;
    replyingTo?: {
        id: string;
        author: string;
        content: string;
    } | null;
    onCancelReply?: () => void;
    placeholder?: string;
}

export default function MessageComposer({
    chatId,
    onSendMessage,
    replyingTo,
    onCancelReply,
    placeholder = 'Escribe un mensaje...'
}: MessageComposerProps) {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Import typing actions dynamically to avoid circular deps
    const setTypingStatus = async (isTyping: boolean) => {
        if (!chatId) return;
        try {
            const { setTypingStatus: setStatus } = await import('@/app/(protected)/chat/actions');
            await setStatus(chatId, isTyping);
        } catch (error) {
            // Silent fail - typing indicators are not critical
        }
    };

    // Handle typing indicator
    useEffect(() => {
        if (!chatId || !message) return;

        // Set typing to true
        setTypingStatus(true);

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set timeout to clear typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
            setTypingStatus(false);
        }, 3000);

        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [message, chatId]);

    // Mention autocomplete
    const {
        showSuggestions,
        suggestions,
        selectedIndex,
        handleKeyDown: handleMentionKeyDown,
        selectSuggestion
    } = useMentionAutocomplete({
        textareaRef,
        onSelectMention: (username) => {
            // Optional: track mentions for analytics
            console.log('Mentioned:', username);
        }
    });

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [message]);

    // Focus on mount and when replying
    useEffect(() => {
        textareaRef.current?.focus();
    }, [replyingTo]);

    const handleSend = () => {
        const trimmed = message.trim();
        if (!trimmed) return;

        onSendMessage(trimmed, replyingTo?.id);
        setMessage('');

        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // First, check if mention autocomplete handles the key
        const mentionHandled = handleMentionKeyDown(e);
        if (mentionHandled) return;

        // Enter to send (unless Shift or Ctrl is pressed)
        if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleSend();
        }
        // Escape to cancel reply
        if (e.key === 'Escape' && replyingTo) {
            onCancelReply?.();
        }
        // Ctrl+Enter or Shift+Enter for line break (default behavior)
    };

    return (
        <div className="border-t border-neutral-200 bg-white relative">
            {/* Reply Preview */}
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 pt-3 border-b border-neutral-100 overflow-hidden"
                    >
                        <div className="flex items-start gap-2 pb-3 bg-olive-50/50 rounded-lg px-3 py-2.5 border-l-3 border-olive-500">
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-bold text-olive-700 mb-0.5 uppercase tracking-wide">
                                    Respondiendo a {replyingTo.author}
                                </div>
                                <div className="text-xs text-neutral-600 truncate">
                                    {replyingTo.content}
                                </div>
                            </div>
                            <button
                                onClick={onCancelReply}
                                className="p-1 hover:bg-neutral-200 rounded transition-colors flex-shrink-0"
                                aria-label="Cancelar respuesta"
                            >
                                <X className="w-3.5 h-3.5 text-neutral-500" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 flex items-end gap-2.5 relative">
                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-olive-500 focus:outline-none resize-none min-h-[44px] max-h-[150px] text-[13.5px] leading-relaxed transition-all"
                        rows={1}
                        aria-label="Campo de mensaje"
                    />

                    {/* Mention Autocomplete Dropdown */}
                    <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 5 }}
                                transition={{ duration: 0.15 }}
                                className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-white border-2 border-olive-300 rounded-lg shadow-lg overflow-hidden z-50"
                            >
                                <div className="p-2 bg-olive-50 border-b border-olive-200 flex items-center gap-2">
                                    <Users className="w-4 h-4 text-olive-600" />
                                    <span className="text-xs font-bold text-olive-700 uppercase tracking-wide">
                                        Mencionar Usuario
                                    </span>
                                </div>
                                <div className="max-h-64 overflow-y-auto">
                                    {suggestions.map((user, index) => (
                                        <button
                                            key={user.id}
                                            onClick={() => selectSuggestion(index)}
                                            className={`w-full px-3 py-2.5 text-left transition-colors flex items-center gap-3 ${index === selectedIndex
                                                ? 'bg-olive-100 border-l-4 border-olive-600'
                                                : 'hover:bg-neutral-50 border-l-4 border-transparent'
                                                }`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-olive-100 flex items-center justify-center text-olive-700 font-bold text-xs flex-shrink-0">
                                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-sm text-neutral-900 truncate">
                                                    @{user.name}
                                                </div>
                                                <div className="text-xs text-neutral-500 truncate">
                                                    {user.email} • {user.department}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="p-2 bg-neutral-50 border-t border-neutral-200 text-[10px] text-neutral-500 flex items-center gap-2">
                                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-neutral-300">↑↓</kbd>
                                    <span>Navegar</span>
                                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-neutral-300">Enter</kbd>
                                    <span>Seleccionar</span>
                                    <kbd className="px-1.5 py-0.5 bg-white rounded border border-neutral-300">ESC</kbd>
                                    <span>Cerrar</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
                <button
                    onClick={handleSend}
                    disabled={!message.trim()}
                    className={`p-3.5 rounded-lg font-bold transition-all flex items-center justify-center shadow-sm ${message.trim()
                        ? 'bg-olive-600 text-white hover:bg-olive-700 hover:shadow-md active:scale-95'
                        : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                        }`}
                    aria-label="Enviar mensaje"
                    title="Enter para enviar"
                >
                    <Send className={`w-5 h-5 transition-transform ${message.trim() ? 'translate-x-0.5' : ''}`} />
                </button>
            </div>

            {/* Hint */}
            <div className="px-5 pb-3 text-[11px] text-neutral-400 flex items-center gap-3">
                <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono text-neutral-600">@</kbd>
                    <span>mencionar</span>
                </span>
                <span className="text-neutral-300">•</span>
                <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono text-neutral-600">Enter</kbd>
                    <span>enviar</span>
                </span>
                <span className="text-neutral-300">•</span>
                <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-neutral-100 rounded text-[10px] font-mono text-neutral-600">Ctrl+Enter</kbd>
                    <span>salto</span>
                </span>
            </div>
        </div>
    );
}
