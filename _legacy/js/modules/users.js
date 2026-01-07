// ===== USERS MODULE - ENHANCED & COMPLETE =====
// Módulo de Gestión de Usuarios completo con todas las funcionalidades

class UsersModule {
    constructor() {
        this.moduleId = 'users';
        this.currentTab = 'dashboard';
        this.data = {};
        this.isInitialized = false;
        this.users = [];
        this.roles = [];
        this.permissions = [];
        this.auditLogs = [];
        this.filters = {
            search: '',
            role: '',
            status: '',
            department: ''
        };
        this.sortBy = 'created';
        this.sortOrder = 'desc';
        this.currentPage = 1;
        this.itemsPerPage = 25;
        this.selectedUsers = new Set();
        this.currentViewMode = 'table';
        this.modalStack = [];
    }

    async render(container) {
        try {
            console.log('👥 Renderizando módulo de Usuarios...');

            const usersHTML = `
                <div class="users-module">
                    <!-- Header del módulo -->
                    <div class="module-header">
                        <div class="module-title">
                            <h1>Gestión de Usuarios</h1>
                            <p>Administración de usuarios, roles y permisos del sistema</p>
                        </div>
                        <div class="module-actions">
                            <button class="btn btn-secondary" onclick="window.app.modules.users.refreshData()">
                                <i data-lucide="refresh-cw"></i>
                                Actualizar
                            </button>
                            <button class="btn btn-secondary" onclick="window.app.modules.users.exportUsers()">
                                <i data-lucide="download"></i>
                                Exportar
                            </button>
                            <button class="btn btn-primary" onclick="window.app.modules.users.createUser()">
                                <i data-lucide="user-plus"></i>
                                Nuevo Usuario
                            </button>
                        </div>
                    </div>

                    <!-- Navegación por pestañas -->
                    <div class="users-navigation">
                        <nav class="tab-navigation">
                            <button class="tab-btn active" data-tab="dashboard">
                                <i data-lucide="layout-dashboard"></i>
                                Inicio
                            </button>
                            <button class="tab-btn" data-tab="users">
                                <i data-lucide="users"></i>
                                Usuarios
                            </button>
                            <button class="tab-btn" data-tab="roles">
                                <i data-lucide="shield"></i>
                                Roles y Permisos
                            </button>
                            <button class="tab-btn" data-tab="audit">
                                <i data-lucide="file-text"></i>
                                Auditoría
                            </button>
                            <button class="tab-btn" data-tab="security">
                                <i data-lucide="lock"></i>
                                Seguridad
                            </button>
                            <button class="tab-btn" data-tab="settings">
                                <i data-lucide="settings"></i>
                                Configuración
                            </button>
                        </nav>
                    </div>

                    <!-- Contenido de las pestañas -->
                    <div class="users-content">
                        <!-- Dashboard Tab -->
                        <div class="tab-panel active" data-panel="dashboard">
                            <div class="users-dashboard">
                                <!-- KPIs principales -->
                                <div class="stats-grid">
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="users"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Total Usuarios</h3>
                                            <div class="stat-value" id="total-users">247</div>
                                            <div class="stat-change positive" id="users-change">+12 este mes</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon success">
                                            <i data-lucide="user-check"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Usuarios Activos</h3>
                                            <div class="stat-value" id="active-users">198</div>
                                            <div class="stat-change positive" id="active-percentage">80% del total</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon warning">
                                            <i data-lucide="clock"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Últimas 24h</h3>
                                            <div class="stat-value" id="recent-logins">34</div>
                                            <div class="stat-change positive" id="login-change">+8 vs ayer</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="shield"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Roles Definidos</h3>
                                            <div class="stat-value" id="roles-count">8</div>
                                            <div class="stat-change" id="active-roles">5 activos</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Widgets del dashboard -->
                                <div class="dashboard-widgets">
                                    <!-- Widget: Distribución por roles -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Distribución por Roles</h3>
                                            <button class="btn btn-ghost btn-sm" onclick="window.app.modules.users.switchToTab('roles')">Ver roles</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="roles-distribution" id="roles-distribution">
                                                <!-- Los datos se cargan dinámicamente -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Widget: Usuarios recientes -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Usuarios Recientes</h3>
                                            <button class="btn btn-ghost btn-sm" onclick="window.app.modules.users.switchToTab('users')">Ver todos</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="recent-users" id="recent-users-list">
                                                <!-- Los usuarios se cargan dinámicamente -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Widget: Actividad de login -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Actividad de Login</h3>
                                            <button class="btn btn-ghost btn-sm" onclick="window.app.modules.users.switchToTab('audit')">Ver auditoría</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="login-activity" id="login-activity-chart">
                                                <!-- El gráfico se carga dinámicamente -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Widget: Seguridad del sistema -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Estado de Seguridad</h3>
                                            <button class="btn btn-ghost btn-sm" onclick="window.app.modules.users.switchToTab('security')">Configurar</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="security-status" id="security-status">
                                                <!-- El estado se carga dinámicamente -->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Users Tab -->
                        <div class="tab-panel" data-panel="users">
                            <div class="users-management">
                                <div class="section-header">
                                    <h2>Gestión de Usuarios</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.users.exportUsers()">
                                            <i data-lucide="download"></i>
                                            Exportar
                                        </button>
                                        <button class="btn btn-secondary" onclick="window.app.modules.users.bulkActions()">
                                            <i data-lucide="check-square"></i>
                                            Acciones Masivas
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.users.createUser()">
                                            <i data-lucide="user-plus"></i>
                                            Nuevo Usuario
                                        </button>
                                    </div>
                                </div>

                                <!-- Filtros y búsqueda -->
                                <div class="users-filters">
                                    <div class="filter-row">
                                        <div class="search-container-enhanced">
                                            <i data-lucide="search" class="search-icon-enhanced"></i>
                                            <input type="text" placeholder="Buscar por nombre, email o departamento..." class="search-input-enhanced" id="user-search">
                                        </div>
                                        <div class="filters-grid">
                                            <select class="filter-select" id="role-filter">
                                                <option value="">Todos los roles</option>
                                            </select>
                                            <select class="filter-select" id="status-filter">
                                                <option value="">Todos los estados</option>
                                                <option value="active">🟢 Activos</option>
                                                <option value="inactive">🔴 Inactivos</option>
                                                <option value="pending">🟡 Pendientes</option>
                                                <option value="suspended">⛔ Suspendidos</option>
                                            </select>
                                            <select class="filter-select" id="department-filter">
                                                <option value="">Todos los departamentos</option>
                                            </select>
                                        </div>
                                        <div class="filter-actions">
                                            <button class="btn btn-secondary" onclick="window.app.modules.users.applyFilters()">
                                                <i data-lucide="filter"></i>
                                                Filtrar
                                            </button>
                                            <button class="btn btn-ghost" onclick="window.app.modules.users.clearFilters()">
                                                <i data-lucide="x"></i>
                                                Limpiar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Quick stats -->
                                <div class="users-quick-stats" id="users-quick-stats">
                                    <!-- Las estadísticas se cargan dinámicamente -->
                                </div>

                                <!-- Vista de usuarios -->
                                <div class="users-view">
                                    <div class="view-controls">
                                        <div class="view-options">
                                            <button class="view-btn active" data-view="table">
                                                <i data-lucide="table"></i>
                                                Tabla
                                            </button>
                                            <button class="view-btn" data-view="grid">
                                                <i data-lucide="grid-3x3"></i>
                                                Tarjetas
                                            </button>
                                        </div>
                                        <div class="sort-options">
                                            <select class="sort-select" id="sort-users">
                                                <option value="created-desc">📅 Más recientes</option>
                                                <option value="created-asc">📅 Más antiguos</option>
                                                <option value="name-asc">🔤 A-Z</option>
                                                <option value="name-desc">🔤 Z-A</option>
                                                <option value="last-login-desc">🔄 Último login</option>
                                            </select>
                                        </div>
                                    </div>

                                    <!-- Tabla de usuarios -->
                                    <div class="users-table-view" id="users-table">
                                        <!-- La tabla se carga dinámicamente -->
                                    </div>

                                    <!-- Vista en tarjetas -->
                                    <div class="users-grid-view" id="users-grid" style="display: none;">
                                        <!-- Las tarjetas se cargan dinámicamente -->
                                    </div>
                                </div>

                                <!-- Paginación -->
                                <div class="pagination-enhanced" id="users-pagination">
                                    <!-- La paginación se genera dinámicamente -->
                                </div>
                            </div>
                        </div>

                        <!-- Roles Tab -->
                        <div class="tab-panel" data-panel="roles">
                            <div class="roles-management">
                                <div class="section-header">
                                    <h2>Roles y Permisos</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.users.exportRoles()">
                                            <i data-lucide="download"></i>
                                            Exportar Roles
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.users.createRole()">
                                            <i data-lucide="shield-plus"></i>
                                            Nuevo Rol
                                        </button>
                                    </div>
                                </div>

                                <!-- Grid de roles -->
                                <div class="roles-grid" id="roles-grid">
                                    <!-- Los roles se cargan dinámicamente -->
                                </div>

                                <!-- Matriz de permisos -->
                                <div class="permissions-section">
                                    <h3>Matriz de Permisos</h3>
                                    <div class="permissions-matrix" id="permissions-matrix">
                                        <!-- La matriz se carga dinámicamente -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Audit Tab -->
                        <div class="tab-panel" data-panel="audit">
                            <div class="audit-management">
                                <div class="section-header">
                                    <h2>Auditoría del Sistema</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.users.exportAudit()">
                                            <i data-lucide="download"></i>
                                            Exportar Logs
                                        </button>
                                        <button class="btn btn-secondary" onclick="window.app.modules.users.clearOldLogs()">
                                            <i data-lucide="trash-2"></i>
                                            Limpiar Antiguos
                                        </button>
                                    </div>
                                </div>

                                <!-- Filtros de auditoría -->
                                <div class="audit-filters">
                                    <div class="filter-group">
                                        <select class="filter-select" id="audit-period">
                                            <option value="today">Hoy</option>
                                            <option value="week">Esta semana</option>
                                            <option value="month" selected>Este mes</option>
                                            <option value="quarter">Este trimestre</option>
                                            <option value="custom">Personalizado</option>
                                        </select>
                                        <select class="filter-select" id="audit-action">
                                            <option value="">Todas las acciones</option>
                                            <option value="login">Login</option>
                                            <option value="logout">Logout</option>
                                            <option value="create">Crear</option>
                                            <option value="update">Actualizar</option>
                                            <option value="delete">Eliminar</option>
                                        </select>
                                        <input type="text" class="filter-input" id="audit-user" placeholder="Usuario...">
                                        <button class="btn btn-secondary" onclick="window.app.modules.users.updateAudit()">
                                            <i data-lucide="search"></i>
                                            Buscar
                                        </button>
                                    </div>
                                </div>

                                <!-- Timeline de auditoría -->
                                <div class="audit-timeline" id="audit-timeline">
                                    <!-- Los logs se cargan dinámicamente -->
                                </div>
                            </div>
                        </div>

                        <!-- Security Tab -->
                        <div class="tab-panel" data-panel="security">
                            <div class="security-management">
                                <div class="section-header">
                                    <h2>Configuración de Seguridad</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.users.resetSecuritySettings()">
                                            <i data-lucide="refresh-cw"></i>
                                            Restaurar Defecto
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.users.saveSecuritySettings()">
                                            <i data-lucide="save"></i>
                                            Guardar Configuración
                                        </button>
                                    </div>
                                </div>

                                <div class="security-grid">
                                    <!-- Políticas de contraseñas -->
                                    <div class="security-card">
                                        <div class="security-card-header">
                                            <div class="security-title">
                                                <i data-lucide="key"></i>
                                                <h3>Políticas de Contraseñas</h3>
                                            </div>
                                        </div>
                                        <div class="security-card-content">
                                            <div class="security-setting">
                                                <label class="security-label">Longitud mínima</label>
                                                <input type="number" class="security-input" id="min-password-length" value="8" min="6" max="32">
                                            </div>
                                            <div class="security-setting">
                                                <label class="security-label">Requiere mayúsculas</label>
                                                <input type="checkbox" class="security-checkbox" id="require-uppercase" checked>
                                            </div>
                                            <div class="security-setting">
                                                <label class="security-label">Requiere números</label>
                                                <input type="checkbox" class="security-checkbox" id="require-numbers" checked>
                                            </div>
                                            <div class="security-setting">
                                                <label class="security-label">Requiere símbolos</label>
                                                <input type="checkbox" class="security-checkbox" id="require-symbols">
                                            </div>
                                            <div class="security-setting">
                                                <label class="security-label">Expiración (días)</label>
                                                <input type="number" class="security-input" id="password-expiry" value="90" min="0" max="365">
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Configuración de sesiones -->
                                    <div class="security-card">
                                        <div class="security-card-header">
                                            <div class="security-title">
                                                <i data-lucide="clock"></i>
                                                <h3>Configuración de Sesiones</h3>
                                            </div>
                                        </div>
                                        <div class="security-card-content">
                                            <div class="security-setting">
                                                <label class="security-label">Timeout de sesión (minutos)</label>
                                                <input type="number" class="security-input" id="session-timeout" value="30" min="5" max="480">
                                            </div>
                                            <div class="security-setting">
                                                <label class="security-label">Sesiones concurrentes</label>
                                                <input type="number" class="security-input" id="concurrent-sessions" value="3" min="1" max="10">
                                            </div>
                                            <div class="security-setting">
                                                <label class="security-label">Forzar logout en dispositivos</label>
                                                <input type="checkbox" class="security-checkbox" id="force-logout">
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Autenticación de dos factores -->
                                    <div class="security-card">
                                        <div class="security-card-header">
                                            <div class="security-title">
                                                <i data-lucide="smartphone"></i>
                                                <h3>Autenticación de Dos Factores</h3>
                                            </div>
                                        </div>
                                        <div class="security-card-content">
                                            <div class="security-setting">
                                                <label class="security-label">Obligatorio para administradores</label>
                                                <input type="checkbox" class="security-checkbox" id="force-2fa-admin" checked>
                                            </div>
                                            <div class="security-setting">
                                                <label class="security-label">Obligatorio para todos</label>
                                                <input type="checkbox" class="security-checkbox" id="force-2fa-all">
                                            </div>
                                            <div class="security-setting">
                                                <label class="security-label">Método preferido</label>
                                                <select class="security-select" id="preferred-2fa">
                                                    <option value="app">Aplicación de autenticación</option>
                                                    <option value="sms">SMS</option>
                                                    <option value="email">Email</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Bloqueo de cuentas -->
                                    <div class="security-card">
                                        <div class="security-card-header">
                                            <div class="security-title">
                                                <i data-lucide="shield-alert"></i>
                                                <h3>Bloqueo de Cuentas</h3>
                                            </div>
                                        </div>
                                        <div class="security-card-content">
                                            <div class="security-setting">
                                                <label class="security-label">Intentos fallidos máximos</label>
                                                <input type="number" class="security-input" id="max-failed-attempts" value="5" min="3" max="10">
                                            </div>
                                            <div class="security-setting">
                                                <label class="security-label">Tiempo de bloqueo (minutos)</label>
                                                <input type="number" class="security-input" id="lockout-duration" value="15" min="5" max="60">
                                            </div>
                                            <div class="security-setting">
                                                <label class="security-label">Notificar por email</label>
                                                <input type="checkbox" class="security-checkbox" id="notify-lockout" checked>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Settings Tab -->
                        <div class="tab-panel" data-panel="settings">
                            <div class="users-settings">
                                <div class="section-header">
                                    <h2>Configuración de Usuarios</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.users.resetSettings()">
                                            <i data-lucide="refresh-cw"></i>
                                            Restaurar Defecto
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.users.saveSettings()">
                                            <i data-lucide="save"></i>
                                            Guardar Configuración
                                        </button>
                                    </div>
                                </div>

                                <div class="settings-grid">
                                    <!-- Configuración general -->
                                    <div class="settings-card">
                                        <div class="settings-header">
                                            <div class="settings-title">
                                                <i data-lucide="users"></i>
                                                <h3>Configuración General</h3>
                                            </div>
                                        </div>
                                        <div class="settings-content">
                                            <div class="setting-item">
                                                <label class="setting-label">Rol por defecto para nuevos usuarios</label>
                                                <select class="setting-select" id="default-role">
                                                    <option value="user">Usuario</option>
                                                    <option value="viewer">Visualizador</option>
                                                    <option value="contributor">Colaborador</option>
                                                </select>
                                            </div>
                                            <div class="setting-item">
                                                <label class="setting-label">Departamento por defecto</label>
                                                <select class="setting-select" id="default-department">
                                                    <option value="">Seleccionar...</option>
                                                    <option value="administracion">Administración</option>
                                                    <option value="desarrollo">Desarrollo</option>
                                                    <option value="diseno">Diseño</option>
                                                    <option value="marketing">Marketing</option>
                                                </select>
                                            </div>
                                            <div class="setting-item">
                                                <label class="setting-label">Activación automática</label>
                                                <input type="checkbox" class="setting-checkbox" id="auto-activation">
                                            </div>
                                            <div class="setting-item">
                                                <label class="setting-label">Enviar email de bienvenida</label>
                                                <input type="checkbox" class="setting-checkbox" id="welcome-email" checked>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Notificaciones -->
                                    <div class="settings-card">
                                        <div class="settings-header">
                                            <div class="settings-title">
                                                <i data-lucide="bell"></i>
                                                <h3>Notificaciones</h3>
                                            </div>
                                        </div>
                                        <div class="settings-content">
                                            <div class="setting-item">
                                                <label class="setting-label">Notificar nuevos usuarios</label>
                                                <input type="checkbox" class="setting-checkbox" id="notify-new-users" checked>
                                            </div>
                                            <div class="setting-item">
                                                <label class="setting-label">Notificar cambios de rol</label>
                                                <input type="checkbox" class="setting-checkbox" id="notify-role-changes" checked>
                                            </div>
                                            <div class="setting-item">
                                                <label class="setting-label">Notificar bloqueos de cuenta</label>
                                                <input type="checkbox" class="setting-checkbox" id="notify-lockouts" checked>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Limpieza automática -->
                                    <div class="settings-card">
                                        <div class="settings-header">
                                            <div class="settings-title">
                                                <i data-lucide="trash-2"></i>
                                                <h3>Limpieza Automática</h3>
                                            </div>
                                        </div>
                                        <div class="settings-content">
                                            <div class="setting-item">
                                                <label class="setting-label">Eliminar usuarios inactivos después de (días)</label>
                                                <input type="number" class="setting-input" id="inactive-cleanup" value="365" min="30" max="1095">
                                            </div>
                                            <div class="setting-item">
                                                <label class="setting-label">Limpiar logs de auditoría después de (días)</label>
                                                <input type="number" class="setting-input" id="audit-cleanup" value="90" min="30" max="365">
                                            </div>
                                            <div class="setting-item">
                                                <label class="setting-label">Habilitar limpieza automática</label>
                                                <input type="checkbox" class="setting-checkbox" id="auto-cleanup">
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modales -->
                <div id="user-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="user-modal-title">Nuevo Usuario</h3>
                            <button class="modal-close" onclick="window.app.modules.users.closeModal('user-modal')">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div class="modal-body" id="user-modal-body">
                            <!-- El contenido se carga dinámicamente -->
                        </div>
                    </div>
                </div>

                <div id="role-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="role-modal-title">Nuevo Rol</h3>
                            <button class="modal-close" onclick="window.app.modules.users.closeModal('role-modal')">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div class="modal-body" id="role-modal-body">
                            <!-- El contenido se carga dinámicamente -->
                        </div>
                    </div>
                </div>

                <div id="bulk-actions-modal" class="modal" style="display: none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3>Acciones Masivas</h3>
                            <button class="modal-close" onclick="window.app.modules.users.closeModal('bulk-actions-modal')">
                                <i data-lucide="x"></i>
                            </button>
                        </div>
                        <div class="modal-body" id="bulk-actions-modal-body">
                            <!-- El contenido se carga dinámicamente -->
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = usersHTML;
            this.isInitialized = true;

        } catch (error) {
            console.error('❌ Error renderizando módulo de Usuarios:', error);
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i data-lucide="alert-triangle"></i>
                    </div>
                    <h3>Error al cargar Usuarios</h3>
                    <p>No se pudo cargar el módulo de usuarios. Inténtalo de nuevo.</p>
                    <button class="btn btn-primary" onclick="window.app.loadModule('users')">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
    async afterRender() {
        try {
            console.log('🔧 Configurando módulo de Usuarios...');
            
            // Setup tab navigation
            this.setupTabNavigation();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadData();
            
            // Render initial dashboard content
            this.renderDashboardContent();
            
            // Update dashboard stats
            this.updateDashboardStats();
            
            console.log('✅ Módulo de Usuarios configurado correctamente');
            
        } catch (error) {
            console.error('❌ Error en afterRender del módulo de Usuarios:', error);
        }
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.users-module .tab-btn');
        const tabPanels = document.querySelectorAll('.users-module .tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all buttons and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Add active class to clicked button and corresponding panel
                button.classList.add('active');
                const targetPanel = document.querySelector(`[data-panel="${targetTab}"]`);
                if (targetPanel) {
                    targetPanel.classList.add('active');
                }
                
                this.currentTab = targetTab;
                console.log(`📂 Cambiando a pestaña de usuarios: ${targetTab}`);
                
                // Load tab-specific data
                this.loadTabData(targetTab);
            });
        });
    }

    setupEventListeners() {
        // Search functionality
        const userSearch = document.getElementById('user-search');
        if (userSearch) {
            userSearch.addEventListener('input', 
                this.debounce((e) => this.handleUserSearch(e.target.value), 300)
            );
        }

        // Filter changes
        const filters = ['role-filter', 'status-filter', 'department-filter'];
        filters.forEach(filterId => {
            const filterElement = document.getElementById(filterId);
            if (filterElement) {
                filterElement.addEventListener('change', () => this.updateFilters());
            }
        });

        // View controls
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const viewType = button.getAttribute('data-view');
                this.switchView(viewType);
            });
        });

        // Sort controls
        const sortSelect = document.getElementById('sort-users');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => this.handleSortChange(e.target.value));
        }

        // Audit period change
        const auditPeriod = document.getElementById('audit-period');
        if (auditPeriod) {
            auditPeriod.addEventListener('change', (e) => this.handlePeriodChange(e.target.value));
        }

        // Modal close on background click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal(e.target.id);
            }
        });

        // Escape key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modalStack.length > 0) {
                this.closeModal(this.modalStack[this.modalStack.length - 1]);
            }
        });
    }

    async loadData() {
        try {
            console.log('📊 Cargando datos de usuarios...');
            
            // Simulate loading data - replace with actual API calls
            await new Promise(resolve => setTimeout(resolve, 800));
            
            this.data = {
                stats: {
                    totalUsers: 247,
                    activeUsers: 198,
                    last24h: 34,
                    rolesCount: 8,
                    pendingUsers: 12,
                    suspendedUsers: 3,
                    inactiveUsers: 46,
                    twoFactorEnabled: 160,
                    strongPasswords: 193
                },
                users: this.generateSampleUsers(),
                roles: this.generateSampleRoles(),
                permissions: this.generateSamplePermissions(),
                auditLogs: this.generateSampleAuditLogs(),
                departments: this.generateSampleDepartments(),
                rolesDistribution: this.generateRolesDistribution(),
                recentUsers: this.generateRecentUsers(),
                loginActivity: this.generateLoginActivity(),
                securityStatus: this.generateSecurityStatus(),
                userGrowth: this.generateUserGrowth(),
                departmentDistribution: this.generateDepartmentDistribution()
            };
            
            console.log('👥 Datos de usuarios cargados:', this.data);
            
        } catch (error) {
            console.error('❌ Error cargando datos de usuarios:', error);
            if (window.app) {
                window.app.showNotification('Error al cargar datos de usuarios', 'error');
            }
        }
    }

    generateSampleUsers() {
        const users = [
            {
                id: 1,
                name: 'Enrique García',
                email: 'enrique.garcia@mep-projects.com',
                avatar: 'EG',
                role: 'Administrador',
                department: 'Administración',
                status: 'active',
                lastLogin: '2025-06-02 14:30',
                created: '2024-01-15 09:00',
                permissions: ['*'],
                phone: '+34 612 345 678',
                location: 'Madrid, España',
                twoFactorEnabled: true,
                loginCount: 456,
                lastIP: '192.168.1.100',
                profileImage: 'css/fotoEG.png'
            },
            {
                id: 2,
                name: 'Beatriz Tudela',
                email: 'beatriz.tudela@mep-projects.com',
                avatar: 'BT',
                role: 'Project Manager',
                department: 'Administración',
                status: 'active',
                lastLogin: '2025-06-02 13:45',
                created: '2024-01-20 10:15',
                permissions: ['projects.manage', 'tasks.manage', 'users.view'],
                phone: '+34 623 456 789',
                location: 'Barcelona, España',
                twoFactorEnabled: true,
                loginCount: 342,
                lastIP: '192.168.1.105'
            },
            {
                id: 3,
                name: 'Carlos López',
                email: 'carlos.lopez@mep-projects.com',
                avatar: 'CL',
                role: 'Desarrollador Senior',
                department: 'Desarrollo',
                status: 'active',
                lastLogin: '2025-06-02 12:15',
                created: '2024-02-20 10:30',
                permissions: ['projects.view', 'projects.edit', 'tasks.manage', 'code.commit'],
                phone: '+34 687 234 567',
                location: 'Barcelona, España',
                twoFactorEnabled: true,
                loginCount: 324,
                lastIP: '192.168.1.101'
            },
            {
                id: 4,
                name: 'Ana Martínez',
                email: 'ana.martinez@mep-projects.com',
                avatar: 'AM',
                role: 'Diseñadora UX/UI',
                department: 'Diseño',
                status: 'active',
                lastLogin: '2025-06-02 11:30',
                created: '2024-03-10 14:20',
                permissions: ['projects.view', 'design.edit', 'assets.manage'],
                phone: '+34 698 345 678',
                location: 'Valencia, España',
                twoFactorEnabled: false,
                loginCount: 287,
                lastIP: '192.168.1.102'
            },
            {
                id: 5,
                name: 'David Morales',
                email: 'david.morales@mep-projects.com',
                avatar: 'DM',
                role: 'Analista de Datos',
                department: 'Desarrollo',
                status: 'pending',
                lastLogin: null,
                created: '2025-06-01 16:45',
                permissions: ['projects.view', 'reports.view'],
                phone: '+34 645 567 890',
                location: 'Sevilla, España',
                twoFactorEnabled: false,
                loginCount: 0,
                lastIP: null
            },
            {
                id: 6,
                name: 'Laura Fernández',
                email: 'laura.fernandez@mep-projects.com',
                avatar: 'LF',
                role: 'Marketing Manager',
                department: 'Marketing',
                status: 'active',
                lastLogin: '2025-06-01 18:20',
                created: '2024-04-15 09:30',
                permissions: ['projects.view', 'marketing.manage', 'content.edit'],
                phone: '+34 634 678 901',
                location: 'Madrid, España',
                twoFactorEnabled: true,
                loginCount: 156,
                lastIP: '192.168.1.103'
            },
            {
                id: 7,
                name: 'Miguel Rodríguez',
                email: 'miguel.rodriguez@mep-projects.com',
                avatar: 'MR',
                role: 'Desarrollador Junior',
                department: 'Desarrollo',
                status: 'active',
                lastLogin: '2025-06-02 09:15',
                created: '2024-05-01 11:00',
                permissions: ['projects.view', 'tasks.view', 'code.read'],
                phone: '+34 612 789 012',
                location: 'Bilbao, España',
                twoFactorEnabled: false,
                loginCount: 89,
                lastIP: '192.168.1.104'
            },
            {
                id: 8,
                name: 'Isabel García',
                email: 'isabel.garcia@mep-projects.com',
                avatar: 'IG',
                role: 'RRHH Manager',
                department: 'Administración',
                status: 'inactive',
                lastLogin: '2025-05-20 16:45',
                created: '2024-02-01 08:30',
                permissions: ['users.manage', 'rrhh.manage', 'reports.view'],
                phone: '+34 623 890 123',
                location: 'Madrid, España',
                twoFactorEnabled: true,
                loginCount: 234,
                lastIP: '192.168.1.106'
            }
        ];

        // Generate more users to reach 247 total
        for (let i = 9; i <= 247; i++) {
            const departments = ['Desarrollo', 'Diseño', 'Marketing', 'Administración'];
            const roles = ['Desarrollador', 'Diseñador', 'Analista', 'Coordinador'];
            const statuses = ['active', 'active', 'active', 'inactive', 'pending'];
            
            users.push({
                id: i,
                name: `Usuario ${i}`,
                email: `usuario${i}@mep-projects.com`,
                avatar: `U${i}`,
                role: roles[Math.floor(Math.random() * roles.length)],
                department: departments[Math.floor(Math.random() * departments.length)],
                status: statuses[Math.floor(Math.random() * statuses.length)],
                lastLogin: Math.random() > 0.2 ? this.generateRandomDate() : null,
                created: this.generateRandomDate('2024-01-01'),
                permissions: ['projects.view'],
                phone: `+34 6${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
                location: 'España',
                twoFactorEnabled: Math.random() > 0.4,
                loginCount: Math.floor(Math.random() * 500),
                lastIP: `192.168.1.${Math.floor(Math.random() * 255)}`
            });
        }

