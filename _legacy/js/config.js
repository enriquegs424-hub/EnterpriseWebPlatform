// ===== MEP-PROJECTS CONFIGURATION =====

// Global Configuration
const MEP_CONFIG = {
    // App Information
    APP_NAME: 'MEP-Projects',
    VERSION: '1.0.0',
    ENVIRONMENT: 'development',
    
    // API Configuration (para futuro desarrollo)
    API: {
        BASE_URL: 'https://api.mep-projects.com',
        VERSION: 'v1',
        TIMEOUT: 10000,
        RETRY_ATTEMPTS: 3
    },
    
    // UI Configuration
    UI: {
        SIDEBAR_WIDTH: 280,
        HEADER_HEIGHT: 80,
        ANIMATION_DURATION: 250,
        DEBOUNCE_DELAY: 300,
        AUTO_SAVE_INTERVAL: 5000,
        NOTIFICATION_DURATION: 5000
    },
    
    // Theme Configuration
    THEME: {
        DEFAULT: 'light',
        STORAGE_KEY: 'mep-theme',
        AUTO_DETECT: true,
        TRANSITIONS: true
    },
    
    // Module Configuration
    MODULES: {
        DASHBOARD: { 
            id: 'dashboard', 
            title: 'Dashboard', 
            icon: 'layout-dashboard',
            hasHtmlContent: false  
        },
        PROJECTS: { 
            id: 'projects', 
            title: 'Proyectos', 
            icon: 'briefcase',
            hasHtmlContent: false 
        },
        TASKS: { 
            id: 'tasks', 
            title: 'Tareas', 
            icon: 'check-square',
            hasHtmlContent: false 
        },
        CHAT: { 
            id: 'chat', 
            title: 'Chat', 
            icon: 'message-circle',
            hasHtmlContent: false 
        },
        CRM: { 
            id: 'crm', 
            title: 'CRM', 
            icon: 'users',
            hasHtmlContent: false ,
            tabs: ['dashboard', 'leads', 'contacts', 'companies', 'deals', 'activities', 'marketing', 'sales', 'reports', 'automation', 'support']
        },
        ERP: { 
            id: 'erp', 
            title: 'ERP', 
            icon: 'bar-chart-3',
            hasHtmlContent: false  
        },
        RRHH: { 
            id: 'rrhh', 
            title: 'RRHH', 
            icon: 'user-check',
            hasHtmlContent: false  
        },
        INVENTORY: { 
            id: 'inventory', 
            title: 'Inventario', 
            icon: 'package',
            hasHtmlContent: false  
        },
        SETTINGS: { 
            id: 'settings', 
            title: 'Configuración', 
            icon: 'settings',
            hasHtmlContent: false 
        },
        USERS: { 
            id: 'users', 
            title: 'Usuarios', 
            icon: 'shield-check',
            hasHtmlContent: false 
        },
        SUPPORT: { 
            id: 'support', 
            title: 'Soporte', 
            icon: 'help-circle',
            hasHtmlContent: false 
        }
    },
    
    // Local Storage Keys
    STORAGE: {
        THEME: 'mep-theme',
        CURRENT_MODULE: 'mep-current-module',
        USER_PREFERENCES: 'mep-user-preferences',
        SIDEBAR_STATE: 'mep-sidebar-state',
        RECENT_PROJECTS: 'mep-recent-projects',
        CHAT_DRAFTS: 'mep-chat-drafts',
        NOTIFICATION_SETTINGS: 'mep-notification-settings'
    },
    
    // Data Configuration
    DATA: {
        ITEMS_PER_PAGE: 25,
        MAX_RECENT_ITEMS: 10,
        CACHE_DURATION: 300000, // 5 minutes
        AUTO_REFRESH_INTERVAL: 60000 // 1 minute
    },
    
    // Notification Types
    NOTIFICATIONS: {
        SUCCESS: { icon: 'check-circle', color: 'success', duration: 3000 },
        ERROR: { icon: 'x-circle', color: 'error', duration: 5000 },
        WARNING: { icon: 'alert-triangle', color: 'warning', duration: 4000 },
        INFO: { icon: 'info', color: 'info', duration: 3000 }
    },
    
    // Project Status
    PROJECT_STATUS: {
        PLANNING: { label: 'Planificación', color: 'info', icon: 'clipboard' },
        IN_PROGRESS: { label: 'En Progreso', color: 'warning', icon: 'clock' },
        REVIEW: { label: 'Revisión', color: 'purple', icon: 'eye' },
        COMPLETED: { label: 'Completado', color: 'success', icon: 'check-circle' },
        ON_HOLD: { label: 'En Pausa', color: 'gray', icon: 'pause-circle' },
        CANCELLED: { label: 'Cancelado', color: 'error', icon: 'x-circle' }
    },
    
    // Task Priority
    TASK_PRIORITY: {
        LOW: { label: 'Baja', color: 'gray', icon: 'arrow-down' },
        MEDIUM: { label: 'Media', color: 'info', icon: 'minus' },
        HIGH: { label: 'Alta', color: 'warning', icon: 'arrow-up' },
        URGENT: { label: 'Urgente', color: 'error', icon: 'alert-triangle' }
    },
    
    // CRM Configuration
    CRM: {
        LEAD_STATUS: {
            NEW: { label: 'Nuevo', color: 'info' },
            CONTACTED: { label: 'Contactado', color: 'warning' },
            QUALIFIED: { label: 'Calificado', color: 'success' },
            CONVERTED: { label: 'Convertido', color: 'primary' },
            LOST: { label: 'Perdido', color: 'error' }
        },
        DEAL_STAGES: {
            PROSPECTING: { label: 'Prospecting', percentage: 10 },
            QUALIFICATION: { label: 'Qualification', percentage: 30 },
            PROPOSAL: { label: 'Proposal', percentage: 60 },
            NEGOTIATION: { label: 'Negotiation', percentage: 80 },
            CLOSED_WON: { label: 'Closed Won', percentage: 100 },
            CLOSED_LOST: { label: 'Closed Lost', percentage: 0 }
        }
    },
    
    // ERP Configuration
    ERP: {
        CURRENCY: 'EUR',
        TAX_RATE: 0.21,
        FISCAL_YEAR_START: '01-01',
        INVOICE_PREFIX: 'INV-',
        ORDER_PREFIX: 'ORD-',
        PAYMENT_TERMS: [
            { days: 0, label: 'Contado' },
            { days: 15, label: 'Net 15' },
            { days: 30, label: 'Net 30' },
            { days: 60, label: 'Net 60' }
        ]
    },
    
    // RRHH Configuration
    RRHH: {
        CONTRACT_TYPES: ['Indefinido', 'Temporal', 'Prácticas', 'Freelance'],
        DEPARTMENTS: ['Desarrollo', 'Diseño', 'Marketing', 'Ventas', 'Administración', 'Infraestructura', 'Gestión'],
        VACATION_DAYS_PER_YEAR: 22,
        SICK_DAYS_PER_YEAR: 10,
        PERFORMANCE_SCALE: {
            EXCELLENT: { min: 90, label: 'Excelente', color: 'success' },
            GOOD: { min: 70, label: 'Bueno', color: 'info' },
            AVERAGE: { min: 50, label: 'Regular', color: 'warning' },
            POOR: { min: 0, label: 'Necesita Mejora', color: 'error' }
        }
    },
    
    // Inventory Configuration
    INVENTORY: {
        STOCK_ALERTS: {
            LOW: { threshold: 10, color: 'warning' },
            CRITICAL: { threshold: 5, color: 'error' },
            OUT_OF_STOCK: { threshold: 0, color: 'error' }
        },
        CATEGORIES: ['Hardware', 'Software', 'Oficina', 'Electrónicos', 'Herramientas'],
        LOCATIONS: ['Almacén A', 'Almacén B', 'Oficina Principal', 'Tienda'],
        MOVEMENT_TYPES: {
            IN: { label: 'Entrada', icon: 'arrow-down', color: 'success' },
            OUT: { label: 'Salida', icon: 'arrow-up', color: 'warning' },
            TRANSFER: { label: 'Transferencia', icon: 'rotate-cw', color: 'info' },
            ADJUSTMENT: { label: 'Ajuste', icon: 'edit-3', color: 'purple' }
        }
    },
    
    // Chart Colors
    CHART_COLORS: {
        primary: ['#10B981', '#059669', '#047857', '#065F46', '#064E3B'],
        secondary: ['#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF', '#1E3A8A'],
        tertiary: ['#F59E0B', '#D97706', '#B45309', '#92400E', '#78350F'],
        quaternary: ['#8B5CF6', '#7C3AED', '#6D28D9', '#5B21B6', '#4C1D95'],
        danger: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D']
    },
    
    // Keyboard Shortcuts
    SHORTCUTS: {
        SEARCH: 'ctrl+k',
        NEW_PROJECT: 'ctrl+p',
        NEW_TASK: 'ctrl+t',
        TOGGLE_SIDEBAR: 'ctrl+b',
        TOGGLE_THEME: 'ctrl+shift+d',
        SAVE: 'ctrl+s',
        CLOSE_MODAL: 'esc'
    },
    
    // Permissions (for future implementation)
    PERMISSIONS: {
        ADMIN: ['*'],
        MANAGER: ['view_all', 'edit_all', 'create', 'delete_own'],
        USER: ['view_own', 'edit_own', 'create'],
        VIEWER: ['view_own']
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_CHAT: true,
        ENABLE_NOTIFICATIONS: true,
        ENABLE_DARK_MODE: true,
        ENABLE_SHORTCUTS: true,
        ENABLE_ANIMATIONS: true,
        ENABLE_AUTO_SAVE: true,
        ENABLE_OFFLINE_MODE: false,
        ENABLE_MULTI_LANGUAGE: false,
        ENABLE_ADVANCED_SEARCH: true,
        ENABLE_EXPORT: true,
        ENABLE_IMPORT: true,
        ENABLE_API: false
    }
};

// Freeze configuration to prevent modifications
Object.freeze(MEP_CONFIG);

// Export configuration
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MEP_CONFIG;
} else {
    window.MEP_CONFIG = MEP_CONFIG;
}