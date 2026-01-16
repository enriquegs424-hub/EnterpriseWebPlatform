'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Building2, ArrowLeft, Save, Users, Settings, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getCompanyById, updateCompany, getCompanySettings, updateCompanySettings, createAdminForCompany, deleteCompany } from '../../actions';

export default function EditCompanyPage() {
    const params = useParams();
    const router = useRouter();
    const companyId = params.id as string;

    const [company, setCompany] = useState<any>(null);
    const [settings, setSettings] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'datos' | 'permisos' | 'admins'>('datos');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        isActive: true
    });

    const [newAdmin, setNewAdmin] = useState({
        name: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        loadCompanyData();
    }, [companyId]);

    const loadCompanyData = async () => {
        try {
            const [companyData, settingsData] = await Promise.all([
                getCompanyById(companyId),
                getCompanySettings(companyId)
            ]);
            setCompany(companyData);
            setSettings(settingsData);
            setFormData({
                name: companyData?.name || '',
                slug: companyData?.slug || '',
                email: companyData?.email || '',
                phone: companyData?.phone || '',
                address: companyData?.address || '',
                taxId: companyData?.taxId || '',
                isActive: companyData?.isActive ?? true
            });
        } catch (err) {
            console.error('Error loading company:', err);
            setError('Error al cargar la empresa');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveCompany = async () => {
        setSaving(true);
        setError('');
        try {
            await updateCompany(companyId, formData);
            alert('Empresa actualizada correctamente');
        } catch (err: any) {
            setError(err.message || 'Error al guardar');
        } finally {
            setSaving(false);
        }
    };

    const handleSaveSettings = async (key: string, value: boolean) => {
        try {
            await updateCompanySettings(companyId, { [key]: value });
            setSettings({ ...settings, [key]: value });
        } catch (err: any) {
            alert('Error al guardar configuración');
        }
    };

    const handleCreateAdmin = async () => {
        if (!newAdmin.name || !newAdmin.email || !newAdmin.password) {
            alert('Completa todos los campos');
            return;
        }
        try {
            await createAdminForCompany(companyId, newAdmin);
            setNewAdmin({ name: '', email: '', password: '' });
            loadCompanyData();
            alert('Admin creado correctamente');
        } catch (err: any) {
            alert(err.message || 'Error al crear admin');
        }
    };

    const handleDeactivate = async () => {
        if (!confirm('¿Seguro que quieres desactivar esta empresa? Los datos se conservarán.')) return;
        try {
            await deleteCompany(companyId);
            router.push('/superadmin/companies');
        } catch (err: any) {
            alert(err.message || 'Error al desactivar');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!company) {
        return (
            <div className="text-center py-12">
                <p className="text-neutral-500">Empresa no encontrada</p>
            </div>
        );
    }

    const tabs = [
        { id: 'datos', label: 'Datos', icon: Building2 },
        { id: 'permisos', label: 'Permisos', icon: Settings },
        { id: 'admins', label: 'Administradores', icon: Users },
    ];

    const permissionLabels: Record<string, string> = {
        canCreateUsers: 'Crear usuarios',
        canDeleteUsers: 'Eliminar usuarios',
        canChangeRoles: 'Cambiar roles',
        canAccessInvoicing: 'Acceso a facturación',
        canAccessReports: 'Acceso a reportes',
        canExportData: 'Exportar datos',
        canViewAuditLogs: 'Ver logs de auditoría',
        canCreateGuests: 'Crear usuarios guest'
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/superadmin/companies"
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                            <Building2 className="w-7 h-7 text-purple-600" />
                            {company.name}
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                            {company._count?.users || 0} usuarios • {company._count?.projects || 0} proyectos
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleDeactivate}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                >
                    <Trash2 size={18} />
                    Desactivar
                </button>
            </div>

            {/* Tabs */}
            <div className="border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex gap-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-purple-600 text-purple-600'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-700'
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {activeTab === 'datos' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Slug</label>
                                <input
                                    type="text"
                                    value={formData.slug}
                                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">NIF/CIF</label>
                                <input
                                    type="text"
                                    value={formData.taxId}
                                    onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Teléfono</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-2">Dirección</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded"
                                />
                                <label htmlFor="isActive" className="font-medium">Empresa Activa</label>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <button
                                onClick={handleSaveCompany}
                                disabled={saving}
                                className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                )}

                {activeTab === 'permisos' && settings && (
                    <div className="space-y-4">
                        <p className="text-neutral-500 mb-6">
                            Configura qué acciones puede realizar el ADMIN de esta empresa
                        </p>
                        {Object.entries(permissionLabels).map(([key, label]) => (
                            <div key={key} className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                <span className="font-medium">{label}</span>
                                <button
                                    onClick={() => handleSaveSettings(key, !settings[key])}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${settings[key]
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-red-100 text-red-700'
                                        }`}
                                >
                                    {settings[key] ? 'Permitido' : 'Bloqueado'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'admins' && (
                    <div className="space-y-6">
                        {/* Existing Admins */}
                        <div>
                            <h3 className="font-bold mb-4">Administradores Actuales</h3>
                            {company.users?.length === 0 ? (
                                <p className="text-neutral-500">No hay administradores</p>
                            ) : (
                                <div className="space-y-2">
                                    {company.users?.map((user: any) => (
                                        <div key={user.id} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg">
                                            <div>
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-neutral-500">{user.email}</p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {user.isActive ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Add New Admin */}
                        <div className="pt-6 border-t">
                            <h3 className="font-bold mb-4">Añadir Nuevo Admin</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <input
                                    type="text"
                                    placeholder="Nombre"
                                    value={newAdmin.name}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                                    className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                                />
                                <input
                                    type="email"
                                    placeholder="Email"
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                                    className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                                />
                                <input
                                    type="password"
                                    placeholder="Contraseña"
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                                    className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800"
                                />
                            </div>
                            <button
                                onClick={handleCreateAdmin}
                                className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                            >
                                Crear Admin
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
