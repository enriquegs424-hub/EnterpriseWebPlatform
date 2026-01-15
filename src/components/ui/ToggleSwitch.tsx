'use client';

interface ToggleSwitchProps {
    checked: boolean;
    onChange: () => void;
    disabled?: boolean;
}

export default function ToggleSwitch({ checked, onChange, disabled = false }: ToggleSwitchProps) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={onChange}
            disabled={disabled}
            className={`
                relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-olive-500 focus:ring-offset-2
                ${checked ? 'bg-olive-600' : 'bg-neutral-200 dark:bg-neutral-700'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
        >
            <span
                aria-hidden="true"
                className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                    transition duration-200 ease-in-out
                    ${checked ? 'translate-x-5' : 'translate-x-0'}
                `}
            />
        </button>
    );
}
