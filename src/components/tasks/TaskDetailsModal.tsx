'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, User, Flag, AlignLeft, Trash2, Edit2, Save, CheckSquare, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { deleteTask, updateTask } from '@/app/(protected)/tasks/actions';
import { getAllUsers, getAllProjects } from '@/app/admin/actions';
import { useToast } from '@/components/ui/Toast';

interface TaskDetailsModalProps {
    task: any;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

export default function TaskDetailsModal({ task, isOpen, onClose, onUpdate }: TaskDetailsModalProps) {
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Edit Form State
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [status, setStatus] = useState(task?.status || 'PENDING');
    const [priority, setPriority] = useState(task?.priority || 'MEDIUM');
    const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
    const [users, setUsers] = useState<any[]>([]);

    // Initialize state
    const startEditing = async () => {
        if (!task) return;

        // Fetch users for assignment dropdown if needed
        if (users.length === 0) {
            const fetchedUsers = await getAllUsers();
            setUsers(fetchedUsers);
        }

        setTitle(task.title);
        setDescription(task.description || '');
        setStatus(task.status);
        setPriority(task.priority);
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');

        setIsEditing(true);
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

    const handleUpdate = async () => {
        setLoading(true);
        try {
            const result = await updateTask(task.id, {
                title,
                description,
                status,
                priority,
                dueDate: dueDate || undefined
            });

            if (result.success) {
                toast.success('Tarea actualizada', 'Los cambios se han guardado correctamente');
                setIsEditing(false);
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

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'URGENT': return 'bg-red-100 text-red-800';
            case 'HIGH': return 'bg-orange-100 text-orange-800';
            case 'MEDIUM': return 'bg-blue-100 text-blue-800';
            default: return 'bg-neutral-100 text-neutral-800';
        }
    };

    const getStatusColor = (s: string) => {
        switch (s) {
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
            case 'PENDING': return 'bg-neutral-100 text-neutral-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-neutral-100 text-neutral-800';
        }
    };

    if (!isOpen || !task) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header */}
                <div className="p-6 border-b border-neutral-200 bg-neutral-50 flex justify-between items-start">
                    <div className="flex-1 mr-4">
                        {isEditing ? (
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-xl font-black text-neutral-900 bg-white border border-neutral-300 rounded-lg px-3 py-2 w-full"
                                placeholder="Título de la tarea"
                            />
                        ) : (
                            <div>
                                <div className="flex space-x-2 mb-2">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide ${getStatusColor(task.status)}`}>
                                        {task.status}
                                    </span>
                                    <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-neutral-900">{task.title}</h3>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-lg text-neutral-500 hover:text-neutral-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto">
                    {/* Status & Priority Editing */}
                    {isEditing && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 mb-1">Estado</label>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-white"
                                >
                                    <option value="PENDING">Pendiente</option>
                                    <option value="IN_PROGRESS">En Progreso</option>
                                    <option value="COMPLETED">Completada</option>
                                    <option value="CANCELLED">Cancelada</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 mb-1">Prioridad</label>
                                <select
                                    value={priority}
                                    onChange={(e) => setPriority(e.target.value)}
                                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 bg-white"
                                >
                                    <option value="LOW">Baja</option>
                                    <option value="MEDIUM">Media</option>
                                    <option value="HIGH">Alta</option>
                                    <option value="URGENT">Urgente</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Due Date */}
                        <div className="flex items-start space-x-3">
                            <Calendar className="text-neutral-400 mt-1" size={20} />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-neutral-900 mb-1">Fecha Límite</h4>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={dueDate}
                                        onChange={e => setDueDate(e.target.value)}
                                        className="w-full text-sm border border-neutral-300 rounded-lg px-2 py-1"
                                    />
                                ) : (
                                    <p className="text-neutral-600">
                                        {task.dueDate ? format(new Date(task.dueDate), "EEEE d 'de' MMMM, yyyy", { locale: es }) : 'Sin fecha límite'}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Assignee */}
                        <div className="flex items-start space-x-3">
                            <User className="text-neutral-400 mt-1" size={20} />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-neutral-900 mb-1">Asignado a</h4>
                                <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-bold">
                                        {task.assignedTo?.name?.charAt(0) || '?'}
                                    </div>
                                    <span className="text-neutral-600">{task.assignedTo?.name || 'Sin asignar'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Project */}
                        {task.project && (
                            <div className="flex items-start space-x-3">
                                <Flag className="text-neutral-400 mt-1" size={20} />
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-neutral-900 mb-1">Proyecto</h4>
                                    <p className="text-neutral-600 font-medium">{task.project.code} - {task.project.name}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Description */}
                    <div className="flex items-start space-x-3">
                        <AlignLeft className="text-neutral-400 mt-1" size={20} />
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-neutral-900 mb-2">Descripción</h4>
                            {isEditing ? (
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full text-sm border border-neutral-300 rounded-lg px-3 py-2 h-32 resize-none"
                                    placeholder="Detalles de la tarea..."
                                />
                            ) : (
                                <p className="text-neutral-600 whitespace-pre-wrap leading-relaxed">
                                    {task.description || 'Sin descripción'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Comments Preview (Read Only) */}
                    {task.comments && task.comments.length > 0 && (
                        <div className="flex items-start space-x-3 pt-4 border-t border-neutral-100">
                            <MessageSquare className="text-neutral-400 mt-1" size={20} />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-neutral-900 mb-4">Comentarios ({task.comments.length})</h4>
                                <div className="space-y-4">
                                    {task.comments.slice(0, 3).map((comment: any) => (
                                        <div key={comment.id} className="bg-neutral-50 rounded-xl p-4">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-bold text-neutral-700">{comment.user.name}</span>
                                                <span className="text-[10px] text-neutral-400">{format(new Date(comment.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                                            </div>
                                            <p className="text-sm text-neutral-600">{comment.content}</p>
                                        </div>
                                    ))}
                                    {task.comments.length > 3 && (
                                        <p className="text-xs text-center text-neutral-400 italic">... y {task.comments.length - 3} comentarios más</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex justify-between items-center">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-6 py-2.5 text-neutral-600 font-bold hover:bg-neutral-200 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="flex items-center space-x-2 px-8 py-2.5 bg-olive-600 text-white font-bold rounded-xl hover:bg-olive-700 transition-all shadow-lg shadow-olive-600/20"
                            >
                                <Save size={18} />
                                <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleDelete}
                                disabled={loading}
                                className="flex items-center space-x-2 px-4 py-2 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-all"
                            >
                                <Trash2 size={18} />
                                <span>Eliminar</span>
                            </button>

                            <div className="flex space-x-3">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2.5 text-neutral-600 font-bold hover:bg-neutral-200 rounded-xl transition-all"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={startEditing}
                                    className="flex items-center space-x-2 px-8 py-2.5 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg"
                                >
                                    <Edit2 size={18} />
                                    <span>Editar Tarea</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
