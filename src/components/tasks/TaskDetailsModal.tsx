'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Calendar, User, Flag, AlignLeft, Trash2, Save, CheckSquare,
    MessageSquare, Users, Paperclip, Plus, Check, Minus, Send, Tag,
    Upload, File, Download, Image as ImageIcon
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { deleteTask, updateTask, getUsersForAssignment } from '@/app/(protected)/tasks/actions';
import {
    addTaskComment, deleteTaskComment,
    addTaskLabel, deleteTaskLabel,
    addChecklistItem, toggleChecklistItem, deleteChecklistItem,
    addTaskAttachment, deleteTaskAttachment
} from '@/app/(protected)/tasks/task-enhancements-actions';
import { useToast } from '@/components/ui/Toast';

interface TaskDetailsModalProps {
    task: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

const LABEL_COLORS = [
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Verde', value: '#10B981' },
    { name: 'Rojo', value: '#EF4444' },
    { name: 'Amarillo', value: '#F59E0B' },
    { name: 'Morado', value: '#8B5CF6' },
    { name: 'Rosa', value: '#EC4899' },
    { name: 'Gris', value: '#6B7280' },
];

export default function TaskDetailsModal({ task, isOpen, onClose, onUpdate }: TaskDetailsModalProps) {
    const { data: session } = useSession();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'comments' | 'attachments'>('details');

    // Edit State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('PENDING');
    const [priority, setPriority] = useState('MEDIUM');
    const [dueDate, setDueDate] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);

    // Checklist State
    const [checklistItems, setChecklistItems] = useState<any[]>([]);
    const [newChecklistItem, setNewChecklistItem] = useState('');

    // Comments State
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');

    // Labels State
    const [labels, setLabels] = useState<any[]>([]);
    const [showLabelPicker, setShowLabelPicker] = useState(false);
    const [newLabelName, setNewLabelName] = useState('');
    const [newLabelColor, setNewLabelColor] = useState(LABEL_COLORS[0].value);

    // Attachments State
    const [attachments, setAttachments] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

    // Initialize
    useEffect(() => {
        if (task && isOpen) {
            setTitle(task.title || '');
            setDescription(task.description || '');
            setStatus(task.status || 'PENDING');
            setPriority(task.priority || 'MEDIUM');
            setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');

            const assignees = task.assignees && task.assignees.length > 0
                ? task.assignees.map((a: any) => a.id)
                : (task.assignedToId ? [task.assignedToId] : []);
            setSelectedAssignees(assignees);

            setChecklistItems(task.checklistItems || []);
            setComments(task.comments || []);
            setLabels(task.labels || []);
            setAttachments(task.attachments || []);

            loadUsers();
        }
    }, [task, isOpen]);

    const loadUsers = async () => {
        const fetchedUsers = await getUsersForAssignment();
        setUsers(fetchedUsers);
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;

        setLoading(true);
        try {
            const result = await deleteTask(task.id);
            if (result.success) {
                toast.success('Tarea eliminada', 'La tarea se ha eliminado correctamente');
                onClose();
                if (onUpdate) onUpdate();
            } else {
                toast.error('Error', result.error || 'No se pudo eliminar la tarea');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error', 'Ocurrió un error al eliminar la tarea');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const result = await updateTask(task.id, {
                title,
                description,
                status,
                priority,
                dueDate: dueDate || undefined,
                assignedToId: selectedAssignees[0] || undefined
            });

            if (result.success) {
                toast.success('Tarea actualizada', 'Los cambios se han guardado correctamente');
                if (onUpdate) onUpdate();
            } else {
                toast.error('Error', result.error || 'No se pudo actualizar la tarea');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error', 'Ocurrió un error al actualizar la tarea');
        } finally {
            setLoading(false);
        }
    };

