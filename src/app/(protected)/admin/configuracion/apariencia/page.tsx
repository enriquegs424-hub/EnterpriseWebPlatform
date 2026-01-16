'use client';

import { useState, useEffect } from 'react';
import { Palette, Upload, Eye, Save } from 'lucide-react';

export default function SettingsBrandingPage() {
    const [settings, setSettings] = useState({
        primaryColor: '#65a30d', // olive-600
        logo: null as File | null,
        logoUrl: '',
        companyName: ''
    });
    const [preview, setPreview] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            // TODO: Load from CompanySettings
            // const companySettings = await getCompanySettings();
            // setSettings(companySettings);
            setLoading(false);
        } catch (error) {
            console.error('Error loading settings:', error);
            setLoading(false);
        }
    };

    const handleColorChange = (color: string) => {
        setSettings(prev => ({ ...prev, primaryColor: color }));

        // Apply to CSS variables for live preview
        if (preview) {
            document.documentElement.style.setProperty('--color-primary', color);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSettings(prev => ({ ...prev, logo: file }));

            // Create preview URL
            const url = URL.createObjectURL(file);
            setSettings(prev => ({ ...prev, logoUrl: url }));
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // TODO: Implement save to CompanySettings
            // await updateCompanySettings(settings);

            alert('Configuración guardada correctamente');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    const togglePreview = () => {
        setPreview(!preview);

        if (!preview) {
            // Apply current settings
            document.documentElement.style.setProperty('--color-primary', settings.primaryColor);
        } else {
            // Reset to default
            document.documentElement.style.removeProperty('--color-primary');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-olive-600 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                    <Palette className="w-7 h-7 text-olive-600" />
                    Apariencia y Marca
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Personaliza los colores y el logo de tu empresa
                </p>
            </div>

            {/* Preview Toggle */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Eye className="w-5 h-5 text-blue-600" />
                        <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">Vista Previa</p>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                                Ver cambios en tiempo real
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={togglePreview}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${preview
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-neutral-800 text-blue-600 border border-blue-200'
                            }`}
                    >
                        {preview ? 'Activado' : 'Desactivado'}
                    </button>
                </div>
            </div>

            {/* Color Settings */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h2 className="text-lg font-bold mb-4">Color Principal</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Seleccionar Color
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="color"
                                value={settings.primaryColor}
                                onChange={(e) => handleColorChange(e.target.value)}
                                className="w-20 h-20 rounded-lg cursor-pointer border-2 border-neutral-200"
                            />
                            <div>
                                <p className="font-mono text-lg font-bold">{settings.primaryColor}</p>
                                <p className="text-sm text-neutral-500">Color hexadecimal</p>
                            </div>
                        </div>
                    </div>

                    {/* Preset Colors */}
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Colores Predefinidos
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                            {[
                                { name: 'Olive', color: '#65a30d' },
                                { name: 'Blue', color: '#2563eb' },
                                { name: 'Purple', color: '#9333ea' },
                                { name: 'Pink', color: '#ec4899' },
                                { name: 'Orange', color: '#ea580c' },
                                { name: 'Teal', color: '#0d9488' }
                            ].map((preset) => (
                                <button
                                    key={preset.name}
                                    onClick={() => handleColorChange(preset.color)}
                                    className="aspect-square rounded-lg border-2 transition-all hover:scale-110"
                                    style={{
                                        backgroundColor: preset.color,
                                        borderColor: settings.primaryColor === preset.color ? '#000' : 'transparent'
                                    }}
                                    title={preset.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Logo Settings */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h2 className="text-lg font-bold mb-4">Logo de Empresa</h2>

                <div className="space-y-4">
                    {/* Current Logo */}
                    {settings.logoUrl && (
                        <div className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                            <img
                                src={settings.logoUrl}
                                alt="Logo"
                                className="h-16 w-auto object-contain"
                            />
                            <div>
                                <p className="font-medium">Logo Actual</p>
                                <p className="text-sm text-neutral-500">Tamaño recomendado: 200x200px</p>
                            </div>
                        </div>
                    )}

                    {/* Upload */}
                    <div>
                        <label className="block">
                            <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 text-center hover:border-olive-500 transition-colors cursor-pointer">
                                <Upload className="w-12 h-12 mx-auto mb-3 text-neutral-400" />
                                <p className="font-medium mb-1">
                                    Haz clic para subir un nuevo logo
                                </p>
                                <p className="text-sm text-neutral-500">
                                    PNG, JPG o SVG (max. 2MB)
                                </p>
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Company Name */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h2 className="text-lg font-bold mb-4">Nombre de Empresa</h2>
                <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) => setSettings(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Mi Empresa S.L."
                    className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                />
                <p className="text-sm text-neutral-500 mt-2">
                    Este nombre aparecerá en facturas, presupuestos y documentos
                </p>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3">
                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                    <Save size={18} />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    );
}
