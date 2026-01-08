import { getLeads, getClients } from '../actions';
import PipelineBoard from '@/components/crm/PipelineBoard';

export default async function PipelinePage() {
    const [leads, clients] = await Promise.all([
        getLeads(),
        getClients()
    ]);

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-neutral-900">Pipeline de Ventas</h2>
            </div>
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <PipelineBoard initialLeads={leads} clients={clients} />
            </div>
        </div>
    );
}
