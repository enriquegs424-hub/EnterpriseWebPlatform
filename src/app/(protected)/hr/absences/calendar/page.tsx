'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { getAbsencesCalendar } from '../../actions';

export default function AbsencesCalendarPage() {
    return (
        <ProtectedRoute allowedRoles={['SUPERADMIN', 'ADMIN', 'MANAGER']}>
            <CalendarContent />
        </ProtectedRoute>
    );
}

function CalendarContent() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [absences, setAbsences] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    useEffect(() => {
        const fetchAbsences = async () => {
            setLoading(true);
            try {
                const data = await getAbsencesCalendar(month, year);
                setAbsences(data);
            } catch (error) {
                console.error('Error fetching absences:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAbsences();
    }, [month, year]);

    const getDaysInMonth = (year: number, month: number) => {
        return new Date(year, month, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month - 1, 1).getDay();
        return day === 0 ? 6 : day - 1; // Monday = 0
    };

    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const getAbsencesForDay = (day: number) => {
        const date = new Date(year, month - 1, day);
        return absences.filter(absence => {
            const start = new Date(absence.startDate);
            const end = new Date(absence.endDate);
            return date >= start && date <= end;
        });
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            VACATION: 'bg-blue-500',
            SICK: 'bg-red-500',
            PERSONAL: 'bg-purple-500',
            MATERNITY: 'bg-pink-500',
            PATERNITY: 'bg-cyan-500',
            UNPAID: 'bg-yellow-500',
            OTHER: 'bg-neutral-500'
        };
        return colors[type] || 'bg-neutral-400';
    };

    const prevMonth = () => {
        setCurrentDate(new Date(year, month - 2, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(year, month, 1));
    };

    const monthNames = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/hr/absences" className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">
                            Calendario de Ausencias
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400">
                            Visualiza las ausencias del equipo
                        </p>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                <div className="flex flex-wrap gap-4">
                    {[
                        { type: 'VACATION', label: 'Vacaciones' },
                        { type: 'SICK', label: 'Enfermedad' },
                        { type: 'PERSONAL', label: 'Personal' },
                        { type: 'MATERNITY', label: 'Maternidad' },
                        { type: 'PATERNITY', label: 'Paternidad' },
                        { type: 'UNPAID', label: 'Sin sueldo' },
                    ].map(({ type, label }) => (
                        <div key={type} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getTypeColor(type)}`}></div>
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                {/* Month Navigation */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
                    <button
                        onClick={prevMonth}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
                        {monthNames[month - 1]} {year}
                    </h2>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-olive-600"></div>
                    </div>
                ) : (
                    <div className="p-4">
                        {/* Day Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {dayNames.map(day => (
                                <div key={day} className="text-center text-xs font-semibold text-neutral-500 dark:text-neutral-400 py-2">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {/* Empty cells for first week */}
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} className="min-h-[100px] bg-neutral-50 dark:bg-neutral-900/30 rounded"></div>
                            ))}

                            {/* Days */}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const dayAbsences = getAbsencesForDay(day);
                                const isToday = new Date().getDate() === day &&
                                    new Date().getMonth() + 1 === month &&
                                    new Date().getFullYear() === year;
                                const isWeekend = (firstDay + day - 1) % 7 >= 5;

                                return (
                                    <motion.div
                                        key={day}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.01 }}
                                        className={`min-h-[100px] p-2 rounded border transition-colors ${isToday
                                                ? 'border-olive-500 bg-olive-50 dark:bg-olive-900/20'
                                                : isWeekend
                                                    ? 'border-neutral-100 dark:border-neutral-700/50 bg-neutral-50 dark:bg-neutral-900/30'
                                                    : 'border-neutral-100 dark:border-neutral-700/50 bg-white dark:bg-neutral-800'
                                            }`}
                                    >
                                        <span className={`text-sm font-medium ${isToday ? 'text-olive-600' : 'text-neutral-600 dark:text-neutral-400'}`}>
                                            {day}
                                        </span>
                                        <div className="mt-1 space-y-1 max-h-[60px] overflow-y-auto">
                                            {dayAbsences.slice(0, 3).map(absence => (
                                                <div
                                                    key={absence.id}
                                                    className={`text-xs px-1.5 py-0.5 rounded text-white truncate ${getTypeColor(absence.type)}`}
                                                    title={`${absence.user?.name} - ${absence.type}`}
                                                >
                                                    {absence.user?.name?.split(' ')[0]}
                                                </div>
                                            ))}
                                            {dayAbsences.length > 3 && (
                                                <div className="text-xs text-neutral-500 pl-1">
                                                    +{dayAbsences.length - 3} más
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Today's Absences */}
            {absences.filter(a => {
                const today = new Date();
                const start = new Date(a.startDate);
                const end = new Date(a.endDate);
                return today >= start && today <= end;
            }).length > 0 && (
                    <div className="bg-white dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                        <h3 className="font-semibold text-neutral-900 dark:text-white mb-3">Ausentes Hoy</h3>
                        <div className="flex flex-wrap gap-3">
                            {absences.filter(a => {
                                const today = new Date();
                                const start = new Date(a.startDate);
                                const end = new Date(a.endDate);
                                return today >= start && today <= end;
                            }).map(absence => (
                                <div
                                    key={absence.id}
                                    className="flex items-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-700/50 rounded-lg"
                                >
                                    <div className={`w-2 h-2 rounded-full ${getTypeColor(absence.type)}`}></div>
                                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                        {absence.user?.name}
                                    </span>
                                    <span className="text-xs text-neutral-500">
                                        ({absence.type === 'VACATION' ? 'Vacaciones' :
                                            absence.type === 'SICK' ? 'Enfermedad' :
                                                absence.type === 'PERSONAL' ? 'Personal' : absence.type})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
        </div>
    );
}
