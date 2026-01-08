'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { MoreVertical, Reply, Edit2, Trash2, FileIcon } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { parseMentions } from '@/utils/mentions';

interface MessageProps {
    id: string;
    content: string;
    attachments?: any; // JSON type from Prisma
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
    isOwnMessage?: boolean;
    onReply?: (messageId: string) => void;
    onEdit?: (messageId: string, content: string) => void;
    onDelete?: (messageId: string) => void;
}

export default function Message({
    id,
    content,
    author,
    createdAt,
    isEdited = false,
    deletedAt,
    replyTo,
    attachments,
    isOwnMessage = false,
    onReply,
    onEdit,
    onDelete
}: MessageProps) {
    const [showActions, setShowActions] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(content);

    const handleSaveEdit = () => {
        if (editContent.trim() && editContent !== content) {
            onEdit?.(id, editContent.trim());
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditContent(content);
        setIsEditing(false);
    };

    // Avatar initials
    const initials = author.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const isDeleted = !!deletedAt;

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className={`group flex gap-3 px-6 py-2.5 hover:bg-neutral-50/70 transition-colors relative ${isDeleted ? 'opacity-50' : ''
                }`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Avatar */}
            <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold mt-0.5 ${isOwnMessage
                    ? 'bg-olive-600 text-white ring-2 ring-olive-100'
                    : 'bg-neutral-100 text-neutral-700 ring-2 ring-neutral-50'
                    }`}
            >
                {initials}
            </div>

            <div className="flex-1 min-w-0">
                {/* Header */}
                <div className="flex items-baseline gap-2.5 mb-0.5">
                    <span className={`font-bold text-sm ${isOwnMessage ? 'text-olive-700' : 'text-neutral-900'
                        }`}>
                        {author.name}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-medium">
                        {formatDistanceToNow(new Date(createdAt), {
                            addSuffix: true,
                            locale: es
                        })}
                    </span>
                    {isEdited && !isDeleted && (
                        <span className="text-[10px] text-neutral-400 italic bg-neutral-100 px-1.5 py-0.5 rounded">
                            editado
                        </span>
                    )}
                </div>

                {/* Reply Preview */}
                {replyTo && !isDeleted && (
                    <div className="mb-2 pl-2 border-l-3 border-olive-300 bg-olive-50/50 rounded-r px-3 py-1.5">
                        <div className="text-[11px] text-olive-700 font-bold mb-0.5">
                            {replyTo.author.name}
                        </div>
                        <div className="text-xs text-neutral-600 italic line-clamp-2">
                            {replyTo.content}
                        </div>
                    </div>
                )}

                {/* Content */}
                {isEditing ? (
                    <div className="space-y-2 mt-1">
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full px-3 py-2.5 border-2 border-olive-400 rounded-lg focus:outline-none focus:border-olive-600 resize-none text-sm"
                            rows={3}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveEdit}
                                className="px-3 py-1.5 bg-olive-600 text-white text-xs font-bold rounded-md hover:bg-olive-700 transition-colors shadow-sm"
                            >
                                Guardar
                            </button>
                            <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 bg-neutral-100 text-neutral-700 text-xs font-bold rounded-md hover:bg-neutral-200 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {/* Attachments */}
                        {Array.isArray(attachments) && attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {attachments.map((file: any, index: number) => (
                                    <div key={index}>
                                        {file.type.startsWith('image/') ? (
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="block max-w-[300px] overflow-hidden rounded-lg border border-neutral-200 hover:opacity-90 transition-opacity">
                                                <img src={file.url} alt={file.name} className="w-full h-auto object-cover max-h-[300px]" />
                                            </a>
                                        ) : (
                                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg hover:bg-neutral-100 transition-colors min-w-[200px]">
                                                <div className="p-2 bg-white rounded border border-neutral-100 text-blue-500">
                                                    <FileIcon className="w-5 h-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-neutral-900 truncate">{file.name}</p>
                                                    <p className="text-xs text-neutral-500">{(file.size / 1024).toFixed(0)} KB</p>
                                                </div>
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={`text-[13.5px] leading-relaxed whitespace-pre-wrap break-words ${isDeleted ? 'italic text-neutral-400' : 'text-neutral-800'
                            }`}>
                            {isDeleted ? content : parseMentions(content)}
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            <AnimatePresence>
                {showActions && !isDeleted && !isEditing && (
                    <motion.div
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.1 }}
                        className="flex items-start gap-0.5 absolute right-4 top-2 bg-white border border-neutral-200 rounded-lg shadow-sm px-1 py-1"
                    >
                        <button
                            onClick={() => onReply?.(id)}
                            className="p-1.5 hover:bg-neutral-100 rounded transition-colors"
                            title="Responder"
                        >
                            <Reply className="w-3.5 h-3.5 text-neutral-600" />
                        </button>
                        {isOwnMessage && (
                            <>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 hover:bg-neutral-100 rounded transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 className="w-3.5 h-3.5 text-neutral-600" />
                                </button>
                                <button
                                    onClick={() => onDelete?.(id)}
                                    className="p-1.5 hover:bg-red-50 rounded transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                </button>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
