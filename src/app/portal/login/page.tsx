'use client';

import { useState } from 'react';
import { loginClient } from '@/app/portal/actions';
import { ArrowRight, Loader2, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export default function PortalLoginPage() {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await loginClient(code);
        } catch (error) {
            toast.error('Acceso Denegado', 'Código inválido. Verifique con su gestor.');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-xl border border-neutral-100">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-olive-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-olive-600" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-neutral-900">Portal de Clientes</h1>
                    <p className="text-neutral-500 mt-2">Introduce tu código de acceso para ver tus proyectos.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            placeholder="Código de Acceso (ej: A1B2-C3D4)"
                            className="w-full px-5 py-4 text-center text-xl font-mono tracking-widest border-2 border-neutral-200 rounded-xl focus:border-olive-500 focus:ring-4 focus:ring-olive-500/20 transition-all outline-none"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-neutral-900 text-white font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center group disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Acceder al Portal'}
                        {!isLoading && <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />}
                    </button>
                    <p className="text-xs text-center text-neutral-400 mt-6">
                        Este área es exclusiva para clientes autorizados de MEP Projects.
                    </p>
                </form>
            </div>
        </div>
    );
}
