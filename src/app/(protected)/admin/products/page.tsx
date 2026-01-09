"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Package,
    Plus,
    Pencil,
    Trash2,
    Search,
    ArrowLeft,
    Check,
    X,
} from "lucide-react";
import DataTable, { type Column } from "@/components/DataTable";
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductStats,
} from "./actions";

interface Product {
    id: string;
    name: string;
    description: string | null;
    sku: string | null;
    type: "PRODUCT" | "SERVICE";
    category: string | null;
    price: number;
    cost: number | null;
    taxRate: number;
    unit: string;
    isActive: boolean;
}

interface ProductStats {
    total: number;
    products: number;
    services: number;
    inactive: number;
}

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [stats, setStats] = useState<ProductStats>({ total: 0, products: 0, services: 0, inactive: 0 });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [showInactive, setShowInactive] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        sku: "",
        type: "SERVICE" as "PRODUCT" | "SERVICE",
        category: "",
        price: 0,
        cost: 0,
        taxRate: 21,
        unit: "unidad",
    });

    useEffect(() => {
        loadData();
    }, [showInactive]);

    async function loadData() {
        setLoading(true);
        try {
            const [productsData, statsData] = await Promise.all([
                getProducts(showInactive),
                getProductStats(),
            ]);
            setProducts(productsData);
            setStats(statsData);
        } catch (error: any) {
            console.error("Error loading products:", error);
        } finally {
            setLoading(false);
        }
    }

    function openModal(product?: Product) {
        if (product) {
            setEditingProduct(product);
            setFormData({
                name: product.name,
                description: product.description || "",
                sku: product.sku || "",
                type: product.type,
                category: product.category || "",
                price: product.price,
                cost: product.cost || 0,
                taxRate: product.taxRate,
                unit: product.unit,
            });
        } else {
            setEditingProduct(null);
            setFormData({
                name: "",
                description: "",
                sku: "",
                type: "SERVICE",
                category: "",
                price: 0,
                cost: 0,
                taxRate: 21,
                unit: "unidad",
            });
        }
        setShowModal(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, formData);
            } else {
                await createProduct(formData);
            }
            setShowModal(false);
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    }

    async function handleDelete(id: string) {
        if (!confirm("¿Desactivar este producto?")) return;
        try {
            await deleteProduct(id);
            loadData();
        } catch (error: any) {
            alert(error.message);
        }
    }

    const columns: Column<Product>[] = [
        {
            key: "name",
            label: "Producto/Servicio",
            sortable: true,
            render: (product) => (
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${product.type === "PRODUCT" ? "bg-blue-100 dark:bg-blue-900" : "bg-purple-100 dark:bg-purple-900"}`}>
                        <Package className={`w-4 h-4 ${product.type === "PRODUCT" ? "text-blue-600" : "text-purple-600"}`} />
                    </div>
                    <div>
                        <div className="font-medium">{product.name}</div>
                        {product.sku && (
                            <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            key: "type",
            label: "Tipo",
            sortable: true,
            render: (product) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.type === "PRODUCT"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                        : "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                    }`}>
                    {product.type === "PRODUCT" ? "Producto" : "Servicio"}
                </span>
            ),
        },
        {
            key: "category",
            label: "Categoría",
            sortable: true,
            render: (product) => product.category || <span className="text-gray-400">-</span>,
        },
        {
            key: "price",
            label: "Precio",
            sortable: true,
            className: "text-right",
            render: (product) => (
                <div className="text-right">
                    <div className="font-medium">
                        {product.price.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                    </div>
                    <div className="text-xs text-gray-500">/{product.unit}</div>
                </div>
            ),
        },
        {
            key: "taxRate",
            label: "IVA",
            sortable: true,
            className: "text-center",
            render: (product) => `${product.taxRate}%`,
        },
        {
            key: "isActive",
            label: "Estado",
            sortable: true,
            render: (product) => (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${product.isActive
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}>
                    {product.isActive ? "Activo" : "Inactivo"}
                </span>
            ),
        },
        {
            key: "actions",
            label: "Acciones",
            render: (product) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); openModal(product); }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="Editar"
                    >
                        <Pencil className="w-4 h-4" />
                    </button>
                    {product.isActive && (
                        <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(product.id); }}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                            title="Desactivar"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Catálogo de Productos
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Gestiona tus productos y servicios
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => openModal()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Producto
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Activos</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Productos</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.products}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Servicios</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.services}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Inactivos</p>
                    <p className="text-2xl font-bold text-gray-400 mt-1">{stats.inactive}</p>
                </div>
            </div>

            {/* Toggle inactive */}
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="showInactive"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="rounded border-gray-300"
                />
                <label htmlFor="showInactive" className="text-sm text-gray-600 dark:text-gray-400">
                    Mostrar productos inactivos
                </label>
            </div>

            {/* DataTable */}
            <DataTable
                data={products}
                columns={columns}
                keyExtractor={(p) => p.id}
                loading={loading}
                emptyMessage="No hay productos en el catálogo"
                searchPlaceholder="Buscar por nombre, SKU o categoría..."
            />

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Tipo *
                                    </label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as "PRODUCT" | "SERVICE" })}
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                    >
                                        <option value="SERVICE">Servicio</option>
                                        <option value="PRODUCT">Producto</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        SKU / Código
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        placeholder="Ej: SERV-001"
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Categoría
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        placeholder="Ej: Consultoría"
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Unidad
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        placeholder="Ej: hora, unidad, kg"
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Precio de Venta (€) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Coste (€)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Tipo de IVA (%)
                                    </label>
                                    <select
                                        value={formData.taxRate}
                                        onChange={(e) => setFormData({ ...formData, taxRate: parseFloat(e.target.value) })}
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                                    >
                                        <option value={21}>21% (General)</option>
                                        <option value={10}>10% (Reducido)</option>
                                        <option value={4}>4% (Superreducido)</option>
                                        <option value={0}>0% (Exento)</option>
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        rows={3}
                                        className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none resize-none"
                                    />
                                </div>

                                {/* Margin calculation */}
                                {formData.cost > 0 && formData.price > 0 && (
                                    <div className="md:col-span-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Margen:</span>
                                            <span className={`font-medium ${formData.price - formData.cost > 0 ? "text-green-600" : "text-red-600"}`}>
                                                {(formData.price - formData.cost).toFixed(2)} € ({((formData.price - formData.cost) / formData.price * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
                                >
                                    {editingProduct ? "Guardar Cambios" : "Crear Producto"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
