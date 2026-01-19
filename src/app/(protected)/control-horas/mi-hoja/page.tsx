'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, TrendingDown, AlertTriangle, Download, ChevronLeft, ChevronRight, User, Users, Eye, List } from 'lucide-react';
import { getMiHoja, getAccessibleUsers, exportarMiHoja } from '../actions';
import DailyHoursView from '@/components/hours/DailyHoursView';
import {
    formatHoras,
    formatDiferencia,
    getColorEstadoDia,
    getColorDiasSinImputar,
    getColorDiferencia,
    MESES,
    DIAS_SEMANA,
    type ResumenMensual
} from '../utils';
import { useSession } from 'next-auth/react';

export default function MiHojaPage() {
    const { data: session } = useSession();
    const [año, setAño] = useState(new Date().getFullYear());
    const [mes, setMes] = useState(new Date().getMonth());
    const [datos, setDatos] = useState<ResumenMensual | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Feature states
    const [viewMode, setViewMode] = useState<'resumen' | 'detalle'>('resumen');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [accessibleUsers, setAccessibleUsers] = useState<any[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    // Initialize user ID
    useEffect(() => {
        if (session?.user?.id && !selectedUserId) {
            setSelectedUserId(session.user.id);
        }
    }, [session]);

    // Load accessible users
    useEffect(() => {
        const loadUsers = async () => {
            try {
                const users = await getAccessibleUsers();
                setAccessibleUsers(users);
                // If current user not in list (shouldn't happen for self, but useful logic), defaults handled above
            } catch (err) {
                console.error("Error loading users", err);
            } finally {
                setLoadingUsers(false);
            }
        };
        loadUsers();
    }, []);

    // Load Data when params change
    useEffect(() => {
        if (selectedUserId) {
            cargarDatos();
        }
    }, [año, mes, selectedUserId]);

    const cargarDatos = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await getMiHoja(año, mes, selectedUserId);
            setDatos(result);
        } catch (err: any) {
            setError(err.message || 'Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const cambiarMes = (delta: number) => {
        let nuevoMes = mes + delta;
        let nuevoAño = año;

        if (nuevoMes < 0) {
            nuevoMes = 11;
            nuevoAño--;
        } else if (nuevoMes > 11) {
            nuevoMes = 0;
            nuevoAño++;
        }

        setMes(nuevoMes);
        setAño(nuevoAño);
    };

    const handleExport = async () => {
        try {
            const data = await exportarMiHoja(año, mes, selectedUserId);
            // Generar CSV
            const headers = ['Día', 'Día Semana', 'Estado', 'Total Horas', 'Proyectos', 'Notas'];
            const rows = data.diasDelMes.map(d => [
                d.dia,
                d.diaSemanaLabel,
                d.estado,
                d.totalHoras,
                d.horasPorProyecto.map(p => `${p.projectCode}:${p.hours}h`).join('; '),
                d.notas.join('; ')
            ]);

            const csv = [
                headers.join(','),
                ...rows.map(r => r.map(c => `"${c}"`).join(','))
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mi-hoja-${MESES[mes]}-${año}.csv`;
            a.click();
        } catch (err) {
            console.error('Error exportando:', err);
        }
    };

    if (!session || !selectedUserId) return null;

    return (
        <div className="space-y-6">
            {/* Header with Title and User Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                        <Calendar className="w-7 h-7 text-olive-600" />
                        Mi Hoja de Horas
                        {viewMode === 'detalle' && <span className="text-sm font-normal text-neutral-500 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-lg">Vista Detallada</span>}
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Control mensual de horas trabajadas
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* User Selector (Only if > 0 accessible users found, implying Manager/Admin) */}
                    {accessibleUsers.length > 0 && (
                        <div className="relative">
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors appearance-none min-w-[200px] font-medium"
                            >
                                {accessibleUsers.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                            <Users className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                    )}

                    {/* View Switcher */}
                    <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('resumen')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'resumen'
                                ? 'bg-white dark:bg-neutral-700 text-olive-600 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                        >
                            <Eye className="w-4 h-4" />
                            Resumen
                        </button>
                        <button
                            onClick={() => setViewMode('detalle')}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${viewMode === 'detalle'
                                ? 'bg-white dark:bg-neutral-700 text-olive-600 shadow-sm'
                                : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                        >
                            <List className="w-4 h-4" />
                            Detalle
                        </button>
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                        title="Exportar CSV"
                    >
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {viewMode === 'detalle' ? (
                <div className="bg-neutral-50 dark:bg-neutral-900/50 rounded-2xl p-1">
                    <DailyHoursView userId={selectedUserId} readOnly={true} />
                </div>
            ) : (
                <>
                    {/* Selector de mes (Solo para Resumen, DailyHoursView tiene el suyo) */}
                    <div className="flex items-center justify-center gap-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                        <button
                            onClick={() => cambiarMes(-1)}
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <div className="text-center min-w-[200px]">
                            <h2 className="text-xl font-bold">{MESES[mes]} {año}</h2>
                            {datos && <p className="text-sm text-neutral-500">{datos.diasLaborables} días laborables</p>}
                        </div>
                        <button
                            onClick={() => cambiarMes(1)}
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center min-h-[40vh]">
                            <div className="flex items-center space-x-2 text-neutral-500 dark:text-neutral-400">
                                <div className="w-6 h-6 border-3 border-olive-600 border-t-transparent rounded-full animate-spin"></div>
                                <span>Cargando datos...</span>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <p className="text-red-500 font-bold mb-2">Error al cargar datos</p>
                            <p className="text-neutral-500 mb-4">{error}</p>
                            <button onClick={cargarDatos} className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700">
                                Reintentar
                            </button>
                        </div>
                    ) : datos ? (
                        <>
                            {/* Cards de resumen */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                                        <Clock size={16} />
                                        Horas Reales
                                    </div>
                                    <div className="text-2xl font-bold text-olive-600">
                                        {formatHoras(datos.horasReales)}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                                        <Calendar size={16} />
                                        Horas Previstas
                                    </div>
                                    <div className="text-2xl font-bold text-neutral-700 dark:text-neutral-300">
                                        {formatHoras(datos.horasPrevistas)}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                                        {datos.diferencia >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                                        Diferencia
                                    </div>
                                    <div className={`text-2xl font-bold ${getColorDiferencia(datos.diferencia)}`}>
                                        {formatDiferencia(datos.diferencia)}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                                        <AlertTriangle size={16} />
                                        Sin Imputar
                                    </div>
                                    <div className={`text-2xl font-bold ${getColorDiasSinImputar(datos.diasSinImputar).text}`}>
                                        {datos.diasSinImputar} días
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                                        <TrendingUp size={16} />
                                        Cumplimiento
                                    </div>
                                    <div className={`text-2xl font-bold ${datos.porcentajeCumplimiento >= 100 ? 'text-green-600' : datos.porcentajeCumplimiento >= 80 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {datos.porcentajeCumplimiento}%
                                    </div>
                                </div>
                            </div>

                            {/* Calendario mensual */}
                            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
                                    <h3 className="font-bold">Detalle por día</h3>
                                </div>

                                {/* Header días de semana */}
                                <div className="grid grid-cols-8 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                                    <div className="px-3 py-2 text-xs font-bold text-neutral-500 uppercase">Día</div>
                                    {DIAS_SEMANA.map((dia, i) => (
                                        <div key={i} className="px-3 py-2 text-xs font-bold text-neutral-500 uppercase text-center">
                                            {dia}
                                        </div>
                                    ))}
                                </div>

                                {/* Filas del calendario agrupadas por semana */}
                                <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    {datos.diasDelMes.map((dia) => (
                                        <div
                                            key={dia.dia}
                                            className={`grid grid-cols-8 items-center ${getColorEstadoDia(dia.estado)} hover:bg-neutral-50 dark:hover:bg-neutral-800/50`}
                                        >
                                            <div className="px-3 py-2 font-medium">
                                                {dia.dia}
                                            </div>
                                            <div className="px-3 py-2 text-center text-sm text-neutral-500">
                                                {dia.diaSemanaLabel}
                                            </div>
                                            {/* Columnas para proyectos (simplificado - mostrar top 3) */}
                                            {[0, 1, 2].map(idx => {
                                                const proyecto = dia.horasPorProyecto[idx];
                                                return (
                                                    <div key={idx} className="px-2 py-2 text-center">
                                                        {proyecto && (
                                                            <span className="text-xs bg-olive-100 dark:bg-olive-900/30 text-olive-700 dark:text-olive-400 px-2 py-0.5 rounded">
                                                                {proyecto.projectCode}: {proyecto.hours}h
                                                            </span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                            {/* Total */}
                                            <div className="px-3 py-2 text-center font-bold">
                                                {dia.totalHoras > 0 ? formatHoras(dia.totalHoras) : '-'}
                                            </div>
                                            {/* Estado visual */}
                                            <div className="px-3 py-2 text-center">
                                                {dia.estado === 'completo' && <span className="text-green-600">✓</span>}
                                                {dia.estado === 'incompleto' && <span className="text-amber-600">⚠</span>}
                                                {dia.estado === 'vacio' && dia.esLaborable && <span className="text-red-600">✗</span>}
                                                {dia.estado === 'no_laborable' && <span className="text-neutral-400">—</span>}
                                            </div>
                                            {/* Notas */}
                                            <div className="px-3 py-2 text-xs text-neutral-500 truncate max-w-[150px]">
                                                {dia.notas.length > 0 && dia.notas[0]}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totales por proyecto */}
                            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                                <h3 className="font-bold mb-4">Horas por Proyecto</h3>
                                <div className="space-y-2">
                                    {datos.totalesPorProyecto.map((proyecto) => (
                                        <div key={proyecto.projectId} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                            <div>
                                                <span className="font-medium">{proyecto.projectCode}</span>
                                                <span className="text-neutral-500 ml-2">· {proyecto.projectName}</span>
                                            </div>
                                            <div className="font-bold text-olive-600">
                                                {formatHoras(proyecto.hours)}
                                            </div>
                                        </div>
                                    ))}
                                    {datos.totalesPorProyecto.length === 0 && (
                                        <p className="text-neutral-500 text-center py-4">No hay horas registradas este mes</p>
                                    )}
                                </div>
                            </div>

                            {/* Leyenda */}
                            <div className="flex items-center gap-6 text-sm text-neutral-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30"></div>
                                    Día completo
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30"></div>
                                    Día incompleto
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30"></div>
                                    Sin imputar
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded bg-neutral-50 dark:bg-neutral-800/50"></div>
                                    No laborable
                                </div>
                            </div>
                        </>
                    ) : null}
                </>
            )}
        </div>
    );
}
