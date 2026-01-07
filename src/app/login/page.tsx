import LoginForm from "./login-form";
import Image from "next/image";
import * as motion from "framer-motion/client";

export default function LoginPage() {
    return (
        <main className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="bg-white p-8 rounded-3xl shadow-2xl shadow-neutral-200/50 border border-neutral-100 overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-olive-600" />

                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-olive-50 rounded-2xl mb-6 border border-olive-100/50 shadow-inner">
                            <Image src="/M_max.png" alt="MEP Logo" width={48} height={48} className="object-contain" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-neutral-900 tracking-tight">MEP-Projects</h1>
                        <p className="text-neutral-500 mt-2 font-medium">Gestión de Proyectos e Ingeniería</p>
                    </div>

                    <LoginForm />
                </div>

                <p className="mt-8 text-center text-neutral-400 text-xs font-medium uppercase tracking-widest">
                    © 2026 MEP Projects · Ingeniería de Excelencia
                </p>
            </motion.div>
        </main>
    );
}
