import { getSystemSettings, getTeams } from './actions';
import AdminSettingsClient from '@/components/admin/AdminSettingsClient';

export default async function AdminSettingsPage() {
    const [settings, teams] = await Promise.all([
        getSystemSettings(),
        getTeams()
    ]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 border-l-4 border-olive-500 pl-4">Configuración del Sistema</h1>
                <p className="text-neutral-500 mt-1 ml-5">Variables globales y gestión de equipos</p>
            </div>

            <AdminSettingsClient initialSettings={settings} initialTeams={teams} />
        </div>
    );
}
