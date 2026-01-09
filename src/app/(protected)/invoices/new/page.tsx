"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Send, Search, Package } from "lucide-react";
import { createInvoice } from "../actions";

interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    productId?: string;
}

interface Product {
    id: string;
    name: string;
    description: string | null;
    sku: string | null;
    type: "PRODUCT" | "SERVICE";
    price: number;
    taxRate: number;
    unit: string;
}

interface Client {
    id: string;
    name: string;
}

interface Project {
    id: string;
    name: string;
    code: string;
}

export default function NewInvoicePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [showProductSearch, setShowProductSearch] = useState<string | null>(null);
    const [productFilter, setProductFilter] = useState("");

    // Form state
    const [clientId, setClientId] = useState("");
    const [projectId, setProjectId] = useState("");
    const [dueDate, setDueDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString().split("T")[0];
    });
    const [notes, setNotes] = useState("");
    const [terms, setTerms] = useState("Pago a 30 días desde la fecha de factura.");

    // Line items
    const [items, setItems] = useState<InvoiceItem[]>([
        { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0, taxRate: 21 },
    ]);

    // Load initial data
    useEffect(() => {
        Promise.all([
            fetch("/api/clients").then((r) => r.json()),
            fetch("/api/products").then((r) => r.json()),
        ]).then(([clientsData, productsData]) => {
            setClients(clientsData);
            setProducts(productsData);
        });
    }, []);

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
        if (items.length === 1) return;
        setItems(items.filter((item) => item.id !== id));
    };

    const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
        setItems(
            items.map((item) =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );
    };

    // Product selection
    const selectProduct = (itemId: string, product: Product) => {
        setItems(
            items.map((item) =>
                item.id === itemId
                    ? {
                        ...item,
                        productId: product.id,
                        description: product.name,
                        unitPrice: product.price,
                        taxRate: product.taxRate,
                    }
                    : item
            )
        );
        setShowProductSearch(null);
        setProductFilter("");
    };

    // Calculations
    const calculateSubtotal = (item: InvoiceItem) => item.quantity * item.unitPrice;
    const calculateTax = (item: InvoiceItem) => calculateSubtotal(item) * (item.taxRate / 100);
    const calculateItemTotal = (item: InvoiceItem) => calculateSubtotal(item) + calculateTax(item);

    const invoiceSubtotal = items.reduce((sum, item) => sum + calculateSubtotal(item), 0);
    const invoiceTax = items.reduce((sum, item) => sum + calculateTax(item), 0);
    const invoiceTotal = invoiceSubtotal + invoiceTax;

    // Validation
    const isValid = () => {
        return (
            clientId &&
            dueDate &&
            items.length > 0 &&
            items.every((item) => item.description && item.quantity > 0 && item.unitPrice >= 0)
        );
    };

    // Submit
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

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(productFilter.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(productFilter.toLowerCase()))
    );

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
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Nueva Factura
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Crea una factura seleccionando productos del catálogo o añadiendo líneas personalizadas
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6">
                {/* Client & Project */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Cliente *
                        </label>
                        <select
                            value={clientId}
                            onChange={(e) => handleClientChange(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
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
                            Proyecto
                        </label>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                            disabled={!clientId}
                        >
                            <option value="">Sin proyecto</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    [{project.code}] {project.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Fecha de Vencimiento *
                        </label>
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                            required
                        />
                    </div>
                </div>

                {/* Line Items */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Líneas de Factura
                        </h3>
                        <button
                            onClick={addItem}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Añadir Línea
                        </button>
                    </div>

                    <div className="space-y-3">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className="relative bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
                            >
                                <div className="grid grid-cols-12 gap-3">
                                    {/* Description with product search */}
                                    <div className="col-span-12 md:col-span-5 relative">
                                        <label className="block text-xs text-gray-500 mb-1">Descripción</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => updateItem(item.id, "description", e.target.value)}
                                                onFocus={() => setShowProductSearch(item.id)}
                                                placeholder="Buscar producto o escribir..."
                                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                                required
                                            />
                                            <Package className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        </div>

                                        {/* Product dropdown */}
                                        {showProductSearch === item.id && products.length > 0 && (
                                            <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                                    <input
                                                        type="text"
                                                        value={productFilter}
                                                        onChange={(e) => setProductFilter(e.target.value)}
                                                        placeholder="Filtrar productos..."
                                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 text-sm focus:outline-none"
                                                        autoFocus
                                                    />
                                                </div>
                                                {filteredProducts.slice(0, 10).map((product) => (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onClick={() => selectProduct(item.id, product)}
                                                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex justify-between items-center text-sm"
                                                    >
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {product.sku ? `${product.sku} • ` : ""}{product.type === "SERVICE" ? "Servicio" : "Producto"}
                                                            </p>
                                                        </div>
                                                        <span className="text-olive-600 font-medium">
                                                            {product.price.toFixed(2)} €
                                                        </span>
                                                    </button>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowProductSearch(null);
                                                        setProductFilter("");
                                                    }}
                                                    className="w-full text-center py-2 text-xs text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 border-t border-gray-200 dark:border-gray-700"
                                                >
                                                    Cerrar
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Quantity */}
                                    <div className="col-span-4 md:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">Cantidad</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                                            min="0.01"
                                            step="0.01"
                                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-right text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                            required
                                        />
                                    </div>

                                    {/* Unit Price */}
                                    <div className="col-span-4 md:col-span-2">
                                        <label className="block text-xs text-gray-500 mb-1">Precio (€)</label>
                                        <input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                            min="0"
                                            step="0.01"
                                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-right text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                            required
                                        />
                                    </div>

                                    {/* Tax Rate */}
                                    <div className="col-span-4 md:col-span-1">
                                        <label className="block text-xs text-gray-500 mb-1">IVA</label>
                                        <select
                                            value={item.taxRate}
                                            onChange={(e) => updateItem(item.id, "taxRate", parseFloat(e.target.value))}
                                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-2 text-sm text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                        >
                                            <option value={21}>21%</option>
                                            <option value={10}>10%</option>
                                            <option value={4}>4%</option>
                                            <option value={0}>0%</option>
                                        </select>
                                    </div>

                                    {/* Total */}
                                    <div className="col-span-10 md:col-span-2 flex items-end">
                                        <div className="w-full">
                                            <label className="block text-xs text-gray-500 mb-1">Total</label>
                                            <div className="bg-olive-50 dark:bg-olive-900/20 border border-olive-200 dark:border-olive-700 rounded-lg px-3 py-2 text-sm font-bold text-olive-700 dark:text-olive-300 text-right">
                                                {calculateItemTotal(item).toFixed(2)} €
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delete button */}
                                    <div className="col-span-2 md:col-span-12 flex md:absolute md:right-2 md:top-2">
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            disabled={items.length === 1}
                                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            title="Eliminar línea"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="mt-6 flex justify-end">
                        <div className="w-full md:w-80 bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
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
                            <div className="flex justify-between text-xl font-bold border-t border-gray-200 dark:border-gray-700 pt-3">
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
                            rows={3}
                            placeholder="Notas visibles para el cliente..."
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
                            rows={3}
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none resize-none"
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                        href="/invoices"
                        className="px-4 py-2.5 text-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Cancelar
                    </Link>
                    <div className="flex gap-3">
                        <button
                            onClick={() => handleSave(false)}
                            disabled={loading || !isValid()}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Guardar Borrador
                        </button>
                        <button
                            onClick={() => handleSave(true)}
                            disabled={loading || !isValid()}
                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            <Send className="w-4 h-4" />
                            Guardar y Enviar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