        return users;
    }

    generateSampleRoles() {
        return [
            {
                id: 1,
                name: 'Administrador',
                description: 'Acceso completo al sistema',
                permissions: ['*'],
                userCount: 3,
                color: '#EF4444',
                isSystem: true,
                created: '2024-01-01',
                isActive: true
            },
            {
                id: 2,
                name: 'Project Manager',
                description: 'Gestión de proyectos y equipos',
                permissions: ['projects.manage', 'tasks.manage', 'users.view', 'reports.view'],
                userCount: 8,
                color: '#8B5CF6',
                isSystem: true,
                created: '2024-01-01',
                isActive: true
            },
            {
                id: 3,
                name: 'Desarrollador Senior',
                description: 'Desarrollo de software avanzado',
                permissions: ['projects.view', 'projects.edit', 'tasks.manage', 'code.commit', 'code.review'],
                userCount: 25,
                color: '#3B82F6',
                isSystem: true,
                created: '2024-01-01',
                isActive: true
            },
            {
                id: 4,
                name: 'Desarrollador Junior',
                description: 'Desarrollo de software básico',
                permissions: ['projects.view', 'tasks.view', 'code.read', 'code.commit'],
                userCount: 45,
                color: '#06B6D4',
                isSystem: true,
                created: '2024-01-01',
                isActive: true
            },
            {
                id: 5,
                name: 'Diseñadora UX/UI',
                description: 'Diseño de interfaces y experiencia de usuario',
                permissions: ['projects.view', 'design.edit', 'assets.manage', 'feedback.view'],
                userCount: 18,
                color: '#EC4899',
                isSystem: true,
                created: '2024-01-01',
                isActive: true
            },
            {
                id: 6,
                name: 'Marketing Manager',
                description: 'Gestión de marketing y contenido',
                permissions: ['projects.view', 'marketing.manage', 'content.edit', 'analytics.view'],
                userCount: 12,
                color: '#F59E0B',
                isSystem: true,
                created: '2024-01-01',
                isActive: true
            },
            {
                id: 7,
                name: 'Analista de Datos',
                description: 'Análisis de datos y reportes',
                permissions: ['projects.view', 'reports.view', 'analytics.manage', 'data.export'],
                userCount: 15,
                color: '#10B981',
                isSystem: true,
                created: '2024-01-01',
                isActive: true
            },
            {
                id: 8,
                name: 'Cliente',
                description: 'Acceso limitado para clientes externos',
                permissions: ['projects.view', 'tasks.view', 'comments.add'],
                userCount: 78,
                color: '#6B7280',
                isSystem: false,
                created: '2024-01-15',
                isActive: true
            }
        ];
    }

    generateSamplePermissions() {
        return [
            // Proyectos
            { id: 'projects.view', name: 'Ver Proyectos', category: 'Proyectos', description: 'Permite ver la lista de proyectos' },
            { id: 'projects.create', name: 'Crear Proyectos', category: 'Proyectos', description: 'Permite crear nuevos proyectos' },
            { id: 'projects.edit', name: 'Editar Proyectos', category: 'Proyectos', description: 'Permite editar proyectos existentes' },
            { id: 'projects.delete', name: 'Eliminar Proyectos', category: 'Proyectos', description: 'Permite eliminar proyectos' },
            { id: 'projects.manage', name: 'Gestionar Proyectos', category: 'Proyectos', description: 'Acceso completo a gestión de proyectos' },
            
            // Tareas
            { id: 'tasks.view', name: 'Ver Tareas', category: 'Tareas', description: 'Permite ver tareas asignadas' },
            { id: 'tasks.create', name: 'Crear Tareas', category: 'Tareas', description: 'Permite crear nuevas tareas' },
            { id: 'tasks.edit', name: 'Editar Tareas', category: 'Tareas', description: 'Permite editar tareas' },
            { id: 'tasks.assign', name: 'Asignar Tareas', category: 'Tareas', description: 'Permite asignar tareas a usuarios' },
            { id: 'tasks.manage', name: 'Gestionar Tareas', category: 'Tareas', description: 'Acceso completo a gestión de tareas' },
            
            // Usuarios
            { id: 'users.view', name: 'Ver Usuarios', category: 'Usuarios', description: 'Permite ver la lista de usuarios' },
            { id: 'users.create', name: 'Crear Usuarios', category: 'Usuarios', description: 'Permite crear nuevos usuarios' },
            { id: 'users.edit', name: 'Editar Usuarios', category: 'Usuarios', description: 'Permite editar usuarios existentes' },
            { id: 'users.delete', name: 'Eliminar Usuarios', category: 'Usuarios', description: 'Permite eliminar usuarios' },
            { id: 'users.manage', name: 'Gestionar Usuarios', category: 'Usuarios', description: 'Acceso completo a gestión de usuarios' },
            
            // Código
            { id: 'code.read', name: 'Ver Código', category: 'Desarrollo', description: 'Permite ver repositorios de código' },
            { id: 'code.commit', name: 'Hacer Commits', category: 'Desarrollo', description: 'Permite hacer commits al repositorio' },
            { id: 'code.review', name: 'Revisar Código', category: 'Desarrollo', description: 'Permite revisar pull requests' },
            { id: 'code.deploy', name: 'Desplegar Código', category: 'Desarrollo', description: 'Permite desplegar a producción' },
            
            // Diseño
            { id: 'design.view', name: 'Ver Diseños', category: 'Diseño', description: 'Permite ver archivos de diseño' },
            { id: 'design.edit', name: 'Editar Diseños', category: 'Diseño', description: 'Permite editar archivos de diseño' },
            { id: 'assets.manage', name: 'Gestionar Assets', category: 'Diseño', description: 'Permite gestionar recursos digitales' },
            
            // Marketing
            { id: 'marketing.view', name: 'Ver Marketing', category: 'Marketing', description: 'Permite ver campañas de marketing' },
            { id: 'marketing.manage', name: 'Gestionar Marketing', category: 'Marketing', description: 'Permite gestionar campañas' },
            { id: 'content.edit', name: 'Editar Contenido', category: 'Marketing', description: 'Permite editar contenido' },
            
            // Reportes
            { id: 'reports.view', name: 'Ver Reportes', category: 'Reportes', description: 'Permite ver reportes del sistema' },
            { id: 'reports.create', name: 'Crear Reportes', category: 'Reportes', description: 'Permite crear nuevos reportes' },
            { id: 'analytics.view', name: 'Ver Analytics', category: 'Reportes', description: 'Permite ver métricas y analytics' },
            { id: 'analytics.manage', name: 'Gestionar Analytics', category: 'Reportes', description: 'Permite configurar analytics' },
            
            // RRHH
            { id: 'rrhh.view', name: 'Ver RRHH', category: 'RRHH', description: 'Permite ver información de RRHH' },
            { id: 'rrhh.manage', name: 'Gestionar RRHH', category: 'RRHH', description: 'Permite gestionar recursos humanos' },
            
            // Sistema
            { id: 'system.admin', name: 'Administrar Sistema', category: 'Sistema', description: 'Acceso completo al sistema' },
            { id: 'audit.view', name: 'Ver Auditoría', category: 'Sistema', description: 'Permite ver logs de auditoría' },
            { id: 'settings.manage', name: 'Gestionar Configuración', category: 'Sistema', description: 'Permite cambiar configuración del sistema' }
        ];
    }

    generateSampleAuditLogs() {
        const actions = ['login', 'logout', 'create', 'update', 'delete', 'view', 'export'];
        const users = ['Enrique García', 'Beatriz Tudela', 'Carlos López', 'Ana Martínez', 'Laura Fernández'];
        const entities = ['Usuario', 'Proyecto', 'Tarea', 'Rol', 'Configuración'];
        const logs = [];

        for (let i = 1; i <= 100; i++) {
            const action = actions[Math.floor(Math.random() * actions.length)];
            const user = users[Math.floor(Math.random() * users.length)];
            const entity = entities[Math.floor(Math.random() * entities.length)];
            
            logs.push({
                id: i,
                user: user,
                action: action,
                entity: entity,
                details: this.generateAuditDetails(action, entity),
                ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
                userAgent: 'Chrome 125.0.0.0',
                timestamp: this.generateRandomDate('2025-05-01'),
                status: Math.random() > 0.1 ? 'success' : 'error',
                severity: this.getAuditSeverity(action)
            });
        }

        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    generateAuditDetails(action, entity) {
        const details = {
            'login': [`Inicio de sesión exitoso`, `Inicio de sesión fallido`, `Inicio de sesión con 2FA`],
            'logout': [`Cierre de sesión normal`, `Cierre de sesión por timeout`, `Cierre de sesión forzado`],
            'create': [`${entity} creado exitosamente`, `Error al crear ${entity}`, `${entity} creado y notificado`],
            'update': [`${entity} actualizado`, `Cambios guardados en ${entity}`, `${entity} modificado por admin`],
            'delete': [`${entity} eliminado`, `${entity} enviado a papelera`, `${entity} eliminado permanentemente`],
            'view': [`${entity} consultado`, `Acceso a ${entity}`, `${entity} visualizado`],
            'export': [`${entity} exportado a Excel`, `${entity} exportado a PDF`, `Datos de ${entity} descargados`]
        };
        
        const options = details[action] || [`Acción ${action} en ${entity}`];
        return options[Math.floor(Math.random() * options.length)];
    }

    getAuditSeverity(action) {
        const severityMap = {
            'login': 'low',
            'logout': 'low',
            'view': 'low',
            'create': 'medium',
            'update': 'medium',
            'delete': 'high',
            'export': 'medium'
        };
        return severityMap[action] || 'low';
    }

    generateSampleDepartments() {
        return [
            { id: 'administracion', name: 'Administración', userCount: 25, manager: 'Enrique García' },
            { id: 'desarrollo', name: 'Desarrollo', userCount: 89, manager: 'Carlos López' },
            { id: 'diseno', name: 'Diseño', userCount: 23, manager: 'Ana Martínez' },
            { id: 'marketing', name: 'Marketing', userCount: 18, manager: 'Laura Fernández' },
            { id: 'rrhh', name: 'Recursos Humanos', userCount: 8, manager: 'Isabel García' },
            { id: 'ventas', name: 'Ventas', userCount: 34, manager: 'Miguel Rodríguez' },
            { id: 'soporte', name: 'Soporte Técnico', userCount: 15, manager: 'David Morales' }
        ];
    }

    generateRolesDistribution() {
        return [
            { role: 'Cliente', count: 78, percentage: 32, color: '#6B7280' },
            { role: 'Desarrollador Junior', count: 45, percentage: 18, color: '#06B6D4' },
            { role: 'Desarrollador Senior', count: 25, percentage: 10, color: '#3B82F6' },
            { role: 'Diseñadora UX/UI', count: 18, percentage: 7, color: '#EC4899' },
            { role: 'Analista de Datos', count: 15, percentage: 6, color: '#10B981' },
            { role: 'Marketing Manager', count: 12, percentage: 5, color: '#F59E0B' },
            { role: 'Project Manager', count: 8, percentage: 3, color: '#8B5CF6' },
            { role: 'Administrador', count: 3, percentage: 1, color: '#EF4444' }
        ];
    }

    generateRecentUsers() {
        return [
            {
                id: 5,
                name: 'David Morales',
                email: 'david.morales@mep-projects.com',
                avatar: 'DM',
                role: 'Analista de Datos',
                department: 'Desarrollo',
                status: 'pending',
                created: 'hace 1 día',
                invitedBy: 'Enrique García'
            },
            {
                id: 248,
                name: 'Carmen Ruiz',
                email: 'carmen.ruiz@mep-projects.com',
                avatar: 'CR',
                role: 'Coordinadora de Marketing',
                department: 'Marketing',
                status: 'active',
                created: 'hace 2 días',
                invitedBy: 'Laura Fernández'
            },
            {
                id: 249,
                name: 'Javier Sánchez',
                email: 'javier.sanchez@mep-projects.com',
                avatar: 'JS',
                role: 'Desarrollador Frontend',
                department: 'Desarrollo',
                status: 'active',
                created: 'hace 3 días',
                invitedBy: 'Carlos López'
            },
            {
                id: 250,
                name: 'Elena Torres',
                email: 'elena.torres@mep-projects.com',
                avatar: 'ET',
                role: 'Diseñadora Gráfica',
                department: 'Diseño',
                status: 'pending',
                created: 'hace 5 días',
                invitedBy: 'Ana Martínez'
            }
        ];
    }

    generateLoginActivity() {
        const activity = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            activity.push({
                date: date.toISOString().split('T')[0],
                logins: Math.floor(Math.random() * 30) + 20,
                unique: Math.floor(Math.random() * 25) + 15,
                failed: Math.floor(Math.random() * 5),
                peak: Math.floor(Math.random() * 8) + 9 // hora pico
            });
        }
        
        return activity;
    }

    generateSecurityStatus() {
        return [
            { 
                metric: '2FA Habilitado', 
                value: '65%', 
                status: 'warning', 
                target: '80%',
                count: 160,
                total: 247
            },
            { 
                metric: 'Contraseñas Fuertes', 
                value: '78%', 
                status: 'success', 
                target: '90%',
                count: 193,
                total: 247
            },
            { 
                metric: 'Cuentas Bloqueadas', 
                value: '2', 
                status: 'success', 
                target: '< 5',
                count: 2,
                total: 247
            },
            { 
                metric: 'Sesiones Activas', 
                value: '134', 
                status: 'info', 
                target: '< 200',
                count: 134,
                total: 247
            }
        ];
    }

    generateUserGrowth() {
        const growth = [];
        const today = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today);
            date.setMonth(date.getMonth() - i);
            
            growth.push({
                month: date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
                users: Math.floor(Math.random() * 20) + 200 + (11 - i) * 5,
                newUsers: Math.floor(Math.random() * 15) + 5,
                activeUsers: Math.floor(Math.random() * 180) + 150
            });
        }
        
        return growth;
    }

    generateDepartmentDistribution() {
        return [
            { department: 'Desarrollo', count: 89, percentage: 36, color: '#3B82F6' },
            { department: 'Ventas', count: 34, percentage: 14, color: '#10B981' },
            { department: 'Administración', count: 25, percentage: 10, color: '#8B5CF6' },
            { department: 'Diseño', count: 23, percentage: 9, color: '#EC4899' },
            { department: 'Marketing', count: 18, percentage: 7, color: '#F59E0B' },
            { department: 'Soporte Técnico', count: 15, percentage: 6, color: '#06B6D4' },
            { department: 'RRHH', count: 8, percentage: 3, color: '#EF4444' }
        ];
    }

    generateRandomDate(startDate = '2024-01-01') {
        const start = new Date(startDate);
        const end = new Date();
        const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
        return new Date(randomTime).toISOString().slice(0, 19).replace('T', ' ');
    }

    updateDashboardStats() {
        if (!this.data.stats) return;

        // Update main stats
        const totalUsersEl = document.getElementById('total-users');
        const activeUsersEl = document.getElementById('active-users');
        const recentLoginsEl = document.getElementById('recent-logins');
        const rolesCountEl = document.getElementById('roles-count');

        if (totalUsersEl) totalUsersEl.textContent = this.data.stats.totalUsers;
        if (activeUsersEl) activeUsersEl.textContent = this.data.stats.activeUsers;
        if (recentLoginsEl) recentLoginsEl.textContent = this.data.stats.last24h;
        if (rolesCountEl) rolesCountEl.textContent = this.data.stats.rolesCount;

        // Update percentages
        const activePercentageEl = document.getElementById('active-percentage');
        if (activePercentageEl) {
            const percentage = Math.round((this.data.stats.activeUsers / this.data.stats.totalUsers) * 100);
            activePercentageEl.textContent = `${percentage}% del total`;
        }
    }

    renderDashboardContent() {
        this.renderRolesDistribution();
        this.renderRecentUsers();
        this.renderLoginActivity();
        this.renderSecurityStatus();
        return true;
    }

    // Utility method for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    renderRolesDistribution() {
        const container = document.getElementById('roles-distribution');
        if (!container || !this.data.rolesDistribution) return '';

        const distributionHTML = this.data.rolesDistribution.map(item => `
            <div class="role-distribution-item">
                <div class="role-info">
                    <div class="role-color" style="background-color: ${item.color}"></div>
                    <span class="role-name">${item.role}</span>
                </div>
                <div class="role-stats">
                    <span class="role-count">${item.count}</span>
                    <div class="role-bar">
                        <div class="role-fill" style="width: ${item.percentage}%; background-color: ${item.color}"></div>
                    </div>
                    <span class="role-percentage">${item.percentage}%</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = distributionHTML;
        return distributionHTML;
    }

    renderRecentUsers() {
        const container = document.getElementById('recent-users-list');
        if (!container || !this.data.recentUsers) return '';

        const usersHTML = this.data.recentUsers.map(user => `
            <div class="recent-user-item" onclick="window.app.modules.users.viewUser(${user.id})">
                <div class="user-avatar">${user.avatar}</div>
                <div class="user-info">
                    <div class="user-name">${user.name}</div>
                    <div class="user-email">${user.email}</div>
                    <div class="user-role">${user.role}</div>
                </div>
                <div class="user-meta">
                    <span class="badge badge-${this.getStatusBadgeClass(user.status)}">${this.getStatusLabel(user.status)}</span>
                    <div class="user-created">${user.created}</div>
                    ${user.invitedBy ? `<div class="user-invited">por ${user.invitedBy}</div>` : ''}
                </div>
            </div>
        `).join('');

        container.innerHTML = usersHTML;
        return usersHTML;
    }

    renderLoginActivity() {
        const container = document.getElementById('login-activity-chart');
        if (!container || !this.data.loginActivity) return '';

        const maxLogins = Math.max(...this.data.loginActivity.map(day => day.logins));
        const todayLogins = this.data.loginActivity[this.data.loginActivity.length - 1]?.logins || 0;

        const chartHTML = `
            <div class="activity-chart">
                <div class="chart-header">
                    <span class="chart-metric">Logins Diarios</span>
                    <span class="chart-value">${todayLogins} hoy</span>
                </div>
                <div class="chart-bars">
                    ${this.data.loginActivity.map(day => `
                        <div class="chart-bar-container" title="${day.date}: ${day.logins} logins, ${day.unique} únicos">
                            <div class="chart-bar" style="height: ${(day.logins / maxLogins) * 100}%"></div>
                            <span class="chart-label">${day.date.split('-')[2]}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="chart-legend">
                    <span class="chart-legend-item">
                        <span class="chart-legend-color"></span>
                        Logins totales
                    </span>
                </div>
            </div>
        `;

        container.innerHTML = chartHTML;
        return chartHTML;
    }

    renderSecurityStatus() {
        const container = document.getElementById('security-status');
        if (!container || !this.data.securityStatus) return '';

        const statusHTML = this.data.securityStatus.map(item => `
            <div class="security-metric">
                <div class="metric-header">
                    <span class="metric-name">${item.metric}</span>
                    <span class="metric-status status-${item.status}"></span>
                </div>
                <div class="metric-value">${item.value}</div>
                <div class="metric-target">Objetivo: ${item.target}</div>
                ${item.count !== undefined ? `<div class="metric-count">${item.count} de ${item.total}</div>` : ''}
            </div>
        `).join('');

        container.innerHTML = statusHTML;
        return statusHTML;
    }

    async loadTabData(tabName) {
        try {
            console.log(`📈 Cargando datos para pestaña: ${tabName}`);
            
            switch (tabName) {
                case 'dashboard':
                    this.renderDashboardContent();
                    this.updateDashboardStats();
                    break;
                case 'users':
                    this.renderUsersTab();
                    break;
                case 'roles':
                    this.renderRolesTab();
                    break;
                case 'audit':
                    this.renderAuditTab();
                    break;
                case 'security':
                    this.renderSecurityTab();
                    break;
                case 'settings':
                    this.renderSettingsTab();
                    break;
            }
            
        } catch (error) {
            console.error(`❌ Error cargando datos para ${tabName}:`, error);
        }
    }

    renderUsersTab() {
        this.updateUserFilters();
        this.renderUsersTable();
        this.renderUsersQuickStats();
        this.renderUsersPagination();
        return true;
    }

    updateUserFilters() {
        // Update role filter
        const roleFilter = document.getElementById('role-filter');
        if (roleFilter && this.data.roles) {
            const optionsHTML = '<option value="">Todos los roles</option>' +
                this.data.roles.map(role => `<option value="${role.name}">${role.name}</option>`).join('');
            roleFilter.innerHTML = optionsHTML;
        }

        // Update department filter
        const departmentFilter = document.getElementById('department-filter');
        if (departmentFilter && this.data.departments) {
            const optionsHTML = '<option value="">Todos los departamentos</option>' +
                this.data.departments.map(dept => `<option value="${dept.name}">${dept.name}</option>`).join('');
            departmentFilter.innerHTML = optionsHTML;
        }
        return true;
    }

    renderUsersTable() {
        const container = document.getElementById('users-table');
        if (!container || !this.data.users) return '';

        const filteredUsers = this.getFilteredAndSortedUsers();
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        const tableHTML = `
            <div class="users-table-container">
                <table class="data-table-enhanced">
                    <thead>
                        <tr>
                            <th>
                                <input type="checkbox" class="table-checkbox" 
                                       onchange="window.app.modules.users.toggleSelectAll(this.checked)">
                            </th>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Departamento</th>
                            <th>Estado</th>
                            <th>Último Login</th>
                            <th>2FA</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${paginatedUsers.map(user => `
                            <tr class="table-row-enhanced ${this.selectedUsers.has(user.id) ? 'selected' : ''}" 
                                data-user-id="${user.id}">
                                <td>
                                    <input type="checkbox" class="table-checkbox" 
                                           ${this.selectedUsers.has(user.id) ? 'checked' : ''}
                                           onchange="window.app.modules.users.toggleUserSelection(${user.id}, this.checked)">
                                </td>
                                <td>
                                    <div class="user-cell">
                                        <div class="user-avatar" style="background-color: ${this.getAvatarColor(user.name)}">
                                            ${user.profileImage ? 
                                                `<img src="${user.profileImage}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : 
                                                user.avatar}
                                        </div>
                                        <div class="user-details">
                                            <div class="user-name">${user.name}</div>
                                            <div class="user-email">${user.email}</div>
                                            ${user.phone ? `<div class="user-phone">${user.phone}</div>` : ''}
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span class="role-badge" style="background-color: ${this.getRoleColor(user.role)}20; color: ${this.getRoleColor(user.role)}">
                                        ${user.role}
                                    </span>
                                </td>
                                <td>
                                    <span class="department-tag">${user.department}</span>
                                </td>
                                <td>
                                    <span class="status-badge status-${user.status}">
                                        ${this.getStatusIcon(user.status)} ${this.getStatusLabel(user.status)}
                                    </span>
                                </td>
                                <td>
                                    <div class="login-info">
                                        <div class="login-date">${user.lastLogin ? this.formatDate(user.lastLogin) : 'Nunca'}</div>
                                        ${user.lastIP ? `<div class="login-ip">${user.lastIP}</div>` : ''}
                                        ${user.loginCount ? `<div class="login-count">${user.loginCount} logins</div>` : ''}
                                    </div>
                                </td>
                                <td>
                                    <span class="two-factor-status ${user.twoFactorEnabled ? 'enabled' : 'disabled'}">
                                        <i data-lucide="${user.twoFactorEnabled ? 'shield-check' : 'shield-x'}"></i>
                                        ${user.twoFactorEnabled ? 'Habilitado' : 'Deshabilitado'}
                                    </span>
                                </td>
                                <td>
                                    <div class="table-actions-enhanced">
                                        <button class="btn-icon-enhanced" onclick="window.app.modules.users.viewUser(${user.id})" title="Ver detalles">
                                            <i data-lucide="eye"></i>
                                        </button>
                                        <button class="btn-icon-enhanced" onclick="window.app.modules.users.editUser(${user.id})" title="Editar">
                                            <i data-lucide="edit"></i>
                                        </button>
                                        <div class="dropdown-table">
                                            <button class="btn-icon-enhanced" onclick="window.app.modules.users.toggleUserMenu(${user.id})" title="Más opciones">
                                                <i data-lucide="more-horizontal"></i>
                                            </button>
                                            <div class="dropdown-menu-table" id="user-menu-${user.id}">
                                                <a href="#" onclick="window.app.modules.users.resetPassword(${user.id})">
                                                    <i data-lucide="key"></i> Resetear contraseña
                                                </a>
                                                <a href="#" onclick="window.app.modules.users.toggle2FA(${user.id})">
                                                    <i data-lucide="smartphone"></i> ${user.twoFactorEnabled ? 'Deshabilitar' : 'Habilitar'} 2FA
                                                </a>
                                                <a href="#" onclick="window.app.modules.users.viewAudit(${user.id})">
                                                    <i data-lucide="file-text"></i> Ver auditoría
                                                </a>
                                                <div class="dropdown-divider"></div>
                                                <a href="#" onclick="window.app.modules.users.suspendUser(${user.id})" class="text-warning">
                                                    <i data-lucide="pause"></i> ${user.status === 'suspended' ? 'Reactivar' : 'Suspender'}
                                                </a>
                                                <a href="#" onclick="window.app.modules.users.deleteUser(${user.id})" class="text-danger">
                                                    <i data-lucide="trash-2"></i> Eliminar
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                ${paginatedUsers.length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i data-lucide="users"></i>
                        </div>
                        <h3>No se encontraron usuarios</h3>
                        <p>Intenta ajustar los filtros de búsqueda</p>
                        <button class="btn btn-secondary" onclick="window.app.modules.users.clearFilters()">
                            Limpiar filtros
                        </button>
                    </div>
                ` : ''}
            </div>
        `;

        container.innerHTML = tableHTML;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        return tableHTML;
    }

    renderUsersQuickStats() {
        const container = document.getElementById('users-quick-stats');
        if (!container) return '';

        const filteredUsers = this.getFilteredUsers();
        const activeUsers = filteredUsers.filter(u => u.status === 'active').length;
        const pendingUsers = filteredUsers.filter(u => u.status === 'pending').length;
        const twoFactorUsers = filteredUsers.filter(u => u.twoFactorEnabled).length;

        const statsHTML = `
            <div class="quick-stats-container">
                <div class="quick-stat-enhanced">
                    <div class="stat-icon-enhanced">
                        <i data-lucide="users"></i>
                    </div>
                    <div class="stat-content-enhanced">
                        <span class="stat-label-enhanced">Total Filtrado</span>
                        <span class="stat-value-enhanced">${filteredUsers.length}</span>
                    </div>
                </div>
                <div class="quick-stat-enhanced">
                    <div class="stat-icon-enhanced success">
                        <i data-lucide="user-check"></i>
                    </div>
                    <div class="stat-content-enhanced">
                        <span class="stat-label-enhanced">Activos</span>
                        <span class="stat-value-enhanced">${activeUsers}</span>
                    </div>
                </div>
                <div class="quick-stat-enhanced">
                    <div class="stat-icon-enhanced warning">
                        <i data-lucide="clock"></i>
                    </div>
                    <div class="stat-content-enhanced">
                        <span class="stat-label-enhanced">Pendientes</span>
                        <span class="stat-value-enhanced">${pendingUsers}</span>
                    </div>
                </div>
                <div class="quick-stat-enhanced">
                    <div class="stat-icon-enhanced info">
                        <i data-lucide="shield-check"></i>
                    </div>
                    <div class="stat-content-enhanced">
                        <span class="stat-label-enhanced">Con 2FA</span>
                        <span class="stat-value-enhanced">${twoFactorUsers}</span>
                    </div>
                </div>
                ${this.selectedUsers.size > 0 ? `
                    <div class="quick-stat-enhanced selected">
                        <div class="stat-icon-enhanced">
                            <i data-lucide="check-square"></i>
                        </div>
                        <div class="stat-content-enhanced">
                            <span class="stat-label-enhanced">Seleccionados</span>
                            <span class="stat-value-enhanced">${this.selectedUsers.size}</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;

        container.innerHTML = statsHTML;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        return statsHTML;
    }

    renderUsersPagination() {
        const container = document.getElementById('users-pagination');
        if (!container) return '';

        const filteredUsers = this.getFilteredUsers();
        const totalPages = Math.ceil(filteredUsers.length / this.itemsPerPage);
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return '';
        }

        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, filteredUsers.length);

        const paginationHTML = `
            <div class="pagination-container">
                <div class="pagination-info">
                    Mostrando ${startItem}-${endItem} de ${filteredUsers.length} usuarios
                </div>
                <div class="pagination-controls">
                    <button class="btn btn-ghost btn-sm" 
                            ${this.currentPage === 1 ? 'disabled' : ''} 
                            onclick="window.app.modules.users.goToPage(${this.currentPage - 1})">
                        <i data-lucide="chevron-left"></i>
                        Anterior
                    </button>
                    
                    <div class="pagination-pages">
                        ${this.generatePageNumbers(totalPages).map(page => `
                            <button class="btn ${page === this.currentPage ? 'btn-primary' : 'btn-ghost'} btn-sm"
                                    onclick="window.app.modules.users.goToPage(${page})">
                                ${page}
                            </button>
                        `).join('')}
                    </div>
                    
                    <button class="btn btn-ghost btn-sm" 
                            ${this.currentPage === totalPages ? 'disabled' : ''} 
                            onclick="window.app.modules.users.goToPage(${this.currentPage + 1})">
                        Siguiente
                        <i data-lucide="chevron-right"></i>
                    </button>
                </div>
                <div class="pagination-size">
                    <select class="pagination-select" onchange="window.app.modules.users.changePageSize(this.value)">
                        <option value="10" ${this.itemsPerPage === 10 ? 'selected' : ''}>10 por página</option>
                        <option value="25" ${this.itemsPerPage === 25 ? 'selected' : ''}>25 por página</option>
                        <option value="50" ${this.itemsPerPage === 50 ? 'selected' : ''}>50 por página</option>
                        <option value="100" ${this.itemsPerPage === 100 ? 'selected' : ''}>100 por página</option>
                    </select>
                </div>
            </div>
        `;

        container.innerHTML = paginationHTML;

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        return paginationHTML;
    }

    generatePageNumbers(totalPages) {
        const pages = [];
        const current = this.currentPage;
        const delta = 2; // Number of pages to show around current page

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
                pages.push(i);
            } else if (pages[pages.length - 1] !== '...') {
                pages.push('...');
            }
        }

        return pages.filter(page => page !== '...');
    }

    renderRolesTab() {
        this.renderRolesGrid();
        this.renderPermissionsMatrix();
        return true;
    }

    renderRolesGrid() {
        const container = document.getElementById('roles-grid');
        if (!container || !this.data.roles) return '';

        const rolesHTML = this.data.roles.map(role => `
            <div class="role-card">
                <div class="role-header">
                    <div class="role-color" style="background-color: ${role.color}"></div>
                    <div class="role-info">
                        <h3>${role.name}</h3>
                        <p>${role.description}</p>
                        ${role.isSystem ? '<span class="role-system-badge">Sistema</span>' : ''}
                    </div>
                    <div class="role-actions">
                        <button class="btn-icon" onclick="window.app.modules.users.editRole(${role.id})" title="Editar rol">
                            <i data-lucide="edit"></i>
                        </button>
                        ${!role.isSystem ? `
                            <button class="btn-icon text-danger" onclick="window.app.modules.users.deleteRole(${role.id})" title="Eliminar rol">
                                <i data-lucide="trash-2"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
                <div class="role-stats">
                    <div class="role-stat">
                        <span class="stat-label">Usuarios:</span>
                        <span class="stat-value">${role.userCount}</span>
                    </div>
                    <div class="role-stat">
                        <span class="stat-label">Permisos:</span>
                        <span class="stat-value">${role.permissions.includes('*') ? 'Todos' : role.permissions.length}</span>
                    </div>
                    <div class="role-stat">
                        <span class="stat-label">Estado:</span>
                        <span class="stat-value status-${role.isActive ? 'active' : 'inactive'}">
                            ${role.isActive ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                </div>
                <div class="role-permissions-preview">
                    <div class="permissions-label">Permisos principales:</div>
                    <div class="permissions-list">
                        ${role.permissions.includes('*') ? 
                            '<span class="permission-badge admin">Acceso completo</span>' :
                            role.permissions.slice(0, 3).map(perm => `
                                <span class="permission-badge">${this.getPermissionName(perm)}</span>
                            `).join('') + (role.permissions.length > 3 ? `<span class="permission-more">+${role.permissions.length - 3} más</span>` : '')
                        }
                    </div>
                </div>
                <div class="role-created">
                    Creado: ${this.formatDate(role.created)}
                </div>
            </div>
        `).join('');

        container.innerHTML = rolesHTML;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        return rolesHTML;
    }

    renderPermissionsMatrix() {
        const container = document.getElementById('permissions-matrix');
        if (!container || !this.data.permissions || !this.data.roles) return '';

        // Group permissions by category
        const permissionsByCategory = {};
        this.data.permissions.forEach(permission => {
            if (!permissionsByCategory[permission.category]) {
                permissionsByCategory[permission.category] = [];
            }
            permissionsByCategory[permission.category].push(permission);
        });

        const matrixHTML = `
            <div class="permissions-matrix-container">
                <div class="matrix-header">
                    <div class="matrix-corner">Permisos / Roles</div>
                    ${this.data.roles.filter(role => role.isActive).map(role => `
                        <div class="matrix-role-header" style="border-bottom: 3px solid ${role.color}">
                            <span class="role-name">${role.name}</span>
                            <span class="role-users">${role.userCount} usuarios</span>
                        </div>
                    `).join('')}
                </div>
                
                ${Object.entries(permissionsByCategory).map(([category, permissions]) => `
                    <div class="matrix-category">
                        <div class="matrix-category-header">
                            <h4>${category}</h4>
                            <span class="category-count">${permissions.length} permisos</span>
                        </div>
                        ${permissions.map(permission => `
                            <div class="matrix-permission-row">
                                <div class="matrix-permission-info">
                                    <div class="permission-name">${permission.name}</div>
                                    <div class="permission-description">${permission.description}</div>
                                </div>
                                ${this.data.roles.filter(role => role.isActive).map(role => `
                                    <div class="matrix-permission-cell">
                                        <input type="checkbox" 
                                               class="permission-checkbox"
                                               ${this.hasPermission(role, permission.id) ? 'checked' : ''}
                                               ${role.isSystem ? 'disabled' : ''}
                                               onchange="window.app.modules.users.togglePermission('${role.id}', '${permission.id}', this.checked)">
                                    </div>
                                `).join('')}
                            </div>
                        `).join('')}
                    </div>
                `).join('')}
            </div>
        `;

        container.innerHTML = matrixHTML;
        return matrixHTML;
    }

    renderAuditTab() {
        this.renderAuditTimeline();
        this.renderAuditStats();
        return true;
    }

    renderAuditTimeline() {
        const container = document.getElementById('audit-timeline');
        if (!container || !this.data.auditLogs) return '';

        const groupedLogs = this.groupAuditLogsByDate();

        const timelineHTML = `
            <div class="audit-timeline-container">
                ${Object.entries(groupedLogs).map(([date, logs]) => `
                    <div class="audit-date-group">
                        <div class="audit-date-header">
                            <h4>${this.formatAuditDate(date)}</h4>
                            <span class="audit-count">${logs.length} eventos</span>
                        </div>
                        <div class="audit-events">
                            ${logs.map(log => `
                                <div class="audit-item severity-${log.severity}">
                                    <div class="audit-icon">
                                        <i data-lucide="${this.getAuditIcon(log.action)}"></i>
                                    </div>
                                    <div class="audit-content">
                                        <div class="audit-header">
                                            <span class="audit-user">${log.user}</span>
                                            <span class="audit-action action-${log.action}">${this.getActionLabel(log.action)}</span>
                                            <span class="audit-entity">${log.entity}</span>
                                        </div>
                                        <div class="audit-details">${log.details}</div>
                                        <div class="audit-meta">
                                            <span class="audit-time">${this.formatTime(log.timestamp)}</span>
                                            <span class="audit-ip">${log.ip}</span>
                                            <span class="audit-status status-${log.status}">${log.status}</span>
                                            ${log.severity === 'high' ? '<span class="audit-severity-badge">Alto riesgo</span>' : ''}
                                        </div>
                                    </div>
                                    <div class="audit-actions">
                                        <button class="btn-icon-small" onclick="window.app.modules.users.viewAuditDetails('${log.id}')" title="Ver detalles">
                                            <i data-lucide="eye"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
                
                ${Object.keys(groupedLogs).length === 0 ? `
                    <div class="empty-state">
                        <div class="empty-icon">
                            <i data-lucide="file-text"></i>
                        </div>
                        <h3>No hay eventos de auditoría</h3>
                        <p>No se encontraron eventos para el período seleccionado</p>
                    </div>
                ` : ''}
            </div>
        `;

        container.innerHTML = timelineHTML;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        return timelineHTML;
    }

    renderAuditStats() {
        // Add audit statistics if needed
        return true;
    }

    renderSecurityTab() {
        console.log('🔒 Renderizando configuración de seguridad');
        this.setupSecurityEventListeners();
        return true;
    }

    renderSettingsTab() {
        console.log('⚙️ Renderizando configuración de usuarios');
        this.setupSettingsEventListeners();
        return true;
    }

    setupSecurityEventListeners() {
        // Password policy listeners
        const securityInputs = [
            'min-password-length', 'require-uppercase', 'require-numbers', 
            'require-symbols', 'password-expiry', 'session-timeout', 
            'concurrent-sessions', 'force-logout', 'force-2fa-admin', 
            'force-2fa-all', 'preferred-2fa', 'max-failed-attempts', 
            'lockout-duration', 'notify-lockout'
        ];

        securityInputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (element) {
                element.addEventListener('change', () => {
                    this.markSecuritySettingsAsChanged();
                });
            }
        });
    }

    setupSettingsEventListeners() {
        // Settings listeners
        const settingsInputs = [
            'default-role', 'default-department', 'auto-activation', 
            'welcome-email', 'notify-new-users', 'notify-role-changes', 
            'notify-lockouts', 'inactive-cleanup', 'audit-cleanup', 'auto-cleanup'
        ];

        settingsInputs.forEach(inputId => {
            const element = document.getElementById(inputId);
            if (element) {
                element.addEventListener('change', () => {
                    this.markSettingsAsChanged();
                });
            }
        });
    }

    markSecuritySettingsAsChanged() {
        // Visual feedback that settings have changed
        const saveButton = document.querySelector('[onclick="window.app.modules.users.saveSecuritySettings()"]');
        if (saveButton) {
            saveButton.classList.add('btn-warning');
            saveButton.innerHTML = '<i data-lucide="save"></i> Guardar Cambios';
        }
    }

    markSettingsAsChanged() {
        // Visual feedback that settings have changed
        const saveButton = document.querySelector('[onclick="window.app.modules.users.saveSettings()"]');
        if (saveButton) {
            saveButton.classList.add('btn-warning');
            saveButton.innerHTML = '<i data-lucide="save"></i> Guardar Cambios';
        }
    }

    // Utility methods
    getFilteredUsers() {
        if (!this.data.users) return [];
        
        return this.data.users.filter(user => {
            const matchesSearch = !this.filters.search || 
                user.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                user.email.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                user.department.toLowerCase().includes(this.filters.search.toLowerCase());
            
            const matchesRole = !this.filters.role || user.role === this.filters.role;
            const matchesStatus = !this.filters.status || user.status === this.filters.status;
            const matchesDepartment = !this.filters.department || user.department === this.filters.department;
            
            return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
        });
    }

    getFilteredAndSortedUsers() {
        const filteredUsers = this.getFilteredUsers();
        
        return filteredUsers.sort((a, b) => {
            let comparison = 0;
            
            switch (this.sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'created':
                    comparison = new Date(a.created) - new Date(b.created);
                    break;
                case 'last-login':
                    const aLogin = a.lastLogin ? new Date(a.lastLogin) : new Date(0);
                    const bLogin = b.lastLogin ? new Date(b.lastLogin) : new Date(0);
                    comparison = aLogin - bLogin;
                    break;
                default:
                    comparison = 0;
            }
            
            return this.sortOrder === 'desc' ? -comparison : comparison;
        });
    }

    getStatusBadgeClass(status) {
        const statusMap = {
            'active': 'success',
            'inactive': 'error',
            'pending': 'warning',
            'suspended': 'error'
        };
        return statusMap[status] || 'secondary';
    }

    getStatusLabel(status) {
        const statusMap = {
            'active': 'Activo',
            'inactive': 'Inactivo',
            'pending': 'Pendiente',
            'suspended': 'Suspendido'
        };
        return statusMap[status] || status;
    }

    getStatusIcon(status) {
        const iconMap = {
            'active': '🟢',
            'inactive': '🔴',
            'pending': '🟡',
            'suspended': '⛔'
        };
        return iconMap[status] || '⚪';
    }

    getRoleColor(roleName) {
        const role = this.data.roles?.find(r => r.name === roleName);
        return role ? role.color : '#6B7280';
    }

    getAvatarColor(name) {
        const colors = [
            '#EF4444', '#F97316', '#F59E0B', '#EAB308', '#84CC16',
            '#22C55E', '#10B981', '#14B8A6', '#06B6D4', '#0EA5E9',
            '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7', '#D946EF',
            '#EC4899', '#F43F5E'
        ];
        const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return colors[index % colors.length];
    }

    hasPermission(role, permissionId) {
        if (role.permissions.includes('*')) return true;
        return role.permissions.includes(permissionId);
    }

    getPermissionName(permissionId) {
        const permission = this.data.permissions?.find(p => p.id === permissionId);
        return permission ? permission.name : permissionId;
    }

    getAuditIcon(action) {
        const iconMap = {
            'login': 'log-in',
            'logout': 'log-out',
            'create': 'plus',
            'update': 'edit',
            'delete': 'trash-2',
            'view': 'eye',
            'export': 'download'
        };
        return iconMap[action] || 'activity';
    }

    getActionLabel(action) {
        const actionMap = {
            'login': 'Inicio de sesión',
            'logout': 'Cierre de sesión',
            'create': 'Crear',
            'update': 'Actualizar',
            'delete': 'Eliminar',
            'view': 'Ver',
            'export': 'Exportar'
        };
        return actionMap[action] || action;
    }

    groupAuditLogsByDate() {
        if (!this.data.auditLogs) return {};
        
        return this.data.auditLogs.reduce((groups, log) => {
            const date = log.timestamp.split(' ')[0];
            if (!groups[date]) groups[date] = [];
            groups[date].push(log);
            return groups;
        }, {});
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatRelativeDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;
        if (diffDays < 30) return `Hace ${Math.ceil(diffDays / 7)} semanas`;
        return `Hace ${Math.ceil(diffDays / 30)} meses`;
    }

    formatAuditDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Hoy';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Ayer';
        } else {
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
        }
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // Event handlers
    handleUserSearch(query) {
        this.filters.search = query;
        this.currentPage = 1; // Reset to first page
        this.renderUsersTable();
        this.renderUsersQuickStats();
        this.renderUsersPagination();
    }

    updateFilters() {
        this.filters.role = document.getElementById('role-filter')?.value || '';
        this.filters.status = document.getElementById('status-filter')?.value || '';
        this.filters.department = document.getElementById('department-filter')?.value || '';
        
        this.currentPage = 1; // Reset to first page
        this.renderUsersTable();
        this.renderUsersQuickStats();
        this.renderUsersPagination();
    }

    applyFilters() {
        this.updateFilters();
        if (window.app) {
            window.app.showNotification('Filtros aplicados', 'success');
        }
    }

    clearFilters() {
        this.filters = { search: '', role: '', status: '', department: '' };
        this.currentPage = 1;
        
        const searchInput = document.getElementById('user-search');
        const roleFilter = document.getElementById('role-filter');
        const statusFilter = document.getElementById('status-filter');
        const departmentFilter = document.getElementById('department-filter');
        
        if (searchInput) searchInput.value = '';
        if (roleFilter) roleFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        if (departmentFilter) departmentFilter.value = '';
        
        this.renderUsersTable();
        this.renderUsersQuickStats();
        this.renderUsersPagination();
        
        if (window.app) {
            window.app.showNotification('Filtros limpiados', 'info');
        }
    }

    switchView(viewType) {
        const tableView = document.getElementById('users-table');
        const gridView = document.getElementById('users-grid');
        const viewButtons = document.querySelectorAll('.view-btn');
        
        viewButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${viewType}"]`).classList.add('active');
        
        this.currentViewMode = viewType;
        
        if (tableView) tableView.style.display = 'none';
        if (gridView) gridView.style.display = 'none';
        
        switch (viewType) {
            case 'table':
                if (tableView) {
                    tableView.style.display = 'block';
                    this.renderUsersTable();
                }
                break;
            case 'grid':
                if (gridView) {
                    gridView.style.display = 'block';
                    this.renderUsersGrid();
                }
                break;
        }
    }

    handleSortChange(sortValue) {
        const [field, order] = sortValue.split('-');
        this.sortBy = field;
        this.sortOrder = order;
        console.log(`↕️ Ordenando usuarios por: ${field} (${order})`);
        
        if (this.currentViewMode === 'table') {
            this.renderUsersTable();
        } else {
            this.renderUsersGrid();
        }
    }

    handlePeriodChange(period) {
        console.log(`📅 Cambiando período de auditoría: ${period}`);
        // Filter audit logs based on period
        this.renderAuditTimeline();
    }

    // Pagination methods
    goToPage(page) {
        if (page < 1) return;
        
        const filteredUsers = this.getFilteredUsers();
        const totalPages = Math.ceil(filteredUsers.length / this.itemsPerPage);
        
        if (page > totalPages) return;
        
        this.currentPage = page;
        
        if (this.currentViewMode === 'table') {
            this.renderUsersTable();
        } else {
            this.renderUsersGrid();
        }
        
        this.renderUsersPagination();
    }

    changePageSize(size) {
        this.itemsPerPage = parseInt(size);
        this.currentPage = 1; // Reset to first page
        
        if (this.currentViewMode === 'table') {
            this.renderUsersTable();
        } else {
            this.renderUsersGrid();
        }
        
        this.renderUsersPagination();
    }

    // Selection methods
    toggleSelectAll(checked) {
        const filteredUsers = this.getFilteredAndSortedUsers();
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
        
        if (checked) {
            paginatedUsers.forEach(user => this.selectedUsers.add(user.id));
        } else {
            paginatedUsers.forEach(user => this.selectedUsers.delete(user.id));
        }
        
        // Update individual checkboxes
        const checkboxes = document.querySelectorAll('.table-checkbox:not(:first-child), .card-checkbox');
        checkboxes.forEach(checkbox => {
            const userId = parseInt(checkbox.closest('[data-user-id]')?.getAttribute('data-user-id'));
            if (userId && paginatedUsers.find(u => u.id === userId)) {
                checkbox.checked = checked;
            }
        });
        
        // Update row highlighting
        this.updateRowHighlighting();
        this.renderUsersQuickStats();
    }

    toggleUserSelection(userId, checked) {
        if (checked) {
            this.selectedUsers.add(userId);
        } else {
            this.selectedUsers.delete(userId);
        }
        
        this.updateRowHighlighting();
        this.renderUsersQuickStats();
        
        // Update select all checkbox
        const selectAllCheckbox = document.querySelector('.table-checkbox:first-child');
        if (selectAllCheckbox) {
            const filteredUsers = this.getFilteredAndSortedUsers();
            const startIndex = (this.currentPage - 1) * this.itemsPerPage;
            const endIndex = startIndex + this.itemsPerPage;
            const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
            
            const allSelected = paginatedUsers.every(user => this.selectedUsers.has(user.id));
            selectAllCheckbox.checked = allSelected;
        }
    }

    updateRowHighlighting() {
        const rows = document.querySelectorAll('[data-user-id]');
        rows.forEach(row => {
            const userId = parseInt(row.getAttribute('data-user-id'));
            if (this.selectedUsers.has(userId)) {
                row.classList.add('selected');
            } else {
                row.classList.remove('selected');
            }
        });
    }

    // Modal methods
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            this.modalStack.push(modalId);
            document.body.classList.add('modal-open');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            this.modalStack = this.modalStack.filter(id => id !== modalId);
            
            if (this.modalStack.length === 0) {
                document.body.classList.remove('modal-open');
            }
        }
    }

    renderUsersGrid() {
        const container = document.getElementById('users-grid');
        if (!container || !this.data.users) return '';

        const filteredUsers = this.getFilteredAndSortedUsers();
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        const gridHTML = `
            <div class="users-grid-container">
                ${paginatedUsers.map(user => `
                    <div class="user-card ${this.selectedUsers.has(user.id) ? 'selected' : ''}" data-user-id="${user.id}">
                        <div class="user-card-header">
                            <div class="user-card-avatar" style="background-color: ${this.getAvatarColor(user.name)}">
                                ${user.profileImage ? 
                                    `<img src="${user.profileImage}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : 
                                    user.avatar}
                            </div>
                            <div class="user-card-actions">
                                <input type="checkbox" class="card-checkbox" 
                                       ${this.selectedUsers.has(user.id) ? 'checked' : ''}
                                       onchange="window.app.modules.users.toggleUserSelection(${user.id}, this.checked)">
                                <button class="btn-icon-small" onclick="window.app.modules.users.toggleUserMenu(${user.id})">
                                    <i data-lucide="more-horizontal"></i>
                                </button>
                            </div>
                        </div>
                        <div class="user-card-body">
                            <h3 class="user-card-name">${user.name}</h3>
                            <p class="user-card-email">${user.email}</p>
                            <div class="user-card-role">
                                <span class="role-badge" style="background-color: ${this.getRoleColor(user.role)}20; color: ${this.getRoleColor(user.role)}">
                                    ${user.role}
                                </span>
                            </div>
                            <div class="user-card-department">${user.department}</div>
                        </div>
                        <div class="user-card-footer">
                            <div class="user-card-status">
                                <span class="status-badge status-${user.status}">
                                    ${this.getStatusIcon(user.status)} ${this.getStatusLabel(user.status)}
                                </span>
                            </div>
                            <div class="user-card-last-login">
                                ${user.lastLogin ? `Último login: ${this.formatRelativeDate(user.lastLogin)}` : 'Nunca conectado'}
                            </div>
                            <div class="user-card-2fa">
                                <span class="two-factor-status ${user.twoFactorEnabled ? 'enabled' : 'disabled'}">
                                    <i data-lucide="${user.twoFactorEnabled ? 'shield-check' : 'shield-x'}"></i>
                                    2FA ${user.twoFactorEnabled ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                        <div class="user-card-actions-bar">
                            <button class="btn btn-sm btn-secondary" onclick="window.app.modules.users.viewUser(${user.id})">
                                <i data-lucide="eye"></i> Ver
                            </button>
                            <button class="btn btn-sm btn-primary" onclick="window.app.modules.users.editUser(${user.id})">
                                <i data-lucide="edit"></i> Editar
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
            
            ${paginatedUsers.length === 0 ? `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i data-lucide="users"></i>
                    </div>
                    <h3>No se encontraron usuarios</h3>
                    <p>Intenta ajustar los filtros de búsqueda</p>
                    <button class="btn btn-secondary" onclick="window.app.modules.users.clearFilters()">
                        Limpiar filtros
                    </button>
                </div>
            ` : ''}
        `;

        container.innerHTML = gridHTML;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        return gridHTML;
    }

    // Public API methods
    async refreshData() {
        try {
            console.log('🔄 Refrescando datos del módulo de usuarios...');
            
            if (window.app) {
                window.app.showNotification('Actualizando datos de usuarios...', 'info');
            }
            
            this.data = {};
            await this.loadData();
            
            if (this.currentTab) {
                await this.loadTabData(this.currentTab);
            }
            
            if (window.app) {
                window.app.showNotification('Datos de usuarios actualizados', 'success');
            }
            
        } catch (error) {
            console.error('❌ Error refrescando datos de usuarios:', error);
            if (window.app) {
                window.app.showNotification('Error al actualizar datos de usuarios', 'error');
            }
        }
    }

    // Navigation methods
    switchToTab(tabName) {
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            tabButton.click();
        }
    }

    getCurrentTab() {
        return this.currentTab;
    }

    getModuleData() {
        return this.data;
    }

    // User management methods
    createUser() {
        console.log('👤 Creando nuevo usuario...');
        this.renderUserModal();
        this.openModal('user-modal');
    }

    viewUser(userId) {
        console.log(`👁️ Viendo usuario: ${userId}`);
        const user = this.data.users?.find(u => u.id === userId);
        if (user) {
            this.showUserDetailsModal(user);
        }
    }

    editUser(userId) {
        console.log(`✏️ Editando usuario: ${userId}`);
        const user = this.data.users?.find(u => u.id === userId);
        if (user) {
            this.renderUserModal(userId);
            this.openModal('user-modal');
        }
    }

    saveUser(event, userId = null) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const userData = Object.fromEntries(formData.entries());
        
        console.log(`💾 Guardando usuario:`, userData);
        
        if (userId) {
            // Update existing user
            const userIndex = this.data.users.findIndex(u => u.id === userId);
            if (userIndex !== -1) {
                this.data.users[userIndex] = { ...this.data.users[userIndex], ...userData };
            }
        } else {
            // Create new user
            const newUser = {
                id: Math.max(...this.data.users.map(u => u.id)) + 1,
                ...userData,
                avatar: userData.name.split(' ').map(n => n[0]).join(''),
                created: new Date().toISOString().slice(0, 19).replace('T', ' '),
                loginCount: 0,
                lastLogin: null,
                lastIP: null,
                permissions: []
            };
            this.data.users.push(newUser);
        }
        
        this.closeModal('user-modal');
        this.renderUsersTable();
        this.renderUsersQuickStats();
        
        if (window.app) {
            window.app.showNotification(
                userId ? 'Usuario actualizado correctamente' : 'Usuario creado correctamente', 
                'success'
            );
        }
    }

    deleteUser(userId) {
        const user = this.data.users?.find(u => u.id === userId);
        if (user && confirm(`¿Estás seguro de que deseas eliminar al usuario ${user.name}?`)) {
            this.data.users = this.data.users.filter(u => u.id !== userId);
            this.selectedUsers.delete(userId);
            
            this.renderUsersTable();
            this.renderUsersQuickStats();
            
            if (window.app) {
                window.app.showNotification('Usuario eliminado correctamente', 'success');
            }
        }
    }

    suspendUser(userId) {
        const user = this.data.users?.find(u => u.id === userId);
        if (user) {
            user.status = user.status === 'suspended' ? 'active' : 'suspended';
            this.renderUsersTable();
            
            if (window.app) {
                window.app.showNotification(
                    `Usuario ${user.status === 'suspended' ? 'suspendido' : 'reactivado'} correctamente`, 
                    'success'
                );
            }
        }
    }

    resetPassword(userId) {
        const user = this.data.users?.find(u => u.id === userId);
        if (user && confirm(`¿Enviar instrucciones de reseteo de contraseña a ${user.email}?`)) {
            console.log(`🔑 Reseteando contraseña para usuario: ${userId}`);
            
            if (window.app) {
                window.app.showNotification(`Instrucciones enviadas a ${user.email}`, 'success');
            }
        }
    }

    toggle2FA(userId) {
        const user = this.data.users?.find(u => u.id === userId);
        if (user) {
            user.twoFactorEnabled = !user.twoFactorEnabled;
            this.renderUsersTable();
            
            if (window.app) {
                window.app.showNotification(
                    `2FA ${user.twoFactorEnabled ? 'habilitado' : 'deshabilitado'} para ${user.name}`, 
                    'success'
                );
            }
        }
    }

    viewAudit(userId) {
        const user = this.data.users?.find(u => u.id === userId);
        if (user) {
            console.log(`📋 Viendo auditoría para usuario: ${user.name}`);
            this.switchToTab('audit');
            
            // Filter audit logs for this user
            const auditUser = document.getElementById('audit-user');
            if (auditUser) {
                auditUser.value = user.name;
                this.updateAudit();
            }
        }
    }

    toggleUserMenu(userId) {
        const menu = document.getElementById(`user-menu-${userId}`);
        if (menu) {
            // Close other open menus
            document.querySelectorAll('.dropdown-menu-table').forEach(m => {
                if (m !== menu) m.style.display = 'none';
            });
            
            menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
        }
    }

    showUserDetailsModal(user) {
        // Create a detailed view modal for the user
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content modal-large">
                <div class="modal-header">
                    <h3>Detalles del Usuario</h3>
                    <button class="modal-close" onclick="this.closest('.modal').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="user-details-grid">
                        <div class="user-profile-section">
                            <div class="user-profile-header">
                                <div class="user-avatar-large" style="background-color: ${this.getAvatarColor(user.name)}">
                                    ${user.profileImage ? 
                                        `<img src="${user.profileImage}" alt="${user.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` : 
                                        user.avatar}
                                </div>
                                <div class="user-profile-info">
                                    <h2>${user.name}</h2>
                                    <p class="user-email">${user.email}</p>
                                    <span class="role-badge" style="background-color: ${this.getRoleColor(user.role)}20; color: ${this.getRoleColor(user.role)}">
                                        ${user.role}
                                    </span>
                                </div>
                            </div>
                            
                            <div class="user-stats-grid">
                                <div class="user-stat">
                                    <div class="stat-label">Estado</div>
                                    <div class="stat-value">
                                        <span class="status-badge status-${user.status}">
                                            ${this.getStatusIcon(user.status)} ${this.getStatusLabel(user.status)}
                                        </span>
                                    </div>
                                </div>
                                <div class="user-stat">
                                    <div class="stat-label">Logins totales</div>
                                    <div class="stat-value">${user.loginCount || 0}</div>
                                </div>
                                <div class="user-stat">
                                    <div class="stat-label">2FA</div>
                                    <div class="stat-value">
                                        <span class="two-factor-status ${user.twoFactorEnabled ? 'enabled' : 'disabled'}">
                                            <i data-lucide="${user.twoFactorEnabled ? 'shield-check' : 'shield-x'}"></i>
                                            ${user.twoFactorEnabled ? 'Habilitado' : 'Deshabilitado'}
                                        </span>
                                    </div>
                                </div>
                                <div class="user-stat">
                                    <div class="stat-label">Último login</div>
                                    <div class="stat-value">${user.lastLogin ? this.formatDate(user.lastLogin) : 'Nunca'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="user-info-section">
                            <h4>Información de Contacto</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Email:</label>
                                    <span>${user.email}</span>
                                </div>
                                <div class="info-item">
                                    <label>Teléfono:</label>
                                    <span>${user.phone || 'No especificado'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Ubicación:</label>
                                    <span>${user.location || 'No especificada'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Departamento:</label>
                                    <span>${user.department}</span>
                                </div>
                            </div>
                            
                            <h4>Información del Sistema</h4>
                            <div class="info-grid">
                                <div class="info-item">
                                    <label>Fecha de creación:</label>
                                    <span>${this.formatDate(user.created)}</span>
                                </div>
                                <div class="info-item">
                                    <label>Última IP:</label>
                                    <span>${user.lastIP || 'N/A'}</span>
                                </div>
                                <div class="info-item">
                                    <label>Permisos:</label>
                                    <span>${user.permissions.includes('*') ? 'Acceso completo' : `${user.permissions.length} específicos`}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
                        Cerrar
                    </button>
                    <button class="btn btn-primary" onclick="window.app.modules.users.editUser(${user.id}); this.closest('.modal').remove()">
                        Editar Usuario
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        modal.style.display = 'flex';
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // User management modal content
    renderUserModal(userId = null) {
        const isEdit = userId !== null;
        const user = isEdit ? this.data.users.find(u => u.id === userId) : null;
        
        const title = isEdit ? `Editar Usuario - ${user?.name}` : 'Nuevo Usuario';
        document.getElementById('user-modal-title').textContent = title;
        
        const modalBody = document.getElementById('user-modal-body');
        modalBody.innerHTML = `
            <form class="user-form" onsubmit="window.app.modules.users.saveUser(event, ${userId})">
                <div class="form-grid">
                    <div class="form-section">
                        <h4>Información Personal</h4>
                        <div class="form-group">
                            <label for="user-name">Nombre completo *</label>
                            <input type="text" id="user-name" name="name" required 
                                   value="${user?.name || ''}" placeholder="Nombre y apellidos">
                        </div>
                        <div class="form-group">
                            <label for="user-email">Email *</label>
                            <input type="email" id="user-email" name="email" required 
                                   value="${user?.email || ''}" placeholder="usuario@empresa.com">
                        </div>
                        <div class="form-group">
                            <label for="user-phone">Teléfono</label>
                            <input type="tel" id="user-phone" name="phone" 
                                   value="${user?.phone || ''}" placeholder="+34 600 000 000">
                        </div>
                        <div class="form-group">
                            <label for="user-location">Ubicación</label>
                            <input type="text" id="user-location" name="location" 
                                   value="${user?.location || ''}" placeholder="Ciudad, País">
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4>Información Laboral</h4>
                        <div class="form-group">
                            <label for="user-role">Rol *</label>
                            <select id="user-role" name="role" required>
                                <option value="">Seleccionar rol...</option>
                                ${this.data.roles?.map(role => `
                                    <option value="${role.name}" ${user?.role === role.name ? 'selected' : ''}>
                                        ${role.name}
                                    </option>
                                `).join('') || ''}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="user-department">Departamento *</label>
                            <select id="user-department" name="department" required>
                                <option value="">Seleccionar departamento...</option>
                                ${this.data.departments?.map(dept => `
                                    <option value="${dept.name}" ${user?.department === dept.name ? 'selected' : ''}>
                                        ${dept.name}
                                    </option>
                                `).join('') || ''}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="user-status">Estado</label>
                            <select id="user-status" name="status">
                                <option value="active" ${user?.status === 'active' ? 'selected' : ''}>Activo</option>
                                <option value="inactive" ${user?.status === 'inactive' ? 'selected' : ''}>Inactivo</option>
                                <option value="pending" ${user?.status === 'pending' ? 'selected' : ''}>Pendiente</option>
                                <option value="suspended" ${user?.status === 'suspended' ? 'selected' : ''}>Suspendido</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="form-section">
                        <h4>Configuración de Seguridad</h4>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="twoFactorEnabled" 
                                       ${user?.twoFactorEnabled ? 'checked' : ''}>
                                Habilitar autenticación de dos factores
                            </label>
                        </div>
                        ${!isEdit ? `
                            <div class="form-group">
                                <label for="user-password">Contraseña temporal</label>
                                <input type="password" id="user-password" name="password" 
                                       placeholder="Se generará automáticamente si se deja vacío">
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" name="sendWelcomeEmail" checked>
                                    Enviar email de bienvenida
                                </label>
                            </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="window.app.modules.users.closeModal('user-modal')">
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary">
                        ${isEdit ? 'Guardar Cambios' : 'Crear Usuario'}
                    </button>
                </div>
            </form>
        `;
    }

    // Role management methods
    createRole() {
        console.log('🛡️ Creando nuevo rol...');
        this.renderRoleModal();
        this.openModal('role-modal');
    }

    editRole(roleId) {
        console.log(`✏️ Editando rol: ${roleId}`);
        const role = this.data.roles?.find(r => r.id === roleId);
        if (role) {
            this.renderRoleModal(roleId);
            this.openModal('role-modal');
        }
    }

    saveRole(event, roleId = null) {
        event.preventDefault();
        const formData = new FormData(event.target);
        
        // Get selected permissions
        const permissions = [];
        const permissionInputs = formData.getAll('permissions');
        permissions.push(...permissionInputs);
        
        const roleData = {
            name: formData.get('name'),
            description: formData.get('description'),
            color: formData.get('color'),
            isActive: formData.has('isActive'),
            permissions: permissions
        };
        
        console.log(`💾 Guardando rol:`, roleData);
        
        if (roleId) {
            // Update existing role
            const roleIndex = this.data.roles.findIndex(r => r.id === roleId);
            if (roleIndex !== -1) {
                this.data.roles[roleIndex] = { ...this.data.roles[roleIndex], ...roleData };
            }
        } else {
            // Create new role
            const newRole = {
                id: Math.max(...this.data.roles.map(r => r.id)) + 1,
                ...roleData,
                userCount: 0,
                isSystem: false,
                created: new Date().toISOString().slice(0, 10)
            };
            this.data.roles.push(newRole);
        }
        
        this.closeModal('role-modal');
        this.renderRolesGrid();
        this.renderPermissionsMatrix();
        
        if (window.app) {
            window.app.showNotification(
                roleId ? 'Rol actualizado correctamente' : 'Rol creado correctamente', 
                'success'
            );
        }
    }

    deleteRole(roleId) {
        const role = this.data.roles?.find(r => r.id === roleId);
        if (role && !role.isSystem && confirm(`¿Estás seguro de que deseas eliminar el rol ${role.name}?`)) {
            this.data.roles = this.data.roles.filter(r => r.id !== roleId);
            
            this.renderRolesGrid();
            this.renderPermissionsMatrix();
            
            if (window.app) {
                window.app.showNotification('Rol eliminado correctamente', 'success');
            }
        }
    }

    togglePermission(roleId, permissionId, hasPermission) {
        const role = this.data.roles?.find(r => r.id == roleId);
        if (role && !role.isSystem) {
            if (hasPermission && !role.permissions.includes(permissionId)) {
                role.permissions.push(permissionId);
            } else if (!hasPermission) {
                role.permissions = role.permissions.filter(p => p !== permissionId);
            }
            
            console.log(`🔐 Permiso ${permissionId} ${hasPermission ? 'agregado a' : 'removido de'} rol ${role.name}`);
        }
    }

    renderRoleModal(roleId = null) {
        const isEdit = roleId !== null;
        const role = isEdit ? this.data.roles.find(r => r.id === roleId) : null;
        
        const title = isEdit ? `Editar Rol - ${role?.name}` : 'Nuevo Rol';
        document.getElementById('role-modal-title').textContent = title;
        
        const modalBody = document.getElementById('role-modal-body');
        modalBody.innerHTML = `
            <form class="role-form" onsubmit="window.app.modules.users.saveRole(event, ${roleId})">
                <div class="form-section">
                    <h4>Información del Rol</h4>
                    <div class="form-group">
                        <label for="role-name">Nombre del rol *</label>
                        <input type="text" id="role-name" name="name" required 
                               value="${role?.name || ''}" placeholder="Nombre del rol"
                               ${role?.isSystem ? 'readonly' : ''}>
                    </div>
                    <div class="form-group">
                        <label for="role-description">Descripción</label>
                        <textarea id="role-description" name="description" rows="3" 
                                  placeholder="Descripción del rol y sus responsabilidades">${role?.description || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="role-color">Color</label>
                        <div class="color-picker">
                            <input type="color" id="role-color" name="color" value="${role?.color || '#6B7280'}">
                            <span class="color-preview" style="background-color: ${role?.color || '#6B7280'}"></span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="isActive" ${role?.isActive !== false ? 'checked' : ''}>
                            Rol activo
                        </label>
                    </div>
                </div>
                
                <div class="form-section">
                    <h4>Permisos</h4>
                    <div class="permissions-grid">
                        ${this.renderPermissionCheckboxes(role?.permissions || [])}
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="window.app.modules.users.closeModal('role-modal')">
                        Cancelar
                    </button>
                    <button type="submit" class="btn btn-primary" ${role?.isSystem ? 'disabled' : ''}>
                        ${isEdit ? 'Guardar Cambios' : 'Crear Rol'}
                    </button>
                </div>
            </form>
        `;
    }

    renderPermissionCheckboxes(rolePermissions) {
        if (!this.data.permissions) return '';
        
        const permissionsByCategory = {};
        this.data.permissions.forEach(permission => {
            if (!permissionsByCategory[permission.category]) {
                permissionsByCategory[permission.category] = [];
            }
            permissionsByCategory[permission.category].push(permission);
        });

        return Object.entries(permissionsByCategory).map(([category, permissions]) => `
            <div class="permission-category">
                <h5>${category}</h5>
                <div class="permission-checkboxes">
                    ${permissions.map(permission => `
                        <label class="permission-checkbox-label">
                            <input type="checkbox" name="permissions" value="${permission.id}"
                                   ${rolePermissions.includes(permission.id) || rolePermissions.includes('*') ? 'checked' : ''}
                                   ${rolePermissions.includes('*') ? 'disabled' : ''}>
                            <span class="permission-name">${permission.name}</span>
                            <span class="permission-description">${permission.description}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // Bulk action methods
    bulkActions() {
        if (this.selectedUsers.size === 0) {
            if (window.app) {
                window.app.showNotification('No hay usuarios seleccionados', 'warning');
            }
            return;
        }
        
        this.renderBulkActionsModal();
        this.openModal('bulk-actions-modal');
    }

    renderBulkActionsModal() {
        const modalBody = document.getElementById('bulk-actions-modal-body');
        modalBody.innerHTML = `
            <div class="bulk-actions-content">
                <div class="selected-count">
                    <h4>Usuarios seleccionados: ${this.selectedUsers.size}</h4>
                    <p>Las siguientes acciones se aplicarán a todos los usuarios seleccionados</p>
                </div>
                
                <div class="bulk-actions-grid">
                    <div class="bulk-action-card" onclick="window.app.modules.users.bulkChangeRole()">
                        <div class="bulk-action-icon">
                            <i data-lucide="shield"></i>
                        </div>
                        <div class="bulk-action-content">
                            <h5>Cambiar Rol</h5>
                            <p>Asignar un nuevo rol a los usuarios seleccionados</p>
                        </div>
                    </div>
                    
                    <div class="bulk-action-card" onclick="window.app.modules.users.bulkChangeDepartment()">
                        <div class="bulk-action-icon">
                            <i data-lucide="building"></i>
                        </div>
                        <div class="bulk-action-content">
                            <h5>Cambiar Departamento</h5>
                            <p>Mover usuarios a otro departamento</p>
                        </div>
                    </div>
                    
                    <div class="bulk-action-card" onclick="window.app.modules.users.bulkChangeStatus()">
                        <div class="bulk-action-icon">
                            <i data-lucide="user-check"></i>
                        </div>
                        <div class="bulk-action-content">
                            <h5>Cambiar Estado</h5>
                            <p>Activar, desactivar o suspender usuarios</p>
                        </div>
                    </div>
                    
                    <div class="bulk-action-card" onclick="window.app.modules.users.bulkEnable2FA()">
                        <div class="bulk-action-icon">
                            <i data-lucide="smartphone"></i>
                        </div>
                        <div class="bulk-action-content">
                            <h5>Configurar 2FA</h5>
                            <p>Habilitar o deshabilitar autenticación de dos factores</p>
                        </div>
                    </div>
                    
                    <div class="bulk-action-card" onclick="window.app.modules.users.bulkResetPassword()">
                        <div class="bulk-action-icon">
                            <i data-lucide="key"></i>
                        </div>
                        <div class="bulk-action-content">
                            <h5>Resetear Contraseñas</h5>
                            <p>Enviar instrucciones de reseteo de contraseña</p>
                        </div>
                    </div>
                    
                    <div class="bulk-action-card warning" onclick="window.app.modules.users.bulkDelete()">
                        <div class="bulk-action-icon">
                            <i data-lucide="trash-2"></i>
                        </div>
                        <div class="bulk-action-content">
                            <h5>Eliminar Usuarios</h5>
                            <p>Eliminar permanentemente los usuarios seleccionados</p>
                        </div>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" onclick="window.app.modules.users.closeModal('bulk-actions-modal')">
                        Cancelar
                    </button>
                </div>
            </div>
        `;
        
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    bulkChangeRole() {
        console.log('🔄 Cambio masivo de rol para usuarios seleccionados');
        this.closeModal('bulk-actions-modal');
        if (window.app) {
            window.app.showNotification('Función de cambio masivo de rol en desarrollo', 'info');
        }
    }

    bulkChangeDepartment() {
        console.log('🏢 Cambio masivo de departamento para usuarios seleccionados');
        this.closeModal('bulk-actions-modal');
        if (window.app) {
            window.app.showNotification('Función de cambio masivo de departamento en desarrollo', 'info');
        }
    }

    bulkChangeStatus() {
        console.log('📊 Cambio masivo de estado para usuarios seleccionados');
        this.closeModal('bulk-actions-modal');
        if (window.app) {
            window.app.showNotification('Función de cambio masivo de estado en desarrollo', 'info');
        }
    }

    bulkEnable2FA() {
        console.log('🔐 Configuración masiva de 2FA para usuarios seleccionados');
        this.closeModal('bulk-actions-modal');
        if (window.app) {
            window.app.showNotification('Función de configuración masiva de 2FA en desarrollo', 'info');
        }
    }

    bulkResetPassword() {
        console.log('🔑 Reseteo masivo de contraseñas para usuarios seleccionados');
        this.closeModal('bulk-actions-modal');
        if (window.app) {
            window.app.showNotification('Función de reseteo masivo de contraseñas en desarrollo', 'info');
        }
    }

    bulkDelete() {
        if (confirm(`¿Estás seguro de que deseas eliminar ${this.selectedUsers.size} usuarios seleccionados?`)) {
            this.data.users = this.data.users.filter(user => !this.selectedUsers.has(user.id));
            this.selectedUsers.clear();
            
            this.closeModal('bulk-actions-modal');
            this.renderUsersTable();
            this.renderUsersQuickStats();
            
            if (window.app) {
                window.app.showNotification('Usuarios eliminados correctamente', 'success');
            }
        }
    }


    // Export methods
    exportUsers() {
        console.log('📥 Exportando usuarios...');
        
        const filteredUsers = this.getFilteredUsers();
        const csvContent = this.generateUsersCSV(filteredUsers);
        this.downloadCSV(csvContent, 'usuarios.csv');
        
        if (window.app) {
            window.app.showNotification('Usuarios exportados correctamente', 'success');
        }
    }

    exportRoles() {
        console.log('📥 Exportando roles...');
        
        const csvContent = this.generateRolesCSV(this.data.roles);
        this.downloadCSV(csvContent, 'roles.csv');
        
        if (window.app) {
            window.app.showNotification('Roles exportados correctamente', 'success');
        }
    }

    exportAudit() {
        console.log('📥 Exportando logs de auditoría...');
        
        const csvContent = this.generateAuditCSV(this.data.auditLogs);
        this.downloadCSV(csvContent, 'auditoria.csv');
        
        if (window.app) {
            window.app.showNotification('Auditoría exportada correctamente', 'success');
        }
    }

    generateUsersCSV(users) {
        const headers = ['ID', 'Nombre', 'Email', 'Rol', 'Departamento', 'Estado', 'Último Login', '2FA', 'Teléfono', 'Ubicación'];
        const rows = users.map(user => [
            user.id,
            user.name,
            user.email,
            user.role,
            user.department,
            this.getStatusLabel(user.status),
            user.lastLogin || 'Nunca',
            user.twoFactorEnabled ? 'Sí' : 'No',
            user.phone || '',
            user.location || ''
        ]);
        
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    generateRolesCSV(roles) {
        const headers = ['ID', 'Nombre', 'Descripción', 'Usuarios', 'Permisos', 'Estado', 'Sistema'];
        const rows = roles.map(role => [
            role.id,
            role.name,
            role.description,
            role.userCount,
            role.permissions.includes('*') ? 'Todos' : role.permissions.length,
            role.isActive ? 'Activo' : 'Inactivo',
            role.isSystem ? 'Sí' : 'No'
        ]);
        
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    generateAuditCSV(logs) {
        const headers = ['ID', 'Usuario', 'Acción', 'Entidad', 'Detalles', 'IP', 'Fecha', 'Estado'];
        const rows = logs.map(log => [
            log.id,
            log.user,
            this.getActionLabel(log.action),
            log.entity,
            log.details,
            log.ip,
            log.timestamp,
            log.status
        ]);
        
        return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // Audit methods
    updateAudit() {
        console.log('🔄 Actualizando auditoría...');
        this.renderAuditTimeline();
        
        if (window.app) {
            window.app.showNotification('Auditoría actualizada', 'success');
        }
    }

    clearOldLogs() {
        console.log('🗑️ Limpiando logs antiguos...');
        if (confirm('¿Estás seguro de que deseas eliminar los logs antiguos? Esta acción no se puede deshacer.')) {
            // Remove logs older than 90 days
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 90);
            
            this.data.auditLogs = this.data.auditLogs.filter(log => 
                new Date(log.timestamp) > cutoffDate
            );
            
            this.renderAuditTimeline();
            
            if (window.app) {
                window.app.showNotification('Logs antiguos eliminados', 'success');
            }
        }
    }

    viewAuditDetails(logId) {
        const log = this.data.auditLogs?.find(l => l.id == logId);
        if (log) {
            console.log('📋 Viendo detalles de auditoría:', log);
            if (window.app) {
                window.app.showNotification('Función de ver detalles de auditoría en desarrollo', 'info');
            }
        }
    }

    // Security and settings methods
    saveSecuritySettings() {
        console.log('💾 Guardando configuración de seguridad...');
        
        const settings = {
            minPasswordLength: document.getElementById('min-password-length')?.value,
            requireUppercase: document.getElementById('require-uppercase')?.checked,
            requireNumbers: document.getElementById('require-numbers')?.checked,
            requireSymbols: document.getElementById('require-symbols')?.checked,
            passwordExpiry: document.getElementById('password-expiry')?.value,
            sessionTimeout: document.getElementById('session-timeout')?.value,
            concurrentSessions: document.getElementById('concurrent-sessions')?.value,
            forceLogout: document.getElementById('force-logout')?.checked,
            force2FAAdmin: document.getElementById('force-2fa-admin')?.checked,
            force2FAAll: document.getElementById('force-2fa-all')?.checked,
            preferred2FA: document.getElementById('preferred-2fa')?.value,
            maxFailedAttempts: document.getElementById('max-failed-attempts')?.value,
            lockoutDuration: document.getElementById('lockout-duration')?.value,
            notifyLockout: document.getElementById('notify-lockout')?.checked
        };
        
        console.log('🔒 Configuración de seguridad:', settings);
        
        // Reset button style
        const saveButton = document.querySelector('[onclick="window.app.modules.users.saveSecuritySettings()"]');
        if (saveButton) {
            saveButton.classList.remove('btn-warning');
            saveButton.innerHTML = '<i data-lucide="save"></i> Guardar Configuración';
        }
        
        if (window.app) {
            window.app.showNotification('Configuración de seguridad guardada', 'success');
        }
    }

    resetSecuritySettings() {
        console.log('🔄 Restaurando configuración de seguridad...');
        if (confirm('¿Estás seguro de que deseas restaurar la configuración de seguridad por defecto?')) {
            // Reset all security inputs to default values
            const defaults = {
                'min-password-length': 8,
                'require-uppercase': true,
                'require-numbers': true,
                'require-symbols': false,
                'password-expiry': 90,
                'session-timeout': 30,
                'concurrent-sessions': 3,
                'force-logout': false,
                'force-2fa-admin': true,
                'force-2fa-all': false,
                'preferred-2fa': 'app',
                'max-failed-attempts': 5,
                'lockout-duration': 15,
                'notify-lockout': true
            };
            
            Object.entries(defaults).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = value;
                    } else {
                        element.value = value;
                    }
                }
            });
            
            if (window.app) {
                window.app.showNotification('Configuración de seguridad restaurada', 'success');
            }
        }
    }

    saveSettings() {
        console.log('💾 Guardando configuración de usuarios...');
        
        const settings = {
            defaultRole: document.getElementById('default-role')?.value,
            defaultDepartment: document.getElementById('default-department')?.value,
            autoActivation: document.getElementById('auto-activation')?.checked,
            welcomeEmail: document.getElementById('welcome-email')?.checked,
            notifyNewUsers: document.getElementById('notify-new-users')?.checked,
            notifyRoleChanges: document.getElementById('notify-role-changes')?.checked,
            notifyLockouts: document.getElementById('notify-lockouts')?.checked,
            inactiveCleanup: document.getElementById('inactive-cleanup')?.value,
            auditCleanup: document.getElementById('audit-cleanup')?.value,
            autoCleanup: document.getElementById('auto-cleanup')?.checked
        };
        
        console.log('⚙️ Configuración de usuarios:', settings);
        
        // Reset button style
        const saveButton = document.querySelector('[onclick="window.app.modules.users.saveSettings()"]');
        if (saveButton) {
            saveButton.classList.remove('btn-warning');
            saveButton.innerHTML = '<i data-lucide="save"></i> Guardar Configuración';
        }
        
        if (window.app) {
            window.app.showNotification('Configuración guardada', 'success');
        }
    }

    resetSettings() {
        console.log('🔄 Restaurando configuración por defecto...');
        if (confirm('¿Estás seguro de que deseas restaurar la configuración por defecto?')) {
            // Reset all settings inputs to default values
            const defaults = {
                'default-role': 'user',
                'default-department': '',
                'auto-activation': false,
                'welcome-email': true,
                'notify-new-users': true,
                'notify-role-changes': true,
                'notify-lockouts': true,
                'inactive-cleanup': 365,
                'audit-cleanup': 90,
                'auto-cleanup': false
            };
            
            Object.entries(defaults).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    if (element.type === 'checkbox') {
                        element.checked = value;
                    } else {
                        element.value = value;
                    }
                }
            });
            
            if (window.app) {
                window.app.showNotification('Configuración restaurada', 'success');
            }
        }
    }

    // Additional utility methods for enhanced functionality
    getPermissionsByCategory() {
        if (!this.data.permissions) return {};
        
        return this.data.permissions.reduce((acc, permission) => {
            if (!acc[permission.category]) {
                acc[permission.category] = [];
            }
            acc[permission.category].push(permission);
            return acc;
        }, {});
    }

    getUsersByRole(roleName) {
        return this.data.users?.filter(user => user.role === roleName) || [];
    }

    getUsersByDepartment(departmentName) {
        return this.data.users?.filter(user => user.department === departmentName) || [];
    }

    getUsersByStatus(status) {
        return this.data.users?.filter(user => user.status === status) || [];
    }

    getActiveUsersCount() {
        return this.data.users?.filter(user => user.status === 'active').length || 0;
    }

    get2FAEnabledCount() {
        return this.data.users?.filter(user => user.twoFactorEnabled).length || 0;
    }

    getRecentLoginCount(days = 7) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        return this.data.users?.filter(user => 
            user.lastLogin && new Date(user.lastLogin) > cutoffDate
        ).length || 0;
    }

    // Integration methods for other modules
    getUsersForProject(projectId) {
        // Return users that can be assigned to a project
        return this.data.users?.filter(user => 
            user.status === 'active' && 
            (user.permissions.includes('*') || user.permissions.some(p => p.startsWith('projects')))
        ) || [];
    }

    getUsersForRole(roleName) {
        return this.getUsersByRole(roleName);
    }

    canUserAccessModule(userId, moduleId) {
        const user = this.data.users?.find(u => u.id === userId);
        if (!user || user.status !== 'active') return false;
        
        if (user.permissions.includes('*')) return true;
        
        // Module-specific permission mapping
        const modulePermissions = {
            'projects': ['projects.view', 'projects.edit', 'projects.manage'],
            'tasks': ['tasks.view', 'tasks.edit', 'tasks.manage'],
            'crm': ['crm.view', 'crm.manage'],
            'erp': ['erp.view', 'erp.manage'],
            'users': ['users.view', 'users.manage', 'system.admin'],
            'reports': ['reports.view', 'analytics.view']
        };
        
        const requiredPermissions = modulePermissions[moduleId] || [];
        return requiredPermissions.some(permission => user.permissions.includes(permission));
    }

    // Public interface methods for external module access
    getPublicInterface() {
        return {
            // Safe methods that other modules can call
            getUserById: (id) => this.data.users?.find(u => u.id === id),
            getUsersByRole: (role) => this.getUsersByRole(role),
            getUsersByDepartment: (dept) => this.getUsersByDepartment(dept),
            canUserAccess: (userId, resource) => this.canUserAccessModule(userId, resource),
            getActiveUsers: () => this.getUsersByStatus('active'),
            getUserCount: () => this.data.users?.length || 0,
            getStats: () => this.data.stats,
            searchUsers: (query) => this.searchUsers(query)
        };
    }

    searchUsers(query) {
        if (!query) return this.data.users || [];
        
        const searchTerms = query.toLowerCase().split(' ');
        
        return this.data.users?.filter(user => {
            const searchableText = `${user.name} ${user.email} ${user.role} ${user.department}`.toLowerCase();
            return searchTerms.every(term => searchableText.includes(term));
        }) || [];
    }

    // Analytics and reporting methods
    generateUserReport() {
        const report = {
            summary: {
                totalUsers: this.data.users?.length || 0,
                activeUsers: this.getActiveUsersCount(),
                inactiveUsers: this.getUsersByStatus('inactive').length,
                pendingUsers: this.getUsersByStatus('pending').length,
                suspendedUsers: this.getUsersByStatus('suspended').length,
                twoFactorEnabled: this.get2FAEnabledCount(),
                recentLogins: this.getRecentLoginCount()
            },
            distributions: {
                byRole: this.data.rolesDistribution || [],
                byDepartment: this.generateDepartmentDistribution(),
                byStatus: this.generateStatusDistribution(),
                by2FA: this.generate2FADistribution()
            },
            trends: {
                userGrowth: this.data.userGrowth || [],
                loginActivity: this.data.loginActivity || []
            },
            security: {
                passwordStrength: this.analyzePasswordStrength(),
                securityMetrics: this.data.securityStatus || []
            }
        };
        
        return report;
    }

    generateStatusDistribution() {
        const statuses = ['active', 'inactive', 'pending', 'suspended'];
        return statuses.map(status => ({
            status: this.getStatusLabel(status),
            count: this.getUsersByStatus(status).length,
            percentage: Math.round((this.getUsersByStatus(status).length / (this.data.users?.length || 1)) * 100)
        }));
    }

    generate2FADistribution() {
        const enabled = this.get2FAEnabledCount();
        const total = this.data.users?.length || 1;
        const disabled = total - enabled;
        
        return [
            { label: 'Habilitado', count: enabled, percentage: Math.round((enabled / total) * 100) },
            { label: 'Deshabilitado', count: disabled, percentage: Math.round((disabled / total) * 100) }
        ];
    }

    analyzePasswordStrength() {
        // Simulate password strength analysis
        return {
            strong: 78,
            medium: 15,
            weak: 7
        };
    }

    // Cleanup and maintenance methods
    cleanupInactiveUsers(days = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const inactiveUsers = this.data.users?.filter(user => 
            user.status === 'inactive' && 
            user.lastLogin && 
            new Date(user.lastLogin) < cutoffDate
        ) || [];
        
        console.log(`🧹 Encontrados ${inactiveUsers.length} usuarios inactivos para limpieza`);
        return inactiveUsers;
    }

    archiveOldAuditLogs(days = 90) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        
        const oldLogs = this.data.auditLogs?.filter(log => 
            new Date(log.timestamp) < cutoffDate
        ) || [];
        
        console.log(`📦 Encontrados ${oldLogs.length} logs de auditoría para archivar`);
        return oldLogs;
    }

    performMaintenanceTasks() {
        console.log('🔧 Ejecutando tareas de mantenimiento...');
        
        const tasks = [
            { name: 'Limpieza de usuarios inactivos', count: this.cleanupInactiveUsers().length },
            { name: 'Archivo de logs antiguos', count: this.archiveOldAuditLogs().length },
            { name: 'Actualización de estadísticas', status: 'completed' }
        ];
        
        return tasks;
    }

    // Module lifecycle methods
    onModuleActivate() {
        console.log('✅ Módulo de usuarios activado');
    }

    onModuleDeactivate() {
        console.log('⏹️ Módulo de usuarios desactivado');
        // Cleanup any active timers, close modals, etc.
        this.modalStack.forEach(modalId => this.closeModal(modalId));
    }

    onModuleDestroy() {
        console.log('🗑️ Módulo de usuarios destruido');
        // Cleanup resources
        this.data = {};
        this.selectedUsers.clear();
        this.modalStack = [];
    }

    // API integration methods (placeholder for real implementation)
    async syncWithAPI() {
        console.log('🔄 Sincronizando con API...');
        // Implement actual API calls here
        return { success: true, message: 'Sincronización completada' };
    }

    async saveToAPI(data) {
        console.log('💾 Guardando en API...', data);
        // Implement actual API save here
        return { success: true, id: Math.random() };
    }

    async loadFromAPI() {
        console.log('📥 Cargando desde API...');
        // Implement actual API load here
        return this.data;
    }

    // Métodos adicionales compatibles con el patrón de otros módulos
    renderUserAnalytics() {
        return this.generateUserReport();
    }

    renderUserReports() {
        return this.generateUserReport();
    }

    renderActivityLogs() {
        return this.renderAuditTimeline();
    }

    renderSecurityAnalysis() {
        return this.data.securityStatus || [];
    }

    renderRoleAnalysis() {
        return this.data.rolesDistribution || [];
    }

    renderPermissionAnalysis() {
        return this.getPermissionsByCategory();
    }

    renderUserMetrics() {
        return {
            total: this.data.users?.length || 0,
            active: this.getActiveUsersCount(),
            with2FA: this.get2FAEnabledCount(),
            recentLogins: this.getRecentLoginCount()
        };
    }

    renderDepartmentAnalysis() {
        return this.generateDepartmentDistribution();
    }
}

// Export the module class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UsersModule;
} else if (typeof window !== 'undefined') {
    window.UsersModule = UsersModule;
}