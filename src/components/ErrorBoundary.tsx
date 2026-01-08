'use client';

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null
        };
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
            errorInfo: null
        };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo
        });

        // Send error to logging service (implement when ready)
        // logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null
        });
    };

    handleGoHome = () => {
        window.location.href = '/dashboard';
    };

    render() {
        if (this.state.hasError) {
            // Use custom fallback if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center p-6">
                    <div className="max-w-2xl w-full">
                        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 border border-neutral-200">
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 bg-error-100 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="w-10 h-10 text-error-600" />
                                </div>
                            </div>

                            {/* Title */}
                            <h1 className="text-3xl font-bold text-center text-neutral-900 mb-4">
                                ¡Algo salió mal!
                            </h1>

                            {/* Description */}
                            <p className="text-center text-neutral-600 mb-8">
                                Lo sentimos, se ha producido un error inesperado.
                                Nuestro equipo ha sido notificado automáticamente.
                            </p>

                            {/* Error Details (only in development) */}
                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <div className="mb-8 p-6 bg-neutral-50 rounded-xl border border-neutral-200">
                                    <h3 className="font-bold text-sm text-neutral-900 mb-2">
                                        Detalles del Error (Solo en Desarrollo):
                                    </h3>
                                    <p className="text-xs text-error-600 font-mono mb-2">
                                        {this.state.error.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <details className="mt-4">
                                            <summary className="cursor-pointer text-xs font-bold text-neutral-700 hover:text-neutral-900">
                                                Stack Trace
                                            </summary>
                                            <pre className="mt-2 text-xs text-neutral-600 whitespace-pre-wrap font-mono overflow-auto max-h-64">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <button
                                    onClick={this.handleReset}
                                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-olive-600 hover:bg-olive-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                                >
                                    <RefreshCw size={20} />
                                    <span>Intentar de Nuevo</span>
                                </button>

                                <button
                                    onClick={this.handleGoHome}
                                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-white hover:bg-neutral-50 text-neutral-900 font-bold rounded-xl transition-all border-2 border-neutral-200"
                                >
                                    <Home size={20} />
                                    <span>Ir al Dashboard</span>
                                </button>
                            </div>

                            {/* Help Text */}
                            <p className="text-center text-sm text-neutral-500 mt-8">
                                Si el problema persiste, contacta con el administrador del sistema.
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
