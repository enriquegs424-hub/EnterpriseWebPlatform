'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin, Users, Plus } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { getEvents } from '@/app/(protected)/calendar/actions';
import CreateEventModal from '@/components/calendar/CreateEventModal';
import EventDetailsModal from '@/components/calendar/EventDetailsModal';

import { useAppLocale } from '@/providers/LocaleContext';

interface EventsViewProps {
    projectId?: string;
}

export default function EventsView({ projectId }: EventsViewProps) {
    const { locale } = useAppLocale();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<'month' | 'week' | 'day'>('month');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedDateForModal, setSelectedDateForModal] = useState<Date | undefined>(undefined);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

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

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getEvents(startDate, endDate, projectId);
            setEvents(data);
        } catch (error) {
            console.error('Error fetching events:', error);
            setError('No se pudieron cargar los eventos. Verifica tu conexión.');
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate, projectId]);

    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to current time or 8:00 AM
    useEffect(() => {
        if (view === 'week' || view === 'day') {
            // Wait for render
            setTimeout(() => {
                const container = scrollContainerRef.current;
                if (container) {
                    const currentHour = new Date().getHours();
                    // Scroll to current hour or 8:00 AM, whichever is earlier, but prioritize work hours
                    // If before 8am, scroll to 8am. If after 8am, scroll to current hour - 1 (for context)
                    const targetHour = Math.max(8, currentHour - 1);
                    // In week view, each hour is 3rem (48px). In day view 5rem (80px).
                    const hourHeight = view === 'week' ? 48 : 80;
                    container.scrollTop = targetHour * hourHeight;
                }
            }, 100);
        }
    }, [view]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleCreateClick = (date?: Date) => {
        setSelectedDateForModal(date || new Date());
        setIsModalOpen(true);
    };

    const handleEventClick = (event: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedEvent(event);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        fetchEvents(); // Refresh events after creation
    };

    const handleEventModalClose = () => {
        setSelectedEvent(null);
    };

    const handleEventUpdate = () => {
        setSelectedEvent(null);
        fetchEvents(); // Refresh list after update/delete
    };

    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(new Date(event.startDate), day));
    };

    const getEventColor = (type: string) => {
        switch (type) {
            case 'MEETING': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'DEADLINE': return 'bg-red-100 text-red-700 border-red-200';
            case 'REMINDER': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-neutral-100 text-neutral-700 border-neutral-200';
        }
    };

    return (
        <div className="flex flex-col h-full bg-neutral-50 p-6 space-y-6">
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

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 tracking-tight">
                        Calendario {projectId ? ' del Proyecto' : ''}
                    </h1>
                    <p className="text-neutral-600 font-medium">Gestiona eventos y reuniones del equipo</p>
                </div>

                <div className="flex items-center space-x-3 bg-white p-1 rounded-xl shadow-sm border border-neutral-200">
                    <button
                        onClick={() => setView('month')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'month' ? 'bg-olive-100 text-olive-700' : 'text-neutral-600 hover:bg-neutral-50'}`}
                    >
                        Mes
                    </button>
                    <button
                        onClick={() => setView('week')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'week' ? 'bg-olive-100 text-olive-700' : 'text-neutral-600 hover:bg-neutral-50'}`}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => setView('day')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'day' ? 'bg-olive-100 text-olive-700' : 'text-neutral-600 hover:bg-neutral-50'}`}
                    >
                        Día
                    </button>
                </div>

                <button
                    onClick={() => handleCreateClick()}
                    className="flex items-center space-x-2 bg-olive-600 text-white px-5 py-3 rounded-xl hover:bg-olive-700 transition-all shadow-lg shadow-olive-600/20 font-bold"
                >
                    <Plus size={20} />
                    <span>Nuevo Evento</span>
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex justify-between items-center">
                    <span className="font-medium">{error}</span>
                    <button onClick={fetchEvents} className="text-sm underline hover:text-red-800">Reintentar</button>
                </div>
            )}

            {/* Calendar Controls */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
                <div className="flex items-center space-x-4">
                    <h2 className="text-xl font-bold text-neutral-900 capitalize min-w-[200px] flex items-center">
                        {format(currentDate, 'MMMM yyyy', { locale })}
                        {loading && <div className="ml-3 w-4 h-4 border-2 border-olive-600 border-t-transparent rounded-full animate-spin"></div>}
                    </h2>
                    <div className="flex items-center space-x-1">
                        <button onClick={handlePrevious} className="p-2 hover:bg-neutral-100 rounded-lg transition-all text-neutral-600">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={goToToday} className="px-3 py-1 hover:bg-neutral-100 rounded-lg transition-all text-sm font-bold text-neutral-600">
                            Hoy
                        </button>
                        <button onClick={handleNext} className="p-2 hover:bg-neutral-100 rounded-lg transition-all text-neutral-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex-1 bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col">
                {/* Month View */}
                {view === 'month' && (
                    <>
                        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50">
                            {weekDays.map(day => (
                                <div key={day} className="py-3 text-center text-sm font-bold text-neutral-600">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 grid grid-cols-7 auto-rows-fr">
                            {calendarDays.map((day, dayIdx) => {
                                const dayEvents = getEventsForDay(day);
                                return (
                                    <div
                                        key={day.toString()}
                                        className={`
                                            min-h-[120px] p-2 border-b border-r border-neutral-100 hover:bg-neutral-50 transition-colors relative group
                                            ${!isSameMonth(day, currentDate) ? 'bg-neutral-50/50' : ''}
                                            ${isToday(day) ? 'bg-olive-50/30' : ''}
                                        `}
                                        onClick={() => handleCreateClick(day)}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span
                                                className={`
                                                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                                    ${isToday(day) ? 'bg-olive-600 text-white shadow-md shadow-olive-600/30' : (!isSameMonth(day, currentDate) ? 'text-neutral-400' : 'text-neutral-700')}
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

                                        <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                                            {dayEvents.map(event => (
                                                <div
                                                    key={event.id}
                                                    className={`text-xs px-2 py-1 rounded-md font-medium truncate border ${getEventColor(event.type)} cursor-pointer hover:brightness-95`}
                                                    title={event.title}
                                                    onClick={(e) => handleEventClick(event, e)}
                                                >
                                                    <div className="flex items-center">
                                                        <span className="mr-1 opacity-75 text-[10px]">
                                                            {(new Date(event.startDate)).getHours()}:{(new Date(event.startDate)).getMinutes().toString().padStart(2, '0')}
                                                        </span>
                                                        {event.title}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <button className="absolute bottom-2 right-2 p-1.5 bg-olive-100 text-olive-700 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-olive-200">
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
                        <div className="grid grid-cols-7 border-b border-neutral-200 bg-neutral-50 flex-shrink-0">
                            {eachDayOfInterval({
                                start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                                end: endOfWeek(currentDate, { weekStartsOn: 1 })
                            }).map(day => (
                                <div key={day.toString()} className={`py-3 text-center border-r border-neutral-100 ${isToday(day) ? 'bg-olive-50/50' : ''}`}>
                                    <div className="text-sm font-bold text-neutral-600">{format(day, 'EEE', { locale })}</div>
                                    <div className={`text-xl font-black ${isToday(day) ? 'text-olive-600' : 'text-neutral-800'}`}>
                                        {format(day, 'd')}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative" ref={scrollContainerRef}>
                            <div className="grid grid-cols-7 min-h-[600px]">
                                {eachDayOfInterval({
                                    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
                                    end: endOfWeek(currentDate, { weekStartsOn: 1 })
                                }).map(day => (
                                    <div key={day.toString()} className="border-r border-neutral-100 min-h-[600px] relative hover:bg-neutral-50/30 transition-colors" onClick={() => handleCreateClick(day)}>
                                        {/* Time Grid Lines */}
                                        {Array.from({ length: 24 }).map((_, hour) => (
                                            <div key={hour} className="h-12 border-b border-neutral-50 relative group">
                                                <span className="absolute -left-2 top-0 text-[10px] text-neutral-300 transform -translate-y-1/2 w-0 overflow-hidden group-hover:w-auto group-hover:text-neutral-400 bg-white px-1 z-10">
                                                    {hour}:00
                                                </span>
                                            </div>
                                        ))}

                                        {/* Events */}
                                        {getEventsForDay(day).map(event => {
                                            const start = new Date(event.startDate);
                                            const end = new Date(event.endDate);
                                            const startHour = start.getHours() + start.getMinutes() / 60;
                                            const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                                            return (
                                                <div
                                                    key={event.id}
                                                    className={`absolute left-0.5 right-0.5 rounded-md p-1.5 border text-xs overflow-hidden shadow-sm hover:z-10 cursor-pointer ${getEventColor(event.type)}`}
                                                    style={{
                                                        top: `${startHour * 3}rem`, // 3rem (12 * 0.25rem) = 48px per hour (h-12)
                                                        height: `${Math.max(duration * 3, 1.5)}rem`
                                                    }}
                                                    onClick={(e) => handleEventClick(event, e)}
                                                >
                                                    <div className="font-bold truncate">{event.title}</div>
                                                    <div className="text-[10px] opacity-80 pb-1">{format(start, 'HH:mm')} - {format(end, 'HH:mm')}</div>
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
                        <div className="p-4 border-b border-neutral-200 bg-neutral-50 text-center flex-shrink-0">
                            <div className="text-sm font-bold text-neutral-600">{format(currentDate, 'EEEE', { locale })}</div>
                            <div className={`text-3xl font-black ${isToday(currentDate) ? 'text-olive-600' : 'text-neutral-800'}`}>
                                {format(currentDate, 'd')}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-white" ref={scrollContainerRef}>
                            <div className="min-h-[1000px] relative">
                                {Array.from({ length: 24 }).map((_, hour) => (
                                    <div key={hour} className="h-20 border-b border-neutral-100 flex group hover:bg-neutral-50/50 transition-colors" onClick={() => {
                                        const d = new Date(currentDate);
                                        d.setHours(hour, 0, 0, 0);
                                        handleCreateClick(d);
                                    }}>
                                        <div className="w-16 text-right pr-4 text-xs font-medium text-neutral-400 pt-2 border-r border-neutral-100 relative">
                                            {hour}:00
                                            <div className="absolute right-0 top-0 w-2 h-[1px] bg-neutral-200"></div>
                                        </div>
                                        <div className="flex-1 relative"></div>
                                    </div>
                                ))}

                                {/* Events */}
                                {getEventsForDay(currentDate).map(event => {
                                    const start = new Date(event.startDate);
                                    const end = new Date(event.endDate);
                                    const startHour = start.getHours() + start.getMinutes() / 60;
                                    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

                                    return (
                                        <div
                                            key={event.id}
                                            className={`absolute left-16 right-4 rounded-xl p-3 border text-sm shadow-md hover:shadow-lg transition-all cursor-pointer ${getEventColor(event.type)}`}
                                            style={{
                                                top: `${startHour * 5}rem`, // 5rem (20 * 0.25rem = 80px per hour)
                                                height: `${Math.max(duration * 5, 2.5)}rem`
                                            }}
                                            onClick={(e) => handleEventClick(event, e)}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="font-bold">{event.title}</div>
                                                <div className="text-xs opacity-80 bg-white/50 px-2 py-0.5 rounded-full">{format(start, 'HH:mm')} - {format(end, 'HH:mm')}</div>
                                            </div>
                                            {event.description && <div className="text-xs mt-1 opacity-90 line-clamp-2">{event.description}</div>}
                                            {event.location && (
                                                <div className="flex items-center text-xs mt-1 opacity-80">
                                                    <MapPin size={12} className="mr-1" />
                                                    {event.location}
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

