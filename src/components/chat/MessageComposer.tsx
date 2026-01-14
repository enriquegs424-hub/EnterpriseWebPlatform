'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Users, Paperclip, Loader2, FileIcon, ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMentionAutocomplete } from '@/hooks/useMentionAutocomplete';
import { useToast } from '@/components/ui/Toast';

interface MessageComposerProps {
    chatId?: string;
    onSendMessage: (content: string, replyToId?: string, attachments?: any[]) => void;
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
    const [attachments, setAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const toast = useToast();

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

    // TEMPORARILY DISABLED - Investigating onChange blocking issue
    // const {
    //     showSuggestions,
    //     suggestions,
    //     selectedIndex,
    //     handleKeyDown: handleMentionKeyDown,
    //     selectSuggestion
    // } = useMentionAutocomplete({
    //     textareaRef,
    //     onSelectMention: (username) => {
    //         console.log('Mentioned:', username);
    //     },
    //     onTextChange: setMessage
    // });

    // Temporary dummy values while hook is disabled
    const showSuggestions = false;
    const suggestions: any[] = [];
    const selectedIndex = 0;
    const handleMentionKeyDown = (e: any) => false;
    const selectSuggestion = (index: number) => { };

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

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newAttachments: any[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Error uploading file');

                const data = await response.json();
                newAttachments.push(data);
            } catch (error) {
                console.error('Upload failed:', error);
                toast.error('Error', `No se pudo subir ${file.name}`);
            }
        }

        setAttachments(prev => [...prev, ...newAttachments]);
        setIsUploading(false);

        // Reset file input
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = () => {
        const trimmed = message.trim();
        if (!trimmed && attachments.length === 0) return;

        // @ts-ignore - Updated sendMessage accepts attachments
        onSendMessage(trimmed, replyingTo?.id, attachments);
        setMessage('');
        setAttachments([]);

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
    };

    return (
        <div className="border-t border-theme-primary surface-secondary relative">
            <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
            />

            {/* Reply Preview */}
            <AnimatePresence>
                {replyingTo && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 pt-3 border-b border-theme-secondary overflow-hidden"
                    >
                        <div className="flex items-start gap-2 pb-3 accent-bg rounded-lg px-3 py-2.5 border-l-3 border-olive-500">
                            <div className="flex-1 min-w-0">
                                <div className="text-[11px] font-bold accent-text mb-0.5 uppercase tracking-wide">
                                    Respondiendo a {replyingTo.author}
                                </div>
                                <div className="text-xs text-theme-secondary truncate">
                                    {replyingTo.content}
                                </div>
                            </div>
                            <button
                                onClick={onCancelReply}
                                className="p-1 interactive rounded transition-colors flex-shrink-0"
                                aria-label="Cancelar respuesta"
                            >
                                <X className="w-3.5 h-3.5 text-neutral-500" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Attachments Preview */}
            <AnimatePresence>
                {attachments.length > 0 && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pt-4 flex gap-2 overflow-x-auto"
                    >
                        {attachments.map((file, index) => (
                            <div key={index} className="relative group surface-tertiary rounded-lg p-2 flex items-center gap-2 min-w-[150px] max-w-[200px] border border-theme-primary">
                                <div className="p-2 surface-secondary rounded-md shrink-0">
                                    {file.type.startsWith('image/') ? (
                                        <ImageIcon className="w-4 h-4 text-purple-500" />
                                    ) : (
                                        <FileIcon className="w-4 h-4 text-blue-500" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-theme-secondary truncate" title={file.name}>{file.name}</p>
                                    <p className="text-[10px] text-theme-muted">{(file.size / 1024).toFixed(0)} KB</p>
                                </div>
                                <button
                                    onClick={() => removeAttachment(index)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input Area */}
            <div className="p-4 flex items-end gap-2.5 relative">
                {/* Upload Button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="p-3 text-neutral-400 hover:text-olive-600 hover:bg-olive-50 rounded-lg transition-colors"
                    title="Adjuntar archivo"
                >
                    {isUploading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Paperclip className="w-5 h-5" />
                    )}
                </button>

                <div className="flex-1 relative">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => {
                            console.log('[CHAT DEBUG] onChange fired, value:', e.target.value);
                            setMessage(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            console.log('[CHAT DEBUG] onKeyDown fired, key:', e.key);
                            handleKeyDown(e);
                        }}
                        onInput={(e) => {
                            console.log('[CHAT DEBUG] onInput fired');
                        }}
                        placeholder={placeholder}
                        className="w-full px-4 py-3 border-2 border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl min-h-[44px] max-h-[150px] text-[13.5px] leading-relaxed resize-none focus:border-olive-500 focus:ring-2 focus:ring-olive-500/20 outline-none"
                        rows={1}
                        aria-label="Campo de mensaje"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={true}
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
                                                : 'hover:bg-neutral-50 border-l-4 border-olive-50'
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
                    disabled={(!message.trim() && attachments.length === 0) || isUploading}
                    className={`p-3.5 rounded-lg font-bold transition-all flex items-center justify-center shadow-sm ${(!message.trim() && attachments.length === 0) || isUploading
                        ? 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                        : 'bg-olive-600 text-white hover:bg-olive-700 hover:shadow-md active:scale-95'
                        }`}
                    aria-label="Enviar mensaje"
                    title="Enter para enviar"
                >
                    <Send className={`w-5 h-5 transition-transform ${message.trim() ? 'translate-x-0.5' : ''}`} />
                </button>
            </div>

            {/* Hint */}
            <div className="px-5 pb-3 text-[11px] text-theme-muted flex items-center gap-3">
                <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 surface-tertiary rounded text-[10px] font-mono text-theme-secondary">@</kbd>
                    <span>mencionar</span>
                </span>
                <span className="text-theme-muted">•</span>
                <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 surface-tertiary rounded text-[10px] font-mono text-theme-secondary">Enter</kbd>
                    <span>enviar</span>
                </span>
                <span className="text-theme-muted">•</span>
                <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 surface-tertiary rounded text-[10px] font-mono text-theme-secondary">Ctrl+Enter</kbd>
                    <span>salto</span>
                </span>
            </div>
        </div>
    );
}
