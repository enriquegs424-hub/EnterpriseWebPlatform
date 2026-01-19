'use client';

import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, AlertTriangle, Eye, ChevronLeft, ChevronRight, Filter, Download } from 'lucide-react';
import Link from 'next/link';
import { getEquipoResumen, getDepartamentosConUsuarios } from '../actions';
import {
    formatHoras,
    formatDiferencia,
    formatFecha,
    getColorDiasSinImputar,
    getColorDiferencia,
    MESES,
    type ResumenUsuarioEquipo
} from '../utils';

export default function EquipoPage() {
    const [año, setAño] = useState(new Date().getFullYear());
    const [mes, setMes] = useState(new Date().getMonth());
    const [datos, setDatos] = useState<ResumenUsuarioEquipo[]>([]);
    const [departamentos, setDepartamentos] = useState<{ id: string; label: string; color: string }[]>([]);
    const [departamentoFiltro, setDepartamentoFiltro] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        cargarDepartamentos();
    }, []);

    useEffect(() => {
        cargarDatos();
    }, [año, mes, departamentoFiltro]);

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
            const result = await getEquipoResumen(año, mes, departamentoFiltro || undefined);
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

    const handleExport = () => {
        const headers = ['Trabajador', 'Department', 'Último Día', 'Días Sin Imputar', 'H. Previstas', 'H. Reales', 'Diferencia', '%'];
        const rows = datos.map(u => [
            u.userName,
            u.departmentLabel,
            u.ultimoDiaImputado ? formatFecha(new Date(u.ultimoDiaImputado)) : 'Nunca',
            u.diasSinImputar,
            u.horasPrevistas,
            u.horasReales,
            u.diferencia,
            u.porcentajeCumplimiento + '%'
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `equipo-${MESES[mes]}-${año}.csv`;
        a.click();
    };

    // Estadísticas del equipo
    const totalHoras = datos.reduce((sum, u) => sum + u.horasReales, 0);
    const avgCumplimiento = datos.length > 0
        ? Math.round(datos.reduce((sum, u) => sum + u.porcentajeCumplimiento, 0) / datos.length)
        : 0;
    const usuariosProblematicos = datos.filter(u => u.diasSinImputar > 3).length;

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
                        <Users className="w-7 h-7 text-blue-600" />
                        Control de Equipo
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Vista global de horas del equipo
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

            {/* Selector de mes y filtros */}
            <div className="flex items-center justify-between gap-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => cambiarMes(-1)}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="text-center min-w-[180px]">
                        <h2 className="text-lg font-bold">{MESES[mes]} {año}</h2>
                    </div>
                    <button
                        onClick={() => cambiarMes(1)}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                    >
                        <ChevronRight size={20} />
                    </button>
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

            {/* Stats del equipo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                        <Users size={16} />
                        Trabajadores
                    </div>
                    <div className="text-2xl font-bold text-blue-600">{datos.length}</div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                        <Clock size={16} />
                        Total Horas
                    </div>
                    <div className="text-2xl font-bold text-green-600">{formatHoras(totalHoras)}</div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                        <Calendar size={16} />
                        Cumplimiento Medio
                    </div>
                    <div className={`text-2xl font-bold ${avgCumplimiento >= 80 ? 'text-green-600' : 'text-amber-600'}`}>
                        {avgCumplimiento}%
                    </div>
                </div>

                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
                    <div className="flex items-center gap-2 text-neutral-500 text-sm mb-1">
                        <AlertTriangle size={16} />
                        Con Retraso (&gt;3 días)
                    </div>
                    <div className={`text-2xl font-bold ${usuariosProblematicos > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {usuariosProblematicos}
                    </div>
                </div>
            </div>

            {/* Tabla de equipo */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : datos.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                        No hay usuarios para mostrar
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-neutral-500">Trabajador</th>
                                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-neutral-500">Departamento</th>
                                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-neutral-500">Último Día</th>
                                <th className="text-center px-4 py-3 text-xs font-bold uppercase text-neutral-500">Días Sin Imputar</th>
                                <th className="text-right px-4 py-3 text-xs font-bold uppercase text-neutral-500">Previstas</th>
                                <th className="text-right px-4 py-3 text-xs font-bold uppercase text-neutral-500">Reales</th>
                                <th className="text-right px-4 py-3 text-xs font-bold uppercase text-neutral-500">Diferencia</th>
                                <th className="text-center px-4 py-3 text-xs font-bold uppercase text-neutral-500">%</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {datos.map((usuario) => {
                                const colorDias = getColorDiasSinImputar(usuario.diasSinImputar);
                                return (
                                    <tr key={usuario.userId} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {usuario.userImage ? (
                                                    <img
                                                        src={usuario.userImage}
                                                        alt={usuario.userName}
                                                        className="w-8 h-8 rounded-full"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center">
                                                        <Users size={14} />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium">{usuario.userName}</div>
                                                    <div className="text-xs text-neutral-500">{usuario.userEmail}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className="px-2 py-1 rounded text-xs font-medium text-white"
                                                style={{ backgroundColor: usuario.departmentColor }}
                                            >
                                                {usuario.departmentLabel}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400">
                                            {usuario.ultimoDiaImputado
                                                ? formatFecha(new Date(usuario.ultimoDiaImputado))
                                                : <span className="text-neutral-400">Nunca</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${colorDias.bg} ${colorDias.text}`}>
                                                {usuario.diasSinImputar}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm">
                                            {formatHoras(usuario.horasPrevistas)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-medium">
                                            {formatHoras(usuario.horasReales)}
                                        </td>
                                        <td className={`px-4 py-3 text-right text-sm font-bold ${getColorDiferencia(usuario.diferencia)}`}>
                                            {formatDiferencia(usuario.diferencia)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`text-sm font-bold ${usuario.porcentajeCumplimiento >= 100 ? 'text-green-600' :
                                                    usuario.porcentajeCumplimiento >= 80 ? 'text-amber-600' : 'text-red-600'
                                                }`}>
                                                {usuario.porcentajeCumplimiento}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/control-horas/mi-hoja?userId=${usuario.userId}&año=${año}&mes=${mes}`}
                                                className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg inline-flex text-blue-600"
                                                title="Ver hoja del usuario"
                                            >
                                                <Eye size={18} />
                                            </Link>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Leyenda */}
            <div className="flex items-center gap-6 text-sm text-neutral-500">
                <span className="font-medium">Días sin imputar:</span>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30"></div>
                    0 días (al día)
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/30"></div>
                    1-3 días
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30"></div>
                    &gt;3 días (urgente)
                </div>
            </div>
        </div>
    );
}
