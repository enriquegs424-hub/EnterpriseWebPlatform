'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, TrendingDown, AlertTriangle, Download, ChevronLeft, ChevronRight, User } from 'lucide-react';
import { getMiHoja, getProyectosActivos, exportarMiHoja } from '../actions';
import {
    formatHoras,
    formatDiferencia,
    getColorEstadoDia,
    getColorDiasSinImputar,
    getColorDiferencia,
    MESES,
    DIAS_SEMANA,
    type ResumenMensual,
    type DiaConHoras
} from '../utils';

export default function MiHojaPage() {
    const [año, setAño] = useState(new Date().getFullYear());
    const [mes, setMes] = useState(new Date().getMonth());
    const [datos, setDatos] = useState<ResumenMensual | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarDatos();
    }, [año, mes]);

    const cargarDatos = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await getMiHoja(año, mes);
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
            const data = await exportarMiHoja(año, mes);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
                <button onClick={cargarDatos} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg">
                    Reintentar
                </button>
            </div>
        );
    }

    if (!datos) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                        <Calendar className="w-7 h-7 text-blue-600" />
                        Mi Hoja de Horas
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Control mensual de horas trabajadas
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                    <Download size={18} />
                    Exportar CSV
                </button>
            </div>

            {/* Selector de mes */}
            <div className="flex items-center justify-center gap-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                <button
                    onClick={() => cambiarMes(-1)}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                    <ChevronLeft size={20} />
                </button>
                <div className="text-center min-w-[200px]">
                    <h2 className="text-xl font-bold">{MESES[mes]} {año}</h2>
                    <p className="text-sm text-neutral-500">{datos.diasLaborables} días laborables</p>
                </div>
                <button
                    onClick={() => cambiarMes(1)}
                    className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Cards de resumen */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                        <Clock size={16} />
                        Horas Reales
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
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
                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded">
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
                            <div className="font-bold text-blue-600">
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
        </div>
    );
}
