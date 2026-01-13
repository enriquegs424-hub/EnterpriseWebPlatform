'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';

interface Project {
    id: string;
    code: string;
    name: string;
}

interface FormData {
    projectId: string;
    date: string;
    hours: string;
    startTime?: string;
    endTime?: string;
    notes?: string;
    billable: boolean;
}

interface AdvancedTimeEntryFormProps {
    projects: Project[];
    initialData?: Partial<FormData>;
    onSubmit: (data: FormData) => Promise<{ success?: boolean; error?: string; warnings?: string[] }>;
    onCancel?: () => void;
    mode?: 'create' | 'edit';
}

export default function AdvancedTimeEntryForm({
    projects,
    initialData,
    onSubmit,
    onCancel,
    mode = 'create'
}: AdvancedTimeEntryFormProps) {
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState<FormData>({
        projectId: initialData?.projectId || '',
        date: initialData?.date || today,
        hours: initialData?.hours || '',
        startTime: initialData?.startTime || '',
        endTime: initialData?.endTime || '',
        notes: initialData?.notes || '',
        billable: initialData?.billable !== undefined ? initialData.billable : true
    });

    const [useTimeRange, setUseTimeRange] = useState(!!(initialData?.startTime && initialData?.endTime));
    const [calculatedHours, setCalculatedHours] = useState<number | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-calculate hours from time range
    useEffect(() => {
        if (useTimeRange && formData.startTime && formData.endTime) {
            const start = formData.startTime.split(':').map(Number);
            const end = formData.endTime.split(':').map(Number);

            const startMinutes = start[0] * 60 + start[1];
            const endMinutes = end[0] * 60 + end[1];

            let totalMinutes = endMinutes - startMinutes;
            if (totalMinutes < 0) {
                totalMinutes += 24 * 60; // Handle overnight
            }

            const hours = totalMinutes / 60;
            setCalculatedHours(hours);
            setFormData(prev => ({ ...prev, hours: hours.toFixed(2) }));
        } else {
            setCalculatedHours(null);
        }
    }, [formData.startTime, formData.endTime, useTimeRange]);

    const handleChange = (field: keyof FormData, value: string | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrors([]);
        setWarnings([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors([]);
        setWarnings([]);
        setIsSubmitting(true);

        try {
            // Client-side validation
            if (!formData.projectId) {
                setErrors(['Debe seleccionar un proyecto']);
                setIsSubmitting(false);
                return;
            }

            if (!formData.date) {
                setErrors(['Debe seleccionar una fecha']);
                setIsSubmitting(false);
                return;
            }

            const hours = parseFloat(formData.hours);
            if (isNaN(hours) || hours <= 0 || hours > 24) {
                setErrors(['Las horas deben estar entre 0.1 y 24']);
                setIsSubmitting(false);
                return;
            }

            if (useTimeRange && (!formData.startTime || !formData.endTime)) {
                setErrors(['Debe especificar hora de inicio y fin']);
                setIsSubmitting(false);
                return;
            }

            // Submit
            const result = await onSubmit({
                ...formData,
                startTime: useTimeRange ? formData.startTime : undefined,
                endTime: useTimeRange ? formData.endTime : undefined
            });

            if (result.error) {
                setErrors([result.error]);
            } else if (result.success) {
                if (result.warnings && result.warnings.length > 0) {
                    setWarnings(result.warnings);
                }
                // Reset form on success if creating
                if (mode === 'create') {
                    setFormData({
                        projectId: '',
                        date: today,
                        hours: '',
                        startTime: '',
                        endTime: '',
                        notes: '',
                        billable: true
                    });
                }
            }
        } catch (err: any) {
            setErrors([err.message || 'Error al guardar la entrada']);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-800 p-6 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-sm">
            <div className="space-y-4">
                {/* Project Selection */}
                <div>
                    <label htmlFor="projectId" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Proyecto *
                    </label>
                    <select
                        id="projectId"
                        value={formData.projectId}
                        onChange={(e) => handleChange('projectId', e.target.value)}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-neutral-100"
                        required
                        disabled={isSubmitting}
                    >
                        <option value="">Seleccionar proyecto...</option>
                        {projects.map(project => (
                            <option key={project.id} value={project.id}>
                                {project.code} · {project.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date */}
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Fecha *
                    </label>
                    <input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleChange('date', e.target.value)}
                        max={today}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-neutral-100"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                {/* Time Range Toggle */}
                <div className="flex items-center space-x-2">
                    <input
                        id="useTimeRange"
                        type="checkbox"
                        checked={useTimeRange}
                        onChange={(e) => setUseTimeRange(e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                        disabled={isSubmitting}
                    />
                    <label htmlFor="useTimeRange" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Usar rango de horas (inicio - fin)
                    </label>
                </div>

                {/* Time Range or Manual Hours */}
                {useTimeRange ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Hora inicio *
                            </label>
                            <input
                                id="startTime"
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => handleChange('startTime', e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-neutral-100"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div>
                            <label htmlFor="endTime" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Hora fin *
                            </label>
                            <input
                                id="endTime"
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => handleChange('endTime', e.target.value)}
                                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-neutral-100"
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                ) : (
                    <div>
                        <label htmlFor="hours" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                            Horas *
                        </label>
                        <input
                            id="hours"
                            type="number"
                            step="0.25"
                            min="0.1"
                            max="24"
                            value={formData.hours}
                            onChange={(e) => handleChange('hours', e.target.value)}
                            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-neutral-100"
                            required
                            disabled={isSubmitting}
                            placeholder="8.0"
                        />
                    </div>
                )}

                {/* Calculated Hours Display */}
                {calculatedHours !== null && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            ⏱️ Total calculado: <strong>{calculatedHours.toFixed(2)} horas</strong>
                        </p>
                    </div>
                )}

                {/* Billable Toggle */}
                <div className="flex items-center space-x-2">
                    <input
                        id="billable"
                        type="checkbox"
                        checked={formData.billable}
                        onChange={(e) => handleChange('billable', e.target.checked)}
                        className="w-4 h-4 text-blue-600 border-neutral-300 rounded focus:ring-blue-500"
                        disabled={isSubmitting}
                    />
                    <label htmlFor="billable" className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Facturable (se incluirá en la facturación al cliente)
                    </label>
                </div>

                {/* Notes */}
                <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                        Notas
                    </label>
                    <textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => handleChange('notes', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 dark:text-neutral-100"
                        placeholder="Describe las tareas realizadas..."
                        disabled={isSubmitting}
                    />
                </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Errores:</p>
                    <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, idx) => (
                            <li key={idx} className="text-sm text-red-700 dark:text-red-400">{error}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-2">Advertencias:</p>
                    <ul className="list-disc list-inside space-y-1">
                        {warnings.map((warning, idx) => (
                            <li key={idx} className="text-sm text-yellow-700 dark:text-yellow-400">{warning}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-600 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Guardando...</span>
                        </>
                    ) : (
                        <span>{mode === 'create' ? 'Guardar entrada' : 'Actualizar entrada'}</span>
                    )}
                </button>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-700/50 border border-neutral-200 dark:border-neutral-600 rounded-lg">
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    💡 <strong>Consejo:</strong> Las entradas se guardan como borrador. Puedes editarlas durante las primeras 24 horas. Para facturarlas, debes enviarlas a aprobación desde tu dashboard de horas.
                </p>
            </div>
        </form>
    );
}
