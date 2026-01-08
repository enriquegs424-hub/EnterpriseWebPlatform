import { getCRMDashboardStats } from './actions';
import { TrendingUp, Users, Wallet } from 'lucide-react';

export default async function CRMDashboardPage() {
    // Fetch data
    const stats = await getCRMDashboardStats();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Leads Count */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-neutral-500">Leads Totales</p>
                            <p className="text-3xl font-black text-neutral-900">{stats.totalLeads}</p>
                        </div>
                    </div>
                </div>

                {/* Pipeline Value */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-olive-50 text-olive-600 rounded-xl">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-neutral-500">Valor en Pipeline</p>
                            <p className="text-3xl font-black text-neutral-900">{formatCurrency(stats.pipelineValue)}</p>
                        </div>
                    </div>
                </div>

                {/* Active Clients */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-neutral-500">Clientes Activos</p>
                            <p className="text-3xl font-black text-neutral-900">{stats.activeClients}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stage Breakdown */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
                <h2 className="text-lg font-bold text-neutral-900 mb-6">Desglose por Etapa</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {stats.leadsByStage.map((stage: any) => (
                        <div key={stage.stage} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                            <p className="text-xs font-bold text-neutral-500 mb-1">{stage.stage}</p>
                            <p className="text-xl font-black text-neutral-900">{stage._count}</p>
                            <p className="text-xs text-olive-600 font-bold mt-1">{formatCurrency(stage._sum.value || 0)}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
