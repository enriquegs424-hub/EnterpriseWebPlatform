'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DataTable, { type Column } from '@/components/DataTable';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

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
    return (
        <ProtectedRoute allowedRoles={['ADMIN', 'MANAGER']}>
            <InvoicesContent />
        </ProtectedRoute>
    );
}

function InvoicesContent() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
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

    // Define columns for DataTable
    const columns: Column<Invoice>[] = [
        {
            key: 'number',
            label: 'Número',
            sortable: true,
            render: (invoice) => (
                <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{invoice.number}</span>
                </div>
            ),
        },
        {
            key: 'client.name',
            label: 'Cliente',
            sortable: true,
            render: (invoice) => invoice.client.name,
        },
        {
            key: 'project',
            label: 'Proyecto',
            sortable: false,
            render: (invoice) => invoice.project ? invoice.project.code : <span className="text-gray-400">-</span>,
        },
        {
            key: 'date',
            label: 'Fecha',
            sortable: true,
            render: (invoice) => (
                <div>
                    <div className="text-sm">{new Date(invoice.date).toLocaleDateString('es-ES')}</div>
                    <div className="text-xs text-gray-500">
                        Vence: {new Date(invoice.dueDate).toLocaleDateString('es-ES')}
                    </div>
                </div>
            ),
        },
        {
            key: 'total',
            label: 'Total',
            sortable: true,
            className: 'text-right',
            render: (invoice) => (
                <div className="text-right">
                    <div className="font-medium">
                        {invoice.total.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <div className="text-xs text-gray-500">{invoice._count.items} líneas</div>
                </div>
            ),
        },
        {
            key: 'balance',
            label: 'Pendiente',
            sortable: true,
            className: 'text-right',
            render: (invoice) => (
                <div className="text-right">
                    <div className="font-medium">
                        {invoice.balance.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                    {invoice._count.payments > 0 && (
                        <div className="text-xs text-gray-500">{invoice._count.payments} pago(s)</div>
                    )}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Estado',
            sortable: true,
            render: (invoice) => (
                <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[invoice.status as keyof typeof STATUS_COLORS]
                        }`}
                >
                    {STATUS_LABELS[invoice.status as keyof typeof STATUS_LABELS]}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Acciones',
            sortable: false,
            render: (invoice) => (
                <Link
                    href={`/invoices/${invoice.id}`}
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Eye className="w-4 h-4" />
                    Ver
                </Link>
            ),
        },
    ];

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
                    className="inline-flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
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
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.totalCount} facturas
                            </p>
                        </div>
                        <FileText className="w-10 h-10 text-olive-500" />
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
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.paidCount} pagadas
                            </p>
                        </div>
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
                            <p className="text-xs text-gray-500 mt-1">
                                {stats.pendingCount} facturas
                            </p>
                        </div>
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
                            <p className="text-xs text-gray-500 mt-1">
                                facturas
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* DataTable with invoices */}
            <DataTable
                data={invoices}
                columns={columns}
                keyExtractor={(invoice) => invoice.id}
                loading={loading}
                emptyMessage="No hay facturas registradas"
                searchPlaceholder="Buscar por número, cliente o proyecto..."
                searchable={true}
                onRowClick={(invoice) => router.push(`/invoices/${invoice.id}`)}
            />
        </div>
    );
}
