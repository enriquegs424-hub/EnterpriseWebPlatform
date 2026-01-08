import { getDailyEntries, getActiveProjects } from "@/app/hours/actions";
import DailyTimeForm from "./daily-form";
import { auth } from "@/auth";
import { Clock, Calendar, Trash2, Edit, AlertCircle } from "lucide-react";
import DeleteButton from "@/app/(protected)/hours/daily/delete-button";
import EditButton from "@/app/(protected)/hours/daily/edit-button";

export default async function DailyPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
    const session = await auth();
    const params = await searchParams;
    const selectedDate = params.date || new Date().toISOString().split('T')[0];
    const projects = await getActiveProjects();
    const entries = await getDailyEntries(selectedDate);

    const totalHours = entries.reduce((sum: number, e: { hours: number }) => sum + e.hours, 0);

    // @ts-ignore
    const isAdmin = session?.user?.role === 'ADMIN';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center">
                        <Clock className="w-6 h-6 mr-3 text-olive-600 dark:text-olive-500" />
                        Control Diario de Horas
                    </h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Registra tus horas de trabajo por proyecto</p>
                </div>
                <div className="bg-white dark:bg-neutral-900 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-olive-600 dark:text-olive-500" />
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{new Date(selectedDate).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>

            <DailyTimeForm projects={projects} selectedDate={selectedDate} />

            {/* Lista de entradas del día */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="bg-gradient-to-r from-neutral-50 to-olive-50/20 dark:from-neutral-900 dark:to-olive-900/10 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                    <h3 className="font-bold text-neutral-900 dark:text-neutral-100">Registros del día</h3>
                    <div className="flex items-center space-x-2 text-sm">
                        <span className="text-neutral-600 dark:text-neutral-400">Total:</span>
                        <span className="font-bold text-olive-700 dark:text-olive-400 text-lg">{totalHours}h</span>
                    </div>
                </div>

                {entries.length === 0 ? (
                    <div className="p-12 text-center text-neutral-400 dark:text-neutral-600">
                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No hay registros para este día</p>
                        <p className="text-sm mt-1">Usa el formulario de arriba para añadir tus horas</p>
                    </div>
                ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                        {entries.map((e: any) => {
                            const createdAt = new Date(e.createdAt);
                            const now = new Date();
                            const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
                            const canEdit = isAdmin || hoursSinceCreation < 24;

                            return (
                                <div key={e.id} className="px-6 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3">
                                                <span className="font-mono text-sm text-olive-600 dark:text-olive-400 font-bold bg-olive-50 dark:bg-olive-900/20 px-2 py-1 rounded">
                                                    {e.project.code}
                                                </span>
                                                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{e.project.name}</span>
                                            </div>
                                            {e.notes && (
                                                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 ml-16">{e.notes}</p>
                                            )}
                                            <div className="flex items-center space-x-4 mt-2 ml-16 text-xs text-neutral-400 dark:text-neutral-500">
                                                <span>Registrado hace {Math.floor(hoursSinceCreation)}h</span>
                                                {!canEdit && !isAdmin && (
                                                    <span className="flex items-center text-error-500 dark:text-error-400">
                                                        <AlertCircle size={12} className="mr-1" />
                                                        No editable (límite 24h superado)
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                            <span className="text-2xl font-bold text-olive-700 dark:text-olive-500">{e.hours}h</span>
                                            {canEdit && (
                                                <div className="flex items-center space-x-2">
                                                    <EditButton entry={e} projects={projects} />
                                                    <DeleteButton entryId={e.id} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
