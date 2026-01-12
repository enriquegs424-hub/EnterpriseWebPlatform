'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileCheck, ArrowLeft, Send, Trash2, CheckCircle, XCircle, RefreshCw, Calendar, User, Building } from 'lucide-react';
import Link from 'next/link';

interface Quote {
    id: string;
    number: string;
    validUntil: string;
    status: string;
    client: {
        id: string;
        name: string;
        email: string | null;
    };
    lead: {
        id: string;
        title: string;
    } | null;
    createdBy: {
        id: string;
        name: string;
    };
    subtotal: number;
    taxAmount: number;
    total: number;
    notes: string | null;
    terms: string | null;
    items: Array<{
        id: string;
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        subtotal: number;
        taxAmount: number;
        total: number;
        order: number;
    }>;
    createdAt: string;
    sentAt: string | null;
    acceptedAt: string | null;
    rejectedAt: string | null;
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

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [quote, setQuote] = useState<Quote | null>(null);
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState(false);

    useEffect(() => {
        loadQuote();
    }, [params.id]);

    async function loadQuote() {
        setLoading(true);
        try {
            const { getQuote } = await import('../actions');
            const data = await getQuote(params.id);
            setQuote(data as any);
        } catch (error) {
            console.error('Error loading quote:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleStatusChange(newStatus: string) {
        if (!confirm(`¿Cambiar estado a ${STATUS_LABELS[newStatus as keyof typeof STATUS_LABELS]}?`)) return;

        try {
            const { updateQuoteStatus } = await import('../actions');
            await updateQuoteStatus(params.id, newStatus as any);
            await loadQuote();
        } catch (error: any) {
            console.error('Error updating status:', error);
            alert(error.message || 'Error al actualizar estado');
        }
    }

    async function handleConvertToInvoice() {
        if (!confirm('¿Convertir este presupuesto a factura?')) return;

        setConverting(true);
        try {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 30);

            const { convertQuoteToInvoice } = await import('../actions');
            const invoice = await convertQuoteToInvoice(params.id, dueDate);

            router.push(`/invoices/${invoice.id}`);
        } catch (error: any) {
            console.error('Error converting:', error);
            alert(error.message || 'Error al convertir a factura');
        } finally {
            setConverting(false);
        }
    }

    async function handleDelete() {
        if (!confirm('¿Eliminar este presupuesto? Esta acción no se puede deshacer.')) return;

        try {
            const { deleteQuote } = await import('../actions');
            await deleteQuote(params.id);
            router.push('/quotes');
        } catch (error: any) {
            console.error('Error deleting:', error);
            alert(error.message || 'Error al eliminar presupuesto');
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">Presupuesto no encontrado</p>
                <Link href="/quotes" className="text-blue-600 hover:underline mt-4 inline-block">
                    Volver a presupuestos
                </Link>
            </div>
        );
    }

    const isExpired = new Date(quote.validUntil) < new Date() && quote.status === 'SENT';
    const canConvert = quote.status === 'ACCEPTED';
    const canEdit = quote.status === 'DRAFT';
    const canDelete = quote.status === 'DRAFT';

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link
                        href="/quotes"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {quote.number}
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Creado el {new Date(quote.createdAt).toLocaleDateString('es-ES')}
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <span className={`px-4 py-2 rounded-full text-sm font-medium ${STATUS_COLORS[quote.status as keyof typeof STATUS_COLORS]}`}>
                    {STATUS_LABELS[quote.status as keyof typeof STATUS_LABELS]}
                </span>
            </div>

            {/* Expired Warning */}
            {isExpired && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                    <p className="text-orange-800 dark:text-orange-300 font-medium">
                        ⚠️ Este presupuesto expiró el {new Date(quote.validUntil).toLocaleDateString('es-ES')}
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-3">
                    {quote.status === 'DRAFT' && (
                        <button
                            onClick={() => handleStatusChange('SENT')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Send className="h-4 w-4" />
                            Enviar al Cliente
                        </button>
                    )}

                    {quote.status === 'SENT' && (
                        <>
                            <button
                                onClick={() => handleStatusChange('ACCEPTED')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <CheckCircle className="h-4 w-4" />
                                Marcar Aceptado
                            </button>
                            <button
                                onClick={() => handleStatusChange('REJECTED')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                <XCircle className="h-4 w-4" />
                                Marcar Rechazado
                            </button>
                        </>
                    )}

                    {canConvert && (
                        <button
                            onClick={handleConvertToInvoice}
                            disabled={converting}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                        >
                            <RefreshCw className={`h-4 w-4 ${converting ? 'animate-spin' : ''}`} />
                            {converting ? 'Convirtiendo...' : 'Convertir a Factura'}
                        </button>
                    )}

                    {canDelete && (
                        <button
                            onClick={handleDelete}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                        </button>
                    )}
                </div>
            </div>

            {/* Client Info */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Información del Cliente
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                        <Building className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Cliente</p>
                            <p className="font-medium text-gray-900 dark:text-white">{quote.client.name}</p>
                            {quote.client.email && (
                                <p className="text-sm text-gray-600 dark:text-gray-400">{quote.client.email}</p>
                            )}
                        </div>
                    </div>

                    {quote.lead && (
                        <div className="flex items-start gap-3">
                            <FileCheck className="h-5 w-5 text-gray-400 mt-0.5" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Lead Asociado</p>
                                <Link
                                    href={`/crm/${quote.lead.id}`}
                                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    {quote.lead.title}
                                </Link>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Válido hasta</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {new Date(quote.validUntil).toLocaleDateString('es-ES')}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <User className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Creado por</p>
                            <p className="font-medium text-gray-900 dark:text-white">{quote.createdBy.name}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                    Items
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Descripción
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Cantidad
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Precio Unit.
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    IVA
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {quote.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                        {item.description}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                                        {Number(item.quantity).toLocaleString('es-ES')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                                        €{Number(item.unitPrice).toFixed(2)}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                                        {Number(item.taxRate).toFixed(0)}%
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                        €{Number(item.total).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals */}
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-end">
                        <div className="w-full md:w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                <span className="font-medium">€{Number(quote.subtotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">IVA:</span>
                                <span className="font-medium">€{Number(quote.taxAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                                <span>Total:</span>
                                <span className="text-blue-600 dark:text-blue-400">€{Number(quote.total).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notes & Terms */}
            {(quote.notes || quote.terms) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {quote.notes && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Notas</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{quote.notes}</p>
                        </div>
                    )}
                    {quote.terms && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Términos y Condiciones</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{quote.terms}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
