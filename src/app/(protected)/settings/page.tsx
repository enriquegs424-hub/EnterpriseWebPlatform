'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser, updateUserProfile, changePassword, updateUserPreferences, getDepartments, getTimezones } from './actions';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Bell, Palette, Save, AlertCircle, CheckCircle2, Eye, EyeOff, Sun, Moon, Clock, Globe, Accessibility, Briefcase, Phone, FileText } from 'lucide-react';
import { useTheme } from '@/providers/ThemeProvider';

export default function SettingsPage() {
    const { data: session, update: updateSession } = useSession();
    const { theme, setTheme } = useTheme();
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
        timezone: 'Europe/Madrid',
        image: '',
        phone: '',
        jobTitle: '',
        bio: ''
    });

    // Departments and timezones from server
    const [departments, setDepartments] = useState<{ value: string, label: string }[]>([]);
    const [timezones, setTimezones] = useState<{ value: string, label: string }[]>([]);

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
            dailyReminder: true,
            taskComments: true,
            chatMessages: true,
            mentions: true
        },
        appearance: {
            theme: 'system',
            compactSidebar: false,
            smoothAnimations: true,
            density: 'normal',
            fontSize: 'medium'
        },
        workSchedule: {
            weekStart: 'monday',
            timeFormat: '24h',
            dateFormat: 'DD/MM/YYYY'
        },
        accessibility: {
            highContrast: false,
            reduceMotion: false,
            screenReader: false
        }
    });

    useEffect(() => {
        loadUser();
        loadOptions();
    }, []);

    const loadOptions = async () => {
        const [depts, tzs] = await Promise.all([getDepartments(), getTimezones()]);
        setDepartments(depts);
        setTimezones(tzs);
    };

    const loadUser = async () => {
        const userData = await getCurrentUser();
        if (userData) {
            setUser(userData);
            const prefs = userData.preferences as any || {};
            setProfileData({
                name: userData.name,
                department: userData.department,
                dailyWorkHours: userData.dailyWorkHours,
                language: prefs.language || 'es',
                timezone: prefs.timezone || 'Europe/Madrid',
                image: userData.image || '',
                phone: prefs.phone || '',
                jobTitle: prefs.jobTitle || '',
                bio: prefs.bio || ''
            });
            if (userData.preferences) {
                setPreferences(prev => ({ ...prev, ...prefs }));
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
        { id: 'schedule', label: 'Horarios', icon: Clock },
        { id: 'notifications', label: 'Notificaciones', icon: Bell },
        { id: 'appearance', label: 'Apariencia', icon: Palette },
        { id: 'accessibility', label: 'Accesibilidad', icon: Accessibility },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-theme-primary border-l-4 border-olive-500 pl-4">Configuración</h1>
                <p className="text-theme-tertiary mt-1 ml-5">Personaliza tu cuenta y preferencias</p>
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
                    <div className="card-lg overflow-hidden">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all border-b border-theme-secondary last:border-b-0 ${activeTab === tab.id
                                    ? 'accent-bg accent-text font-bold border-l-4 border-l-olive-600'
                                    : 'sidebar-item border-l-4 border-l-transparent'
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
                    <div className="card-lg p-6">
                        <AnimatePresence mode="wait">
                            {activeTab === 'profile' && (
                                <motion.div
                                    key="profile"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                >
                                    <h2 className="text-xl font-bold text-theme-primary mb-6 flex items-center">
                                        <User className="w-5 h-5 mr-3 text-olive-600" />
                                        Información Personal
                                    </h2>

                                    <form onSubmit={handleProfileSubmit} className="space-y-8">
                                        {/* Avatar Section */}
                                        <div className="flex items-center gap-6 pb-6 border-b border-theme-secondary">
                                            <div className="relative group">
                                                <div className="w-24 h-24 rounded-full overflow-hidden surface-tertiary border-4 border-theme-primary shadow-lg flex items-center justify-center">
                                                    {(profileData as any).image ? (
                                                        <img src={(profileData as any).image} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <User size={40} className="text-theme-muted" />
                                                    )}
                                                </div>
                                                <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
                                                    <Palette size={20} />
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0];
                                                            if (!file) return;

                                                            const formData = new FormData();
                                                            formData.append('file', file);

                                                            try {
                                                                // Optimistic preview
                                                                const reader = new FileReader();
                                                                reader.onload = (ev) => setProfileData(prev => ({ ...prev, image: ev.target?.result as string }));
                                                                reader.readAsDataURL(file);

                                                                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                                                if (res.ok) {
                                                                    const json = await res.json();
                                                                    setProfileData(prev => ({ ...prev, image: json.url }));
                                                                }
                                                            } catch (err) {
                                                                // Handle error
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-theme-primary">Foto de Perfil</h3>
                                                <p className="text-sm text-theme-tertiary">Haz clic en la imagen para cambiarla.</p>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-theme-secondary mb-2">Nombre Completo</label>
                                            <input
                                                type="text"
                                                value={profileData.name}
                                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                                className="w-full input-base"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-theme-secondary mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={user?.email || ''}
                                                disabled
                                                className="w-full input-base opacity-60 cursor-not-allowed"
                                            />
                                            <p className="text-xs text-theme-muted mt-1">El email no se puede modificar</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-theme-secondary mb-2">Departamento</label>
                                                <select
                                                    value={profileData.department}
                                                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                                                    className="w-full input-base"
                                                >
                                                    {departments.map(dept => (
                                                        <option key={dept.value} value={dept.value}>{dept.label}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-theme-secondary mb-2">Horas Diarias</label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min="1"
                                                    max="24"
                                                    value={profileData.dailyWorkHours}
                                                    onChange={(e) => setProfileData({ ...profileData, dailyWorkHours: parseFloat(e.target.value) })}
                                                    className="w-full input-base"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-theme-secondary mb-2">
                                                    <Phone size={14} className="inline mr-1" />
                                                    Teléfono
                                                </label>
                                                <input
                                                    type="tel"
                                                    value={profileData.phone}
                                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                                    className="w-full input-base"
                                                    placeholder="+34 600 000 000"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-theme-secondary mb-2">
                                                    <Briefcase size={14} className="inline mr-1" />
                                                    Cargo / Puesto
                                                </label>
                                                <input
                                                    type="text"
                                                    value={profileData.jobTitle}
                                                    onChange={(e) => setProfileData({ ...profileData, jobTitle: e.target.value })}
                                                    className="w-full input-base"
                                                    placeholder="Ingeniero Senior"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-theme-secondary mb-2">
                                                <FileText size={14} className="inline mr-1" />
                                                Bio / Descripción
                                            </label>
                                            <textarea
                                                value={profileData.bio}
                                                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                                className="w-full input-base min-h-[100px] resize-none"
                                                placeholder="Cuéntanos un poco sobre ti..."
                                                maxLength={500}
                                            />
                                            <p className="text-xs text-theme-muted mt-1">{profileData.bio.length}/500 caracteres</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-theme-secondary mb-2">Idioma</label>
                                                <select
                                                    value={profileData.language}
                                                    onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
                                                    className="w-full input-base"
                                                >
                                                    <option value="es">Español</option>
                                                    <option value="en">English</option>
                                                    <option value="fr">Français</option>
                                                    <option value="pt">Português</option>
                                                    <option value="de">Deutsch</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-theme-secondary mb-2">Zona Horaria</label>
                                                <select
                                                    value={profileData.timezone}
                                                    onChange={(e) => setProfileData({ ...profileData, timezone: e.target.value })}
                                                    className="w-full input-base"
                                                >
                                                    {timezones.map(tz => (
                                                        <option key={tz.value} value={tz.value}>{tz.label}</option>
                                                    ))}
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
                                    <h2 className="text-xl font-bold text-theme-primary mb-6 flex items-center">
                                        <Lock className="w-5 h-5 mr-3 text-olive-600" />
                                        Cambiar Contraseña
                                    </h2>

                                    <form onSubmit={handlePasswordSubmit} className="space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-theme-secondary mb-2">Contraseña Actual</label>
                                            <div className="relative">
                                                <input
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={passwordData.currentPassword}
                                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                                    className="w-full pr-12 input-base"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-secondary"
                                                >
                                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-theme-secondary mb-2">Nueva Contraseña</label>
                                            <input
                                                type="password"
                                                value={passwordData.newPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                                className="w-full input-base"
                                                required
                                                minLength={6}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-theme-secondary mb-2">Confirmar Nueva Contraseña</label>
                                            <input
                                                type="password"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                                className="w-full input-base"
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
                                        <h2 className="text-xl font-bold text-theme-primary mb-2 flex items-center">
                                            <Bell className="w-5 h-5 mr-3 text-olive-600" />
                                            Preferencias de Notificación
                                        </h2>
                                        <p className="text-sm text-theme-tertiary">Controla cómo y cuándo recibes avisos del sistema.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-theme-secondary uppercase tracking-wider">Email</h3>
                                        {[
                                            { id: 'weeklyReport', label: 'Resumen semanal de horas', desc: 'Recibe un correo todos los lunes con tu actividad.' },
                                            { id: 'newProjects', label: 'Nuevos proyectos asignados', desc: 'Aviso inmediato cuando se te asigne un nuevo código.' },
                                            { id: 'dailyReminder', label: 'Recordatorio de registro diario', desc: 'Si olvidas registrar tus horas antes de las 18:00.' },
                                        ].map((n) => (
                                            <div key={n.id} className="flex items-start justify-between p-4 surface-tertiary rounded-2xl border border-theme-secondary hover:border-olive-300 dark:hover:border-olive-700 transition-colors">
                                                <div>
                                                    <p className="font-bold text-theme-primary text-sm">{n.label}</p>
                                                    <p className="text-xs text-theme-tertiary mt-0.5">{n.desc}</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={(preferences.notifications as any)[n.id]}
                                                        onChange={() => toggleNotification(n.id)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-olive-600"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-theme-secondary">
                                        <h3 className="text-sm font-bold text-theme-secondary uppercase tracking-wider">Push / In-App</h3>
                                        {[
                                            { id: 'taskComments', label: 'Comentarios en tareas', desc: 'Notificación cuando alguien comenta en tus tareas.' },
                                            { id: 'chatMessages', label: 'Mensajes de chat', desc: 'Notificación de nuevos mensajes en conversaciones.' },
                                            { id: 'mentions', label: 'Menciones', desc: 'Cuando alguien te menciona con @tu_nombre.' },
                                        ].map((n) => (
                                            <div key={n.id} className="flex items-start justify-between p-4 surface-tertiary rounded-2xl border border-theme-secondary hover:border-olive-300 dark:hover:border-olive-700 transition-colors">
                                                <div>
                                                    <p className="font-bold text-theme-primary text-sm">{n.label}</p>
                                                    <p className="text-xs text-theme-tertiary mt-0.5">{n.desc}</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={(preferences.notifications as any)?.[n.id] ?? true}
                                                        onChange={() => toggleNotification(n.id)}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-olive-600"></div>
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
                                        <h2 className="text-xl font-bold text-theme-primary mb-2 flex items-center">
                                            <Palette className="w-5 h-5 mr-3 text-olive-600" />
                                            Interfaz y Estilo
                                        </h2>
                                        <p className="text-sm text-theme-tertiary">Personaliza tu experiencia visual en la plataforma.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div
                                            onClick={() => setTheme('light')}
                                            className={`p-4 rounded-3xl border-2 shadow-lg cursor-pointer flex flex-col items-center text-center transition-all ${theme === 'light' || theme === 'system' ? 'bg-olive-50 border-olive-500 shadow-olive-600/10' : 'bg-white border-transparent hover:border-neutral-200'}`}
                                        >
                                            <div className="w-12 h-12 bg-olive-600 rounded-2xl mb-3 flex items-center justify-center text-white shadow-inner">
                                                <Sun size={24} />
                                            </div>
                                            <p className={`font-black text-sm ${theme === 'light' ? 'text-olive-900' : 'text-neutral-600'}`}>Modo Claro</p>
                                            {theme === 'light' && <p className="text-[10px] text-olive-600/70 font-bold uppercase tracking-widest mt-1">Activo</p>}
                                        </div>

                                        <div
                                            onClick={() => setTheme('dark')}
                                            className={`p-4 rounded-3xl border-2 shadow-lg cursor-pointer flex flex-col items-center text-center transition-all ${theme === 'dark' ? 'bg-neutral-800 border-neutral-600 shadow-neutral-900/10' : 'bg-white border-transparent hover:border-neutral-200'}`}
                                        >
                                            <div className="w-12 h-12 bg-neutral-900 rounded-2xl mb-3 flex items-center justify-center text-white shadow-inner">
                                                <Moon size={24} />
                                            </div>
                                            <p className={`font-black text-sm ${theme === 'dark' ? 'text-white' : 'text-neutral-600'}`}>Modo Oscuro</p>
                                            {theme === 'dark' && <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mt-1">Activo</p>}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-theme-secondary">
                                        <div className="flex items-center justify-between p-4">
                                            <div>
                                                <p className="font-bold text-theme-primary text-sm">Barra Lateral Compacta</p>
                                                <p className="text-xs text-theme-tertiary">Maximiza el espacio de trabajo ocultando textos.</p>
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
                                                <p className="font-bold text-theme-primary text-sm">Animaciones Fluidas</p>
                                                <p className="text-xs text-theme-tertiary">Habilitar transiciones suaves entre páginas.</p>
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

                            {activeTab === 'schedule' && (
                                <motion.div
                                    key="schedule"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold text-theme-primary mb-2 flex items-center">
                                            <Clock className="w-5 h-5 mr-3 text-olive-600" />
                                            Horarios y Formatos
                                        </h2>
                                        <p className="text-sm text-theme-tertiary">Configura tus preferencias de fecha, hora y semana laboral.</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold text-theme-secondary mb-2">Inicio de Semana</label>
                                                <select
                                                    value={(preferences.workSchedule as any)?.weekStart || 'monday'}
                                                    onChange={(e) => savePreferences({
                                                        ...preferences,
                                                        workSchedule: { ...(preferences.workSchedule as any), weekStart: e.target.value }
                                                    })}
                                                    className="w-full input-base"
                                                >
                                                    <option value="monday">Lunes</option>
                                                    <option value="sunday">Domingo</option>
                                                    <option value="saturday">Sábado</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-theme-secondary mb-2">Formato de Hora</label>
                                                <select
                                                    value={(preferences.workSchedule as any)?.timeFormat || '24h'}
                                                    onChange={(e) => savePreferences({
                                                        ...preferences,
                                                        workSchedule: { ...(preferences.workSchedule as any), timeFormat: e.target.value }
                                                    })}
                                                    className="w-full input-base"
                                                >
                                                    <option value="24h">24 horas (14:30)</option>
                                                    <option value="12h">12 horas (2:30 PM)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-theme-secondary mb-2">Formato de Fecha</label>
                                            <select
                                                value={(preferences.workSchedule as any)?.dateFormat || 'DD/MM/YYYY'}
                                                onChange={(e) => savePreferences({
                                                    ...preferences,
                                                    workSchedule: { ...(preferences.workSchedule as any), dateFormat: e.target.value }
                                                })}
                                                className="w-full input-base"
                                            >
                                                <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2026)</option>
                                                <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2026)</option>
                                                <option value="YYYY-MM-DD">YYYY-MM-DD (2026-12-31)</option>
                                                <option value="DD MMM YYYY">DD MMM YYYY (31 Dic 2026)</option>
                                            </select>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'accessibility' && (
                                <motion.div
                                    key="accessibility"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div>
                                        <h2 className="text-xl font-bold text-theme-primary mb-2 flex items-center">
                                            <Accessibility className="w-5 h-5 mr-3 text-olive-600" />
                                            Accesibilidad
                                        </h2>
                                        <p className="text-sm text-theme-tertiary">Opciones para mejorar la experiencia de uso.</p>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { id: 'highContrast', label: 'Alto Contraste', desc: 'Aumenta el contraste de colores para mejor legibilidad.' },
                                            { id: 'reduceMotion', label: 'Reducir Movimiento', desc: 'Desactiva animaciones y transiciones.' },
                                            { id: 'screenReader', label: 'Optimizar para Lector de Pantalla', desc: 'Mejora la compatibilidad con tecnologías asistivas.' },
                                        ].map((setting) => (
                                            <div key={setting.id} className="flex items-start justify-between p-4 surface-tertiary rounded-2xl border border-theme-secondary hover:border-olive-300 dark:hover:border-olive-700 transition-colors">
                                                <div>
                                                    <p className="font-bold text-theme-primary text-sm">{setting.label}</p>
                                                    <p className="text-xs text-theme-tertiary mt-0.5">{setting.desc}</p>
                                                </div>
                                                <div className="relative inline-flex items-center cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={(preferences.accessibility as any)?.[setting.id] || false}
                                                        onChange={() => {
                                                            const newAccess = {
                                                                ...(preferences.accessibility as any),
                                                                [setting.id]: !(preferences.accessibility as any)?.[setting.id]
                                                            };
                                                            savePreferences({ ...preferences, accessibility: newAccess });
                                                        }}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-olive-600"></div>
                                                </div>
                                            </div>
                                        ))}
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
