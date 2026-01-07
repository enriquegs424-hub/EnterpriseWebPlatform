'use client';

import { useFormStatus } from 'react-dom';
import { authenticate } from '@/app/lib/actions';
import { useActionState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginForm() {
    const [errorMessage, dispatch] = useActionState(authenticate, undefined);

    return (
        <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            action={dispatch}
            className="space-y-5"
        >
            <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5" htmlFor="email">
                    Correo Electrónico
                </label>
                <input
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all placeholder:text-neutral-400 text-neutral-900"
                    id="email"
                    type="email"
                    name="email"
                    placeholder="nombre@mep-projects.com"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-1.5" htmlFor="password">
                    Contraseña
                </label>
                <input
                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all placeholder:text-neutral-400 text-neutral-900"
                    id="password"
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    minLength={6}
                />
            </div>

            {errorMessage && (
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-3 bg-error-50 text-error-700 text-sm rounded-xl border border-error-100 flex items-center space-x-2"
                >
                    <AlertCircle size={16} />
                    <span>{errorMessage}</span>
                </motion.div>
            )}

            <LoginButton />
        </motion.form>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            className="w-full flex items-center justify-center py-3 px-4 bg-olive-600 hover:bg-olive-700 text-white font-bold rounded-xl shadow-lg shadow-olive-600/20 transition-all active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
            type="submit"
            aria-disabled={pending}
            disabled={pending}
        >
            {pending ? (
                <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Entrando...
                </>
            ) : (
                <>
                    Acceder al Panel
                    <ArrowRight className="w-5 h-5 ml-2" />
                </>
            )}
        </button>
    );
}
