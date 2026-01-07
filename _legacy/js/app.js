// ===== MEP-PROJECTS MAIN APPLICATION =====

class MEPApplication {
    constructor() {
        this.currentModule = null;
        this.modules = {};
        this.isLoading = false;
        this.sidebarOpen = true;
        this.currentTheme = 'light';
    }

    async init() {
        try {
            console.log('🚀 Iniciando MEP-Projects...');
            
            this.showLoader();
            
            // Initialize theme
            this.initTheme();
            
            // Load saved preferences
            this.loadPreferences();
            
            // Initialize Lucide icons
            this.initIcons();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize modules
            await this.initModules();
            
            // Hash change listener para navegación
            window.addEventListener('hashchange', () => {
                const moduleId = window.location.hash.slice(1) || 'dashboard';
                this.loadModule(moduleId);
            });

            // Load default module
            const savedModule = MEP_Utils.storage.get(MEP_CONFIG.STORAGE.CURRENT_MODULE) || 'dashboard';
            await this.loadModule(savedModule);
            
            // Hide loader
            this.hideLoader();
            
            console.log('✅ MEP-Projects inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando la aplicación:', error);
            this.showNotification('Error al inicializar la aplicación', 'error');
            this.hideLoader();
        }
    }

    initTheme() {
        const savedTheme = MEP_Utils.storage.get(MEP_CONFIG.STORAGE.THEME) || MEP_CONFIG.THEME.DEFAULT;
        this.setTheme(savedTheme);
    }

    loadPreferences() {
        const preferences = MEP_Utils.storage.get(MEP_CONFIG.STORAGE.USER_PREFERENCES) || {};
        
        if (preferences.sidebarCollapsed) {
            this.toggleSidebar(false);
        }
    }

    initIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    setupEventListeners() {
        // Global search
        const searchInput = MEP_Utils.$('.search-input');
        if (searchInput) {
            searchInput.addEventListener('input', 
                MEP_Utils.debounce((e) => this.handleSearch(e.target.value), 300)
            );
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
        
        // Window resize
        window.addEventListener('resize', MEP_Utils.throttle(() => this.handleResize(), 250));
        
        // Dropdown menus
        document.addEventListener('click', (e) => this.handleDocumentClick(e));

        // Navigation links del sidebar
        MEP_Utils.$$('.sidebar-nav-item[data-module]').forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                const moduleId = link.getAttribute('data-module');
                window.location.hash = moduleId;
                this.loadModule(moduleId);
            });
        });
    }

    async initModules() {
    console.log('📦 Inicializando módulos...');
    
    this.modules = {
        dashboard: new DashboardModule(),
        projects: new ProjectsModule(),
        tasks: new TasksModule(),
        chat: new ChatModule(),
        crm: new CRMModule(),
        erp: new ERPModule(),
        rrhh: new RRHHModule(),
        inventory: new InventoryModule(),
        settings: new SettingsModule(),
        support: new SupportModule(),
        users: new UsersModule()
    };
    
    console.log('✅ Módulos inicializados:', Object.keys(this.modules));
}

    async loadModule(moduleId) {
        console.log(`🔄 Cargando módulo: ${moduleId}`);
        
        try {
            this.showLoader();
            
            // Update current module
            this.currentModule = moduleId;
            MEP_Utils.storage.set(MEP_CONFIG.STORAGE.CURRENT_MODULE, moduleId);
            
            // Update navigation
            this.updateNavigation(moduleId);
            
            // Get module config
            const moduleConfig = Object.values(MEP_CONFIG.MODULES).find(m => m.id === moduleId);
            if (!moduleConfig) {
                throw new Error(`Configuración del módulo ${moduleId} no encontrada`);
            }
            
            // Update page title
            this.updatePageTitle(moduleConfig.title);
            
            // Clear content
            const pageContent = MEP_Utils.$('#pageContent');
            if (!pageContent) {
                throw new Error('Contenedor #pageContent no encontrado');
            }
            
            pageContent.innerHTML = '';
            
            // Load module content
            if (this.modules[moduleId]) {
                console.log(`✅ Renderizando módulo: ${moduleId}`);
                await this.modules[moduleId].render(pageContent);
                
                // Module-specific initialization
                if (this.modules[moduleId].afterRender) {
                    await this.modules[moduleId].afterRender();
                }
            } else {
                throw new Error(`Módulo ${moduleId} no implementado`);
            }
            
            // Re-initialize icons
            this.initIcons();
            
            this.hideLoader();
            console.log(`✅ Módulo ${moduleId} cargado correctamente`);
            
        } catch (error) {
            console.error(`❌ Error cargando módulo ${moduleId}:`, error);
            this.showNotification(`Error al cargar ${moduleId}`, 'error');
            this.hideLoader();
        }
    }

    updateNavigation(moduleId) {
        // Update sidebar active state
        MEP_Utils.$$('.sidebar-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-module') === moduleId) {
                item.classList.add('active');
            }
        });
    }

    updatePageTitle(title) {
        const titleElement = MEP_Utils.$('#pageTitle');
        if (titleElement) {
            titleElement.textContent = title;
        }
        document.title = `${title} - ${MEP_CONFIG.APP_NAME}`;
    }

    toggleSidebar(state = null) {
        const sidebar = MEP_Utils.$('#sidebar');
        const mainContent = MEP_Utils.$('.main-content');
        
        if (state === null) {
            this.sidebarOpen = !this.sidebarOpen;
        } else {
            this.sidebarOpen = state;
        }
        
        if (sidebar) sidebar.classList.toggle('hidden', !this.sidebarOpen);
        if (mainContent) mainContent.classList.toggle('sidebar-hidden', !this.sidebarOpen);
        
        // Save preference
        MEP_Utils.storage.set(MEP_CONFIG.STORAGE.USER_PREFERENCES, {
            sidebarCollapsed: !this.sidebarOpen
        });
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(this.currentTheme);
    }

    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        MEP_Utils.storage.set(MEP_CONFIG.STORAGE.THEME, theme);
        this.currentTheme = theme;
        
        // Update theme toggle icon
        const themeIcon = MEP_Utils.$('#theme-icon-menu');
        const themeText = MEP_Utils.$('#theme-text');
        
        if (themeIcon && themeText) {
            if (theme === 'dark') {
                themeIcon.setAttribute('data-lucide', 'sun');
                themeText.textContent = 'Modo Claro';
            } else {
                themeIcon.setAttribute('data-lucide', 'moon');
                themeText.textContent = 'Modo Oscuro';
            }
            this.initIcons();
        }
    }

    handleSearch(query) {
        if (!query) return;
        console.log('🔍 Búsqueda:', query);
    }

    handleKeyboardShortcuts(e) {
        const key = e.key.toLowerCase();
        const ctrl = e.ctrlKey || e.metaKey;
        const shift = e.shiftKey;
        
        // Search
        if (ctrl && key === 'k') {
            e.preventDefault();
            const searchInput = MEP_Utils.$('.search-input');
            if (searchInput) searchInput.focus();
        }
        
        // Toggle sidebar
        if (ctrl && key === 'b') {
            e.preventDefault();
            this.toggleSidebar();
        }
        
        // Toggle theme
        if (ctrl && shift && key === 'd') {
            e.preventDefault();
            this.toggleTheme();
        }
        
        // Close modal
        if (key === 'escape') {
            this.closeActiveModal();
        }
    }

    handleResize() {
        const width = window.innerWidth;
        if (width < 1024) {
            this.toggleSidebar(false);
        } else {
            this.toggleSidebar(true);
        }
    }

    handleDocumentClick(e) {
        if (!e.target.closest('.dropdown')) {
            MEP_Utils.$$('.dropdown-menu.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    }

    showLoader() {
        this.isLoading = true;
        let loader = MEP_Utils.$('#loader');
        if (loader) {
            loader.style.display = 'flex';
        } else {
            loader = MEP_Utils.createElement('div', {
                id: 'loader',
                className: 'loader',
                style: 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center;',
                innerHTML: `
                    <div style="text-align: center;">
                        <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #10B981; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
                        <div style="color: #666; font-weight: 500;">Cargando...</div>
                    </div>
                    <style>
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                `
            });
            document.body.appendChild(loader);
        }
    }

    hideLoader() {
        this.isLoading = false;
        const loader = MEP_Utils.$('#loader');
        if (loader) {
            setTimeout(() => {
                loader.style.display = 'none';
            }, 300);
        }
    }

    showNotification(message, type = 'info') {
        const config = MEP_CONFIG.NOTIFICATIONS[type.toUpperCase()] || MEP_CONFIG.NOTIFICATIONS.INFO;
        
        const notification = MEP_Utils.createElement('div', {
            className: `notification notification-${config.color}`,
            style: `
                position: fixed; top: 20px; right: 20px; z-index: 10000;
                background: white; border-radius: 8px; padding: 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-left: 4px solid var(--mep-${config.color}, #10B981);
                display: flex; align-items: center; gap: 12px; max-width: 400px;
            `,
            innerHTML: `
                <i data-lucide="${config.icon}" style="width: 20px; height: 20px; color: var(--mep-${config.color}, #10B981);"></i>
                <span style="color: #333; font-weight: 500;">${message}</span>
            `
        });
        
        document.body.appendChild(notification);
        this.initIcons();
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
            notification.style.opacity = '1';
        }, 10);
        
        // Remove after duration
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, config.duration);
    }

    closeActiveModal() {
        const activeModal = MEP_Utils.$('.modal.show');
        if (activeModal) {
            activeModal.classList.remove('show');
        }
    }
}

// Crear clases simples para módulos faltantes



// Global functions para onclick handlers
function showModule(moduleId) {
    if (window.app) {
        window.app.loadModule(moduleId);
    }
}

function toggleSidebar() {
    if (window.app) {
        window.app.toggleSidebar();
    }
}

function toggleTheme() {
    if (window.app) {
        window.app.toggleTheme();
    }
}

function toggleDropdown(dropdownId) {
    const menu = MEP_Utils.$(`#${dropdownId}-menu`);
    if (menu) {
        menu.classList.toggle('show');
    }
}

function showNotification(title, message, type = 'info') {
    if (window.app) {
        window.app.showNotification(`${title}: ${message}`, type);
    }
}

function generateReport() {
    showNotification('Reporte', 'Generando reporte...', 'info');
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM cargado, inicializando MEP-Projects...');
    
    // Verificar dependencias
    if (typeof MEP_CONFIG === 'undefined') {
        console.error('❌ MEP_CONFIG no está definido');
        return;
    }
    
    if (typeof MEP_Utils === 'undefined') {
        console.error('❌ MEP_Utils no está definido');
        return;
    }
    
    if (typeof lucide === 'undefined') {
        console.error('❌ Lucide no está cargado');
        return;
    }
    
    // Inicializar iconos de Lucide
    lucide.createIcons();
    
    // Crear e inicializar la aplicación
    window.app = new MEPApplication();
    window.app.init();
});