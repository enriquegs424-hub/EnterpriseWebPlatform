'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Global Error:', error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="h-screen w-full flex flex-col items-center justify-center bg-neutral-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-neutral-200 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                            <AlertCircle className="w-8 h-8 text-red-500" />
                        </div>

                        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Algo salió mal</h2>
                        <p className="text-neutral-500 mb-8">
                            Ha ocurrido un error inesperado en la aplicación. Nuestro equipo ha sido notificado.
                        </p>

                        <div className="bg-neutral-50 rounded-lg p-4 mb-8 text-left overflow-auto max-h-40">
                            <code className="text-xs text-neutral-600 font-mono">
                                {error.name}: {error.message}
                            </code>
                        </div>

                        <button
                            onClick={() => reset()}
                            className="w-full py-3 px-4 bg-olive-600 text-white rounded-lg hover:bg-olive-700 font-bold transition-all shadow-lg shadow-olive-600/20"
                        >
                            Intentar de nuevo
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