    const toggleAssignee = (userId: string) => {
        setSelectedAssignees(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    // Checklist handlers
    const handleAddChecklistItem = async () => {
        if (!newChecklistItem.trim()) return;

        const result = await addChecklistItem(task.id, newChecklistItem);
        if (result.success) {
            setChecklistItems(prev => [...prev, result.data]);
            setNewChecklistItem('');
        }
    };

    const handleToggleChecklistItem = async (itemId: string) => {
        const result = await toggleChecklistItem(itemId);
        if (result.success) {
            setChecklistItems(prev => prev.map(item =>
                item.id === itemId ? result.data : item
            ));
        }
    };

    const handleDeleteChecklistItem = async (itemId: string) => {
        const result = await deleteChecklistItem(itemId);
        if (result.success) {
            setChecklistItems(prev => prev.filter(item => item.id !== itemId));
        }
    };

    // Comment handlers
    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        const result = await addTaskComment(task.id, newComment);
        if (result.success) {
            setComments(prev => [result.data, ...prev]);
            setNewComment('');
            toast.success('Comentario añadido', '');
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('¿Eliminar comentario?')) return;

        const result = await deleteTaskComment(commentId);
        if (result.success) {
            setComments(prev => prev.filter(c => c.id !== commentId));
        }
    };

    // Label handlers
    const handleAddLabel = async () => {
        if (!newLabelName.trim()) return;

        const result = await addTaskLabel(task.id, {
            name: newLabelName,
            color: newLabelColor
        });

        if (result.success) {
            setLabels(prev => [...prev, result.data]);
            setNewLabelName('');
            setShowLabelPicker(false);
        }
    };

    const handleDeleteLabel = async (labelId: string) => {
        const result = await deleteTaskLabel(labelId);
        if (result.success) {
            setLabels(prev => prev.filter(l => l.id !== labelId));
        }
    };

    // File upload handler (simplified - in production use proper file upload service)
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // In production, upload to S3/Cloudinary/etc
            // For now, we'll use a data URL (not recommended for production)
            const reader = new FileReader();
            reader.onloadend = async () => {
                const result = await addTaskAttachment(task.id, {
                    fileName: file.name,
                    fileUrl: reader.result as string,
                    fileSize: file.size,
                    mimeType: file.type
                });

                if (result.success) {
                    setAttachments(prev => [...prev, result.data]);
                    toast.success('Archivo subido', '');
                }
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error(error);
            toast.error('Error', 'No se pudo subir el archivo');
            setUploading(false);
        }
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        if (!confirm('¿Eliminar archivo?')) return;

        const result = await deleteTaskAttachment(attachmentId);
        if (result.success) {
            setAttachments(prev => prev.filter(a => a.id !== attachmentId));
        }
    };

    const getPriorityStyles = (p: string) => {
        switch (p) {
            case 'URGENT': return { bg: 'bg-red-500', text: 'text-white', label: 'Urgente' };
            case 'HIGH': return { bg: 'bg-orange-500', text: 'text-white', label: 'Alta' };
            case 'MEDIUM': return { bg: 'bg-blue-500', text: 'text-white', label: 'Media' };
            case 'LOW': return { bg: 'bg-neutral-400', text: 'text-white', label: 'Baja' };
            default: return { bg: 'bg-neutral-400', text: 'text-white', label: 'Media' };
        }
    };

    const getStatusLabel = (s: string) => {
        const labels: Record<string, string> = {
            'PENDING': 'Pendiente',
            'IN_PROGRESS': 'En Progreso',
            'COMPLETED': 'Completada',
            'CANCELLED': 'Cancelada'
        };
        return labels[s] || s;
    };

    if (!isOpen || !task) return null;

