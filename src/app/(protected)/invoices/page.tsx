'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FileText, Plus, Eye, Send, Check, X, Euro } from 'lucide-react';
import Link from 'link';

interface Invoice {
    id: string;
    number: string;
    date: Date;
    dueDate: Date;
    status: string;
    client: {
        id: string;
        name: string;
    };
    project?: {
        id: string;
        code: string;
        name: string;
    };
    total: number;
    balance: number;
    paidAmount: number;
    _count: {
        items: number;
        payments: number;
    };
}

const STATUS_COLORS = {
    DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    PARTIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_LABELS = {
    DRAFT: 'Borrador',
    SENT: 'Enviada',
    PARTIAL: 'Parcial',
    PAID: 'Pagada',
    OVERDUE: 'Vencida',
    CANCELLED: 'Cancelada',
};

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('ALL');
    const [stats, setStats] = useState({
        totalAmount: 0,
        totalCount: 0,
        paidAmount: 0,
        paidCount: 0,
        pendingAmount: 0,
        pendingCount: 0,
        overdueCount: 0,
    });

    useEffect(() => {
        loadInvoices();
        loadStats();
    }, []);

    async function loadInvoices() {
        setLoading(true);
        try {
            const response = await fetch('/api/invoices');
            const data = await response.json();
            setInvoices(data);
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadStats() {
        try {
            const response = await fetch('/api/invoices/stats');
            const data = await response.json();
            setStats(data);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    const filteredInvoices = invoices.filter((inv) => {
        if (filter === 'ALL') return true;
        return inv.status === filter;
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Facturas
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Gestión de facturas y pagos
                    </p>
                </div>
                <Link
                    href="/invoices/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Factura
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Total Facturado
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {stats.totalAmount.toLocaleString('es-ES', {
                                    style: 'currency',
                                    currency: 'EUR',
                                })}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {stats.totalCount} facturas
                            </p>
                        </div>
                        <FileText className="w-10 h-10 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Cobrado
                            </p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                {stats.paidAmount.toLocaleString('es-ES', {
                                    style: 'currency',
                                    currency: 'EUR',
                                })}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {stats.paidCount} pagadas
                            </p>
                        </div>
                        <Check className="w-10 h-10 text-green-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Pendiente
                            </p>
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                                {stats.pendingAmount.toLocaleString('es-ES', {
                                    style: 'currency',
                                    currency: 'EUR',
                                })}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                {stats.pendingCount} facturas
                            </p>
                        </div>
                        <Euro className="w-10 h-10 text-yellow-500" />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Vencidas
                            </p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                                {stats.overdueCount}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                facturas
                            </p>
                        </div>
                        <X className="w-10 h-10 text-red-500" />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {['ALL', 'DRAFT', 'SENT', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED'].map(
                    (status) => (
                        <button
                            key={status}
                            onClick={() => setFilter(status)}
                            className={`px-4 py-2 rounded-lg transition-colors ${filter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            {status === 'ALL' ? 'Todas' : STATUS_LABELS[status as keyof typeof STATUS_LABELS]}
                        </button>
                    )
                )}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Número
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Cliente
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Proyecto
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Pendiente
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredInvoices.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                                    >
                                        No hay facturas
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((invoice) => (
                                    <tr
                                        key={invoice.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <FileText className="w-5 h-5 text-gray-400 mr-2" />
                                                <span className="font-medium text-gray-900 dark:text-white">
                                                    {invoice.number}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {invoice.client.name}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {invoice.project ? (
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {invoice.project.code}
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {new Date(invoice.date).toLocaleDateString('es-ES')}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Vence:{' '}
                                                {new Date(invoice.dueDate).toLocaleDateString('es-ES')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {invoice.total.toLocaleString('es-ES', {
                                                    style: 'currency',
                                                    currency: 'EUR',
                                                })}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {invoice._count.items} líneas
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {invoice.balance.toLocaleString('es-ES', {
                                                    style: 'currency',
                                                    currency: 'EUR',
                                                })}
                                            </div>
                                            {invoice._count.payments > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    {invoice._count.payments} pago(s)
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[
                                                    invoice.status as keyof typeof STATUS_COLORS
                                                    ]
                                                    }`}
                                            >
                                                {STATUS_LABELS[invoice.status as keyof typeof STATUS_LABELS]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Link
                                                href={`/invoices/${invoice.id}`}
                                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Ver
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
