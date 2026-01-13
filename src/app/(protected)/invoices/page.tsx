'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Eye, Download, Calendar, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DataTable, { type Column } from '@/components/DataTable';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { generateInvoicePDF } from '@/lib/pdf-generator';

interface Invoice {
    id: string;
    number: string;
    date: Date;
    dueDate: Date;
    status: string;
    client: {
        id: string;
        name: string;
        email: string | null;
        address: string | null;
        companyName: string | null;
    };
    project?: {
        id: string;
        code: string;
        name: string;
    };
    total: number;
    balance: number;
    paidAmount: number;
    subtotal: number;
    taxAmount: number;
    items: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        subtotal: number;
        taxAmount: number;
        total: number;
    }>;
    notes?: string;
    terms?: string;
    _count: {
        items: number;
        payments: number;
    };
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    PARTIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    PAID: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    OVERDUE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    CANCELLED: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
    DRAFT: 'Borrador',
    SENT: 'Enviada',
    PARTIAL: 'Parcial',
    PAID: 'Pagada',
    OVERDUE: 'Vencida',
    CANCELLED: 'Cancelada',
};

const MONTHS = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

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
    const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());

    const currentDate = new Date();
    const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth());
    const [viewMode, setViewMode] = useState<'monthly' | 'annual'>('monthly');

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

    useEffect(() => {
        filterInvoicesByDate();
    }, [invoices, selectedYear, selectedMonth, viewMode]);

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

    function filterInvoicesByDate() {
        if (viewMode === 'annual') {
            const filtered = invoices.filter(inv => {
                const invDate = new Date(inv.date);
                return invDate.getFullYear() === selectedYear;
            });
            setFilteredInvoices(filtered);
        } else {
            const filtered = invoices.filter(inv => {
                const invDate = new Date(inv.date);
                return invDate.getFullYear() === selectedYear &&
                    invDate.getMonth() === selectedMonth;
            });
            setFilteredInvoices(filtered);
        }
    }

    function handlePreviousMonth() {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    }

    function handleNextMonth() {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    }

    function toggleInvoiceSelection(id: string) {
        const newSelected = new Set(selectedInvoices);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedInvoices(newSelected);
    }

    function downloadInvoicePDF(invoiceId: string) {
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (!invoice) return;

        const companyInfo = {
            name: 'MEP Projects',
            taxId: 'B-12345678',
            address: 'Calle Example, 123, 28001 Madrid',
            email: 'info@mepprojects.com',
            phone: '+34 900 000 000'
        };

        generateInvoicePDF({
            number: invoice.number,
            date: new Date(invoice.date),
            dueDate: new Date(invoice.dueDate),
            client: {
                name: invoice.client.name,
                email: invoice.client.email || '',
                address: invoice.client.address || undefined
            },
            company: companyInfo,
            items: invoice.items.map(item => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                taxRate: Number(item.taxRate),
                subtotal: Number(item.subtotal),
                taxAmount: Number(item.taxAmount),
                total: Number(item.total)
            })),
            subtotal: Number(invoice.subtotal),
            taxTotal: Number(invoice.taxAmount),
            total: Number(invoice.total),
            notes: invoice.notes,
            terms: invoice.terms
        });
    }

    async function downloadSelectedInvoices() {
        if (selectedInvoices.size === 0) {
            alert('Selecciona al menos una factura');
            return;
        }

        for (const invoiceId of selectedInvoices) {
            downloadInvoicePDF(invoiceId);
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        setSelectedInvoices(new Set());
    }

    const columns: Column<Invoice>[] = [
        {
            key: 'number',
            label: 'Número',
            sortable: true,
            render: (invoice) => (
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={selectedInvoices.has(invoice.id)}
                        onChange={() => toggleInvoiceSelection(invoice.id)}
                        className="rounded border-gray-300 dark:border-gray-600 mr-2"
                    />
                    <FileText className="w-4 h-4 text-gray-400" />
                    <Link href={`/invoices/${invoice.id}`} className="font-medium text-olive-600 hover:text-olive-700 dark:text-olive-400 hover:underline">
                        {invoice.number}
                    </Link>
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
                    <div className="text-xs text-gray-500 dark:text-gray-400">
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
                        {Number(invoice.total).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{invoice._count.items} líneas</div>
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Estado',
            sortable: true,
            render: (invoice) => (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[invoice.status] || ''}`}>
                    {STATUS_LABELS[invoice.status] || invoice.status}
                </span>
            ),
        },
        {
            key: 'actions',
            label: 'Acciones',
            sortable: false,
            render: (invoice) => (
                <div className="flex gap-2">
                    <button
                        onClick={() => downloadInvoicePDF(invoice.id)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title="Descargar PDF"
                    >
                        <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </button>
                    <Link
                        href={`/invoices/${invoice.id}`}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title="Ver detalle"
                    >
                        <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </Link>
                </div>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Facturas</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">Gestión de facturas y pagos</p>
                </div>
                <div className="flex gap-3">
                    {selectedInvoices.size > 0 && (
                        <button
                            onClick={downloadSelectedInvoices}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <FileDown className="w-4 h-4" />
                            Descargar ({selectedInvoices.size})
                        </button>
                    )}
                    <Link
                        href="/invoices/new"
                        className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors dark:bg-olive-500 dark:hover:bg-olive-600"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Factura
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Facturado</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.totalAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stats.totalCount} facturas</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-green-200 dark:border-green-700">
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 mb-1">Cobrado</p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-300">
                        {stats.paidAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">{stats.paidCount} pagadas</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-yellow-200 dark:border-yellow-700">
                    <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">Pendiente</p>
                    <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-300">
                        {stats.pendingAmount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{stats.pendingCount} facturas</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-red-200 dark:border-red-700">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-1">Vencidas</p>
                    <p className="text-2xl font-bold text-red-900 dark:text-red-300">{stats.overdueCount}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">facturas</p>
                </div>
            </div>

            {/* Date Filter */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <Calendar className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode('monthly')}
                                className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'monthly'
                                    ? 'bg-olive-600 text-white dark:bg-olive-500'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                Mensual
                            </button>
                            <button
                                onClick={() => setViewMode('annual')}
                                className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'annual'
                                    ? 'bg-olive-600 text-white dark:bg-olive-500'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                    }`}
                            >
                                Anual
                            </button>
                        </div>
                    </div>

                    {viewMode === 'monthly' ? (
                        <div className="flex items-center gap-3">
                            <button onClick={handlePreviousMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-lg font-semibold min-w-[200px] text-center text-gray-900 dark:text-white">
                                {MONTHS[selectedMonth]} {selectedYear}
                            </span>
                            <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <button onClick={() => setSelectedYear(selectedYear - 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <span className="text-lg font-semibold min-w-[100px] text-center text-gray-900 dark:text-white">
                                {selectedYear}
                            </span>
                            <button onClick={() => setSelectedYear(selectedYear + 1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600"></div>
                        <p className="ml-4 text-gray-600 dark:text-gray-400">Cargando facturas...</p>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No hay facturas para el período seleccionado</p>
                    </div>
                ) : (
                    <DataTable
                        data={filteredInvoices}
                        columns={columns}
                        keyExtractor={(invoice) => invoice.id}
                    />
                )}
            </div>
        </div>
    );
}
