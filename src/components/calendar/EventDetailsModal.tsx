'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, AlignLeft, Trash2, Edit2, Save, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { deleteEvent, updateEvent } from '@/app/(protected)/calendar/actions';
import { EventType } from '@prisma/client';

interface EventDetailsModalProps {
    event: any; // Type should be inferred from Prisma partial
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

export default function EventDetailsModal({ event, isOpen, onClose, onUpdate }: EventDetailsModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // Edit Form State
    const [title, setTitle] = useState(event?.title || '');
    const [description, setDescription] = useState(event?.description || '');
    const [location, setLocation] = useState(event?.location || '');
    const [start, setStart] = useState<string>('');
    const [end, setEnd] = useState<string>('');

    // Initialize editing state when opening or switching to edit mode
    const startEditing = () => {
        if (!event) return;

        const pad = (n: number) => n < 10 ? '0' + n : n;
        const formatForInput = (date: Date) => {
            return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        };

        setTitle(event.title);
        setDescription(event.description || '');
        setLocation(event.location || '');
        setStart(formatForInput(new Date(event.startDate)));
        setEnd(formatForInput(new Date(event.endDate)));

        setIsEditing(true);
    };

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de que quieres eliminar este evento?')) return;

        setLoading(true);
        try {
            await deleteEvent(event.id);
            onClose();
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            alert('Error al eliminar el evento');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await updateEvent(event.id, {
                title,
                description,
                location,
                startDate: new Date(start),
                endDate: new Date(end)
            });
            setIsEditing(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error(error);
            alert('Error al actualizar el evento');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !event) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
                {/* Header with Type Color */}
                <div className={`p-6 border-b border-neutral-200 flex justify-between items-start ${event.type === 'MEETING' ? 'bg-blue-50' :
                        event.type === 'DEADLINE' ? 'bg-red-50' :
                            event.type === 'REMINDER' ? 'bg-amber-50' : 'bg-neutral-50'
                    }`}>
                    <div>
                        {isEditing ? (
                            <input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="text-xl font-black text-neutral-900 bg-white/50 border border-neutral-300 rounded-lg px-2 py-1 w-full"
                            />
                        ) : (
                            <>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide opacity-80 mb-2 inline-block ${event.type === 'MEETING' ? 'bg-blue-100 text-blue-800' :
                                        event.type === 'DEADLINE' ? 'bg-red-100 text-red-800' :
                                            event.type === 'REMINDER' ? 'bg-amber-100 text-amber-800' : 'bg-neutral-200 text-neutral-800'
                                    }`}>
                                    {event.type}
                                </span>
                                <h3 className="text-2xl font-black text-neutral-900">{event.title}</h3>
                            </>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-lg text-neutral-500 hover:text-neutral-700 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Date & Time */}
                    <div className="flex items-start space-x-3">
                        <Clock className="text-neutral-400 mt-1" size={20} />
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-neutral-900 mb-1">Fecha y Hora</h4>
                            {isEditing ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="datetime-local"
                                        value={start}
                                        onChange={e => setStart(e.target.value)}
                                        className="text-sm border border-neutral-300 rounded-lg px-2 py-1"
                                    />
                                    <input
                                        type="datetime-local"
                                        value={end}
                                        onChange={e => setEnd(e.target.value)}
                                        className="text-sm border border-neutral-300 rounded-lg px-2 py-1"
                                    />
                                </div>
                            ) : (
                                <p className="text-neutral-600">
                                    {format(new Date(event.startDate), "EEEE d 'de' MMMM, yyyy", { locale: es })}
                                    <br />
                                    <span className="text-neutral-500">
                                        {format(new Date(event.startDate), 'HH:mm')} - {format(new Date(event.endDate), 'HH:mm')}
                                    </span>
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Location */}
                    {(event.location || isEditing) && (
                        <div className="flex items-start space-x-3">
                            <MapPin className="text-neutral-400 mt-1" size={20} />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-neutral-900 mb-1">Ubicación</h4>
                                {isEditing ? (
                                    <input
                                        value={location}
                                        onChange={e => setLocation(e.target.value)}
                                        placeholder="Ej: Sala de Conferencias"
                                        className="w-full text-sm border border-neutral-300 rounded-lg px-2 py-1"
                                    />
                                ) : (
                                    <p className="text-neutral-600">{event.location || 'Sin ubicación'}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    {(event.description || isEditing) && (
                        <div className="flex items-start space-x-3">
                            <AlignLeft className="text-neutral-400 mt-1" size={20} />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-neutral-900 mb-1">Descripción</h4>
                                {isEditing ? (
                                    <textarea
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        className="w-full text-sm border border-neutral-300 rounded-lg px-2 py-1 h-24 resize-none"
                                        placeholder="Detalles del evento..."
                                    />
                                ) : (
                                    <p className="text-neutral-600 whitespace-pre-wrap">{event.description || 'Sin descripción'}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Attendees (Read Only for now) */}
                    {event.attendees && event.attendees.length > 0 && (
                        <div className="flex items-start space-x-3">
                            <Users className="text-neutral-400 mt-1" size={20} />
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-neutral-900 mb-2">Asistentes</h4>
                                <div className="flex flex-wrap gap-2">
                                    {event.attendees.map((attendee: any) => (
                                        <div key={attendee.user.id} className="flex items-center bg-neutral-100 rounded-full px-3 py-1">
                                            <div className="w-5 h-5 rounded-full bg-olive-200 text-olive-700 flex items-center justify-center text-[10px] font-bold mr-2">
                                                {attendee.user.name.charAt(0)}
                                            </div>
                                            <span className="text-xs text-neutral-600">{attendee.user.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex justify-between items-center">
                    {isEditing ? (
                        <>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-neutral-600 font-bold hover:bg-neutral-200 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="flex items-center space-x-2 px-6 py-2 bg-olive-600 text-white font-bold rounded-xl hover:bg-olive-700 transition-all shadow-lg shadow-olive-600/20"
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
                                className="flex items-center space-x-2 px-4 py-2 text-red-600 font-bold hover:bg-red-50 rounded-xl transition-all hover:text-red-700"
                            >
                                <Trash2 size={18} />
                                <span>Eliminar</span>
                            </button>

                            <div className="flex space-x-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-neutral-600 font-bold hover:bg-neutral-200 rounded-xl transition-all"
                                >
                                    Cerrar
                                </button>
                                <button
                                    onClick={startEditing}
                                    className="flex items-center space-x-2 px-6 py-2 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-all shadow-lg"
                                >
                                    <Edit2 size={18} />
                                    <span>Editar</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
