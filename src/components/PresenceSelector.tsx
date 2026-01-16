'use client';

import { useState, useRef, useEffect } from 'react';
// Define locally until Prisma client is regenerated
export type PresenceStatus = 'AVAILABLE' | 'BUSY' | 'DO_NOT_DISTURB' | 'BE_RIGHT_BACK' | 'AWAY' | 'OFFLINE';
import {
    CheckCircle,
    Circle,
    MinusCircle,
    Clock,
    XCircle,
    ChevronRight,
    RotateCcw
} from 'lucide-react';
import { updatePresence, resetPresence, getMyPresence } from '@/app/(protected)/presence/actions';
import PresenceIndicator, { PRESENCE_LABELS } from './PresenceIndicator';

const PRESENCE_OPTIONS: { status: PresenceStatus; icon: any; color: string }[] = [
    { status: 'AVAILABLE', icon: CheckCircle, color: 'text-green-500' },
    { status: 'BUSY', icon: Circle, color: 'text-red-500' },
    { status: 'DO_NOT_DISTURB', icon: MinusCircle, color: 'text-red-500' },
    { status: 'BE_RIGHT_BACK', icon: Clock, color: 'text-yellow-500' },
    { status: 'AWAY', icon: Clock, color: 'text-yellow-500' },
    { status: 'OFFLINE', icon: XCircle, color: 'text-gray-400' },
];

const DURATION_OPTIONS = [
    { label: '30 minutos', value: 30 },
    { label: '1 hora', value: 60 },
    { label: '2 horas', value: 120 },
    { label: '4 horas', value: 240 },
    { label: 'Hoy', value: 480 },
];

interface PresenceSelectorProps {
    currentStatus?: PresenceStatus;
    onStatusChange?: (status: PresenceStatus) => void;
}

export default function PresenceSelector({
    currentStatus = 'OFFLINE',
    onStatusChange
}: PresenceSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showDuration, setShowDuration] = useState(false);
    const [selectedForDuration, setSelectedForDuration] = useState<PresenceStatus | null>(null);
    const [status, setStatus] = useState<PresenceStatus>(currentStatus);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Load current presence on mount
    useEffect(() => {
        const loadPresence = async () => {
            const presence = await getMyPresence();
            if (presence) {
                setStatus(presence.presenceStatus);
            }
        };
        loadPresence();
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowDuration(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleStatusSelect = async (newStatus: PresenceStatus) => {
        setStatus(newStatus);
        await updatePresence(newStatus);
        onStatusChange?.(newStatus);
        setIsOpen(false);
        setShowDuration(false);
    };

    const handleDurationSelect = async (minutes: number) => {
        if (selectedForDuration) {
            setStatus(selectedForDuration);
            await updatePresence(selectedForDuration, minutes);
            onStatusChange?.(selectedForDuration);
        }
        setIsOpen(false);
        setShowDuration(false);
        setSelectedForDuration(null);
    };

    const handleReset = async () => {
        await resetPresence();
        setStatus('AVAILABLE');
        onStatusChange?.('AVAILABLE');
        setIsOpen(false);
    };

    const openDurationMenu = (statusToSet: PresenceStatus) => {
        setSelectedForDuration(statusToSet);
        setShowDuration(true);
    };

    const currentOption = PRESENCE_OPTIONS.find(o => o.status === status) || PRESENCE_OPTIONS[0];

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors w-full"
            >
                <PresenceIndicator status={status} size="md" />
                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                    {PRESENCE_LABELS[status]}
                </span>
                <ChevronRight className={`w-4 h-4 ml-auto text-neutral-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 mt-1 w-56 bg-white dark:bg-neutral-800 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-700 py-2 z-50">
                    {!showDuration ? (
                        <>
                            {/* Status Options */}
                            {PRESENCE_OPTIONS.map(({ status: optStatus, icon: Icon, color }) => (
                                <button
                                    key={optStatus}
                                    onClick={() => handleStatusSelect(optStatus)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors ${status === optStatus ? 'bg-olive-50 dark:bg-olive-900/20' : ''
                                        }`}
                                >
                                    <Icon className={`w-4 h-4 ${color}`} />
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                        {PRESENCE_LABELS[optStatus]}
                                    </span>
                                </button>
                            ))}

                            <div className="border-t border-neutral-200 dark:border-neutral-700 my-2" />

                            {/* Duration Option */}
                            <button
                                onClick={() => openDurationMenu(status)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
                            >
                                <Clock className="w-4 h-4 text-neutral-500" />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Duración</span>
                                <ChevronRight className="w-4 h-4 ml-auto text-neutral-400" />
                            </button>

                            {/* Reset Option */}
                            <button
                                onClick={handleReset}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
                            >
                                <RotateCcw className="w-4 h-4 text-neutral-500" />
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">Restablecer estado</span>
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Duration Options */}
                            <button
                                onClick={() => setShowDuration(false)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                            >
                                <ChevronRight className="w-4 h-4 rotate-180" />
                                Volver
                            </button>
                            <div className="border-t border-neutral-200 dark:border-neutral-700 my-1" />
                            {DURATION_OPTIONS.map(({ label, value }) => (
                                <button
                                    key={value}
                                    onClick={() => handleDurationSelect(value)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors"
                                >
                                    <span className="text-sm text-neutral-700 dark:text-neutral-300">{label}</span>
                                </button>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
