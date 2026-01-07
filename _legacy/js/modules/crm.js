// ===== CRM ENTERPRISE SUITE =====

class CRMModule {
    constructor() {
        this.currentTab = 'dashboard';
        this.currentView = 'overview';
        this.filters = {
            dateRange: '30d',
            region: 'all',
            team: 'all',
            status: 'all'
        };
        this.data = {
            leads: [],
            contacts: [],
            companies: [],
            deals: [],
            activities: [],
            analytics: {}
        };
        this.charts = {};
    }

    async render(container) {
    container.innerHTML = this.renderFallbackCRM();
    this.initializeCRM();
}

    renderFallbackCRM() {
        return `
            <div class="module-content" id="crm-module">
                <!-- CRM Header -->
            <div class="crm-header" style="background: linear-gradient(135deg, rgb(15, 182, 127) 0%, #069A6C 100%);
                                padding: var(--space-2xl); border-radius: var(--radius-lg);
                                color: white; margin-bottom: var(--space-2xl);">
    <div class="flex items-center justify-between">
        <div>
            <h1 style="font-size: 2.5rem; font-weight: 800; margin-bottom: var(--space-sm);">
                MEP-Projects CRM
            </h1>
            <p style="font-size: var(--font-size-lg); opacity: 0.9;">
                Centro de comando de relaciones con clientes y análisis de ventas
            </p>
        </div>
        <div class="flex" style="gap: 2rem;">
            <div class="text-center">
                <div style="font-size: 2rem; font-weight: 800;">€1.5M</div>
                <div style="opacity: 0.8;">Ingresos YTD</div>
            </div>
            <div class="text-center">
                <div style="font-size: 2rem; font-weight: 800;">26</div>
                <div style="opacity: 0.8;">Contactos activos</div>
            </div>
            <div class="text-center">
                <div style="font-size: 2rem; font-weight: 800;">94%</div>
                <div style="opacity: 0.8;">Progreso del objetivo</div>
            </div>
        </div>
    </div>
</div>


                <!-- Navigation Tabs -->
                <div class="crm-nav" style="display: flex; gap: var(--space-md); margin-bottom: var(--space-2xl); 
                                        border-bottom: 2px solid var(--border-primary);">
                    <button class="crm-tab active" data-tab="dashboard" onclick="crmModule.switchTab('dashboard')">
                        <i data-lucide="layout-dashboard"></i>
                        Inicio
                    </button>
                    <button class="crm-tab" data-tab="analytics" onclick="crmModule.switchTab('analytics')">
                        <i data-lucide="bar-chart-3"></i>
                        Analíticas
                    </button>
                    <button class="crm-tab" data-tab="pipeline" onclick="crmModule.switchTab('pipeline')">
                        <i data-lucide="trending-up"></i>
                        Proceso de contrataciones
                    </button>
                    <button class="crm-tab" data-tab="leads" onclick="crmModule.switchTab('leads')">
                        <i data-lucide="users"></i>
                        Clientes potenciales
                    </button>
                    <button class="crm-tab" data-tab="contacts" onclick="crmModule.switchTab('contacts')">
                        <i data-lucide="user-check"></i>
                        Contactos
                    </button>
                    <button class="crm-tab" data-tab="companies" onclick="crmModule.switchTab('companies')">
                        <i data-lucide="building"></i>
                        Empresas
                    </button>
                    <button class="crm-tab" data-tab="deals" onclick="crmModule.switchTab('deals')">
                        <i data-lucide="handshake"></i>
                        Ofertas
                    </button>
                    <button class="crm-tab" data-tab="reports" onclick="crmModule.switchTab('reports')">
                        <i data-lucide="file-text"></i>
                        Informes
                    </button>
                </div>

                <!-- Tab Contents -->
                <div class="crm-content">
                    ${this.renderDashboardTab()}
                    ${this.renderAnalyticsTab()}
                    ${this.renderPipelineTab()}
                    ${this.renderLeadsTab()}
                    ${this.renderContactsTab()}
                    ${this.renderCompaniesTab()}
                    ${this.renderDealsTab()}
                    ${this.renderReportsTab()}
                </div>
            </div>

            <!-- Modals -->
            ${this.renderModals()}

            <style>
                .crm-tab {
                    display: flex;
                    align-items: center;
                    gap: var(--space-sm);
                    padding: var(--space-lg) var(--space-xl);
                    background: transparent;
                    border: none;
                    color: var(--text-secondary);
                    font-weight: 600;
                    cursor: pointer;
                    border-bottom: 3px solid transparent;
                    transition: all 0.2s;
                }

                .crm-tab:hover {
                    color: var(--text-primary);
                    background: var(--bg-secondary);
                }

                .crm-tab.active {
                    color: var(--mep-primary-600);
                    border-bottom-color: var(--mep-primary-500);
                    background: var(--mep-primary-50);
                }

                .crm-tab-content {
                    display: none;
                }

                .crm-tab-content.active {
                    display: block;
                    animation: fadeIn 0.3s ease-in-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .kpi-card {
                    background: white;
                    border-radius: var(--radius-lg);
                    padding: var(--space-xl);
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-secondary);
                    transition: all 0.2s;
                }

                .kpi-card:hover {
                    transform: translateY(-2px);
                    box-shadow: var(--shadow-xl);
                }

                .chart-container {
                    background: white;
                    border-radius: var(--radius-lg);
                    padding: var(--space-xl);
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-secondary);
                    min-height: 400px;
                    position: relative;
                }

                .pipeline-stage {
                    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                    border-radius: var(--radius-lg);
                    padding: var(--space-lg);
                    margin-bottom: var(--space-md);
                    border-left: 4px solid var(--mep-primary-500);
                    transition: all 0.2s;
                }

                .pipeline-stage:hover {
                    transform: translateX(5px);
                    box-shadow: var(--shadow-lg);
                }

                .data-table {
                    background: white;
                    border-radius: var(--radius-lg);
                    overflow: hidden;
                    box-shadow: var(--shadow-lg);
                    border: 1px solid var(--border-secondary);
                }

                .table-header {
                    background: var(--bg-tertiary);
                    padding: var(--space-lg);
                    border-bottom: 1px solid var(--border-secondary);
                    font-weight: 600;
                }

                .filter-bar {
                    background: var(--bg-secondary);
                    padding: var(--space-lg);
                    border-radius: var(--radius-lg);
                    margin-bottom: var(--space-xl);
                    display: flex;
                    gap: var(--space-lg);
                    align-items: center;
                    flex-wrap: wrap;
                }

                .metric-trend {
                    display: flex;
                    align-items: center;
                    gap: var(--space-xs);
                    font-size: var(--font-size-sm);
                    font-weight: 600;
                }

                .metric-trend.positive { color: var(--mep-success); }
                .metric-trend.negative { color: var(--mep-error); }
                .metric-trend.neutral { color: var(--text-secondary); }
            </style>
        `;
    }

