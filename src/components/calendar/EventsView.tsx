'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users, Plus, CheckSquare, Star, Trash2, X, FileDown } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { getCalendarData, createCalendarItem, deleteCalendarItem, moveCalendarItem, exportCalendarToIcal, type UnifiedCalendarItem } from '@/app/(protected)/calendar/actions';
import { downloadICalFile } from '@/lib/exports/ical-export';
import CreateEventModal from '@/components/calendar/CreateEventModal';
import EventDetailsModal from '@/components/calendar/EventDetailsModal';

import { useAppLocale } from '@/providers/LocaleContext';

interface EventsViewProps {
    projectId?: string;
}

// Quick add modal for personal notes
function QuickAddModal({
    isOpen,
    onClose,
    date,
    onSubmit
}: {
    isOpen: boolean;
    onClose: () => void;
    date: Date;
    onSubmit: (data: { title: string; description?: string; color?: string }) => void;
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState('#8b5cf6');

    const colors = [
        '#8b5cf6', // Purple
        '#3b82f6', // Blue
        '#22c55e', // Green
        '#f59e0b', // Amber
        '#ef4444', // Red
        '#ec4899', // Pink
    ];

    const handleSubmit = () => {
        if (!title.trim()) return;
        onSubmit({ title, description, color });
        setTitle('');
        setDescription('');
        setColor('#8b5cf6');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div
                className="bg-white dark:bg-neutral-900 rounded-xl p-6 w-full max-w-md shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Añadir Nota Rápida</h3>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                        <X size={18} />
                    </button>
                </div>
                <p className="text-sm text-neutral-500 mb-4">{format(date, 'EEEE, d MMMM yyyy')}</p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Título *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ej: Llamar a Juan"
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Descripción</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Notas adicionales..."
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 h-20 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <div className="flex gap-2">
                            {colors.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-neutral-900 dark:border-white scale-110' : 'border-transparent'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg">
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!title.trim()}
                        className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                    >
                        Añadir
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function EventsView({ projectId }: EventsViewProps) {
    const router = useRouter();
    const { locale } = useAppLocale();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [items, setItems] = useState<UnifiedCalendarItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDateForModal, setSelectedDateForModal] = useState<Date | undefined>(undefined);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    // Quick add modal state
    const [quickAddOpen, setQuickAddOpen] = useState(false);
    const [quickAddDate, setQuickAddDate] = useState(new Date());

    // Export state
    const [exporting, setExporting] = useState(false);

    // Calendar Navigation
    const handlePrevious = () => {
        if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
        else if (view === 'day') setCurrentDate(subDays(currentDate, 1));
    };

    const handleNext = () => {
        if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
        else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
        else if (view === 'day') setCurrentDate(addDays(currentDate, 1));
    };

    const goToToday = () => setCurrentDate(new Date());

    // Generate days for grid using useMemo to prevent infinite loops
    const { startDate, endDate, calendarDays } = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const start = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start on Monday
        const end = endOfWeek(monthEnd, { weekStartsOn: 1 });

        const days = eachDayOfInterval({
            start: start,
            end: end,
        });

        return { startDate: start, endDate: end, calendarDays: days };
    }, [currentDate]);

    const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    const fetchItems = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getCalendarData(startDate, endDate);
            setItems(data);
        } catch (error) {
            console.error('Error fetching calendar data:', error);
            setError('No se pudieron cargar los datos. Verifica tu conexión.');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to current time or 8:00 AM
    useEffect(() => {
        if (view === 'week' || view === 'day') {
            setTimeout(() => {
                const container = scrollContainerRef.current;
                if (container) {
                    const currentHour = new Date().getHours();
                    const targetHour = Math.max(8, currentHour - 1);
                    const hourHeight = view === 'week' ? 48 : 80;
                    container.scrollTop = targetHour * hourHeight;
                }
            }, 100);
        }
    }, [view]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleCreateClick = (date?: Date) => {
        setSelectedDateForModal(date || new Date());
        setIsModalOpen(true);
    };

    const handleQuickAddClick = (date: Date, e: React.MouseEvent) => {
        e.stopPropagation();
        setQuickAddDate(date);
        setQuickAddOpen(true);
    };

    const handleQuickAddSubmit = async (data: { title: string; description?: string; color?: string }) => {
        try {
            await createCalendarItem({
                title: data.title,
                description: data.description,
                date: quickAddDate,
                color: data.color
            });
            fetchItems();
        } catch (error) {
            console.error('Error creating item:', error);
        }
    };

    const handleExportToICal = async () => {
        setExporting(true);
        try {
            const result = await exportCalendarToIcal({
                startDate,
                endDate,
                includeTasks: true,
                includeHolidays: true,
                includePersonalItems: true,
                includeEvents: true
            });

            if (result.success && result.content && result.filename) {
                downloadICalFile(result.content, result.filename);
            } else {
                alert(result.error || 'Error al exportar el calendario');
            }
        } catch (error) {
            console.error('Error exporting calendar:', error);
            alert('Error al exportar el calendario');
        } finally {
            setExporting(false);
        }
    };

    const handleDeletePersonalItem = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('¿Eliminar esta nota?')) return;
        try {
            await deleteCalendarItem(id);
            fetchItems();
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    // Drag & Drop Handlers
    const [draggingItem, setDraggingItem] = useState<UnifiedCalendarItem | null>(null);

    const handleDragStart = (e: React.DragEvent, item: UnifiedCalendarItem) => {
        if (item.type === 'holiday') return; // Holidays are fixed
        setDraggingItem(item);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.id);
        // ghost image
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '0.5';
    };

    const handleDragEnd = (e: React.DragEvent) => {
        const el = e.currentTarget as HTMLElement;
        el.style.opacity = '1';
        setDraggingItem(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // allow drop
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, date: Date) => {
        e.preventDefault();

        // Check if we have a dragging item in state (react way)
        if (!draggingItem) return;

        // Visual reset (if dragEnd didn't fire properly or for other elements)
        // document.querySelectorAll('.dragging').forEach(el => (el as HTMLElement).style.opacity = '1');

        try {
            await moveCalendarItem(draggingItem.id, draggingItem.type, date);
            fetchItems();
        } catch (error) {
            console.error('Error moving item:', error);
            alert('Error al mover el elemento.');
        }
        setDraggingItem(null);
    };

    const handleEventClick = (item: UnifiedCalendarItem, e: React.MouseEvent) => {
        e.stopPropagation();

        if (item.type === 'event') {
            // Open event details modal
            setSelectedEvent(item);
        } else if (item.type === 'task') {
            // Navigate to task view
            router.push(`/tasks/kanban?taskId=${item.id}`);
        }
        // holidays and personal items don't navigate anywhere
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        fetchItems();
    };

    const handleEventModalClose = () => {
        setSelectedEvent(null);
    };

    const handleEventUpdate = () => {
        setSelectedEvent(null);
        fetchItems();
    };

    const getItemsForDay = (day: Date) => {
        return items.filter(item => isSameDay(new Date(item.date), day));
    };

    const isHolidayDay = (day: Date) => {
        return items.some(item => item.type === 'holiday' && isSameDay(new Date(item.date), day));
    };

    const getHolidayForDay = (day: Date) => {
        return items.find(item => item.type === 'holiday' && isSameDay(new Date(item.date), day));
    };

    const getItemIcon = (type: string) => {
        switch (type) {
            case 'task': return <CheckSquare size={10} className="inline mr-1" />;
            case 'holiday': return <Star size={10} className="inline mr-1" />;
            case 'personal': return <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: 'currentColor' }} />;
            default: return <Clock size={10} className="inline mr-1" />;
        }
    };

    const getItemStyle = (item: UnifiedCalendarItem) => {
        const alpha = item.type === 'holiday' ? '30' : '20';
        return {
            backgroundColor: `${item.color}${alpha}`,
            color: item.color,
            borderLeft: `3px solid ${item.color}`
        };
    };

    return (
        <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900 p-6 space-y-6">
            <CreateEventModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                currentDate={selectedDateForModal}
                projectId={projectId}
            />

            <EventDetailsModal
                event={selectedEvent}
                isOpen={!!selectedEvent}
                onClose={handleEventModalClose}
                onUpdate={handleEventUpdate}
            />

            <QuickAddModal
                isOpen={quickAddOpen}
                onClose={() => setQuickAddOpen(false)}
                date={quickAddDate}
                onSubmit={handleQuickAddSubmit}
            />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                        Calendario {projectId ? ' del Proyecto' : ''}
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">Tu agenda personal con eventos, tareas, festivos y notas</p>
                </div>

                <div className="flex items-center space-x-3 bg-white dark:bg-neutral-800 p-1 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                    <button
                        onClick={() => setView('month')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'month' ? 'bg-olive-100 dark:bg-olive-900/40 text-olive-700 dark:text-olive-400' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                    >
                        Mes
                    </button>
                    <button
                        onClick={() => setView('week')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'week' ? 'bg-olive-100 dark:bg-olive-900/40 text-olive-700 dark:text-olive-400' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => setView('day')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'day' ? 'bg-olive-100 dark:bg-olive-900/40 text-olive-700 dark:text-olive-400' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700'}`}
                    >
                        Día
                    </button>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleExportToICal}
                        disabled={exporting}
                        className="flex items-center space-x-2 px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all font-bold text-neutral-700 dark:text-neutral-300 disabled:opacity-50"
                    >
                        {exporting ? (
                            <div className="w-5 h-5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                            <FileDown size={20} />
                        )}
                        <span>Exportar</span>
                    </button>

                    <button
                        onClick={() => handleCreateClick()}
                        className="flex items-center space-x-2 bg-olive-600 text-white px-5 py-3 rounded-xl hover:bg-olive-700 transition-all shadow-lg shadow-olive-600/20 font-bold"
                    >
                        <Plus size={20} />
                        <span>Nuevo Evento</span>
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs flex-wrap">
                <span className="text-neutral-500 font-medium">Leyenda:</span>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-500"></div>
                    <span>Eventos</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-olive-500"></div>
                    <span>Tareas</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-red-500"></div>
                    <span>Festivos</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-violet-500"></div>
                    <span>Notas personales</span>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex justify-between items-center">
                    <span className="font-medium">{error}</span>
                    <button onClick={fetchItems} className="text-sm underline hover:text-red-800">Reintentar</button>
                </div>
            )}

            {/* Calendar Controls */}
            <div className="flex items-center justify-between bg-white dark:bg-neutral-800 p-4 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-700">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 capitalize min-w-[200px] flex items-center">
                        {format(currentDate, 'MMMM yyyy', { locale })}
                        {loading && <div className="ml-3 w-4 h-4 border-2 border-olive-600 border-t-transparent rounded-full animate-spin"></div>}
                    </h2>
                    <div className="flex items-center space-x-1">
                        <button onClick={handlePrevious} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all text-neutral-600 dark:text-neutral-400">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={goToToday} className="px-3 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all text-sm font-bold text-neutral-600 dark:text-neutral-400">
                            Hoy
                        </button>
                        <button onClick={handleNext} className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg transition-all text-neutral-600 dark:text-neutral-400">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white dark:bg-neutral-800 rounded-3xl shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden flex flex-col">
                {/* Month View */}
                {view === 'month' && (
                    <>
                        <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                            {weekDays.map(day => (
                                <div key={day} className="py-3 text-center text-sm font-bold text-neutral-600 dark:text-neutral-400">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                            {calendarDays.map((day, dayIdx) => {
                                const dayItems = getItemsForDay(day);
                                const holiday = getHolidayForDay(day);
                                const isHoliday = !!holiday;

                                return (
                                    <div
                                        key={day.toString()}
                                        className={`
                                            min-h-[120px] p-2 border-b border-r border-neutral-100 dark:border-neutral-700/50 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors relative group
                                            ${!isSameMonth(day, currentDate) ? 'bg-neutral-50/50 dark:bg-neutral-900/30' : 'dark:bg-neutral-800'}
                                            ${isToday(day) ? 'bg-olive-50/30 dark:bg-olive-900/10' : ''}
                                            ${isHoliday ? 'bg-red-50/50 dark:bg-red-900/10' : ''}
                                        `}
                                        onClick={() => handleCreateClick(day)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, day)}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span
                                                className={`
                                                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                                    ${isToday(day) ? 'bg-olive-600 text-white shadow-md shadow-olive-600/30' : (!isSameMonth(day, currentDate) ? 'text-neutral-400 dark:text-neutral-600' : 'text-neutral-700 dark:text-neutral-300')}
                                                `}
                                            >
                                                {format(day, 'd')}
                                            </span>
                                            {isToday(day) && (
                                                <span className="text-[10px] font-bold text-olive-700 bg-olive-100 px-2 py-0.5 rounded-full">
                                                    HOY
                                                </span>
                                            )}
                                        </div>

                                        {/* Holiday banner */}
                                        {holiday && (
                                            <div className="text-[10px] font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded mb-1 truncate">
                                                🎉 {holiday.title}
                                            </div>
                                        )}

                                        <div className="space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar">
                                            {dayItems.filter(i => i.type !== 'holiday').map(item => (
                                                <div
                                                    key={item.id}
                                                    className={`text-[11px] px-2 py-0.5 rounded font-medium truncate cursor-pointer hover:brightness-95 flex items-center justify-between group/item ${draggingItem?.id === item.id ? 'opacity-50' : ''}`}
                                                    style={getItemStyle(item)}
                                                    title={`${item.type === 'task' ? '📋 Tarea: ' : item.type === 'personal' ? '📝 ' : ''}${item.title}`}
                                                    onClick={(e) => handleEventClick(item, e)}
                                                    draggable={item.type !== 'holiday'}
                                                    onDragStart={(e) => handleDragStart(e, item)}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <div className="flex items-center truncate">
                                                        {getItemIcon(item.type)}
                                                        {item.type === 'event' && item.endDate && (
                                                            <span className="opacity-75 mr-1">
                                                                {format(new Date(item.date), 'HH:mm')}
                                                            </span>
                                                        )}
                                                        <span className="truncate">{item.title}</span>
                                                    </div>
                                                    {item.type === 'personal' && (
                                                        <button
                                                            onClick={(e) => handleDeletePersonalItem(item.id, e)}
                                                            className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:bg-red-200 rounded"
                                                        >
                                                            <Trash2 size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Quick add button */}
                                        <button
                                            className="absolute bottom-2 right-2 p-1.5 bg-violet-100 text-violet-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-violet-200"
                                            onClick={(e) => handleQuickAddClick(day, e)}
                                            title="Añadir nota rápida"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {/* Week View */}
                {view === 'week' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className="grid grid-cols-7 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 flex-shrink-0">
                            {eachDayOfInterval({
                                start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                                end: endOfWeek(currentDate, { weekStartsOn: 1 })
                            }).map(day => {
                                const holiday = getHolidayForDay(day);
                                return (
                                    <div key={day.toString()} className={`py-3 text-center border-r border-neutral-100 dark:border-neutral-700/50 ${isToday(day) ? 'bg-olive-50/50 dark:bg-olive-900/10' : ''} ${holiday ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                                        <div className="text-sm font-bold text-neutral-600 dark:text-neutral-400">{format(day, 'EEE', { locale })}</div>
                                        <div className={`text-xl font-black ${isToday(day) ? 'text-olive-600 dark:text-olive-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                                            {format(day, 'd')}
                                        </div>
                                        {holiday && <div className="text-[10px] text-red-600 font-medium truncate px-1">{holiday.title}</div>}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative" ref={scrollContainerRef}>
                            <div className="grid grid-cols-7 min-h-[600px]">
                                {eachDayOfInterval({
                                    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                                    end: endOfWeek(currentDate, { weekStartsOn: 1 })
                                }).map(day => (
                                    <div key={day.toString()} className="border-r border-neutral-100 dark:border-neutral-700/50 min-h-[600px] relative hover:bg-neutral-50/30 dark:hover:bg-neutral-800/30 transition-colors"
                                        onClick={() => handleCreateClick(day)}
                                        onDragOver={handleDragOver}
                                        onDrop={(e) => handleDrop(e, day)}
                                    >
                                        {/* Time Grid Lines */}
                                        {Array.from({ length: 24 }).map((_, hour) => (
                                            <div key={hour} className="h-12 border-b border-neutral-50 dark:border-neutral-800/50 relative group">
                                                <span className="absolute -left-2 top-0 text-[10px] text-neutral-300 dark:text-neutral-600 transform -translate-y-1/2 w-0 overflow-hidden group-hover:w-auto group-hover:text-neutral-400 bg-white dark:bg-neutral-800 px-1 z-10">
                                                    {hour}:00
                                                </span>
                                            </div>
                                        ))}

                                        {/* Events and items */}
                                        {getItemsForDay(day).filter(i => i.type !== 'holiday').map(item => {
                                            const start = new Date(item.date);
                                            const end = item.endDate ? new Date(item.endDate) : start;
                                            const startHour = item.allDay ? 0 : start.getHours() + start.getMinutes() / 60;
                                            const duration = item.allDay ? 1 : Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60), 0.5);

                                            return (
                                                <div
                                                    key={item.id}
                                                    className={`absolute left-0.5 right-0.5 rounded-md p-1.5 text-xs overflow-hidden shadow-sm hover:z-10 cursor-pointer ${draggingItem?.id === item.id ? 'opacity-50' : ''}`}
                                                    style={{
                                                        ...getItemStyle(item),
                                                        top: item.allDay ? '0' : `${startHour * 3}rem`,
                                                        height: item.allDay ? '2rem' : `${Math.max(duration * 3, 1.5)}rem`
                                                    }}
                                                    onClick={(e) => handleEventClick(item, e)}
                                                    draggable={item.type !== 'holiday'}
                                                    onDragStart={(e) => handleDragStart(e, item)}
                                                    onDragEnd={handleDragEnd}
                                                >
                                                    <div className="font-bold truncate flex items-center">
                                                        {getItemIcon(item.type)}
                                                        {item.title}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Day View */}
                {view === 'day' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        <div className={`p-4 border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50 text-center flex-shrink-0 ${isHolidayDay(currentDate) ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                            <div className="text-sm font-bold text-neutral-600 dark:text-neutral-400">{format(currentDate, 'EEEE', { locale })}</div>
                            <div className={`text-3xl font-black ${isToday(currentDate) ? 'text-olive-600 dark:text-olive-400' : 'text-neutral-800 dark:text-neutral-200'}`}>
                                {format(currentDate, 'd')}
                            </div>
                            {getHolidayForDay(currentDate) && (
                                <div className="text-sm text-red-600 font-medium mt-1">🎉 {getHolidayForDay(currentDate)?.title}</div>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white dark:bg-neutral-800" ref={scrollContainerRef}>
                            <div className="min-h-[1000px] relative"
                                onDragOver={handleDragOver}
                                onDrop={(e) => handleDrop(e, currentDate)}
                            >
                                {Array.from({ length: 24 }).map((_, hour) => (
                                    <div key={hour} className="h-20 border-b border-neutral-100 dark:border-neutral-700/50 flex group hover:bg-neutral-50/50 dark:hover:bg-neutral-700/20 transition-colors" onClick={() => {
                                        const d = new Date(currentDate);
                                        d.setHours(hour, 0, 0, 0);
                                        handleCreateClick(d);
                                    }}>
                                        <div className="w-16 text-right pr-4 text-xs font-medium text-neutral-400 pt-2 border-r border-neutral-100 dark:border-neutral-700/50 relative">
                                            {hour}:00
                                            <div className="absolute right-0 top-0 w-2 h-[1px] bg-neutral-200 dark:bg-neutral-700"></div>
                                        </div>
                                        <div className="flex-1 relative"></div>
                                    </div>
                                ))}

                                {/* Items */}
                                {getItemsForDay(currentDate).filter(i => i.type !== 'holiday').map(item => {
                                    const start = new Date(item.date);
                                    const end = item.endDate ? new Date(item.endDate) : start;
                                    const startHour = item.allDay ? 0 : start.getHours() + start.getMinutes() / 60;
                                    const duration = item.allDay ? 2 : Math.max((end.getTime() - start.getTime()) / (1000 * 60 * 60), 0.5);

                                    return (
                                        <div
                                            key={item.id}
                                            className={`absolute left-16 right-4 rounded-xl p-3 text-sm shadow-md hover:shadow-lg transition-all cursor-pointer ${draggingItem?.id === item.id ? 'opacity-50' : ''}`}
                                            style={{
                                                ...getItemStyle(item),
                                                top: item.allDay ? '0.5rem' : `${startHour * 5}rem`,
                                                height: item.allDay ? '3rem' : `${Math.max(duration * 5, 2.5)}rem`
                                            }}
                                            onClick={(e) => handleEventClick(item, e)}
                                            draggable={item.type !== 'holiday'}
                                            onDragStart={(e) => handleDragStart(e, item)}
                                            onDragEnd={handleDragEnd}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="font-bold flex items-center">
                                                    {getItemIcon(item.type)}
                                                    {item.title}
                                                </div>
                                                {item.endDate && !item.allDay && (
                                                    <div className="text-xs opacity-80 bg-white/50 px-2 py-0.5 rounded-full">
                                                        {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                                                    </div>
                                                )}
                                            </div>
                                            {item.description && <div className="text-xs mt-1 opacity-90 line-clamp-2">{item.description}</div>}
                                            {item.type === 'event' && item.location && (
                                                <div className="flex items-center text-xs mt-1 opacity-80">
                                                    <MapPin size={12} className="mr-1" />
                                                    {item.location}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
