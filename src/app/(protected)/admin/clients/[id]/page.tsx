'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Building2, Mail, Phone, MapPin, Globe, FileText,
    ChevronLeft, Edit2, Briefcase, Receipt, File, Users
} from 'lucide-react';
import Link from 'next/link';

export default function ClientDetailPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id as string;

    const [client, setClient] = useState<any>(null);
    const [projects, setProjects] = useState<any[]>([]);
    const [quotes, setQuotes] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [documents, setDocuments] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'datos' | 'proyectos' | 'presupuestos' | 'facturas' | 'documentos'>('datos');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClientData();
    }, [clientId]);

    const loadClientData = async () => {
        try {
            // TODO: Create these server actions
            // const clientData = await getClientById(clientId);
            // const projectsData = await getClientProjects(clientId);
            // const quotesData = await getClientQuotes(clientId);
            // const invoicesData = await getClientInvoices(clientId);
            // const documentsData = await getClientDocuments(clientId);

            // Mock data for now
            setClient({
                id: clientId,
                name: 'Cliente Demo',
                email: 'cliente@demo.com',
                phone: '+34 600 000 000',
                address: 'Calle Demo 123',
                companyName: 'Demo S.L.',
                website: 'https://demo.com',
                notes: 'Cliente de prueba',
                status: 'ACTIVE'
            });

            setLoading(false);
        } catch (error) {
            console.error('Error loading client:', error);
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-olive-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!client) {
        return (
            <div className="text-center py-12">
                <p className="text-neutral-500">Cliente no encontrado</p>
            </div>
        );
    }

    const tabs = [
        { id: 'datos', label: 'Datos', icon: Building2, count: null },
        { id: 'proyectos', label: 'Proyectos', icon: Briefcase, count: projects.length },
        { id: 'presupuestos', label: 'Presupuestos', icon: FileText, count: quotes.length },
        { id: 'facturas', label: 'Facturas', icon: Receipt, count: invoices.length },
        { id: 'documentos', label: 'Documentos', icon: File, count: documents.length },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                            {client.name}
                        </h1>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {client.companyName || 'Sin empresa'}
                        </p>
                    </div>
                </div>
                <Link
                    href={`/admin/clients/${clientId}/edit`}
                    className="flex items-center gap-2 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors"
                >
                    <Edit2 size={16} />
                    Editar
                </Link>
            </div>

            {/* Tabs */}
            <div className="border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex gap-2 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${isActive
                                        ? 'border-olive-600 text-olive-600 dark:text-olive-400'
                                        : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="font-medium">{tab.label}</span>
                                {tab.count !== null && (
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isActive
                                            ? 'bg-olive-100 text-olive-700 dark:bg-olive-900/30 dark:text-olive-400'
                                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                        }`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                {activeTab === 'datos' && (
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold">Información del Cliente</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {client.email && (
                                <div className="flex items-start gap-3">
                                    <Mail className="w-5 h-5 text-neutral-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-neutral-500">Email</p>
                                        <p className="font-medium">{client.email}</p>
                                    </div>
                                </div>
                            )}

                            {client.phone && (
                                <div className="flex items-start gap-3">
                                    <Phone className="w-5 h-5 text-neutral-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-neutral-500">Teléfono</p>
                                        <p className="font-medium">{client.phone}</p>
                                    </div>
                                </div>
                            )}

                            {client.address && (
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-neutral-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-neutral-500">Dirección</p>
                                        <p className="font-medium">{client.address}</p>
                                    </div>
                                </div>
                            )}

                            {client.website && (
                                <div className="flex items-start gap-3">
                                    <Globe className="w-5 h-5 text-neutral-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm text-neutral-500">Sitio Web</p>
                                        <a
                                            href={client.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium text-olive-600 hover:underline"
                                        >
                                            {client.website}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        {client.notes && (
                            <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                                <h3 className="font-bold mb-2">Notas</h3>
                                <p className="text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">
                                    {client.notes}
                                </p>
                            </div>
                        )}

                        {/* Contactos section - TODO: Implement contacts CRUD */}
                        <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-800">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold flex items-center gap-2">
                                    <Users size={18} />
                                    Contactos
                                </h3>
                                <button className="text-sm text-olive-600 hover:text-olive-700 font-medium">
                                    + Añadir Contacto
                                </button>
                            </div>
                            <p className="text-neutral-500 text-sm">No hay contactos registrados</p>
                        </div>
                    </div>
                )}

                {activeTab === 'proyectos' && (
                    <div>
                        <h2 className="text-lg font-bold mb-4">Proyectos del Cliente</h2>
                        {projects.length === 0 ? (
                            <p className="text-neutral-500 text-center py-8">
                                No hay proyectos asociados a este cliente
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {/* TODO: Map projects here */}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'presupuestos' && (
                    <div>
                        <h2 className="text-lg font-bold mb-4">Presupuestos</h2>
                        {quotes.length === 0 ? (
                            <p className="text-neutral-500 text-center py-8">
                                No hay presupuestos para este cliente
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {/* TODO: Map quotes here */}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'facturas' && (
                    <div>
                        <h2 className="text-lg font-bold mb-4">Facturas</h2>
                        {invoices.length === 0 ? (
                            <p className="text-neutral-500 text-center py-8">
                                No hay facturas para este cliente
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {/* TODO: Map invoices here */}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'documentos' && (
                    <div>
                        <h2 className="text-lg font-bold mb-4">Documentos</h2>
                        {documents.length === 0 ? (
                            <p className="text-neutral-500 text-center py-8">
                                No hay documentos asociados a este cliente
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {/* TODO: Map documents here */}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
