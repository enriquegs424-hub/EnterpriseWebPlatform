'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    success: (title: string, message?: string, duration?: number) => void;
    error: (title: string, message?: string, duration?: number) => void;
    info: (title: string, message?: string, duration?: number) => void;
    warning: (title: string, message?: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, title: string, message?: string, duration = 5000) => {
        const id = Math.random().toString(36).substring(7);
        const newToast: Toast = { id, type, title, message, duration };

        setToasts((prev) => [...prev, newToast]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string, duration?: number) => {
        addToast('success', title, message, duration);
    }, [addToast]);

    const error = useCallback((title: string, message?: string, duration?: number) => {
        addToast('error', title, message, duration);
    }, [addToast]);

    const info = useCallback((title: string, message?: string, duration?: number) => {
        addToast('info', title, message, duration);
    }, [addToast]);

    const warning = useCallback((title: string, message?: string, duration?: number) => {
        addToast('warning', title, message, duration);
    }, [addToast]);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5" />;
            case 'error': return <AlertCircle className="w-5 h-5" />;
            case 'warning': return <AlertTriangle className="w-5 h-5" />;
            case 'info': return <Info className="w-5 h-5" />;
        }
    };

    const getStyles = (type: ToastType) => {
        switch (type) {
            case 'success': return 'bg-green-50 border-green-200 text-green-800';
            case 'error': return 'bg-red-50 border-red-200 text-red-800';
            case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
        }
    };

    return (
        <ToastContext.Provider value={{ success, error, info, warning }}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 right-4 z-[100] space-y-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, y: -20, x: 100 }}
                            animate={{ opacity: 1, y: 0, x: 0 }}
                            exit={{ opacity: 0, x: 100 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className={`pointer-events-auto w-96 max-w-full rounded-xl border-2 shadow-lg p-4 ${getStyles(toast.type)}`}
                        >
                            <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-0.5">
                                    {getIcon(toast.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm">{toast.title}</p>
                                    {toast.message && (
                                        <p className="text-sm mt-1 opacity-90">{toast.message}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => removeToast(toast.id)}
                                    className="flex-shrink-0 p-1 hover:bg-black/10 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}
