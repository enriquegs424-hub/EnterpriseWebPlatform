'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TimerProps {
    onSave?: (hours: number, projectId: string, notes: string) => void;
    projects?: Array<{ id: string; code: string; name: string; }>;
}

export default function Timer({ onSave, projects = [] }: TimerProps) {
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [seconds, setSeconds] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState('');
    const [notes, setNotes] = useState('');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Cargar estado del timer desde localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('timerState');
        if (savedState) {
            const { isRunning: savedRunning, seconds: savedSeconds, startTime } = JSON.parse(savedState);
            if (savedRunning) {
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                setSeconds(savedSeconds + elapsed);
                setIsRunning(true);
            } else {
                setSeconds(savedSeconds);
            }
        }
    }, []);

    // Guardar estado en localStorage
    useEffect(() => {
        if (isRunning) {
            localStorage.setItem('timerState', JSON.stringify({
                isRunning: true,
                seconds,
                startTime: Date.now() - (seconds * 1000)
            }));
        } else {
            localStorage.setItem('timerState', JSON.stringify({
                isRunning: false,
                seconds,
                startTime: null
            }));
        }
    }, [isRunning, seconds]);

    // Timer logic
    useEffect(() => {
        if (isRunning && !isPaused) {
            intervalRef.current = setInterval(() => {
                setSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isRunning, isPaused]);

    const formatTime = (totalSeconds: number) => {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleStart = () => {
        setIsRunning(true);
        setIsPaused(false);
    };

    const handlePause = () => {
        setIsPaused(!isPaused);
    };

    const handleStop = () => {
        if (seconds > 0) {
            setShowModal(true);
        }
    };

    const handleSave = async () => {
        const hours = parseFloat((seconds / 3600).toFixed(2));
        if (onSave && selectedProject) {
            await onSave(hours, selectedProject, notes);
        }
        // Reset timer
        setIsRunning(false);
        setIsPaused(false);
        setSeconds(0);
        setShowModal(false);
        setSelectedProject('');
        setNotes('');
        localStorage.removeItem('timerState');
    };

    const handleCancel = () => {
        setShowModal(false);
    };

    const handleDiscard = () => {
        setIsRunning(false);
        setIsPaused(false);
        setSeconds(0);
        setShowModal(false);
        localStorage.removeItem('timerState');
    };

    return (
        <>
            {/* Timer Display */}
            <div className="flex items-center space-x-2">
                {isRunning && (
                    <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center space-x-2 bg-olive-50 px-4 py-2 rounded-full border-2 border-olive-200"
                    >
                        <Clock className={`w-4 h-4 text-olive-600 ${!isPaused ? 'animate-pulse' : ''}`} />
                        <span className="font-mono font-bold text-olive-900 text-sm">
                            {formatTime(seconds)}
                        </span>
                    </motion.div>
                )}

                {/* Control Buttons */}
                <div className="flex items-center space-x-1">
                    {!isRunning ? (
                        <button
                            onClick={handleStart}
                            className="p-2 bg-olive-600 hover:bg-olive-700 text-white rounded-full transition-all shadow-lg shadow-olive-600/20"
                            title="Iniciar temporizador"
                        >
                            <Play size={18} fill="currentColor" />
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={handlePause}
                                className={`p-2 rounded-full transition-all ${isPaused
                                    ? 'bg-info-600 hover:bg-info-700 text-white'
                                    : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-700'
                                    }`}
                                title={isPaused ? 'Reanudar' : 'Pausar'}
                            >
                                {isPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} />}
                            </button>
                            <button
                                onClick={handleStop}
                                className="p-2 bg-error-600 hover:bg-error-700 text-white rounded-full transition-all"
                                title="Detener y guardar"
                            >
                                <Square size={18} fill="currentColor" />
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Save Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-neutral-200"
                        >
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-olive-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-8 h-8 text-olive-600" />
                                </div>
                                <h3 className="text-2xl font-black text-neutral-900 mb-2">Guardar Tiempo</h3>
                                <p className="text-neutral-500">
                                    Tiempo registrado: <span className="font-bold text-olive-600">{formatTime(seconds)}</span>
                                    {' '}({(seconds / 3600).toFixed(2)} horas)
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 mb-2">
                                        Proyecto *
                                    </label>
                                    <select
                                        value={selectedProject}
                                        onChange={(e) => setSelectedProject(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none"
                                        required
                                    >
                                        <option value="">Seleccionar proyecto...</option>
                                        {projects.map(project => (
                                            <option key={project.id} value={project.id}>
                                                {project.code} - {project.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-neutral-700 mb-2">
                                        Notas (opcional)
                                    </label>
                                    <textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none resize-none"
                                        placeholder="¿En qué trabajaste?"
                                    />
                                </div>
                            </div>

                            <div className="flex space-x-3 mt-6">
                                <button
                                    onClick={handleDiscard}
                                    className="flex-1 px-6 py-3 border-2 border-error-200 text-error-600 rounded-xl hover:bg-error-50 font-bold transition-all"
                                >
                                    Descartar
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="flex-1 px-6 py-3 border-2 border-neutral-200 text-neutral-600 rounded-xl hover:bg-neutral-50 font-bold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={!selectedProject}
                                    className="flex-1 px-6 py-3 bg-olive-600 text-white rounded-xl hover:bg-olive-700 font-bold transition-all shadow-lg shadow-olive-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Guardar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
