'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Calendar, Download, Filter } from 'lucide-react';
import { getAnualResumen, getDepartamentosConUsuarios } from '../actions';
import { formatHoras, formatDiferencia, getColorDiferencia, MESES_CORTO, DEPARTMENT_COLORS } from '../utils';

type ResumenAnualUsuario = {
    userId: string;
    userName: string;
    department: string;
    departmentColor: string;
    horasPorMes: number[];
    totalHoras: number;
    horasPrevistas: number;
    diferencia: number;
};

export default function AnualPage() {
    const [año, setAño] = useState(new Date().getFullYear());
    const [datos, setDatos] = useState<{ usuarios: ResumenAnualUsuario[]; totalesPorMes: number[]; totalGlobal: number } | null>(null);
    const [departamentos, setDepartamentos] = useState<{ id: string; label: string; color: string }[]>([]);
    const [departamentoFiltro, setDepartamentoFiltro] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarDepartamentos();
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [año, departamentoFiltro]);

    const cargarDepartamentos = async () => {
        try {
            const depts = await getDepartamentosConUsuarios();
            setDepartamentos(depts);
        } catch (err) {
            console.error('Error cargando departamentos:', err);
        }
    };

    const cargarDatos = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await getAnualResumen(año, departamentoFiltro || undefined);
            setDatos(result);
        } catch (err: any) {
            setError(err.message || 'Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (!datos) return;

        const headers = ['Trabajador', 'Departamento', ...MESES_CORTO, 'Total', 'Previstas', 'Diferencia'];
        const rows = datos.usuarios.map(u => [
            u.userName,
            u.department,
            ...u.horasPorMes,
            u.totalHoras,
            u.horasPrevistas,
            u.diferencia
        ]);

        // Añadir fila de totales
        rows.push([
            'TOTAL',
            '',
            ...datos.totalesPorMes,
            datos.totalGlobal,
            '',
            ''
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `anual-${año}.csv`;
        a.click();
    };

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                        <BarChart3 className="w-7 h-7 text-blue-600" />
                        Resumen Anual
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Horas por trabajador y mes
                    </p>
                </div>
                <button
                    onClick={handleExport}
                    disabled={!datos}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                >
                    <Download size={18} />
                    Exportar CSV
                </button>
            </div>

            {/* Selector de año y filtros */}
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                <div className="flex items-center gap-4">
                    <Calendar size={20} className="text-neutral-400" />
                    <select
                        value={año}
                        onChange={(e) => setAño(parseInt(e.target.value))}
                        className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 font-bold text-lg"
                    >
                        {[0, 1, 2, 3, 4].map(offset => {
                            const y = new Date().getFullYear() - offset;
                            return <option key={y} value={y}>{y}</option>;
                        })}
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <Filter size={18} className="text-neutral-400" />
                    <select
                        value={departamentoFiltro}
                        onChange={(e) => setDepartamentoFiltro(e.target.value)}
                        className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm"
                    >
                        <option value="">Todos los departamentos</option>
                        {departamentos.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Tabla anual */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : !datos || datos.usuarios.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                        No hay datos para este año
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px]">
                            <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-bold uppercase text-neutral-500 sticky left-0 bg-neutral-50 dark:bg-neutral-800 min-w-[180px]">
                                        Trabajador
                                    </th>
                                    <th className="text-left px-2 py-3 text-xs font-bold uppercase text-neutral-500 min-w-[80px]">
                                        Dpto.
                                    </th>
                                    {MESES_CORTO.map((mes, i) => (
                                        <th key={i} className="text-right px-2 py-3 text-xs font-bold uppercase text-neutral-500 min-w-[55px]">
                                            {mes}
                                        </th>
                                    ))}
                                    <th className="text-right px-3 py-3 text-xs font-bold uppercase text-neutral-500 bg-blue-50 dark:bg-blue-900/20">
                                        Total
                                    </th>
                                    <th className="text-right px-3 py-3 text-xs font-bold uppercase text-neutral-500">
                                        Prev.
                                    </th>
                                    <th className="text-right px-3 py-3 text-xs font-bold uppercase text-neutral-500">
                                        Dif.
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {datos.usuarios.map((usuario) => (
                                    <tr key={usuario.userId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                        <td className="px-4 py-2 sticky left-0 bg-white dark:bg-neutral-900 font-medium">
                                            {usuario.userName}
                                        </td>
                                        <td className="px-2 py-2">
                                            <div
                                                className="w-3 h-3 rounded-full inline-block"
                                                style={{ backgroundColor: usuario.departmentColor }}
                                                title={usuario.department}
                                            ></div>
                                        </td>
                                        {usuario.horasPorMes.map((horas, m) => (
                                            <td key={m} className="px-2 py-2 text-right text-sm">
                                                {horas > 0 ? (
                                                    <span className={horas < 100 ? 'text-amber-600' : ''}>
                                                        {horas}
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-300 dark:text-neutral-600">-</span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-3 py-2 text-right font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                                            {formatHoras(usuario.totalHoras)}
                                        </td>
                                        <td className="px-3 py-2 text-right text-sm text-neutral-500">
                                            {formatHoras(usuario.horasPrevistas)}
                                        </td>
                                        <td className={`px-3 py-2 text-right text-sm font-bold ${getColorDiferencia(usuario.diferencia)}`}>
                                            {formatDiferencia(usuario.diferencia)}
                                        </td>
                                    </tr>
                                ))}
                                {/* Fila de totales */}
                                <tr className="bg-blue-50 dark:bg-blue-900/20 font-bold border-t-2 border-blue-200 dark:border-blue-800">
                                    <td className="px-4 py-3 sticky left-0 bg-blue-50 dark:bg-blue-900/20">
                                        TOTAL
                                    </td>
                                    <td></td>
                                    {datos.totalesPorMes.map((total, m) => (
                                        <td key={m} className="px-2 py-3 text-right text-sm">
                                            {total > 0 ? total : '-'}
                                        </td>
                                    ))}
                                    <td className="px-3 py-3 text-right text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40">
                                        {formatHoras(datos.totalGlobal)}
                                    </td>
                                    <td></td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Leyenda de colores */}
            {datos && datos.usuarios.length > 0 && (
                <div className="flex items-center gap-4 flex-wrap text-sm">
                    <span className="text-neutral-500 font-medium">Departamentos:</span>
                    {departamentos.map(dept => (
                        <div key={dept.id} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: dept.color }}
                            ></div>
                            <span className="text-neutral-600 dark:text-neutral-400">{dept.label}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Info */}
            <p className="text-sm text-neutral-500">
                💡 Las celdas en ámbar indican meses con menos de 100 horas registradas
            </p>
        </div>
    );
}
