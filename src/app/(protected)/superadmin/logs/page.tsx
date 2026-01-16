'use client';

import { useState, useEffect } from 'react';
import { Activity, Search, Download, ChevronLeft, ChevronRight, Filter, Calendar, User, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getGlobalLogs, getCompanies, getUsersForFilter } from '../actions';

export default function SuperAdminLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        action: '',
        companyId: '',
        userId: '',
        department: '',
        dateFrom: '',
        dateTo: '',
        search: ''
    });

    const departments = [
        { id: 'CIVIL_DESIGN', label: 'Diseño y Civil' },
        { id: 'ELECTRICAL', label: 'Eléctrico' },
        { id: 'INSTRUMENTATION', label: 'Instrumentación' },
        { id: 'ADMINISTRATION', label: 'Administración' },
        { id: 'IT', label: 'Informática' },
        { id: 'ECONOMIC', label: 'Económico' },
        { id: 'OTHER', label: 'Otro' }
    ];

    useEffect(() => {
        loadData();
    }, [pagination.page, filters]);
    // Intentionally refetching on filter change. 
    // In production might want to debounce or use a fetch button, but for admin panel live update is fine.

    const loadData = async () => {
        setLoading(true);
        try {
            // Load filters data only once if empty
            if (companies.length === 0 || users.length === 0) {
                const [comps, usrs] = await Promise.all([
                    getCompanies(),
                    getUsersForFilter()
                ]);
                setCompanies(comps);
                setUsers(usrs);
            }

            const logsData = await getGlobalLogs({
                page: pagination.page,
                limit: 50,
                action: filters.action || undefined,
                companyId: filters.companyId || undefined,
                userId: filters.userId || undefined,
                department: filters.department || undefined,
                dateFrom: filters.dateFrom ? new Date(filters.dateFrom) : undefined,
                dateTo: filters.dateTo ? new Date(filters.dateTo) : undefined
            });

            setLogs(logsData.logs);
            setPagination(logsData.pagination);
        } catch (error) {
            console.error('Error loading logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'UPDATE': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            case 'LOGIN': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            default: return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-400';
        }
    };

    const exportToCSV = () => {
        const headers = ['Fecha', 'Acción', 'Entidad', 'Usuario', 'Departamento', 'Empresa', 'Detalle'];
        const rows = logs.map(log => [
            format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm'),
            log.action,
            log.entityType,
            log.user?.name || 'Sistema',
            log.user?.department || '-',
            log.company?.name || '-',
            log.details || ''
        ]);

        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                        <Activity className="w-7 h-7 text-blue-600" />
                        Logs de Auditoría Global
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        Actividad de todas las empresas de la plataforma
                    </p>
                </div>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                    <Download size={18} />
                    Exportar CSV
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 space-y-4">
                <div className="flex items-center gap-3 text-sm text-neutral-500 mb-2">
                    <Filter size={16} />
                    Filtros Avanzados
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* User Select */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Usuario</label>
                        <select
                            value={filters.userId}
                            onChange={(e) => setFilters({ ...filters, userId: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm"
                        >
                            <option value="">Todos los usuarios</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>{user.name} ({user.company?.name || 'No Company'})</option>
                            ))}
                        </select>
                    </div>

                    {/* Department Select */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Departamento</label>
                        <select
                            value={filters.department}
                            onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm"
                        >
                            <option value="">Todos los departamentos</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>{dept.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Company Select */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Empresa</label>
                        <select
                            value={filters.companyId}
                            onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm"
                        >
                            <option value="">Todas las empresas</option>
                            {companies.map((company) => (
                                <option key={company.id} value={company.id}>{company.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Action Select */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Tipo de Acción</label>
                        <select
                            value={filters.action}
                            onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm"
                        >
                            <option value="">Todas las acciones</option>
                            <option value="CREATE">Crear</option>
                            <option value="UPDATE">Actualizar</option>
                            <option value="DELETE">Eliminar</option>
                            <option value="LOGIN">Login</option>
                        </select>
                    </div>

                    {/* Date From */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Desde</label>
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm"
                        />
                    </div>

                    {/* Date To */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-500 mb-1">Hasta</label>
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                            className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-sm"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="text-sm text-neutral-500">
                        {pagination.total} registros encontrados
                    </div>
                    {(filters.userId || filters.department || filters.companyId || filters.action || filters.dateFrom || filters.dateTo) && (
                        <button
                            onClick={() => setFilters({
                                action: '', companyId: '', userId: '', department: '', dateFrom: '', dateTo: '', search: ''
                            })}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                        No hay registros con estos filtros
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-neutral-500">Fecha</th>
                                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-neutral-500">Acción</th>
                                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-neutral-500">Entidad</th>
                                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-neutral-500">Usuario</th>
                                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-neutral-500">Dpto.</th>
                                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-neutral-500">Empresa</th>
                                <th className="text-left px-4 py-3 text-xs font-bold uppercase text-neutral-500">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {logs.map((log) => (
                                <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                    <td className="px-4 py-3 text-sm text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                        {format(new Date(log.createdAt), "dd MMM HH:mm", { locale: es })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium">
                                        {log.entityType}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        {log.user?.name || 'Sistema'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-neutral-500">
                                        {log.user?.department || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-neutral-500">
                                        {log.company?.name || '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-neutral-500 max-w-xs truncate">
                                        {log.details}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
                        <span className="text-sm text-neutral-500">
                            Página {pagination.page} de {pagination.totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                                disabled={pagination.page === 1}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <button
                                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                                disabled={pagination.page === pagination.totalPages}
                                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-50"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
