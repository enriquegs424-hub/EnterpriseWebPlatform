'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ArrowLeft, Send, Trash2, Plus, Check, Calendar, User, Building, Euro, Download } from 'lucide-react';
import Link from 'next/link';
import { generateInvoicePDF } from '@/lib/pdf-generator';

interface Invoice {
    id: string;
    number: string;
    date: string;
    dueDate: string;
    status: string;
    client: {
        id: string;
        name: string;
        email: string | null;
        companyName: string | null;
        address: string | null;
    };
    project: {
        id: string;
        code: string;
        name: string;
    } | null;
    createdBy: {
        id: string;
        name: string;
    };
    subtotal: number;
    taxAmount: number;
    total: number;
    paidAmount: number;
    balance: number;
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
    payments: Array<{
        id: string;
        amount: number;
        date: string;
        method: string;
        reference: string | null;
        notes: string | null;
        createdAt: string;
    }>;
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

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    useEffect(() => {
        loadInvoice();
    }, [id]);

    async function loadInvoice() {
        setLoading(true);
        try {
            const response = await fetch(`/api/invoices/${id}`);
            if (!response.ok) throw new Error('Failed to load invoice');
            const data = await response.json();
            setInvoice(data);
        } catch (error) {
            console.error('Error loading invoice:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSend() {
        if (!confirm('¿Enviar factura al cliente?')) return;

        try {
            const response = await fetch(`/api/invoices/${id}/send`, {
                method: 'POST',
            });
            if (!response.ok) throw new Error('Failed to send');
            await loadInvoice();
        } catch (error) {
            console.error('Error sending invoice:', error);
            alert('Error al enviar factura');
        }
    }

    async function handleDelete() {
        if (!confirm('¿Eliminar esta factura? Esta acción no se puede deshacer.')) return;

        try {
            const response = await fetch(`/api/invoices/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete');
            router.push('/invoices');
        } catch (error) {
            console.error('Error deleting invoice:', error);
            alert('Error al eliminar factura');
        }
    }

    async function handleDownloadPDF() {
        if (!invoice) return;
        try {
            await generateInvoicePDF(invoice.id);
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error al generar PDF');
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!invoice) {
        return (
            <div className="p-6">
                <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400">Factura no encontrada</p>
                    <Link
                        href="/invoices"
                        className="text-blue-600 dark:text-blue-400 hover:underline mt-4 inline-block"
                    >
                        Volver a facturas
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/invoices"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <FileText className="w-8 h-8 text-blue-600" />
                            {invoice.number}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Creada por {invoice.createdBy.name}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadPDF}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                    </button>

                    {invoice.status === 'DRAFT' && (
                        <>
                            <button
                                onClick={handleSend}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 dark:bg-olive-700 dark:hover:bg-olive-600 transition-colors"
                            >
                                <Send className="w-4 h-4" />
                                Enviar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar
                            </button>
                        </>
                    )}
                    {['SENT', 'PARTIAL', 'OVERDUE'].includes(invoice.status) && (
                        <button
                            onClick={() => setShowPaymentForm(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Registrar Pago
                        </button>
                    )}
                </div>
            </div>

            {/* Status & Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Estado</p>
                    <span
                        className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[invoice.status as keyof typeof STATUS_COLORS]
                            }`}
                    >
                        {STATUS_LABELS[invoice.status as keyof typeof STATUS_LABELS]}
                    </span>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {Number(invoice.total).toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                        })}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pagado</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {Number(invoice.paidAmount).toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                        })}
                    </p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Pendiente</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {Number(invoice.balance).toLocaleString('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                        })}
                    </p>
                </div>
            </div>

            {/* Client & Project Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Building className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Cliente
                        </h3>
                    </div>
                    <div className="space-y-2">
                        <p className="text-gray-900 dark:text-white font-medium">
                            {invoice.client.name}
                        </p>
                        {invoice.client.companyName && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {invoice.client.companyName}
                            </p>
                        )}
                        {invoice.client.email && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {invoice.client.email}
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Fechas
                        </h3>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">Fecha:</span>
                            <span className="text-sm text-gray-900 dark:text-white">
                                {new Date(invoice.date).toLocaleDateString('es-ES')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                Vencimiento:
                            </span>
                            <span className="text-sm text-gray-900 dark:text-white">
                                {new Date(invoice.dueDate).toLocaleDateString('es-ES')}
                            </span>
                        </div>
                        {invoice.project && (
                            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    Proyecto:
                                </span>
                                <span className="text-sm text-gray-900 dark:text-white">
                                    {invoice.project.code}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Detalles de Factura
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Descripción
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Cantidad
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Precio Unit.
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    IVA
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Total
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {invoice.items.map((item) => (
                                <tr key={item.id}>
                                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                        {item.description}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                                        {item.quantity}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                                        {Number(item.unitPrice).toLocaleString('es-ES', {
                                            style: 'currency',
                                            currency: 'EUR',
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                                        {item.taxRate}%
                                    </td>
                                    <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                                        {Number(item.total).toLocaleString('es-ES', {
                                            style: 'currency',
                                            currency: 'EUR',
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Subtotal:
                                </td>
                                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                                    {Number(invoice.subtotal).toLocaleString('es-ES', {
                                        style: 'currency',
                                        currency: 'EUR',
                                    })}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="px-6 py-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                                    IVA:
                                </td>
                                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                                    {Number(invoice.taxAmount).toLocaleString('es-ES', {
                                        style: 'currency',
                                        currency: 'EUR',
                                    })}
                                </td>
                            </tr>
                            <tr>
                                <td colSpan={4} className="px-6 py-3 text-right text-base font-bold text-gray-900 dark:text-white">
                                    TOTAL:
                                </td>
                                <td className="px-6 py-3 text-right text-base font-bold text-gray-900 dark:text-white">
                                    {Number(invoice.total).toLocaleString('es-ES', {
                                        style: 'currency',
                                        currency: 'EUR',
                                    })}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Payments */}
            {invoice.payments.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Historial de Pagos
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Fecha
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Método
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Referencia
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Importe
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {invoice.payments.map((payment) => (
                                    <tr key={payment.id}>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {new Date(payment.date).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                            {payment.method}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {payment.reference || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-green-600 dark:text-green-400">
                                            {payment.amount.toLocaleString('es-ES', {
                                                style: 'currency',
                                                currency: 'EUR',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Notes */}
            {(invoice.notes || invoice.terms) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {invoice.notes && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Observaciones
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                {invoice.notes}
                            </p>
                        </div>
                    )}
                    {invoice.terms && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                Términos y Condiciones
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                                {invoice.terms}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
