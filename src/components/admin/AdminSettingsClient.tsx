'use client';

import { useState } from 'react';
import { updateSystemSetting, createTeam, deleteTeam } from '@/app/(protected)/admin/settings/actions';
import { Building2, Palette, Users, Save, Trash2, Plus } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function AdminSettingsClient({ initialSettings, initialTeams }: { initialSettings: any, initialTeams: any[] }) {
    const [settings, setSettings] = useState(initialSettings);
    const [teams, setTeams] = useState(initialTeams);
    const [newTeamName, setNewTeamName] = useState('');
    const [activeTab, setActiveTab] = useState('general');
    const toast = useToast();

    const handleSaveSetting = async (key: string, value: any) => {
        try {
            await updateSystemSetting(key, value);
            setSettings({ ...settings, [key]: value });
            toast.success('Guardado', 'Configuración actualizada');
        } catch (error) {
            toast.error('Error', 'No se pudo guardar');
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createTeam(newTeamName);
            // Optimistic or refresh
            window.location.reload(); // Simplest for list update
            toast.success('Equipo creado', 'Se ha añadido un nuevo equipo');
            setNewTeamName('');
        } catch (error) {
            toast.error('Error', 'No se pudo crear el equipo');
        }
    };

    const handleDeleteTeam = async (id: string) => {
        if (!confirm('¿Seguro? Esto desvinculará a los usuarios del equipo.')) return;
        try {
            await deleteTeam(id);
            setTeams(prev => prev.filter(t => t.id !== id));
            toast.success('Eliminado', 'Equipo eliminado');
        } catch (error) {
            toast.error('Error', 'No se pudo eliminar');
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col md:flex-row">
            {/* Sidebar Tabs */}
            <div className="w-full md:w-64 bg-neutral-50/50 p-4 border-r border-neutral-200 space-y-2">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-white text-olive-600 shadow-sm border border-neutral-100' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                    <Building2 className="mr-3" size={18} /> General
                </button>
                <button
                    onClick={() => setActiveTab('teams')}
                    className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'teams' ? 'bg-white text-olive-600 shadow-sm border border-neutral-100' : 'text-neutral-500 hover:text-neutral-900'}`}
                >
                    <Users className="mr-3" size={18} /> Equipos
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 md:p-8">
                {activeTab === 'general' && (
                    <div className="space-y-6 max-w-lg animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-lg font-bold text-neutral-900 mb-4">Información de la Empresa</h2>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Nombre de la Empresa</label>
                            <div className="flex gap-2">
                                <input
                                    className="w-full px-4 py-2 border border-neutral-200 rounded-xl"
                                    defaultValue={settings.COMPANY_NAME || ''}
                                    onBlur={(e) => handleSaveSetting('COMPANY_NAME', e.target.value)}
                                />
                                <button className="p-2 bg-neutral-100 rounded-xl text-neutral-400 hover:text-olive-600"><Save size={20} /></button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-neutral-500 uppercase mb-2">Moneda por Defecto</label>
                            <select
                                className="w-full px-4 py-2 border border-neutral-200 rounded-xl bg-white"
                                defaultValue={settings.DEFAULT_CURRENCY || 'EUR'}
                                onChange={(e) => handleSaveSetting('DEFAULT_CURRENCY', e.target.value)}
                            >
                                <option value="EUR">Euro (€)</option>
                                <option value="USD">Dólar ($)</option>
                                <option value="GBP">Libra (£)</option>
                            </select>
                        </div>
                    </div>
                )}

                {activeTab === 'teams' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <h2 className="text-lg font-bold text-neutral-900 mb-4">Gestión de Equipos</h2>

                        <form onSubmit={handleCreateTeam} className="flex gap-4 items-end bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Nuevo Equipo</label>
                                <input
                                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                                    placeholder="Ej: Desarrollo Web"
                                    value={newTeamName}
                                    onChange={e => setNewTeamName(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-lg text-sm hover:bg-black transition-colors flex items-center gap-2">
                                <Plus size={16} /> Crear
                            </button>
                        </form>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {teams.map(team => (
                                <div key={team.id} className="p-4 border border-neutral-200 rounded-xl flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div>
                                        <p className="font-bold text-neutral-900">{team.name}</p>
                                        <p className="text-xs text-neutral-500">{team._count.members} miembros</p>
                                    </div>
                                    <button onClick={() => handleDeleteTeam(team.id)} className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {teams.length === 0 && <p className="text-neutral-400 text-sm">No hay equipos creados.</p>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
