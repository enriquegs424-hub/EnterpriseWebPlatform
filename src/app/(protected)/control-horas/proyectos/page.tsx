'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Clock, ChevronDown, ChevronRight, Download, Calendar } from 'lucide-react';
import { getProyectosResumen, getProyectosActivos } from '../actions';
import { formatHoras, MESES_CORTO, MESES } from '../utils';

type ResumenProyecto = {
    projectId: string;
    projectCode: string;
    projectName: string;
    horasPorMes: Record<number, number>;
    totalHoras: number;
    porcentaje: number;
    desglosePorUsuario?: { userId: string; userName: string; hours: number }[];
};

export default function ProyectosPage() {
    const [año, setAño] = useState(new Date().getFullYear());
    const [datos, setDatos] = useState<{ proyectos: ResumenProyecto[]; totalHoras: number } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

    useEffect(() => {
        cargarDatos();
    }, [año]);

    const cargarDatos = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await getProyectosResumen(año);
            setDatos(result);
        } catch (err: any) {
            setError(err.message || 'Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    const toggleExpand = (projectId: string) => {
        const newExpanded = new Set(expandedProjects);
        if (newExpanded.has(projectId)) {
            newExpanded.delete(projectId);
        } else {
            newExpanded.add(projectId);
        }
        setExpandedProjects(newExpanded);
    };

    const handleExport = () => {
        if (!datos) return;

        const headers = ['Proyecto', 'Código', ...MESES_CORTO, 'Total', '%'];
        const rows = datos.proyectos.map(p => [
            p.projectName,
            p.projectCode,
            ...Array(12).fill(0).map((_, m) => p.horasPorMes[m] || 0),
            p.totalHoras,
            p.porcentaje + '%'
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proyectos-${año}.csv`;
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
                        <FolderOpen className="w-7 h-7 text-blue-600" />
                        Horas por Proyecto
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Distribución anual de horas por proyecto
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

            {/* Selector de año */}
            <div className="flex items-center justify-center gap-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4">
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
                {datos && (
                    <div className="ml-4 text-neutral-500">
                        Total: <span className="font-bold text-blue-600">{formatHoras(datos.totalHoras)}</span>
                    </div>
                )}
            </div>

            {/* Tabla de proyectos */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : !datos || datos.proyectos.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                        No hay datos de proyectos para este año
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">
                            <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-bold uppercase text-neutral-500 sticky left-0 bg-neutral-50 dark:bg-neutral-800">
                                        Proyecto
                                    </th>
                                    {MESES_CORTO.map((mes, i) => (
                                        <th key={i} className="text-right px-2 py-3 text-xs font-bold uppercase text-neutral-500 min-w-[60px]">
                                            {mes}
                                        </th>
                                    ))}
                                    <th className="text-right px-4 py-3 text-xs font-bold uppercase text-neutral-500">
                                        Total
                                    </th>
                                    <th className="text-right px-4 py-3 text-xs font-bold uppercase text-neutral-500">
                                        %
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                {datos.proyectos.map((proyecto) => {
                                    const isExpanded = expandedProjects.has(proyecto.projectId);
                                    return (
                                        <>
                                            <tr
                                                key={proyecto.projectId}
                                                className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer"
                                                onClick={() => toggleExpand(proyecto.projectId)}
                                            >
                                                <td className="px-4 py-3 sticky left-0 bg-white dark:bg-neutral-900">
                                                    <div className="flex items-center gap-2">
                                                        {proyecto.desglosePorUsuario && proyecto.desglosePorUsuario.length > 0 ? (
                                                            isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                                                        ) : (
                                                            <div className="w-4"></div>
                                                        )}
                                                        <div>
                                                            <span className="font-bold text-blue-600">{proyecto.projectCode}</span>
                                                            <span className="text-neutral-500 ml-2">· {proyecto.projectName}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                {Array(12).fill(0).map((_, m) => (
                                                    <td key={m} className="px-2 py-3 text-right text-sm">
                                                        {proyecto.horasPorMes[m] ? (
                                                            <span className="font-medium">{Math.round(proyecto.horasPorMes[m] * 10) / 10}</span>
                                                        ) : (
                                                            <span className="text-neutral-300 dark:text-neutral-600">-</span>
                                                        )}
                                                    </td>
                                                ))}
                                                <td className="px-4 py-3 text-right font-bold text-blue-600">
                                                    {formatHoras(proyecto.totalHoras)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium">
                                                    {proyecto.porcentaje}%
                                                </td>
                                            </tr>
                                            {/* Desglose por usuario */}
                                            {isExpanded && proyecto.desglosePorUsuario?.map((usuario) => (
                                                <tr
                                                    key={`${proyecto.projectId}-${usuario.userId}`}
                                                    className="bg-neutral-50 dark:bg-neutral-800/30"
                                                >
                                                    <td className="px-4 py-2 pl-12 sticky left-0 bg-neutral-50 dark:bg-neutral-800/30">
                                                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                                            └ {usuario.userName}
                                                        </span>
                                                    </td>
                                                    <td colSpan={12}></td>
                                                    <td className="px-4 py-2 text-right text-sm font-medium">
                                                        {formatHoras(usuario.hours)}
                                                    </td>
                                                    <td className="px-4 py-2 text-right text-sm text-neutral-500">
                                                        {proyecto.totalHoras > 0
                                                            ? Math.round((usuario.hours / proyecto.totalHoras) * 100)
                                                            : 0}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </>
                                    );
                                })}
                                {/* Fila de totales */}
                                <tr className="bg-blue-50 dark:bg-blue-900/20 font-bold">
                                    <td className="px-4 py-3 sticky left-0 bg-blue-50 dark:bg-blue-900/20">
                                        TOTAL
                                    </td>
                                    {Array(12).fill(0).map((_, m) => {
                                        const totalMes = datos.proyectos.reduce((sum, p) => sum + (p.horasPorMes[m] || 0), 0);
                                        return (
                                            <td key={m} className="px-2 py-3 text-right text-sm">
                                                {totalMes > 0 ? Math.round(totalMes * 10) / 10 : '-'}
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-3 text-right text-blue-600">
                                        {formatHoras(datos.totalHoras)}
                                    </td>
                                    <td className="px-4 py-3 text-right">100%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Info */}
            <p className="text-sm text-neutral-500">
                💡 Haz clic en un proyecto para ver el desglose por persona
            </p>
        </div>
    );
}
