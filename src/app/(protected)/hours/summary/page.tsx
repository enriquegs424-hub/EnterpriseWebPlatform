'use client';

export default function YearlySummaryPage() {
    const year = new Date().getFullYear();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4 dark:text-white">Resumen Anual de Horas {year}</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-8 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400">
                    Vista de resumen anual en construcción
                </p>
            </div>
        </div>
    );
}
