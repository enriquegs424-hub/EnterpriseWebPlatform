'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Client {
    id: string;
    name: string;
}

interface QuoteItem {
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
}

export default function NewQuotePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [formData, setFormData] = useState({
        clientId: '',
        validUntil: '',
        notes: '',
        terms: '',
    });
    const [items, setItems] = useState<QuoteItem[]>([
        { description: '', quantity: 1, unitPrice: 0, taxRate: 21 }
    ]);

    useEffect(() => {
        loadClients();
        // Set default validUntil to 30 days from now
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 30);
        setFormData(prev => ({
            ...prev,
            validUntil: defaultDate.toISOString().split('T')[0]
        }));
    }, []);

    async function loadClients() {
        try {
            const response = await fetch('/api/clients');
            const data = await response.json();
            setClients(data);
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    }

    function addItem() {
        setItems([...items, { description: '', quantity: 1, unitPrice: 0, taxRate: 21 }]);
    }

    function removeItem(index: number) {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    }

    function updateItem(index: number, field: keyof QuoteItem, value: string | number) {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };
        setItems(newItems);
    }

    function calculateItemTotal(item: QuoteItem) {
        const subtotal = item.quantity * item.unitPrice;
        const taxAmount = subtotal * (item.taxRate / 100);
        return subtotal + taxAmount;
    }

    function calculateTotals() {
        const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
        const taxAmount = items.reduce((sum, item) => {
            const itemSubtotal = item.quantity * item.unitPrice;
            return sum + (itemSubtotal * (item.taxRate / 100));
        }, 0);
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        try {
            const { createQuote } = await import('../actions');
            const result = await createQuote({
                ...formData,
                validUntil: new Date(formData.validUntil),
                items: items.map(item => ({
                    description: item.description,
                    quantity: Number(item.quantity),
                    unitPrice: Number(item.unitPrice),
                    taxRate: Number(item.taxRate),
                })),
            });

            router.push(`/quotes/${result.id}`);
        } catch (error: any) {
            console.error('Error creating quote:', error);
            alert(error.message || 'Error al crear el presupuesto');
        } finally {
            setLoading(false);
        }
    }

    const totals = calculateTotals();

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/quotes"
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Nuevo Presupuesto
                    </h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Crea un nuevo presupuesto para tu cliente
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Información Básica
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Cliente *
                            </label>
                            <select
                                required
                                value={formData.clientId}
                                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                <option value="">Seleccionar cliente</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Válido hasta *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.validUntil}
                                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Items
                        </h2>
                        <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4" />
                            Añadir Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-start p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <div className="col-span-12 md:col-span-4">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        Descripción
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={item.description}
                                        onChange={(e) => updateItem(index, 'description', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                        placeholder="Servicio o producto"
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        Cantidad
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0.01"
                                        step="0.01"
                                        value={item.quantity}
                                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        Precio Unitario
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={item.unitPrice}
                                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <div className="col-span-4 md:col-span-2">
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        IVA (%)
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={item.taxRate}
                                        onChange={(e) => updateItem(index, 'taxRate', parseFloat(e.target.value) || 0)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                                    />
                                </div>
                                <div className="col-span-10 md:col-span-1 flex items-end">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                        €{calculateItemTotal(item).toFixed(2)}
                                    </div>
                                </div>
                                <div className="col-span-2 md:col-span-1 flex items-end justify-end">
                                    <button
                                        type="button"
                                        onClick={() => removeItem(index)}
                                        disabled={items.length === 1}
                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <div className="flex justify-end">
                            <div className="w-full md:w-64 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                                    <span className="font-medium">€{totals.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">IVA:</span>
                                    <span className="font-medium">€{totals.taxAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                                    <span>Total:</span>
                                    <span>€{totals.total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notes & Terms */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        Notas y Condiciones
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Notas
                            </label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Notas adicionales..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Términos y Condiciones
                            </label>
                            <textarea
                                value={formData.terms}
                                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                placeholder="Condiciones de pago, garantías, etc..."
                            />
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Link
                        href="/quotes"
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={loading || !formData.clientId || items.length === 0}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creando...' : 'Crear Presupuesto'}
                    </button>
                </div>
            </form>
        </div>
    );
}
