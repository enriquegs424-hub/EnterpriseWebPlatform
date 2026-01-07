// ===== INVENTORY MODULE =====
// Módulo de Gestión de Inventario integrado con MEP-Projects

class InventoryModule {
    constructor() {
        this.moduleId = 'inventory';
        this.currentTab = 'dashboard';
        this.data = {};
        this.isInitialized = false;
        this.products = [];
        this.categories = [];
        this.warehouses = [];
        this.suppliers = [];
        this.movements = [];
        this.filters = {
            search: '',
            category: '',
            status: '',
            warehouse: ''
        };
    }

    async render(container) {
        try {
            console.log('📦 Renderizando módulo de Inventario...');

            // Crear estructura del módulo de Inventario
            const inventoryHTML = `
                <div class="inventory-module">
                    <!-- Header del módulo -->
                    <div class="module-header">
                        <div class="module-title">
                            <h1>Gestión de Inventario</h1>
                            <p>Control de stock, productos y almacenes</p>
                        </div>
                        <div class="module-actions">
                            <button class="btn btn-secondary" onclick="window.app.modules.inventory.refreshData()">
                                <i data-lucide="refresh-cw"></i>
                                Actualizar
                            </button>
                            <button class="btn btn-primary" onclick="window.app.modules.inventory.addProduct()">
                                <i data-lucide="plus"></i>
                                Nuevo Producto
                            </button>
                        </div>
                    </div>

                    <!-- Navegación por pestañas -->
                    <div class="inventory-navigation">
                        <nav class="tab-navigation">
                            <button class="tab-btn active" data-tab="dashboard">
                                <i data-lucide="layout-dashboard"></i>
                                Dashboard
                            </button>
                            <button class="tab-btn" data-tab="products">
                                <i data-lucide="package"></i>
                                Productos
                            </button>
                            <button class="tab-btn" data-tab="categories">
                                <i data-lucide="tag"></i>
                                Categorías
                            </button>
                            <button class="tab-btn" data-tab="warehouses">
                                <i data-lucide="warehouse"></i>
                                Almacenes
                            </button>
                            <button class="tab-btn" data-tab="movements">
                                <i data-lucide="arrow-right-left"></i>
                                Movimientos
                            </button>
                            <button class="tab-btn" data-tab="suppliers">
                                <i data-lucide="truck"></i>
                                Proveedores
                            </button>
                            <button class="tab-btn" data-tab="reports">
                                <i data-lucide="bar-chart-3"></i>
                                Informes
                            </button>
                        </nav>
                    </div>

                    <!-- Contenido de las pestañas -->
                    <div class="inventory-content">
                        <!-- Dashboard Tab -->
                        <div class="tab-panel active" data-panel="dashboard">
                            <div class="inventory-dashboard">
                                <!-- KPIs principales -->
                                <div class="stats-grid">
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="package"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Total Productos</h3>
                                            <div class="stat-value">1,247</div>
                                            <div class="stat-change positive">+23 este mes</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon warning">
                                            <i data-lucide="alert-triangle"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Stock Bajo</h3>
                                            <div class="stat-value">45</div>
                                            <div class="stat-change warning">Requiere atención</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon danger">
                                            <i data-lucide="x-circle"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Sin Stock</h3>
                                            <div class="stat-value">12</div>
                                            <div class="stat-change danger">Crítico</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="euro"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Valor Total</h3>
                                            <div class="stat-value">€456,890</div>
                                            <div class="stat-change positive">+8.5% vs mes anterior</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Widgets del dashboard -->
                                <div class="dashboard-widgets">
                                    <!-- Widget: Alertas de stock -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Alertas de Stock</h3>
                                            <span class="badge badge-error">12</span>
                                        </div>
                                        <div class="widget-content">
                                            <div class="stock-alerts" id="stock-alerts-list">
                                                <!-- Las alertas se cargan dinámicamente -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Widget: Productos más vendidos -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Productos Más Vendidos</h3>
                                            <button class="btn btn-ghost btn-sm" onclick="window.app.modules.inventory.switchToTab('products')">Ver todos</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="top-products" id="top-products-list">
                                                <!-- Los productos se cargan dinámicamente -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Widget: Movimientos recientes -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Movimientos Recientes</h3>
                                            <button class="btn btn-ghost btn-sm" onclick="window.app.modules.inventory.switchToTab('movements')">Ver historial</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="recent-movements" id="recent-movements-list">
                                                <!-- Los movimientos se cargan dinámicamente -->
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Widget: Estado de almacenes -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Estado de Almacenes</h3>
                                            <button class="btn btn-ghost btn-sm" onclick="window.app.modules.inventory.switchToTab('warehouses')">Gestionar</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="warehouses-status" id="warehouses-status-list">
                                                <!-- Los almacenes se cargan dinámicamente -->
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Products Tab -->
                        <div class="tab-panel" data-panel="products">
                            <div class="inventory-products">
                                <div class="section-header">
                                    <h2>Gestión de Productos</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.inventory.importProducts()">
                                            <i data-lucide="upload"></i>
                                            Importar
                                        </button>
                                        <button class="btn btn-secondary" onclick="window.app.modules.inventory.exportProducts()">
                                            <i data-lucide="download"></i>
                                            Exportar
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.inventory.addProduct()">
                                            <i data-lucide="plus"></i>
                                            Nuevo Producto
                                        </button>
                                    </div>
                                </div>

                                <!-- Filtros y búsqueda -->
                                <div class="products-filters">
                                    <div class="filter-group">
                                        <input type="text" placeholder="Buscar productos..." class="search-input" id="product-search">
                                        <select class="filter-select" id="category-filter">
                                            <option value="">Todas las categorías</option>
                                        </select>
                                        <select class="filter-select" id="status-filter">
                                            <option value="">Todos los estados</option>
                                            <option value="in-stock">En stock</option>
                                            <option value="low-stock">Stock bajo</option>
                                            <option value="out-of-stock">Sin stock</option>
                                        </select>
                                        <select class="filter-select" id="warehouse-filter">
                                            <option value="">Todos los almacenes</option>
                                        </select>
                                        <button class="btn btn-secondary" onclick="window.app.modules.inventory.applyFilters()">
                                            <i data-lucide="filter"></i>
                                            Filtrar
                                        </button>
                                        <button class="btn btn-ghost" onclick="window.app.modules.inventory.clearFilters()">
                                            <i data-lucide="x"></i>
                                            Limpiar
                                        </button>
                                    </div>
                                </div>

                                <!-- Quick stats -->
                                <div class="products-quick-stats" id="products-quick-stats">
                                    <!-- Las estadísticas se cargan dinámicamente -->
                                </div>

                                <!-- Tabla de productos -->
                                <div class="products-table">
                                    <div class="table-controls">
                                        <div class="table-controls-left">
                                            <select class="items-per-page" id="items-per-page">
                                                <option value="10">10 por página</option>
                                                <option value="25" selected>25 por página</option>
                                                <option value="50">50 por página</option>
                                                <option value="100">100 por página</option>
                                            </select>
                                        </div>
                                        <div class="table-controls-right">
                                            <button class="btn btn-ghost btn-sm" onclick="window.app.modules.inventory.toggleView('table')">
                                                <i data-lucide="table"></i>
                                            </button>
                                            <button class="btn btn-ghost btn-sm" onclick="window.app.modules.inventory.toggleView('grid')">
                                                <i data-lucide="grid-3x3"></i>
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <table class="data-table" id="products-table">
                                        <thead>
                                            <tr>
                                                <th>
                                                    <input type="checkbox" id="select-all-products">
                                                </th>
                                                <th class="sortable" data-sort="name">
                                                    Producto
                                                    <i data-lucide="chevron-up-down"></i>
                                                </th>
                                                <th class="sortable" data-sort="sku">
                                                    SKU
                                                    <i data-lucide="chevron-up-down"></i>
                                                </th>
                                                <th class="sortable" data-sort="category">
                                                    Categoría
                                                    <i data-lucide="chevron-up-down"></i>
                                                </th>
                                                <th class="sortable" data-sort="stock">
                                                    Stock
                                                    <i data-lucide="chevron-up-down"></i>
                                                </th>
                                                <th class="sortable" data-sort="price">
                                                    Precio
                                                    <i data-lucide="chevron-up-down"></i>
                                                </th>
                                                <th>Almacén</th>
                                                <th>Estado</th>
                                                <th class="sortable" data-sort="updated">
                                                    Última actualización
                                                    <i data-lucide="chevron-up-down"></i>
                                                </th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="products-tbody">
                                            <!-- Los productos se cargan dinámicamente -->
                                        </tbody>
                                    </table>
                                </div>

                                <!-- Paginación -->
                                <div class="pagination" id="products-pagination">
                                    <!-- La paginación se genera dinámicamente -->
                                </div>
                            </div>
                        </div>

                        <!-- Categories Tab -->
                        <div class="tab-panel" data-panel="categories">
                            <div class="inventory-categories">
                                <div class="section-header">
                                    <h2>Gestión de Categorías</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.inventory.exportCategories()">
                                            <i data-lucide="download"></i>
                                            Exportar
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.inventory.addCategory()">
                                            <i data-lucide="plus"></i>
                                            Nueva Categoría
                                        </button>
                                    </div>
                                </div>

                                <!-- Búsqueda de categorías -->
                                <div class="categories-search">
                                    <input type="text" placeholder="Buscar categorías..." class="search-input" id="category-search">
                                </div>

                                <!-- Grid de categorías -->
                                <div class="categories-grid" id="categories-grid">
                                    <!-- Las categorías se cargan dinámicamente -->
                                </div>
                            </div>
                        </div>

                        <!-- Warehouses Tab -->
                        <div class="tab-panel" data-panel="warehouses">
                            <div class="inventory-warehouses">
                                <div class="section-header">
                                    <h2>Gestión de Almacenes</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.inventory.generateWarehouseReport()">
                                            <i data-lucide="file-text"></i>
                                            Informe
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.inventory.addWarehouse()">
                                            <i data-lucide="plus"></i>
                                            Nuevo Almacén
                                        </button>
                                    </div>
                                </div>

                                <!-- Stats de almacenes -->
                                <div class="warehouses-stats">
                                    <div class="stat-grid">
                                        <div class="stat-item">
                                            <div class="stat-label">Total Almacenes</div>
                                            <div class="stat-value" id="total-warehouses">3</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Capacidad Total</div>
                                            <div class="stat-value" id="total-capacity">10,000</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Ocupación Promedio</div>
                                            <div class="stat-value" id="avg-occupation">68%</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Eficiencia</div>
                                            <div class="stat-value" id="warehouse-efficiency">92%</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Lista de almacenes -->
                                <div class="warehouses-list" id="warehouses-list">
                                    <!-- Los almacenes se cargan dinámicamente -->
                                </div>
                            </div>
                        </div>

                        <!-- Movements Tab -->
                        <div class="tab-panel" data-panel="movements">
                            <div class="inventory-movements">
                                <div class="section-header">
                                    <h2>Movimientos de Inventario</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.inventory.exportMovements()">
                                            <i data-lucide="download"></i>
                                            Exportar
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.inventory.addMovement()">
                                            <i data-lucide="plus"></i>
                                            Nuevo Movimiento
                                        </button>
                                    </div>
                                </div>

                                <!-- Filtros de movimientos -->
                                <div class="movements-filters">
                                    <div class="filter-group">
                                        <select class="filter-select" id="movement-type-filter">
                                            <option value="">Todos los tipos</option>
                                            <option value="in">Entrada</option>
                                            <option value="out">Salida</option>
                                            <option value="transfer">Transferencia</option>
                                            <option value="adjustment">Ajuste</option>
                                        </select>
                                        <input type="date" class="filter-input" id="movement-date-from" placeholder="Desde">
                                        <input type="date" class="filter-input" id="movement-date-to" placeholder="Hasta">
                                        <select class="filter-select" id="movement-warehouse-filter">
                                            <option value="">Todos los almacenes</option>
                                        </select>
                                        <button class="btn btn-secondary" onclick="window.app.modules.inventory.applyMovementFilters()">
                                            <i data-lucide="filter"></i>
                                            Filtrar
                                        </button>
                                    </div>
                                </div>

                                <!-- Stats de movimientos -->
                                <div class="movements-stats">
                                    <div class="stat-grid">
                                        <div class="stat-item">
                                            <div class="stat-label">Movimientos Hoy</div>
                                            <div class="stat-value" id="movements-today">24</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Esta Semana</div>
                                            <div class="stat-value" id="movements-week">156</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Este Mes</div>
                                            <div class="stat-value" id="movements-month">678</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Valor Movido</div>
                                            <div class="stat-value" id="movements-value">€45,280</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Tabla de movimientos -->
                                <div class="movements-table">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Fecha/Hora</th>
                                                <th>Tipo</th>
                                                <th>Producto</th>
                                                <th>Cantidad</th>
                                                <th>Origen</th>
                                                <th>Destino</th>
                                                <th>Usuario</th>
                                                <th>Motivo</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="movements-tbody">
                                            <!-- Los movimientos se cargan dinámicamente -->
                                        </tbody>
                                    </table>
                                </div>

                                <!-- Paginación -->
                                <div class="pagination" id="movements-pagination">
                                    <!-- La paginación se genera dinámicamente -->
                                </div>
                            </div>
                        </div>

                        <!-- Suppliers Tab -->
                        <div class="tab-panel" data-panel="suppliers">
                            <div class="inventory-suppliers">
                                <div class="section-header">
                                    <h2>Gestión de Proveedores</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.inventory.exportSuppliers()">
                                            <i data-lucide="download"></i>
                                            Exportar
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.inventory.addSupplier()">
                                            <i data-lucide="plus"></i>
                                            Nuevo Proveedor
                                        </button>
                                    </div>
                                </div>

                                <!-- Búsqueda de proveedores -->
                                <div class="suppliers-search">
                                    <input type="text" placeholder="Buscar proveedores..." class="search-input" id="supplier-search">
                                </div>

                                <!-- Stats de proveedores -->
                                <div class="suppliers-stats">
                                    <div class="stat-grid">
                                        <div class="stat-item">
                                            <div class="stat-label">Total Proveedores</div>
                                            <div class="stat-value" id="total-suppliers">25</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Activos</div>
                                            <div class="stat-value" id="active-suppliers">22</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Pedidos Pendientes</div>
                                            <div class="stat-value" id="pending-orders">8</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Evaluación Promedio</div>
                                            <div class="stat-value" id="avg-rating">4.2</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Lista de proveedores -->
                                <div class="suppliers-grid" id="suppliers-grid">
                                    <!-- Los proveedores se cargan dinámicamente -->
                                </div>
                            </div>
                        </div>

                        <!-- Reports Tab -->
                        <div class="tab-panel" data-panel="reports">
                            <div class="inventory-reports">
                                <div class="section-header">
                                    <h2>Informes de Inventario</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.inventory.scheduleReport()">
                                            <i data-lucide="calendar"></i>
                                            Programar
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.inventory.generateCustomReport()">
                                            <i data-lucide="plus"></i>
                                            Informe Personalizado
                                        </button>
                                    </div>
                                </div>

                                <!-- Filtros de informes -->
                                <div class="report-filters">
                                    <div class="filter-group">
                                        <select class="filter-select" id="report-period">
                                            <option value="today">Hoy</option>
                                            <option value="week">Esta semana</option>
                                            <option value="month" selected>Este mes</option>
                                            <option value="quarter">Este trimestre</option>
                                            <option value="year">Este año</option>
                                            <option value="custom">Personalizado</option>
                                        </select>
                                        <select class="filter-select" id="report-type">
                                            <option value="">Todos los informes</option>
                                            <option value="stock">Stock</option>
                                            <option value="movements">Movimientos</option>
                                            <option value="valuation">Valoración</option>
                                            <option value="performance">Rendimiento</option>
                                        </select>
                                        <button class="btn btn-secondary" onclick="window.app.modules.inventory.updateReports()">
                                            <i data-lucide="refresh-cw"></i>
                                            Actualizar
                                        </button>
                                    </div>
                                </div>

                                <!-- Grid de informes -->
                                <div class="reports-grid">
                                    <div class="report-card">
                                        <div class="report-icon">
                                            <i data-lucide="package"></i>
                                        </div>
                                        <div class="report-info">
                                            <h3>Informe de Stock</h3>
                                            <p>Estado actual del inventario por almacén</p>
                                            <div class="report-meta">
                                                <span>Última actualización: hace 2 horas</span>
                                                <button class="btn btn-sm btn-primary" onclick="window.app.modules.inventory.generateStockReport()">
                                                    Generar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="report-card">
                                        <div class="report-icon">
                                            <i data-lucide="trending-up"></i>
                                        </div>
                                        <div class="report-info">
                                            <h3>Análisis de Movimientos</h3>
                                            <p>Movimientos de inventario detallados</p>
                                            <div class="report-meta">
                                                <span>Última actualización: hace 1 hora</span>
                                                <button class="btn btn-sm btn-primary" onclick="window.app.modules.inventory.generateMovementReport()">
                                                    Generar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="report-card">
                                        <div class="report-icon">
                                            <i data-lucide="euro"></i>
                                        </div>
                                        <div class="report-info">
                                            <h3>Valoración de Inventario</h3>
                                            <p>Valor económico del inventario</p>
                                            <div class="report-meta">
                                                <span>Última actualización: hace 3 horas</span>
                                                <button class="btn btn-sm btn-primary" onclick="window.app.modules.inventory.generateValuationReport()">
                                                    Generar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="report-card">
                                        <div class="report-icon">
                                            <i data-lucide="alert-triangle"></i>
                                        </div>
                                        <div class="report-info">
                                            <h3>Alertas y Excepciones</h3>
                                            <p>Productos con stock bajo o sin stock</p>
                                            <div class="report-meta">
                                                <span>Actualización en tiempo real</span>
                                                <button class="btn btn-sm btn-primary" onclick="window.app.modules.inventory.generateAlertsReport()">
                                                    Generar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="report-card">
                                        <div class="report-icon">
                                            <i data-lucide="star"></i>
                                        </div>
                                        <div class="report-info">
                                            <h3>Rendimiento de Productos</h3>
                                            <p>Análisis ABC y productos más vendidos</p>
                                            <div class="report-meta">
                                                <span>Última actualización: ayer</span>
                                                <button class="btn btn-sm btn-primary" onclick="window.app.modules.inventory.generatePerformanceReport()">
                                                    Generar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="report-card">
                                        <div class="report-icon">
                                            <i data-lucide="truck"></i>
                                        </div>
                                        <div class="report-info">
                                            <h3>Evaluación de Proveedores</h3>
                                            <p>Rendimiento y calificación de proveedores</p>
                                            <div class="report-meta">
                                                <span>Última actualización: hace 1 día</span>
                                                <button class="btn btn-sm btn-primary" onclick="window.app.modules.inventory.generateSuppliersReport()">
                                                    Generar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- KPIs del inventario -->
                                <div class="inventory-kpis">
                                    <h3>Indicadores Clave de Rendimiento</h3>
                                    <div class="kpi-grid">
                                        <div class="kpi-card">
                                            <h4>Rotación de Inventario</h4>
                                            <div class="kpi-value">6.2x</div>
                                            <div class="kpi-trend positive">↑ 0.8x</div>
                                        </div>
                                        <div class="kpi-card">
                                            <h4>Tiempo Promedio de Stock</h4>
                                            <div class="kpi-value">58 días</div>
                                            <div class="kpi-trend positive">↓ 12 días</div>
                                        </div>
                                        <div class="kpi-card">
                                            <h4>Precisión de Inventario</h4>
                                            <div class="kpi-value">98.5%</div>
                                            <div class="kpi-trend positive">↑ 2.1%</div>
                                        </div>
                                        <div class="kpi-card">
                                            <h4>Coste de Almacenamiento</h4>
                                            <div class="kpi-value">12.3%</div>
                                            <div class="kpi-trend negative">↑ 0.5%</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Gráficos de tendencias -->
                                <div class="inventory-charts">
                                    <div class="chart-container">
                                        <h3>Evolución del Inventario (6 meses)</h3>
                                        <div class="chart-placeholder" id="inventory-trend-chart">
                                            <i data-lucide="bar-chart-3"></i>
                                            <p>Gráfico de evolución del inventario</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = inventoryHTML;
            this.isInitialized = true;

        } catch (error) {
            console.error('❌ Error renderizando módulo de Inventario:', error);
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i data-lucide="alert-triangle"></i>
                    </div>
                    <h3>Error al cargar Inventario</h3>
                    <p>No se pudo cargar el módulo de inventario. Inténtalo de nuevo.</p>
                    <button class="btn btn-primary" onclick="window.app.loadModule('inventory')">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    async afterRender() {
        try {
            console.log('🔧 Configurando módulo de Inventario...');
            
            // Setup tab navigation
            this.setupTabNavigation();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadData();
            
            // Render initial dashboard content
            this.renderDashboardContent();
            
            console.log('✅ Módulo de Inventario configurado correctamente');
            
        } catch (error) {
            console.error('❌ Error en afterRender del módulo de Inventario:', error);
        }
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.inventory-module .tab-btn');
        const tabPanels = document.querySelectorAll('.inventory-module .tab-panel');

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
                console.log(`📂 Cambiando a pestaña de inventario: ${targetTab}`);
                
                // Load tab-specific data
                this.loadTabData(targetTab);
            });
        });
    }

    setupEventListeners() {
        // Search functionality
        const productSearch = document.getElementById('product-search');
        if (productSearch) {
            productSearch.addEventListener('input', 
                this.debounce((e) => this.handleProductSearch(e.target.value), 300)
            );
        }

        const categorySearch = document.getElementById('category-search');
        if (categorySearch) {
            categorySearch.addEventListener('input', 
                this.debounce((e) => this.handleCategorySearch(e.target.value), 300)
            );
        }

        const supplierSearch = document.getElementById('supplier-search');
        if (supplierSearch) {
            supplierSearch.addEventListener('input', 
                this.debounce((e) => this.handleSupplierSearch(e.target.value), 300)
            );
        }

        // Filter changes
        const filters = ['category-filter', 'status-filter', 'warehouse-filter'];
        filters.forEach(filterId => {
            const filterElement = document.getElementById(filterId);
            if (filterElement) {
                filterElement.addEventListener('change', () => this.updateFilters());
            }
        });

        // Items per page
        const itemsPerPage = document.getElementById('items-per-page');
        if (itemsPerPage) {
            itemsPerPage.addEventListener('change', (e) => this.changeItemsPerPage(e.target.value));
        }

        // Select all checkbox
        const selectAll = document.getElementById('select-all-products');
        if (selectAll) {
            selectAll.addEventListener('change', (e) => this.toggleSelectAllProducts(e.target.checked));
        }

        // Table sorting
        const sortableHeaders = document.querySelectorAll('.sortable');
        sortableHeaders.forEach(header => {
            header.addEventListener('click', () => this.handleSort(header.dataset.sort));
        });
    }

    async loadData() {
        try {
            console.log('📊 Cargando datos de inventario...');
            
            // Simulate loading data - replace with actual API calls
            await new Promise(resolve => setTimeout(resolve, 800));
            
            this.data = {
                stats: {
                    totalProducts: 1247,
                    lowStock: 45,
                    outOfStock: 12,
                    totalValue: 456890,
                    productsAdded: 23
                },
                products: this.generateSampleProducts(),
                categories: this.generateSampleCategories(),
                warehouses: this.generateSampleWarehouses(),
                suppliers: this.generateSampleSuppliers(),
                movements: this.generateSampleMovements(),
                stockAlerts: this.generateStockAlerts(),
                topProducts: this.generateTopProducts(),
                recentMovements: this.generateRecentMovements()
            };
            
            console.log('📦 Datos de inventario cargados:', this.data);
            
        } catch (error) {
            console.error('❌ Error cargando datos de inventario:', error);
            if (window.app) {
                window.app.showNotification('Error al cargar datos del inventario', 'error');
            }
        }
    }

    generateSampleProducts() {
        return [
            {
                id: 1,
                sku: 'LAP-DELL-001',
                name: 'Laptop Dell XPS 13',
                description: 'Intel i7, 16GB RAM, 512GB SSD',
                category: 'Informática',
                stock: 23,
                minStock: 5,
                price: 1299.00,
                warehouse: 'Principal',
                status: 'in-stock',
                image: 'https://via.placeholder.com/40',
                updated: '2025-05-30',
                supplier: 'Dell Technologies'
            },
            {
                id: 2,
                sku: 'MOU-LOG-001',
                name: 'Mouse Logitech MX Master 3',
                description: 'Ratón inalámbrico profesional',
                category: 'Accesorios',
                stock: 5,
                minStock: 10,
                price: 99.99,
                warehouse: 'Principal',
                status: 'low-stock',
                image: 'https://via.placeholder.com/40',
                updated: '2025-05-29',
                supplier: 'Logitech'
            },
            {
                id: 3,
                sku: 'MON-LG-001',
                name: 'Monitor LG 27" 4K',
                description: 'Monitor profesional UltraHD',
                category: 'Electrónicos',
                stock: 0,
                minStock: 3,
                price: 349.99,
                warehouse: 'Principal',
                status: 'out-of-stock',
                image: 'https://via.placeholder.com/40',
                updated: '2025-05-28',
                supplier: 'LG Electronics'
            },
            {
                id: 4,
                sku: 'KEY-COR-001',
                name: 'Teclado Corsair K95 RGB',
                description: 'Teclado mecánico gaming',
                category: 'Accesorios',
                stock: 15,
                minStock: 8,
                price: 179.99,
                warehouse: 'Secundario',
                status: 'in-stock',
                image: 'https://via.placeholder.com/40',
                updated: '2025-05-30',
                supplier: 'Corsair'
            },
            {
                id: 5,
                sku: 'IPH-APP-001',
                name: 'iPhone 15 Pro',
                description: 'Smartphone Apple 256GB',
                category: 'Móviles',
                stock: 12,
                minStock: 5,
                price: 1199.00,
                warehouse: 'Principal',
                status: 'in-stock',
                image: 'https://via.placeholder.com/40',
                updated: '2025-05-29',
                supplier: 'Apple Inc.'
            }
        ];
    }

    generateSampleCategories() {
        return [
            {
                id: 1,
                name: 'Electrónicos',
                description: 'Dispositivos electrónicos y gadgets',
                icon: 'laptop',
                productCount: 345,
                totalValue: 125680,
                color: '#3B82F6'
            },
            {
                id: 2,
                name: 'Informática',
                description: 'Ordenadores, portátiles y componentes',
                icon: 'monitor',
                productCount: 287,
                totalValue: 198450,
                color: '#10B981'
            },
            {
                id: 3,
                name: 'Accesorios',
                description: 'Ratones, teclados y periféricos',
                icon: 'mouse',
                productCount: 156,
                totalValue: 45230,
                color: '#F59E0B'
            },
            {
                id: 4,
                name: 'Móviles',
                description: 'Smartphones y tablets',
                icon: 'smartphone',
                productCount: 89,
                totalValue: 67890,
                color: '#8B5CF6'
            },
            {
                id: 5,
                name: 'Oficina',
                description: 'Material de oficina y papelería',
                icon: 'briefcase',
                productCount: 234,
                totalValue: 23450,
                color: '#EF4444'
            }
        ];
    }

    generateSampleWarehouses() {
        return [
            {
                id: 1,
                name: 'Almacén Principal',
                location: 'Madrid',
                address: 'Calle Principal 123, Madrid',
                capacity: 5000,
                occupied: 3750,
                productCount: 847,
                manager: 'Carlos García',
                phone: '+34 91 123 4567',
                status: 'active'
            },
            {
                id: 2,
                name: 'Almacén Secundario',
                location: 'Barcelona',
                address: 'Avenida Catalunya 456, Barcelona',
                capacity: 3000,
                occupied: 1350,
                productCount: 312,
                manager: 'Ana Martínez',
                phone: '+34 93 987 6543',
                status: 'active'
            },
            {
                id: 3,
                name: 'Almacén Temporal',
                location: 'Valencia',
                address: 'Plaza Mayor 789, Valencia',
                capacity: 2000,
                occupied: 400,
                productCount: 88,
                manager: 'José López',
                phone: '+34 96 555 0123',
                status: 'active'
            }
        ];
    }

    generateSampleSuppliers() {
        return [
            {
                id: 1,
                name: 'Dell Technologies',
                contact: 'María González',
                email: 'maria@dell.com',
                phone: '+34 91 234 5678',
                address: 'Paseo de la Castellana 100, Madrid',
                category: 'Informática',
                rating: 4.8,
                orderCount: 45,
                totalValue: 125000,
                status: 'active',
                paymentTerms: '30 días',
                deliveryTime: '3-5 días'
            },
            {
                id: 2,
                name: 'Logitech',
                contact: 'Pedro Sánchez',
                email: 'pedro@logitech.com',
                phone: '+34 93 345 6789',
                address: 'Gran Vía 50, Barcelona',
                category: 'Accesorios',
                rating: 4.6,
                orderCount: 32,
                totalValue: 45000,
                status: 'active',
                paymentTerms: '15 días',
                deliveryTime: '2-4 días'
            },
            {
                id: 3,
                name: 'Apple Inc.',
                contact: 'Laura Fernández',
                email: 'laura@apple.com',
                phone: '+34 91 456 7890',
                address: 'Calle Serrano 25, Madrid',
                category: 'Móviles',
                rating: 4.9,
                orderCount: 28,
                totalValue: 180000,
                status: 'active',
                paymentTerms: '60 días',
                deliveryTime: '5-7 días'
            }
        ];
    }

    generateSampleMovements() {
        return [
            {
                id: 1,
                date: '2025-05-30 14:30',
                type: 'in',
                product: 'Ratón Logitech MX Master',
                sku: 'MOU-LOG-001',
                quantity: 50,
                from: 'Proveedor Logitech',
                to: 'Almacén Principal',
                user: 'Ana García',
                reason: 'Reposición stock',
                value: 4999.50
            },
            {
                id: 2,
                date: '2025-05-30 12:15',
                type: 'out',
                product: 'Laptop Dell XPS 13',
                sku: 'LAP-DELL-001',
                quantity: 3,
                from: 'Almacén Principal',
                to: 'Cliente Premium',
                user: 'Carlos López',
                reason: 'Venta',
                value: 3897.00
            },
            {
                id: 3,
                date: '2025-05-30 10:00',
                type: 'transfer',
                product: 'Teclados varios',
                sku: 'KEY-MIX-001',
                quantity: 10,
                from: 'Almacén Principal',
                to: 'Almacén Secundario',
                user: 'María Ruiz',
                reason: 'Redistribución',
                value: 1200.00
            },
            {
                id: 4,
                date: '2025-05-30 08:45',
                type: 'adjustment',
                product: 'Monitor Samsung 24"',
                sku: 'MON-SAM-001',
                quantity: -2,
                from: 'Almacén Principal',
                to: 'Ajuste inventario',
                user: 'Sistema',
                reason: 'Corrección inventario físico',
                value: -698.00
            }
        ];
    }

    generateStockAlerts() {
        return [
            {
                type: 'critical',
                icon: 'x-circle',
                title: 'Monitor LG 27" 4K',
                description: 'Sin stock - Última venta hace 2 días',
                sku: 'MON-LG-001',
                stock: 0,
                minStock: 3
            },
            {
                type: 'warning',
                icon: 'alert-triangle',
                title: 'Teclado Mecánico RGB',
                description: 'Stock bajo: 3 unidades restantes',
                sku: 'KEY-RGB-001',
                stock: 3,
                minStock: 10
            },
            {
                type: 'warning',
                icon: 'clock',
                title: 'Mouse Inalámbrico Pro',
                description: 'Stock bajo: 5 unidades restantes',
                sku: 'MOU-PRO-001',
                stock: 5,
                minStock: 15
            }
        ];
    }

    generateTopProducts() {
        return [
            {
                rank: 1,
                name: 'Laptop Dell XPS 13',
                category: 'Electrónicos',
                sales: 45,
                stock: 23
            },
            {
                rank: 2,
                name: 'iPhone 15 Pro',
                category: 'Móviles',
                sales: 38,
                stock: 12
            },
            {
                rank: 3,
                name: 'Auriculares Sony WH-1000XM5',
                category: 'Audio',
                sales: 32,
                stock: 18
            }
        ];
    }

    generateRecentMovements() {
        return [
            {
                type: 'in',
                icon: 'arrow-down',
                title: 'Entrada',
                description: '50x Ratón Logitech MX Master',
                time: 'hace 2 horas',
                quantity: '+50'
            },
            {
                type: 'out',
                icon: 'arrow-up',
                title: 'Salida',
                description: '3x Laptop Dell XPS 13',
                time: 'hace 4 horas',
                quantity: '-3'
            },
            {
                type: 'transfer',
                icon: 'repeat',
                title: 'Transferencia',
                description: '10x Teclados a Almacén B',
                time: 'hace 6 horas',
                quantity: '~10'
            }
        ];
    }

    renderDashboardContent() {
        this.renderStockAlerts();
        this.renderTopProducts();
        this.renderRecentMovements();
        this.renderWarehousesStatus();
    }

    renderStockAlerts() {
        const container = document.getElementById('stock-alerts-list');
        if (!container || !this.data.stockAlerts) return;

        const alertsHTML = this.data.stockAlerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <div class="alert-icon">
                    <i data-lucide="${alert.icon}"></i>
                </div>
                <div class="alert-info">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-desc">${alert.description}</div>
                    <div class="alert-action">
                        <button class="btn btn-sm btn-primary" onclick="window.app.modules.inventory.replenishStock('${alert.sku}')">
                            ${alert.type === 'critical' ? 'Reponer' : 'Ver detalles'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = alertsHTML;
    }

    renderTopProducts() {
        const container = document.getElementById('top-products-list');
        if (!container || !this.data.topProducts) return;

        const productsHTML = this.data.topProducts.map(product => `
            <div class="product-item">
                <div class="product-rank">${product.rank}</div>
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-category">${product.category}</div>
                </div>
                <div class="product-stats">
                    <div class="product-sales">${product.sales} vendidos</div>
                    <div class="product-stock">${product.stock} en stock</div>
                </div>
            </div>
        `).join('');

        container.innerHTML = productsHTML;
    }

    renderRecentMovements() {
        const container = document.getElementById('recent-movements-list');
        if (!container || !this.data.recentMovements) return;

        const movementsHTML = this.data.recentMovements.map(movement => `
            <div class="movement-item ${movement.type}">
                <div class="movement-icon">
                    <i data-lucide="${movement.icon}"></i>
                </div>
                <div class="movement-info">
                    <div class="movement-type">${movement.title}</div>
                    <div class="movement-desc">${movement.description}</div>
                    <div class="movement-time">${movement.time}</div>
                </div>
                <div class="movement-quantity">${movement.quantity}</div>
            </div>
        `).join('');

        container.innerHTML = movementsHTML;
    }

    renderWarehousesStatus() {
        const container = document.getElementById('warehouses-status-list');
        if (!container || !this.data.warehouses) return;

        const warehousesHTML = this.data.warehouses.map(warehouse => {
            const occupationPercentage = Math.round((warehouse.occupied / warehouse.capacity) * 100);
            return `
                <div class="warehouse-item">
                    <div class="warehouse-info">
                        <div class="warehouse-name">${warehouse.name}</div>
                        <div class="warehouse-location">${warehouse.location}</div>
                    </div>
                    <div class="warehouse-stats">
                        <div class="warehouse-capacity">
                            <div class="capacity-bar">
                                <div class="capacity-fill" style="width: ${occupationPercentage}%"></div>
                            </div>
                            <span class="capacity-text">${occupationPercentage}% ocupado</span>
                        </div>
                        <div class="warehouse-products">${warehouse.productCount} productos</div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = warehousesHTML;
    }

    async loadTabData(tabName) {
        try {
            console.log(`📈 Cargando datos para pestaña: ${tabName}`);
            
            switch (tabName) {
                case 'dashboard':
                    this.renderDashboardContent();
                    break;
                case 'products':
                    this.renderProductsTab();
                    break;
                case 'categories':
                    this.renderCategoriesTab();
                    break;
                case 'warehouses':
                    this.renderWarehousesTab();
                    break;
                case 'movements':
                    this.renderMovementsTab();
                    break;
                case 'suppliers':
                    this.renderSuppliersTab();
                    break;
                case 'reports':
                    this.renderReportsTab();
                    break;
            }
            
        } catch (error) {
            console.error(`❌ Error cargando datos para ${tabName}:`, error);
        }
    }

    renderProductsTab() {
        this.updateProductFilters();
        this.renderProductsTable();
        this.renderProductsQuickStats();
    }

    updateProductFilters() {
        // Update category filter
        const categoryFilter = document.getElementById('category-filter');
        if (categoryFilter && this.data.categories) {
            const optionsHTML = '<option value="">Todas las categorías</option>' +
                this.data.categories.map(cat => `<option value="${cat.name}">${cat.name}</option>`).join('');
            categoryFilter.innerHTML = optionsHTML;
        }

        // Update warehouse filter
        const warehouseFilter = document.getElementById('warehouse-filter');
        if (warehouseFilter && this.data.warehouses) {
            const optionsHTML = '<option value="">Todos los almacenes</option>' +
                this.data.warehouses.map(wh => `<option value="${wh.name}">${wh.name}</option>`).join('');
            warehouseFilter.innerHTML = optionsHTML;
        }
    }

    renderProductsTable() {
        const tbody = document.getElementById('products-tbody');
        if (!tbody || !this.data.products) return;

        const filteredProducts = this.getFilteredProducts();
        
        const productsHTML = filteredProducts.map(product => `
            <tr>
                <td>
                    <input type="checkbox" class="product-checkbox" data-product-id="${product.id}">
                </td>
                <td>
                    <div class="product-info">
                        <div class="product-image">
                            <img src="${product.image}" alt="Producto">
                        </div>
                        <div class="product-details">
                            <div class="product-name">${product.name}</div>
                            <div class="product-description">${product.description}</div>
                        </div>
                    </div>
                </td>
                <td>${product.sku}</td>
                <td>${product.category}</td>
                <td>
                    <div class="stock-info">
                        <span class="stock-quantity">${product.stock}</span>
                        <span class="stock-unit">unidades</span>
                    </div>
                </td>
                <td>€${product.price.toFixed(2)}</td>
                <td>${product.warehouse}</td>
                <td><span class="badge badge-${this.getStatusBadgeClass(product.status)}">${this.getStatusLabel(product.status)}</span></td>
                <td>${product.updated}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="window.app.modules.inventory.viewProduct('${product.sku}')" title="Ver">
                            <i data-lucide="eye"></i>
                        </button>
                        <button class="btn-icon" onclick="window.app.modules.inventory.editProduct('${product.sku}')" title="Editar">
                            <i data-lucide="edit"></i>
                        </button>
                        <button class="btn-icon" onclick="window.app.modules.inventory.adjustStock('${product.sku}')" title="Ajustar stock">
                            <i data-lucide="package"></i>
                        </button>
                        <button class="btn-icon" onclick="window.app.modules.inventory.deleteProduct('${product.sku}')" title="Eliminar">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = productsHTML;
    }

    renderProductsQuickStats() {
        const container = document.getElementById('products-quick-stats');
        if (!container) return;

        const filteredProducts = this.getFilteredProducts();
        const inStock = filteredProducts.filter(p => p.status === 'in-stock').length;
        const lowStock = filteredProducts.filter(p => p.status === 'low-stock').length;
        const outOfStock = filteredProducts.filter(p => p.status === 'out-of-stock').length;

        container.innerHTML = `
            <div class="quick-stat">
                <span class="stat-label">Total</span>
                <span class="stat-value">${filteredProducts.length}</span>
            </div>
            <div class="quick-stat">
                <span class="stat-label">En stock</span>
                <span class="stat-value">${inStock}</span>
            </div>
            <div class="quick-stat">
                <span class="stat-label">Stock bajo</span>
                <span class="stat-value">${lowStock}</span>
            </div>
            <div class="quick-stat">
                <span class="stat-label">Sin stock</span>
                <span class="stat-value">${outOfStock}</span>
            </div>
        `;
    }

    renderCategoriesTab() {
        const container = document.getElementById('categories-grid');
        if (!container || !this.data.categories) return;

        const categoriesHTML = this.data.categories.map(category => `
            <div class="category-card">
                <div class="category-header">
                    <div class="category-icon" style="color: ${category.color}">
                        <i data-lucide="${category.icon}"></i>
                    </div>
                    <div class="category-actions">
                        <button class="btn-icon" onclick="window.app.modules.inventory.editCategory('${category.id}')">
                            <i data-lucide="edit"></i>
                        </button>
                        <button class="btn-icon" onclick="window.app.modules.inventory.deleteCategory('${category.id}')">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </div>
                <div class="category-info">
                    <h3>${category.name}</h3>
                    <p>${category.description}</p>
                </div>
                <div class="category-stats">
                    <div class="stat">
                        <span class="stat-value">${category.productCount}</span>
                        <span class="stat-label">Productos</span>
                    </div>
                    <div class="stat">
                        <span class="stat-value">€${category.totalValue.toLocaleString()}</span>
                        <span class="stat-label">Valor total</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = categoriesHTML;
    }

    renderWarehousesTab() {
        const container = document.getElementById('warehouses-list');
        if (!container || !this.data.warehouses) return;

        const warehousesHTML = this.data.warehouses.map(warehouse => {
            const occupationPercentage = Math.round((warehouse.occupied / warehouse.capacity) * 100);
            return `
                <div class="warehouse-card">
                    <div class="warehouse-header">
                        <div class="warehouse-title">
                            <h3>${warehouse.name}</h3>
                            <span class="warehouse-location">${warehouse.location}</span>
                        </div>
                        <div class="warehouse-actions">
                            <button class="btn btn-secondary btn-sm" onclick="window.app.modules.inventory.viewWarehouse('${warehouse.id}')">
                                <i data-lucide="eye"></i>
                                Ver
                            </button>
                            <button class="btn btn-primary btn-sm" onclick="window.app.modules.inventory.editWarehouse('${warehouse.id}')">
                                <i data-lucide="edit"></i>
                                Editar
                            </button>
                        </div>
                    </div>
                    <div class="warehouse-details">
                        <div class="warehouse-info">
                            <div class="info-item">
                                <span class="info-label">Dirección:</span>
                                <span class="info-value">${warehouse.address}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Responsable:</span>
                                <span class="info-value">${warehouse.manager}</span>
                            </div>
                            <div class="info-item">
                                <span class="info-label">Teléfono:</span>
                                <span class="info-value">${warehouse.phone}</span>
                            </div>
                        </div>
                        <div class="warehouse-stats">
                            <div class="capacity-info">
                                <div class="capacity-header">
                                    <span>Capacidad</span>
                                    <span>${occupationPercentage}% ocupado</span>
                                </div>
                                <div class="capacity-bar">
                                    <div class="capacity-fill" style="width: ${occupationPercentage}%"></div>
                                </div>
                                <div class="capacity-details">
                                    <span>${warehouse.occupied.toLocaleString()} / ${warehouse.capacity.toLocaleString()} m³</span>
                                </div>
                            </div>
                            <div class="warehouse-metrics">
                                <div class="metric">
                                    <span class="metric-value">${warehouse.productCount}</span>
                                    <span class="metric-label">Productos</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-value ${warehouse.status === 'active' ? 'status-active' : 'status-inactive'}">${warehouse.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                                    <span class="metric-label">Estado</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = warehousesHTML;
    }

    renderMovementsTab() {
        const tbody = document.getElementById('movements-tbody');
        if (!tbody || !this.data.movements) return;

        const movementsHTML = this.data.movements.map(movement => `
            <tr>
                <td>${movement.date}</td>
                <td>
                    <span class="badge badge-${this.getMovementBadgeClass(movement.type)}">
                        <i data-lucide="${this.getMovementIcon(movement.type)}"></i>
                        ${this.getMovementLabel(movement.type)}
                    </span>
                </td>
                <td>
                    <div class="movement-product">
                        <div class="product-name">${movement.product}</div>
                        <div class="product-sku">${movement.sku}</div>
                    </div>
                </td>
                <td>
                    <span class="quantity ${movement.quantity > 0 ? 'quantity-positive' : 'quantity-negative'}">
                        ${movement.quantity > 0 ? '+' : ''}${movement.quantity}
                    </span>
                </td>
                <td>${movement.from}</td>
                <td>${movement.to}</td>
                <td>${movement.user}</td>
                <td>${movement.reason}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="window.app.modules.inventory.viewMovement('${movement.id}')" title="Ver detalles">
                            <i data-lucide="eye"></i>
                        </button>
                        <button class="btn-icon" onclick="window.app.modules.inventory.printMovement('${movement.id}')" title="Imprimir">
                            <i data-lucide="printer"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');

        tbody.innerHTML = movementsHTML;
    }

    renderSuppliersTab() {
        const container = document.getElementById('suppliers-grid');
        if (!container || !this.data.suppliers) return;

        const suppliersHTML = this.data.suppliers.map(supplier => `
            <div class="supplier-card">
                <div class="supplier-header">
                    <div class="supplier-info">
                        <h3>${supplier.name}</h3>
                        <span class="supplier-category">${supplier.category}</span>
                    </div>
                    <div class="supplier-rating">
                        <div class="rating-stars">
                            ${this.generateStarsHTML(supplier.rating)}
                        </div>
                        <span class="rating-value">${supplier.rating}</span>
                    </div>
                </div>
                <div class="supplier-contact">
                    <div class="contact-item">
                        <i data-lucide="user"></i>
                        <span>${supplier.contact}</span>
                    </div>
                    <div class="contact-item">
                        <i data-lucide="mail"></i>
                        <span>${supplier.email}</span>
                    </div>
                    <div class="contact-item">
                        <i data-lucide="phone"></i>
                        <span>${supplier.phone}</span>
                    </div>
                    <div class="contact-item">
                        <i data-lucide="map-pin"></i>
                        <span>${supplier.address}</span>
                    </div>
                </div>
                <div class="supplier-stats">
                    <div class="stat-row">
                        <div class="stat">
                            <span class="stat-label">Pedidos</span>
                            <span class="stat-value">${supplier.orderCount}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Valor Total</span>
                            <span class="stat-value">€${supplier.totalValue.toLocaleString()}</span>
                        </div>
                    </div>
                    <div class="stat-row">
                        <div class="stat">
                            <span class="stat-label">Términos Pago</span>
                            <span class="stat-value">${supplier.paymentTerms}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Tiempo Entrega</span>
                            <span class="stat-value">${supplier.deliveryTime}</span>
                        </div>
                    </div>
                </div>
                <div class="supplier-actions">
                    <button class="btn btn-secondary btn-sm" onclick="window.app.modules.inventory.viewSupplier('${supplier.id}')">
                        <i data-lucide="eye"></i>
                        Ver
                    </button>
                    <button class="btn btn-primary btn-sm" onclick="window.app.modules.inventory.editSupplier('${supplier.id}')">
                        <i data-lucide="edit"></i>
                        Editar
                    </button>
                    <button class="btn btn-success btn-sm" onclick="window.app.modules.inventory.createOrder('${supplier.id}')">
                        <i data-lucide="shopping-cart"></i>
                        Pedido
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = suppliersHTML;
    }

    renderReportsTab() {
        // Los informes ya están renderizados en el HTML estático
        // Aquí podríamos actualizar datos dinámicos si fuera necesario
        console.log('📊 Pestaña de informes cargada');
    }

    // Utility methods
    getFilteredProducts() {
        if (!this.data.products) return [];
        
        return this.data.products.filter(product => {
            const matchesSearch = !this.filters.search || 
                product.name.toLowerCase().includes(this.filters.search.toLowerCase()) ||
                product.sku.toLowerCase().includes(this.filters.search.toLowerCase());
            
            const matchesCategory = !this.filters.category || product.category === this.filters.category;
            const matchesStatus = !this.filters.status || product.status === this.filters.status;
            const matchesWarehouse = !this.filters.warehouse || product.warehouse === this.filters.warehouse;
            
            return matchesSearch && matchesCategory && matchesStatus && matchesWarehouse;
        });
    }

    getStatusBadgeClass(status) {
        const statusMap = {
            'in-stock': 'success',
            'low-stock': 'warning',
            'out-of-stock': 'error'
        };
        return statusMap[status] || 'secondary';
    }

    getStatusLabel(status) {
        const statusMap = {
            'in-stock': 'En stock',
            'low-stock': 'Stock bajo',
            'out-of-stock': 'Sin stock'
        };
        return statusMap[status] || status;
    }

    getMovementBadgeClass(type) {
        const typeMap = {
            'in': 'success',
            'out': 'warning',
            'transfer': 'info',
            'adjustment': 'secondary'
        };
        return typeMap[type] || 'secondary';
    }

    getMovementIcon(type) {
        const iconMap = {
            'in': 'arrow-down',
            'out': 'arrow-up',
            'transfer': 'repeat',
            'adjustment': 'edit-3'
        };
        return iconMap[type] || 'circle';
    }

    getMovementLabel(type) {
        const labelMap = {
            'in': 'Entrada',
            'out': 'Salida',
            'transfer': 'Transferencia',
            'adjustment': 'Ajuste'
        };
        return labelMap[type] || type;
    }

    generateStarsHTML(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let starsHTML = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            starsHTML += '<i data-lucide="star" class="star-filled"></i>';
        }
        
        // Half star
        if (hasHalfStar) {
            starsHTML += '<i data-lucide="star" class="star-half"></i>';
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHTML += '<i data-lucide="star" class="star-empty"></i>';
        }
        
        return starsHTML;
    }

    // Event handlers
    handleProductSearch(query) {
        this.filters.search = query;
        this.renderProductsTable();
        this.renderProductsQuickStats();
    }

    handleCategorySearch(query) {
        // Implement category search logic
        console.log('🔍 Búsqueda de categorías:', query);
    }

    handleSupplierSearch(query) {
        // Implement supplier search logic
        console.log('🔍 Búsqueda de proveedores:', query);
    }

    updateFilters() {
        this.filters.category = document.getElementById('category-filter')?.value || '';
        this.filters.status = document.getElementById('status-filter')?.value || '';
        this.filters.warehouse = document.getElementById('warehouse-filter')?.value || '';
        
        this.renderProductsTable();
        this.renderProductsQuickStats();
    }

    applyFilters() {
        this.updateFilters();
        if (window.app) {
            window.app.showNotification('Filtros aplicados', 'success');
        }
    }

    clearFilters() {
        this.filters = { search: '', category: '', status: '', warehouse: '' };
        
        // Clear form elements
        const searchInput = document.getElementById('product-search');
        const categoryFilter = document.getElementById('category-filter');
        const statusFilter = document.getElementById('status-filter');
        const warehouseFilter = document.getElementById('warehouse-filter');
        
        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (statusFilter) statusFilter.value = '';
        if (warehouseFilter) warehouseFilter.value = '';
        
        this.renderProductsTable();
        this.renderProductsQuickStats();
        
        if (window.app) {
            window.app.showNotification('Filtros limpiados', 'info');
        }
    }

    changeItemsPerPage(value) {
        console.log(`📄 Cambiando elementos por página: ${value}`);
        // Implement pagination logic
    }

    toggleSelectAllProducts(checked) {
        const checkboxes = document.querySelectorAll('.product-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = checked;
        });
    }

    handleSort(column) {
        console.log(`↕️ Ordenando por: ${column}`);
        // Implement sorting logic
    }

    toggleView(viewType) {
        console.log(`👁️ Cambiando vista a: ${viewType}`);
        // Implement view toggle logic
    }

    applyMovementFilters() {
        console.log('🔍 Aplicando filtros de movimientos');
        // Implement movement filters logic
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
            console.log('🔄 Refrescando datos del módulo de inventario...');
            
            if (window.app) {
                window.app.showNotification('Actualizando datos del inventario...', 'info');
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
                window.app.showNotification('Datos del inventario actualizados', 'success');
            }
            
        } catch (error) {
            console.error('❌ Error refrescando datos de inventario:', error);
            if (window.app) {
                window.app.showNotification('Error al actualizar datos del inventario', 'error');
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

    // Product management methods
    addProduct() {
        console.log('➕ Añadiendo nuevo producto...');
        if (window.app) {
            window.app.showNotification('Función de añadir producto en desarrollo', 'info');
        }
        // TODO: Implement add product modal/form
    }

    viewProduct(sku) {
        console.log(`👁️ Viendo producto: ${sku}`);
        if (window.app) {
            window.app.showNotification(`Viendo detalles del producto ${sku}`, 'info');
        }
        // TODO: Implement view product modal
    }

    editProduct(sku) {
        console.log(`✏️ Editando producto: ${sku}`);
        if (window.app) {
            window.app.showNotification(`Editando producto ${sku}`, 'info');
        }
        // TODO: Implement edit product modal/form
    }

    adjustStock(sku) {
        console.log(`📦 Ajustando stock del producto: ${sku}`);
        if (window.app) {
            window.app.showNotification(`Ajustando stock del producto ${sku}`, 'info');
        }
        // TODO: Implement stock adjustment modal
    }

    deleteProduct(sku) {
        console.log(`🗑️ Eliminando producto: ${sku}`);
        if (confirm(`¿Estás seguro de que deseas eliminar el producto ${sku}?`)) {
            if (window.app) {
                window.app.showNotification(`Producto ${sku} eliminado`, 'success');
            }
            // TODO: Implement delete product logic
        }
    }

    replenishStock(sku) {
        console.log(`🔄 Reponiendo stock del producto: ${sku}`);
        if (window.app) {
            window.app.showNotification(`Iniciando reposición de stock para ${sku}`, 'info');
        }
        // TODO: Implement stock replenishment
    }

    // Category management methods
    addCategory() {
        console.log('🏷️ Añadiendo nueva categoría...');
        if (window.app) {
            window.app.showNotification('Función de añadir categoría en desarrollo', 'info');
        }
        // TODO: Implement add category modal/form
    }

    editCategory(categoryId) {
        console.log(`✏️ Editando categoría: ${categoryId}`);
        if (window.app) {
            window.app.showNotification(`Editando categoría ${categoryId}`, 'info');
        }
        // TODO: Implement edit category modal/form
    }

    deleteCategory(categoryId) {
        console.log(`🗑️ Eliminando categoría: ${categoryId}`);
        if (confirm('¿Estás seguro de que deseas eliminar esta categoría?')) {
            if (window.app) {
                window.app.showNotification('Categoría eliminada', 'success');
            }
            // TODO: Implement delete category logic
        }
    }

    // Warehouse management methods
    addWarehouse() {
        console.log('🏭 Añadiendo nuevo almacén...');
        if (window.app) {
            window.app.showNotification('Función de añadir almacén en desarrollo', 'info');
        }
        // TODO: Implement add warehouse modal/form
    }

    viewWarehouse(warehouseId) {
        console.log(`👁️ Viendo almacén: ${warehouseId}`);
        if (window.app) {
            window.app.showNotification(`Viendo detalles del almacén ${warehouseId}`, 'info');
        }
        // TODO: Implement view warehouse modal
    }

    editWarehouse(warehouseId) {
        console.log(`✏️ Editando almacén: ${warehouseId}`);
        if (window.app) {
            window.app.showNotification(`Editando almacén ${warehouseId}`, 'info');
        }
        // TODO: Implement edit warehouse modal/form
    }

    // Movement management methods
    addMovement() {
        console.log('📝 Añadiendo nuevo movimiento...');
        if (window.app) {
            window.app.showNotification('Función de añadir movimiento en desarrollo', 'info');
        }
        // TODO: Implement add movement modal/form
    }

    viewMovement(movementId) {
        console.log(`👁️ Viendo movimiento: ${movementId}`);
        if (window.app) {
            window.app.showNotification(`Viendo detalles del movimiento ${movementId}`, 'info');
        }
        // TODO: Implement view movement modal
    }

    printMovement(movementId) {
        console.log(`🖨️ Imprimiendo movimiento: ${movementId}`);
        if (window.app) {
            window.app.showNotification(`Imprimiendo movimiento ${movementId}`, 'info');
        }
        // TODO: Implement print movement functionality
    }

    // Supplier management methods
    addSupplier() {
        console.log('🚚 Añadiendo nuevo proveedor...');
        if (window.app) {
            window.app.showNotification('Función de añadir proveedor en desarrollo', 'info');
        }
        // TODO: Implement add supplier modal/form
    }

    viewSupplier(supplierId) {
        console.log(`👁️ Viendo proveedor: ${supplierId}`);
        if (window.app) {
            window.app.showNotification(`Viendo detalles del proveedor ${supplierId}`, 'info');
        }
        // TODO: Implement view supplier modal
    }

    editSupplier(supplierId) {
        console.log(`✏️ Editando proveedor: ${supplierId}`);
        if (window.app) {
            window.app.showNotification(`Editando proveedor ${supplierId}`, 'info');
        }
        // TODO: Implement edit supplier modal/form
    }

    createOrder(supplierId) {
        console.log(`🛒 Creando pedido para proveedor: ${supplierId}`);
        if (window.app) {
            window.app.showNotification(`Creando pedido para proveedor ${supplierId}`, 'info');
        }
        // TODO: Implement create order functionality
    }

    // Import/Export methods
    importProducts() {
        console.log('📤 Importando productos...');
        if (window.app) {
            window.app.showNotification('Función de importar productos en desarrollo', 'info');
        }
        // TODO: Implement import products functionality
    }

    exportProducts() {
        console.log('📥 Exportando productos...');
        if (window.app) {
            window.app.showNotification('Función de exportar productos en desarrollo', 'info');
        }
        // TODO: Implement export products functionality
    }

    exportCategories() {
        console.log('📥 Exportando categorías...');
        if (window.app) {
            window.app.showNotification('Función de exportar categorías en desarrollo', 'info');
        }
        // TODO: Implement export categories functionality
    }

    exportMovements() {
        console.log('📥 Exportando movimientos...');
        if (window.app) {
            window.app.showNotification('Función de exportar movimientos en desarrollo', 'info');
        }
        // TODO: Implement export movements functionality
    }

    exportSuppliers() {
        console.log('📥 Exportando proveedores...');
        if (window.app) {
            window.app.showNotification('Función de exportar proveedores en desarrollo', 'info');
        }
        // TODO: Implement export suppliers functionality
    }

    // Report methods
    generateCustomReport() {
        console.log('📊 Generando informe personalizado...');
        if (window.app) {
            window.app.showNotification('Función de informe personalizado en desarrollo', 'info');
        }
        // TODO: Implement custom report generation
    }

    generateStockReport() {
        console.log('📈 Generando informe de stock...');
        if (window.app) {
            window.app.showNotification('Generando informe de stock...', 'info');
        }
        // TODO: Implement stock report generation
    }

    generateMovementReport() {
        console.log('📊 Generando informe de movimientos...');
        if (window.app) {
            window.app.showNotification('Generando informe de movimientos...', 'info');
        }
        // TODO: Implement movement report generation
    }

    generateValuationReport() {
        console.log('💰 Generando informe de valoración...');
        if (window.app) {
            window.app.showNotification('Generando informe de valoración...', 'info');
        }
        // TODO: Implement valuation report generation
    }

    generateAlertsReport() {
        console.log('⚠️ Generando informe de alertas...');
        if (window.app) {
            window.app.showNotification('Generando informe de alertas...', 'info');
        }
        // TODO: Implement alerts report generation
    }

    generatePerformanceReport() {
        console.log('⭐ Generando informe de rendimiento...');
        if (window.app) {
            window.app.showNotification('Generando informe de rendimiento...', 'info');
        }
        // TODO: Implement performance report generation
    }

    generateSuppliersReport() {
        console.log('🚚 Generando informe de proveedores...');
        if (window.app) {
            window.app.showNotification('Generando informe de proveedores...', 'info');
        }
        // TODO: Implement suppliers report generation
    }

    generateWarehouseReport() {
        console.log('🏭 Generando informe de almacenes...');
        if (window.app) {
            window.app.showNotification('Generando informe de almacenes...', 'info');
        }
        // TODO: Implement warehouse report generation
    }

    scheduleReport() {
        console.log('📅 Programando informe...');
        if (window.app) {
            window.app.showNotification('Función de programar informes en desarrollo', 'info');
        }
        // TODO: Implement report scheduling
    }

    updateReports() {
        console.log('🔄 Actualizando informes...');
        if (window.app) {
            window.app.showNotification('Actualizando informes...', 'info');
        }
        // TODO: Implement report updates
    }
}