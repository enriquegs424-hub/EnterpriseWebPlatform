'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, MapPin, AlignLeft, Type } from 'lucide-react';
import { createEvent } from '@/app/(protected)/calendar/actions';
import { EventType } from '@prisma/client';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentDate?: Date;
    projectId?: string;
}

export default function CreateEventModal({ isOpen, onClose, currentDate, projectId }: CreateEventModalProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [type, setType] = useState<EventType>('MEETING');
    const [recurrence, setRecurrence] = useState('');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            const defaultStart = currentDate ? new Date(currentDate) : new Date();
            // Round to next hour if it's "now", otherwise keep selected date
            if (!currentDate) {
                defaultStart.setHours(defaultStart.getHours() + 1, 0, 0, 0);
            } else {
                defaultStart.setHours(9, 0, 0, 0); // Default to 9 AM for selected days
            }

            const defaultEnd = new Date(defaultStart);
            defaultEnd.setHours(defaultEnd.getHours() + 1);

            // Format for datetime-local input (YYYY-MM-DDThh:mm)
            const formatForInput = (date: Date) => {
                const pad = (n: number) => n < 10 ? '0' + n : n;
                return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
            };

            setStart(formatForInput(defaultStart));
            setEnd(formatForInput(defaultEnd));
            setTitle('');
            setLocation('');
            setDescription('');
            setType('MEETING');
            setRecurrence('');
        }
    }, [isOpen, currentDate]);

    const handleSubmit = async () => {
        if (!title || !start || !end) return;

        setLoading(true);
        try {
            await createEvent({
                title,
                startDate: new Date(start),
                endDate: new Date(end),
                description,
                location,
                type,
                projectId,
                recurrenceRule: recurrence || undefined
            });
            onClose();
        } catch (error) {
            alert('Error al crear el evento');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    if (!isOpen) return null;

    const typeOptions: { value: EventType, label: string }[] = [
        { value: 'MEETING', label: 'Reunión' },
        { value: 'DEADLINE', label: 'Entrega' },
        { value: 'REMINDER', label: 'Recordatorio' },
        { value: 'OTHER', label: 'Otro' }
    ];

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="p-6 border-b border-neutral-200 flex justify-between items-center">
                    <h3 className="text-xl font-black text-neutral-900">Nuevo Evento</h3>
                    <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg text-neutral-500 hover:text-neutral-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-1">Título del Evento</label>
                        <div className="relative">
                            <Type className="absolute left-3 top-3 text-neutral-400" size={18} />
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-olive-500"
                                placeholder="Ej: Reunión de Coordinación"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-1">Inicio</label>
                            <input
                                type="datetime-local"
                                value={start}
                                onChange={(e) => setStart(e.target.value)}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-olive-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-neutral-700 mb-1">Fin</label>
                            <input
                                type="datetime-local"
                                value={end}
                                onChange={(e) => setEnd(e.target.value)}
                                className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-olive-500 text-sm"
                            />
                        </div>
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-1">Ubicación</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3 text-neutral-400" size={18} />
                            <input
                                type="text"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-olive-500"
                                placeholder="Sala de Conferencias o URL"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-1">Descripción</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 text-neutral-400" size={18} />
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-olive-500 h-24 resize-none"
                                placeholder="Detalles adicionales..."
                            />
                        </div>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-1">Tipo de Evento</label>
                        <div className="flex space-x-2">
                            {typeOptions.map(option => (
                                <button
                                    key={option.value}
                                    onClick={() => setType(option.value)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${type === option.value
                                        ? 'bg-olive-50 border-olive-500 text-olive-700 ring-1 ring-olive-500'
                                        : 'border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-600'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recurrence */}
                    <div>
                        <label className="block text-sm font-bold text-neutral-700 mb-1">Repetir</label>
                        <select
                            value={recurrence}
                            onChange={(e) => setRecurrence(e.target.value)}
                            className="w-full px-4 py-2 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-olive-500 focus:border-olive-500 text-sm bg-white"
                        >
                            <option value="">No repetir</option>
                            <option value="DAILY">Diariamente</option>
                            <option value="WEEKLY">Semanalmente</option>
                            <option value="MONTHLY">Mensualmente</option>
                            <option value="YEARLY">Anualmente</option>
                        </select>
                    </div>
                </div>

                <div className="p-6 border-t border-neutral-200 bg-neutral-50 flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-neutral-600 font-bold hover:bg-neutral-200 rounded-xl transition-all"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !title}
                        className="px-6 py-2 bg-olive-600 text-white font-bold rounded-xl hover:bg-olive-700 transition-all shadow-lg shadow-olive-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                        {loading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Guardando...
                            </>
                        ) : 'Crear Evento'}
                    </button>
                </div>
            </motion.div >
        </div >
    );
}
