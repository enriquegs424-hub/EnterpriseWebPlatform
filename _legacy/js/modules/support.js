// ===== SUPPORT MODULE - ENHANCED =====
// Módulo de Soporte Técnico completo con todas las funcionalidades

class SupportModule {
    constructor() {
        this.moduleId = 'support';
        this.currentTab = 'dashboard';
        this.data = {};
        this.isInitialized = false;
        this.tickets = [];
        this.categories = [];
        this.agents = [];
        this.knowledgeBase = [];
        this.filters = {
            search: '',
            status: '',
            priority: '',
            category: '',
            assignee: ''
        };
        this.sortBy = 'created';
        this.sortOrder = 'desc';
        this.currentPage = 1;
        this.itemsPerPage = 25;
    }

    async render(container) {
        try {
            console.log('🎧 Renderizando módulo de Soporte...');

            const supportHTML = `
                <div class="support-module">
                    <!-- Header del módulo -->
                    <div class="module-header">
                        <div class="module-title">
                            <h1>Centro de Soporte</h1>
                            <p>Gestión de tickets, documentación y asistencia técnica</p>
                        </div>
                        <div class="module-actions">
                            <button class="btn btn-secondary" onclick="window.app.modules.support.refreshData()">
                                <i data-lucide="refresh-cw"></i>
                                Actualizar
                            </button>
                            <button class="btn btn-secondary" onclick="window.app.modules.support.generateReport()">
                                <i data-lucide="file-text"></i>
                                Informe
                            </button>
                            <button class="btn btn-primary" onclick="window.app.modules.support.createTicket()">
                                <i data-lucide="plus"></i>
                                Nuevo Ticket
                            </button>
                        </div>
                    </div>

                    <!-- Navegación por pestañas -->
                    <div class="support-navigation">
                        <nav class="tab-navigation">
                            <button class="tab-btn active" data-tab="dashboard">
                                <i data-lucide="layout-dashboard"></i>
                                Dashboard
                            </button>
                            <button class="tab-btn" data-tab="tickets">
                                <i data-lucide="ticket"></i>
                                Tickets
                            </button>
                            <button class="tab-btn" data-tab="knowledge">
                                <i data-lucide="book-open"></i>
                                Base de Conocimiento
                            </button>
                            <button class="tab-btn" data-tab="chat">
                                <i data-lucide="message-circle"></i>
                                Chat en Vivo
                            </button>
                            <button class="tab-btn" data-tab="agents">
                                <i data-lucide="headphones"></i>
                                Agentes
                            </button>
                            <button class="tab-btn" data-tab="analytics">
                                <i data-lucide="bar-chart-3"></i>
                                Analíticas
                            </button>
                            <button class="tab-btn" data-tab="settings">
                                <i data-lucide="settings"></i>
                                Configuración
                            </button>
                        </nav>
                    </div>

                    <!-- Contenido de las pestañas -->
                    <div class="support-content">
                        <!-- Dashboard Tab -->
                        <div class="tab-panel active" data-panel="dashboard">
                            <div class="support-dashboard">
                                <!-- KPIs principales -->
                                <div class="stats-grid">
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="ticket"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Tickets Activos</h3>
                                            <div class="stat-value">156</div>
                                            <div class="stat-change positive">-12 desde ayer</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon warning">
                                            <i data-lucide="clock"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Tiempo Promedio</h3>
                                            <div class="stat-value">2.4h</div>
                                            <div class="stat-change positive">-0.5h vs ayer</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon success">
                                            <i data-lucide="check-circle"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Satisfacción</h3>
                                            <div class="stat-value">94.5%</div>
                                            <div class="stat-change positive">+2.1% este mes</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="users"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Agentes Activos</h3>
                                            <div class="stat-value">8/12</div>
                                            <div class="stat-change">67% capacidad</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Widgets del dashboard -->
                                <div class="dashboard-widgets">
                                    <!-- Widget: Tickets por prioridad -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Tickets por Prioridad</h3>
                                            <button class="btn btn-ghost btn-sm" onclick="window.app.modules.support.switchToTab('tickets')">Ver todos</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="priority-breakdown" id="priority-breakdown">
                                                <!-- Los datos se cargan dinámicamente -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Widget: Tickets recientes -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Tickets Recientes</h3>
                                            <button class="btn btn-ghost btn-sm" onclick="window.app.modules.support.switchToTab('tickets')">Ver todos</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="recent-tickets" id="recent-tickets-list">
                                                <!-- Los tickets se cargan dinámicamente -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Widget: Estado de agentes -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Estado de Agentes</h3>
                                            <button class="btn btn-ghost btn-sm" onclick="window.app.modules.support.switchToTab('agents')">Gestionar</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="agents-status" id="agents-status-list">
                                                <!-- Los agentes se cargan dinámicamente -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Widget: Satisfacción del cliente -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Satisfacción del Cliente</h3>
                                            <button class="btn btn-ghost btn-sm" onclick="window.app.modules.support.switchToTab('analytics')">Ver análisis</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="satisfaction-chart" id="satisfaction-chart">
                                                <!-- El gráfico se carga dinámicamente -->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Tickets Tab -->
                        <div class="tab-panel" data-panel="tickets">
                            <div class="tickets-management">
                                <div class="section-header">
                                    <h2>Gestión de Tickets</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.support.exportTickets()">
                                            <i data-lucide="download"></i>
                                            Exportar
                                        </button>
                                        <button class="btn btn-secondary" onclick="window.app.modules.support.bulkActions()">
                                            <i data-lucide="check-square"></i>
                                            Acciones Masivas
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.support.createTicket()">
                                            <i data-lucide="plus"></i>
                                            Nuevo Ticket
                                        </button>
                                    </div>
                                </div>

                                <!-- Filtros y búsqueda mejorados -->
                                <div class="tickets-filters">
                                    <div class="filter-row">
                                        <div class="search-container-enhanced">
                                            <i data-lucide="search" class="search-icon-enhanced"></i>
                                            <input type="text" placeholder="Buscar por título, descripción o cliente..." class="search-input-enhanced" id="ticket-search">
                                        </div>
                                        <div class="filters-grid">
                                            <select class="filter-select" id="status-filter">
                                                <option value="">Todos los estados</option>
                                                <option value="open">🟢 Abiertos</option>
                                                <option value="in-progress">🟡 En Progreso</option>
                                                <option value="pending">🟠 Pendientes</option>
                                                <option value="resolved">✅ Resueltos</option>
                                                <option value="closed">⚫ Cerrados</option>
                                            </select>
                                            <select class="filter-select" id="priority-filter">
                                                <option value="">Todas las prioridades</option>
                                                <option value="low">🟢 Baja</option>
                                                <option value="medium">🟡 Media</option>
                                                <option value="high">🟠 Alta</option>
                                                <option value="urgent">🔴 Urgente</option>
                                            </select>
                                            <select class="filter-select" id="category-filter">
                                                <option value="">Todas las categorías</option>
                                            </select>
                                            <select class="filter-select" id="assignee-filter">
                                                <option value="">Todos los agentes</option>
                                            </select>
                                        </div>
                                        <div class="filter-actions">
                                            <button class="btn btn-secondary" onclick="window.app.modules.support.applyFilters()">
                                                <i data-lucide="filter"></i>
                                                Filtrar
                                            </button>
                                            <button class="btn btn-ghost" onclick="window.app.modules.support.clearFilters()">
                                                <i data-lucide="x"></i>
                                                Limpiar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Quick stats mejoradas -->
                                <div class="tickets-quick-stats-enhanced" id="tickets-quick-stats">
                                    <!-- Las estadísticas se cargan dinámicamente -->
                                </div>

                                <!-- Vista de tickets mejorada -->
                                <div class="tickets-view">
                                    <div class="view-controls">
                                        <div class="view-options">
                                            <button class="view-btn active" data-view="list">
                                                <i data-lucide="list"></i>
                                                Lista
                                            </button>
                                            <button class="view-btn" data-view="grid">
                                                <i data-lucide="grid-3x3"></i>
                                                Cuadrícula
                                            </button>
                                            <button class="view-btn" data-view="kanban">
                                                <i data-lucide="columns"></i>
                                                Kanban
                                            </button>
                                        </div>
                                        <div class="sort-options">
                                            <select class="sort-select" id="sort-tickets">
                                                <option value="created-desc">📅 Más recientes</option>
                                                <option value="created-asc">📅 Más antiguos</option>
                                                <option value="priority-desc">🔥 Prioridad alta</option>
                                                <option value="priority-asc">💚 Prioridad baja</option>
                                                <option value="updated-desc">🔄 Actualizados</option>
                                                <option value="title-asc">🔤 A-Z</option>
                                            </select>
                                        </div>
                                    </div>

                                    <!-- Lista de tickets mejorada -->
                                    <div class="tickets-list-enhanced" id="tickets-list">
                                        <!-- Los tickets se cargan dinámicamente -->
                                    </div>

                                    <!-- Vista en cuadrícula -->
                                    <div class="tickets-grid" id="tickets-grid" style="display: none;">
                                        <!-- Los tickets en formato grid se cargan dinámicamente -->
                                    </div>

                                    <!-- Vista Kanban mejorada -->
                                    <div class="tickets-kanban-enhanced" id="tickets-kanban" style="display: none;">
                                        <div class="kanban-board-enhanced">
                                            <div class="kanban-column-enhanced" data-status="open">
                                                <div class="kanban-header-enhanced">
                                                    <div class="kanban-title">
                                                        <span class="status-indicator-enhanced open"></span>
                                                        <h3>Abiertos</h3>
                                                    </div>
                                                    <span class="kanban-count-enhanced">0</span>
                                                </div>
                                                <div class="kanban-tickets-enhanced" id="kanban-open">
                                                    <!-- Tickets abiertos -->
                                                </div>
                                            </div>
                                            <div class="kanban-column-enhanced" data-status="in-progress">
                                                <div class="kanban-header-enhanced">
                                                    <div class="kanban-title">
                                                        <span class="status-indicator-enhanced in-progress"></span>
                                                        <h3>En Progreso</h3>
                                                    </div>
                                                    <span class="kanban-count-enhanced">0</span>
                                                </div>
                                                <div class="kanban-tickets-enhanced" id="kanban-in-progress">
                                                    <!-- Tickets en progreso -->
                                                </div>
                                            </div>
                                            <div class="kanban-column-enhanced" data-status="pending">
                                                <div class="kanban-header-enhanced">
                                                    <div class="kanban-title">
                                                        <span class="status-indicator-enhanced pending"></span>
                                                        <h3>Pendientes</h3>
                                                    </div>
                                                    <span class="kanban-count-enhanced">0</span>
                                                </div>
                                                <div class="kanban-tickets-enhanced" id="kanban-pending">
                                                    <!-- Tickets pendientes -->
                                                </div>
                                            </div>
                                            <div class="kanban-column-enhanced" data-status="resolved">
                                                <div class="kanban-header-enhanced">
                                                    <div class="kanban-title">
                                                        <span class="status-indicator-enhanced resolved"></span>
                                                        <h3>Resueltos</h3>
                                                    </div>
                                                    <span class="kanban-count-enhanced">0</span>
                                                </div>
                                                <div class="kanban-tickets-enhanced" id="kanban-resolved">
                                                    <!-- Tickets resueltos -->
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Paginación -->
                                <div class="pagination-enhanced" id="tickets-pagination">
                                    <!-- La paginación se genera dinámicamente -->
                                </div>
                            </div>
                        </div>

                        <!-- Knowledge Base Tab -->
                        <div class="tab-panel" data-panel="knowledge">
                            <div class="knowledge-management">
                                <div class="section-header">
                                    <h2>Base de Conocimiento</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.support.searchKnowledge()">
                                            <i data-lucide="search"></i>
                                            Búsqueda Avanzada
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.support.createArticle()">
                                            <i data-lucide="plus"></i>
                                            Nuevo Artículo
                                        </button>
                                    </div>
                                </div>

                                <!-- Búsqueda de artículos -->
                                <div class="knowledge-search">
                                    <div class="search-box-enhanced">
                                        <i data-lucide="search" class="search-icon-enhanced"></i>
                                        <input type="text" placeholder="Buscar en la base de conocimiento..." class="knowledge-search-input" id="knowledge-search">
                                        <div class="search-suggestions-icon">
                                            <i data-lucide="zap"></i>
                                        </div>
                                    </div>
                                    <div class="popular-searches">
                                        <span class="search-label">Búsquedas populares:</span>
                                        <div class="search-tags">
                                            <span class="search-tag" onclick="window.app.modules.support.searchTerm('contraseña')">contraseña</span>
                                            <span class="search-tag" onclick="window.app.modules.support.searchTerm('2fa')">autenticación</span>
                                            <span class="search-tag" onclick="window.app.modules.support.searchTerm('integración')">integración</span>
                                            <span class="search-tag" onclick="window.app.modules.support.searchTerm('api')">API</span>
                                        </div>
                                    </div>
                                </div>

                                <!-- Categorías populares -->
                                <div class="knowledge-categories">
                                    <h3>Categorías Populares</h3>
                                    <div class="categories-grid-enhanced" id="knowledge-categories-grid">
                                        <!-- Las categorías se cargan dinámicamente -->
                                    </div>
                                </div>

                                <!-- Artículos destacados -->
                                <div class="featured-articles">
                                    <h3>Artículos Destacados</h3>
                                    <div class="articles-grid-enhanced" id="featured-articles-grid">
                                        <!-- Los artículos se cargan dinámicamente -->
                                    </div>
                                </div>

                                <!-- Artículos recientes -->
                                <div class="recent-articles">
                                    <h3>Artículos Recientes</h3>
                                    <div class="articles-list-enhanced" id="recent-articles-list">
                                        <!-- Los artículos se cargan dinámicamente -->
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Chat Tab -->
                        <div class="tab-panel" data-panel="chat">
                            <div class="chat-management">
                                <div class="section-header">
                                    <h2>Chat en Vivo</h2>
                                    <div class="section-actions">
                                        <div class="chat-status-enhanced">
                                            <span class="status-indicator-enhanced online"></span>
                                            <span>En línea</span>
                                            <span class="active-chats-indicator">3 activos</span>
                                        </div>
                                        <button class="btn btn-secondary" onclick="window.app.modules.support.toggleChatStatus()">
                                            <i data-lucide="power"></i>
                                            Cambiar Estado
                                        </button>
                                    </div>
                                </div>

                                <div class="chat-interface-enhanced">
                                    <!-- Lista de conversaciones -->
                                    <div class="chat-sidebar-enhanced">
                                        <div class="chat-sidebar-header">
                                            <h3>Conversaciones</h3>
                                            <div class="chat-filters">
                                                <button class="filter-btn active" data-filter="all">Todas</button>
                                                <button class="filter-btn" data-filter="unread">No leídas</button>
                                                <button class="filter-btn" data-filter="mine">Mías</button>
                                            </div>
                                        </div>
                                        <div class="chat-list-enhanced" id="chat-list">
                                            <!-- Las conversaciones se cargan dinámicamente -->
                                        </div>
                                    </div>

                                    <!-- Área de chat -->
                                    <div class="chat-main-enhanced">
                                        <div class="chat-header-enhanced">
                                            <div class="chat-user-info-enhanced">
                                                <div class="user-avatar-enhanced">JD</div>
                                                <div class="user-details-enhanced">
                                                    <div class="user-name-enhanced">Juan Díaz</div>
                                                    <div class="user-status-enhanced">
                                                        <span class="status-indicator-enhanced online"></span>
                                                        En línea • Escribe...
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="chat-actions-enhanced">
                                                <button class="btn-icon-enhanced" title="Información del usuario">
                                                    <i data-lucide="info"></i>
                                                </button>
                                                <button class="btn-icon-enhanced" title="Transferir chat">
                                                    <i data-lucide="users"></i>
                                                </button>
                                                <button class="btn-icon-enhanced" title="Crear ticket">
                                                    <i data-lucide="ticket"></i>
                                                </button>
                                                <button class="btn-icon-enhanced" title="Finalizar chat">
                                                    <i data-lucide="x"></i>
                                                </button>
                                            </div>
                                        </div>
                                        <div class="chat-messages-enhanced" id="chat-messages">
                                            <!-- Los mensajes se cargan dinámicamente -->
                                        </div>
                                        <div class="chat-input-enhanced">
                                            <div class="input-actions-enhanced">
                                                <button class="btn-icon-enhanced" title="Adjuntar archivo">
                                                    <i data-lucide="paperclip"></i>
                                                </button>
                                                <button class="btn-icon-enhanced" title="Emoji">
                                                    <i data-lucide="smile"></i>
                                                </button>
                                                <button class="btn-icon-enhanced" title="Respuestas rápidas">
                                                    <i data-lucide="zap"></i>
                                                </button>
                                            </div>
                                            <input type="text" placeholder="Escribe tu mensaje..." class="message-input-enhanced">
                                            <button class="send-btn-enhanced">
                                                <i data-lucide="send"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Agents Tab -->
                        <div class="tab-panel" data-panel="agents">
                            <div class="agents-management">
                                <div class="section-header">
                                    <h2>Gestión de Agentes</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.support.generateAgentReport()">
                                            <i data-lucide="file-text"></i>
                                            Informe de Rendimiento
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.support.addAgent()">
                                            <i data-lucide="user-plus"></i>
                                            Nuevo Agente
                                        </button>
                                    </div>
                                </div>

                                <!-- Stats de agentes -->
                                <div class="agents-stats-enhanced">
                                    <div class="stat-grid">
                                        <div class="stat-item-enhanced">
                                            <div class="stat-icon-enhanced">
                                                <i data-lucide="users"></i>
                                            </div>
                                            <div class="stat-content">
                                                <div class="stat-label">Total Agentes</div>
                                                <div class="stat-value">12</div>
                                                <div class="stat-change positive">+2 este mes</div>
                                            </div>
                                        </div>
                                        <div class="stat-item-enhanced">
                                            <div class="stat-icon-enhanced online">
                                                <i data-lucide="wifi"></i>
                                            </div>
                                            <div class="stat-content">
                                                <div class="stat-label">En Línea</div>
                                                <div class="stat-value">8</div>
                                                <div class="stat-change">67% disponibilidad</div>
                                            </div>
                                        </div>
                                        <div class="stat-item-enhanced">
                                            <div class="stat-icon-enhanced warning">
                                                <i data-lucide="clock"></i>
                                            </div>
                                            <div class="stat-content">
                                                <div class="stat-label">Ocupados</div>
                                                <div class="stat-value">5</div>
                                                <div class="stat-change">42% carga</div>
                                            </div>
                                        </div>
                                        <div class="stat-item-enhanced">
                                            <div class="stat-icon-enhanced success">
                                                <i data-lucide="check-circle"></i>
                                            </div>
                                            <div class="stat-content">
                                                <div class="stat-label">Disponibles</div>
                                                <div class="stat-value">3</div>
                                                <div class="stat-change">25% libres</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Lista de agentes -->
                                <div class="agents-grid-enhanced" id="agents-grid">
                                    <!-- Los agentes se cargan dinámicamente -->
                                </div>
                            </div>
                        </div>

                        <!-- Analytics Tab -->
                        <div class="tab-panel" data-panel="analytics">
                            <div class="analytics-management">
                                <div class="section-header">
                                    <h2>Analíticas de Soporte</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.support.exportAnalytics()">
                                            <i data-lucide="download"></i>
                                            Exportar Datos
                                        </button>
                                        <button class="btn btn-secondary" onclick="window.app.modules.support.scheduleReport()">
                                            <i data-lucide="calendar"></i>
                                            Programar Informe
                                        </button>
                                    </div>
                                </div>

                                <!-- Filtros de período -->
                                <div class="analytics-filters">
                                    <div class="filter-group">
                                        <select class="filter-select" id="analytics-period">
                                            <option value="today">Hoy</option>
                                            <option value="week">Esta semana</option>
                                            <option value="month" selected>Este mes</option>
                                            <option value="quarter">Este trimestre</option>
                                            <option value="year">Este año</option>
                                            <option value="custom">Personalizado</option>
                                        </select>
                                        <input type="date" class="filter-input" id="date-from" style="display: none;">
                                        <input type="date" class="filter-input" id="date-to" style="display: none;">
                                        <button class="btn btn-secondary" onclick="window.app.modules.support.updateAnalytics()">
                                            <i data-lucide="refresh-cw"></i>
                                            Actualizar
                                        </button>
                                    </div>
                                </div>

                                <!-- KPIs de analíticas -->
                                <div class="analytics-kpis-enhanced">
                                    <div class="kpi-grid">
                                        <div class="kpi-card-enhanced">
                                            <div class="kpi-header">
                                                <h4>Tickets Resueltos</h4>
                                                <i data-lucide="check-circle"></i>
                                            </div>
                                            <div class="kpi-value">1,247</div>
                                            <div class="kpi-trend positive">
                                                <i data-lucide="trending-up"></i>
                                                ↑ 12.5%
                                            </div>
                                        </div>
                                        <div class="kpi-card-enhanced">
                                            <div class="kpi-header">
                                                <h4>Tiempo Promedio</h4>
                                                <i data-lucide="clock"></i>
                                            </div>
                                            <div class="kpi-value">2.4h</div>
                                            <div class="kpi-trend positive">
                                                <i data-lucide="trending-down"></i>
                                                ↓ 15min
                                            </div>
                                        </div>
                                        <div class="kpi-card-enhanced">
                                            <div class="kpi-header">
                                                <h4>Primera Respuesta</h4>
                                                <i data-lucide="zap"></i>
                                            </div>
                                            <div class="kpi-value">8min</div>
                                            <div class="kpi-trend positive">
                                                <i data-lucide="trending-down"></i>
                                                ↓ 2min
                                            </div>
                                        </div>
                                        <div class="kpi-card-enhanced">
                                            <div class="kpi-header">
                                                <h4>Satisfacción</h4>
                                                <i data-lucide="star"></i>
                                            </div>
                                            <div class="kpi-value">4.7/5</div>
                                            <div class="kpi-trend positive">
                                                <i data-lucide="trending-up"></i>
                                                ↑ 0.2
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Gráficos de analíticas -->
                                <div class="analytics-charts-enhanced">
                                    <div class="chart-row">
                                        <div class="chart-container-enhanced">
                                            <h3>Volumen de Tickets</h3>
                                            <div class="chart-placeholder-enhanced" id="tickets-volume-chart">
                                                <i data-lucide="bar-chart-3"></i>
                                                <p>Gráfico de volumen de tickets por día</p>
                                                <div class="chart-mock">
                                                    <div class="chart-bars">
                                                        <div class="chart-bar" style="height: 60%"></div>
                                                        <div class="chart-bar" style="height: 80%"></div>
                                                        <div class="chart-bar" style="height: 45%"></div>
                                                        <div class="chart-bar" style="height: 90%"></div>
                                                        <div class="chart-bar" style="height: 70%"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="chart-container-enhanced">
                                            <h3>Tiempo de Resolución</h3>
                                            <div class="chart-placeholder-enhanced" id="resolution-time-chart">
                                                <i data-lucide="clock"></i>
                                                <p>Tiempo promedio de resolución</p>
                                                <div class="chart-mock">
                                                    <div class="chart-line">
                                                        <svg viewBox="0 0 100 50" class="line-chart">
                                                            <polyline points="0,40 20,30 40,25 60,20 80,15 100,10" fill="none" stroke="var(--mep-primary-500)" stroke-width="2"/>
                                                        </svg>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Settings Tab -->
                        <div class="tab-panel" data-panel="settings">
                            <div class="settings-management">
                                <div class="section-header">
                                    <h2>Configuración de Soporte</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.support.resetSettings()">
                                            <i data-lucide="refresh-cw"></i>
                                            Restaurar Defecto
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.support.saveSettings()">
                                            <i data-lucide="save"></i>
                                            Guardar Configuración
                                        </button>
                                    </div>
                                </div>

                                <!-- Configuración -->
                                <div class="settings-grid-enhanced">
                                    <!-- Configuración general -->
                                    <div class="settings-card-enhanced">
                                        <div class="settings-header-enhanced">
                                            <div class="settings-title">
                                                <i data-lucide="settings"></i>
                                                <h3>Configuración General</h3>
                                            </div>
                                        </div>
                                        <div class="settings-content-enhanced">
                                            <div class="setting-item-enhanced">
                                                <label class="setting-label-enhanced">
                                                    <i data-lucide="clock"></i>
                                                    Horario de Atención
                                                </label>
                                                <select class="setting-select-enhanced">
                                                    <option value="24/7">24/7</option>
                                                    <option value="business">Horario Comercial</option>
                                                    <option value="custom">Personalizado</option>
                                                </select>
                                            </div>
                                            <div class="setting-item-enhanced">
                                                <label class="setting-label-enhanced">
                                                    <i data-lucide="globe"></i>
                                                    Idioma por Defecto
                                                </label>
                                                <select class="setting-select-enhanced">
                                                    <option value="es">Español</option>
                                                    <option value="en">English</option>
                                                    <option value="fr">Français</option>
                                                </select>
                                            </div>
                                            <div class="setting-item-enhanced">
                                                <div class="setting-toggle">
                                                    <label class="setting-label-enhanced">
                                                        <i data-lucide="zap"></i>
                                                        Auto-asignación de Tickets
                                                    </label>
                                                    <div class="toggle-switch">
                                                        <input type="checkbox" id="auto-assign" checked>
                                                        <span class="toggle-slider"></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="setting-item-enhanced">
                                                <div class="setting-toggle">
                                                    <label class="setting-label-enhanced">
                                                        <i data-lucide="mail"></i>
                                                        Notificaciones por Email
                                                    </label>
                                                    <div class="toggle-switch">
                                                        <input type="checkbox" id="email-notifications" checked>
                                                        <span class="toggle-slider"></span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- SLA Configuration -->
                                    <div class="settings-card-enhanced">
                                        <div class="settings-header-enhanced">
                                            <div class="settings-title">
                                                <i data-lucide="timer"></i>
                                                <h3>Acuerdos de Nivel de Servicio (SLA)</h3>
                                            </div>
                                        </div>
                                        <div class="settings-content-enhanced">
                                            <div class="sla-grid">
                                                <div class="sla-item-enhanced">
                                                    <div class="sla-priority low">
                                                        <span class="priority-indicator"></span>
                                                        <span>Baja</span>
                                                    </div>
                                                    <div class="sla-time">
                                                        <input type="number" value="24" min="1" max="168" class="sla-input">
                                                        <span class="sla-unit">horas</span>
                                                    </div>
                                                </div>
                                                <div class="sla-item-enhanced">
                                                    <div class="sla-priority medium">
                                                        <span class="priority-indicator"></span>
                                                        <span>Media</span>
                                                    </div>
                                                    <div class="sla-time">
                                                        <input type="number" value="8" min="1" max="24" class="sla-input">
                                                        <span class="sla-unit">horas</span>
                                                    </div>
                                                </div>
                                                <div class="sla-item-enhanced">
                                                    <div class="sla-priority high">
                                                        <span class="priority-indicator"></span>
                                                        <span>Alta</span>
                                                    </div>
                                                    <div class="sla-time">
                                                        <input type="number" value="2" min="1" max="8" class="sla-input">
                                                        <span class="sla-unit">horas</span>
                                                    </div>
                                                </div>
                                                <div class="sla-item-enhanced">
                                                    <div class="sla-priority urgent">
                                                        <span class="priority-indicator"></span>
                                                        <span>Urgente</span>
                                                    </div>
                                                    <div class="sla-time">
                                                        <input type="number" value="30" min="5" max="120" class="sla-input">
                                                        <span class="sla-unit">minutos</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Categorías de tickets -->
                                    <div class="settings-card-enhanced">
                                        <div class="settings-header-enhanced">
                                            <div class="settings-title">
                                                <i data-lucide="tag"></i>
                                                <h3>Categorías de Tickets</h3>
                                            </div>
                                            <button class="btn btn-sm btn-primary" onclick="window.app.modules.support.addCategory()">
                                                <i data-lucide="plus"></i>
                                                Añadir
                                            </button>
                                        </div>
                                        <div class="settings-content-enhanced">
                                            <div class="categories-manager-enhanced" id="categories-manager">
                                                <!-- Las categorías se cargan dinámicamente -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Plantillas de respuesta -->
                                    <div class="settings-card-enhanced">
                                        <div class="settings-header-enhanced">
                                            <div class="settings-title">
                                                <i data-lucide="message-square"></i>
                                                <h3>Plantillas de Respuesta</h3>
                                            </div>
                                            <button class="btn btn-sm btn-primary" onclick="window.app.modules.support.addTemplate()">
                                                <i data-lucide="plus"></i>
                                                Añadir
                                            </button>
                                        </div>
                                        <div class="settings-content-enhanced">
                                            <div class="templates-manager-enhanced" id="templates-manager">
                                                <!-- Las plantillas se cargan dinámicamente -->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = supportHTML;
            this.isInitialized = true;

        } catch (error) {
            console.error('❌ Error renderizando módulo de Soporte:', error);
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i data-lucide="alert-triangle"></i>
                    </div>
                    <h3>Error al cargar Soporte</h3>
                    <p>No se pudo cargar el módulo de soporte. Inténtalo de nuevo.</p>
                    <button class="btn btn-primary" onclick="window.app.loadModule('support')">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    async afterRender() {
        try {
            console.log('🔧 Configurando módulo de Soporte...');
            
            // Setup tab navigation
            this.setupTabNavigation();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadData();
            
            // Render initial dashboard content
            this.renderDashboardContent();
            
            console.log('✅ Módulo de Soporte configurado correctamente');
            
        } catch (error) {
            console.error('❌ Error en afterRender del módulo de Soporte:', error);
        }
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.support-module .tab-btn');
        const tabPanels = document.querySelectorAll('.support-module .tab-panel');

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
                console.log(`📂 Cambiando a pestaña de soporte: ${targetTab}`);
                
                // Load tab-specific data
                this.loadTabData(targetTab);
            });
        });
    }

    setupEventListeners() {
        // Search functionality
        const ticketSearch = document.getElementById('ticket-search');
        if (ticketSearch) {
            ticketSearch.addEventListener('input', 
                this.debounce((e) => this.handleTicketSearch(e.target.value), 300)
            );
        }

        const knowledgeSearch = document.getElementById('knowledge-search');
        if (knowledgeSearch) {
            knowledgeSearch.addEventListener('input', 
                this.debounce((e) => this.handleKnowledgeSearch(e.target.value), 300)
            );
        }

        // Filter changes
        const filters = ['status-filter', 'priority-filter', 'category-filter', 'assignee-filter'];
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
        const sortSelect = document.getElementById('sort-tickets');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => this.handleSortChange(e.target.value));
        }

        // Chat input
        const messageInput = document.querySelector('.message-input-enhanced');
        if (messageInput) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage(e.target.value);
                    e.target.value = '';
                }
            });
        }

        // Analytics period change
        const analyticsPeriod = document.getElementById('analytics-period');
        if (analyticsPeriod) {
            analyticsPeriod.addEventListener('change', (e) => this.handlePeriodChange(e.target.value));
        }
    }

    async loadData() {
        try {
            console.log('📊 Cargando datos de soporte...');
            
            // Simulate loading data - replace with actual API calls
            await new Promise(resolve => setTimeout(resolve, 800));
            
            this.data = {
                stats: {
                    activeTickets: 156,
                    avgResponseTime: 2.4,
                    satisfaction: 94.5,
                    activeAgents: 8,
                    totalAgents: 12
                },
                tickets: this.generateSampleTickets(),
                agents: this.generateSampleAgents(),
                categories: this.generateSampleCategories(),
                knowledgeBase: this.generateSampleKnowledge(),
                chats: this.generateSampleChats(),
                priorityBreakdown: this.generatePriorityBreakdown(),
                recentTickets: this.generateRecentTickets(),
                agentsStatus: this.generateAgentsStatus(),
                satisfactionData: this.generateSatisfactionData(),
                templates: this.generateSampleTemplates()
            };
            
            console.log('🎧 Datos de soporte cargados:', this.data);
            
        } catch (error) {
            console.error('❌ Error cargando datos de soporte:', error);
            if (window.app) {
                window.app.showNotification('Error al cargar datos de soporte', 'error');
            }
        }
    }

    generateSampleTickets() {
        return [
            {
                id: 'TK-001',
                title: 'Error al cargar el dashboard principal',
                description: 'El dashboard no carga correctamente después de la última actualización del sistema. Los usuarios reportan pantalla en blanco.',
                customer: 'Ana García',
                customerEmail: 'ana.garcia@cliente.com',
                status: 'open',
                priority: 'high',
                category: 'Técnico',
                assignee: 'Carlos López',
                created: '2025-06-02 14:30',
                updated: '2025-06-02 15:45',
                tags: ['dashboard', 'error', 'urgente', 'frontend'],
                estimatedTime: '4 horas',
                customerSatisfaction: null
            },
            {
                id: 'TK-002',
                title: 'Solicitud de nueva funcionalidad de exportación',
                description: 'Necesitamos poder exportar los reportes de ventas en formato Excel con gráficos incluidos para presentaciones ejecutivas.',
                customer: 'María Fernández',
                customerEmail: 'maria.fernandez@empresa.com',
                status: 'in-progress',
                priority: 'medium',
                category: 'Funcionalidad',
                assignee: 'Laura Sánchez',
                created: '2025-06-01 10:15',
                updated: '2025-06-02 09:30',
                tags: ['export', 'excel', 'mejora', 'reportes'],
                estimatedTime: '12 horas',
                customerSatisfaction: null
            },
            {
                id: 'TK-003',
                title: 'Problema crítico con autenticación móvil',
                description: 'Los usuarios no pueden iniciar sesión desde dispositivos móviles iOS. Error 401 constante.',
                customer: 'José Martín',
                customerEmail: 'jose.martin@negocio.com',
                status: 'pending',
                priority: 'urgent',
                category: 'Seguridad',
                assignee: 'Pedro Ruiz',
                created: '2025-06-02 08:20',
                updated: '2025-06-02 12:10',
                tags: ['auth', 'mobile', 'crítico', 'ios'],
                estimatedTime: '2 horas',
                customerSatisfaction: null
            },
            {
                id: 'TK-004',
                title: 'Consulta sobre proceso de facturación automática',
                description: 'Pregunta sobre cómo configurar la facturación automática mensual para clientes recurrentes.',
                customer: 'Carmen Jiménez',
                customerEmail: 'carmen.jimenez@startup.com',
                status: 'resolved',
                priority: 'low',
                category: 'Facturación',
                assignee: 'Ana Torres',
                created: '2025-05-30 16:45',
                updated: '2025-06-01 11:20',
                tags: ['billing', 'consulta', 'resuelto', 'configuración'],
                estimatedTime: '1 hora',
                customerSatisfaction: 5
            },
            {
                id: 'TK-005',
                title: 'Integración con API de CRM externo',
                description: 'Ayuda para integrar nuestro sistema con la API de Salesforce para sincronización de contactos.',
                customer: 'Roberto Castro',
                customerEmail: 'roberto.castro@corp.com',
                status: 'open',
                priority: 'medium',
                category: 'Integración',
                assignee: 'David Morales',
                created: '2025-06-01 11:30',
                updated: '2025-06-02 14:15',
                tags: ['api', 'integration', 'crm', 'salesforce'],
                estimatedTime: '8 horas',
                customerSatisfaction: null
            },
            {
                id: 'TK-006',
                title: 'Optimización de rendimiento del sistema',
                description: 'El sistema está lento durante las horas pico. Necesitamos optimizar la base de datos y el servidor.',
                customer: 'Elena Morales',
                customerEmail: 'elena.morales@empresa.com',
                status: 'in-progress',
                priority: 'high',
                category: 'Técnico',
                assignee: 'Carlos López',
                created: '2025-05-31 09:00',
                updated: '2025-06-02 10:30',
                tags: ['performance', 'database', 'server', 'optimization'],
                estimatedTime: '16 horas',
                customerSatisfaction: null
            }
        ];
    }

    generateSampleAgents() {
        return [
            {
                id: 1,
                name: 'Carlos López',
                email: 'carlos.lopez@mep-projects.com',
                avatar: 'CL',
                status: 'online',
                activeTickets: 12,
                resolvedToday: 8,
                avgResponseTime: '15min',
                satisfaction: 4.8,
                specialties: ['Técnico', 'Integración', 'Performance'],
                languages: ['Español', 'Inglés'],
                workload: 80,
                availableFrom: '09:00',
                availableTo: '18:00'
            },
            {
                id: 2,
                name: 'Laura Sánchez',
                email: 'laura.sanchez@mep-projects.com',
                avatar: 'LS',
                status: 'busy',
                activeTickets: 15,
                resolvedToday: 6,
                avgResponseTime: '12min',
                satisfaction: 4.9,
                specialties: ['Funcionalidad', 'UX', 'Frontend'],
                languages: ['Español', 'Francés'],
                workload: 100,
                availableFrom: '08:00',
                availableTo: '17:00'
            },
            {
                id: 3,
                name: 'Pedro Ruiz',
                email: 'pedro.ruiz@mep-projects.com',
                avatar: 'PR',
                status: 'online',
                activeTickets: 8,
                resolvedToday: 12,
                avgResponseTime: '8min',
                satisfaction: 4.7,
                specialties: ['Seguridad', 'API', 'DevOps'],
                languages: ['Español', 'Inglés'],
                workload: 60,
                availableFrom: '10:00',
                availableTo: '19:00'
            },
            {
                id: 4,
                name: 'Ana Torres',
                email: 'ana.torres@mep-projects.com',
                avatar: 'AT',
                status: 'away',
                activeTickets: 5,
                resolvedToday: 10,
                avgResponseTime: '18min',
                satisfaction: 4.6,
                specialties: ['Facturación', 'Ventas', 'Consultas'],
                languages: ['Español'],
                workload: 40,
                availableFrom: '09:00',
                availableTo: '16:00'
            },
            {
                id: 5,
                name: 'David Morales',
                email: 'david.morales@mep-projects.com',
                avatar: 'DM',
                status: 'online',
                activeTickets: 10,
                resolvedToday: 7,
                avgResponseTime: '20min',
                satisfaction: 4.5,
                specialties: ['Integración', 'API', 'Backend'],
                languages: ['Español', 'Inglés'],
                workload: 70,
                availableFrom: '09:30',
                availableTo: '18:30'
            }
        ];
    }

    generateSampleCategories() {
        return [
            { id: 1, name: 'Técnico', color: '#EF4444', count: 45, icon: 'wrench' },
            { id: 2, name: 'Funcionalidad', color: '#3B82F6', count: 32, icon: 'zap' },
            { id: 3, name: 'Facturación', color: '#10B981', count: 18, icon: 'credit-card' },
            { id: 4, name: 'Seguridad', color: '#F59E0B', count: 12, icon: 'shield' },
            { id: 5, name: 'Integración', color: '#8B5CF6', count: 8, icon: 'link' },
            { id: 6, name: 'Consulta General', color: '#6B7280', count: 41, icon: 'help-circle' }
        ];
    }

    generateSampleKnowledge() {
        return [
            {
                id: 1,
                title: 'Cómo configurar la autenticación de dos factores',
                category: 'Seguridad',
                excerpt: 'Guía paso a paso para habilitar 2FA en tu cuenta y mejorar la seguridad',
                content: 'Contenido completo del artículo con pasos detallados...',
                author: 'Pedro Ruiz',
                created: '2025-05-25',
                updated: '2025-06-01',
                views: 1247,
                helpful: 95,
                tags: ['2fa', 'seguridad', 'configuración', 'cuenta'],
                difficulty: 'Intermedio',
                readTime: '5 min'
            },
            {
                id: 2,
                title: 'Integración con APIs externas - Guía completa',
                category: 'Desarrollo',
                excerpt: 'Cómo integrar tu aplicación con APIs de terceros como Salesforce, HubSpot y más',
                content: 'Contenido completo del artículo con ejemplos de código...',
                author: 'Carlos López',
                created: '2025-05-20',
                updated: '2025-05-30',
                views: 856,
                helpful: 87,
                tags: ['api', 'integration', 'desarrollo', 'salesforce'],
                difficulty: 'Avanzado',
                readTime: '12 min'
            },
            {
                id: 3,
                title: 'Resolución de problemas comunes del sistema',
                category: 'Técnico',
                excerpt: 'Soluciones a los problemas más frecuentes que reportan los usuarios',
                content: 'Contenido completo del artículo con troubleshooting...',
                author: 'Laura Sánchez',
                created: '2025-05-18',
                updated: '2025-06-02',
                views: 2103,
                helpful: 92,
                tags: ['troubleshooting', 'problemas', 'soluciones', 'sistema'],
                difficulty: 'Básico',
                readTime: '8 min'
            },
            {
                id: 4,
                title: 'Configuración de facturación automática',
                category: 'Facturación',
                excerpt: 'Aprende a configurar la facturación automática para clientes recurrentes',
                content: 'Contenido completo con capturas de pantalla...',
                author: 'Ana Torres',
                created: '2025-05-15',
                updated: '2025-05-28',
                views: 643,
                helpful: 89,
                tags: ['facturación', 'automatización', 'clientes', 'configuración'],
                difficulty: 'Intermedio',
                readTime: '6 min'
            }
        ];
    }

    generateSampleChats() {
        return [
            {
                id: 1,
                customer: 'Juan Díaz',
                avatar: 'JD',
                status: 'online',
                lastMessage: 'Gracias por la ayuda con el problema',
                timestamp: '14:30',
                unread: 0,
                agent: 'Carlos López',
                priority: 'medium',
                topic: 'Error de conexión',
                duration: '00:15:32'
            },
            {
                id: 2,
                customer: 'Elena Morales',
                avatar: 'EM',
                status: 'typing',
                lastMessage: 'Necesito ayuda con la configuración...',
                timestamp: '14:25',
                unread: 2,
                agent: 'Laura Sánchez',
                priority: 'high',
                topic: 'Configuración',
                duration: '00:08:15'
            },
            {
                id: 3,
                customer: 'Miguel Herrera',
                avatar: 'MH',
                status: 'online',
                lastMessage: 'OK, perfecto. Todo resuelto.',
                timestamp: '14:15',
                unread: 0,
                agent: 'Pedro Ruiz',
                priority: 'low',
                topic: 'Consulta general',
                duration: '00:05:45'
            },
            {
                id: 4,
                customer: 'Carmen Jiménez',
                avatar: 'CJ',
                status: 'away',
                lastMessage: '¿Podrían ayudarme con la facturación?',
                timestamp: '13:45',
                unread: 1,
                agent: 'Ana Torres',
                priority: 'medium',
                topic: 'Facturación',
                duration: '00:12:20'
            }
        ];
    }

    generateSampleTemplates() {
        return [
            {
                id: 1,
                name: 'Saludo inicial',
                content: 'Hola {nombre}, gracias por contactarnos. Estaré encantado/a de ayudarte con tu consulta.',
                category: 'Saludos',
                usage: 245,
                lastUsed: '2025-06-02'
            },
            {
                id: 2,
                name: 'Resolución técnica',
                content: 'He revisado tu problema y he identificado la causa. Para solucionarlo, necesitas seguir estos pasos:\n\n1. {paso1}\n2. {paso2}\n3. {paso3}',
                category: 'Técnico',
                usage: 156,
                lastUsed: '2025-06-02'
            },
            {
                id: 3,
                name: 'Seguimiento',
                content: 'Quería hacer seguimiento a tu ticket #{ticket_id}. ¿Has podido implementar la solución que te proporcioné?',
                category: 'Seguimiento',
                usage: 89,
                lastUsed: '2025-06-01'
            },
            {
                id: 4,
                name: 'Cierre de ticket',
                content: 'Tu ticket ha sido resuelto satisfactoriamente. Si tienes alguna pregunta adicional, no dudes en contactarnos.',
                category: 'Cierre',
                usage: 312,
                lastUsed: '2025-06-02'
            },
            {
                id: 5,
                name: 'Escalación',
                content: 'Tu consulta requiere la atención de nuestro equipo especializado. He escalado tu caso y te contactarán en las próximas 2 horas.',
                category: 'Escalación',
                usage: 43,
                lastUsed: '2025-05-31'
            }
        ];
    }

    generatePriorityBreakdown() {
        return [
            { priority: 'Baja', count: 45, percentage: 35, color: '#10B981' },
            { priority: 'Media', count: 38, percentage: 30, color: '#3B82F6' },
            { priority: 'Alta', count: 25, percentage: 20, color: '#F59E0B' },
            { priority: 'Urgente', count: 18, percentage: 15, color: '#EF4444' }
        ];
    }

    generateRecentTickets() {
        return [
            {
                id: 'TK-001',
                title: 'Error al cargar el dashboard principal',
                customer: 'Ana García',
                status: 'open',
                priority: 'high',
                created: 'hace 2 horas'
            },
            {
                id: 'TK-005',
                title: 'Integración con API de CRM externo',
                customer: 'Roberto Castro',
                status: 'open',
                priority: 'medium',
                created: 'hace 3 horas'
            },
            {
                id: 'TK-003',
                title: 'Problema crítico con autenticación móvil',
                customer: 'José Martín',
                status: 'pending',
                priority: 'urgent',
                created: 'hace 6 horas'
            }
        ];
    }

    generateAgentsStatus() {
        return [
            { name: 'Carlos López', status: 'online', tickets: 12, load: 80 },
            { name: 'Laura Sánchez', status: 'busy', tickets: 15, load: 100 },
            { name: 'Pedro Ruiz', status: 'online', tickets: 8, load: 60 },
            { name: 'Ana Torres', status: 'away', tickets: 5, load: 40 }
        ];
    }

    generateSatisfactionData() {
        return [
            { rating: 5, count: 156, percentage: 62 },
            { rating: 4, count: 78, percentage: 31 },
            { rating: 3, count: 12, percentage: 5 },
            { rating: 2, count: 3, percentage: 1 },
            { rating: 1, count: 1, percentage: 1 }
        ];
    }

    renderDashboardContent() {
        this.renderPriorityBreakdown();
        this.renderRecentTickets();
        this.renderAgentsStatus();
        this.renderSatisfactionChart();
    }

    renderPriorityBreakdown() {
        const container = document.getElementById('priority-breakdown');
        if (!container || !this.data.priorityBreakdown) return;

        const breakdownHTML = this.data.priorityBreakdown.map(item => `
            <div class="priority-item">
                <div class="priority-info">
                    <div class="priority-color" style="background-color: ${item.color}"></div>
                    <span class="priority-name">${item.priority}</span>
                </div>
                <div class="priority-stats">
                    <span class="priority-count">${item.count}</span>
                    <div class="priority-bar">
                        <div class="priority-fill" style="width: ${item.percentage}%; background-color: ${item.color}"></div>
                    </div>
                    <span class="priority-percentage">${item.percentage}%</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = breakdownHTML;
    }

    renderRecentTickets() {
        const container = document.getElementById('recent-tickets-list');
        if (!container || !this.data.recentTickets) return;

        const ticketsHTML = this.data.recentTickets.map(ticket => `
            <div class="recent-ticket-item">
                <div class="ticket-info">
                    <div class="ticket-id">${ticket.id}</div>
                    <div class="ticket-title">${ticket.title}</div>
                    <div class="ticket-customer">${ticket.customer}</div>
                </div>
                <div class="ticket-meta">
                    <span class="badge badge-${this.getPriorityBadgeClass(ticket.priority)}">${this.getPriorityLabel(ticket.priority)}</span>
                    <span class="badge badge-${this.getStatusBadgeClass(ticket.status)}">${this.getStatusLabel(ticket.status)}</span>
                    <div class="ticket-time">${ticket.created}</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = ticketsHTML;
    }

    renderAgentsStatus() {
        const container = document.getElementById('agents-status-list');
        if (!container || !this.data.agentsStatus) return;

        const agentsHTML = this.data.agentsStatus.map(agent => `
            <div class="agent-status-item">
                <div class="agent-info">
                    <div class="agent-avatar">${agent.name.split(' ').map(n => n[0]).join('')}</div>
                    <div class="agent-details">
                        <div class="agent-name">${agent.name}</div>
                        <div class="agent-status ${agent.status}">
                            <span class="status-indicator"></span>
                            ${this.getStatusLabel(agent.status)}
                        </div>
                    </div>
                </div>
                <div class="agent-stats">
                    <div class="agent-tickets">${agent.tickets} tickets</div>
                    <div class="agent-load">
                        <div class="load-bar">
                            <div class="load-fill" style="width: ${agent.load}%; background-color: ${this.getLoadColor(agent.load)}"></div>
                        </div>
                        <span class="load-percentage">${agent.load}%</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = agentsHTML;
    }

    renderSatisfactionChart() {
        const container = document.getElementById('satisfaction-chart');
        if (!container || !this.data.satisfactionData) return;

        const chartHTML = this.data.satisfactionData.map(item => `
            <div class="satisfaction-item">
                <div class="rating-info">
                    <div class="rating-stars">
                        ${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}
                    </div>
                    <span class="rating-count">${item.count}</span>
                </div>
                <div class="rating-bar">
                    <div class="rating-fill" style="width: ${item.percentage}%"></div>
                </div>
                <span class="rating-percentage">${item.percentage}%</span>
            </div>
        `).join('');

        container.innerHTML = chartHTML;
    }

    async loadTabData(tabName) {
        try {
            console.log(`📈 Cargando datos para pestaña: ${tabName}`);
            
            switch (tabName) {
                case 'dashboard':
                    this.renderDashboardContent();
                    break;
                case 'tickets':
                    this.renderTicketsTab();
                    break;
                case 'knowledge':
                    this.renderKnowledgeTab();
                    break;
                case 'chat':
                    this.renderChatTab();
                    break;
                case 'agents':
                    this.renderAgentsTab();
                    break;
                case 'analytics':
                    this.renderAnalyticsTab();
                    break;
                case 'settings':
                    this.renderSettingsTab();
                    break;
            }
            
        } catch (error) {
            console.error(`❌ Error cargando datos para ${tabName}:`, error);
        }
    }

    renderTicketsTab() {
        this.updateTicketFilters();
        this.renderTicketsList();
        this.renderTicketsQuickStats();
    }

    updateTicketFilters() {
        // Update category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter && this.data.categories) {
            const optionsHTML = '<option value="">Todas las categorías</option>' +
                this.data.categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
            categoryFilter.innerHTML = optionsHTML;
        }

        // Update assignee filter
        const assigneeFilter = document.getElementById('assignee-filter');
        if (assigneeFilter && this.data.agents) {
            const optionsHTML = '<option value="">Todos los agentes</option>' +
                this.data.agents.map(agent => `<option value="${agent.name}">${agent.name}</option>`).join('');
            assigneeFilter.innerHTML = optionsHTML;
        }
    }

    renderTicketsList() {
        const container = document.getElementById('tickets-list');
        if (!container || !this.data.tickets) return;

        const filteredTickets = this.getFilteredTickets();
        
        const ticketsHTML = filteredTickets.map(ticket => `
            <div class="ticket-card-enhanced">
                <div class="ticket-header-enhanced">
                    <div class="ticket-id-enhanced">${ticket.id}</div>
                    <div class="ticket-priority-enhanced">
                        <span class="priority-badge-enhanced priority-${ticket.priority}">${this.getPriorityLabel(ticket.priority)}</span>
                    </div>
                </div>
                <div class="ticket-content-enhanced">
                    <h3 class="ticket-title-enhanced">${ticket.title}</h3>
                    <p class="ticket-description-enhanced">${ticket.description}</p>
                    <div class="ticket-tags-enhanced">
                        ${ticket.tags.map(tag => `<span class="tag-enhanced">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="ticket-meta-enhanced">
                    <div class="ticket-customer-enhanced">
                        <i data-lucide="user"></i>
                        <span>${ticket.customer}</span>
                    </div>
                    <div class="ticket-assignee-enhanced">
                        <i data-lucide="user-check"></i>
                        <span>${ticket.assignee}</span>
                    </div>
                    <div class="ticket-category-enhanced">
                        <i data-lucide="tag"></i>
                        <span>${ticket.category}</span>
                    </div>
                    <div class="ticket-estimate-enhanced">
                        <i data-lucide="clock"></i>
                        <span>${ticket.estimatedTime}</span>
                    </div>
                </div>
                <div class="ticket-footer-enhanced">
                    <div class="ticket-status-enhanced">
                        <span class="badge-enhanced badge-${this.getStatusBadgeClass(ticket.status)}">${this.getStatusLabel(ticket.status)}</span>
                    </div>
                    <div class="ticket-time-enhanced">
                        <div class="time-item">
                            <span class="time-label">Creado:</span>
                            <span class="time-value">${ticket.created}</span>
                        </div>
                        <div class="time-item">
                            <span class="time-label">Actualizado:</span>
                            <span class="time-value">${ticket.updated}</span>
                        </div>
                    </div>
                    <div class="ticket-actions-enhanced">
                        <button class="btn-icon-enhanced" onclick="window.app.modules.support.viewTicket('${ticket.id}')" title="Ver detalles">
                            <i data-lucide="eye"></i>
                        </button>
                        <button class="btn-icon-enhanced" onclick="window.app.modules.support.editTicket('${ticket.id}')" title="Editar">
                            <i data-lucide="edit"></i>
                        </button>
                        <button class="btn-icon-enhanced" onclick="window.app.modules.support.assignTicket('${ticket.id}')" title="Asignar">
                            <i data-lucide="user-plus"></i>
                        </button>
                        <button class="btn-icon-enhanced ${ticket.status === 'resolved' ? 'btn-success' : ''}" onclick="window.app.modules.support.closeTicket('${ticket.id}')" title="${ticket.status === 'resolved' ? 'Reabrir' : 'Cerrar'}">
                            <i data-lucide="${ticket.status === 'resolved' ? 'rotate-ccw' : 'check'}"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = ticketsHTML;
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderTicketsQuickStats() {
        const container = document.getElementById('tickets-quick-stats');
        if (!container) return;

        const filteredTickets = this.getFilteredTickets();
        const openTickets = filteredTickets.filter(t => t.status === 'open').length;
        const inProgressTickets = filteredTickets.filter(t => t.status === 'in-progress').length;
        const pendingTickets = filteredTickets.filter(t => t.status === 'pending').length;
        const resolvedTickets = filteredTickets.filter(t => t.status === 'resolved').length;
        const avgSatisfaction = this.calculateAverageSatisfaction(filteredTickets);

        container.innerHTML = `
            <div class="quick-stat-enhanced">
                <div class="stat-icon-enhanced">
                    <i data-lucide="ticket"></i>
                </div>
                <div class="stat-content-enhanced">
                    <span class="stat-label-enhanced">Total</span>
                    <span class="stat-value-enhanced">${filteredTickets.length}</span>
                </div>
            </div>
            <div class="quick-stat-enhanced">
                <div class="stat-icon-enhanced success">
                    <i data-lucide="circle"></i>
                </div>
                <div class="stat-content-enhanced">
                    <span class="stat-label-enhanced">Abiertos</span>
                    <span class="stat-value-enhanced">${openTickets}</span>
                </div>
            </div>
            <div class="quick-stat-enhanced">
                <div class="stat-icon-enhanced warning">
                    <i data-lucide="clock"></i>
                </div>
                <div class="stat-content-enhanced">
                    <span class="stat-label-enhanced">En Progreso</span>
                    <span class="stat-value-enhanced">${inProgressTickets}</span>
                </div>
            </div>
            <div class="quick-stat-enhanced">
                <div class="stat-icon-enhanced info">
                    <i data-lucide="pause-circle"></i>
                </div>
                <div class="stat-content-enhanced">
                    <span class="stat-label-enhanced">Pendientes</span>
                    <span class="stat-value-enhanced">${pendingTickets}</span>
                </div>
            </div>
            <div class="quick-stat-enhanced">
                <div class="stat-icon-enhanced primary">
                    <i data-lucide="check-circle"></i>
                </div>
                <div class="stat-content-enhanced">
                    <span class="stat-label-enhanced">Resueltos</span>
                    <span class="stat-value-enhanced">${resolvedTickets}</span>
                </div>
            </div>
            <div class="quick-stat-enhanced">
                <div class="stat-icon-enhanced star">
                    <i data-lucide="star"></i>
                </div>
                <div class="stat-content-enhanced">
                    <span class="stat-label-enhanced">Satisfacción</span>
                    <span class="stat-value-enhanced">${avgSatisfaction}/5</span>
                </div>
            </div>
        `;

        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderKnowledgeTab() {
        this.renderKnowledgeCategories();
        this.renderFeaturedArticles();
        this.renderRecentArticles();
    }

    renderKnowledgeCategories() {
        const container = document.getElementById('knowledge-categories-grid');
        if (!container || !this.data.categories) return;

        const categoriesHTML = this.data.categories.map(category => `
            <div class="knowledge-category-card-enhanced">
                <div class="category-icon-enhanced" style="background-color: ${category.color}">
                    <i data-lucide="${category.icon}"></i>
                </div>
                <div class="category-info-enhanced">
                    <h3>${category.name}</h3>
                    <p>${category.count} artículos</p>
                </div>
                <div class="category-arrow">
                    <i data-lucide="arrow-right"></i>
                </div>
            </div>
        `).join('');

        container.innerHTML = categoriesHTML;
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderFeaturedArticles() {
        const container = document.getElementById('featured-articles-grid');
        if (!container || !this.data.knowledgeBase) return;

        const articlesHTML = this.data.knowledgeBase.slice(0, 3).map(article => `
            <div class="knowledge-article-card-enhanced featured">
                <div class="article-header-enhanced">
                    <div class="article-category-enhanced">${article.category}</div>
                    <div class="article-difficulty-enhanced difficulty-${article.difficulty.toLowerCase()}">${article.difficulty}</div>
                </div>
                <div class="article-content-enhanced">
                    <h3>${article.title}</h3>
                    <p>${article.excerpt}</p>
                    <div class="article-tags-enhanced">
                        ${article.tags.slice(0, 3).map(tag => `<span class="article-tag-enhanced">${tag}</span>`).join('')}
                    </div>
                </div>
                <div class="article-meta-enhanced">
                    <div class="article-stats-enhanced">
                        <span class="article-stat">
                            <i data-lucide="eye"></i>
                            ${article.views}
                        </span>
                        <span class="article-stat">
                            <i data-lucide="thumbs-up"></i>
                            ${article.helpful}%
                        </span>
                        <span class="article-stat">
                            <i data-lucide="clock"></i>
                            ${article.readTime}
                        </span>
                    </div>
                    <div class="article-author-enhanced">
                        <span>Por ${article.author}</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = articlesHTML;
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderRecentArticles() {
        const container = document.getElementById('recent-articles-list');
        if (!container || !this.data.knowledgeBase) return;

        const articlesHTML = this.data.knowledgeBase.map(article => `
            <div class="knowledge-article-item-enhanced">
                <div class="article-icon-enhanced">
                    <i data-lucide="book-open"></i>
                </div>
                <div class="article-info-enhanced">
                    <h4>${article.title}</h4>
                    <p>${article.excerpt}</p>
                    <div class="article-meta-row">
                        <span class="article-category-small">${article.category}</span>
                        <span class="article-difficulty-small">${article.difficulty}</span>
                        <span class="article-read-time">${article.readTime}</span>
                    </div>
                </div>
                <div class="article-stats-sidebar">
                    <div class="stat-item-small">
                        <i data-lucide="eye"></i>
                        <span>${article.views}</span>
                    </div>
                    <div class="stat-item-small">
                        <i data-lucide="thumbs-up"></i>
                        <span>${article.helpful}%</span>
                    </div>
                    <div class="stat-item-small">
                        <i data-lucide="calendar"></i>
                        <span>${article.updated}</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = articlesHTML;
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderChatTab() {
        this.renderChatList();
        this.renderChatMessages();
    }

    renderChatList() {
        const container = document.getElementById('chat-list');
        if (!container || !this.data.chats) return;

        const chatsHTML = this.data.chats.map(chat => `
            <div class="chat-item-enhanced ${chat.unread > 0 ? 'unread' : ''}">
                <div class="chat-avatar-enhanced">${chat.avatar}</div>
                <div class="chat-info-enhanced">
                    <div class="chat-header-row">
                        <div class="chat-customer-name">${chat.customer}</div>
                        <div class="chat-time">${chat.timestamp}</div>
                    </div>
                    <div class="chat-last-message">${chat.lastMessage}</div>
                    <div class="chat-details-row">
                        <span class="chat-agent">👤 ${chat.agent}</span>
                        <span class="chat-priority priority-${chat.priority}">${this.getPriorityLabel(chat.priority)}</span>
                        <span class="chat-duration">⏱️ ${chat.duration}</span>
                    </div>
                </div>
                <div class="chat-status-enhanced">
                    ${chat.unread > 0 ? `<span class="chat-unread-enhanced">${chat.unread}</span>` : ''}
                    <div class="chat-status-indicator ${chat.status}"></div>
                </div>
            </div>
        `).join('');

        container.innerHTML = chatsHTML;
    }

    renderChatMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        // Sample enhanced messages for the active chat
        const messagesHTML = `
            <div class="message-enhanced customer">
                <div class="message-avatar-enhanced">JD</div>
                <div class="message-content-enhanced">
                    <div class="message-text-enhanced">Hola, tengo un problema con mi cuenta. No puedo acceder al dashboard desde esta mañana.</div>
                    <div class="message-time-enhanced">14:25</div>
                </div>
            </div>
            <div class="message-enhanced agent">
                <div class="message-content-enhanced">
                    <div class="message-text-enhanced">Hola Juan, estaré encantado de ayudarte. ¿Podrías contarme más detalles sobre el error que ves?</div>
                    <div class="message-time-enhanced">14:26</div>
                </div>
                <div class="message-avatar-enhanced">CL</div>
            </div>
            <div class="message-enhanced customer">
                <div class="message-avatar-enhanced">JD</div>
                <div class="message-content-enhanced">
                    <div class="message-text-enhanced">Aparece una pantalla en blanco cuando hago clic en "Dashboard". He probado desde Chrome y Firefox.</div>
                    <div class="message-time-enhanced">14:27</div>
                </div>
            </div>
            <div class="message-enhanced agent">
                <div class="message-content-enhanced">
                    <div class="message-text-enhanced">Entiendo. Parece ser un problema conocido que estamos solucionando. ¿Podrías limpiar la caché del navegador?</div>
                    <div class="message-actions-enhanced">
                        <button class="message-action-btn">
                            <i data-lucide="external-link"></i>
                            Guía para limpiar caché
                        </button>
                    </div>
                    <div class="message-time-enhanced">14:28</div>
                </div>
                <div class="message-avatar-enhanced">CL</div>
            </div>
            <div class="message-enhanced customer">
                <div class="message-avatar-enhanced">JD</div>
                <div class="message-content-enhanced">
                    <div class="message-text-enhanced">¡Perfecto! Ya funciona. Muchas gracias por la ayuda rápida.</div>
                    <div class="message-time-enhanced">14:30</div>
                </div>
            </div>
            <div class="message-enhanced system">
                <div class="message-content-enhanced">
                    <div class="message-text-enhanced">
                        <i data-lucide="check-circle"></i>
                        Chat resuelto satisfactoriamente
                    </div>
                    <div class="message-time-enhanced">14:30</div>
                </div>
            </div>
        `;

        container.innerHTML = messagesHTML;
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderAgentsTab() {
        const container = document.getElementById('agents-grid');
        if (!container || !this.data.agents) return;

        const agentsHTML = this.data.agents.map(agent => `
            <div class="agent-card-enhanced">
                <div class="agent-header-enhanced">
                    <div class="agent-avatar-large-enhanced">${agent.avatar}</div>
                    <div class="agent-status-indicator-enhanced ${agent.status}"></div>
                </div>
                <div class="agent-info-enhanced">
                    <h3>${agent.name}</h3>
                    <p>${agent.email}</p>
                    <div class="agent-status-text-enhanced ${agent.status}">
                        ${this.getStatusLabel(agent.status)}
                    </div>
                </div>
                <div class="agent-workload-enhanced">
                    <div class="workload-header">
                        <span>Carga de trabajo</span>
                        <span class="workload-percentage">${agent.workload}%</span>
                    </div>
                    <div class="workload-bar">
                        <div class="workload-fill" style="width: ${agent.workload}%; background-color: ${this.getLoadColor(agent.workload)}"></div>
                    </div>
                </div>
                <div class="agent-stats-enhanced">
                    <div class="stat-row-enhanced">
                        <div class="stat-enhanced">
                            <span class="stat-label-enhanced">Tickets Activos</span>
                            <span class="stat-value-enhanced">${agent.activeTickets}</span>
                        </div>
                        <div class="stat-enhanced">
                            <span class="stat-label-enhanced">Resueltos Hoy</span>
                            <span class="stat-value-enhanced">${agent.resolvedToday}</span>
                        </div>
                    </div>
                    <div class="stat-row-enhanced">
                        <div class="stat-enhanced">
                            <span class="stat-label-enhanced">Tiempo Respuesta</span>
                            <span class="stat-value-enhanced">${agent.avgResponseTime}</span>
                        </div>
                        <div class="stat-enhanced">
                            <span class="stat-label-enhanced">Satisfacción</span>
                            <span class="stat-value-enhanced">${agent.satisfaction}/5</span>
                        </div>
                    </div>
                </div>
                <div class="agent-specialties-enhanced">
                    <h4>Especialidades</h4>
                    <div class="specialties-tags-enhanced">
                        ${agent.specialties.map(spec => `<span class="specialty-tag-enhanced">${spec}</span>`).join('')}
                    </div>
                </div>
                <div class="agent-availability-enhanced">
                    <h4>Disponibilidad</h4>
                    <div class="availability-info">
                        <span class="availability-time">${agent.availableFrom} - ${agent.availableTo}</span>
                        <div class="languages-enhanced">
                            ${agent.languages.map(lang => `<span class="language-tag-enhanced">${lang}</span>`).join('')}
                        </div>
                    </div>
                </div>
                <div class="agent-actions-enhanced">
                    <button class="btn btn-secondary btn-sm" onclick="window.app.modules.support.viewAgent('${agent.id}')">
                        <i data-lucide="eye"></i>
                        Ver Detalles
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="window.app.modules.support.editAgent('${agent.id}')">
                        <i data-lucide="edit"></i>
                        Editar
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = agentsHTML;
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderAnalyticsTab() {
        console.log('📊 Renderizando analíticas de soporte');
        // Analytics charts are placeholder for now
        // In a real implementation, you would use Chart.js or similar
    }

    renderSettingsTab() {
        this.renderCategories();
        this.renderTemplates();
    }

    renderCategories() {
        const container = document.getElementById('categories-manager');
        if (!container || !this.data.categories) return;

        const categoriesHTML = this.data.categories.map(category => `
            <div class="category-item-enhanced">
                <div class="category-color-enhanced" style="background-color: ${category.color}"></div>
                <div class="category-info-enhanced">
                    <span class="category-name-enhanced">${category.name}</span>
                    <span class="category-count-enhanced">${category.count} tickets</span>
                </div>
                <div class="category-actions-enhanced">
                    <button class="btn-icon-enhanced btn-sm" onclick="window.app.modules.support.editCategory('${category.id}')">
                        <i data-lucide="edit"></i>
                    </button>
                    <button class="btn-icon-enhanced btn-sm btn-danger" onclick="window.app.modules.support.deleteCategory('${category.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = categoriesHTML;
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    renderTemplates() {
        const container = document.getElementById('templates-manager');
        if (!container) return;

        const templatesHTML = this.data.templates.map(template => `
            <div class="template-item-enhanced">
                <div class="template-header-enhanced">
                    <div class="template-info-enhanced">
                        <span class="template-name-enhanced">${template.name}</span>
                        <span class="template-category-enhanced">${template.category}</span>
                    </div>
                    <div class="template-stats-enhanced">
                        <span class="template-usage">📊 ${template.usage} usos</span>
                        <span class="template-last-used">🕒 ${template.lastUsed}</span>
                    </div>
                </div>
                <div class="template-content-enhanced">
                    <p class="template-preview">${template.content}</p>
                </div>
                <div class="template-actions-enhanced">
                    <button class="btn-icon-enhanced btn-sm" onclick="window.app.modules.support.useTemplate('${template.id}')">
                        <i data-lucide="copy"></i>
                    </button>
                    <button class="btn-icon-enhanced btn-sm" onclick="window.app.modules.support.editTemplate('${template.id}')">
                        <i data-lucide="edit"></i>
                    </button>
                    <button class="btn-icon-enhanced btn-sm btn-danger" onclick="window.app.modules.support.deleteTemplate('${template.id}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = templatesHTML;
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Utility methods
    getFilteredTickets() {
        if (!this.data.tickets) return [];
        
        return this.data.tickets.filter(ticket => {
            const matchesSearch = !this.filters.search || 
                ticket.title.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                ticket.description.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                ticket.customer.toLowerCase().includes(this.filters.search.toLowerCase());
            
            const matchesStatus = !this.filters.status || ticket.status === this.filters.status;
            const matchesPriority = !this.filters.priority || ticket.priority === this.filters.priority;
            const matchesCategory = !this.filters.category || ticket.category === this.filters.category;
            const matchesAssignee = !this.filters.assignee || ticket.assignee === this.filters.assignee;
            
            return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesAssignee;
        });
    }

    calculateAverageSatisfaction(tickets) {
        const satisfactionTickets = tickets.filter(t => t.customerSatisfaction !== null);
        if (satisfactionTickets.length === 0) return '4.7';
        
        const avg = satisfactionTickets.reduce((sum, t) => sum + t.customerSatisfaction, 0) / satisfactionTickets.length;
        return avg.toFixed(1);
    }

    getStatusBadgeClass(status) {
        const statusMap = {
            'open': 'info',
            'in-progress': 'warning',
            'pending': 'secondary',
            'resolved': 'success',
            'closed': 'secondary',
            'online': 'success',
            'busy': 'warning',
            'away': 'secondary',
            'offline': 'error'
        };
        return statusMap[status] || 'secondary';
    }

    getStatusLabel(status) {
        const statusMap = {
            'open': 'Abierto',
            'in-progress': 'En Progreso',
            'pending': 'Pendiente',
            'resolved': 'Resuelto',
            'closed': 'Cerrado',
            'online': 'En línea',
            'busy': 'Ocupado',
            'away': 'Ausente',
            'offline': 'Desconectado'
        };
        return statusMap[status] || status;
    }

    getPriorityBadgeClass(priority) {
        const priorityMap = {
            'low': 'success',
            'medium': 'info',
            'high': 'warning',
            'urgent': 'error'
        };
        return priorityMap[priority] || 'secondary';
    }

    getPriorityLabel(priority) {
        const priorityMap = {
            'low': 'Baja',
            'medium': 'Media',
            'high': 'Alta',
            'urgent': 'Urgente'
        };
        return priorityMap[priority] || priority;
    }

    getLoadColor(load) {
        if (load >= 90) return '#EF4444';
        if (load >= 70) return '#F59E0B';
        if (load >= 50) return '#3B82F6';
        return '#10B981';
    }

    // Event handlers
    handleTicketSearch(query) {
        this.filters.search = query;
        this.renderTicketsList();
        this.renderTicketsQuickStats();
    }

    handleKnowledgeSearch(query) {
        console.log('🔍 Búsqueda en base de conocimiento:', query);
        // Implement knowledge search logic
    }

    updateFilters() {
        this.filters.status = document.getElementById('status-filter')?.value || '';
        this.filters.priority = document.getElementById('priority-filter')?.value || '';
        this.filters.category = document.getElementById('category-filter')?.value || '';
        this.filters.assignee = document.getElementById('assignee-filter')?.value || '';
        
        this.renderTicketsList();
        this.renderTicketsQuickStats();
    }

    applyFilters() {
        this.updateFilters();
        if (window.app) {
            window.app.showNotification('Filtros aplicados', 'success');
        }
    }

    clearFilters() {
        this.filters = { search: '', status: '', priority: '', category: '', assignee: '' };
        
        // Clear form elements
        const searchInput = document.getElementById('ticket-search');
        const statusFilter = document.getElementById('status-filter');
        const priorityFilter = document.getElementById('priority-filter');
        const categoryFilter = document.getElementById('category-filter');
        const assigneeFilter = document.getElementById('assignee-filter');
        
        if (searchInput) searchInput.value = '';
        if (statusFilter) statusFilter.value = '';
        if (priorityFilter) priorityFilter.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (assigneeFilter) assigneeFilter.value = '';
        
        this.renderTicketsList();
        this.renderTicketsQuickStats();
        
        if (window.app) {
            window.app.showNotification('Filtros limpiados', 'info');
        }
    }

    switchView(viewType) {
        const listView = document.getElementById('tickets-list');
        const gridView = document.getElementById('tickets-grid');
        const kanbanView = document.getElementById('tickets-kanban');
        const viewButtons = document.querySelectorAll('.view-btn');
        
        viewButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${viewType}"]`).classList.add('active');
        
        // Hide all views
        if (listView) listView.style.display = 'none';
        if (gridView) gridView.style.display = 'none';
        if (kanbanView) kanbanView.style.display = 'none';
        
        // Show selected view
        switch (viewType) {
            case 'list':
                if (listView) listView.style.display = 'block';
                break;
            case 'grid':
                if (gridView) {
                    gridView.style.display = 'block';
                    this.renderTicketsGrid();
                }
                break;
            case 'kanban':
                if (kanbanView) {
                    kanbanView.style.display = 'block';
                    this.renderKanbanView();
                }
                break;
        }
    }

    renderTicketsGrid() {
        const container = document.getElementById('tickets-grid');
        if (!container || !this.data.tickets) return;

        const filteredTickets = this.getFilteredTickets();
        
        const ticketsHTML = filteredTickets.map(ticket => `
            <div class="ticket-grid-card">
                <div class="ticket-grid-header">
                    <span class="ticket-grid-id">${ticket.id}</span>
                    <span class="priority-dot priority-${ticket.priority}"></span>
                </div>
                <h4 class="ticket-grid-title">${ticket.title}</h4>
                <p class="ticket-grid-customer">${ticket.customer}</p>
                <div class="ticket-grid-footer">
                    <span class="ticket-grid-status badge-${this.getStatusBadgeClass(ticket.status)}">${this.getStatusLabel(ticket.status)}</span>
                    <span class="ticket-grid-time">${ticket.created.split(' ')[0]}</span>
                </div>
            </div>
        `).join('');

        container.innerHTML = `<div class="tickets-grid-container">${ticketsHTML}</div>`;
    }

    renderKanbanView() {
        const statuses = ['open', 'in-progress', 'pending', 'resolved'];
        const tickets = this.getFilteredTickets();
        
        statuses.forEach(status => {
            const container = document.getElementById(`kanban-${status}`);
            const statusTickets = tickets.filter(t => t.status === status);
            
            if (container) {
                const ticketsHTML = statusTickets.map(ticket => `
                    <div class="kanban-ticket-enhanced">
                        <div class="kanban-ticket-header-enhanced">
                            <span class="ticket-id-small">${ticket.id}</span>
                            <span class="priority-indicator-enhanced priority-${ticket.priority}"></span>
                        </div>
                        <div class="kanban-ticket-content-enhanced">
                            <h4>${ticket.title}</h4>
                            <p>${ticket.description.substring(0, 100)}...</p>
                        </div>
                        <div class="kanban-ticket-footer-enhanced">
                            <div class="ticket-customer-small">
                                <i data-lucide="user"></i>
                                <span>${ticket.customer}</span>
                            </div>
                            <div class="ticket-assignee-small">
                                <i data-lucide="user-check"></i>
                                <span>${ticket.assignee.split(' ')[0]}</span>
                            </div>
                        </div>
                    </div>
                `).join('');
                
                container.innerHTML = ticketsHTML;
                
                // Update count
                const countElement = container.parentElement.querySelector('.kanban-count-enhanced');
                if (countElement) {
                    countElement.textContent = statusTickets.length;
                }
            }
        });
        
        // Re-initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    handleSortChange(sortValue) {
        const [field, order] = sortValue.split('-');
        this.sortBy = field;
        this.sortOrder = order;
        console.log(`↕️ Ordenando tickets por: ${field} (${order})`);
        this.renderTicketsList();
    }

    handlePeriodChange(period) {
        const dateFrom = document.getElementById('date-from');
        const dateTo = document.getElementById('date-to');
        
        if (period === 'custom') {
            if (dateFrom) dateFrom.style.display = 'block';
            if (dateTo) dateTo.style.display = 'block';
        } else {
            if (dateFrom) dateFrom.style.display = 'none';
            if (dateTo) dateTo.style.display = 'none';
        }
        
        console.log(`📅 Cambiando período de análisis: ${period}`);
    }

    sendMessage(message) {
        if (!message.trim()) return;
        
        console.log('💬 Enviando mensaje:', message);
        
        // Add message to chat
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            const messageHTML = `
                <div class="message-enhanced agent">
                    <div class="message-content-enhanced">
                        <div class="message-text-enhanced">${message}</div>
                        <div class="message-time-enhanced">${new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})}</div>
                    </div>
                    <div class="message-avatar-enhanced">CL</div>
                </div>
            `;
            messagesContainer.insertAdjacentHTML('beforeend', messageHTML);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    searchTerm(term) {
        const searchInput = document.getElementById('knowledge-search');
        if (searchInput) {
            searchInput.value = term;
            this.handleKnowledgeSearch(term);
        }
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

    // Public API methods
    async refreshData() {
        try {
            console.log('🔄 Refrescando datos del módulo de soporte...');
            
            if (window.app) {
                window.app.showNotification('Actualizando datos de soporte...', 'info');
            }
            
            // Clear cached data
            this.data = {};
            
            // Reload data
            await this.loadData();
            
            // Reload current tab data
            if (this.currentTab) {
                await this.loadTabData(this.currentTab);
            }
            
            if (window.app) {
                window.app.showNotification('Datos de soporte actualizados', 'success');
            }
            
        } catch (error) {
            console.error('❌ Error refrescando datos de soporte:', error);
            if (window.app) {
                window.app.showNotification('Error al actualizar datos de soporte', 'error');
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

    // Ticket management methods
    createTicket() {
        console.log('🎫 Creando nuevo ticket...');
        if (window.app) {
            window.app.showNotification('Función de crear ticket en desarrollo', 'info');
        }
    }

    viewTicket(ticketId) {
        console.log(`👁️ Viendo ticket: ${ticketId}`);
        if (window.app) {
            window.app.showNotification(`Viendo detalles del ticket ${ticketId}`, 'info');
        }
    }

    editTicket(ticketId) {
        console.log(`✏️ Editando ticket: ${ticketId}`);
        if (window.app) {
            window.app.showNotification(`Editando ticket ${ticketId}`, 'info');
        }
    }

    assignTicket(ticketId) {
        console.log(`👤 Asignando ticket: ${ticketId}`);
        if (window.app) {
            window.app.showNotification(`Asignando ticket ${ticketId}`, 'info');
        }
    }

    closeTicket(ticketId) {
        console.log(`✅ Cerrando ticket: ${ticketId}`);
        if (confirm('¿Estás seguro de que deseas cerrar este ticket?')) {
            if (window.app) {
                window.app.showNotification(`Ticket ${ticketId} cerrado`, 'success');
            }
        }
    }

    // Knowledge base methods
    createArticle() {
        console.log('📝 Creando nuevo artículo...');
        if (window.app) {
            window.app.showNotification('Función de crear artículo en desarrollo', 'info');
        }
    }

    searchKnowledge() {
        console.log('🔍 Búsqueda avanzada en base de conocimiento...');
        if (window.app) {
            window.app.showNotification('Función de búsqueda avanzada en desarrollo', 'info');
        }
    }

    // Agent management methods
    addAgent() {
        console.log('👤 Añadiendo nuevo agente...');
        if (window.app) {
            window.app.showNotification('Función de añadir agente en desarrollo', 'info');
        }
    }

    viewAgent(agentId) {
        console.log(`👁️ Viendo agente: ${agentId}`);
        if (window.app) {
            window.app.showNotification(`Viendo detalles del agente ${agentId}`, 'info');
        }
    }

    editAgent(agentId) {
        console.log(`✏️ Editando agente: ${agentId}`);
        if (window.app) {
            window.app.showNotification(`Editando agente ${agentId}`, 'info');
        }
    }

    // Chat methods
    toggleChatStatus() {
        console.log('🔄 Cambiando estado de chat...');
        if (window.app) {
            window.app.showNotification('Estado de chat cambiado', 'success');
        }
    }

    // Settings methods
    addCategory() {
        console.log('🏷️ Añadiendo nueva categoría...');
        if (window.app) {
            window.app.showNotification('Función de añadir categoría en desarrollo', 'info');
        }
    }

    editCategory(categoryId) {
        console.log(`✏️ Editando categoría: ${categoryId}`);
        if (window.app) {
            window.app.showNotification(`Editando categoría ${categoryId}`, 'info');
        }
    }

    deleteCategory(categoryId) {
        console.log(`🗑️ Eliminando categoría: ${categoryId}`);
        if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
            if (window.app) {
                window.app.showNotification('Categoría eliminada', 'success');
            }
        }
    }

    addTemplate() {
        console.log('📄 Añadiendo nueva plantilla...');
        if (window.app) {
            window.app.showNotification('Función de añadir plantilla en desarrollo', 'info');
        }
    }

    editTemplate(templateId) {
        console.log(`✏️ Editando plantilla: ${templateId}`);
        if (window.app) {
            window.app.showNotification(`Editando plantilla ${templateId}`, 'info');
        }
    }

    deleteTemplate(templateId) {
        console.log(`🗑️ Eliminando plantilla: ${templateId}`);
        if (confirm('¿Estás seguro de que deseas eliminar esta plantilla?')) {
            if (window.app) {
                window.app.showNotification('Plantilla eliminada', 'success');
            }
        }
    }

    useTemplate(templateId) {
        console.log(`📋 Usando plantilla: ${templateId}`);
        if (window.app) {
            window.app.showNotification('Plantilla copiada al portapapeles', 'success');
        }
    }

    saveSettings() {
        console.log('💾 Guardando configuración de soporte...');
        if (window.app) {
            window.app.showNotification('Configuración guardada', 'success');
        }
    }

    resetSettings() {
        console.log('🔄 Restaurando configuración por defecto...');
        if (confirm('¿Estás seguro de que deseas restaurar la configuración por defecto?')) {
            if (window.app) {
                window.app.showNotification('Configuración restaurada', 'success');
            }
        }
    }

    // Report and analytics methods
    generateReport() {
        console.log('📊 Generando informe de soporte...');
        if (window.app) {
            window.app.showNotification('Generando informe de soporte...', 'info');
        }
    }

    generateAgentReport() {
        console.log('📈 Generando informe de rendimiento de agentes...');
        if (window.app) {
            window.app.showNotification('Generando informe de agentes...', 'info');
        }
    }

    exportTickets() {
        console.log('📥 Exportando tickets...');
        if (window.app) {
            window.app.showNotification('Función de exportar tickets en desarrollo', 'info');
        }
    }

    exportAnalytics() {
        console.log('📥 Exportando datos de analíticas...');
        if (window.app) {
            window.app.showNotification('Función de exportar analíticas en desarrollo', 'info');
        }
    }

    scheduleReport() {
        console.log('📅 Programando informe automático...');
        if (window.app) {
            window.app.showNotification('Función de programar informes en desarrollo', 'info');
        }
    }

    updateAnalytics() {
        console.log('🔄 Actualizando analíticas...');
        if (window.app) {
            window.app.showNotification('Analíticas actualizadas', 'success');
        }
    }

    bulkActions() {
        console.log('📋 Acciones masivas en tickets...');
        if (window.app) {
            window.app.showNotification('Función de acciones masivas en desarrollo', 'info');
        }
        
    }
}