'use client';

import { useState } from 'react';
import { Search, Plus, Phone, Mail, Globe, MapPin, User, Building2 } from 'lucide-react';
import { createClient, updateClient } from '@/app/(protected)/crm/actions';
import { useToast } from '@/components/ui/Toast';
import { useAppLocale } from '@/providers/LocaleContext';

export default function ClientList({ initialClients }: { initialClients: any[] }) {
    const [clients, setClients] = useState(initialClients);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    // Filter
    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contacts.some((contact: any) => contact.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const handleCreateClient = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);

        try {
            const data = {
                name: formData.get('name') as string,
                industry: formData.get('industry') as string,
                website: formData.get('website') as string,
                address: formData.get('address') as string,
                contactName: formData.get('contactName') as string,
                contactEmail: formData.get('contactEmail') as string,
                phone: formData.get('phone') as string,
                accessCode: formData.get('accessCode') as string,
            };

            const newClient = await createClient(data);
            setClients([newClient, ...clients]); // In real app, revalidatePath handles this but for instant feedback
            setIsAddModalOpen(false);
            toast.success('Cliente creado', 'El cliente se ha añadido correctamente');
            // Refresh page to get full data with new ID from server (or rely on revalidatePath)
            window.location.reload();
        } catch (error) {
            toast.error('Error', 'No se pudo crear el cliente');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Toolbar */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o contacto..."
                        className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-olive-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-colors"
                >
                    <Plus size={20} />
                    Nuevo Cliente
                </button>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredClients.map((client) => (
                    <div key={client.id} className="bg-white p-6 rounded-2xl shadow-sm border border-neutral-200 hover:border-olive-300 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-olive-50 rounded-lg flex items-center justify-center text-olive-700">
                                    <Building2 size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-neutral-900">{client.name}</h3>
                                    <p className="text-xs text-neutral-500 font-bold uppercase">{client.industry || 'General'}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${client.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                client.status === 'PROSPECT' ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-500'
                                }`}>
                                {client.status}
                            </span>
                        </div>

                        <div className="space-y-2 mb-4">
                            {client.contacts && client.contacts[0] ? (
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <User size={16} className="text-neutral-400" />
                                    <span>{client.contacts[0].name}</span>
                                </div>
                            ) : (
                                <div className="text-sm text-neutral-400 italic">Sin contacto principal</div>
                            )}

                            {client.phone && (
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <Phone size={16} className="text-neutral-400" />
                                    <span>{client.phone}</span>
                                </div>
                            )}
                            {client.email && (
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <Mail size={16} className="text-neutral-400" />
                                    <span className="truncate">{client.email}</span>
                                </div>
                            )}
                            {client.website && (
                                <div className="flex items-center gap-2 text-sm text-neutral-600">
                                    <Globe size={16} className="text-neutral-400" />
                                    <a href={client.website.startsWith('http') ? client.website : `https://${client.website}`} target="_blank" className="hover:text-olive-600 hover:underline truncate">
                                        {client.website}
                                    </a>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-neutral-100 grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <span className="block text-xl font-black text-neutral-900">{client._count?.projects || 0}</span>
                                <span className="text-xs text-neutral-500 font-bold uppercase">Proyectos</span>
                            </div>
                            <div className="text-center border-l border-neutral-100">
                                <span className="block text-xl font-black text-neutral-900">{client._count?.leads || 0}</span>
                                <span className="text-xs text-neutral-500 font-bold uppercase">Leads</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-neutral-100 flex justify-between items-center">
                            <h3 className="font-bold text-lg">Nuevo Cliente</h3>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-neutral-400 hover:text-neutral-900">✕</button>
                        </div>
                        <form onSubmit={handleCreateClient} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Empresa</label>
                                    <input name="name" required className="w-full px-3 py-2 border rounded-lg" placeholder="Nombre Comercial" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Industria</label>
                                    <input name="industry" className="w-full px-3 py-2 border rounded-lg" placeholder="e.g. Construcción" />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Sitio Web</label>
                                <input name="website" className="w-full px-3 py-2 border rounded-lg" placeholder="mep-projects.com" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-neutral-500 uppercase">Dirección</label>
                                <input name="address" className="w-full px-3 py-2 border rounded-lg" placeholder="Calle Principal 123" />
                            </div>

                            <div className="pt-4 border-t border-neutral-100">
                                <p className="text-sm font-bold text-neutral-900 mb-3">Contacto Principal</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-neutral-500 uppercase">Nombre</label>
                                        <input name="contactName" className="w-full px-3 py-2 border rounded-lg" placeholder="Juan Pérez" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-neutral-500 uppercase">Teléfono</label>
                                        <input name="phone" className="w-full px-3 py-2 border rounded-lg" placeholder="+34 600..." />
                                    </div>
                                </div>
                                <div className="space-y-1 mt-3">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Email</label>
                                    <input name="contactEmail" type="email" className="w-full px-3 py-2 border rounded-lg" placeholder="juan@empresa.com" />
                                </div>
                                <div className="space-y-1 mt-3">
                                    <label className="text-xs font-bold text-neutral-500 uppercase">Código Acceso Portal</label>
                                    <input name="accessCode" className="w-full px-3 py-2 border rounded-lg bg-olive-50 font-mono text-sm" placeholder="Opcional (para login)" />
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 font-bold text-neutral-600 hover:bg-neutral-50 rounded-xl">Cancelar</button>
                                <button type="submit" disabled={isLoading} className="px-6 py-2 bg-olive-600 text-white font-bold rounded-xl hover:bg-olive-700 transition-colors disabled:opacity-50">
                                    {isLoading ? 'Guardando...' : 'Crear Cliente'}
                                </button>
                            </div>
                        </form>
                    </div >
                </div >
            )
            }
        </>
    );
}
