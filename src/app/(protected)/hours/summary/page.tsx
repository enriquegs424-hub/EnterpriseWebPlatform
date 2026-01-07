import { getUserSummary } from "./actions";
import { BarChart3, Calendar, TrendingUp } from "lucide-react";

export default async function SummaryPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
    const params = await searchParams;
    const year = Number(params.year) || new Date().getFullYear();
    const data = await getUserSummary(year);

    const months = [
        'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
        'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    if (!data) return <div>No se pudo cargar el resumen.</div>;

    const { projectMonths, monthlyTotals, projectTotals } = data;
    const maxMonthlyHours = Math.max(...Object.values(monthlyTotals), 1);
    const totalYearHours = Object.values(projectTotals).reduce((a, b) => a + b, 0);

    return (
        <div className="space-y-8 pb-12">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 flex items-center">
                        <BarChart3 className="w-8 h-8 mr-3 text-olive-600" />
                        Informe Anual {year}
                    </h1>
                    <p className="text-neutral-500 mt-2 text-lg">Balance consolidado de actividad y rendimiento.</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl border border-neutral-200 shadow-sm">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span className="font-bold text-neutral-900 text-lg">{year}</span>
                    </div>
                </div>
            </div>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 border-b-4 border-b-olive-500">
                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Total Anual</p>
                    <p className="text-4xl font-black text-neutral-900">{totalYearHours}<span className="text-xl font-normal text-neutral-400 ml-1">h</span></p>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 border-b-4 border-b-info-500">
                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Promedio Mensual</p>
                    <p className="text-4xl font-black text-neutral-900">{Math.round(totalYearHours / 12)}<span className="text-xl font-normal text-neutral-400 ml-1">h/mes</span></p>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 border-b-4 border-b-success-500">
                    <p className="text-sm font-bold text-neutral-500 uppercase tracking-wider mb-1">Proyectos Activos</p>
                    <p className="text-4xl font-black text-neutral-900">{Object.keys(projectTotals).length}</p>
                </div>
            </div>

            {/* Monthly Activity Chart */}
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 p-8">
                <h3 className="text-xl font-bold text-neutral-900 mb-8 flex items-center">
                    <TrendingUp className="w-5 h-5 mr-3 text-olive-600" />
                    Productividad Mensual
                </h3>
                <div className="h-64 flex items-end justify-between space-x-2 sm:space-x-4">
                    {months.map((m, i) => {
                        const hours = monthlyTotals[i] || 0;
                        const height = (hours / maxMonthlyHours) * 100;
                        return (
                            <div key={m} className="flex-1 flex flex-col items-center group relative">
                                <div className="absolute -top-10 bg-neutral-900 text-white text-xs font-bold px-2 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100 whitespace-nowrap z-10 shadow-xl">
                                    {hours} horas
                                </div>
                                <div
                                    className="w-full bg-neutral-100 rounded-t-xl transition-all duration-1000 overflow-hidden relative"
                                    style={{ height: `${Math.max(height, 5)}%` }}
                                >
                                    <div
                                        className={`absolute inset-0 transition-all duration-700 ${hours > 0 ? 'bg-olive-500/80 group-hover:bg-olive-600' : 'bg-neutral-200'
                                            }`}
                                    />
                                </div>
                                <p className="text-xs font-bold text-neutral-500 mt-4 uppercase tracking-tighter sm:tracking-normal">{m}</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Project Distribution Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="px-8 py-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                    <h3 className="text-xl font-bold text-neutral-900">Desglose Detallado por Proyecto</h3>
                    <span className="text-sm font-medium text-neutral-500 bg-white px-3 py-1 rounded-full border border-neutral-200">Valores en horas (h)</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-200 text-sm">
                        <thead className="bg-white">
                            <tr>
                                <th className="px-8 py-5 text-left font-black text-neutral-400 uppercase tracking-widest text-[10px] border-r border-neutral-100 sticky left-0 bg-white z-10">
                                    Identificador de Proyecto
                                </th>
                                {months.map(m => (
                                    <th key={m} className="px-4 py-5 text-center font-bold text-neutral-500 uppercase tracking-tighter text-[10px] min-w-[70px]">{m}</th>
                                ))}
                                <th className="px-8 py-5 text-right font-black text-olive-700 uppercase tracking-widest text-[10px] bg-olive-50/30 sticky right-0 z-10 w-[120px]">
                                    Acumulado
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {Object.entries(projectMonths).map(([projectKey, monthsData]) => {
                                const total = projectTotals[projectKey] || 0;
                                return (
                                    <tr key={projectKey} className="hover:bg-neutral-50 transition-colors group">
                                        <td className="px-8 py-6 font-bold text-neutral-800 border-r border-neutral-100 sticky left-0 bg-white group-hover:bg-neutral-50 z-10">
                                            {projectKey}
                                        </td>
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <td key={i} className="px-4 py-6 text-center">
                                                {monthsData[i] ? (
                                                    <span className="inline-flex items-center justify-center w-10 h-8 bg-olive-100/50 text-olive-700 rounded-lg font-bold text-xs ring-1 ring-olive-200/50">
                                                        {monthsData[i]}
                                                    </span>
                                                ) : (
                                                    <span className="text-neutral-200">0</span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-8 py-6 text-right font-black text-lg text-olive-700 bg-olive-50/20 group-hover:bg-olive-50/40 sticky right-0 z-10 transition-colors">
                                            {total}h
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot className="bg-neutral-900 text-white">
                            <tr>
                                <td className="px-8 py-6 font-black uppercase tracking-widest text-xs sticky left-0 bg-neutral-900 z-10">Total Mensual Consolidado</td>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <td key={i} className="px-4 py-6 text-center font-black text-olive-400">
                                        {monthlyTotals[i] || 0}h
                                    </td>
                                ))}
                                <td className="px-8 py-6 text-right font-black text-xl text-white bg-olive-600 sticky right-0 z-10">
                                    {totalYearHours}h
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}
