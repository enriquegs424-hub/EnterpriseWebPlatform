'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DataTable, { type Column } from '@/components/DataTable';

interface Quote {
    id: string;
    number: string;
    validUntil: Date;
    status: string;
    client: {
        id: string;
        name: string;
    };
    lead?: {
        id: string;
        title: string;
    };
    total: number;
    _count: {
        items: number;
    };
    createdAt: Date;
}

const STATUS_COLORS = {
    DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
    SENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    ACCEPTED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    EXPIRED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    CONVERTED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
};

const STATUS_LABELS = {
    DRAFT: 'Borrador',
    SENT: 'Enviado',
    ACCEPTED: 'Aceptado',
    REJECTED: 'Rechazado',
    EXPIRED: 'Expirado',
    CONVERTED: 'Convertido',
};

const STATUS_ICONS = {
    DRAFT: FileText,
    SENT: Clock,
    ACCEPTED: CheckCircle,
    REJECTED: XCircle,
    EXPIRED: Clock,
    CONVERTED: CheckCircle,
};

export default function QuotesPage() {
    const router = useRouter();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalAmount: 0,
        totalCount: 0,
        draftCount: 0,
        sentCount: 0,
        acceptedCount: 0,
        convertedCount: 0,
    });

    useEffect(() => {
        loadQuotes();
        loadStats();
    }, []);

    async function loadQuotes() {
        setLoading(true);
        try {
            const { getQuotes } = await import('./actions');
            const data = await getQuotes();
            setQuotes(data as any);
        } catch (error) {
            console.error('Error loading quotes:', error);
        } finally {
            setLoading(false);
        }
    }

    async function loadStats() {
        try {
            const { getQuoteStats } = await import('./actions');
            const data = await getQuoteStats();
            setStats(data as any);
        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    // Define columns for DataTable
    const columns: Column<Quote>[] = [
        {
            key: 'number',
            label: 'Número',
            sortable: true,
            render: (quote) => (
                <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <Link
                        href={`/quotes/${quote.id}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        {quote.number}
                    </Link>
                </div>
            ),
        },
        {
            key: 'client',
            label: 'Cliente',
            sortable: true,
            render: (quote) => (
                <div>
                    <div className="font-medium">{quote.client.name}</div>
                    {quote.lead && (
                        <div className="text-sm text-gray-500">
                            Lead: {quote.lead.title}
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'total',
            label: 'Total',
            sortable: true,
            render: (quote) => (
                <div className="text-right font-medium">
                    €{Number(quote.total).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            ),
        },
        {
            key: 'validUntil',
            label: 'Válido hasta',
            sortable: true,
            render: (quote) => (
                <div className="text-sm">
                    {new Date(quote.validUntil).toLocaleDateString('es-ES')}
                </div>
            ),
        },
        {
            key: 'status',
            label: 'Estado',
            sortable: true,
            render: (quote) => {
                const Icon = STATUS_ICONS[quote.status as keyof typeof STATUS_ICONS];
                return (
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[quote.status as keyof typeof STATUS_COLORS]}`}>
                        {Icon && <Icon className="h-3 w-3" />}
                        {STATUS_LABELS[quote.status as keyof typeof STATUS_LABELS]}
                    </span>
                );
            },
        },
        {
            key: 'items',
            label: 'Items',
            render: (quote) => (
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    {quote._count.items}
                </div>
            ),
        },
        {
            key: 'actions',
            label: 'Acciones',
            render: (quote) => (
                <div className="flex gap-2 justify-end">
                    <Link
                        href={`/quotes/${quote.id}`}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        <Eye className="h-4 w-4" />
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Presupuestos
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Gestiona los presupuestos de tus clientes
                    </p>
                </div>
                <Link
                    href="/quotes/new"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Nuevo Presupuesto
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total Presupuestado
                    </div>
                    <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                        €{Number(stats.totalAmount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        {stats.totalCount} presupuestos
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Borradores
                    </div>
                    <div className="mt-2 text-2xl font-bold text-gray-600 dark:text-gray-400">
                        {stats.draftCount}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        Pendientes de enviar
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Enviados
                    </div>
                    <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {stats.sentCount}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        Esperando respuesta
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Aceptados
                    </div>
                    <div className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
                        {stats.acceptedCount}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                        Listos para convertir
                    </div>
                </div>
            </div>

            {/* DataTable */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <DataTable
                    data={quotes}
                    columns={columns}
                    loading={loading}
                    emptyMessage="No hay presupuestos. Crea tu primer presupuesto para empezar."
                    keyExtractor={(quote) => quote.id}
                />
            </div>
        </div>
    );
}
