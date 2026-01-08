import { getExpenses, getExpenseStats } from './actions';
import ExpenseList from '@/components/expenses/ExpenseList';
import { prisma } from '@/lib/prisma';

async function getProjectOptions() {
    return prisma.project.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true }
    });
}

export default async function ExpensesPage() {
    const [expenses, stats, projects] = await Promise.all([
        getExpenses(),
        getExpenseStats(),
        getProjectOptions()
    ]);

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-black text-neutral-900 tracking-tight">Gastos</h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
                    <p className="text-xs font-bold text-neutral-500 uppercase">Total Gastos</p>
                    <p className="text-2xl font-black text-neutral-900">{formatCurrency(stats.total)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-orange-100 bg-orange-50/50 shadow-sm">
                    <p className="text-xs font-bold text-orange-600 uppercase">Pendiente Aprobación</p>
                    <p className="text-2xl font-black text-orange-700">{formatCurrency(stats.pending)}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-green-100 bg-green-50/50 shadow-sm">
                    <p className="text-xs font-bold text-green-600 uppercase">Aprobado</p>
                    <p className="text-2xl font-black text-green-700">{formatCurrency(stats.approved)}</p>
                </div>
            </div>

            {/* List & Management */}
            <ExpenseList initialExpenses={expenses} projects={projects} />
        </div>
    );
}
