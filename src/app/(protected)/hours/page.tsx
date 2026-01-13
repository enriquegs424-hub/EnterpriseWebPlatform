'use client';

import { useState, useEffect, useMemo } from 'react';
import { Clock, Plus, Calendar, ChevronLeft, ChevronRight, X, Trash2, Pencil } from 'lucide-react';
import { createTimeEntry, getActiveProjects, getTimeEntries, deleteTimeEntry, updateTimeEntry } from './actions';

interface Project {
    id: string;
    code: string;
    name: string;
}

interface TimeEntry {
    id: string;
    date: Date;
    hours: number;
    notes?: string | null;
    project: {
        id: string;
        code: string;
        name: string;
    };
    createdAt: Date;
}

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function HoursPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

    // Current date reference
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
    const [projectId, setProjectId] = useState('');
    const [formDate, setFormDate] = useState(today.toISOString().split('T')[0]);
    const [hours, setHours] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [projectsData, entriesData] = await Promise.all([
                getActiveProjects(),
                getTimeEntries({ limit: 500 })
            ]);
            setProjects(projectsData);
            setEntries(entriesData.entries);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get entries grouped by date
    const entriesByDate = useMemo(() => {
        const grouped: Record<string, TimeEntry[]> = {};
        entries.forEach(entry => {
            const dateKey = new Date(entry.date).toISOString().split('T')[0];
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(entry);
        });
        return grouped;
    }, [entries]);

    // Get hours total for a specific date
    const getHoursForDate = (dateStr: string) => {
        const dayEntries = entriesByDate[dateStr] || [];
        return dayEntries.reduce((sum, e) => sum + Number(e.hours), 0);
    };

    // Calculate week days
    const getWeekDays = () => {
        const start = new Date(currentDate);
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1);
        start.setDate(diff);

        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            days.push(d);
        }
        return days;
    };

    // Calculate month days
    const getMonthDays = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days = [];

        let startPadding = firstDay.getDay() - 1;
        if (startPadding < 0) startPadding = 6;
        for (let i = startPadding; i > 0; i--) {
            const d = new Date(firstDay);
            d.setDate(d.getDate() - i);
            days.push({ date: d, isCurrentMonth: false });
        }

        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push({ date: new Date(year, month, i), isCurrentMonth: true });
        }

        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(lastDay);
            d.setDate(d.getDate() + i);
            days.push({ date: d, isCurrentMonth: false });
        }

        return days;
    };

    const navigatePrevious = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else {
            newDate.setMonth(newDate.getMonth() - 1);
        }
        setCurrentDate(newDate);
    };

    const navigateNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else {
            newDate.setMonth(newDate.getMonth() + 1);
        }
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const handleDayClick = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        setSelectedDate(selectedDate === dateStr ? null : dateStr);
        setFormDate(dateStr);
    };

    const openNewForm = (date?: string) => {
        setEditingEntry(null);
        setProjectId('');
        setFormDate(date || today.toISOString().split('T')[0]);
        setHours('');
        setNotes('');
        setMessage(null);
        setShowForm(true);
    };

    const openEditForm = (entry: TimeEntry) => {
        setEditingEntry(entry);
        setProjectId(entry.project.id);
        setFormDate(new Date(entry.date).toISOString().split('T')[0]);
        setHours(String(Number(entry.hours)));
        setNotes(entry.notes || '');
        setMessage(null);
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!projectId || !hours || !formDate) {
            setMessage({ type: 'error', text: 'Completa todos los campos requeridos' });
            return;
        }

        const hoursNum = parseFloat(hours);
        if (isNaN(hoursNum) || hoursNum <= 0 || hoursNum > 24) {
            setMessage({ type: 'error', text: 'Las horas deben estar entre 0.1 y 24' });
            return;
        }

        setSubmitting(true);
        setMessage(null);

        try {
            if (editingEntry) {
                // Update existing entry
                const result = await updateTimeEntry(editingEntry.id, {
                    projectId,
                    date: formDate,
                    hours: hoursNum,
                    notes: notes || undefined
                });

                if (result.success) {
                    setMessage({ type: 'success', text: '✅ Horas actualizadas' });
                    setShowForm(false);
                    setEditingEntry(null);
                    await loadData();
                    setTimeout(() => setMessage(null), 3000);
                } else {
                    setMessage({ type: 'error', text: 'Error al actualizar horas' });
                }
            } else {
                // Create new entry
                const result = await createTimeEntry({
                    projectId,
                    date: formDate,
                    hours: hoursNum,
                    notes: notes || undefined,
                    billable: true
                });

                if (result.success) {
                    setMessage({ type: 'success', text: '✅ Horas registradas' });
                    setProjectId('');
                    setHours('');
                    setNotes('');
                    setShowForm(false);
                    await loadData();
                    setTimeout(() => setMessage(null), 3000);
                } else {
                    setMessage({ type: 'error', text: 'Error al registrar horas' });
                }
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Error al guardar horas' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar esta entrada de horas?')) return;
        try {
            const result = await deleteTimeEntry(id);
            if (result.success) {
                await loadData();
            }
        } catch (error) {
            console.error('Error deleting entry:', error);
        }
    };

    // Calculate totals
    const totalHours = entries.reduce((sum, entry) => sum + Number(entry.hours), 0);
    const weekDays = getWeekDays();
    const monthDays = getMonthDays();

    const isToday = (date: Date) => {
        const t = new Date();
        return date.toDateString() === t.toDateString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <div className="w-6 h-6 border-3 border-olive-600 border-t-transparent rounded-full animate-spin"></div>
                    <span>Cargando...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Clock className="w-7 h-7 text-olive-600 dark:text-olive-500" />
                        Registro de Horas
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visualiza y registra tus horas de trabajo
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => openNewForm()}
                        className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors dark:bg-olive-500 dark:hover:bg-olive-600"
                    >
                        <Plus className="w-4 h-4" />
                        Registrar Horas
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Registrado</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalHours.toFixed(1)}h</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Entradas</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{entries.length}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promedio/Día</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {entries.length > 0 ? (totalHours / new Set(entries.map(e => new Date(e.date).toDateString())).size).toFixed(1) : 0}h
                    </p>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${viewMode === 'week'
                                    ? 'bg-olive-600 text-white dark:bg-olive-500'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                        >
                            Semanal
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${viewMode === 'month'
                                    ? 'bg-olive-600 text-white dark:bg-olive-500'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                        >
                            Mensual
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={navigatePrevious} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
                            {viewMode === 'week'
                                ? `${weekDays[0].getDate()} - ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`
                                : `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                            }
                        </span>
                        <button onClick={navigateNext} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-3 py-1 text-sm font-medium text-olive-600 dark:text-olive-400 hover:bg-olive-50 dark:hover:bg-olive-900/20 rounded-lg"
                        >
                            Hoy
                        </button>
                    </div>
                </div>

                {/* Week View */}
                {viewMode === 'week' && (
                    <div className="grid grid-cols-7 divide-x divide-gray-200 dark:divide-gray-700">
                        {weekDays.map((day, idx) => {
                            const dateStr = day.toISOString().split('T')[0];
                            const dayHours = getHoursForDate(dateStr);
                            const dayEntries = entriesByDate[dateStr] || [];
                            const isTodayDate = isToday(day);
                            const isSelected = selectedDate === dateStr;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleDayClick(day)}
                                    className={`min-h-[200px] p-3 cursor-pointer transition-colors ${isTodayDate ? 'bg-olive-50 dark:bg-olive-900/20' : ''
                                        } ${isSelected ? 'ring-2 ring-olive-500 ring-inset' : ''} hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                                >
                                    <div className="text-center mb-2">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{WEEKDAYS[idx]}</p>
                                        <p className={`text-lg font-bold ${isTodayDate ? 'text-olive-600 dark:text-olive-400' : 'text-gray-900 dark:text-white'}`}>
                                            {day.getDate()}
                                        </p>
                                        {dayHours > 0 && (
                                            <span className="inline-block mt-1 px-2 py-0.5 bg-olive-100 dark:bg-olive-900/30 text-olive-700 dark:text-olive-300 text-xs font-semibold rounded-full">
                                                {dayHours}h
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1">
                                        {dayEntries.slice(0, 3).map(entry => (
                                            <div key={entry.id} className="text-xs p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded text-blue-700 dark:text-blue-300 truncate">
                                                <span className="font-medium">{entry.project.code}</span> · {Number(entry.hours)}h
                                            </div>
                                        ))}
                                        {dayEntries.length > 3 && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">+{dayEntries.length - 3} más</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Month View */}
                {viewMode === 'month' && (
                    <div>
                        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
                            {WEEKDAYS.map(day => (
                                <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {monthDays.map(({ date, isCurrentMonth }, idx) => {
                                const dateStr = date.toISOString().split('T')[0];
                                const dayHours = getHoursForDate(dateStr);
                                const isTodayDate = isToday(date);
                                const isSelected = selectedDate === dateStr;

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleDayClick(date)}
                                        className={`min-h-[80px] p-2 border-b border-r border-gray-100 dark:border-gray-700 cursor-pointer transition-colors ${!isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900' : ''
                                            } ${isTodayDate ? 'bg-olive-50 dark:bg-olive-900/20' : ''} ${isSelected ? 'ring-2 ring-olive-500 ring-inset' : ''
                                            } hover:bg-gray-50 dark:hover:bg-gray-700/50`}
                                    >
                                        <p className={`text-sm font-medium ${!isCurrentMonth ? 'text-gray-400 dark:text-gray-600' :
                                                isTodayDate ? 'text-olive-600 dark:text-olive-400' :
                                                    'text-gray-900 dark:text-white'
                                            }`}>
                                            {date.getDate()}
                                        </p>
                                        {dayHours > 0 && (
                                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-olive-100 dark:bg-olive-900/30 text-olive-700 dark:text-olive-300 text-xs font-semibold rounded">
                                                {dayHours}h
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Selected Day Details */}
            {selectedDate && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                            onClick={() => openNewForm(selectedDate)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-olive-600 text-white rounded-lg hover:bg-olive-700 text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Añadir
                        </button>
                    </div>
                    {(entriesByDate[selectedDate] || []).length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No hay horas registradas este día</p>
                    ) : (
                        <div className="space-y-2">
                            {(entriesByDate[selectedDate] || []).map(entry => (
                                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            <span className="text-olive-600 dark:text-olive-400">{entry.project.code}</span> · {entry.project.name}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {Number(entry.hours)}h {entry.notes && `· ${entry.notes}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => openEditForm(entry)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                            title="Editar"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {editingEntry ? 'Editar Registro' : 'Registrar Horas'}
                            </h3>
                            <button onClick={() => { setShowForm(false); setEditingEntry(null); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proyecto *</label>
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha *</label>
                                <input
                                    type="date"
                                    value={formDate}
                                    onChange={(e) => setFormDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horas *</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    max="24"
                                    value={hours}
                                    onChange={(e) => setHours(e.target.value)}
                                    placeholder="8"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas (opcional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    placeholder="Describe lo que hiciste..."
                                />
                            </div>

                            {message && (
                                <div className={`p-3 rounded-lg text-sm ${message.type === 'success'
                                        ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingEntry(null); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Guardando...' : (editingEntry ? 'Actualizar' : 'Guardar')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