    renderDashboardTab() {
        return `
            <div class="crm-tab-content active" id="crm-dashboard">
                <!-- Quick Filters -->
                <div class="filter-bar">
                    <div class="flex items-center gap-4">
                        <label style="font-weight: 600;">Filtros:</label>
                        <select class="form-select" onchange="crmModule.updateFilter('dateRange', this.value)">
                            <option value="7d">Últimos 7 días</option>
                            <option value="30d" selected>Últimos 30 días</option>
                            <option value="90d">Últimos 90 días</option>
                            <option value="1y">Último año</option>
                        </select>
                        <select class="form-select" onchange="crmModule.updateFilter('region', this.value)">
                            <option value="all">Todas las regiones</option>
                            <option value="north">Norte</option>
                            <option value="south">Sur</option>
                            <option value="east">Este</option>
                            <option value="west">Oeste</option>
                        </select>
                        <select class="form-select" onchange="crmModule.updateFilter('team', this.value)">
                            <option value="all">Todos los equipos</option>
                            <option value="sales">Ventas</option>
                            <option value="marketing">Marketing</option>
                            <option value="support">Soporte</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" onclick="crmModule.exportDashboard()">
                        <i data-lucide="download"></i>
                        Exportar resumen
                    </button>
                </div>

                <!-- KPI Grid -->
                <div class="grid grid-cols-4 gap-6 mb-8">
                    ${this.renderKPICards()}
                </div>

                <!-- Main Dashboard Grid -->
                <div class="grid grid-cols-3 gap-6">
                    <!-- Revenue Chart -->
                    <div class="col-span-2">
                        <div class="chart-container">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-xl font-bold">Evolución de ingresos</h3>
                                <div class="flex gap-2">
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.switchChartView('revenue', 'monthly')">Mensual</button>
                                    <button class="btn btn-sm btn-ghost active" onclick="crmModule.switchChartView('revenue', 'weekly')">Semanal</button>
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.switchChartView('revenue', 'daily')">Diario</button>
                                </div>
                            </div>
                            <div id="revenue-chart" style="height: 350px;">${this.renderRevenueChart()}</div>
                        </div>
                    </div>

                    <!-- Pipeline Overview -->
                    <div>
                        <div class="chart-container">
                            <h3 class="text-xl font-bold mb-4"> Estado de proceso de contrataciones</h3><br>
                            <div id="pipeline-chart" style="height: 350px;">${this.renderPipelineChart()}</div>
                        </div>
                    </div>

                    <!-- Conversion Funnel -->
                    <div>
                        <div class="chart-container">
                            <h3 class="text-xl font-bold mb-4">Embudo de Conversión</h3>
                            <div id="funnel-chart" style="height: 350px;">${this.renderFunnelChart()}</div>
                        </div>
                    </div>

                    <!-- Team Performance -->
                    <div>
                        <div class="chart-container">
                            <h3 class="text-xl font-bold mb-4">Rendimiento por Equipo</h3>
                            <div id="team-chart" style="height: 350px;">${this.renderTeamChart()}</div>
                        </div>
                    </div>

                    <!-- Recent Activities -->
                    <div>
                        <div class="chart-container">
                            <h3 class="text-xl font-bold mb-4">Actividad Reciente</h3>
                            <div style="height: 350px; overflow-y: auto;">${this.renderRecentActivities()}</div>
                        </div>
                    </div>
                </div>

                <!-- Quick Stats Grid -->
                <div class="grid grid-cols-2 gap-6 mt-8">
                    <!-- Top Performers -->
                    <div class="data-table">
                        <div class="table-header">
                            <h3 class="font-bold">Mejores resultados del Mes</h3>
                        </div>
                        <div class="p-4">
                            ${this.renderTopPerformers()}
                        </div>
                    </div>

                    <!-- Hot Leads -->
                    <div class="data-table">
                        <div class="table-header">
                            <h3 class="font-bold">Clientes potenciales calientes</h3>
                        </div>
                        <div class="p-4">
                            ${this.renderHotLeads()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAnalyticsTab() {
        return `
            <div class="crm-tab-content" id="crm-analytics">
                <!-- Analytics Header -->
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">Centro de Analytics Avanzado</h2>
                    <div class="flex gap-4">
                        <button class="btn btn-secondary" onclick="crmModule.scheduleReport()">
                            <i data-lucide="calendar"></i>
                            Programar Reporte
                        </button>
                        <button class="btn btn-primary" onclick="crmModule.customAnalysis()">
                            <i data-lucide="brain"></i>
                            Análisis Personalizado
                        </button>
                    </div>
                </div>

                <!-- Analytics Navigation -->
                <div class="flex gap-4 mb-6 border-b">
                    <button class="btn btn-ghost active" onclick="crmModule.switchAnalyticsView('overview')">Overview</button>
                    <button class="btn btn-ghost" onclick="crmModule.switchAnalyticsView('sales')">Análisis de Ventas</button>
                    <button class="btn btn-ghost" onclick="crmModule.switchAnalyticsView('marketing')">Marketing ROI</button>
                    <button class="btn btn-ghost" onclick="crmModule.switchAnalyticsView('forecasting')">Forecasting</button>
                    <button class="btn btn-ghost" onclick="crmModule.switchAnalyticsView('competitive')">Análisis Competitivo</button>
                </div>

                <!-- Analytics Content -->
                <div class="analytics-views">
                    <!-- Overview Analytics -->
                    <div class="analytics-view active" id="analytics-overview">
                        <div class="grid grid-cols-2 gap-6 mb-8">
                            <!-- Revenue Analytics -->
                            <div class="chart-container">
                                <h3 class="text-xl font-bold mb-4">Análisis de Revenue Multidimensional</h3>
                                <div style="height: 400px;">${this.renderRevenueAnalytics()}</div>
                            </div>

                            <!-- Customer Segmentation -->
                            <div class="chart-container">
                                <h3 class="text-xl font-bold mb-4">Segmentación de Clientes</h3>
                                <div style="height: 400px;">${this.renderCustomerSegmentation()}</div>
                            </div>
                        </div>

                        <!-- Advanced Metrics Grid -->
                        <div class="grid grid-cols-4 gap-6 mb-8">
                            ${this.renderAdvancedMetrics()}
                        </div>

                        <!-- Cohort Analysis -->
                        <div class="chart-container mb-6">
                            <h3 class="text-xl font-bold mb-4">Análisis de Cohortes</h3>
                            <div style="height: 300px;">${this.renderCohortAnalysis()}</div>
                        </div>
                    </div>

                    <!-- Sales Analytics -->
                    <div class="analytics-view" id="analytics-sales">
                        <div class="grid grid-cols-2 gap-6">
                            <div class="chart-container">
                                <h3 class="text-xl font-bold mb-4">Análisis de Ciclo de Venta</h3>
                                <div style="height: 400px;">${this.renderSalesCycleAnalysis()}</div>
                            </div>
                            <div class="chart-container">
                                <h3 class="text-xl font-bold mb-4">Win Rate por Segmento</h3>
                                <div style="height: 400px;">${this.renderWinRateAnalysis()}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Other analytics views... -->
                </div>
            </div>
        `;
    }

    renderPipelineTab() {
        return `
            <div class="crm-tab-content" id="crm-pipeline">
                <!-- Pipeline Header -->
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-2xl font-bold">Pipeline Management</h2>
                        <p class="text-secondary">Gestión visual del pipeline de ventas</p>
                    </div>
                    <div class="flex gap-4">
                        <button class="btn btn-secondary" onclick="crmModule.pipelineSettings()">
                            <i data-lucide="settings"></i>
                            Configurar Pipeline
                        </button>
                        <button class="btn btn-primary" onclick="crmModule.forecastAnalysis()">
                            <i data-lucide="trending-up"></i>
                            Análisis de Forecast
                        </button>
                    </div>
                </div>

                <!-- Pipeline Metrics -->
                <div class="grid grid-cols-5 gap-4 mb-8">
                    ${this.renderPipelineMetrics()}
                </div>

                <!-- Pipeline Visualization -->
                <div class="chart-container mb-8">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold">Pipeline Visual</h3>
                        <div class="flex gap-2">
                            <button class="btn btn-sm btn-ghost active" onclick="crmModule.switchPipelineView('kanban')">Kanban</button>
                            <button class="btn btn-sm btn-ghost" onclick="crmModule.switchPipelineView('funnel')">Funnel</button>
                            <button class="btn btn-sm btn-ghost" onclick="crmModule.switchPipelineView('timeline')">Timeline</button>
                        </div>
                    </div>
                    <div id="pipeline-visual" style="min-height: 600px;">${this.renderPipelineKanban()}</div>
                </div>

                <!-- Pipeline Analytics -->
                <div class="grid grid-cols-2 gap-6">
                    <div class="chart-container">
                        <h3 class="text-xl font-bold mb-4">Velocity Analysis</h3>
                        <div style="height: 300px;">${this.renderVelocityAnalysis()}</div>
                    </div>
                    <div class="chart-container">
                        <h3 class="text-xl font-bold mb-4">Stage Conversion Rates</h3>
                        <div style="height: 300px;">${this.renderStageConversion()}</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderLeadsTab() {
        return `
            <div class="crm-tab-content" id="crm-leads">
                <!-- Leads Header -->
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">Gestión de Leads</h2>
                    <div class="flex gap-4">
                        <button class="btn btn-secondary" onclick="crmModule.importLeads()">
                            <i data-lucide="upload"></i>
                            Importar Leads
                        </button>
                        <button class="btn btn-secondary" onclick="crmModule.leadScoring()">
                            <i data-lucide="target"></i>
                            Lead Scoring
                        </button>
                        <button class="btn btn-primary" onclick="crmModule.showNewLeadModal()">
                            <i data-lucide="plus"></i>
                            Nuevo Lead
                        </button>
                    </div>
                </div>

                <!-- Lead Filters -->
                <div class="filter-bar mb-6">
                    <div class="flex items-center gap-4 flex-wrap">
                        <input type="text" placeholder="Buscar leads..." class="form-input" style="min-width: 200px;">
                        <select class="form-select">
                            <option>Todos los estados</option>
                            <option>Nuevo</option>
                            <option>Contactado</option>
                            <option>Calificado</option>
                            <option>No calificado</option>
                        </select>
                        <select class="form-select">
                            <option>Todas las fuentes</option>
                            <option>Website</option>
                            <option>Referido</option>
                            <option>Publicidad</option>
                            <option>Evento</option>
                        </select>
                        <select class="form-select">
                            <option>Todos los asignados</option>
                            <option>Beatriz Tudela</option>
                            <option><Francisco Gallego/option>
                            <option>Mari Carmen Lay</option>
                        </select>
                        <button class="btn btn-ghost">
                            <i data-lucide="filter"></i>
                            Filtros Avanzados
                        </button>
                    </div>
                </div>

                <!-- Leads Overview -->
                <div class="grid grid-cols-4 gap-4 mb-8">
                    ${this.renderLeadMetrics()}
                </div>

                <!-- Leads Table -->
                <div class="data-table">
                    <div class="table-header">
                        <div class="flex justify-between items-center">
                            <h3 class="font-bold">Lista de Leads</h3>
                            <div class="flex gap-2">
                                <button class="btn btn-sm btn-ghost active" onclick="crmModule.switchLeadView('table')">
                                    <i data-lucide="table"></i>
                                </button>
                                <button class="btn btn-sm btn-ghost" onclick="crmModule.switchLeadView('cards')">
                                    <i data-lucide="grid"></i>
                                </button>
                                <button class="btn btn-sm btn-ghost" onclick="crmModule.switchLeadView('map')">
                                    <i data-lucide="map"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div style="overflow-x: auto;">
                        ${this.renderLeadsTable()}
                    </div>
                </div>
            </div>
        `;
    }

    renderContactsTab() {
        return `
            <div class="crm-tab-content" id="crm-contacts">
                <!-- Contacts management interface -->
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">Gestión de Contactos</h2>
                    <div class="flex gap-4">
                        <button class="btn btn-secondary" onclick="crmModule.importContacts()">
                            <i data-lucide="upload"></i>
                            Importar
                        </button>
                        <button class="btn btn-secondary" onclick="crmModule.exportContacts()">
                            <i data-lucide="download"></i>
                            Exportar
                        </button>
                        <button class="btn btn-primary" onclick="crmModule.showNewContactModal()">
                            <i data-lucide="plus"></i>
                            Nuevo Contacto
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-4 gap-4 mb-8">
                    ${this.renderContactMetrics()}
                </div>

                <div class="data-table">
                    <div class="table-header">
                        <h3 class="font-bold">Base de Contactos</h3>
                    </div>
                    <div style="overflow-x: auto;">
                        ${this.renderContactsTable()}
                    </div>
                </div>
            </div>
        `;
    }

    renderCompaniesTab() {
        return `
            <div class="crm-tab-content" id="crm-companies">
                <!-- Companies management interface -->
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">Gestión de Empresas</h2>
                    <div class="flex gap-4">
                        <button class="btn btn-secondary" onclick="crmModule.territoryManagement()">
                            <i data-lucide="map"></i>
                            Gestión Territorial
                        </button>
                        <button class="btn btn-secondary" onclick="crmModule.companyAnalytics()">
                            <i data-lucide="bar-chart"></i>
                            Analytics
                        </button>
                        <button class="btn btn-primary" onclick="crmModule.showNewCompanyModal()">
                            <i data-lucide="plus"></i>
                            Nueva Empresa
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-4 gap-4 mb-8">
                    ${this.renderCompanyMetrics()}
                </div>

                <div class="data-table">
                    <div class="table-header">
                        <h3 class="font-bold">Cartera de Empresas</h3>
                    </div>
                    <div style="overflow-x: auto;">
                        ${this.renderCompaniesTable()}
                    </div>
                </div>
            </div>
        `;
    }

    renderDealsTab() {
        return `
            <div class="crm-tab-content" id="crm-deals">
                <!-- Deals management interface -->
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold">Gestión de Deals</h2>
                    <div class="flex gap-4">
                        <button class="btn btn-secondary" onclick="crmModule.forecastAnalysis()">
                            <i data-lucide="trending-up"></i>
                            Forecast
                        </button>
                        <button class="btn btn-secondary" onclick="crmModule.competitorAnalysis()">
                            <i data-lucide="shield"></i>
                            Competencia
                        </button>
                        <button class="btn btn-primary" onclick="crmModule.showNewDealModal()">
                            <i data-lucide="plus"></i>
                            Nuevo Deal
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-5 gap-4 mb-8">
                    ${this.renderDealMetrics()}
                </div>

                <div class="data-table">
                    <div class="table-header">
                        <h3 class="font-bold">Pipeline de Deals</h3>
                    </div>
                    <div style="overflow-x: auto;">
                        ${this.renderDealsTable()}
                    </div>
                </div>
            </div>
        `;
    }

    renderReportsTab() {
        return `
            <div class="crm-tab-content" id="crm-reports">
                <!-- Reports and Business Intelligence -->
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-2xl font-bold">Centro de Reportes e Inteligencia</h2>
                        <p class="text-secondary">Business Intelligence y reportes personalizados</p>
                    </div>
                    <div class="flex gap-4">
                        <button class="btn btn-secondary" onclick="crmModule.scheduleReport()">
                            <i data-lucide="calendar"></i>
                            Programar
                        </button>
                        <button class="btn btn-primary" onclick="crmModule.createCustomReport()">
                            <i data-lucide="plus"></i>
                            Crear Reporte
                        </button>
                    </div>
                </div>

                <!-- Report Categories -->
                <div class="grid grid-cols-3 gap-6 mb-8">
                    ${this.renderReportCategories()}
                </div>

                <!-- Recent Reports -->
                <div class="data-table">
                    <div class="table-header">
                        <h3 class="font-bold">Reportes Recientes</h3>
                    </div>
                    <div style="overflow-x: auto;">
                        ${this.renderReportsTable()}
                    </div>
                </div>
            </div>
        `;
    }

    // ===== RENDER METHODS =====

    renderKPICards() {
        const kpis = [
            {
                title: 'Ingresos totales',
                value: '€250K',
                change: '+18.2%',
                trend: 'positive',
                icon: 'euro',
                color: 'var(--mep-success)'
            },
            {
                title: 'Clientes potenciales activos',
                value: '17',
                change: '+12.3%',
                trend: 'positive',
                icon: 'users',
                color: 'var(--mep-info)'
            },
            {
                title: 'Tasa Conversión',
                value: '24.8%',
                change: '+3.1%',
                trend: 'positive',
                icon: 'target',
                color: 'var(--mep-warning)'
            },
            {
                title: 'Valor de proceso de contrataciones',
                value: '€460K',
                change: '+5.7%',
                trend: 'positive',
                icon: 'trending-up',
                color: 'var(--mep-primary-500)'
            }
        ];

        return kpis.map(kpi => `
            <div class="kpi-card">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <div style="width: 48px; height: 48px; background: ${kpi.color}; border-radius: var(--radius-lg); 
                                   display: flex; align-items: center; justify-content: center; color: white;">
                            <i data-lucide="${kpi.icon}" style="width: 24px; height: 24px;"></i>
                        </div>
                        <div>
                            <h3 style="font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: 600; margin-bottom: 4px;">
                                ${kpi.title}
                            </h3>
                            <div style="font-size: 2rem; font-weight: 800; color: var(--text-primary);">
                                ${kpi.value}
                            </div>
                        </div>
                    </div>
                </div>
                <div class="metric-trend ${kpi.trend}">
                    <i data-lucide="trending-up" style="width: 16px; height: 16px;"></i>
                    <span>${kpi.change} vs mes anterior</span>
                </div>
            </div>
        `).join('');
    }

    renderRevenueChart() {
        return `
            <div style="display: flex; flex-direction: column; height: 100%; justify-content: center; align-items: center; 
                       background: linear-gradient(135deg, #667eea20 0%, #764ba220 100%); border-radius: var(--radius-lg);">
                <div style="width: 100%; height: 200px; position: relative; margin-bottom: 20px;">
                    <!-- Simulated line chart -->
                    <svg width="100%" height="100%" viewBox="0 0 400 200">
                        <defs>
                            <linearGradient id="revenueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.3" />
                                <stop offset="100%" style="stop-color:#667eea;stop-opacity:0" />
                            </linearGradient>
                        </defs>
                        <!-- Grid lines -->
                        <line x1="0" y1="50" x2="400" y2="50" stroke="#e2e8f0" stroke-width="1"/>
                        <line x1="0" y1="100" x2="400" y2="100" stroke="#e2e8f0" stroke-width="1"/>
                        <line x1="0" y1="150" x2="400" y2="150" stroke="#e2e8f0" stroke-width="1"/>
                        
                        <!-- Revenue line -->
                        <polyline fill="none" stroke="#667eea" stroke-width="3" 
                                 points="20,150 70,130 120,120 170,100 220,90 270,70 320,60 370,40"/>
                        
                        <!-- Area fill -->
                        <polygon fill="url(#revenueGradient)" 
                                points="20,150 70,130 120,120 170,100 220,90 270,70 320,60 370,40 370,180 20,180"/>
                        
                        <!-- Data points -->
                        <circle cx="20" cy="150" r="4" fill="#667eea"/>
                        <circle cx="70" cy="130" r="4" fill="#667eea"/>
                        <circle cx="120" cy="120" r="4" fill="#667eea"/>
                        <circle cx="170" cy="100" r="4" fill="#667eea"/>
                        <circle cx="220" cy="90" r="4" fill="#667eea"/>
                        <circle cx="270" cy="70" r="4" fill="#667eea"/>
                        <circle cx="320" cy="60" r="4" fill="#667eea"/>
                        <circle cx="370" cy="40" r="4" fill="#667eea"/>
                    </svg>
                </div>
                <div style="display: flex; justify-content: space-between; width: 100%; padding: 0 20px; font-size: var(--font-size-sm); color: var(--text-secondary);">
                    <span>Ene</span><span>Feb</span><span>Mar</span><span>Abr</span><span>May</span><span>Jun</span><span>Jul</span><span>Ago</span>
                </div>
                <div style="margin-top: 20px; text-center;">
                    <div style="font-size: var(--font-size-lg); font-weight: 700; color: var(--mep-success); margin-bottom: 5px;">
                        ↗ +18.2% Crecimiento
                    </div>
                    <div style="color: var(--text-secondary);">Tendencia positiva sostenida</div>
                </div>
            </div>
        `;
    }

    renderPipelineChart() {
        const stages = [
            { name: 'Prospección', value: 45, color: '#3B82F6' },
            { name: 'Cualificado', value: 32, color: '#10B981' },
            { name: 'Propuesta', value: 18, color: '#F59E0B' },
            { name: 'Negociación', value: 12, color: '#8B5CF6' },
            { name: 'Cerrado', value: 8, color: '#059669' }
        ];

        const total = stages.reduce((sum, stage) => sum + stage.value, 0);

        return `
            <div style="height: 100%; display: flex; flex-direction: column; justify-content: center;">
                ${stages.map((stage, index) => {
                    const percentage = (stage.value / total * 100).toFixed(1);
                    return `
                        <div style="margin-bottom: 15px; cursor: pointer;" onclick="crmModule.drillDownStage('${stage.name}')">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                                <span style="font-weight: 600; font-size: var(--font-size-sm);">${stage.name}</span>
                                <span style="font-weight: 700; color: ${stage.color};">${stage.value}</span>
                            </div>
                            <div style="width: 100%; height: 20px; background: var(--bg-tertiary); border-radius: 10px; overflow: hidden;">
                                <div style="width: ${percentage}%; height: 100%; background: linear-gradient(90deg, ${stage.color}, ${stage.color}dd); 
                                           transition: all 0.3s ease; border-radius: 10px;"></div>
                            </div>
                            <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-top: 2px;">
                                ${percentage}% del proceso de contrataciones
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderFunnelChart() {
        const funnelData = [
            { stage: 'Contacto', value: 10000, color: '#E5E7EB' },
            { stage: 'Clientes potenciales', value: 2500, color: '#9CA3AF' },
            { stage: 'Cualificado', value: 750, color: '#6B7280' },
            { stage: 'Oportunidades', value: 250, color: '#374151' },
            { stage: 'Contactos', value: 62, color: '#1F2937' }
        ];

        return `
            <div style="height: 100%; display: flex; flex-direction: column; justify-content: center; padding: 20px;">
                ${funnelData.map((item, index) => {
                    const width = 100 - (index * 15);
                    const conversionRate = index > 0 ? (item.value / funnelData[index-1].value * 100).toFixed(1) : 100;
                    
                    return `
                        <div style="margin-bottom: 12px;">
                            <div style="display: flex; justify-content: center; margin-bottom: 5px;">
                                <div style="width: ${width}%; height: 40px; background: linear-gradient(135deg, ${item.color}, ${item.color}cc); 
                                           border-radius: 20px; display: flex; align-items: center; justify-content: center; 
                                           color: white; font-weight: 700; cursor: pointer; transition: all 0.2s;"
                                     onmouseover="this.style.transform='scale(1.05)'"
                                     onmouseout="this.style.transform='scale(1)'">
                                    ${item.stage}: ${item.value.toLocaleString()}
                                </div>
                            </div>
                            ${index > 0 ? `
                                <div style="text-center; font-size: var(--font-size-xs); color: var(--text-secondary);">
                                    ${conversionRate}% conversión
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderTeamChart() {
        const teamData = [
            { name: 'Beatriz Tudela', sales: 156000, deals: 12, color: '#10B981' },
            { name: 'Francisco Gallego', sales: 134000, deals: 9, color: '#3B82F6' },
            { name: 'Mari Carmen Lay', sales: 98000, deals: 8, color: '#F59E0B' },
            { name: 'Luis Martín', sales: 87000, deals: 7, color: '#8B5CF6' }
        ];

        const maxSales = Math.max(...teamData.map(t => t.sales));

        return `
            <div style="height: 100%; padding: 20px;">
                ${teamData.map(member => {
                    const percentage = (member.sales / maxSales * 100);
                    return `
                        <div style="margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div class="user-avatar" style="width: 32px; height: 32px; background: ${member.color};">
                                        ${member.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span style="font-weight: 600; font-size: var(--font-size-sm);">${member.name}</span>
                                </div>
                                <div style="text-align: right;">
                                    <div style="font-weight: 700; color: ${member.color};">€${member.sales.toLocaleString()}</div>
                                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">${member.deals} deals</div>
                                </div>
                            </div>
                            <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                                <div style="width: ${percentage}%; height: 100%; background: ${member.color}; 
                                        transition: all 0.5s ease; border-radius: 4px;"></div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderRecentActivities() {
        const activities = [
            {
                type: 'deal_won',
                icon: 'check-circle',
                title: 'Oferta cerrada',
                description: 'TechSolutions - Sistema ERP',
                value: '€156,000',
                time: 'hace 2 horas',
                user: 'Beatriz Tudela',
                color: 'var(--mep-success)'
            },
            {
                type: 'lead_qualified',
                icon: 'user-check',
                title: 'Lead Calificado',
                description: 'Digital Innovations S.L.',
                value: 'Score: 89',
                time: 'hace 4 horas',
                user: 'Francisco Gallego',
                color: 'var(--mep-info)'
            },
            {
                type: 'meeting_scheduled',
                icon: 'calendar',
                title: 'Reunión Programada',
                description: 'Demo con MegaSoft Solutions',
                value: 'Mañana 10:00',
                time: 'hace 6 horas',
                user: 'Mari Carmen Lay',
                color: 'var(--mep-warning)'
            },
            {
                type: 'proposal_sent',
                icon: 'send',
                title: 'Propuesta Enviada',
                description: 'GlobalTech - Consultoría IT',
                value: '€89,500',
                time: 'ayer',
                user: 'Luis Martín',
                color: 'var(--mep-primary-500)'
            },
            {
                type: 'contact_added',
                icon: 'user-plus',
                title: 'Contacto Añadido',
                description: 'Innovate Corp - CTO',
                value: 'Premium Lead',
                time: 'ayer',
                user: 'Beatriz Tudela',
                color: 'var(--mep-purple)'
            }
        ];

        return `
            <div style="space-y-4;">
                ${activities.map(activity => `
                    <div style="display: flex; align-items: start; gap: 12px; padding: 12px; 
                               background: var(--bg-secondary); border-radius: var(--radius-lg); 
                               border-left: 4px solid ${activity.color}; cursor: pointer; transition: all 0.2s;"
                         onmouseover="this.style.transform='translateX(5px)'"
                         onmouseout="this.style.transform='translateX(0)'">
                        <div style="width: 40px; height: 40px; background: ${activity.color}; 
                                   border-radius: var(--radius-full); display: flex; align-items: center; 
                                   justify-content: center; color: white; flex-shrink: 0;">
                            <i data-lucide="${activity.icon}" style="width: 20px; height: 20px;"></i>
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
                                <h4 style="font-weight: 700; color: var(--text-primary); font-size: var(--font-size-sm);">
                                    ${activity.title}
                                </h4>
                                <span style="font-size: var(--font-size-xs); color: var(--text-tertiary);">${activity.time}</span>
                            </div>
                            <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: 4px;">
                                ${activity.description}
                            </p>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="font-weight: 600; color: ${activity.color}; font-size: var(--font-size-sm);">
                                    ${activity.value}
                                </span>
                                <span style="font-size: var(--font-size-xs); color: var(--text-tertiary);">
                                    por ${activity.user}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderTopPerformers() {
        const performers = [
            { name: 'Beatriz Tudela', revenue: 456000, deals: 15, growth: '+23%', avatar: 'AL' },
            { name: 'Francisco Gallego', revenue: 389000, deals: 12, growth: '+18%', avatar: 'CG' },
            { name: 'Mari Carmen Lay', revenue: 334000, deals: 11, growth: '+15%', avatar: 'MR' },
            { name: 'Luis Martín', revenue: 298000, deals: 9, growth: '+12%', avatar: 'LM' }
        ];

        return `
            <div style="space-y-4;">
                ${performers.map((performer, index) => `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; 
                               background: ${index === 0 ? 'linear-gradient(135deg, #fef3c7, #fbbf24)' : 'var(--bg-secondary)'}; 
                               border-radius: var(--radius-lg); position: relative; overflow: hidden;">
                        ${index === 0 ? '<div style="position: absolute; top: 8px; right: 8px; color: #f59e0b;"><i data-lucide="crown" style="width: 16px; height: 16px;"></i></div>' : ''}
                        
                        <div class="user-avatar" style="width: 48px; height: 48px; font-weight: 700;">
                            ${performer.avatar}
                        </div>
                        
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <h4 style="font-weight: 700; color: var(--text-primary);">${performer.name}</h4>
                                <span style="font-size: var(--font-size-sm); color: var(--mep-success); font-weight: 600;">
                                    ${performer.growth}
                                </span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: var(--text-secondary); font-size: var(--font-size-sm);">
                                    ${performer.deals} deals cerrados
                                </span>
                                <span style="font-weight: 700; color: var(--text-primary);">
                                    €${performer.revenue.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderHotLeads() {
        const hotLeads = [
            { company: 'InnovateTech S.L.', contact: 'Carlos Ruiz', score: 94, value: 125000, status: 'negotiation' },
            { company: 'Digital Solutions', contact: 'Ana Martín', score: 89, value: 87500, status: 'proposal' },
            { company: 'Future Systems', contact: 'Luis García', score: 86, value: 156000, status: 'demo' },
            { company: 'Smart Analytics', contact: 'María López', score: 82, value: 94000, status: 'qualification' }
        ];

        return `
            <div style="space-y-4;">
                ${hotLeads.map(lead => `
                    <div style="display: flex; align-items: center; gap: 12px; padding: 12px; 
                               background: var(--bg-secondary); border-radius: var(--radius-lg); 
                               border-left: 4px solid var(--mep-error); cursor: pointer; transition: all 0.2s;"
                         onclick="crmModule.viewLead('${lead.company}')"
                         onmouseover="this.style.transform='scale(1.02)'"
                         onmouseout="this.style.transform='scale(1)'">
                        
                        <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #fee2e2, #fca5a5); 
                                   border-radius: var(--radius-lg); display: flex; align-items: center; 
                                   justify-content: center; font-weight: 700; color: var(--mep-error);">
                            ${lead.score}
                        </div>
                        
                        <div style="flex: 1;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <h4 style="font-weight: 700; color: var(--text-primary); font-size: var(--font-size-sm);">
                                    ${lead.company}
                                </h4>
                                <span style="font-weight: 700; color: var(--mep-success);">
                                    €${lead.value.toLocaleString()}
                                </span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span style="color: var(--text-secondary); font-size: var(--font-size-sm);">
                                    ${lead.contact}
                                </span>
                                <span class="badge badge-warning" style="font-size: var(--font-size-xs);">
                                    ${lead.status}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderPipelineMetrics() {
        const metrics = [
            { title: 'Total Pipeline', value: '€3.2M', change: '+12.5%', icon: 'dollar-sign', color: 'var(--mep-primary-500)' },
            { title: 'Deals Activos', value: '89', change: '+7', icon: 'handshake', color: 'var(--mep-info)' },
            { title: 'Avg Deal Size', value: '€36K', change: '+8.2%', icon: 'trending-up', color: 'var(--mep-success)' },
            { title: 'Close Rate', value: '23.4%', change: '+2.1%', icon: 'target', color: 'var(--mep-warning)' },
            { title: 'Sales Cycle', value: '45 días', change: '-3 días', icon: 'clock', color: 'var(--mep-purple)' }
        ];

        return metrics.map(metric => `
            <div class="kpi-card">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="width: 40px; height: 40px; background: ${metric.color}; border-radius: var(--radius-lg); 
                               display: flex; align-items: center; justify-content: center; color: white;">
                        <i data-lucide="${metric.icon}" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: 600;">
                            ${metric.title}
                        </h3>
                        <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary);">
                            ${metric.value}
                        </div>
                    </div>
                </div>
                <div class="metric-trend positive">
                    <i data-lucide="trending-up" style="width: 14px; height: 14px;"></i>
                    <span>${metric.change}</span>
                </div>
            </div>
        `).join('');
    }

    renderPipelineKanban() {
        const stages = [
            {
                name: 'Prospecting',
                deals: [
                    { title: 'TechCorp Integration', value: 45000, company: 'TechCorp', days: 12 },
                    { title: 'Digital Transform', value: 67000, company: 'InnovateLab', days: 8 },
                    { title: 'Cloud Migration', value: 89000, company: 'DataSystems', days: 5 }
                ],
                color: '#3B82F6'
            },
            {
                name: 'Qualification',
                deals: [
                    { title: 'ERP Implementation', value: 125000, company: 'MegaCorp', days: 18 },
                    { title: 'Security Audit', value: 34000, company: 'SecureTech', days: 15 }
                ],
                color: '#10B981'
            },
            {
                name: 'Proposal',
                deals: [
                    { title: 'AI Analytics Platform', value: 156000, company: 'SmartData', days: 22 },
                    { title: 'Custom CRM', value: 78000, company: 'SalesPro', days: 19 }
                ],
                color: '#F59E0B'
            },
            {
                name: 'Negotiation',
                deals: [
                    { title: 'Enterprise Suite', value: 234000, company: 'GlobalTech', days: 35 }
                ],
                color: '#8B5CF6'
            },
            {
                name: 'Closed Won',
                deals: [
                    { title: 'Mobile App Dev', value: 67000, company: 'AppMakers', days: 0 },
                    { title: 'Web Platform', value: 89000, company: 'WebSolutions', days: 0 }
                ],
                color: '#059669'
            }
        ];

        return `
            <div style="display: flex; gap: 20px; overflow-x: auto; padding: 20px;">
                ${stages.map(stage => `
                    <div style="min-width: 280px; background: var(--bg-secondary); border-radius: var(--radius-lg); 
                               padding: 16px; border-top: 4px solid ${stage.color};">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                            <h3 style="font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
                                <div style="width: 12px; height: 12px; background: ${stage.color}; border-radius: 50%;"></div>
                                ${stage.name}
                            </h3>
                            <span style="background: ${stage.color}; color: white; padding: 4px 8px; 
                                        border-radius: var(--radius-full); font-size: var(--font-size-xs); font-weight: 600;">
                                ${stage.deals.length}
                            </span>
                        </div>
                        
                        <div style="space-y-3;">
                            ${stage.deals.map(deal => `
                                <div style="background: white; border-radius: var(--radius-lg); padding: 16px; 
                                           box-shadow: var(--shadow-sm); border: 1px solid var(--border-secondary); 
                                           cursor: pointer; transition: all 0.2s;"
                                     onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='var(--shadow-lg)'"
                                     onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='var(--shadow-sm)'"
                                     onclick="crmModule.viewDeal('${deal.title}')">
                                    
                                    <div style="margin-bottom: 8px;">
                                        <h4 style="font-weight: 700; color: var(--text-primary); font-size: var(--font-size-sm); 
                                                  margin-bottom: 4px;">${deal.title}</h4>
                                        <p style="color: var(--text-secondary); font-size: var(--font-size-xs);">${deal.company}</p>
                                    </div>
                                    
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="font-weight: 700; color: ${stage.color}; font-size: var(--font-size-sm);">
                                            €${deal.value.toLocaleString()}
                                        </span>
                                        <span style="font-size: var(--font-size-xs); color: var(--text-tertiary);">
                                            ${deal.days > 0 ? `${deal.days} días` : 'Cerrado'}
                                        </span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderAdvancedMetrics() {
        const metrics = [
            { title: 'Customer LTV', value: '€125K', change: '+15.3%', icon: 'user-heart', color: 'var(--mep-success)' },
            { title: 'CAC Ratio', value: '3.2:1', change: '+0.3', icon: 'calculator', color: 'var(--mep-info)' },
            { title: 'Churn Rate', value: '2.1%', change: '-0.5%', icon: 'user-minus', color: 'var(--mep-warning)' },
            { title: 'NPS Score', value: '8.7', change: '+1.2', icon: 'star', color: 'var(--mep-purple)' }
        ];

        return metrics.map(metric => `
            <div class="kpi-card">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="width: 40px; height: 40px; background: ${metric.color}; border-radius: var(--radius-lg); 
                               display: flex; align-items: center; justify-content: center; color: white;">
                        <i data-lucide="${metric.icon}" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: 600;">
                            ${metric.title}
                        </h3>
                        <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary);">
                            ${metric.value}
                        </div>
                    </div>
                </div>
                <div class="metric-trend positive">
                    <i data-lucide="trending-up" style="width: 14px; height: 14px;"></i>
                    <span>${metric.change}</span>
                </div>
            </div>
        `).join('');
    }

    renderRevenueAnalytics() {
        return `
            <div style="height: 100%; display: flex; flex-direction: column;">
                <!-- Revenue Breakdown -->
                <div style="margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                        <div>
                            <h4 style="font-weight: 700; color: var(--text-primary);">Recurring Revenue</h4>
                            <p style="font-size: 1.5rem; font-weight: 800; color: var(--mep-success);">€1.8M</p>
                        </div>
                        <div>
                            <h4 style="font-weight: 700; color: var(--text-primary);">One-time Revenue</h4>
                            <p style="font-size: 1.5rem; font-weight: 800; color: var(--mep-info);">€650K</p>
                        </div>
                    </div>
                    
                    <!-- Revenue Trend Chart -->
                    <div style="height: 200px; background: var(--bg-tertiary); border-radius: var(--radius-lg); padding: 20px;">
                        <svg width="100%" height="100%" viewBox="0 0 400 160">
                            <!-- MRR Line -->
                            <polyline fill="none" stroke="var(--mep-success)" stroke-width="3" 
                                     points="20,120 70,110 120,105 170,95 220,85 270,70 320,60 370,45"/>
                            <!-- One-time Revenue Bars -->
                            <rect x="15" y="140" width="10" height="20" fill="var(--mep-info)" opacity="0.7"/>
                            <rect x="65" y="130" width="10" height="30" fill="var(--mep-info)" opacity="0.7"/>
                            <rect x="115" y="125" width="10" height="35" fill="var(--mep-info)" opacity="0.7"/>
                            <rect x="165" y="120" width="10" height="40" fill="var(--mep-info)" opacity="0.7"/>
                            <rect x="215" y="115" width="10" height="45" fill="var(--mep-info)" opacity="0.7"/>
                            <rect x="265" y="110" width="10" height="50" fill="var(--mep-info)" opacity="0.7"/>
                            <rect x="315" y="105" width="10" height="55" fill="var(--mep-info)" opacity="0.7"/>
                            <rect x="365" y="100" width="10" height="60" fill="var(--mep-info)" opacity="0.7"/>
                        </svg>
                    </div>
                </div>
                
                <!-- Revenue Segments -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: var(--radius-lg);">
                        <h5 style="font-weight: 600; margin-bottom: 10px;">Por Región</h5>
                        <div style="space-y-2;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>Norte</span><span style="font-weight: 700;">€890K</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Sur</span><span style="font-weight: 700;">€670K</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Este</span><span style="font-weight: 700;">€520K</span>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: var(--bg-tertiary); padding: 15px; border-radius: var(--radius-lg);">
                        <h5 style="font-weight: 600; margin-bottom: 10px;">Por Producto</h5>
                        <div style="space-y-2;">
                            <div style="display: flex; justify-content: space-between;">
                                <span>Enterprise</span><span style="font-weight: 700;">€1.2M</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Professional</span><span style="font-weight: 700;">€780K</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Starter</span><span style="font-weight: 700;">€320K</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCustomerSegmentation() {
        return `
            <div style="height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                <!-- Customer Segments Donut Chart -->
                <div style="position: relative; width: 200px; height: 200px; margin-bottom: 20px;">
                    <svg width="200" height="200" viewBox="0 0 200 200">
                        <!-- Enterprise Segment -->
                        <circle cx="100" cy="100" r="80" fill="none" stroke="var(--mep-primary-500)" 
                               stroke-width="20" stroke-dasharray="125.6 377" stroke-dashoffset="0"/>
                        <!-- Professional Segment -->
                        <circle cx="100" cy="100" r="80" fill="none" stroke="var(--mep-success)" 
                               stroke-width="20" stroke-dasharray="100.5 402.1" stroke-dashoffset="-125.6"/>
                        <!-- SMB Segment -->
                        <circle cx="100" cy="100" r="80" fill="none" stroke="var(--mep-warning)" 
                               stroke-width="20" stroke-dasharray="75.4 427.2" stroke-dashoffset="-226.1"/>
                        <!-- Startup Segment -->
                        <circle cx="100" cy="100" r="80" fill="none" stroke="var(--mep-info)" 
                               stroke-width="20" stroke-dasharray="50.3 452.3" stroke-dashoffset="-301.5"/>
                    </svg>
                    <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                        <div style="font-size: 1.5rem; font-weight: 800; color: var(--text-primary);">1,247</div>
                        <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">Customers</div>
                    </div>
                </div>
                
                <!-- Legend -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 16px; height: 16px; background: var(--mep-primary-500); border-radius: 50%;"></div>
                        <div>
                            <div style="font-weight: 600; font-size: var(--font-size-sm);">Enterprise</div>
                            <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">187 clientes</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 16px; height: 16px; background: var(--mep-success); border-radius: 50%;"></div>
                        <div>
                            <div style="font-weight: 600; font-size: var(--font-size-sm);">Professional</div>
                            <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">321 clientes</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 16px; height: 16px; background: var(--mep-warning); border-radius: 50%;"></div>
                        <div>
                            <div style="font-weight: 600; font-size: var(--font-size-sm);">SMB</div>
                            <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">456 clientes</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 16px; height: 16px; background: var(--mep-info); border-radius: 50%;"></div>
                        <div>
                            <div style="font-weight: 600; font-size: var(--font-size-sm);">Startup</div>
                            <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">283 clientes</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCohortAnalysis() {
        return `
            <div style="height: 100%; overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: var(--font-size-sm);">
                    <thead>
                        <tr style="background: var(--bg-tertiary);">
                            <th style="padding: 12px; text-align: left;">Cohorte</th>
                            <th style="padding: 12px; text-align: center;">Mes 0</th>
                            <th style="padding: 12px; text-align: center;">Mes 1</th>
                            <th style="padding: 12px; text-align: center;">Mes 2</th>
                            <th style="padding: 12px; text-align: center;">Mes 3</th>
                            <th style="padding: 12px; text-align: center;">Mes 6</th>
                            <th style="padding: 12px; text-align: center;">Mes 12</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="padding: 12px; font-weight: 600;">Ene 2024</td>
                            <td style="padding: 12px; text-align: center; background: #10B981; color: white;">100%</td>
                            <td style="padding: 12px; text-align: center; background: #059669; color: white;">87%</td>
                            <td style="padding: 12px; text-align: center; background: #047857; color: white;">78%</td>
                            <td style="padding: 12px; text-align: center; background: #065f46; color: white;">72%</td>
                            <td style="padding: 12px; text-align: center; background: #064e3b; color: white;">65%</td>
                            <td style="padding: 12px; text-align: center; background: #1f2937; color: white;">58%</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; font-weight: 600;">Feb 2024</td>
                            <td style="padding: 12px; text-align: center; background: #10B981; color: white;">100%</td>
                            <td style="padding: 12px; text-align: center; background: #059669; color: white;">89%</td>
                            <td style="padding: 12px; text-align: center; background: #047857; color: white;">81%</td>
                            <td style="padding: 12px; text-align: center; background: #065f46; color: white;">74%</td>
                            <td style="padding: 12px; text-align: center; background: #064e3b; color: white;">68%</td>
                            <td style="padding: 12px; text-align: center; color: var(--text-tertiary);">-</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; font-weight: 600;">Mar 2024</td>
                            <td style="padding: 12px; text-align: center; background: #10B981; color: white;">100%</td>
                            <td style="padding: 12px; text-align: center; background: #059669; color: white;">92%</td>
                            <td style="padding: 12px; text-align: center; background: #047857; color: white;">85%</td>
                            <td style="padding: 12px; text-align: center; background: #065f46; color: white;">77%</td>
                            <td style="padding: 12px; text-align: center; color: var(--text-tertiary);">-</td>
                            <td style="padding: 12px; text-align: center; color: var(--text-tertiary);">-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    renderLeadMetrics() {
        const metrics = [
            { title: 'Total Leads', value: '2,847', change: '+12.3%', icon: 'users', color: 'var(--mep-info)' },
            { title: 'Qualified Leads', value: '1,456', change: '+18.7%', icon: 'user-check', color: 'var(--mep-success)' },
            { title: 'Conversion Rate', value: '24.8%', change: '+2.1%', icon: 'trending-up', color: 'var(--mep-warning)' },
            { title: 'Avg Lead Score', value: '74.2', change: '+5.3', icon: 'target', color: 'var(--mep-purple)' }
        ];

        return metrics.map(metric => `
            <div class="kpi-card">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="width: 40px; height: 40px; background: ${metric.color}; border-radius: var(--radius-lg); 
                               display: flex; align-items: center; justify-content: center; color: white;">
                        <i data-lucide="${metric.icon}" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: 600;">
                            ${metric.title}
                        </h3>
                        <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary);">
                            ${metric.value}
                        </div>
                    </div>
                </div>
                <div class="metric-trend positive">
                    <i data-lucide="trending-up" style="width: 14px; height: 14px;"></i>
                    <span>${metric.change}</span>
                </div>
            </div>
        `).join('');
    }

    renderLeadsTable() {
        const leads = [
            { id: 'L001', name: 'TechInnovate S.L.', contact: 'María García', email: 'maria@techinnovate.com', score: 94, status: 'hot', source: 'Website', value: 125000, assigned: 'Beatriz Tudela', created: '2025-05-25' },
            { id: 'L002', name: 'Digital Solutions', contact: 'Carlos Ruiz', email: 'carlos@digitalsol.com', score: 87, status: 'warm', source: 'Referral', value: 89000, assigned: 'Francisco Gallego', created: '2025-05-24' },
            { id: 'L003', name: 'Future Systems', contact: 'Ana Martín', email: 'ana@futuresys.com', score: 78, status: 'warm', source: 'LinkedIn', value: 156000, assigned: 'Mari Carmen Lay', created: '2025-05-23' },
            { id: 'L004', name: 'Smart Analytics', contact: 'Luis García', email: 'luis@smartanalytics.com', score: 65, status: 'cold', source: 'Trade Show', value: 67000, assigned: 'Luis Martín', created: '2025-05-22' },
            { id: 'L005', name: 'CloudTech Pro', contact: 'Elena Jiménez', email: 'elena@cloudtechpro.com', score: 82, status: 'warm', source: 'Google Ads', value: 98000, assigned: 'Beatriz Tudela', created: '2025-05-21' }
        ];

        return `
            <table class="table" style="width: 100%;">
                <thead>
                    <tr style="background: var(--bg-tertiary);">
                        <th style="padding: 12px; text-align: left;">Lead</th>
                        <th style="padding: 12px; text-align: left;">Contacto</th>
                        <th style="padding: 12px; text-align: center;">Score</th>
                        <th style="padding: 12px; text-align: center;">Estado</th>
                        <th style="padding: 12px; text-align: left;">Fuente</th>
                        <th style="padding: 12px; text-align: right;">Valor</th>
                        <th style="padding: 12px; text-align: left;">Asignado</th>
                        <th style="padding: 12px; text-align: center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${leads.map(lead => `
                        <tr style="border-bottom: 1px solid var(--border-secondary);">
                            <td style="padding: 12px;">
                                <div>
                                    <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                                        ${lead.name}
                                    </div>
                                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">
                                        ID: ${lead.id}
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 12px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="user-avatar" style="width: 32px; height: 32px;">
                                        ${lead.contact.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <div style="font-weight: 600; color: var(--text-primary);">
                                            ${lead.contact}
                                        </div>
                                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">
                                            ${lead.email}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <div style="width: 40px; height: 40px; background: ${lead.score >= 80 ? 'var(--mep-success)' : lead.score >= 60 ? 'var(--mep-warning)' : 'var(--mep-error)'}; 
                                           border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; 
                                           color: white; font-weight: 700; margin: 0 auto;">
                                    ${lead.score}
                                </div>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <span class="badge badge-${lead.status === 'hot' ? 'error' : lead.status === 'warm' ? 'warning' : 'info'}">
                                    ${lead.status === 'hot' ? 'Caliente' : lead.status === 'warm' ? 'Tibio' : 'Frío'}
                                </span>
                            </td>
                            <td style="padding: 12px;">${lead.source}</td>
                            <td style="padding: 12px; text-align: right; font-weight: 700; color: var(--mep-success);">
                                €${lead.value.toLocaleString()}
                            </td>
                            <td style="padding: 12px;">${lead.assigned}</td>
                            <td style="padding: 12px; text-align: center;">
                                <div style="display: flex; gap: 4px; justify-content: center;">
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.viewLead('${lead.id}')" title="Ver detalles">
                                        <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                                    </button>
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.editLead('${lead.id}')" title="Editar">
                                        <i data-lucide="edit" style="width: 16px; height: 16px;"></i>
                                    </button>
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.convertLead('${lead.id}')" title="Convertir">
                                        <i data-lucide="arrow-right" style="width: 16px; height: 16px;"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderContactMetrics() {
        const metrics = [
            { title: 'Total Contactos', value: '5,247', change: '+8.3%', icon: 'user-check', color: 'var(--mep-info)' },
            { title: 'Activos', value: '4,891', change: '+12.1%', icon: 'user', color: 'var(--mep-success)' },
            { title: 'Engagement Rate', value: '76.2%', change: '+4.5%', icon: 'heart', color: 'var(--mep-warning)' },
            { title: 'Nuevos/Mes', value: '189', change: '+23', icon: 'user-plus', color: 'var(--mep-purple)' }
        ];

        return metrics.map(metric => `
            <div class="kpi-card">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="width: 40px; height: 40px; background: ${metric.color}; border-radius: var(--radius-lg); 
                               display: flex; align-items: center; justify-content: center; color: white;">
                        <i data-lucide="${metric.icon}" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: 600;">
                            ${metric.title}
                        </h3>
                        <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary);">
                            ${metric.value}
                        </div>
                    </div>
                </div>
                <div class="metric-trend positive">
                    <i data-lucide="trending-up" style="width: 14px; height: 14px;"></i>
                    <span>${metric.change}</span>
                </div>
            </div>
        `).join('');
    }

    renderContactsTable() {
        const contacts = [
            { id: 'C001', name: 'María García López', email: 'maria@techinnovate.com', phone: '+34 666 123 456', company: 'TechInnovate S.L.', role: 'CTO', status: 'active', lastContact: '2025-05-28' },
            { id: 'C002', name: 'Carlos Ruiz Martín', email: 'carlos@digitalsol.com', phone: '+34 666 789 012', company: 'Digital Solutions', role: 'CEO', status: 'active', lastContact: '2025-05-27' },
            { id: 'C003', name: 'Ana Martín Sánchez', email: 'ana@futuresys.com', phone: '+34 666 345 678', company: 'Future Systems', role: 'Director IT', status: 'active', lastContact: '2025-05-26' },
            { id: 'C004', name: 'Luis García Pérez', email: 'luis@smartanalytics.com', phone: '+34 666 901 234', company: 'Smart Analytics', role: 'VP Tecnología', status: 'inactive', lastContact: '2025-05-20' }
        ];

        return `
            <table class="table" style="width: 100%;">
                <thead>
                    <tr style="background: var(--bg-tertiary);">
                        <th style="padding: 12px; text-align: left;">Contacto</th>
                        <th style="padding: 12px; text-align: left;">Empresa</th>
                        <th style="padding: 12px; text-align: left;">Rol</th>
                        <th style="padding: 12px; text-align: center;">Estado</th>
                        <th style="padding: 12px; text-align: left;">Último Contacto</th>
                        <th style="padding: 12px; text-align: center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${contacts.map(contact => `
                        <tr style="border-bottom: 1px solid var(--border-secondary);">
                            <td style="padding: 12px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div class="user-avatar" style="width: 40px; height: 40px;">
                                        ${contact.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                                            ${contact.name}
                                        </div>
                                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">
                                            ${contact.email}
                                        </div>
                                        <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">
                                            ${contact.phone}
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 12px;">
                                <div style="font-weight: 600; color: var(--text-primary);">
                                    ${contact.company}
                                </div>
                            </td>
                            <td style="padding: 12px;">
                                <span style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: var(--radius-md); 
                                            font-size: var(--font-size-xs); font-weight: 600;">
                                    ${contact.role}
                                </span>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <span class="badge badge-${contact.status === 'active' ? 'success' : 'secondary'}">
                                    ${contact.status === 'active' ? 'Activo' : 'Inactivo'}
                                </span>
                            </td>
                            <td style="padding: 12px;">${contact.lastContact}</td>
                            <td style="padding: 12px; text-align: center;">
                                <div style="display: flex; gap: 4px; justify-content: center;">
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.viewContact('${contact.id}')" title="Ver perfil">
                                        <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                                    </button>
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.editContact('${contact.id}')" title="Editar">
                                        <i data-lucide="edit" style="width: 16px; height: 16px;"></i>
                                    </button>
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.emailContact('${contact.id}')" title="Enviar email">
                                        <i data-lucide="mail" style="width: 16px; height: 16px;"></i>
                                    </button>
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.callContact('${contact.id}')" title="Llamar">
                                        <i data-lucide="phone" style="width: 16px; height: 16px;"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderCompanyMetrics() {
        const metrics = [
            { title: 'Total Empresas', value: '1,247', change: '+15.2%', icon: 'building', color: 'var(--mep-info)' },
            { title: 'Enterprise', value: '187', change: '+8', icon: 'building-2', color: 'var(--mep-success)' },
            { title: 'ARR Total', value: '€4.2M', change: '+22.1%', icon: 'trending-up', color: 'var(--mep-warning)' },
            { title: 'Health Score', value: '8.4', change: '+0.7', icon: 'heart', color: 'var(--mep-purple)' }
        ];

        return metrics.map(metric => `
            <div class="kpi-card">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="width: 40px; height: 40px; background: ${metric.color}; border-radius: var(--radius-lg); 
                               display: flex; align-items: center; justify-content: center; color: white;">
                        <i data-lucide="${metric.icon}" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: 600;">
                            ${metric.title}
                        </h3>
                        <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary);">
                            ${metric.value}
                        </div>
                    </div>
                </div>
                <div class="metric-trend positive">
                    <i data-lucide="trending-up" style="width: 14px; height: 14px;"></i>
                    <span>${metric.change}</span>
                </div>
            </div>
        `).join('');
    }

    renderCompaniesTable() {
        const companies = [
            { id: 'COMP001', name: 'TechSolutions Inc.', industry: 'Tecnología', size: '500-1000', revenue: 2500000, healthScore: 9.2, type: 'Enterprise', contacts: 15, deals: 3, lastActivity: '2025-05-28' },
            { id: 'COMP002', name: 'Digital Innovations', industry: 'Software', size: '200-500', revenue: 1200000, healthScore: 8.7, type: 'Professional', contacts: 8, deals: 2, lastActivity: '2025-05-27' },
            { id: 'COMP003', name: 'Future Analytics', industry: 'Consultoría', size: '50-200', revenue: 450000, healthScore: 7.9, type: 'SMB', contacts: 5, deals: 1, lastActivity: '2025-05-26' },
            { id: 'COMP004', name: 'Smart Systems', industry: 'Hardware', size: '100-200', revenue: 890000, healthScore: 8.3, type: 'Professional', contacts: 12, deals: 2, lastActivity: '2025-05-25' }
        ];

        return `
            <table class="table" style="width: 100%;">
                <thead>
                    <tr style="background: var(--bg-tertiary);">
                        <th style="padding: 12px; text-align: left;">Empresa</th>
                        <th style="padding: 12px; text-align: left;">Industria</th>
                        <th style="padding: 12px; text-align: center;">Tamaño</th>
                        <th style="padding: 12px; text-align: right;">ARR</th>
                        <th style="padding: 12px; text-align: center;">Health Score</th>
                        <th style="padding: 12px; text-align: center;">Contactos</th>
                        <th style="padding: 12px; text-align: center;">Deals</th>
                        <th style="padding: 12px; text-align: center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${companies.map(company => `
                        <tr style="border-bottom: 1px solid var(--border-secondary);">
                            <td style="padding: 12px;">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); 
                                               border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center; 
                                               color: white; font-weight: 700;">
                                        ${company.name.split(' ').map(w => w[0]).join('').substring(0, 2)}
                                    </div>
                                    <div>
                                        <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                                            ${company.name}
                                        </div>
                                        <span class="badge badge-${company.type === 'Enterprise' ? 'primary' : company.type === 'Professional' ? 'info' : 'secondary'}" 
                                              style="font-size: var(--font-size-xs);">
                                            ${company.type}
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 12px;">${company.industry}</td>
                            <td style="padding: 12px; text-align: center;">
                                <span style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: var(--radius-md); 
                                            font-size: var(--font-size-xs); font-weight: 600;">
                                    ${company.size}
                                </span>
                            </td>
                            <td style="padding: 12px; text-align: right; font-weight: 700; color: var(--mep-success);">
                                €${(company.revenue / 1000000).toFixed(1)}M
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                                    <div style="width: 32px; height: 32px; background: ${company.healthScore >= 8 ? 'var(--mep-success)' : company.healthScore >= 6 ? 'var(--mep-warning)' : 'var(--mep-error)'}; 
                                               border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; 
                                               color: white; font-weight: 700; font-size: var(--font-size-sm);">
                                        ${company.healthScore}
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <span style="background: var(--mep-info); color: white; padding: 4px 8px; border-radius: var(--radius-full); 
                                            font-size: var(--font-size-xs); font-weight: 600;">
                                    ${company.contacts}
                                </span>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <span style="background: var(--mep-primary-500); color: white; padding: 4px 8px; border-radius: var(--radius-full); 
                                            font-size: var(--font-size-xs); font-weight: 600;">
                                    ${company.deals}
                                </span>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <div style="display: flex; gap: 4px; justify-content: center;">
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.viewCompany('${company.id}')" title="Ver empresa">
                                        <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                                    </button>
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.companyDashboard('${company.id}')" title="Dashboard">
                                        <i data-lucide="bar-chart-3" style="width: 16px; height: 16px;"></i>
                                    </button>
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.editCompany('${company.id}')" title="Editar">
                                        <i data-lucide="edit" style="width: 16px; height: 16px;"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderDealMetrics() {
        const metrics = [
            { title: 'Pipeline Total', value: '€3.2M', change: '+18.5%', icon: 'trending-up', color: 'var(--mep-primary-500)' },
            { title: 'Deals Activos', value: '89', change: '+12', icon: 'handshake', color: 'var(--mep-info)' },
            { title: 'Won This Month', value: '€456K', change: '+23.1%', icon: 'check-circle', color: 'var(--mep-success)' },
            { title: 'Win Rate', value: '28.4%', change: '+4.2%', icon: 'target', color: 'var(--mep-warning)' },
            { title: 'Avg Cycle', value: '42 días', change: '-5 días', icon: 'clock', color: 'var(--mep-purple)' }
        ];

        return metrics.map(metric => `
            <div class="kpi-card">
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="width: 40px; height: 40px; background: ${metric.color}; border-radius: var(--radius-lg); 
                               display: flex; align-items: center; justify-content: center; color: white;">
                        <i data-lucide="${metric.icon}" style="width: 20px; height: 20px;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: var(--font-size-sm); color: var(--text-secondary); font-weight: 600;">
                            ${metric.title}
                        </h3>
                        <div style="font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary);">
                            ${metric.value}
                        </div>
                    </div>
                </div>
                <div class="metric-trend positive">
                    <i data-lucide="trending-up" style="width: 14px; height: 14px;"></i>
                    <span>${metric.change}</span>
                </div>
            </div>
        `).join('');
    }

    renderDealsTable() {
        const deals = [
            { id: 'D001', title: 'Enterprise ERP Implementation', company: 'TechSolutions Inc.', value: 234000, stage: 'negotiation', probability: 85, closeDate: '2025-06-15', owner: 'Beatriz Tudela', daysInStage: 12 },
            { id: 'D002', title: 'Cloud Migration Project', company: 'Digital Innovations', value: 156000, stage: 'proposal', probability: 70, closeDate: '2025-06-30', owner: 'Francisco Gallego', daysInStage: 8 },
            { id: 'D003', title: 'AI Analytics Platform', company: 'Future Analytics', value: 89000, stage: 'demo', probability: 60, closeDate: '2025-07-15', owner: 'Mari Carmen Lay', daysInStage: 5 },
            { id: 'D004', title: 'Custom CRM Development', company: 'Smart Systems', value: 125000, stage: 'qualification', probability: 40, closeDate: '2025-08-01', owner: 'Luis Martín', daysInStage: 15 }
        ];

        return `
            <table class="table" style="width: 100%;">
                <thead>
                    <tr style="background: var(--bg-tertiary);">
                        <th style="padding: 12px; text-align: left;">Deal</th>
                        <th style="padding: 12px; text-align: left;">Empresa</th>
                        <th style="padding: 12px; text-align: right;">Valor</th>
                        <th style="padding: 12px; text-align: center;">Stage</th>
                        <th style="padding: 12px; text-align: center;">Probabilidad</th>
                        <th style="padding: 12px; text-align: left;">Close Date</th>
                        <th style="padding: 12px; text-align: left;">Owner</th>
                        <th style="padding: 12px; text-align: center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${deals.map(deal => `
                        <tr style="border-bottom: 1px solid var(--border-secondary);">
                            <td style="padding: 12px;">
                                <div>
                                    <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
                                        ${deal.title}
                                    </div>
                                    <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">
                                        ${deal.daysInStage} días en stage
                                    </div>
                                </div>
                            </td>
                            <td style="padding: 12px;">
                                <div style="font-weight: 600; color: var(--text-primary);">
                                    ${deal.company}
                                </div>
                            </td>
                            <td style="padding: 12px; text-align: right; font-weight: 700; color: var(--mep-success);">
                                €${deal.value.toLocaleString()}
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <span class="badge badge-${deal.stage === 'negotiation' ? 'error' : deal.stage === 'proposal' ? 'warning' : deal.stage === 'demo' ? 'info' : 'secondary'}">
                                    ${deal.stage.charAt(0).toUpperCase() + deal.stage.slice(1)}
                                </span>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
                                    <div style="width: 40px; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
                                        <div style="width: ${deal.probability}%; height: 100%; 
                                                   background: ${deal.probability >= 70 ? 'var(--mep-success)' : deal.probability >= 50 ? 'var(--mep-warning)' : 'var(--mep-error)'}; 
                                                   transition: all 0.3s;"></div>
                                    </div>
                                    <span style="font-weight: 700; font-size: var(--font-size-sm);">
                                        ${deal.probability}%
                                    </span>
                                </div>
                            </td>
                            <td style="padding: 12px;">${deal.closeDate}</td>
                            <td style="padding: 12px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="user-avatar" style="width: 28px; height: 28px;">
                                        ${deal.owner.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span style="font-size: var(--font-size-sm);">${deal.owner}</span>
                                </div>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <div style="display: flex; gap: 4px; justify-content: center;">
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.viewDeal('${deal.id}')" title="Ver deal">
                                        <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                                    </button>
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.editDeal('${deal.id}')" title="Editar">
                                        <i data-lucide="edit" style="width: 16px; height: 16px;"></i>
                                    </button>
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.dealActivity('${deal.id}')" title="Actividad">
                                        <i data-lucide="activity" style="width: 16px; height: 16px;"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderReportCategories() {
        const categories = [
            {
                title: 'Sales Performance',
                description: 'Reportes de rendimiento de ventas y equipos',
                icon: 'trending-up',
                color: 'var(--mep-success)',
                reports: ['Revenue Analysis', 'Team Performance', 'Pipeline Velocity']
            },
            {
                title: 'Customer Analytics',
                description: 'Análisis de comportamiento y segmentación',
                icon: 'users',
                color: 'var(--mep-info)',
                reports: ['Customer Lifetime Value', 'Churn Analysis', 'Segmentation']
            },
            {
                title: 'Marketing ROI',
                description: 'Efectividad de campañas y canales',
                icon: 'target',
                color: 'var(--mep-warning)',
                reports: ['Campaign Performance', 'Lead Attribution', 'Cost per Acquisition']
            }
        ];

        return categories.map(category => `
            <div class="chart-container" style="cursor: pointer; transition: all 0.2s;" 
                 onclick="crmModule.showReportCategory('${category.title}')"
                 onmouseover="this.style.transform='translateY(-5px)'"
                 onmouseout="this.style.transform='translateY(0)'">
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                    <div style="width: 60px; height: 60px; background: ${category.color}; border-radius: var(--radius-lg); 
                               display: flex; align-items: center; justify-content: center; color: white;">
                        <i data-lucide="${category.icon}" style="width: 28px; height: 28px;"></i>
                    </div>
                    <div>
                        <h3 style="font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary); margin-bottom: 4px;">
                            ${category.title}
                        </h3>
                        <p style="color: var(--text-secondary); font-size: var(--font-size-sm);">
                            ${category.description}
                        </p>
                    </div>
                </div>
                
                <div style="space-y-2;">
                    ${category.reports.map(report => `
                        <div style="padding: 8px 12px; background: var(--bg-secondary); border-radius: var(--radius-md); 
                                   font-size: var(--font-size-sm); color: var(--text-secondary);">
                            • ${report}
                        </div>
                    `).join('')}
                </div>
                
                <div style="margin-top: 16px; text-align: right;">
                    <span style="color: ${category.color}; font-weight: 600; font-size: var(--font-size-sm);">
                        Ver reportes →
                    </span>
                </div>
            </div>
        `).join('');
    }

    renderReportsTable() {
        const reports = [
            { name: 'Monthly Sales Report', type: 'Sales', schedule: 'Mensual', lastRun: '2025-05-01', status: 'completed', owner: 'Beatriz Tudela' },
            { name: 'Pipeline Forecast', type: 'Analytics', schedule: 'Semanal', lastRun: '2025-05-27', status: 'completed', owner: 'Francisco Gallego' },
            { name: 'Customer Health Score', type: 'Customer', schedule: 'Diario', lastRun: '2025-05-29', status: 'running', owner: 'Mari Carmen Lay' },
            { name: 'Marketing Attribution', type: 'Marketing', schedule: 'Semanal', lastRun: '2025-05-26', status: 'failed', owner: 'Luis Martín' }
        ];

        return `
            <table class="table" style="width: 100%;">
                <thead>
                    <tr style="background: var(--bg-tertiary);">
                        <th style="padding: 12px; text-align: left;">Reporte</th>
                        <th style="padding: 12px; text-align: center;">Tipo</th>
                        <th style="padding: 12px; text-align: center;">Frecuencia</th>
                        <th style="padding: 12px; text-align: left;">Última Ejecución</th>
                        <th style="padding: 12px; text-align: center;">Estado</th>
                        <th style="padding: 12px; text-align: left;">Owner</th>
                        <th style="padding: 12px; text-align: center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    ${reports.map(report => `
                        <tr style="border-bottom: 1px solid var(--border-secondary);">
                            <td style="padding: 12px;">
                                <div style="font-weight: 700; color: var(--text-primary);">
                                    ${report.name}
                                </div>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <span class="badge badge-info" style="font-size: var(--font-size-xs);">
                                    ${report.type}
                                </span>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <span style="background: var(--bg-tertiary); padding: 4px 8px; border-radius: var(--radius-md); 
                                            font-size: var(--font-size-xs); font-weight: 600;">
                                    ${report.schedule}
                                </span>
                            </td>
                            <td style="padding: 12px;">${report.lastRun}</td>
                            <td style="padding: 12px; text-align: center;">
                                <span class="badge badge-${report.status === 'completed' ? 'success' : report.status === 'running' ? 'warning' : 'error'}">
                                    ${report.status === 'completed' ? 'Completado' : report.status === 'running' ? 'Ejecutando' : 'Error'}
                                </span>
                            </td>
                            <td style="padding: 12px;">
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <div class="user-avatar" style="width: 28px; height: 28px;">
                                        ${report.owner.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <span style="font-size: var(--font-size-sm);">${report.owner}</span>
                                </div>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <div style="display: flex; gap: 4px; justify-content: center;">
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.viewReport('${report.name}')" title="Ver reporte">
                                        <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                                    </button>
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.downloadReport('${report.name}')" title="Descargar">
                                        <i data-lucide="download" style="width: 16px; height: 16px;"></i>
                                    </button>
                                    <button class="btn btn-sm btn-ghost" onclick="crmModule.editReport('${report.name}')" title="Editar">
                                        <i data-lucide="edit" style="width: 16px; height: 16px;"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderModals() {
        return `
            <!-- New Lead Modal -->
            <div id="newLeadModal" class="modal" style="display: none;">
                <div class="modal-content">
                    <h2>Nuevo Lead</h2>
                    <form>
                        <div class="form-group">
                            <label>Empresa</label>
                            <input type="text" class="form-input" placeholder="Nombre de la empresa">
                        </div>
                        <div class="form-group">
                            <label>Contacto</label>
                            <input type="text" class="form-input" placeholder="Nombre del contacto">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" class="form-input" placeholder="email@empresa.com">
                        </div>
                        <div class="form-group">
                            <label>Valor Estimado</label>
                            <input type="number" class="form-input" placeholder="0">
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="crmModule.closeModal('newLeadModal')">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Crear Lead</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // ===== CRM FUNCTIONALITY METHODS =====

    initializeCRM() {
        this.loadCRMData();
        this.setupEventHandlers();
        this.initializeCharts();
        window.crmModule = this;
        console.log('CRM Enterprise Suite initialized');
    }
    

    loadCRMData() {
        // Simulate loading comprehensive CRM data
        this.data = {
            leads: this.generateMockLeads(),
            contacts: this.generateMockContacts(),
            companies: this.generateMockCompanies(),
            deals: this.generateMockDeals(),
            activities: this.generateMockActivities(),
            analytics: this.generateMockAnalytics()
        };
    }

    generateMockLeads() {
        return [
            { id: 'L001', name: 'TechInnovate S.L.', contact: 'María García', email: 'maria@techinnovate.com', score: 94, status: 'hot', source: 'Website', value: 125000, assigned: 'Beatriz Tudela', created: '2025-05-25' },
            { id: 'L002', name: 'Digital Solutions', contact: 'Carlos Ruiz', email: 'carlos@digitalsol.com', score: 87, status: 'warm', source: 'Referral', value: 89000, assigned: 'Francisco Gallego', created: '2025-05-24' }
        ];
    }

    generateMockContacts() {
        return [
            { id: 'C001', name: 'María García López', email: 'maria@techinnovate.com', phone: '+34 666 123 456', company: 'TechInnovate S.L.', role: 'CTO', status: 'active', lastContact: '2025-05-28' }
        ];
    }

    generateMockCompanies() {
        return [
            { id: 'COMP001', name: 'TechSolutions Inc.', industry: 'Tecnología', size: '500-1000', revenue: 2500000, healthScore: 9.2, type: 'Enterprise', contacts: 15, deals: 3 }
        ];
    }

    generateMockDeals() {
        return [
            { id: 'D001', title: 'Enterprise ERP Implementation', company: 'TechSolutions Inc.', value: 234000, stage: 'negotiation', probability: 85, closeDate: '2025-06-15', owner: 'Beatriz Tudela' }
        ];
    }

    generateMockActivities() {
        return [];
    }

    generateMockAnalytics() {
        return {};
    }

    setupEventHandlers() {
        // Tab switching
        window.crmModule = this;
        
        // Global CRM methods
        this.setupGlobalMethods();
    }

    setupGlobalMethods() {
        // Tab navigation
        window.switchCRMTab = (tab) => this.switchTab(tab);
        
        // Filter methods
        window.updateFilter = (type, value) => this.updateFilter(type, value);
        window.exportDashboard = () => this.exportDashboard();
        
        // Chart methods
        window.switchChartView = (chart, view) => this.switchChartView(chart, view);
        window.refreshChart = (chart) => this.refreshChart(chart);
        
        // Lead methods
        window.showNewLeadModal = () => this.showNewLeadModal();
        window.viewLead = (id) => this.viewLead(id);
        window.editLead = (id) => this.editLead(id);
        window.convertLead = (id) => this.convertLead(id);
        window.importLeads = () => this.importLeads();
        window.leadScoring = () => this.leadScoring();
        window.switchLeadView = (view) => this.switchLeadView(view);
        
        // Contact methods
        window.showNewContactModal = () => this.showNewContactModal();
        window.viewContact = (id) => this.viewContact(id);
        window.editContact = (id) => this.editContact(id);
        window.emailContact = (id) => this.emailContact(id);
        window.callContact = (id) => this.callContact(id);
        window.importContacts = () => this.importContacts();
        window.exportContacts = () => this.exportContacts();
        
        // Company methods
        window.showNewCompanyModal = () => this.showNewCompanyModal();
        window.viewCompany = (id) => this.viewCompany(id);
        window.editCompany = (id) => this.editCompany(id);
        window.companyDashboard = (id) => this.companyDashboard(id);
        window.territoryManagement = () => this.territoryManagement();
        window.companyAnalytics = () => this.companyAnalytics();
        
        // Deal methods
        window.showNewDealModal = () => this.showNewDealModal();
        window.viewDeal = (id) => this.viewDeal(id);
        window.editDeal = (id) => this.editDeal(id);
        window.dealActivity = (id) => this.dealActivity(id);
        window.forecastAnalysis = () => this.forecastAnalysis();
        window.pipelineSettings = () => this.pipelineSettings();
        window.switchPipelineView = (view) => this.switchPipelineView(view);
        
        // Analytics methods
        window.scheduleReport = () => this.scheduleReport();
        window.customAnalysis = () => this.customAnalysis();
        window.switchAnalyticsView = (view) => this.switchAnalyticsView(view);
        
        // Report methods
        window.createCustomReport = () => this.createCustomReport();
        window.showReportCategory = (category) => this.showReportCategory(category);
        window.viewReport = (name) => this.viewReport(name);
        window.downloadReport = (name) => this.downloadReport(name);
        window.editReport = (name) => this.editReport(name);
        
        // Modal methods
        window.closeModal = (modalId) => this.closeModal(modalId);
        
        // Pipeline methods
        window.drillDownStage = (stage) => this.drillDownStage(stage);
        window.refreshPipeline = () => this.refreshPipeline();
    }

    initializeCharts() {
        // Initialize any interactive charts
        console.log('Initializing CRM charts...');
    }

    // ===== TAB MANAGEMENT =====

    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Update tab buttons
        document.querySelectorAll('.crm-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update tab content
        document.querySelectorAll('.crm-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `crm-${tabName}`);
        });
        
        // Tab-specific initialization
        this.initializeTab(tabName);
        
        // Reinitialize icons
        if (window.app && window.app.initIcons) {
            window.app.initIcons();
        }
    }

    initializeTab(tabName) {
        switch(tabName) {
            case 'dashboard':
                this.refreshDashboard();
                break;
            case 'analytics':
                this.refreshAnalytics();
                break;
            case 'pipeline':
                this.refreshPipeline();
                break;
            case 'leads':
                this.refreshLeads();
                break;
            case 'contacts':
                this.refreshContacts();
                break;
            case 'companies':
                this.refreshCompanies();
                break;
            case 'deals':
                this.refreshDeals();
                break;
            case 'reports':
                this.refreshReports();
                break;
        }
    }

    // ===== FILTER MANAGEMENT =====

    updateFilter(type, value) {
        this.filters[type] = value;
        this.refreshCurrentTab();
        console.log(`Filter updated: ${type} = ${value}`);
    }

    refreshCurrentTab() {
        this.initializeTab(this.currentTab);
    }

    // ===== DASHBOARD METHODS =====

    refreshDashboard() {
        console.log('Refreshing CRM dashboard...');
        this.updateDashboardMetrics();
    }

    updateDashboardMetrics() {
        // Update dashboard with current data
        console.log('Updating dashboard metrics...');
    }

    exportDashboard() {
        this.showNotification('Export', 'Exportando dashboard...', 'info');
    }

    switchChartView(chart, view) {
        console.log(`Switching ${chart} chart to ${view} view`);
        this.showNotification('Chart Update', `Cambiando vista de ${chart} a ${view}`, 'info');
    }

    refreshChart(chart) {
        console.log(`Refreshing ${chart} chart`);
        this.showNotification('Chart Refresh', `Actualizando gráfico ${chart}`, 'info');
    }

    // ===== ANALYTICS METHODS =====

    refreshAnalytics() {
        console.log('Refreshing analytics...');
    }

    scheduleReport() {
        this.showNotification('Programar Reporte', 'Abriendo programador de reportes...', 'info');
    }

    customAnalysis() {
        this.showNotification('Análisis Personalizado', 'Iniciando análisis personalizado...', 'info');
    }

    switchAnalyticsView(view) {
        console.log(`Switching analytics view to: ${view}`);
        
        // Update view buttons
        document.querySelectorAll('#crm-analytics .btn-ghost').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // Update view content
        document.querySelectorAll('.analytics-view').forEach(v => {
            v.classList.toggle('active', v.id === `analytics-${view}`);
        });
    }

    // ===== PIPELINE METHODS =====

    refreshPipeline() {
        console.log('Refreshing pipeline...');
        this.showNotification('Pipeline', 'Actualizando pipeline...', 'info');
    }

    pipelineSettings() {
        this.showNotification('Configuración', 'Abriendo configuración del pipeline...', 'info');
    }

    forecastAnalysis() {
        this.showNotification('Forecast', 'Generando análisis de forecast...', 'info');
    }

    switchPipelineView(view) {
        console.log(`Switching pipeline view to: ${view}`);
        this.showNotification('Pipeline View', `Cambiando a vista ${view}`, 'info');
    }

    drillDownStage(stage) {
        console.log(`Drilling down into stage: ${stage}`);
        this.showNotification('Pipeline Analysis', `Analizando stage: ${stage}`, 'info');
    }

    // ===== LEAD METHODS =====

    refreshLeads() {
        console.log('Refreshing leads...');
    }

    showNewLeadModal() {
        this.showModal('newLeadModal');
    }

    viewLead(id) {
        console.log(`Viewing lead: ${id}`);
        this.showNotification('Lead', `Mostrando detalles del lead ${id}`, 'info');
    }

    editLead(id) {
        console.log(`Editing lead: ${id}`);
        this.showNotification('Lead', `Editando lead ${id}`, 'info');
    }

    convertLead(id) {
        console.log(`Converting lead: ${id}`);
        this.showNotification('Conversión', `Convirtiendo lead ${id} a cliente`, 'success');
    }

    importLeads() {
        this.showNotification('Importar', 'Abriendo importador de leads...', 'info');
    }

    leadScoring() {
        this.showNotification('Lead Scoring', 'Abriendo configuración de lead scoring...', 'info');
    }

    switchLeadView(view) {
        console.log(`Switching lead view to: ${view}`);
        this.showNotification('Lead View', `Cambiando a vista ${view}`, 'info');
    }

    // ===== CONTACT METHODS =====

    refreshContacts() {
        console.log('Refreshing contacts...');
    }

    showNewContactModal() {
        this.showNotification('Nuevo Contacto', 'Abriendo formulario de nuevo contacto...', 'info');
    }

    viewContact(id) {
        console.log(`Viewing contact: ${id}`);
        this.showNotification('Contacto', `Mostrando perfil del contacto ${id}`, 'info');
    }

    editContact(id) {
        console.log(`Editing contact: ${id}`);
        this.showNotification('Contacto', `Editando contacto ${id}`, 'info');
    }

    emailContact(id) {
        console.log(`Emailing contact: ${id}`);
        this.showNotification('Email', `Abriendo email para contacto ${id}`, 'info');
    }

    callContact(id) {
        console.log(`Calling contact: ${id}`);
        this.showNotification('Llamada', `Iniciando llamada a contacto ${id}`, 'info');
    }

    importContacts() {
        this.showNotification('Importar', 'Abriendo importador de contactos...', 'info');
    }

    exportContacts() {
        this.showNotification('Exportar', 'Exportando contactos...', 'info');
    }

    // ===== COMPANY METHODS =====

    refreshCompanies() {
        console.log('Refreshing companies...');
    }

    showNewCompanyModal() {
        this.showNotification('Nueva Empresa', 'Abriendo formulario de nueva empresa...', 'info');
    }

    viewCompany(id) {
        console.log(`Viewing company: ${id}`);
        this.showNotification('Empresa', `Mostrando perfil de empresa ${id}`, 'info');
    }

    editCompany(id) {
        console.log(`Editing company: ${id}`);
        this.showNotification('Empresa', `Editando empresa ${id}`, 'info');
    }

    companyDashboard(id) {
        console.log(`Opening company dashboard: ${id}`);
        this.showNotification('Dashboard', `Abriendo dashboard de empresa ${id}`, 'info');
    }

    territoryManagement() {
        this.showNotification('Territorios', 'Abriendo gestión territorial...', 'info');
    }

    companyAnalytics() {
        this.showNotification('Analytics', 'Abriendo analytics de empresas...', 'info');
    }

    // ===== DEAL METHODS =====

    refreshDeals() {
        console.log('Refreshing deals...');
    }

    showNewDealModal() {
        this.showNotification('Nuevo Deal', 'Abriendo formulario de nuevo deal...', 'info');
    }

    viewDeal(id) {
        console.log(`Viewing deal: ${id}`);
        this.showNotification('Deal', `Mostrando detalles del deal ${id}`, 'info');
    }

    editDeal(id) {
        console.log(`Editing deal: ${id}`);
        this.showNotification('Deal', `Editando deal ${id}`, 'info');
    }

    dealActivity(id) {
        console.log(`Viewing deal activity: ${id}`);
        this.showNotification('Actividad', `Mostrando actividad del deal ${id}`, 'info');
    }

    // ===== REPORT METHODS =====

    refreshReports() {
        console.log('Refreshing reports...');
    }

    createCustomReport() {
        this.showNotification('Nuevo Reporte', 'Abriendo creador de reportes personalizados...', 'info');
    }

    showReportCategory(category) {
        console.log(`Showing report category: ${category}`);
        this.showNotification('Reportes', `Mostrando categoría: ${category}`, 'info');
    }

    viewReport(name) {
        console.log(`Viewing report: ${name}`);
        this.showNotification('Reporte', `Abriendo reporte: ${name}`, 'info');
    }

    downloadReport(name) {
        console.log(`Downloading report: ${name}`);
        this.showNotification('Descarga', `Descargando reporte: ${name}`, 'success');
    }

    editReport(name) {
        console.log(`Editing report: ${name}`);
        this.showNotification('Editar', `Editando reporte: ${name}`, 'info');
    }

    // ===== UTILITY METHODS =====

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showNotification(title, message, type = 'info') {
        // Use global notification system if available
        if (window.showNotification) {
            window.showNotification(title, message, type);
        } else {
            console.log(`${title}: ${message}`);
        }
    }

    // ===== DATA CALCULATION METHODS =====

    calculateRevenue() {
        return this.data.deals
            .filter(d => d.stage === 'closed_won')
            .reduce((sum, d) => sum + d.value, 0);
    }

    calculateConversionRate() {
        const totalLeads = this.data.leads.length;
        const convertedLeads = this.data.leads.filter(l => l.status === 'converted').length;
        return totalLeads > 0 ? (convertedLeads / totalLeads * 100).toFixed(1) : 0;
    }

    calculatePipelineValue() {
        return this.data.deals
            .filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
            .reduce((sum, d) => sum + d.value, 0);
    }

    async afterRender() {
        console.log('CRM Enterprise Suite fully initialized');
        
        // Initialize icons if available
        if (window.app && window.app.initIcons) {
            setTimeout(() => window.app.initIcons(), 100);
        }
    }
    renderSalesCycleAnalysis() { return ''; }
renderWinRateAnalysis() { return ''; }
renderVelocityAnalysis() { return ''; }
renderStageConversion() { return ''; }
}

// Export the module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CRMModule;
}