"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Command,
    FileText,
    Users,
    FolderKanban,
    Clock,
    Receipt,
    TrendingUp,
    Settings,
    Plus,
    Search,
} from "lucide-react";

interface QuickAction {
    id: string;
    title: string;
    description: string;
    icon: any;
    href?: string;
    action?: () => void;
    shortcut?: string;
    category: "create" | "navigate" | "recent";
}

export default function QuickActions() {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");

    const actions: QuickAction[] = [
        // Create actions
        {
            id: "new-invoice",
            title: "Nueva Factura",
            description: "Crear una nueva factura",
            icon: FileText,
            href: "/invoices/new",
            shortcut: "I",
            category: "create",
        },
        {
            id: "new-task",
            title: "Nueva Tarea",
            description: "Crear una nueva tarea",
            icon: FolderKanban,
            href: "/tasks/new",
            shortcut: "T",
            category: "create",
        },
        {
            id: "new-expense",
            title: "Nuevo Gasto",
            description: "Registrar un gasto",
            icon: Receipt,
            href: "/expenses/new",
            shortcut: "G",
            category: "create",
        },
        {
            id: "new-client",
            title: "Nuevo Cliente",
            description: "Añadir un cliente",
            icon: Users,
            href: "/admin/clients/new",
            shortcut: "C",
            category: "create",
        },
        // Navigate actions
        {
            id: "nav-dashboard",
            title: "Dashboard",
            description: "Ir al dashboard principal",
            icon: TrendingUp,
            href: "/dashboard",
            category: "navigate",
        },
        {
            id: "nav-finance",
            title: "Finanzas",
            description: "Dashboard financiero",
            icon: TrendingUp,
            href: "/finance",
            category: "navigate",
        },
        {
            id: "nav-invoices",
            title: "Facturas",
            description: "Lista de facturas",
            icon: FileText,
            href: "/invoices",
            category: "navigate",
        },
        {
            id: "nav-tasks",
            title: "Tareas",
            description: "Lista de tareas",
            icon: FolderKanban,
            href: "/tasks",
            category: "navigate",
        },
        {
            id: "nav-expenses",
            title: "Gastos",
            description: "Lista de gastos",
            icon: Receipt,
            href: "/expenses",
            category: "navigate",
        },
        {
            id: "nav-hours",
            title: "Horas",
            description: "Registro de horas",
            icon: Clock,
            href: "/hours",
            category: "navigate",
        },
        {
            id: "nav-settings",
            title: "Configuración",
            description: "Ajustes del sistema",
            icon: Settings,
            href: "/admin",
            category: "navigate",
        },
        {
            id: "nav-products",
            title: "Productos",
            description: "Catálogo de productos",
            icon: Plus,
            href: "/admin/products",
            category: "navigate",
        },
    ];

    const filteredActions = actions.filter(
        (action) =>
            action.title.toLowerCase().includes(search.toLowerCase()) ||
            action.description.toLowerCase().includes(search.toLowerCase())
    );

    const handleAction = (action: QuickAction) => {
        if (action.href) {
            router.push(action.href);
        } else if (action.action) {
            action.action();
        }
        setIsOpen(false);
        setSearch("");
    };

    // Keyboard shortcut handler
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // Open with Cmd/Ctrl + K
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }

            // Close with Escape
            if (e.key === "Escape") {
                setIsOpen(false);
                setSearch("");
            }

            // Quick shortcuts when closed
            if (!isOpen && (e.metaKey || e.ctrlKey) && e.shiftKey) {
                const action = actions.find((a) => a.shortcut === e.key.toUpperCase());
                if (action) {
                    e.preventDefault();
                    handleAction(action);
                }
            }
        },
        [isOpen, router]
    );

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 p-4 bg-olive-600 text-white rounded-full shadow-lg hover:bg-olive-700 transition-all hover:scale-105 z-40"
                title="Acciones rápidas (⌘K)"
            >
                <Command className="w-6 h-6" />
            </button>
        );
    }

    const groupedActions = {
        create: filteredActions.filter((a) => a.category === "create"),
        navigate: filteredActions.filter((a) => a.category === "navigate"),
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => {
                    setIsOpen(false);
                    setSearch("");
                }}
            />

            {/* Command palette */}
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar acciones..."
                        className="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        autoFocus
                    />
                    <kbd className="hidden sm:block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded">
                        ESC
                    </kbd>
                </div>

                {/* Results */}
                <div className="max-h-[400px] overflow-y-auto py-2">
                    {filteredActions.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            No se encontraron acciones
                        </div>
                    ) : (
                        <>
                            {groupedActions.create.length > 0 && (
                                <div className="px-3 py-2">
                                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-1">
                                        Crear
                                    </p>
                                    {groupedActions.create.map((action) => (
                                        <ActionButton key={action.id} action={action} onClick={() => handleAction(action)} />
                                    ))}
                                </div>
                            )}

                            {groupedActions.navigate.length > 0 && (
                                <div className="px-3 py-2">
                                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2 mb-1">
                                        Navegar
                                    </p>
                                    {groupedActions.navigate.map((action) => (
                                        <ActionButton key={action.id} action={action} onClick={() => handleAction(action)} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex gap-2">
                        <span>↑↓ Navegar</span>
                        <span>↵ Seleccionar</span>
                    </div>
                    <div className="hidden sm:flex gap-2">
                        <span>⌘⇧I Factura</span>
                        <span>⌘⇧T Tarea</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ActionButton({ action, onClick }: { action: QuickAction; onClick: () => void }) {
    const Icon = action.icon;
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
        >
            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <Icon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">{action.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{action.description}</p>
            </div>
            {action.shortcut && (
                <kbd className="hidden sm:block px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">
                    ⌘⇧{action.shortcut}
                </kbd>
            )}
        </button>
    );
}
