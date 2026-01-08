import { getClientDashboardData, logoutClient, getClientSession } from '@/app/portal/actions';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Folder, ArrowRight, LayoutGrid, FileText, CheckSquare, LogOut } from 'lucide-react';

export default async function PortalDashboard() {
    const session = await getClientSession();
    if (!session) redirect('/portal/login');

    const clientData = await getClientDashboardData();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900">Hola, {clientData?.name}</h1>
                    <p className="text-neutral-500 mt-1">Bienvenido a tu panel de cliente.</p>
                </div>
                <form action={logoutClient}>
                    <button className="flex items-center px-4 py-2 text-sm font-bold text-neutral-600 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors">
                        <LogOut size={16} className="mr-2" />
                        Salir
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><LayoutGrid size={24} /></div>
                        <div>
                            <p className="text-2xl font-bold">{clientData?.projects.length}</p>
                            <p className="text-xs text-neutral-500 font-bold uppercase">Proyectos Activos</p>
                        </div>
                    </div>
                </div>
                {/* Placeholders for future stats */}
                <div className="bg-white p-6 rounded-2xl border border-neutral-100 shadow-sm opacity-50">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><FileText size={24} /></div>
                        <div>
                            <p className="text-2xl font-bold">-</p>
                            <p className="text-xs text-neutral-500 font-bold uppercase">Facturas Pendientes</p>
                        </div>
                    </div>
                    <span className="text-xs bg-neutral-100 px-2 py-1 rounded">Próximamente</span>
                </div>
            </div>

            <div>
                <h2 className="text-xl font-bold text-neutral-900 mb-4 flex items-center gap-2">
                    <Folder className="text-olive-600" /> Tus Proyectos
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {clientData?.projects.map((project) => (
                        <div key={project.id} className="group bg-white rounded-2xl border border-neutral-200 p-6 hover:shadow-lg transition-all cursor-pointer relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-olive-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>

                            <div className="relative">
                                <span className="inline-block px-3 py-1 bg-olive-100 text-olive-700 text-xs font-bold rounded-full mb-3">
                                    {project.code}
                                </span>
                                <h3 className="text-xl font-bold text-neutral-900 mb-2">{project.name}</h3>
                                <p className="text-neutral-500 text-sm line-clamp-2 mb-6">Proyecto activo gestionado por nuestro equipo.</p>

                                <div className="flex items-center gap-4 text-sm text-neutral-600">
                                    <span className="flex items-center gap-1"><CheckSquare size={16} /> {project._count.tasks} Tareas</span>
                                    <span className="flex items-center gap-1"><FileText size={16} /> {project._count.documents} Docs</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {clientData?.projects.length === 0 && (
                        <div className="col-span-2 p-12 text-center bg-neutral-50 rounded-2xl border border-dashed border-neutral-300">
                            <p className="text-neutral-500">No tienes proyectos activos asignados.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
