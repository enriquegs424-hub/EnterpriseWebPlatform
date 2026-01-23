'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    AlertTriangle,
    Clock,
    Calendar,
    TrendingUp,
    TrendingDown,
    Filter,
    Download,
    RefreshCw,
    ChevronDown,
    Search,
    Building2,
    CheckCircle,
    XCircle,
    ArrowUpDown,
    User,
    Briefcase,
    SortAsc,
    SortDesc
} from 'lucide-react';
import {
    getGlobalDashboardData,
    getPendingApprovals,
    approveTimeEntries,
    rejectTimeEntries,
    getAllTimeEntries,
    getFilterableUsers,
    getFilterableProjects,
    type TimeEntryFilters
} from '@/lib/work-time-tracking/actions';
import { Department, TimeEntryStatus } from '@prisma/client';

// Department labels and colors
const DEPARTMENT_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    CIVIL_DESIGN: { label: 'Diseño y Civil', color: 'text-blue-700', bgColor: 'bg-blue-100' },
    ELECTRICAL: { label: 'Eléctrico', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    INSTRUMENTATION: { label: 'Instrumentación', color: 'text-purple-700', bgColor: 'bg-purple-100' },
    ADMINISTRATION: { label: 'Administración', color: 'text-green-700', bgColor: 'bg-green-100' },
    IT: { label: 'Informática', color: 'text-cyan-700', bgColor: 'bg-cyan-100' },
    ECONOMIC: { label: 'Económico', color: 'text-orange-700', bgColor: 'bg-orange-100' },
    MARKETING: { label: 'Marketing', color: 'text-pink-700', bgColor: 'bg-pink-100' },
    OTHER: { label: 'Otros', color: 'text-neutral-700', bgColor: 'bg-neutral-100' }
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    DRAFT: { label: 'Borrador', color: 'text-neutral-700', bgColor: 'bg-neutral-100' },
    SUBMITTED: { label: 'Pendiente', color: 'text-amber-700', bgColor: 'bg-amber-100' },
    APPROVED: { label: 'Aprobado', color: 'text-green-700', bgColor: 'bg-green-100' },
    REJECTED: { label: 'Rechazado', color: 'text-red-700', bgColor: 'bg-red-100' }
};

interface TimeEntry {
    id: string;
    userId: string;
    date: Date;
    hours: number;
    notes: string | null;
    status: TimeEntryStatus;
    startTime: string | null;
    endTime: string | null;
    submittedAt: Date | null;
    approvedAt: Date | null;
    rejectionReason: string | null;
    user: {
        id: string;
        name: string;
        email: string;
        department: string;
        image: string | null;
    };
    project: {
        id: string;
        code: string;
        name: string;
    };
    approvedBy?: {
        id: string;
        name: string;
    } | null;
}

interface FilterUser {
    id: string;
    name: string;
    email: string;
    department: string;
}

interface FilterProject {
    id: string;
    code: string;
    name: string;
    department: string;
}

