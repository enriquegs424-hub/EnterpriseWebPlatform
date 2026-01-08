'use client';

import { useState } from 'react';
import { Plus, Search, Filter, Check, X, Trash2, FileText, Calendar, Building2, Download } from 'lucide-react';
import { createExpense, deleteExpense, updateExpenseStatus } from '@/app/(protected)/expenses/actions';
import { useToast } from '@/components/ui/Toast';
import { useSession } from 'next-auth/react';
// import { ExpenseCategory, ExpenseStatus } from '@prisma/client';

const CATEGORIES = {
    TRAVEL: 'Viajes',
    MEALS: 'Comidas',
    EQUIPMENT: 'Equipamiento',
    SOFTWARE: 'Software',
    OFFICE: 'Oficina',
    OTHER: 'Otros'
};

const STATUS_COLORS = {
    PENDING: 'bg-orange-100 text-orange-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
    PAID: 'bg-blue-100 text-blue-700'
};

export default function ExpenseList({ initialExpenses, projects }: { initialExpenses: any[], projects: any[] }) {
    const { data: session } = useSession();
    const [expenses, setExpenses] = useState(initialExpenses);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    // Permissions
    const isAdminOrManager = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER';

    const filteredExpenses = expenses.filter(expense => {
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.user.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || expense.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const handleCreateExpense = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            // Receipt upload logic here (MOCKED for now, assumes URL text or file upload via existing API)
            // For now, let's just accept the form data.
            // If file input used: upload to /api/upload first.

            const fileInput = formData.get('receipt') as File;
            let receiptUrl = '';
            if (fileInput && fileInput.size > 0) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', fileInput);
                const res = await fetch('/api/upload', { method: 'POST', body: uploadFormData });
                if (res.ok) {
                    const json = await res.json();
                    receiptUrl = json.url;
                }
            }

            const data = {
                description: formData.get('description') as string,
                amount: parseFloat(formData.get('amount') as string),
                date: new Date(formData.get('date') as string),
                category: formData.get('category') as any,
                projectId: formData.get('projectId') as string || undefined,
                receiptUrl
            };

            const newExpense = await createExpense(data);
            // Optimistic update tricky due to formatting, better to refresh or use returned object
            // Use returned object and inject relations if needed (user is self)
            // Ideally revalidatePath handles it.
            setExpenses([{ ...newExpense, user: { name: session?.user?.name, image: session?.user?.image }, project: projects.find(p => p.id === data.projectId) }, ...expenses]);

            setIsAddModalOpen(false);
            toast.success('Gasto registrado', 'Pendiente de aprobación');
            window.location.reload();
        } catch (error) {
            toast.error('Error', 'No se pudo registrar el gasto');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await updateExpenseStatus(id, newStatus as any);
            setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: newStatus } : e));
            toast.success('Actualizado', `Gasto ${newStatus === 'APPROVED' ? 'Aprobado' : 'Rechazado'}`);
        } catch (error) {
            toast.error('Error', 'No se pudo actualizar el estado');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este gasto?')) return;
        try {
            await deleteExpense(id);
            setExpenses(prev => prev.filter(e => e.id !== id));
            toast.success('Eliminado', 'Gasto eliminado correctamente');
        } catch (error) {
            toast.error('Error', 'No se pudo eliminar');
        }
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

    return (
        <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-sm overflow-hidden">
            {/* Toolbar */}
            <div className="p-4 border-b border-neutral-100 dark:border-neutral-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-neutral-50/50 dark:bg-neutral-900/50">
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                        <input
                            placeholder="Buscar..."
                            className="pl-9 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-500 w-full md:w-64 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-olive-500 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Todos los Estados</option>
                        <option value="PENDING">Pendientes</option>
                        <option value="APPROVED">Aprobados</option>
                        <option value="REJECTED">Rechazados</option>
                    </select>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg text-sm w-full md:w-auto justify-center"
                >
                    <Plus size={18} />
                    Registrar Gasto
                </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 font-bold uppercase text-[10px]">
                            <th className="px-6 py-3">Fecha</th>
                            <th className="px-6 py-3">Descripción</th>
                            <th className="px-6 py-3">Categoría</th>
                            <th className="px-6 py-3">Importe</th>
                            <th className="px-6 py-3">Solicitante</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                        {filteredExpenses.map((expense) => (
                            <tr key={expense.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-700/30 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-neutral-600 dark:text-neutral-400">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-neutral-400" />
                                        {new Date(expense.date).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="font-bold text-neutral-900 dark:text-neutral-100">{expense.description}</p>
                                    {expense.project?.name && (
                                        <div className="flex items-center gap-1 text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                            <Building2 size={10} />
                                            {expense.project.name}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-lg text-xs font-medium">
                                        {CATEGORIES[expense.category as keyof typeof CATEGORIES] || expense.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-black text-neutral-900 dark:text-neutral-100">
                                    {formatCurrency(expense.amount)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-olive-100 text-olive-700 flex items-center justify-center text-xs font-bold">
                                            {expense.user?.name?.[0] || 'U'}
                                        </div>
                                        <span className="text-neutral-600 dark:text-neutral-300">{expense.user?.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${STATUS_COLORS[expense.status as keyof typeof STATUS_COLORS] || 'bg-gray-100'}`}>
                                        {expense.status === 'PENDING' ? 'Pendiente' :
                                            expense.status === 'APPROVED' ? 'Aprobado' :
                                                expense.status === 'REJECTED' ? 'Rechazado' : 'Pagado'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {expense.receiptUrl && (
                                            <a href={expense.receiptUrl} target="_blank" className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ver Recibo">
                                                <FileText size={16} />
                                            </a>
                                        )}

                                        {/* Actions for Admin on Pending */}
                                        {isAdminOrManager && expense.status === 'PENDING' && (
                                            <>
                                                <button onClick={() => handleStatusUpdate(expense.id, 'APPROVED')} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Aprobar">
                                                    <Check size={16} />
                                                </button>
                                                <button onClick={() => handleStatusUpdate(expense.id, 'REJECTED')} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Rechazar">
                                                    <X size={16} />
                                                </button>
                                            </>
                                        )}

                                        {/* Delete Action (Owner or Admin) */}
                                        {(isAdminOrManager || (expense.status === 'PENDING' && expense.userId === session?.user?.id)) && (
                                            <button onClick={() => handleDelete(expense.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredExpenses.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-neutral-400">
                                    No se encontraron gastos.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Registrar Nuevo Gasto</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-400 hover:text-neutral-900">✕</button>
                        </div>
                        <form onSubmit={handleCreateExpense} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Descripción</label>
                                <input name="description" required className="w-full px-3 py-2 border rounded-lg" placeholder="Comida con cliente..." />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Importe (€)</label>
                                    <input name="amount" type="number" step="0.01" required className="w-full px-3 py-2 border rounded-lg" placeholder="0.00" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Fecha</label>
                                    <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Categoría</label>
                                    <select name="category" className="w-full px-3 py-2 border rounded-lg bg-white">
                                        {Object.entries(CATEGORIES).map(([key, label]) => (
                                            <option key={key} value={key}>{label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Proyecto (Opcional)</label>
                                    <select name="projectId" className="w-full px-3 py-2 border rounded-lg bg-white">
                                        <option value="">-- Sin Proyecto --</option>
                                        {projects.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Recibo / Factura</label>
                                <div className="border border-dashed border-neutral-300 rounded-lg p-4 text-center hover:bg-neutral-50 transition-colors">
                                    <input type="file" name="receipt" className="hidden" id="receipt-upload" accept="image/*,.pdf" />
                                    <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center gap-2 text-neutral-500">
                                        <Download size={24} />
                                        <span className="text-xs font-bold">Click para subir archivo</span>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-50 rounded-xl">Cancelar</button>
                                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-olive-600 text-white font-bold rounded-xl hover:bg-olive-700 transition-colors disabled:opacity-50">
                                    {isLoading ? 'Guardando...' : 'Registrar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
