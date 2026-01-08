'use client';

import { useState } from 'react';
import { Plus, MoreHorizontal, DollarSign, Calendar, Building2, User } from 'lucide-react';
import { createLead, updateLeadStage } from '@/app/(protected)/crm/actions';
import { useToast } from '@/components/ui/Toast';
// import { LeadStage } from '@prisma/client'; // Import from client not safe in client component if generation failed? Use string literals.

const STAGES = [
    { id: 'NEW', label: 'Nuevo', color: 'bg-blue-100 text-blue-700' },
    { id: 'QUALIFIED', label: 'Cualificado', color: 'bg-indigo-100 text-indigo-700' },
    { id: 'PROPOSAL', label: 'Propuesta', color: 'bg-purple-100 text-purple-700' },
    { id: 'NEGOTIATION', label: 'Negociación', color: 'bg-orange-100 text-orange-700' },
    { id: 'CLOSED_WON', label: 'Ganado', color: 'bg-green-100 text-green-700' },
    { id: 'CLOSED_LOST', label: 'Perdido', color: 'bg-red-100 text-red-700' },
];

export default function PipelineBoard({ initialLeads, clients }: { initialLeads: any[], clients: any[] }) {
    const [leads, setLeads] = useState(initialLeads);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    // Group leads by stage
    const columns = STAGES.map(stage => ({
        ...stage,
        items: leads.filter(l => l.stage === stage.id)
    }));

    const handleCreateLead = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const data = {
                title: formData.get('title') as string,
                value: parseFloat(formData.get('value') as string) || 0,
                clientId: formData.get('clientId') as string,
                description: formData.get('description') as string,
                stage: 'NEW' as any,
                expectedCloseDate: formData.get('date') ? new Date(formData.get('date') as string) : undefined
            };

            const newLead = await createLead(data);
            setLeads([newLead, ...leads]); // Optimistic update
            setIsAddModalOpen(false);
            toast.success('Lead creado', 'Oportunidad añadida al pipeline');
            window.location.reload();
        } catch (error) {
            toast.error('Error', 'No se pudo crear el lead');
        } finally {
            setIsLoading(false);
        }
    };

    const handleStageChange = async (leadId: string, newStage: string) => {
        // Optimistic
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, stage: newStage } : l));

        try {
            await updateLeadStage(leadId, newStage as any);
            toast.success('Actualizado', 'Etapa cambiada correctamente');
        } catch (error) {
            toast.error('Error', 'Falló la actualización');
            // Revert? (Complex without previous state, usually relying on router refresh is safer but less smooth)
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-end mb-4">
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors shadow-lg"
                >
                    <Plus size={20} />
                    Nuevo Deal
                </button>
            </div>

            <div className="flex-1 flex gap-4 overflow-x-auto pb-4 min-w-full">
                {columns.map(col => (
                    <div key={col.id} className="min-w-[300px] w-[300px] flex flex-col bg-neutral-100/50 rounded-2xl border border-neutral-200/50 max-h-full">
                        {/* Header */}
                        <div className={`p-4 border-b border-neutral-200 bg-white rounded-t-2xl flex justify-between items-center sticky top-0`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${col.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>
                                <span className="font-bold text-neutral-900 text-sm uppercase">{col.label}</span>
                                <span className="bg-neutral-100 text-neutral-500 text-xs px-2 py-0.5 rounded-full font-bold">{col.items.length}</span>
                            </div>
                            <div className="text-xs font-bold text-neutral-400">
                                {formatCurrency(col.items.reduce((sum, item) => sum + item.value, 0))}
                            </div>
                        </div>

                        {/* Items */}
                        <div className="p-3 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                            {col.items.map(lead => (
                                <div key={lead.id} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm hover:shadow-md transition-shadow group cursor-pointer relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-neutral-900 text-sm leading-tight">{lead.title}</h4>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <select
                                                className="text-[10px] border border-neutral-200 rounded p-1"
                                                value={lead.stage}
                                                onChange={(e) => handleStageChange(lead.id, e.target.value)}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3">
                                        <Building2 size={12} />
                                        <span className="truncate max-w-[150px]">{lead.client?.name || 'Prospecto'}</span>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-neutral-50">
                                        <div className="flex items-center gap-1 text-olive-600 font-black text-sm">
                                            <span className="text-xs">€</span>
                                            {lead.value.toLocaleString()}
                                        </div>
                                        {lead.expectedCloseDate && (
                                            <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-medium bg-neutral-50 px-1.5 py-0.5 rounded">
                                                <Calendar size={10} />
                                                {new Date(lead.expectedCloseDate).toLocaleDateString()}
                                            </div>
                                        )}
                                    </div>

                                    {/* Probability Bar */}
                                    {col.id !== 'CLOSED_WON' && col.id !== 'CLOSED_LOST' && (
                                        <div className="mt-3 h-1 bg-neutral-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${lead.probability > 75 ? 'bg-green-500' :
                                                        lead.probability > 40 ? 'bg-yellow-500' : 'bg-neutral-300'
                                                    }`}
                                                style={{ width: `${lead.probability || 20}%` }}
                                            ></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Nueva Oportunidad</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-400 hover:text-neutral-900">✕</button>
                        </div>
                        <form onSubmit={handleCreateLead} className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Título</label>
                                <input name="title" required className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Proyecto Residencial X" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Valor Estimado (€)</label>
                                    <input name="value" type="number" className="w-full px-3 py-2 border rounded-lg" placeholder="0.00" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Cierre Esperado</label>
                                    <input name="date" type="date" className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Cliente</label>
                                <select name="clientId" required className="w-full px-3 py-2 border rounded-lg bg-white">
                                    <option value="">Seleccionar Cliente...</option>
                                    {clients.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <p className="text-[10px] text-neutral-400 mt-1">* Crea el cliente primero si no existe.</p>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Descripción</label>
                                <textarea name="description" rows={3} className="w-full px-3 py-2 border rounded-lg resize-none" placeholder="Detalles..." />
                            </div>

                            <div className="pt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-50 rounded-xl">Cancelar</button>
                                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-olive-600 text-white font-bold rounded-xl hover:bg-olive-700 transition-colors disabled:opacity-50">
                                    {isLoading ? 'Guardando...' : 'Crear Deal'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