export default function GlobalHoursControlPage() {
    // View mode: 'entries' shows all time entries, 'summary' shows worker summary
    const [viewMode, setViewMode] = useState<'entries' | 'summary'>('entries');

    // Entries data
    const [entries, setEntries] = useState<TimeEntry[]>([]);
    const [totalEntries, setTotalEntries] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filter options
    const [users, setUsers] = useState<FilterUser[]>([]);
    const [projects, setProjects] = useState<FilterProject[]>([]);

    // Active filters
    const [selectedUser, setSelectedUser] = useState<string>('');
    const [selectedDepartment, setSelectedDepartment] = useState<string>('');
    const [selectedProject, setSelectedProject] = useState<string>('');
    const [selectedStatus, setSelectedStatus] = useState<string>('');
    const [sortBy, setSortBy] = useState<'date' | 'user' | 'project' | 'hours'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [searchTerm, setSearchTerm] = useState('');

    // Loading and error states
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Selection for bulk actions
    const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
    const [processingAction, setProcessingAction] = useState(false);

    // Reject modal
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectingEntryId, setRejectingEntryId] = useState<string | null>(null);
    const [processingEntryId, setProcessingEntryId] = useState<string | null>(null);

    // Load filter options on mount
    useEffect(() => {
        loadFilterOptions();
    }, []);

    // Load entries when filters change
    useEffect(() => {
        loadEntries();
    }, [selectedUser, selectedDepartment, selectedProject, selectedStatus, sortBy, sortOrder, currentPage]);

    const loadFilterOptions = async () => {
        try {
            const [usersData, projectsData] = await Promise.all([
                getFilterableUsers(),
                getFilterableProjects()
            ]);
            setUsers(usersData);
            setProjects(projectsData);
        } catch (err) {
            console.error('Error loading filter options:', err);
        }
    };

    const loadEntries = async () => {
        setLoading(true);
        setError(null);
        try {
            const filters: TimeEntryFilters = {
                sortBy,
                sortOrder,
                page: currentPage,
                limit: 50
            };

            if (selectedUser) filters.userId = selectedUser;
            if (selectedDepartment) filters.department = selectedDepartment as Department;
            if (selectedProject) filters.projectId = selectedProject;
            if (selectedStatus) filters.status = selectedStatus as TimeEntryStatus;

            const result = await getAllTimeEntries(filters);
            setEntries(result.entries);
            setTotalEntries(result.total);
            setTotalPages(result.totalPages);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar datos');
        } finally {
            setLoading(false);
        }
    };

    // Filter entries by search term (client-side)
    const filteredEntries = useMemo(() => {
        if (!searchTerm) return entries;
        const term = searchTerm.toLowerCase();
        return entries.filter(e =>
            e.user.name.toLowerCase().includes(term) ||
            e.user.email.toLowerCase().includes(term) ||
            e.project.code.toLowerCase().includes(term) ||
            e.project.name.toLowerCase().includes(term) ||
            e.notes?.toLowerCase().includes(term)
        );
    }, [entries, searchTerm]);

    // Stats calculation
    const stats = useMemo(() => {
        const total = filteredEntries.length;
        const totalHours = filteredEntries.reduce((sum, e) => sum + e.hours, 0);
        const pending = filteredEntries.filter(e => e.status === 'SUBMITTED').length;
        const approved = filteredEntries.filter(e => e.status === 'APPROVED').length;
        const draft = filteredEntries.filter(e => e.status === 'DRAFT').length;

        return { total, totalHours, pending, approved, draft };
    }, [filteredEntries]);

    // Selection handlers
    const toggleEntrySelection = (id: string) => {
        const newSet = new Set(selectedEntries);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedEntries(newSet);
    };

    const selectAllSubmitted = () => {
        const submittedIds = filteredEntries
            .filter(e => e.status === 'SUBMITTED')
            .map(e => e.id);

        if (selectedEntries.size === submittedIds.length) {
            setSelectedEntries(new Set());
        } else {
            setSelectedEntries(new Set(submittedIds));
        }
    };

    // Action handlers
    const handleApprove = async () => {
        if (selectedEntries.size === 0) return;
        setProcessingAction(true);
        try {
            await approveTimeEntries(Array.from(selectedEntries));
            setSelectedEntries(new Set());
            await loadEntries();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error al aprobar');
        } finally {
            setProcessingAction(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        setProcessingAction(true);
        try {
            // If rejecting a single entry
            if (rejectingEntryId) {
                await rejectTimeEntries([rejectingEntryId], rejectReason);
                setRejectingEntryId(null);
            } else if (selectedEntries.size > 0) {
                // Bulk reject
                await rejectTimeEntries(Array.from(selectedEntries), rejectReason);
                setSelectedEntries(new Set());
            }
            setRejectReason('');
            setShowRejectModal(false);
            await loadEntries();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error al rechazar');
        } finally {
            setProcessingAction(false);
        }
    };

    // Individual approve
    const handleApproveOne = async (entryId: string) => {
        setProcessingEntryId(entryId);
        try {
            await approveTimeEntries([entryId]);
            await loadEntries();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error al aprobar');
        } finally {
            setProcessingEntryId(null);
        }
    };

    // Individual reject - opens modal
    const handleRejectOne = (entryId: string) => {
        setRejectingEntryId(entryId);
        setShowRejectModal(true);
    };

    const toggleSort = (field: 'date' | 'user' | 'project' | 'hours') => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const clearFilters = () => {
        setSelectedUser('');
        setSelectedDepartment('');
        setSelectedProject('');
        setSelectedStatus('');
        setSortBy('date');
        setSortOrder('desc');
        setSearchTerm('');
        setCurrentPage(1);
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="flex flex-col min-h-full bg-neutral-50 dark:bg-neutral-900 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-neutral-900 dark:text-neutral-100 tracking-tight">
                        Control Global de Horas
                    </h1>
                    <p className="text-neutral-600 dark:text-neutral-400 font-medium">
                        Gestión y aprobación de horas de todos los trabajadores
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadEntries}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        <span>Actualizar</span>
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Entradas</p>
                            <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalEntries}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-olive-100 dark:bg-olive-900/30 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-olive-600 dark:text-olive-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Total Horas</p>
                            <p className="text-2xl font-bold text-olive-600 dark:text-olive-400">{stats.totalHours.toFixed(1)}h</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Pendientes</p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Aprobados</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.approved}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white dark:bg-neutral-800 rounded-2xl p-5 border border-neutral-200 dark:border-neutral-700"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center">
                            <Clock className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
                        </div>
                        <div>
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">Borradores</p>
                            <p className="text-2xl font-bold text-neutral-600 dark:text-neutral-400">{stats.draft}</p>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-neutral-500" />
                        <span className="font-medium text-neutral-700 dark:text-neutral-300">Filtros:</span>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-sm w-48"
                        />
                    </div>

                    {/* User filter */}
                    <select
                        value={selectedUser}
                        onChange={(e) => { setSelectedUser(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-sm"
                    >
                        <option value="">Todos los usuarios</option>
                        {users.map(u => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                    </select>

                    {/* Department filter */}
                    <select
                        value={selectedDepartment}
                        onChange={(e) => { setSelectedDepartment(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-sm"
                    >
                        <option value="">Todos los departamentos</option>
                        {Object.entries(DEPARTMENT_CONFIG).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    {/* Project filter */}
                    <select
                        value={selectedProject}
                        onChange={(e) => { setSelectedProject(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-sm"
                    >
                        <option value="">Todos los proyectos</option>
                        {projects.map(p => (
                            <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                        ))}
                    </select>

                    {/* Status filter */}
                    <select
                        value={selectedStatus}
                        onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                        className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 text-sm"
                    >
                        <option value="">Todos los estados</option>
                        {Object.entries(STATUS_CONFIG).map(([key, { label }]) => (
                            <option key={key} value={key}>{label}</option>
                        ))}
                    </select>

                    {/* Clear filters button */}
                    <button
                        onClick={clearFilters}
                        className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
                    >
                        Limpiar filtros
                    </button>
                </div>

                {/* Bulk action buttons */}
                {selectedEntries.size > 0 && (
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                            {selectedEntries.size} seleccionadas
                        </span>
                        <button
                            onClick={handleApprove}
                            disabled={processingAction}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all text-sm font-bold disabled:opacity-50"
                        >
                            <CheckCircle size={16} />
                            Aprobar
                        </button>
                        <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={processingAction}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all text-sm font-bold disabled:opacity-50"
                        >
                            <XCircle size={16} />
                            Rechazar
                        </button>
                    </div>
                )}
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200 dark:border-red-800">
                    {error}
                </div>
            )}

            {/* Entries Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden"
            >
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                    <h2 className="font-bold text-neutral-900 dark:text-neutral-100">
                        Registros de Horas ({totalEntries})
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={selectAllSubmitted}
                            className="text-sm text-olive-600 dark:text-olive-400 hover:underline"
                        >
                            {selectedEntries.size > 0 ? 'Deseleccionar' : 'Seleccionar pendientes'}
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left w-10">
                                    <input
                                        type="checkbox"
                                        onChange={selectAllSubmitted}
                                        checked={selectedEntries.size > 0 && selectedEntries.size === filteredEntries.filter(e => e.status === 'SUBMITTED').length}
                                        className="w-4 h-4 rounded border-neutral-300"
                                    />
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    onClick={() => toggleSort('date')}
                                >
                                    <div className="flex items-center gap-1">
                                        Fecha
                                        {sortBy === 'date' && (sortOrder === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />)}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    onClick={() => toggleSort('user')}
                                >
                                    <div className="flex items-center gap-1">
                                        Trabajador
                                        {sortBy === 'user' && (sortOrder === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />)}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">Departamento</th>
                                <th
                                    className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    onClick={() => toggleSort('project')}
                                >
                                    <div className="flex items-center gap-1">
                                        Proyecto
                                        {sortBy === 'project' && (sortOrder === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />)}
                                    </div>
                                </th>
                                <th
                                    className="px-4 py-3 text-right text-xs font-bold text-neutral-500 uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                    onClick={() => toggleSort('hours')}
                                >
                                    <div className="flex items-center justify-end gap-1">
                                        Horas
                                        {sortBy === 'hours' && (sortOrder === 'desc' ? <SortDesc size={14} /> : <SortAsc size={14} />)}
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-neutral-500 uppercase">Estado</th>
                                <th className="px-4 py-3 text-left text-xs font-bold text-neutral-500 uppercase">Notas</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-neutral-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-6 h-6 border-3 border-olive-600 border-t-transparent rounded-full animate-spin"></div>
                                            <span className="text-neutral-500">Cargando...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredEntries.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-12 text-center text-neutral-500">
                                        <Clock size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-lg font-medium">No hay registros de horas</p>
                                        <p className="text-sm">Intenta ajustar los filtros</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredEntries.map(entry => {
                                    const deptConfig = DEPARTMENT_CONFIG[entry.user.department] || DEPARTMENT_CONFIG.OTHER;
                                    const statusConfig = STATUS_CONFIG[entry.status];
                                    const canSelect = entry.status === 'SUBMITTED';

                                    return (
                                        <tr key={entry.id} className={`hover:bg-neutral-50 dark:hover:bg-neutral-700/30 ${selectedEntries.has(entry.id) ? 'bg-olive-50 dark:bg-olive-900/20' : ''}`}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEntries.has(entry.id)}
                                                    onChange={() => toggleEntrySelection(entry.id)}
                                                    disabled={!canSelect}
                                                    className="w-4 h-4 rounded border-neutral-300 disabled:opacity-30"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300 font-medium">
                                                {formatDate(entry.date)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-sm font-bold">
                                                        {entry.user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-neutral-900 dark:text-neutral-100">{entry.user.name}</p>
                                                        <p className="text-xs text-neutral-500">{entry.user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${deptConfig.bgColor} ${deptConfig.color}`}>
                                                    {deptConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="font-bold text-olive-600 dark:text-olive-400">{entry.project.code}</span>
                                                <span className="text-neutral-500 ml-2">{entry.project.name}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-neutral-900 dark:text-neutral-100">
                                                {entry.hours.toFixed(2)}h
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.color}`}>
                                                    {statusConfig.label}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-neutral-500 text-sm max-w-xs truncate">
                                                {entry.notes || '-'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    {(entry.status === 'SUBMITTED' || entry.status === 'DRAFT') && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApproveOne(entry.id)}
                                                                disabled={processingEntryId === entry.id}
                                                                className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors disabled:opacity-50 border border-green-200 dark:border-green-800"
                                                                title="Aprobar"
                                                            >
                                                                {processingEntryId === entry.id ? (
                                                                    <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                                                                ) : (
                                                                    <CheckCircle size={18} />
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={() => handleRejectOne(entry.id)}
                                                                disabled={processingEntryId === entry.id}
                                                                className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors disabled:opacity-50 border border-red-200 dark:border-red-800"
                                                                title="Rechazar"
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {entry.status === 'APPROVED' && (
                                                        <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                            <CheckCircle size={14} /> Aprobado
                                                        </span>
                                                    )}
                                                    {entry.status === 'REJECTED' && (
                                                        <span className="text-xs text-red-600 font-medium flex items-center gap-1" title={entry.rejectionReason || ''}>
                                                            <XCircle size={14} /> Rechazado
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                        <p className="text-sm text-neutral-500">
                            Página {currentPage} de {totalPages}
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded-lg disabled:opacity-50 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            >
                                Anterior
                            </button>
                            <button
                                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 border border-neutral-300 dark:border-neutral-600 rounded-lg disabled:opacity-50 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            >
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-neutral-800 rounded-2xl p-6 w-full max-w-md"
                    >
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-4">
                            Rechazar {rejectingEntryId ? 'Entrada' : 'Entradas'}
                        </h3>
                        <p className="text-sm text-neutral-500 mb-4">
                            {rejectingEntryId
                                ? 'Se rechazará esta entrada. Por favor, indica el motivo:'
                                : `Se rechazarán ${selectedEntries.size} entradas. Por favor, indica el motivo:`
                            }
                        </p>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Motivo del rechazo..."
                            className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-800 resize-none h-24 text-neutral-900 dark:text-neutral-100"
                        />
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectReason('');
                                    setRejectingEntryId(null);
                                }}
                                className="px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim() || processingAction}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 font-bold"
                            >
                                {processingAction ? 'Rechazando...' : 'Rechazar'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
