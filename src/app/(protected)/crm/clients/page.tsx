import { getClients } from '../actions';
import ClientList from '@/components/crm/ClientList';

export default async function ClientsPage() {
    const clients = await getClients();
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-neutral-900">Directorio de Clientes</h2>
            </div>
            <ClientList initialClients={clients} />
        </div>
    );
}
