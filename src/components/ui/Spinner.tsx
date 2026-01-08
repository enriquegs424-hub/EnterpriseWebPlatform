import { Loader2 } from 'lucide-react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
    text?: string;
}

export default function Spinner({ size = 'md', className = '', text }: SpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8',
        xl: 'w-12 h-12'
    };

    return (
        <div className={`flex flex-col items-center justify-center ${className}`}>
            <Loader2 className={`${sizeClasses[size]} animate-spin text-olive-600`} />
            {text && (
                <p className="mt-2 text-sm text-neutral-600 font-medium">{text}</p>
            )}
        </div>
    );
}

// Full page loader
export function PageLoader({ text = 'Cargando...' }: { text?: string }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50">
            <Spinner size="xl" text={text} />
        </div>
    );
}

// Inline loader for buttons
export function ButtonSpinner() {
    return <Loader2 className="w-4 h-4 animate-spin" />;
}
