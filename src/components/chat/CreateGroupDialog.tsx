'use client';

import { useState, useEffect } from 'react';
import { X, Search, Check, Users, Loader2 } from 'lucide-react';
import { searchUsers, createGroupChat } from '@/app/(protected)/chat/actions';
import { useToast } from '@/components/ui/Toast';

interface User {
    id: string;
    name: string;
    email: string;
    department: string;
    role: string;
}

interface CreateGroupDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onGroupCreated: () => void;
}

export default function CreateGroupDialog({ isOpen, onClose, onGroupCreated }: CreateGroupDialogProps) {
    const [name, setName] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const { success, error } = useToast();

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setName('');
            setSearchQuery('');
            setSearchResults([]);
            setSelectedUsers([]);
        }
    }, [isOpen]);

    // Search users
    useEffect(() => {
        const search = async () => {
            if (searchQuery.trim().length < 2) {
                setSearchResults([]);
                return;
            }

            setIsSearching(true);
            try {
                const users = await searchUsers(searchQuery);
                // Filter out already selected users
                setSearchResults(users.filter(u => !selectedUsers.find(s => s.id === u.id)));
            } catch (err) {
                console.error(err);
            } finally {
                setIsSearching(false);
            }
        };

        const debounce = setTimeout(search, 300);
        return () => clearTimeout(debounce);
    }, [searchQuery, selectedUsers]);

    const handleSelectUser = (user: User) => {
        setSelectedUsers(prev => [...prev, user]);
        setSearchQuery(''); // Clear search to show empty or reset
        setSearchResults([]);
    };

    const handleRemoveUser = (userId: string) => {
        setSelectedUsers(prev => prev.filter(u => u.id !== userId));
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        if (selectedUsers.length === 0) {
            error('Error', 'Debes añadir al menos un participante');
            return;
        }

        setIsCreating(true);
        try {
            await createGroupChat(name, selectedUsers.map(u => u.id));
            success('Grupo creado', `Se ha creado el grupo "${name}"`);
            onGroupCreated();
            onClose();
        } catch (err) {
            console.error(err);
            error('Error', 'No se pudo crear el grupo');
        } finally {
            setIsCreating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl w-full max-w-md border border-neutral-200 dark:border-neutral-800 overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between bg-neutral-50 dark:bg-neutral-950">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Users className="w-5 h-5 text-olive-600" />
                        Nuevo Grupo
                    </h2>
                    <button onClick={onClose} className="p-1 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-4">
                    {/* Name Input */}
                    <div>
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">Nombre del Grupo</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ej: Equipo de Proyecto Alpha"
                            className="w-full px-3 py-2 border rounded-lg bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-olive-500 outline-none"
                            autoFocus
                        />
                    </div>

                    {/* Check Selected Users */}
                    {selectedUsers.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {selectedUsers.map(user => (
                                <span key={user.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-olive-100 text-olive-700 text-xs font-bold border border-olive-200">
                                    {user.name}
                                    <button onClick={() => handleRemoveUser(user.id)} className="hover:text-olive-900">
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Search Users */}
                    <div className="relative">
                        <label className="block text-xs font-bold uppercase text-neutral-500 mb-1.5">Añadir Participantes</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar por nombre..."
                                className="w-full pl-9 pr-3 py-2 border rounded-lg bg-neutral-50 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 focus:ring-2 focus:ring-olive-500 outline-none"
                            />
                        </div>

                        {/* Results */}
                        {(isSearching || searchResults.length > 0) && (
                            <div className="mt-2 border rounded-lg overflow-hidden max-h-48 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900 shadow-sm border-neutral-200 dark:border-neutral-800">
                                {isSearching && (
                                    <div className="p-3 text-center text-neutral-500 text-xs">Buscando...</div>
                                )}
                                {searchResults.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSelectUser(user)}
                                        className="w-full text-left px-3 py-2.5 hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-between group"
                                    >
                                        <div>
                                            <div className="font-bold text-sm text-neutral-800 dark:text-neutral-200">{user.name}</div>
                                            <div className="text-xs text-neutral-500">{user.department} • {user.role}</div>
                                        </div>
                                        <Check className="w-4 h-4 text-olive-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={!name.trim() || selectedUsers.length === 0 || isCreating}
                        className="px-4 py-2 text-sm font-bold bg-olive-600 text-white rounded-lg hover:bg-olive-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                        Crear Grupo
                    </button>
                </div>
            </div>
        </div>
    );
}