    const priorityStyle = getPriorityStyles(priority);
    const assignedUsers = users.filter(u => selectedAssignees.includes(u.id));
    const checklistProgress = checklistItems.length > 0
        ? Math.round((checklistItems.filter(i => i.completed).length / checklistItems.length) * 100)
        : 0;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-neutral-200 dark:border-neutral-800"
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                    <div className="flex-1">
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-2xl font-black text-neutral-900 dark:text-neutral-100 bg-transparent border-none outline-none w-full mb-2"
                            placeholder="Título de la tarea"
                        />
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${priorityStyle.bg} ${priorityStyle.text}`}>
                                {priorityStyle.label}
                            </span>
                            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                {getStatusLabel(status)}
                            </span>
                            {task.project && (
                                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-olive-100 dark:bg-olive-900/30 text-olive-700 dark:text-olive-400">
                                    📁 {task.project.code}
                                </span>
                            )}
                            {/* Labels */}
                            {labels.map(label => (
                                <span
                                    key={label.id}
                                    className="px-3 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1"
                                    style={{ backgroundColor: label.color }}
                                >
                                    {label.name}
                                    <button
                                        onClick={() => handleDeleteLabel(label.id)}
                                        className="hover:bg-white/20 rounded p-0.5"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            <button
                                onClick={() => setShowLabelPicker(!showLabelPicker)}
                                className="px-2 py-1 rounded-lg text-xs font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all"
                            >
                                <Tag size={14} className="inline mr-1" />
                                Etiqueta
                            </button>
                        </div>

                        {/* Label Picker */}
                        <AnimatePresence>
                            {showLabelPicker && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="mt-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                                >
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={newLabelName}
                                            onChange={(e) => setNewLabelName(e.target.value)}
                                            placeholder="Nombre de etiqueta..."
                                            className="flex-1 px-3 py-1.5 text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg outline-none"
                                        />
                                        <button
                                            onClick={handleAddLabel}
                                            className="px-3 py-1.5 bg-olive-600 hover:bg-olive-700 text-white rounded-lg text-sm font-bold"
                                        >
                                            Añadir
                                        </button>
                                    </div>
                                    <div className="flex gap-2">
                                        {LABEL_COLORS.map(color => (
                                            <button
                                                key={color.value}
                                                onClick={() => setNewLabelColor(color.value)}
                                                className={`w-6 h-6 rounded-full border-2 ${newLabelColor === color.value ? 'border-neutral-900 dark:border-white' : 'border-transparent'
                                                    }`}
                                                style={{ backgroundColor: color.value }}
                                                title={color.name}
                                            />
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-all text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-6">
                    <button
                        onClick={() => setActiveTab('details')}
                        className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'details'
                                ? 'border-olive-600 text-olive-600 dark:text-olive-500'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                    >
                        <AlignLeft size={16} className="inline mr-2" />
                        Detalles
                    </button>
                    <button
                        onClick={() => setActiveTab('checklist')}
                        className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'checklist'
                                ? 'border-olive-600 text-olive-600 dark:text-olive-500'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                    >
                        <CheckSquare size={16} className="inline mr-2" />
                        Checklist ({checklistItems.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'comments'
                                ? 'border-olive-600 text-olive-600 dark:text-olive-500'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                    >
                        <MessageSquare size={16} className="inline mr-2" />
                        Comentarios ({comments.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('attachments')}
                        className={`px-4 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'attachments'
                                ? 'border-olive-600 text-olive-600 dark:text-olive-500'
                                : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                            }`}
                    >
                        <Paperclip size={16} className="inline mr-2" />
                        Archivos ({attachments.length})
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            <AnimatePresence mode="wait">
                                {activeTab === 'details' && (
                                    <motion.div
                                        key="details"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-4"
                                    >
                                        <div>
                                            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                                                Descripción
                                            </label>
                                            <textarea
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}
                                                rows={6}
                                                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none resize-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 font-medium"
                                                placeholder="Añade una descripción detallada..."
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'checklist' && (
                                    <motion.div
                                        key="checklist"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-4"
                                    >
                                        {checklistItems.length > 0 && (
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                                                        Progreso
                                                    </span>
                                                    <span className="text-sm font-bold text-olive-600 dark:text-olive-500">
                                                        {checklistProgress}%
                                                    </span>
                                                </div>
                                                <div className="bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-olive-600 dark:bg-olive-500 h-full transition-all duration-300"
                                                        style={{ width: `${checklistProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            {checklistItems.map((item) => (
                                                <div
                                                    key={item.id}
                                                    className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg group hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all"
                                                >
                                                    <button
                                                        onClick={() => handleToggleChecklistItem(item.id)}
                                                        className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${item.completed
                                                                ? 'bg-olive-600 border-olive-600'
                                                                : 'border-neutral-300 dark:border-neutral-600 hover:border-olive-500'
                                                            }`}
                                                    >
                                                        {item.completed && <Check size={14} className="text-white" />}
                                                    </button>
                                                    <span className={`flex-1 text-sm font-medium ${item.completed
                                                            ? 'line-through text-neutral-400 dark:text-neutral-500'
                                                            : 'text-neutral-900 dark:text-neutral-100'
                                                        }`}>
                                                        {item.text}
                                                    </span>
                                                    <button
                                                        onClick={() => handleDeleteChecklistItem(item.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all text-neutral-400 hover:text-red-600"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newChecklistItem}
                                                onChange={(e) => setNewChecklistItem(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleAddChecklistItem()}
                                                placeholder="Añadir elemento..."
                                                className="flex-1 px-4 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100"
                                            />
                                            <button
                                                onClick={handleAddChecklistItem}
                                                className="px-4 py-2.5 bg-olive-600 hover:bg-olive-700 dark:bg-olive-700 dark:hover:bg-olive-600 text-white rounded-lg transition-all font-bold"
                                            >
                                                <Plus size={18} />
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'comments' && (
                                    <motion.div
                                        key="comments"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-4"
                                    >
                                        {/* Add Comment */}
                                        <div className="flex gap-2">
                                            <textarea
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                rows={2}
                                                placeholder="Escribe un comentario..."
                                                className="flex-1 px-4 py-2.5 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none resize-none text-neutral-900 dark:text-neutral-100"
                                            />
                                            <button
                                                onClick={handleAddComment}
                                                disabled={!newComment.trim()}
                                                className="px-4 h-fit bg-olive-600 hover:bg-olive-700 disabled:bg-neutral-300 dark:disabled:bg-neutral-700 text-white rounded-lg transition-all font-bold"
                                            >
                                                <Send size={18} />
                                            </button>
                                        </div>

                                        {/* Comments List */}
                                        <div className="space-y-3">
                                            {comments.map((comment) => (
                                                <div key={comment.id} className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4 group">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {comment.user?.image ? (
                                                                <img src={comment.user.image} alt={comment.user.name} className="w-6 h-6 rounded-full" />
                                                            ) : (
                                                                <div className="w-6 h-6 rounded-full bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center text-xs font-bold text-olive-700 dark:text-olive-400">
                                                                    {comment.user?.name?.charAt(0)}
                                                                </div>
                                                            )}
                                                            <span className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                                                                {comment.user?.name}
                                                            </span>
                                                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                                                {format(new Date(comment.createdAt), "dd/MM/yyyy 'a las' HH:mm")}
                                                            </span>
                                                        </div>
                                                        {(comment.userId === session?.user?.id || session?.user?.role === 'ADMIN') && (
                                                            <button
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all text-neutral-400 hover:text-red-600"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            ))}
                                            {comments.length === 0 && (
                                                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                                                    <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No hay comentarios aún</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'attachments' && (
                                    <motion.div
                                        key="attachments"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-4"
                                    >
                                        {/* Upload */}
                                        <div>
                                            <label className="flex items-center justify-center gap-2 px-4 py-8 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg hover:border-olive-500 dark:hover:border-olive-500 transition-all cursor-pointer bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700">
                                                <Upload size={20} className="text-neutral-500" />
                                                <span className="text-sm font-bold text-neutral-600 dark:text-neutral-400">
                                                    {uploading ? 'Subiendo...' : 'Click para subir archivo'}
                                                </span>
                                                <input
                                                    type="file"
                                                    onChange={handleFileUpload}
                                                    className="hidden"
                                                    disabled={uploading}
                                                />
                                            </label>
                                        </div>

                                        {/* Attachments List */}
                                        <div className="space-y-2">
                                            {attachments.map((attachment) => {
                                                const isImage = attachment.mimeType?.startsWith('image/');
                                                return (
                                                    <div key={attachment.id} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg group hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all">
                                                        <div className="flex-shrink-0">
                                                            {isImage ? (
                                                                <ImageIcon size={20} className="text-blue-500" />
                                                            ) : (
                                                                <File size={20} className="text-neutral-500" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                                                                {attachment.fileName}
                                                            </p>
                                                            <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                                                {(attachment.fileSize / 1024).toFixed(1)} KB
                                                            </p>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <a
                                                                href={attachment.fileUrl}
                                                                download={attachment.fileName}
                                                                className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded transition-all text-neutral-600 dark:text-neutral-400"
                                                            >
                                                                <Download size={16} />
                                                            </a>
                                                            <button
                                                                onClick={() => handleDeleteAttachment(attachment.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-all text-neutral-400 hover:text-red-600"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {attachments.length === 0 && (
                                                <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                                                    <Paperclip size={32} className="mx-auto mb-2 opacity-50" />
                                                    <p className="text-sm">No hay archivos adjuntos</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Status */}
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                                    Estado
                                </label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
                                >
                                    <option value="PENDING">Pendiente</option>
                                    <option value="IN_PROGRESS">En Progreso</option>
                                    <option value="COMPLETED">Completada</option>
                                    <option value="CANCELLED">Cancelada</option>
                                </select>
                            </div>

                            {/* Priority */}
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">
                                    Prioridad
                                </label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
                                >
                                    <option value="LOW">Baja</option>
                                    <option value="MEDIUM">Media</option>
                                    <option value="HIGH">Alta</option>
                                    <option value="URGENT">Urgente</option>
                                </select>
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                                    <Calendar size={16} />
                                    Fecha límite
                                </label>
                                <input
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:ring-2 focus:ring-olive-500/20 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
                                />
                            </div>

                            {/* Assignees */}
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2 flex items-center gap-2">
                                    <Users size={16} />
                                    Asignado a ({selectedAssignees.length})
                                </label>

                                {assignedUsers.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {assignedUsers.map(user => (
                                            <div key={user.id} className="flex items-center gap-1.5 bg-olive-100 dark:bg-olive-900/30 text-olive-700 dark:text-olive-400 px-2 py-1 rounded-lg text-xs font-bold">
                                                {user.image ? (
                                                    <img src={user.image} alt={user.name} className="w-4 h-4 rounded-full" />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full bg-olive-200 dark:bg-olive-800 flex items-center justify-center text-[10px]">
                                                        {user.name?.charAt(0)}
                                                    </div>
                                                )}
                                                <span>{user.name}</span>
                                                <button
                                                    onClick={() => toggleAssignee(user.id)}
                                                    className="ml-1 hover:text-olive-900 dark:hover:text-olive-200"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="max-h-48 overflow-y-auto space-y-1 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-2 border border-neutral-200 dark:border-neutral-700">
                                    {users.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => toggleAssignee(user.id)}
                                            className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left ${selectedAssignees.includes(user.id)
                                                    ? 'bg-olive-100 dark:bg-olive-900/30 text-olive-700 dark:text-olive-400'
                                                    : 'hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                                }`}
                                        >
                                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedAssignees.includes(user.id)
                                                    ? 'bg-olive-600 border-olive-600'
                                                    : 'border-neutral-300 dark:border-neutral-600'
                                                }`}>
                                                {selectedAssignees.includes(user.id) && <Check size={14} className="text-white" />}
                                            </div>
                                            {user.image ? (
                                                <img src={user.image} alt={user.name} className="w-6 h-6 rounded-full" />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold">
                                                    {user.name?.charAt(0)}
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.role}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Creator Info */}
                            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 mb-2">
                                    Creado por
                                </label>
                                <div className="flex items-center gap-2">
                                    {task.createdBy?.image ? (
                                        <img src={task.createdBy.image} alt={task.createdBy.name} className="w-6 h-6 rounded-full" />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-xs font-bold">
                                            {task.createdBy?.name?.charAt(0)}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{task.createdBy?.name}</p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                            {task.createdAt && format(new Date(task.createdAt), "dd/MM/yyyy 'a las' HH:mm")}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                    >
                        <Trash2 size={18} />
                        <span>Eliminar</span>
                    </button>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-bold rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex items-center gap-2 px-8 py-2.5 bg-olive-600 hover:bg-olive-700 dark:bg-olive-700 dark:hover:bg-olive-600 text-white font-bold rounded-lg transition-all shadow-sm"
                        >
                            <Save size={18} />
                            <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
