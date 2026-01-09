"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    FileText,
    Receipt,
    CreditCard,
    Users,
    ArrowUpRight,
    ArrowDownRight,
    AlertTriangle,
} from "lucide-react";
import { getFinancialDashboard } from "./actions";

interface DashboardData {
    invoices: {
        total: number;
        paid: number;
        pending: number;
        overdueCount: number;
        thisMonth: number;
        thisYear: number;
    };
    expenses: {
        total: number;
        approved: number;
        pending: number;
        thisMonth: number;
    };
    profitLoss: {
        revenue: number;
        expenses: number;
        profit: number;
    };
    recentInvoices: any[];
    recentPayments: any[];
    monthlyRevenue: { month: string; invoiced: number; collected: number }[];
    topClients: { name: string; total: number }[];
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-800",
    SENT: "bg-blue-100 text-blue-800",
    PARTIAL: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    OVERDUE: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-100 text-gray-600",
};

export default function FinanceDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const dashboardData = await getFinancialDashboard();
            setData(dashboardData);
        } catch (error) {
            console.error("Error loading dashboard:", error);
        } finally {
            setLoading(false);
        }
    }

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-olive-600"></div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-6 text-center text-gray-500">
                Error al cargar el dashboard financiero
            </div>
        );
    }

    const profitMargin = data.profitLoss.revenue > 0
        ? ((data.profitLoss.profit / data.profitLoss.revenue) * 100).toFixed(1)
        : "0.0";

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Dashboard Financiero
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Visión general de ingresos, gastos y rentabilidad
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/invoices"
                        className="px-4 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                        Ver Facturas
                    </Link>
                    <Link
                        href="/invoices/new"
                        className="px-4 py-2 text-sm bg-olive-600 text-white rounded-lg hover:bg-olive-700"
                    >
                        Nueva Factura
                    </Link>
                </div>
            </div>

            {/* P&L Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Ingresos Cobrados</p>
                            <p className="text-3xl font-bold mt-2">{formatCurrency(data.profitLoss.revenue)}</p>
                            <p className="text-green-100 text-xs mt-1">Total histórico</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm font-medium">Gastos Aprobados</p>
                            <p className="text-3xl font-bold mt-2">{formatCurrency(data.profitLoss.expenses)}</p>
                            <p className="text-red-100 text-xs mt-1">Total histórico</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <TrendingDown className="w-8 h-8" />
                        </div>
                    </div>
                </div>

                <div className={`bg-gradient-to-br ${data.profitLoss.profit >= 0 ? "from-blue-500 to-blue-600" : "from-orange-500 to-orange-600"} rounded-xl shadow-lg p-6 text-white`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Beneficio Neto</p>
                            <p className="text-3xl font-bold mt-2">{formatCurrency(data.profitLoss.profit)}</p>
                            <p className="text-blue-100 text-xs mt-1">Margen: {profitMargin}%</p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-xl">
                            <DollarSign className="w-8 h-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Facturado este mes</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data.invoices.thisMonth)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                            <Receipt className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Pendiente de cobro</p>
                            <p className="text-lg font-bold text-yellow-600">
                                {formatCurrency(data.invoices.pending)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Facturas vencidas</p>
                            <p className="text-lg font-bold text-red-600">
                                {data.invoices.overdueCount}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <CreditCard className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Gastos este mes</p>
                            <p className="text-lg font-bold text-gray-900 dark:text-white">
                                {formatCurrency(data.expenses.thisMonth)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts and Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Revenue Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Evolución Mensual (últimos 6 meses)
                    </h3>
                    <div className="space-y-3">
                        {data.monthlyRevenue.map((month, i) => {
                            const maxValue = Math.max(...data.monthlyRevenue.map((m) => Math.max(m.invoiced, m.collected)));
                            const invoicedWidth = maxValue > 0 ? (month.invoiced / maxValue) * 100 : 0;
                            const collectedWidth = maxValue > 0 ? (month.collected / maxValue) * 100 : 0;
                            return (
                                <div key={month.month} className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">{month.month}</span>
                                        <div className="flex gap-4 text-xs">
                                            <span className="text-blue-600">Facturado: {formatCurrency(month.invoiced)}</span>
                                            <span className="text-green-600">Cobrado: {formatCurrency(month.collected)}</span>
                                        </div>
                                    </div>
                                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden relative">
                                        <div
                                            className="absolute h-full bg-blue-200 dark:bg-blue-800 rounded-full"
                                            style={{ width: `${invoicedWidth}%` }}
                                        />
                                        <div
                                            className="absolute h-full bg-green-500 rounded-full"
                                            style={{ width: `${collectedWidth}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex gap-4 mt-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-200 dark:bg-blue-800 rounded" />
                            <span className="text-gray-600 dark:text-gray-400">Facturado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded" />
                            <span className="text-gray-600 dark:text-gray-400">Cobrado</span>
                        </div>
                    </div>
                </div>

                {/* Top Clients */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-olive-600" />
                        Top Clientes
                    </h3>
                    <div className="space-y-3">
                        {data.topClients.length === 0 ? (
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Sin datos</p>
                        ) : (
                            data.topClients.map((client, i) => (
                                <div key={client.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-olive-100 dark:bg-olive-900 rounded-full flex items-center justify-center text-sm font-bold text-olive-600">
                                            {i + 1}
                                        </div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                                            {client.name}
                                        </span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(client.total)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Invoices */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Últimas Facturas</h3>
                        <Link href="/invoices" className="text-sm text-olive-600 hover:underline">
                            Ver todas
                        </Link>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.recentInvoices.map((invoice) => (
                            <Link
                                key={invoice.id}
                                href={`/invoices/${invoice.id}`}
                                className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{invoice.number}</p>
                                    <p className="text-sm text-gray-500">{invoice.client.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(invoice.total)}</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[invoice.status]}`}>
                                        {invoice.status}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Payments */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Últimos Cobros</h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {data.recentPayments.length === 0 ? (
                            <p className="p-4 text-gray-500 text-sm">Sin pagos recientes</p>
                        ) : (
                            data.recentPayments.map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-4">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {payment.invoice.number}
                                        </p>
                                        <p className="text-sm text-gray-500">{payment.invoice.client.name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-green-600">+{formatCurrency(payment.amount)}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(payment.date).toLocaleDateString("es-ES")}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
