// ===== ERP MODULE =====
// Módulo de Planificación de Recursos Empresariales integrado con MEP-Projects

class ERPModule {
    constructor() {
        this.moduleId = 'erp';
        this.currentTab = 'dashboard';
        this.data = {};
        this.isInitialized = false;
    }

    async render(container) {
        try {
            console.log('🏢 Renderizando módulo ERP...');

            // Crear estructura del módulo ERP
            const erpHTML = `
                <div class="erp-module">
                    <!-- Header del módulo -->
                    <div class="module-header">
                        <div class="module-title">
                            <h1>Sistema ERP</h1>
                            <p>Planificación de Recursos Empresariales</p>
                        </div>
                        <div class="module-actions">
                            <button class="btn btn-secondary" onclick="window.app.modules.erp.refreshData()">
                                <i data-lucide="refresh-cw"></i>
                                Actualizar
                            </button>
                            <button class="btn btn-primary" onclick="window.app.modules.erp.showHelp()">
                                <i data-lucide="help-circle"></i>
                                Ayuda
                            </button>
                        </div>
                    </div>

                    <!-- Navegación por pestañas -->
                    <div class="erp-navigation">
                        <nav class="tab-navigation">
                            <button class="tab-btn active" data-tab="dashboard">
                                <i data-lucide="layout-dashboard"></i>
                                Dashboard
                            </button>
                            <button class="tab-btn" data-tab="financials">
                                <i data-lucide="trending-up"></i>
                                Finanzas
                            </button>
                            <button class="tab-btn" data-tab="inventory">
                                <i data-lucide="package"></i>
                                Inventario
                            </button>
                            <button class="tab-btn" data-tab="hr">
                                <i data-lucide="users"></i>
                                RRHH
                            </button>
                            <button class="tab-btn" data-tab="supply-chain">
                                <i data-lucide="truck"></i>
                                Cadena Suministro
                            </button>
                            <button class="tab-btn" data-tab="reports">
                                <i data-lucide="bar-chart-3"></i>
                                Informes
                            </button>
                        </nav>
                    </div>

                    <!-- Contenido de las pestañas -->
                    <div class="erp-content">
                        <!-- Dashboard Tab -->
                        <div class="tab-panel active" data-panel="dashboard">
                            <div class="erp-dashboard">
                                <div class="stats-grid">
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="trending-up"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Ingresos Mes</h3>
                                            <div class="stat-value">€125,480</div>
                                            <div class="stat-change positive">+12.5%</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="package"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Productos</h3>
                                            <div class="stat-value">1,247</div>
                                            <div class="stat-change">23 stock bajo</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="users"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Empleados</h3>
                                            <div class="stat-value">48</div>
                                            <div class="stat-change">2 nuevos</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="shopping-cart"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Pedidos</h3>
                                            <div class="stat-value">156</div>
                                            <div class="stat-change positive">+8.2%</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="dashboard-widgets">
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Actividades Recientes</h3>
                                            <button class="btn btn-ghost btn-sm">Ver todas</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="activity-list">
                                                <div class="activity-item">
                                                    <div class="activity-icon">
                                                        <i data-lucide="package"></i>
                                                    </div>
                                                    <div class="activity-details">
                                                        <div class="activity-title">Producto añadido</div>
                                                        <div class="activity-desc">Laptop Dell XPS 13 agregada al inventario</div>
                                                        <div class="activity-time">hace 2 horas</div>
                                                    </div>
                                                </div>
                                                <div class="activity-item">
                                                    <div class="activity-icon">
                                                        <i data-lucide="user-plus"></i>
                                                    </div>
                                                    <div class="activity-details">
                                                        <div class="activity-title">Nuevo empleado</div>
                                                        <div class="activity-desc">Ana García contratada en Desarrollo</div>
                                                        <div class="activity-time">hace 4 horas</div>
                                                    </div>
                                                </div>
                                                <div class="activity-item">
                                                    <div class="activity-icon">
                                                        <i data-lucide="truck"></i>
                                                    </div>
                                                    <div class="activity-details">
                                                        <div class="activity-title">Envío entregado</div>
                                                        <div class="activity-desc">Pedido #ORD-2024-001 entregado</div>
                                                        <div class="activity-time">hace 6 horas</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Alertas del Sistema</h3>
                                            <span class="badge badge-warning">3</span>
                                        </div>
                                        <div class="widget-content">
                                            <div class="alert-list">
                                                <div class="alert-item warning">
                                                    <i data-lucide="alert-triangle"></i>
                                                    <div class="alert-content">
                                                        <div class="alert-title">Stock Bajo</div>
                                                        <div class="alert-desc">23 productos con stock inferior al mínimo</div>
                                                    </div>
                                                </div>
                                                <div class="alert-item info">
                                                    <i data-lucide="calendar"></i>
                                                    <div class="alert-content">
                                                        <div class="alert-title">Revisión Mensual</div>
                                                        <div class="alert-desc">Informe financiero mensual pendiente</div>
                                                    </div>
                                                </div>
                                                <div class="alert-item success">
                                                    <i data-lucide="check-circle"></i>
                                                    <div class="alert-content">
                                                        <div class="alert-title">Backup Completado</div>
                                                        <div class="alert-desc">Copia de seguridad realizada correctamente</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Financials Tab -->
                        <div class="tab-panel" data-panel="financials">
                            <div class="erp-financials">
                                <div class="section-header">
                                    <h2>Gestión Financiera</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary">
                                            <i data-lucide="download"></i>
                                            Exportar
                                        </button>
                                        <button class="btn btn-primary">
                                            <i data-lucide="plus"></i>
                                            Nueva Transacción
                                        </button>
                                    </div>
                                </div>

                                <div class="financial-summary">
                                    <div class="summary-cards">
                                        <div class="summary-card revenue">
                                            <h3>Ingresos</h3>
                                            <div class="amount">€125,480</div>
                                            <div class="trend positive">+12.5% vs mes anterior</div>
                                        </div>
                                        <div class="summary-card expenses">
                                            <h3>Gastos</h3>
                                            <div class="amount">€89,320</div>
                                            <div class="trend negative">+5.2% vs mes anterior</div>
                                        </div>
                                        <div class="summary-card profit">
                                            <h3>Beneficio</h3>
                                            <div class="amount">€36,160</div>
                                            <div class="trend positive">+28.8% vs mes anterior</div>
                                        </div>
                                        <div class="summary-card cashflow">
                                            <h3>Flujo de Caja</h3>
                                            <div class="amount">€52,890</div>
                                            <div class="trend positive">Saludable</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="financial-charts">
                                    <div class="chart-container">
                                        <h3>Evolución Financiera (6 meses)</h3>
                                        <div class="chart-placeholder">
                                            <i data-lucide="trending-up"></i>
                                            <p>Gráfico de evolución financiera</p>
                                        </div>
                                    </div>
                                </div>

                                <div class="transactions-table">
                                    <h3>Transacciones Recientes</h3>
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Descripción</th>
                                                <th>Categoría</th>
                                                <th>Tipo</th>
                                                <th>Importe</th>
                                                <th>Estado</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>30/05/2025</td>
                                                <td>Venta de productos</td>
                                                <td>Ventas</td>
                                                <td><span class="badge badge-success">Ingreso</span></td>
                                                <td>€2,450.00</td>
                                                <td><span class="badge badge-success">Completado</span></td>
                                            </tr>
                                            <tr>
                                                <td>29/05/2025</td>
                                                <td>Compra de material</td>
                                                <td>Compras</td>
                                                <td><span class="badge badge-warning">Gasto</span></td>
                                                <td>€1,200.00</td>
                                                <td><span class="badge badge-warning">Pendiente</span></td>
                                            </tr>
                                            <tr>
                                                <td>28/05/2025</td>
                                                <td>Nómina empleados</td>
                                                <td>RRHH</td>
                                                <td><span class="badge badge-warning">Gasto</span></td>
                                                <td>€15,600.00</td>
                                                <td><span class="badge badge-success">Completado</span></td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Inventory Tab -->
                        <div class="tab-panel" data-panel="inventory">
                            <div class="erp-inventory">
                                <div class="section-header">
                                    <h2>Gestión de Inventario</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary">
                                            <i data-lucide="upload"></i>
                                            Importar
                                        </button>
                                        <button class="btn btn-primary">
                                            <i data-lucide="plus"></i>
                                            Añadir Producto
                                        </button>
                                    </div>
                                </div>

                                <div class="inventory-stats">
                                    <div class="stat-grid">
                                        <div class="stat-item">
                                            <div class="stat-label">Total Productos</div>
                                            <div class="stat-value">1,247</div>
                                        </div>
                                        <div class="stat-item warning">
                                            <div class="stat-label">Stock Bajo</div>
                                            <div class="stat-value">23</div>
                                        </div>
                                        <div class="stat-item danger">
                                            <div class="stat-label">Sin Stock</div>
                                            <div class="stat-value">5</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Valor Total</div>
                                            <div class="stat-value">€89,450</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="inventory-filters">
                                    <div class="filter-group">
                                        <input type="text" placeholder="Buscar productos..." class="search-input">
                                        <select class="filter-select">
                                            <option>Todas las categorías</option>
                                            <option>Electrónicos</option>
                                            <option>Oficina</option>
                                            <option>Hardware</option>
                                        </select>
                                        <select class="filter-select">
                                            <option>Todos los estados</option>
                                            <option>En stock</option>
                                            <option>Stock bajo</option>
                                            <option>Sin stock</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="inventory-table">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>SKU</th>
                                                <th>Producto</th>
                                                <th>Categoría</th>
                                                <th>Stock</th>
                                                <th>Precio</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>SKU-001</td>
                                                <td>Laptop Dell XPS 13</td>
                                                <td>Electrónicos</td>
                                                <td>25</td>
                                                <td>€1,299.00</td>
                                                <td><span class="badge badge-success">En stock</span></td>
                                                <td>
                                                    <button class="btn-icon"><i data-lucide="edit"></i></button>
                                                    <button class="btn-icon"><i data-lucide="eye"></i></button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>SKU-002</td>
                                                <td>Mouse Logitech MX</td>
                                                <td>Hardware</td>
                                                <td>8</td>
                                                <td>€79.99</td>
                                                <td><span class="badge badge-warning">Stock bajo</span></td>
                                                <td>
                                                    <button class="btn-icon"><i data-lucide="edit"></i></button>
                                                    <button class="btn-icon"><i data-lucide="eye"></i></button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>SKU-003</td>
                                                <td>Monitor 4K LG</td>
                                                <td>Electrónicos</td>
                                                <td>0</td>
                                                <td>€349.99</td>
                                                <td><span class="badge badge-error">Sin stock</span></td>
                                                <td>
                                                    <button class="btn-icon"><i data-lucide="edit"></i></button>
                                                    <button class="btn-icon"><i data-lucide="eye"></i></button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- HR Tab -->
                        <div class="tab-panel" data-panel="hr">
                            <div class="erp-hr">
                                <div class="section-header">
                                    <h2>Recursos Humanos</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary">
                                            <i data-lucide="file-text"></i>
                                            Informes
                                        </button>
                                        <button class="btn btn-primary">
                                            <i data-lucide="user-plus"></i>
                                            Añadir Empleado
                                        </button>
                                    </div>
                                </div>

                                <div class="hr-stats">
                                    <div class="stat-grid">
                                        <div class="stat-item">
                                            <div class="stat-label">Total Empleados</div>
                                            <div class="stat-value">48</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Nuevas Contrataciones</div>
                                            <div class="stat-value">2</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Posiciones Abiertas</div>
                                            <div class="stat-value">3</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Tasa Rotación</div>
                                            <div class="stat-value">4.2%</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="employee-table">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Empleado</th>
                                                <th>Departamento</th>
                                                <th>Posición</th>
                                                <th>Estado</th>
                                                <th>Fecha Contrato</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>EMP-001</td>
                                                <td>
                                                    <div class="employee-info">
                                                        <div class="employee-avatar">AG</div>
                                                        <span>Ana García</span>
                                                    </div>
                                                </td>
                                                <td>Desarrollo</td>
                                                <td>Frontend Developer</td>
                                                <td><span class="badge badge-success">Activo</span></td>
                                                <td>15/01/2025</td>
                                                <td>
                                                    <button class="btn-icon"><i data-lucide="edit"></i></button>
                                                    <button class="btn-icon"><i data-lucide="eye"></i></button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>EMP-002</td>
                                                <td>
                                                    <div class="employee-info">
                                                        <div class="employee-avatar">JM</div>
                                                        <span>José Martínez</span>
                                                    </div>
                                                </td>
                                                <td>Marketing</td>
                                                <td>Marketing Manager</td>
                                                <td><span class="badge badge-success">Activo</span></td>
                                                <td>03/03/2024</td>
                                                <td>
                                                    <button class="btn-icon"><i data-lucide="edit"></i></button>
                                                    <button class="btn-icon"><i data-lucide="eye"></i></button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Supply Chain Tab -->
                        <div class="tab-panel" data-panel="supply-chain">
                            <div class="erp-supply-chain">
                                <div class="section-header">
                                    <h2>Cadena de Suministro</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary">
                                            <i data-lucide="truck"></i>
                                            Seguimiento
                                        </button>
                                        <button class="btn btn-primary">
                                            <i data-lucide="plus"></i>
                                            Nuevo Pedido
                                        </button>
                                    </div>
                                </div>

                                <div class="supply-stats">
                                    <div class="stat-grid">
                                        <div class="stat-item">
                                            <div class="stat-label">Proveedores Activos</div>
                                            <div class="stat-value">15</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Pedidos Pendientes</div>
                                            <div class="stat-value">8</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Entregas a Tiempo</div>
                                            <div class="stat-value">94%</div>
                                        </div>
                                        <div class="stat-item">
                                            <div class="stat-label">Tiempo Promedio</div>
                                            <div class="stat-value">5.2 días</div>
                                        </div>
                                    </div>
                                </div>

                                <div class="orders-table">
                                    <h3>Órdenes de Compra Recientes</h3>
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Pedido #</th>
                                                <th>Proveedor</th>
                                                <th>Fecha</th>
                                                <th>Estado</th>
                                                <th>Total</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>ORD-2025-001</td>
                                                <td>TechCorp Solutions</td>
                                                <td>28/05/2025</td>
                                                <td><span class="badge badge-warning">En proceso</span></td>
                                                <td>€5,200.00</td>
                                                <td>
                                                    <button class="btn-icon"><i data-lucide="eye"></i></button>
                                                    <button class="btn-icon"><i data-lucide="truck"></i></button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>ORD-2025-002</td>
                                                <td>Office Supplies Co</td>
                                                <td>27/05/2025</td>
                                                <td><span class="badge badge-success">Entregado</span></td>
                                                <td>€1,450.00</td>
                                                <td>
                                                    <button class="btn-icon"><i data-lucide="eye"></i></button>
                                                    <button class="btn-icon"><i data-lucide="truck"></i></button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Reports Tab -->
                        <div class="tab-panel" data-panel="reports">
                            <div class="erp-reports">
                                <div class="section-header">
                                    <h2>Informes y Análisis</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary">
                                            <i data-lucide="download"></i>
                                            Exportar
                                        </button>
                                        <button class="btn btn-primary">
                                            <i data-lucide="plus"></i>
                                            Nuevo Informe
                                        </button>
                                    </div>
                                </div>

                                <div class="report-filters">
                                    <div class="filter-group">
                                        <select class="filter-select">
                                            <option>Este mes</option>
                                            <option>Último mes</option>
                                            <option>Este trimestre</option>
                                            <option>Este año</option>
                                        </select>
                                        <select class="filter-select">
                                            <option>Todos los informes</option>
                                            <option>Financieros</option>
                                            <option>Inventario</option>
                                            <option>RRHH</option>
                                        </select>
                                        <button class="btn btn-secondary">Aplicar Filtros</button>
                                    </div>
                                </div>

                                <div class="reports-grid">
                                    <div class="report-card">
                                        <div class="report-icon">
                                            <i data-lucide="trending-up"></i>
                                        </div>
                                        <div class="report-info">
                                            <h3>Informe Financiero</h3>
                                            <p>Estado financiero mensual</p>
                                            <div class="report-meta">
                                                <span>Generado: 30/05/2025</span>
                                                <button class="btn btn-sm btn-primary">Ver Informe</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="report-card">
                                        <div class="report-icon">
                                            <i data-lucide="package"></i>
                                        </div>
                                        <div class="report-info">
                                            <h3>Informe de Inventario</h3>
                                            <p>Estado actual del inventario</p>
                                            <div class="report-meta">
                                                <span>Generado: 29/05/2025</span>
                                                <button class="btn btn-sm btn-primary">Ver Informe</button>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="report-card">
                                        <div class="report-icon">
                                            <i data-lucide="users"></i>
                                        </div>
                                        <div class="report-info">
                                            <h3>Informe RRHH</h3>
                                            <p>Análisis de recursos humanos</p>
                                            <div class="report-meta">
                                                <span>Generado: 28/05/2025</span>
                                                <button class="btn btn-sm btn-primary">Ver Informe</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="kpi-dashboard">
                                    <h3>Indicadores Clave de Rendimiento</h3>
                                    <div class="kpi-grid">
                                        <div class="kpi-card">
                                            <h4>Ingresos Totales</h4>
                                            <div class="kpi-value">€125,480</div>
                                            <div class="kpi-trend positive">↑ 12.5%</div>
                                        </div>
                                        <div class="kpi-card">
                                            <h4>Margen de Beneficio</h4>
                                            <div class="kpi-value">28.8%</div>
                                            <div class="kpi-trend positive">↑ 5.2%</div>
                                        </div>
                                        <div class="kpi-card">
                                            <h4>Pedidos Procesados</h4>
                                            <div class="kpi-value">156</div>
                                            <div class="kpi-trend positive">↑ 8.2%</div>
                                        </div>
                                        <div class="kpi-card">
                                            <h4>Productividad</h4>
                                            <div class="kpi-value">94.5%</div>
                                            <div class="kpi-trend positive">↑ 2.1%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = erpHTML;
            this.isInitialized = true;

        } catch (error) {
            console.error('❌ Error renderizando módulo ERP:', error);
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i data-lucide="alert-triangle"></i>
                    </div>
                    <h3>Error al cargar ERP</h3>
                    <p>No se pudo cargar el módulo ERP. Inténtalo de nuevo.</p>
                    <button class="btn btn-primary" onclick="window.app.loadModule('erp')">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    async afterRender() {
        try {
            console.log('🔧 Configurando módulo ERP...');
            
            // Setup tab navigation
            this.setupTabNavigation();
            
            // Load initial data
            await this.loadData();
            
            console.log('✅ Módulo ERP configurado correctamente');
            
        } catch (error) {
            console.error('❌ Error en afterRender del módulo ERP:', error);
        }
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.erp-module .tab-btn');
        const tabPanels = document.querySelectorAll('.erp-module .tab-panel');

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
                console.log(`📂 Cambiando a pestaña ERP: ${targetTab}`);
                
                // Load tab-specific data
                this.loadTabData(targetTab);
            });
        });
    }

    async loadData() {
        try {
            // Simulate loading data - replace with actual API calls
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.data = {
                dashboard: {
                    stats: {
                        revenue: 125480,
                        products: 1247,
                        employees: 48,
                        orders: 156
                    },
                    activities: [
                        { type: 'product', title: 'Producto añadido', time: '2 horas' },
                        { type: 'employee', title: 'Nuevo empleado', time: '4 horas' },
                        { type: 'delivery', title: 'Envío entregado', time: '6 horas' }
                    ]
                },
                financials: {
                    summary: {
                        revenue: 125480,
                        expenses: 89320,
                        profit: 36160,
                        cashflow: 52890
                    }
                },
                inventory: {
                    stats: {
                        totalProducts: 1247,
                        lowStock: 23,
                        outOfStock: 5,
                        totalValue: 89450
                    }
                },
                hr: {
                    stats: {
                        totalEmployees: 48,
                        newHires: 2,
                        openPositions: 3,
                        turnoverRate: 4.2
                    }
                },
                supplyChain: {
                    stats: {
                        activeSuppliers: 15,
                        pendingOrders: 8,
                        onTimeDelivery: 94,
                        avgDeliveryTime: 5.2
                    }
                }
            };
            
            console.log('📊 Datos ERP cargados:', this.data);
            
        } catch (error) {
            console.error('❌ Error cargando datos ERP:', error);
            if (window.app) {
                window.app.showNotification('Error al cargar datos del ERP', 'error');
            }
        }
    }

    async loadTabData(tabName) {
        try {
            console.log(`📈 Cargando datos para pestaña: ${tabName}`);
            
            // Simulate API call for tab-specific data
            switch (tabName) {
                case 'dashboard':
                    // Dashboard data is already loaded
                    break;
                case 'financials':
                    // Load financial charts and detailed data
                    this.loadFinancialCharts();
                    break;
                case 'inventory':
                    // Load inventory data
                    this.updateInventoryData();
                    break;
                case 'hr':
                    // Load HR data
                    this.updateHRData();
                    break;
                case 'supply-chain':
                    // Load supply chain data
                    this.updateSupplyChainData();
                    break;
                case 'reports':
                    // Load reports data
                    this.updateReportsData();
                    break;
            }
            
        } catch (error) {
            console.error(`❌ Error cargando datos para ${tabName}:`, error);
        }
    }

    loadFinancialCharts() {
        // Simulate chart loading
        console.log('📊 Cargando gráficos financieros...');
        
        // Here you would integrate with Chart.js or another charting library
        const chartPlaceholder = document.querySelector('.financial-charts .chart-placeholder');
        if (chartPlaceholder) {
            chartPlaceholder.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i data-lucide="trending-up" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
                    <p>Gráfico financiero cargado</p>
                    <small>Integración con Chart.js pendiente</small>
                </div>
            `;
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    updateInventoryData() {
        console.log('📦 Actualizando datos de inventario...');
        // Update inventory-specific data and UI
    }

    updateHRData() {
        console.log('👥 Actualizando datos de RRHH...');
        // Update HR-specific data and UI
    }

    updateSupplyChainData() {
        console.log('🚛 Actualizando datos de cadena de suministro...');
        // Update supply chain-specific data and UI
    }

    updateReportsData() {
        console.log('📈 Actualizando datos de informes...');
        // Update reports-specific data and UI
    }

    async refreshData() {
        try {
            console.log('🔄 Refrescando datos del módulo ERP...');
            
            if (window.app) {
                window.app.showNotification('Actualizando datos del ERP...', 'info');
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
                window.app.showNotification('Datos del ERP actualizados', 'success');
            }
            
        } catch (error) {
            console.error('❌ Error refrescando datos ERP:', error);
            if (window.app) {
                window.app.showNotification('Error al actualizar datos del ERP', 'error');
            }
        }
    }

    showHelp() {
        const helpContent = `
            <div class="help-content">
                <h3>Sistema ERP - Ayuda</h3>
                <p>El módulo ERP (Enterprise Resource Planning) te permite gestionar todos los recursos de tu empresa de forma integrada.</p>
                
                <h4>Funcionalidades principales:</h4>
                <ul>
                    <li><strong>Dashboard:</strong> Vista general con métricas clave y actividades recientes</li>
                    <li><strong>Finanzas:</strong> Gestión de ingresos, gastos y análisis financiero</li>
                    <li><strong>Inventario:</strong> Control de stock, productos y almacenes</li>
                    <li><strong>RRHH:</strong> Gestión de empleados, nóminas y recursos humanos</li>
                    <li><strong>Cadena de Suministro:</strong> Gestión de proveedores, pedidos y envíos</li>
                    <li><strong>Informes:</strong> Análisis y reportes de todas las áreas</li>
                </ul>
                
                <h4>Navegación:</h4>
                <p>Utiliza las pestañas superiores para navegar entre las diferentes secciones del ERP. Cada sección incluye herramientas específicas para su área de gestión.</p>
                
                <h4>Acciones rápidas:</h4>
                <ul>
                    <li><strong>Actualizar:</strong> Refresca los datos del módulo</li>
                    <li><strong>Exportar:</strong> Descarga informes en formato Excel o PDF</li>
                    <li><strong>Añadir:</strong> Crea nuevos registros (productos, empleados, pedidos, etc.)</li>
                </ul>
            </div>
        `;
        
        if (window.app && window.app.showModal) {
            window.app.showModal('Ayuda - Sistema ERP', helpContent);
        } else {
            alert('Ayuda del Sistema ERP\n\nEl módulo ERP te permite gestionar todos los recursos de tu empresa de forma integrada.');
        }
    }

    // Public methods for integration
    getModuleData() {
        return this.data;
    }

    getCurrentTab() {
        return this.currentTab;
    }

    switchToTab(tabName) {
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        if (tabButton) {
            tabButton.click();
        }
    }

    // Methods for actions (to be implemented)
    addProduct() {
        console.log('➕ Añadiendo nuevo producto...');
        if (window.app) {
            window.app.showNotification('Función de añadir producto en desarrollo', 'info');
        }
    }

    addEmployee() {
        console.log('👤 Añadiendo nuevo empleado...');
        if (window.app) {
            window.app.showNotification('Función de añadir empleado en desarrollo', 'info');
        }
    }

    createOrder() {
        console.log('📋 Creando nuevo pedido...');
        if (window.app) {
            window.app.showNotification('Función de crear pedido en desarrollo', 'info');
        }
    }

    generateReport() {
        console.log('📊 Generando informe...');
        if (window.app) {
            window.app.showNotification('Función de generar informe en desarrollo', 'info');
        }
    }

    exportData() {
        console.log('💾 Exportando datos...');
        if (window.app) {
            window.app.showNotification('Función de exportar datos en desarrollo', 'info');
        }
    }
}