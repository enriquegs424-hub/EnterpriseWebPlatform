"use client";

import { useState } from "react";
import { X, CreditCard, Banknote, Building2, FileText, HelpCircle } from "lucide-react";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: PaymentData) => Promise<void>;
    invoiceId: string;
    balance: number;
    invoiceNumber: string;
}

interface PaymentData {
    amount: number;
    method: "CASH" | "TRANSFER" | "CARD" | "CHEQUE" | "OTHER";
    reference?: string;
    notes?: string;
    date: string;
}

const PAYMENT_METHODS = [
    { value: "TRANSFER", label: "Transferencia", icon: Building2 },
    { value: "CARD", label: "Tarjeta", icon: CreditCard },
    { value: "CASH", label: "Efectivo", icon: Banknote },
    { value: "CHEQUE", label: "Cheque", icon: FileText },
    { value: "OTHER", label: "Otro", icon: HelpCircle },
];

export default function PaymentModal({
    isOpen,
    onClose,
    onSubmit,
    invoiceId,
    balance,
    invoiceNumber,
}: PaymentModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<PaymentData>({
        amount: balance,
        method: "TRANSFER",
        reference: "",
        notes: "",
        date: new Date().toISOString().split("T")[0],
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.amount <= 0) {
            alert("El importe debe ser mayor a 0");
            return;
        }

        if (formData.amount > balance) {
            alert(`El importe no puede superar el saldo pendiente (${balance.toFixed(2)} €)`);
            return;
        }

        setLoading(true);
        try {
            await onSubmit(formData);
            onClose();
        } catch (error: any) {
            alert(error.message || "Error al registrar el pago");
        } finally {
            setLoading(false);
        }
    };

    const handleQuickAmount = (percentage: number) => {
        setFormData({ ...formData, amount: +(balance * percentage).toFixed(2) });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            Registrar Pago
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Factura {invoiceNumber}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Balance info */}
                    <div className="p-4 bg-gradient-to-r from-olive-50 to-olive-100 dark:from-olive-900/20 dark:to-olive-800/20 rounded-xl border border-olive-200 dark:border-olive-700">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-olive-700 dark:text-olive-300">Saldo pendiente:</span>
                            <span className="text-2xl font-bold text-olive-800 dark:text-olive-200">
                                {balance.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                            </span>
                        </div>
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Importe del pago *
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                min="0.01"
                                max={balance}
                                step="0.01"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 pr-12 text-xl font-bold text-gray-900 dark:text-white focus:border-olive-500 focus:ring-2 focus:ring-olive-500/20 focus:outline-none"
                            />
                            <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                                €
                            </span>
                        </div>
                        {/* Quick amount buttons */}
                        <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                onClick={() => handleQuickAmount(0.25)}
                                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                25%
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickAmount(0.5)}
                                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                50%
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickAmount(0.75)}
                                className="px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                75%
                            </button>
                            <button
                                type="button"
                                onClick={() => handleQuickAmount(1)}
                                className="px-3 py-1 text-xs bg-olive-100 dark:bg-olive-900 text-olive-700 dark:text-olive-300 rounded-full hover:bg-olive-200 dark:hover:bg-olive-800 transition-colors font-medium"
                            >
                                100%
                            </button>
                        </div>
                    </div>

                    {/* Payment method */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Método de pago *
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {PAYMENT_METHODS.map((method) => {
                                const Icon = method.icon;
                                const isSelected = formData.method === method.value;
                                return (
                                    <button
                                        key={method.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, method: method.value as any })}
                                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border transition-all ${isSelected
                                                ? "border-olive-500 bg-olive-50 dark:bg-olive-900/30 text-olive-700 dark:text-olive-300"
                                                : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400"
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="text-xs font-medium">{method.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date and Reference */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Fecha del pago *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Referencia
                            </label>
                            <input
                                type="text"
                                value={formData.reference}
                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                placeholder="Nº transferencia..."
                                className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notas
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                            placeholder="Notas adicionales del pago..."
                            className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:border-olive-500 focus:outline-none resize-none"
                        />
                    </div>

                    {/* Summary */}
                    {formData.amount > 0 && (
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Pago a registrar:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {formData.amount.toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Nuevo saldo:</span>
                                <span className={`font-bold ${balance - formData.amount === 0 ? "text-green-600" : "text-yellow-600"}`}>
                                    {(balance - formData.amount).toLocaleString("es-ES", { style: "currency", currency: "EUR" })}
                                </span>
                            </div>
                            {balance - formData.amount === 0 && (
                                <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                                    ✓ La factura quedará totalmente pagada
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || formData.amount <= 0}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {loading ? "Registrando..." : "Registrar Pago"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
