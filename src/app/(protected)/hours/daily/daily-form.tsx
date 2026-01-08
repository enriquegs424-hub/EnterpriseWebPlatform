'use client';

import { useFormStatus } from 'react-dom';
import { submitTimeEntry } from '@/app/hours/actions';
import { useActionState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, BookOpen, HardHat, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function DailyTimeForm({ projects, selectedDate }: {
    projects: { id: string, code: string, name: string }[];
    selectedDate?: string;
}) {
    const [state, dispatch] = useActionState(submitTimeEntry, null);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (state?.success) {
            formRef.current?.reset();
        }
    }, [state]);

    return (
        <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden mb-8">
            <div className="bg-neutral-50 dark:bg-neutral-800/50 px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 flex items-center">
                    <Clock className="w-5 h-5 mr-3 text-olive-600 dark:text-olive-500" />
                    Registrar Jornada
                </h2>
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-white dark:bg-neutral-800 px-2 py-1 rounded-md border border-neutral-200 dark:border-neutral-700">
                    Nuevo Registro
                </span>
            </div>

            <div className="p-6">
                <AnimatePresence mode="wait">
                    {state?.error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-400 rounded-xl border border-error-100 dark:border-error-900 flex items-start space-x-3"
                        >
                            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-bold text-sm">Error en el registro</p>
                                <p className="text-xs opacity-90">{state.error}</p>
                            </div>
                        </motion.div>
                    )}
                    {state?.success && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mb-6 p-4 bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400 rounded-xl border border-success-100 dark:border-success-900 flex items-start space-x-3"
                        >
                            <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />
                            <div>
                                <p className="font-bold text-sm">Registro completado</p>
                                <p className="text-xs opacity-90">{state.message}</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form ref={formRef} action={dispatch} className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4">
                        <label className="flex items-center text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2" title="Fecha del registro de horas">
                            <Calendar size={14} className="mr-2 text-neutral-400" />
                            Fecha
                            <span className="ml-auto text-xs text-neutral-400 font-normal">Obligatorio</span>
                        </label>
                        <input
                            type="date"
                            name="date"
                            defaultValue={selectedDate || new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all hover:bg-white dark:hover:bg-neutral-700 dark:text-neutral-100"
                            required
                        />
                    </div>

                    <div className="md:col-span-3">
                        <label className="flex items-center text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2" title="Número de horas trabajadas (puede usar decimales)">
                            <Clock size={14} className="mr-2 text-neutral-400" />
                            Horas
                            <span className="ml-auto text-xs text-neutral-400 font-normal">0.5 - 24</span>
                        </label>
                        <input
                            type="number"
                            name="hours"
                            step="0.5"
                            min="0.5"
                            max="24"
                            defaultValue="8"
                            placeholder="8.0"
                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all hover:bg-white dark:hover:bg-neutral-700 dark:text-neutral-100"
                            required
                        />
                    </div>

                    <div className="md:col-span-5">
                        <label className="flex items-center text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2" title="Selecciona el código de proyecto">
                            <HardHat size={14} className="mr-2 text-neutral-400" />
                            Proyecto
                            <span className="ml-auto text-xs text-neutral-400 font-normal">Requerido</span>
                        </label>
                        <select
                            name="projectId"
                            className="w-full px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all appearance-none cursor-pointer hover:bg-white dark:hover:bg-neutral-700 dark:text-neutral-100"
                            required
                        >
                            <option value="">🔍 Seleccionar proyecto...</option>
                            {projects.map(p => (
                                <option key={p.id} value={p.id}>{p.code} · {p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-12">
                        <label className="flex items-center text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2" title="Describe brevemente las tareas realizadas (opcional)">
                            <BookOpen size={14} className="mr-2 text-neutral-400" />
                            Notas de Trabajo
                            <span className="ml-auto text-xs text-neutral-400 font-normal">Opcional</span>
                        </label>
                        <textarea
                            name="notes"
                            rows={3}
                            placeholder="Ej: Revisión de planos, reunión con cliente, desarrollo de cálculos estructurales..."
                            className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all resize-none hover:bg-white dark:hover:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-500"
                        ></textarea>
                    </div>

                    <div className="md:col-span-12 pt-2">
                        <SubmitButton />
                    </div>
                </form>
            </div>
        </div>
    );
}

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full md:w-auto px-8 py-3 bg-olive-600 hover:bg-olive-700 text-white font-bold rounded-xl shadow-lg shadow-olive-600/20 transition-all active:scale-[0.98] flex items-center justify-center disabled:opacity-70"
        >
            {pending ? (
                <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Guardando...
                </>
            ) : (
                'Guardar Registro Diario'
            )}
        </button>
    );
}
