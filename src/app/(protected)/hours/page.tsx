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
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
    const [projectId, setProjectId] = useState('');
    const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
    const [hours, setHours] = useState('');
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [entryMode, setEntryMode] = useState<'total' | 'range'>('total');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    // Auto-calculate hours from range
    useEffect(() => {
        if (entryMode === 'range' && startTime && endTime) {
            const [h1, m1] = startTime.split(':').map(Number);
            const [h2, m2] = endTime.split(':').map(Number);
            if (!isNaN(h1) && !isNaN(h2)) {
                let diffInMinutes = (h2 * 60 + m2) - (h1 * 60 + m1);
                if (diffInMinutes < 0) diffInMinutes += 24 * 60; // Handle overnight
                // Round to 2 decimals
                setHours((diffInMinutes / 60).toFixed(2));
            }
        }
    }, [startTime, endTime, entryMode]);

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

    // Current date reference for today button and defaults
    const today = new Date();

    // Get entries grouped by date
    const entriesByDate = useMemo(() => {
        const grouped: Record<string, TimeEntry[]> = {};
        entries.forEach(entry => {
            // entry.date is likely a string from JSON, ensure it is Date or string correct
            const d = new Date(entry.date);
            const dateKey = d.toISOString().split('T')[0];
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

    // Helper to format date key locally YYYY-MM-DD
    const formatDateKey = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

    const handleDayClick = (date: Date) => {
        const dateStr = formatDateKey(date);
        setSelectedDate(selectedDate === dateStr ? null : dateStr);
        setFormDate(dateStr);
    };

    const openNewForm = (date?: string) => {
        setEditingEntry(null);
        setProjectId('');
        setFormDate(date || formatDateKey(today));
        setHours('');
        setStartTime('09:00');
        setEndTime('17:00');
        setEntryMode('total');
        setNotes('');
        setMessage(null);
        setShowForm(true);
    };

    const openEditForm = (entry: TimeEntry) => {
        setEditingEntry(entry);
        setProjectId(entry.project.id);
        const d = new Date(entry.date);
        setFormDate(d.toISOString().split('T')[0]); // Use UTC Date for form as usually stored
        setHours(String(Number(entry.hours)));
        // Try to infer times if stored (or leave empty)
        // Since backend stores startTime/endTime only optionally, we might check if they exist on the entry type.
        // Assuming EntryType returned by action has startTime/endTime
        const fullEntry = entry as any;
        if (fullEntry.startTime && fullEntry.endTime) {
            setStartTime(fullEntry.startTime);
            setEndTime(fullEntry.endTime);
            setEntryMode('range');
        } else {
            setStartTime('');
            setEndTime('');
            setEntryMode('total');
        }

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

        const payload = {
            projectId,
            date: formDate,
            hours: hoursNum,
            notes: notes || undefined,
            startTime: entryMode === 'range' ? startTime : undefined,
            endTime: entryMode === 'range' ? endTime : undefined,
        };

        try {
            if (editingEntry) {
                // Update existing entry
                const result = await updateTimeEntry(editingEntry.id, payload);

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
                    ...payload,
                    billable: true
                });

                if (result.success) {
                    setMessage({ type: 'success', text: '✅ Horas registradas' });
                    // Optional: Reset form fully or keep settings?
                    // setProjectId('');
                    // setHours('');
                    // setNotes('');
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
                <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
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
                    <h1 className="text-2xl font-black text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
                        <Clock className="w-8 h-8 text-olive-600 dark:text-olive-500" />
                        Registro de Horas
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1 font-medium">
                        Visualiza y registra tus horas de trabajo
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => openNewForm()}
                        className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-xl hover:bg-olive-700 transition-all font-bold shadow-lg shadow-olive-600/20"
                    >
                        <Plus className="w-5 h-5" />
                        Registrar Horas
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Total Registrado</p>
                    <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100">{totalHours.toFixed(1)}h</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Entradas</p>
                    <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100">{entries.length}</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
                    <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Promedio/Día</p>
                    <p className="text-3xl font-black text-neutral-900 dark:text-neutral-100">
                        {entries.length > 0 ? (totalHours / new Set(entries.map(e => new Date(e.date).toDateString())).size).toFixed(1) : 0}h
                    </p>
                </div>
            </div>

            {/* Calendar Controls */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('week')}
                            className={`px-4 py-2 rounded-lg transition-all text-sm font-bold ${viewMode === 'week'
                                ? 'bg-white dark:bg-neutral-700 shadow-sm text-olive-600 dark:text-olive-400'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-white/50 dark:hover:bg-neutral-700/50'
                                }`}
                        >
                            Semanal
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={`px-4 py-2 rounded-lg transition-all text-sm font-bold ${viewMode === 'month'
                                ? 'bg-white dark:bg-neutral-700 shadow-sm text-olive-600 dark:text-olive-400'
                                : 'text-neutral-600 dark:text-neutral-400 hover:bg-white/50 dark:hover:bg-neutral-700/50'
                                }`}
                        >
                            Mensual
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={navigatePrevious} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="text-lg font-bold text-neutral-900 dark:text-neutral-100 min-w-[200px] text-center">
                            {viewMode === 'week'
                                ? `${weekDays[0].getDate()} - ${weekDays[6].getDate()} ${MONTHS[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`
                                : `${MONTHS[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                            }
                        </span>
                        <button onClick={navigateNext} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-600 dark:text-neutral-400">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-3 py-1 text-sm font-bold text-olive-600 dark:text-olive-400 hover:bg-olive-50 dark:hover:bg-olive-900/20 rounded-lg"
                        >
                            Hoy
                        </button>
                    </div>
                </div>

                {/* Week View */}
                {viewMode === 'week' && (
                    <div className="grid grid-cols-7 divide-x divide-neutral-200 dark:divide-neutral-800">
                        {weekDays.map((day: Date, idx: number) => {
                            const dateStr = formatDateKey(day);
                            const dayHours = getHoursForDate(dateStr);
                            const dayEntries = entriesByDate[dateStr] || [];
                            const isTodayDate = isToday(day);
                            const isSelected = selectedDate === dateStr;

                            return (
                                <div
                                    key={idx}
                                    onClick={() => handleDayClick(day)}
                                    className={`min-h-[200px] p-3 cursor-pointer transition-all ${isTodayDate ? 'bg-olive-50/50 dark:bg-olive-900/10' : ''
                                        } ${isSelected ? 'ring-2 ring-inset ring-olive-500 bg-olive-50/30 dark:bg-olive-900/20' : ''} hover:bg-neutral-50 dark:hover:bg-neutral-800/50`}
                                >
                                    <div className="text-center mb-4">
                                        <p className="text-xs font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mb-1">{WEEKDAYS[idx]}</p>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm font-bold ${isTodayDate ? 'bg-olive-600 text-white shadow-md shadow-olive-600/30' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                            {day.getDate()}
                                        </div>
                                        {dayHours > 0 && (
                                            <span className="inline-block mt-2 px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[10px] font-bold rounded-full border border-neutral-200 dark:border-neutral-700">
                                                {dayHours}h
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        {dayEntries.slice(0, 3).map(entry => (
                                            <div key={entry.id} className="text-[10px] p-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md text-neutral-600 dark:text-neutral-300 shadow-sm truncate font-medium">
                                                <span className="text-olive-600 dark:text-olive-400 font-bold">{entry.project.code}</span> · {Number(entry.hours)}h
                                            </div>
                                        ))}
                                        {dayEntries.length > 3 && (
                                            <p className="text-[10px] text-center font-medium text-neutral-400 dark:text-neutral-500">+{dayEntries.length - 3} más</p>
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
                        <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
                            {WEEKDAYS.map(day => (
                                <div key={day} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {monthDays.map(({ date, isCurrentMonth }: { date: Date; isCurrentMonth: boolean }, idx: number) => {
                                const dateStr = formatDateKey(date);
                                const dayHours = getHoursForDate(dateStr);
                                const isTodayDate = isToday(date);
                                const isSelected = selectedDate === dateStr;

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleDayClick(date)}
                                        className={`min-h-[80px] p-2 border-b border-r border-neutral-100 dark:border-neutral-800 cursor-pointer transition-all ${!isCurrentMonth ? 'bg-neutral-50/50 dark:bg-neutral-900/50 opacity-50' : ''
                                            } ${isTodayDate ? 'bg-olive-50/50 dark:bg-olive-900/10' : ''} ${isSelected ? 'ring-2 ring-inset ring-olive-500 z-10' : ''
                                            } hover:bg-neutral-50 dark:hover:bg-neutral-800/50`}
                                    >
                                        <p className={`text-xs font-bold mb-1 ${!isCurrentMonth ? 'text-neutral-400 dark:text-neutral-600' :
                                            isTodayDate ? 'text-olive-600 dark:text-olive-400' :
                                                'text-neutral-700 dark:text-neutral-300'
                                            }`}>
                                            {date.getDate()}
                                        </p>
                                        {dayHours > 0 && (
                                            <span className="inline-block px-1.5 py-0.5 bg-olive-100 dark:bg-olive-900/30 text-olive-700 dark:text-olive-300 text-[10px] font-bold rounded">
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
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
                            {new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </h3>
                        <button
                            onClick={() => openNewForm(selectedDate)}
                            className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-xl hover:bg-olive-700 text-sm font-bold shadow-md shadow-olive-600/20"
                        >
                            <Plus className="w-4 h-4" />
                            Añadir Entrada
                        </button>
                    </div>
                    {(entriesByDate[selectedDate] || []).length === 0 ? (
                        <div className="text-center py-8 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700">
                            <Clock className="w-10 h-10 text-neutral-300 dark:text-neutral-600 mx-auto mb-2" />
                            <p className="text-neutral-500 dark:text-neutral-400 font-medium">No hay horas registradas este día</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {(entriesByDate[selectedDate] || []).map(entry => (
                                <div key={entry.id} className="flex items-center justify-between p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:shadow-md transition-shadow">
                                    <div className="flex-1">
                                        <p className="font-bold text-neutral-900 dark:text-neutral-100">
                                            <span className="text-olive-600 dark:text-olive-400 font-black">{entry.project.code}</span> · {entry.project.name}
                                        </p>
                                        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                            <span className="font-bold text-neutral-700 dark:text-neutral-300">{Number(entry.hours)}h</span>
                                            {(entry as any).startTime && (entry as any).endTime && (
                                                <span className="text-xs ml-2 opacity-75">({(entry as any).startTime} - {(entry as any).endTime})</span>
                                            )}
                                            {entry.notes && ` · ${entry.notes}`}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditForm(entry)}
                                            className="p-2 text-neutral-500 hover:text-olive-600 hover:bg-olive-50 dark:text-neutral-400 dark:hover:bg-olive-900/20 rounded-lg transition-colors"
                                            title="Editar"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(entry.id)}
                                            className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:text-neutral-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-neutral-200 dark:border-neutral-800">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-neutral-900 dark:text-neutral-100">
                                {editingEntry ? 'Editar Registro' : 'Registrar Horas'}
                            </h3>
                            <button onClick={() => { setShowForm(false); setEditingEntry(null); }} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg text-neutral-500 dark:text-neutral-400">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Proyecto *</label>
                                <select
                                    value={projectId}
                                    onChange={(e) => setProjectId(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
                                    required
                                >
                                    <option value="">Seleccionar...</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Fecha *</label>
                                <input
                                    type="date"
                                    value={formDate}
                                    onChange={(e) => setFormDate(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
                                    required
                                />
                            </div>

                            {/* Entry Mode Toggle */}
                            <div className="bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl flex">
                                <button
                                    type="button"
                                    className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${entryMode === 'total' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'}`}
                                    onClick={() => setEntryMode('total')}
                                >
                                    Total Horas
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${entryMode === 'range' ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700'}`}
                                    onClick={() => setEntryMode('range')}
                                >
                                    Rango Horario
                                </button>
                            </div>

                            {entryMode === 'total' ? (
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Total Horas *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        max="24"
                                        value={hours}
                                        onChange={(e) => setHours(e.target.value)}
                                        placeholder="Ej: 8"
                                        className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
                                        required={entryMode === 'total'}
                                    />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Entrada</label>
                                        <input
                                            type="time"
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
                                            required={entryMode === 'range'}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Salida</label>
                                        <input
                                            type="time"
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none text-neutral-900 dark:text-neutral-100 font-medium"
                                            required={entryMode === 'range'}
                                        />
                                    </div>
                                    <div className="col-span-2 text-right text-xs font-bold text-neutral-500">
                                        Calculado: {hours || 0}h
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300 mb-2">Notas (opcional)</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none resize-none text-neutral-900 dark:text-neutral-100 font-medium placeholder-neutral-400"
                                    placeholder="Describe lo que hiciste..."
                                />
                            </div>

                            {message && (
                                <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success'
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
                                    className="flex-1 px-4 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 font-bold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 px-4 py-3 bg-olive-600 text-white rounded-xl hover:bg-olive-700 disabled:opacity-50 font-bold shadow-lg shadow-olive-600/20 transition-all"
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
