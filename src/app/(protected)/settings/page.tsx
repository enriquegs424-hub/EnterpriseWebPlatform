'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, updateUserProfile, changePassword, updateUserPreferences } from './actions';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Bell, Palette, Save, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
    const { data: session, update: updateSession } = useSession();
    const [activeTab, setActiveTab] = useState('profile');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Profile form
    const [profileData, setProfileData] = useState({
        name: '',
        department: '',
        dailyWorkHours: 8,
        language: 'es',
        timezone: 'Europe/Madrid'
    });

    // Password form
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    // Preferences
    const [preferences, setPreferences] = useState({
        notifications: {
            weeklyReport: true,
            newProjects: true,
            dailyReminder: true
        },
        appearance: {
            theme: 'mep',
            compactSidebar: false,
            smoothAnimations: true
        }
    });

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await getCurrentUser();
        if (userData) {
            setUser(userData);
            setProfileData({
                name: userData.name,
                department: userData.department,
                dailyWorkHours: userData.dailyWorkHours,
                language: (userData.preferences as any)?.language || 'es',
                timezone: (userData.preferences as any)?.timezone || 'Europe/Madrid'
            });
            if (userData.preferences) {
                // Merge with defaults
                setPreferences(prev => ({ ...prev, ...(userData.preferences as any) }));
            }
        }
        setLoading(false);
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = await updateUserProfile(profileData);

        // Also save preferences (language/timezone)
        await updateUserPreferences({
            language: (profileData as any).language,
            timezone: (profileData as any).timezone
        });

        if (result.success) {
            setMessage({ type: 'success', text: result.message || 'Perfil actualizado' });
            await updateSession();
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: result.error || 'Error al actualizar' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
            setTimeout(() => setMessage(null), 3000);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
            setTimeout(() => setMessage(null), 3000);
            return;
        }

        const result = await changePassword({
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
        });

        if (result.success) {
            setMessage({ type: 'success', text: result.message || 'Contraseña actualizada' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'error', text: result.error || 'Error al cambiar contraseña' });
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const savePreferences = async (newPreferences: any) => {
        setPreferences(newPreferences);
        const result = await updateUserPreferences(newPreferences);
        if (result.success) {
            setMessage({ type: 'success', text: 'Preferencias guardadas' });
            setTimeout(() => setMessage(null), 2000);
        } else {
            setMessage({ type: 'error', text: 'Error al guardar preferencias' });
        }
    };

    const toggleNotification = (key: string) => {
        const newPrefs = {
            ...preferences,
            notifications: {
                ...preferences.notifications,
                [key]: !(preferences.notifications as any)[key]
            }
        };
        savePreferences(newPrefs);
    };

    const toggleAppearance = (key: string) => {
        const newPrefs = {
            ...preferences,
            appearance: {
                ...preferences.appearance,
                [key]: !(preferences.appearance as any)[key]
            }
        };
        savePreferences(newPrefs);
    };

    if (loading) return <div className="p-8 text-center text-neutral-500">Cargando configuración...</div>;

    const tabs = [
        { id: 'profile', label: 'Mi Perfil', icon: User },
        { id: 'password', label: 'Seguridad', icon: Lock },
        { id: 'notifications', label: 'Notificaciones', icon: Bell },
        { id: 'appearance', label: 'Apariencia', icon: Palette },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 border-l-4 border-olive-500 pl-4">Configuración</h1>
                <p className="text-neutral-500 mt-1 ml-5">Personaliza tu cuenta y preferencias</p>
            </div>

            <AnimatePresence mode="wait">
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`p-4 rounded-xl flex items-center space-x-3 ${message.type === 'success'
                            ? 'bg-success-50 text-success-700 border border-success-100'
                            : 'bg-error-50 text-error-700 border border-error-100'
                            }`}
                    >
                        {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="font-medium">{message.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-12 gap-6">
                {/* Tabs Sidebar */}
                <div className="col-span-3">
                    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all border-b border-neutral-100 last:border-b-0 ${activeTab === tab.id
                                    ? 'bg-olive-50 text-olive-700 font-bold border-l-4 border-l-olive-600'
                                    : 'text-neutral-600 hover:bg-neutral-50 border-l-4 border-l-transparent'
                                    }`}
                            >
                                <tab.icon size={18} />
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="col-span-9">
                    <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm p-6">
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center">
                                        <User className="w-5 h-5 mr-3 text-olive-600" />
                                        Información Personal
                                    </h2>

                                    <form onSubmit={handleProfileSubmit} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Nombre Completo</label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="w-full px-4 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-neutral-400 mt-1">El email no se puede modificar</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Departamento</label>
                                                <select
                                                    value={profileData.department}
                                                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                                                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all"
                                                >
                                                    <option value="ENGINEERING">Ingeniería</option>
                                                    <option value="ARCHITECTURE">Arquitectura</option>
                                                    <option value="ADMINISTRATION">Administración</option>
                                                    <option value="OTHER">Otro</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Horas Diarias</label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min="1"
                                                    max="24"
                                                    value={profileData.dailyWorkHours}
                                                    onChange={(e) => setProfileData({ ...profileData, dailyWorkHours: parseFloat(e.target.value) })}
                                                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Idioma</label>
                                                <select
                                                    value={(profileData as any).language || 'es'}
                                                    onChange={(e) => setProfileData({ ...profileData, language: e.target.value } as any)}
                                                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all"
                                                >
                                                    <option value="es">Español</option>
                                                    <option value="en">English</option>
                                                    <option value="fr">Français</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-neutral-700 mb-2">Zona Horaria</label>
                                                <select
                                                    value={(profileData as any).timezone || 'Europe/Madrid'}
                                                    onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value } as any)}
                                                    className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all"
                                                >
                                                    <option value="Europe/Madrid">Madrid (CET/CEST)</option>
                                                    <option value="Europe/London">London (GMT/BST)</option>
                                                    <option value="America/New_York">New York (EST/EDT)</option>
                                                    <option value="UTC">UTC</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                className="flex items-center space-x-2 bg-olive-600 hover:bg-olive-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-olive-600/20"
                                            >
                                                <Save size={18} />
                                                <span>Guardar Cambios</span>
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {activeTab === 'password' && (
                                <motion.div
                                    key="password"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center">
                                        <Lock className="w-5 h-5 mr-3 text-olive-600" />
                                        Cambiar Contraseña
                                    </h2>

                                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Contraseña Actual</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    className="w-full px-4 py-2.5 pr-12 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Nueva Contraseña</label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all"
                                                required
                                                minLength={6}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-neutral-700 mb-2">Confirmar Nueva Contraseña</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-4 focus:ring-olive-500/10 focus:border-olive-500 outline-none transition-all"
                                                required
                                                minLength={6}
                                            />
                                        </div>

                                        <div className="pt-4">
                                            <button
                                                type="submit"
                                                className="flex items-center space-x-2 bg-olive-600 hover:bg-olive-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-olive-600/20"
                                            >
                                                <Lock size={18} />
                                                <span>Actualizar Contraseña</span>
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            )}

                            {activeTab === 'notifications' && (
                                <motion.div
                                    key="notifications"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold text-neutral-900 mb-2 flex items-center">
                                            <Bell className="w-5 h-5 mr-3 text-olive-600" />
                                            Preferencias de Notificación
                                        </h2>
                                        <p className="text-sm text-neutral-500">Controla cómo y cuándo recibes avisos del sistema.</p>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { id: 'weeklyReport', label: 'Resumen semanal de horas', desc: 'Recibe un correo todos los lunes con tu actividad.' },
                                            { id: 'newProjects', label: 'Nuevos proyectos asignados', desc: 'Aviso inmediato cuando se te asigne un nuevo código.' },
                                            { id: 'dailyReminder', label: 'Recordatorio de registro diario', desc: 'Si olvidas registrar tus horas antes de las 18:00.' },
                                        ].map((n) => (
                                            <div key={n.id} className="flex items-start justify-between p-4 bg-neutral-50 rounded-2xl border border-neutral-100 hover:border-olive-200 transition-colors">
                                                <div>
                                                    <p className="font-bold text-neutral-900 text-sm">{n.label}</p>
                                                    <p className="text-xs text-neutral-500 mt-0.5">{n.desc}</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={(preferences.notifications as any)[n.id]}
                                                        onChange={() => toggleNotification(n.id)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-olive-600"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'appearance' && (
                                <motion.div
                                    key="appearance"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold text-neutral-900 mb-2 flex items-center">
                                            <Palette className="w-5 h-5 mr-3 text-olive-600" />
                                            Interfaz y Estilo
                                        </h2>
                                        <p className="text-sm text-neutral-500">Personaliza tu experiencia visual en la plataforma.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-olive-50 rounded-3xl border-2 border-olive-500 shadow-lg shadow-olive-600/5 cursor-pointer flex flex-col items-center text-center">
                                            <div className="w-12 h-12 bg-olive-600 rounded-2xl mb-3 flex items-center justify-center text-white shadow-inner">
                                                <Palette size={24} />
                                            </div>
                                            <p className="font-black text-olive-900 text-sm">Tema MEP</p>
                                            <p className="text-[10px] text-olive-600/70 font-bold uppercase tracking-widest mt-1">Activo por defecto</p>
                                        </div>
                                        <div className="p-4 bg-neutral-50 rounded-3xl border border-neutral-200 grayscale opacity-40 cursor-not-allowed flex flex-col items-center text-center">
                                            <div className="w-12 h-12 bg-neutral-300 rounded-2xl mb-3" />
                                            <p className="font-bold text-neutral-400 text-sm">Modo Oscuro</p>
                                            <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Próximamente</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-neutral-100">
                                        <div className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-bold text-neutral-900 text-sm">Barra Lateral Compacta</p>
                                                <p className="text-xs text-neutral-500">Maximiza el espacio de trabajo ocultando textos.</p>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={preferences.appearance.compactSidebar}
                                                    onChange={() => toggleAppearance('compactSidebar')}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-olive-600"></div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-bold text-neutral-900 text-sm">Animaciones Fluidas</p>
                                                <p className="text-xs text-neutral-500">Habilitar transiciones suaves entre páginas.</p>
                                            </div>
                                            <div className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={preferences.appearance.smoothAnimations}
                                                    onChange={() => toggleAppearance('smoothAnimations')}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-olive-600"></div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}
