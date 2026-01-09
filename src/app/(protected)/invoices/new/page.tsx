"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Send } from "lucide-react";
import { createInvoice } from "../actions";

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
}

export default function NewInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    // Form state
    const [clientId, setClientId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [notes, setNotes] = useState("");
    const [terms, setTerms] = useState("Pago a 30 días desde la fecha de factura.");

    // Line items
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, taxRate: 21 },
    ]);

    // Load clients on mount
    useState(() => {
        fetch("/api/clients")
            .then((r) => r.json())
            .then(setClients);
    });

    // Load projects when client changes
    const handleClientChange = async (newClientId: string) => {
        setClientId(newClientId);
        setProjectId("");

        if (newClientId) {
            const res = await fetch(`/api/projects?clientId=${newClientId}`);
            const data = await res.json();
            setProjects(data);
        } else {
            setProjects([]);
        }
    };

    // Item management
    const addItem = () => {
        setItems([
            ...items,
            { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, taxRate: 21 },
        ]);
    };

    const removeItem = (id: string) => {
        if (items.length === 1) return; // Mínimo 1 item
        setItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    // Calculations
    const calculateSubtotal = (item: InvoiceItem) => {
        return item.quantity * item.unitPrice;
    };

    const calculateTax = (item: InvoiceItem) => {
        const subtotal = calculateSubtotal(item);
        return subtotal * (item.taxRate / 100);
    };

    const calculateItemTotal = (item: InvoiceItem) => {
        return calculateSubtotal(item) + calculateTax(item);
    };

    const invoiceSubtotal = items.reduce((sum, item) => sum + calculateSubtotal(item), 0);
    const invoiceTax = items.reduce((sum, item) => sum + calculateTax(item), 0);
    const invoiceTotal = invoiceSubtotal + invoiceTax;

    // Form validation
    const isValid = () => {
        return (
            clientId &&
            dueDate &&
            items.length > 0 &&
            items.every((item) => item.description && item.quantity > 0 && item.unitPrice >= 0)
        );
    };

    // Submit handlers
    const handleSave = async (sendImmediately: boolean) => {
        if (!isValid()) {
            alert("Por favor completa todos los campos requeridos");
            return;
        }

        setLoading(true);
        try {
            const invoice = await createInvoice({
                clientId,
                projectId: projectId || undefined,
                dueDate: new Date(dueDate),
                notes,
                terms,
                items: items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    taxRate: item.taxRate,
                })),
            });

            if (sendImmediately) {
                await fetch(`/api/invoices/${invoice.id}/send`, { method: "POST" });
            }

            router.push(`/invoices/${invoice.id}`);
        } catch (error: any) {
            alert(error.message || "Error al crear la factura");
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/invoices"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Nueva Factura
                </h1>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
                {/* Client & Project */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cliente *
                        </label>
                        <select
                            value={clientId}
                            onChange={(e) => handleClientChange(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                            required
                        >
                            <option value="">Seleccionar cliente...</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Proyecto (opcional)
                        </label>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                            disabled={!clientId}
                        >
                            <option value="">Sin proyecto</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Due Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Fecha de Vencimiento *
                    </label>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                        required
                    />
                </div>

                {/* Line Items */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Conceptos de Factura
                        </h3>
                        <button
                            onClick={addItem}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Añadir Línea
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                                    <th className="text-left p-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Descripción
                                    </th>
                                    <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
                                        Cantidad
                                    </th>
                                    <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
                                        Precio Unit.
                                    </th>
                                    <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300 w-24">
                                        IVA (%)
                                    </th>
                                    <th className="text-right p-3 text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
                                        Total
                                    </th>
                                    <th className="w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-gray-200 dark:border-gray-700"
                                    >
                                        <td className="p-3">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) =>
                                                    updateItem(item.id, "description", e.target.value)
                                                }
                                                placeholder="Descripción del servicio/producto..."
                                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                                required
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)
                                                }
                                                min="0.01"
                                                step="0.01"
                                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm text-right text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                                required
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={(e) =>
                                                    updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)
                                                }
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm text-right text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                                required
                                            />
                                        </td>
                                        <td className="p-3">
                                            <input
                                                type="number"
                                                value={item.taxRate}
                                                onChange={(e) =>
                                                    updateItem(item.id, "taxRate", parseFloat(e.target.value) || 0)
                                                }
                                                min="0"
                                                max="100"
                                                step="0.1"
                                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-sm text-right text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                            />
                                        </td>
                                        <td className="p-3 text-right text-sm font-medium text-gray-900 dark:text-white">
                                            {calculateItemTotal(item).toFixed(2)} €
                                        </td>
                                        <td className="p-3 text-center">
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                disabled={items.length === 1}
                                                className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                title="Eliminar línea"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="mt-4 flex justify-end">
                        <div className="w-full md:w-80 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {invoiceSubtotal.toFixed(2)} €
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">IVA:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {invoiceTax.toFixed(2)} €
                                </span>
                            </div>
                            <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                                <span className="text-gray-900 dark:text-white">TOTAL:</span>
                                <span className="text-olive-600 dark:text-olive-400">
                                    {invoiceTotal.toFixed(2)} €
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes & Terms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notas
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            placeholder="Notas adicionales..."
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Términos y Condiciones
                        </label>
                        <textarea
                            value={terms}
                            onChange={(e) => setTerms(e.target.value)}
                            rows={4}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                        href="/invoices"
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancelar
                    </Link>
                    <button
                        onClick={() => handleSave(false)}
                        disabled={loading || !isValid()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Guardar Borrador
                    </button>
                    <button
                        onClick={() => handleSave(true)}
                        disabled={loading || !isValid()}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-4 h-4" />
                        Guardar y Enviar
                    </button>
                </div>
            </div>
        </div>
    );
}
