'use client';

import { useState, useEffect } from 'react';
import { getAllClients, createClient, updateClient, toggleClientStatus } from './actions';
import { Users, Plus, Edit2, Mail, Phone, Building2, MapPin, Power, PowerOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    setLoading(true);
    const data = await getAllClients();
    setClients(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    
    await createClient(editingClient);
    setEditingClient(null);
    setIsCreating(false);
    fetchClients();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    
    await updateClient(editingClient.id, editingClient);
    setEditingClient(null);
    fetchClients();
  };

  const handleToggle = async (id: string) => {
    await toggleClientStatus(id);
    fetchClients();
  };

  const openCreateModal = () => {
    setEditingClient({
      name: '',
      email: '',
      phone: '',
      company: '',
      address: '',
      isActive: true
    });
    setIsCreating(true);
  };

  if (loading && clients.length === 0) return <div className="p-8 text-center text-neutral-500">Cargando clientes...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900 border-l-4 border-olive-500 pl-4">Gestión de Clientes</h1>
        <button 
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-olive-600 text-white px-4 py-2.5 rounded-xl hover:bg-olive-700 transition-all font-bold shadow-lg shadow-olive-600/20"
        >
          <Plus size={20} />
          <span>Nuevo Cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-neutral-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
          >
            <div className="bg-gradient-to-r from-olive-50 to-olive-100/50 px-6 py-4 border-b border-olive-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-neutral-900 text-lg">{client.name}</h3>
                  {client.company && (
                    <p className="text-sm text-olive-700 font-medium mt-0.5">{client.company}</p>
                  )}
                </div>
                <button
                  onClick={() => handleToggle(client.id)}
                  className={`${
                    client.isActive 
                      ? 'bg-success-100 text-success-700' 
                      : 'bg-error-100 text-error-700'
                  } p-2 rounded-lg transition-all`}
                >
                  {client.isActive ? <Power size={16} /> : <PowerOff size={16} />}
                </button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              {client.email && (
                <div className="flex items-center text-sm text-neutral-600">
                  <Mail size={14} className="mr-3 text-neutral-400 shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              {client.phone && (
                <div className="flex items-center text-sm text-neutral-600">
                  <Phone size={14} className="mr-3 text-neutral-400 shrink-0" />
                  <span>{client.phone}</span>
                </div>
              )}
              {client.address && (
                <div className="flex items-start text-sm text-neutral-600">
                  <MapPin size={14} className="mr-3 text-neutral-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{client.address}</span>
                </div>
              )}

              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between">
                <div className="flex items-center text-xs text-neutral-500">
                  <Building2 size={12} className="mr-1.5" />
                  <span className="font-medium">{client._count.projects} proyectos</span>
                </div>
                <button
                  onClick={() => { setEditingClient({...client}); setIsCreating(false); }}
                  className="text-olive-600 hover:text-olive-700 hover:bg-olive-50 p-2 rounded-lg transition-all"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {clients.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200">
          <Users className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500 font-medium">No hay clientes registrados</p>
          <button onClick={openCreateModal} className="mt-4 text-olive-600 hover:text-olive-700 font-medium">
            Crear el primer cliente
          </button>
        </div>
      )}

      <AnimatePresence>
        {editingClient && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 border border-neutral-200 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-neutral-900 flex items-center">
                  <Users className="w-5 h-5 mr-3 text-olive-600" />
                  {isCreating ? 'Nuevo Cliente' : 'Editar Cliente'}
                </h3>
                <button onClick={() => { setEditingClient(null); setIsCreating(false); }} className="text-neutral-400 hover:text-neutral-600 text-2xl">&times;</button>
              </div>
              
              <form onSubmit={isCreating ? handleCreate : handleUpdate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Nombre del Cliente *</label>
                    <input 
                      value={editingClient.name} 
                      onChange={e => setEditingClient({...editingClient, name: e.target.value})}
                      placeholder="Juan Pérez"
                      className="w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Empresa</label>
                    <input 
                      value={editingClient.company || ''} 
                      onChange={e => setEditingClient({...editingClient, company: e.target.value})}
                      placeholder="Constructora ABC S.L."
                      className="w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Email</label>
                    <input 
                      type="email"
                      value={editingClient.email || ''} 
                      onChange={e => setEditingClient({...editingClient, email: e.target.value})}
                      placeholder="cliente@empresa.com"
                      className="w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-1">Teléfono</label>
                    <input 
                      type="tel"
                      value={editingClient.phone || ''} 
                      onChange={e => setEditingClient({...editingClient, phone: e.target.value})}
                      placeholder="+34 600 000 000"
                      className="w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-1">Dirección</label>
                  <textarea
                    value={editingClient.address || ''} 
                    onChange={e => setEditingClient({...editingClient, address: e.target.value})}
                    placeholder="Calle Principal 123, Madrid, España"
                    rows={2}
                    className="w-full p-2.5 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-olive-500/20 outline-none resize-none"
                  />
                </div>

                {!isCreating && (
                  <div className="flex items-center space-x-3 pt-2">
                    <input 
                      type="checkbox" 
                      checked={editingClient.isActive}
                      onChange={e => setEditingClient({...editingClient, isActive: e.target.checked})}
                      className="w-4 h-4 text-olive-600 rounded border-neutral-300 focus:ring-olive-500"
                    />
                    <label className="text-sm font-medium text-neutral-700">Cliente Activo</label>
                  </div>
                )}

                <div className="pt-6 flex space-x-3">
                  <button type="button" onClick={() => { setEditingClient(null); setIsCreating(false); }} className="flex-1 px-4 py-2 border border-neutral-200 text-neutral-600 rounded-lg hover:bg-neutral-50 font-medium transition-colors">Cancelar</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-olive-600 text-white rounded-lg hover:bg-olive-700 font-bold transition-all shadow-lg shadow-olive-600/20">
                    {isCreating ? 'Crear Cliente' : 'Guardar Cambios'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
