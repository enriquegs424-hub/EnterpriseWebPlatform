// ===== RRHH MODULE =====
// Módulo de Recursos Humanos integrado con MEP-Projects

class RRHHModule {
    constructor() {
        this.moduleId = 'rrhh';
        this.currentTab = 'dashboard';
        this.data = {};
        this.isInitialized = false;
        this.employees = [];
        this.departments = [];
        this.positions = [];
    }

    async render(container) {
        try {
            console.log('👥 Renderizando módulo RRHH...');

            // Crear estructura del módulo RRHH
            const rrhhHTML = `
                <div class="rrhh-module">
                    <!-- Header del módulo -->
                    <div class="module-header">
                        <div class="module-title">
                            <h1>Recursos Humanos</h1>
                            <p>Gestión integral de talento y empleados</p>
                        </div>
                        <div class="module-actions">
                            <button class="btn btn-secondary" onclick="window.app.modules.rrhh.refreshData()">
                                <i data-lucide="refresh-cw"></i>
                                Actualizar
                            </button>
                            <button class="btn btn-primary" onclick="window.app.modules.rrhh.addEmployee()">
                                <i data-lucide="user-plus"></i>
                                Nuevo Empleado
                            </button>
                        </div>
                    </div>

                    <!-- Navegación por pestañas -->
                    <div class="rrhh-navigation">
                        <nav class="tab-navigation">
                            <button class="tab-btn active" data-tab="dashboard">
                                <i data-lucide="layout-dashboard"></i>
                                Dashboard
                            </button>
                            <button class="tab-btn" data-tab="employees">
                                <i data-lucide="users"></i>
                                Empleados
                            </button>
                            <button class="tab-btn" data-tab="recruitment">
                                <i data-lucide="user-plus"></i>
                                Reclutamiento
                            </button>
                            <button class="tab-btn" data-tab="payroll">
                                <i data-lucide="credit-card"></i>
                                Nóminas
                            </button>
                            <button class="tab-btn" data-tab="performance">
                                <i data-lucide="trending-up"></i>
                                Rendimiento
                            </button>
                            <button class="tab-btn" data-tab="attendance">
                                <i data-lucide="clock"></i>
                                Asistencia
                            </button>
                            <button class="tab-btn" data-tab="reports">
                                <i data-lucide="bar-chart-3"></i>
                                Informes
                            </button>
                        </nav>
                    </div>

                    <!-- Contenido de las pestañas -->
                    <div class="rrhh-content">
                        <!-- Dashboard Tab -->
                        <div class="tab-panel active" data-panel="dashboard">
                            <div class="rrhh-dashboard">
                                <!-- KPIs principales -->
                                <div class="stats-grid">
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="users"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Total Empleados</h3>
                                            <div class="stat-value">124</div>
                                            <div class="stat-change positive">+8 este mes</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="user-plus"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Nuevas Contrataciones</h3>
                                            <div class="stat-value">8</div>
                                            <div class="stat-change positive">+60% vs mes anterior</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="briefcase"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Posiciones Abiertas</h3>
                                            <div class="stat-value">12</div>
                                            <div class="stat-change">5 urgentes</div>
                                        </div>
                                    </div>
                                    <div class="stat-card">
                                        <div class="stat-icon">
                                            <i data-lucide="percent"></i>
                                        </div>
                                        <div class="stat-details">
                                            <h3>Tasa de Retención</h3>
                                            <div class="stat-value">94.2%</div>
                                            <div class="stat-change positive">+2.1% vs año anterior</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Widgets del dashboard -->
                                <div class="dashboard-widgets">
                                    <!-- Widget: Distribución por departamentos -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Distribución por Departamentos</h3>
                                            <button class="btn btn-ghost btn-sm">Ver detalles</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="department-chart">
                                                <div class="chart-placeholder">
                                                    <i data-lucide="pie-chart"></i>
                                                    <p>Gráfico de distribución por departamentos</p>
                                                </div>
                                            </div>
                                            <div class="department-stats">
                                                <div class="dept-item">
                                                    <span class="dept-color" style="background: #10B981;"></span>
                                                    <span class="dept-name">Desarrollo</span>
                                                    <span class="dept-count">45</span>
                                                </div>
                                                <div class="dept-item">
                                                    <span class="dept-color" style="background: #3B82F6;"></span>
                                                    <span class="dept-name">Marketing</span>
                                                    <span class="dept-count">28</span>
                                                </div>
                                                <div class="dept-item">
                                                    <span class="dept-color" style="background: #F59E0B;"></span>
                                                    <span class="dept-name">Ventas</span>
                                                    <span class="dept-count">22</span>
                                                </div>
                                                <div class="dept-item">
                                                    <span class="dept-color" style="background: #8B5CF6;"></span>
                                                    <span class="dept-name">Administración</span>
                                                    <span class="dept-count">18</span>
                                                </div>
                                                <div class="dept-item">
                                                    <span class="dept-color" style="background: #EF4444;"></span>
                                                    <span class="dept-name">Otros</span>
                                                    <span class="dept-count">11</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Widget: Próximos eventos -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Próximos Eventos</h3>
                                            <button class="btn btn-ghost btn-sm">Ver calendario</button>
                                        </div>
                                        <div class="widget-content">
                                            <div class="events-list">
                                                <div class="event-item">
                                                    <div class="event-date">
                                                        <div class="day">15</div>
                                                        <div class="month">JUN</div>
                                                    </div>
                                                    <div class="event-details">
                                                        <div class="event-title">Entrevistas Frontend</div>
                                                        <div class="event-desc">3 candidatos programados</div>
                                                        <div class="event-time">09:00 - 17:00</div>
                                                    </div>
                                                </div>
                                                <div class="event-item">
                                                    <div class="event-date">
                                                        <div class="day">18</div>
                                                        <div class="month">JUN</div>
                                                    </div>
                                                    <div class="event-details">
                                                        <div class="event-title">Revisión de Rendimiento</div>
                                                        <div class="event-desc">Equipo de Marketing</div>
                                                        <div class="event-time">14:00 - 16:00</div>
                                                    </div>
                                                </div>
                                                <div class="event-item">
                                                    <div class="event-date">
                                                        <div class="day">22</div>
                                                        <div class="month">JUN</div>
                                                    </div>
                                                    <div class="event-details">
                                                        <div class="event-title">Formación en Liderazgo</div>
                                                        <div class="event-desc">Todos los managers</div>
                                                        <div class="event-time">09:00 - 13:00</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Widget: Tareas pendientes -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Tareas Pendientes</h3>
                                            <span class="badge badge-warning">5</span>
                                        </div>
                                        <div class="widget-content">
                                            <div class="tasks-list">
                                                <div class="task-item urgent">
                                                    <div class="task-priority"></div>
                                                    <div class="task-content">
                                                        <div class="task-title">Revisar contrato de Ana García</div>
                                                        <div class="task-meta">Vence hoy</div>
                                                    </div>
                                                </div>
                                                <div class="task-item high">
                                                    <div class="task-priority"></div>
                                                    <div class="task-content">
                                                        <div class="task-title">Preparar nómina de junio</div>
                                                        <div class="task-meta">Vence en 2 días</div>
                                                    </div>
                                                </div>
                                                <div class="task-item medium">
                                                    <div class="task-priority"></div>
                                                    <div class="task-content">
                                                        <div class="task-title">Actualizar políticas de trabajo remoto</div>
                                                        <div class="task-meta">Vence en 5 días</div>
                                                    </div>
                                                </div>
                                                <div class="task-item low">
                                                    <div class="task-priority"></div>
                                                    <div class="task-content">
                                                        <div class="task-title">Organizar evento de team building</div>
                                                        <div class="task-meta">Vence en 1 semana</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Widget: Alertas -->
                                    <div class="widget">
                                        <div class="widget-header">
                                            <h3>Alertas del Sistema</h3>
                                            <span class="badge badge-error">2</span>
                                        </div>
                                        <div class="widget-content">
                                            <div class="alerts-list">
                                                <div class="alert-item error">
                                                    <i data-lucide="alert-circle"></i>
                                                    <div class="alert-content">
                                                        <div class="alert-title">Contratos por vencer</div>
                                                        <div class="alert-desc">3 contratos vencen este mes</div>
                                                    </div>
                                                </div>
                                                <div class="alert-item warning">
                                                    <i data-lucide="clock"></i>
                                                    <div class="alert-content">
                                                        <div class="alert-title">Horas extra elevadas</div>
                                                        <div class="alert-desc">5 empleados exceden 40h semanales</div>
                                                    </div>
                                                </div>
                                                <div class="alert-item info">
                                                    <i data-lucide="calendar"></i>
                                                    <div class="alert-content">
                                                        <div class="alert-title">Vacaciones pendientes</div>
                                                        <div class="alert-desc">12 empleados sin usar vacaciones</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Employees Tab -->
                        <div class="tab-panel" data-panel="employees">
                            <div class="rrhh-employees">
                                <div class="section-header">
                                    <h2>Gestión de Empleados</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary" onclick="window.app.modules.rrhh.exportEmployees()">
                                            <i data-lucide="download"></i>
                                            Exportar
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.rrhh.addEmployee()">
                                            <i data-lucide="user-plus"></i>
                                            Nuevo Empleado
                                        </button>
                                    </div>
                                </div>

                                <!-- Filtros y búsqueda -->
                                <div class="employees-filters">
                                    <div class="filter-group">
                                        <input type="text" placeholder="Buscar empleados..." class="search-input" id="employee-search">
                                        <select class="filter-select" id="department-filter">
                                            <option value="">Todos los departamentos</option>
                                            <option value="desarrollo">Desarrollo</option>
                                            <option value="marketing">Marketing</option>
                                            <option value="ventas">Ventas</option>
                                            <option value="administracion">Administración</option>
                                        </select>
                                        <select class="filter-select" id="status-filter">
                                            <option value="">Todos los estados</option>
                                            <option value="activo">Activo</option>
                                            <option value="inactivo">Inactivo</option>
                                            <option value="vacaciones">En vacaciones</option>
                                            <option value="baja">Baja temporal</option>
                                        </select>
                                        <button class="btn btn-secondary" onclick="window.app.modules.rrhh.applyFilters()">
                                            <i data-lucide="filter"></i>
                                            Filtrar
                                        </button>
                                    </div>
                                </div>

                                <!-- Quick stats -->
                                <div class="employee-quick-stats">
                                    <div class="quick-stat">
                                        <span class="stat-label">Total</span>
                                        <span class="stat-value">124</span>
                                    </div>
                                    <div class="quick-stat">
                                        <span class="stat-label">Activos</span>
                                        <span class="stat-value">118</span>
                                    </div>
                                    <div class="quick-stat">
                                        <span class="stat-label">En vacaciones</span>
                                        <span class="stat-value">4</span>
                                    </div>
                                    <div class="quick-stat">
                                        <span class="stat-label">Baja temporal</span>
                                        <span class="stat-value">2</span>
                                    </div>
                                </div>

                                <!-- Tabla de empleados -->
                                <div class="employees-table">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Empleado</th>
                                                <th>ID</th>
                                                <th>Departamento</th>
                                                <th>Posición</th>
                                                <th>Fecha Ingreso</th>
                                                <th>Estado</th>
                                                <th>Salario</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody id="employees-tbody">
                                            <tr>
                                                <td>
                                                    <div class="employee-info">
                                                        <div class="employee-avatar">AG</div>
                                                        <div class="employee-details">
                                                            <div class="employee-name">Ana García López</div>
                                                            <div class="employee-email">ana.garcia@mepprojects.com</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>EMP-001</td>
                                                <td>Desarrollo</td>
                                                <td>Senior Frontend Developer</td>
                                                <td>15/01/2023</td>
                                                <td><span class="badge badge-success">Activo</span></td>
                                                <td>€4,200</td>
                                                <td>
                                                    <div class="action-buttons">
                                                        <button class="btn-icon" onclick="window.app.modules.rrhh.viewEmployee('EMP-001')" title="Ver perfil">
                                                            <i data-lucide="eye"></i>
                                                        </button>
                                                        <button class="btn-icon" onclick="window.app.modules.rrhh.editEmployee('EMP-001')" title="Editar">
                                                            <i data-lucide="edit"></i>
                                                        </button>
                                                        <button class="btn-icon" onclick="window.app.modules.rrhh.employeeDocuments('EMP-001')" title="Documentos">
                                                            <i data-lucide="file-text"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div class="employee-info">
                                                        <div class="employee-avatar">CM</div>
                                                        <div class="employee-details">
                                                            <div class="employee-name">Andrea Vaquero</div>
                                                            <div class="employee-email">andrea.vaquero@mepprojects.com</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>EMP-002</td>
                                                <td>Marketing</td>
                                                <td>Marketing Manager</td>
                                                <td>03/03/2022</td>
                                                <td><span class="badge badge-info">En vacaciones</span></td>
                                                <td>€3,800</td>
                                                <td>
                                                    <div class="action-buttons">
                                                        <button class="btn-icon" onclick="window.app.modules.rrhh.viewEmployee('EMP-002')" title="Ver perfil">
                                                            <i data-lucide="eye"></i>
                                                        </button>
                                                        <button class="btn-icon" onclick="window.app.modules.rrhh.editEmployee('EMP-002')" title="Editar">
                                                            <i data-lucide="edit"></i>
                                                        </button>
                                                        <button class="btn-icon" onclick="window.app.modules.rrhh.employeeDocuments('EMP-002')" title="Documentos">
                                                            <i data-lucide="file-text"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div class="employee-info">
                                                        <div class="employee-avatar">LR</div>
                                                        <div class="employee-details">
                                                            <div class="employee-name">Laura Rodríguez</div>
                                                            <div class="employee-email">laura.rodriguez@mepprojects.com</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>EMP-003</td>
                                                <td>Ventas</td>
                                                <td>Sales Representative</td>
                                                <td>12/07/2023</td>
                                                <td><span class="badge badge-success">Activo</span></td>
                                                <td>€3,200</td>
                                                <td>
                                                    <div class="action-buttons">
                                                        <button class="btn-icon" onclick="window.app.modules.rrhh.viewEmployee('EMP-003')" title="Ver perfil">
                                                            <i data-lucide="eye"></i>
                                                        </button>
                                                        <button class="btn-icon" onclick="window.app.modules.rrhh.editEmployee('EMP-003')" title="Editar">
                                                            <i data-lucide="edit"></i>
                                                        </button>
                                                        <button class="btn-icon" onclick="window.app.modules.rrhh.employeeDocuments('EMP-003')" title="Documentos">
                                                            <i data-lucide="file-text"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <!-- Paginación -->
                                <div class="pagination">
                                    <button class="btn btn-ghost btn-sm">Anterior</button>
                                    <span class="pagination-info">Mostrando 1-10 de 124</span>
                                    <button class="btn btn-ghost btn-sm">Siguiente</button>
                                </div>
                            </div>
                        </div>

                        <!-- Recruitment Tab -->
                        <div class="tab-panel" data-panel="recruitment">
                            <div class="rrhh-recruitment">
                                <div class="section-header">
                                    <h2>Proceso de Reclutamiento</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary">
                                            <i data-lucide="search"></i>
                                            Buscar Candidatos
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.rrhh.createJobPost()">
                                            <i data-lucide="plus"></i>
                                            Nueva Vacante
                                        </button>
                                    </div>
                                </div>

                                <!-- Pipeline de reclutamiento -->
                                <div class="recruitment-pipeline">
                                    <div class="pipeline-stage">
                                        <div class="stage-header">
                                            <h3>Aplicaciones</h3>
                                            <span class="stage-count">23</span>
                                        </div>
                                        <div class="stage-candidates">
                                            <div class="candidate-card">
                                                <div class="candidate-avatar">MJ</div>
                                                <div class="candidate-info">
                                                    <div class="candidate-name">María José</div>
                                                    <div class="candidate-position">Frontend Developer</div>
                                                </div>
                                            </div>
                                            <div class="candidate-card">
                                                <div class="candidate-avatar">PL</div>
                                                <div class="candidate-info">
                                                    <div class="candidate-name">Pedro López</div>
                                                    <div class="candidate-position">UX Designer</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="pipeline-stage">
                                        <div class="stage-header">
                                            <h3>Entrevista Técnica</h3>
                                            <span class="stage-count">8</span>
                                        </div>
                                        <div class="stage-candidates">
                                            <div class="candidate-card">
                                                <div class="candidate-avatar">AS</div>
                                                <div class="candidate-info">
                                                    <div class="candidate-name">Alberto Silva</div>
                                                    <div class="candidate-position">Backend Developer</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="pipeline-stage">
                                        <div class="stage-header">
                                            <h3>Entrevista Final</h3>
                                            <span class="stage-count">3</span>
                                        </div>
                                        <div class="stage-candidates">
                                            <div class="candidate-card">
                                                <div class="candidate-avatar">IG</div>
                                                <div class="candidate-info">
                                                    <div class="candidate-name">Isabel García</div>
                                                    <div class="candidate-position">Product Manager</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="pipeline-stage">
                                        <div class="stage-header">
                                            <h3>Oferta Enviada</h3>
                                            <span class="stage-count">1</span>
                                        </div>
                                        <div class="stage-candidates">
                                            <div class="candidate-card">
                                                <div class="candidate-avatar">JM</div>
                                                <div class="candidate-info">
                                                    <div class="candidate-name">Jorge Morales</div>
                                                    <div class="candidate-position">DevOps Engineer</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Posiciones abiertas -->
                                <div class="open-positions">
                                    <h3>Posiciones Abiertas</h3>
                                    <div class="positions-grid">
                                        <div class="position-card">
                                            <div class="position-header">
                                                <h4>Senior Frontend Developer</h4>
                                                <span class="badge badge-success">Activa</span>
                                            </div>
                                            <div class="position-info">
                                                <div class="position-department">Desarrollo</div>
                                                <div class="position-salary">€45,000 - €55,000</div>
                                                <div class="position-stats">
                                                    <span>15 aplicaciones</span>
                                                    <span>3 en proceso</span>
                                                </div>
                                            </div>
                                            <div class="position-actions">
                                                <button class="btn btn-sm btn-secondary">Ver Aplicaciones</button>
                                                <button class="btn btn-sm btn-primary">Editar</button>
                                            </div>
                                        </div>

                                        <div class="position-card">
                                            <div class="position-header">
                                                <h4>UX/UI Designer</h4>
                                                <span class="badge badge-warning">Urgente</span>
                                            </div>
                                            <div class="position-info">
                                                <div class="position-department">Diseño</div>
                                                <div class="position-salary">€40,000 - €50,000</div>
                                                <div class="position-stats">
                                                    <span>8 aplicaciones</span>
                                                    <span>1 en proceso</span>
                                                </div>
                                            </div>
                                            <div class="position-actions">
                                                <button class="btn btn-sm btn-secondary">Ver Aplicaciones</button>
                                                <button class="btn btn-sm btn-primary">Editar</button>
                                            </div>
                                        </div>

                                        <div class="position-card">
                                            <div class="position-header">
                                                <h4>Product Manager</h4>
                                                <span class="badge badge-success">Activa</span>
                                            </div>
                                            <div class="position-info">
                                                <div class="position-department">Producto</div>
                                                <div class="position-salary">€50,000 - €65,000</div>
                                                <div class="position-stats">
                                                    <span>12 aplicaciones</span>
                                                    <span>2 en proceso</span>
                                                </div>
                                            </div>
                                            <div class="position-actions">
                                                <button class="btn btn-sm btn-secondary">Ver Aplicaciones</button>
                                                <button class="btn btn-sm btn-primary">Editar</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Payroll Tab -->
                        <div class="tab-panel" data-panel="payroll">
                            <div class="rrhh-payroll">
                                <div class="section-header">
                                    <h2>Gestión de Nóminas</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary">
                                            <i data-lucide="download"></i>
                                            Exportar Nóminas
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.rrhh.processPayroll()">
                                            <i data-lucide="play"></i>
                                            Procesar Nómina
                                        </button>
                                    </div>
                                </div>

                                <!-- Resumen nómina actual -->
                                <div class="payroll-summary">
                                    <div class="summary-header">
                                        <h3>Nómina de Junio 2025</h3>
                                        <span class="badge badge-warning">En proceso</span>
                                    </div>
                                    <div class="summary-stats">
                                        <div class="summary-stat">
                                            <div class="stat-label">Total empleados</div>
                                            <div class="stat-value">124</div>
                                        </div>
                                        <div class="summary-stat">
                                            <div class="stat-label">Total bruto</div>
                                            <div class="stat-value">€456,800</div>
                                        </div>
                                        <div class="summary-stat">
                                            <div class="stat-label">Deducciones</div>
                                            <div class="stat-value">€91,360</div>
                                        </div>
                                        <div class="summary-stat">
                                            <div class="stat-label">Total neto</div>
                                            <div class="stat-value">€365,440</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Acciones rápidas -->
                                <div class="payroll-quick-actions">
                                    <button class="quick-action-btn">
                                        <i data-lucide="clock"></i>
                                        <span>Horas Extra</span>
                                    </button>
                                    <button class="quick-action-btn">
                                        <i data-lucide="plus"></i>
                                        <span>Bonificaciones</span>
                                    </button>
                                    <button class="quick-action-btn">
                                        <i data-lucide="minus"></i>
                                        <span>Deducciones</span>
                                    </button>
                                    <button class="quick-action-btn">
                                        <i data-lucide="calendar"></i>
                                        <span>Días de Baja</span>
                                    </button>
                                </div>

                                <!-- Detalle nóminas por empleado -->
                                <div class="payroll-details">
                                    <div class="details-header">
                                        <h3>Detalle por Empleado</h3>
                                        <div class="payroll-filters">
                                            <select class="filter-select">
                                                <option>Todos los departamentos</option>
                                                <option>Desarrollo</option>
                                                <option>Marketing</option>
                                                <option>Ventas</option>
                                            </select>
                                            <input type="text" placeholder="Buscar empleado..." class="search-input">
                                        </div>
                                    </div>

                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Empleado</th>
                                                <th>Departamento</th>
                                                <th>Salario Base</th>
                                                <th>Horas Extra</th>
                                                <th>Bonificaciones</th>
                                                <th>Deducciones</th>
                                                <th>Total Neto</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <div class="employee-info">
                                                        <div class="employee-avatar">AG</div>
                                                        <span>Ana García</span>
                                                    </div>
                                                </td>
                                                <td>Desarrollo</td>
                                                <td>€4,200.00</td>
                                                <td>€315.00</td>
                                                <td>€200.00</td>
                                                <td>€920.00</td>
                                                <td>€3,795.00</td>
                                                <td><span class="badge badge-success">Completado</span></td>
                                                <td>
                                                    <button class="btn-icon" title="Ver detalle">
                                                        <i data-lucide="eye"></i>
                                                    </button>
                                                    <button class="btn-icon" title="Editar">
                                                        <i data-lucide="edit"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div class="employee-info">
                                                        <div class="employee-avatar">CM</div>
                                                        <span>Andrea Vaquero</span>
                                                    </div>
                                                </td>
                                                <td>Marketing</td>
                                                <td>€3,800.00</td>
                                                <td>€0.00</td>
                                                <td>€150.00</td>
                                                <td>€790.00</td>
                                                <td>€3,160.00</td>
                                                <td><span class="badge badge-warning">Pendiente</span></td>
                                                <td>
                                                    <button class="btn-icon" title="Ver detalle">
                                                        <i data-lucide="eye"></i>
                                                    </button>
                                                    <button class="btn-icon" title="Editar">
                                                        <i data-lucide="edit"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Performance Tab -->
                        <div class="tab-panel" data-panel="performance">
                            <div class="rrhh-performance">
                                <div class="section-header">
                                    <h2>Gestión de Rendimiento</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary">
                                            <i data-lucide="calendar"></i>
                                            Programar Evaluaciones
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.rrhh.createEvaluation()">
                                            <i data-lucide="plus"></i>
                                            Nueva Evaluación
                                        </button>
                                    </div>
                                </div>

                                <!-- Métricas de rendimiento -->
                                <div class="performance-metrics">
                                    <div class="metric-card">
                                        <div class="metric-header">
                                            <h3>Puntuación Promedio</h3>
                                            <i data-lucide="trending-up"></i>
                                        </div>
                                        <div class="metric-value">4.2/5</div>
                                        <div class="metric-trend positive">+0.3 vs trimestre anterior</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric-header">
                                            <h3>Evaluaciones Completadas</h3>
                                            <i data-lucide="check-circle"></i>
                                        </div>
                                        <div class="metric-value">89%</div>
                                        <div class="metric-trend">110/124 empleados</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric-header">
                                            <h3>Objetivos Alcanzados</h3>
                                            <i data-lucide="target"></i>
                                        </div>
                                        <div class="metric-value">76%</div>
                                        <div class="metric-trend positive">+12% vs año anterior</div>
                                    </div>
                                    <div class="metric-card">
                                        <div class="metric-header">
                                            <h3>Promociones</h3>
                                            <i data-lucide="arrow-up"></i>
                                        </div>
                                        <div class="metric-value">15</div>
                                        <div class="metric-trend">Este año</div>
                                    </div>
                                </div>

                                <!-- Gráfico de rendimiento por departamento -->
                                <div class="performance-chart">
                                    <h3>Rendimiento por Departamento</h3>
                                    <div class="chart-container">
                                        <div class="chart-placeholder">
                                            <i data-lucide="bar-chart-3"></i>
                                            <p>Gráfico de rendimiento por departamento</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Lista de evaluaciones recientes -->
                                <div class="recent-evaluations">
                                    <h3>Evaluaciones Recientes</h3>
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Empleado</th>
                                                <th>Departamento</th>
                                                <th>Tipo</th>
                                                <th>Fecha</th>
                                                <th>Puntuación</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <div class="employee-info">
                                                        <div class="employee-avatar">AG</div>
                                                        <span>Ana García</span>
                                                    </div>
                                                </td>
                                                <td>Desarrollo</td>
                                                <td>Trimestral</td>
                                                <td>15/05/2025</td>
                                                <td>
                                                    <div class="score-display">
                                                        <span class="score">4.5</span>
                                                        <div class="score-stars">★★★★★</div>
                                                    </div>
                                                </td>
                                                <td><span class="badge badge-success">Completada</span></td>
                                                <td>
                                                    <button class="btn-icon" title="Ver evaluación">
                                                        <i data-lucide="eye"></i>
                                                    </button>
                                                    <button class="btn-icon" title="Feedback">
                                                        <i data-lucide="message-circle"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div class="employee-info">
                                                        <div class="employee-avatar">CM</div>
                                                        <span>Andrea Vaquero</span>
                                                    </div>
                                                </td>
                                                <td>Marketing</td>
                                                <td>Anual</td>
                                                <td>10/05/2025</td>
                                                <td>
                                                    <div class="score-display">
                                                        <span class="score">4.2</span>
                                                        <div class="score-stars">★★★★☆</div>
                                                    </div>
                                                </td>
                                                <td><span class="badge badge-success">Completada</span></td>
                                                <td>
                                                    <button class="btn-icon" title="Ver evaluación">
                                                        <i data-lucide="eye"></i>
                                                    </button>
                                                    <button class="btn-icon" title="Feedback">
                                                        <i data-lucide="message-circle"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Attendance Tab -->
                        <div class="tab-panel" data-panel="attendance">
                            <div class="rrhh-attendance">
                                <div class="section-header">
                                    <h2>Control de Asistencia</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary">
                                            <i data-lucide="download"></i>
                                            Exportar Asistencia
                                        </button>
                                        <button class="btn btn-primary">
                                            <i data-lucide="clock"></i>
                                            Registrar Entrada/Salida
                                        </button>
                                    </div>
                                </div>

                                <!-- Resumen de asistencia -->
                                <div class="attendance-summary">
                                    <div class="summary-cards">
                                        <div class="summary-card">
                                            <div class="card-header">
                                                <h3>Presentes Hoy</h3>
                                                <i data-lucide="users"></i>
                                            </div>
                                            <div class="card-value">98</div>
                                            <div class="card-detail">de 124 empleados</div>
                                        </div>
                                        <div class="summary-card">
                                            <div class="card-header">
                                                <h3>Llegadas Tardías</h3>
                                                <i data-lucide="clock"></i>
                                            </div>
                                            <div class="card-value">5</div>
                                            <div class="card-detail">hoy</div>
                                        </div>
                                        <div class="summary-card">
                                            <div class="card-header">
                                                <h3>Ausencias</h3>
                                                <i data-lucide="x-circle"></i>
                                            </div>
                                            <div class="card-value">3</div>
                                            <div class="card-detail">justificadas: 2</div>
                                        </div>
                                        <div class="summary-card">
                                            <div class="card-header">
                                                <h3>Trabajo Remoto</h3>
                                                <i data-lucide="home"></i>
                                            </div>
                                            <div class="card-value">23</div>
                                            <div class="card-detail">empleados</div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Filtros de asistencia -->
                                <div class="attendance-filters">
                                    <div class="filter-group">
                                        <input type="date" class="filter-input" value="2025-05-30">
                                        <select class="filter-select">
                                            <option>Todos los departamentos</option>
                                            <option>Desarrollo</option>
                                            <option>Marketing</option>
                                            <option>Ventas</option>
                                        </select>
                                        <select class="filter-select">
                                            <option>Todos los estados</option>
                                            <option>Presente</option>
                                            <option>Ausente</option>
                                            <option>Tarde</option>
                                            <option>Remoto</option>
                                        </select>
                                        <button class="btn btn-secondary">Filtrar</button>
                                    </div>
                                </div>

                                <!-- Tabla de asistencia -->
                                <div class="attendance-table">
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Empleado</th>
                                                <th>Departamento</th>
                                                <th>Entrada</th>
                                                <th>Salida</th>
                                                <th>Horas Trabajadas</th>
                                                <th>Estado</th>
                                                <th>Ubicación</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>
                                                    <div class="employee-info">
                                                        <div class="employee-avatar">AG</div>
                                                        <span>Ana García</span>
                                                    </div>
                                                </td>
                                                <td>Desarrollo</td>
                                                <td>08:45</td>
                                                <td>17:30</td>
                                                <td>8h 45m</td>
                                                <td><span class="badge badge-success">Presente</span></td>
                                                <td><span class="location-badge office">Oficina</span></td>
                                                <td>
                                                    <button class="btn-icon" title="Ver detalle">
                                                        <i data-lucide="eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div class="employee-info">
                                                        <div class="employee-avatar">CM</div>
                                                        <span>Andrea Vaquero</span>
                                                    </div>
                                                </td>
                                                <td>Marketing</td>
                                                <td>--</td>
                                                <td>--</td>
                                                <td>--</td>
                                                <td><span class="badge badge-info">Vacaciones</span></td>
                                                <td><span class="location-badge vacation">Vacaciones</span></td>
                                                <td>
                                                    <button class="btn-icon" title="Ver detalle">
                                                        <i data-lucide="eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <div class="employee-info">
                                                        <div class="employee-avatar">LR</div>
                                                        <span>Laura Rodríguez</span>
                                                    </div>
                                                </td>
                                                <td>Ventas</td>
                                                <td>09:15</td>
                                                <td>--</td>
                                                <td>--</td>
                                                <td><span class="badge badge-warning">Tarde</span></td>
                                                <td><span class="location-badge remote">Remoto</span></td>
                                                <td>
                                                    <button class="btn-icon" title="Ver detalle">
                                                        <i data-lucide="eye"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- Reports Tab -->
                        <div class="tab-panel" data-panel="reports">
                            <div class="rrhh-reports">
                                <div class="section-header">
                                    <h2>Informes de RRHH</h2>
                                    <div class="section-actions">
                                        <button class="btn btn-secondary">
                                            <i data-lucide="settings"></i>
                                            Configurar Informes
                                        </button>
                                        <button class="btn btn-primary" onclick="window.app.modules.rrhh.generateReport()">
                                            <i data-lucide="plus"></i>
                                            Generar Informe
                                        </button>
                                    </div>
                                </div>

                                <!-- Tipos de informes -->
                                <div class="report-types">
                                    <div class="report-type-card" onclick="window.app.modules.rrhh.generateSpecificReport('headcount')">
                                        <div class="report-icon">
                                            <i data-lucide="users"></i>
                                        </div>
                                        <div class="report-info">
                                            <h3>Informe de Plantilla</h3>
                                            <p>Análisis completo de la composición de empleados</p>
                                        </div>
                                    </div>
                                    <div class="report-type-card" onclick="window.app.modules.rrhh.generateSpecificReport('turnover')">
                                        <div class="report-icon">
                                            <i data-lucide="rotate-cw"></i>
                                        </div>
                                        <div class="report-info">
                                            <h3>Rotación de Personal</h3>
                                            <p>Análisis de entrada y salida de empleados</p>
                                        </div>
                                    </div>
                                    <div class="report-type-card" onclick="window.app.modules.rrhh.generateSpecificReport('performance')">
                                        <div class="report-icon">
                                            <i data-lucide="trending-up"></i>
                                        </div>
                                        <div class="report-info">
                                            <h3>Rendimiento</h3>
                                            <p>Evaluaciones y métricas de productividad</p>
                                        </div>
                                    </div>
                                    <div class="report-type-card" onclick="window.app.modules.rrhh.generateSpecificReport('payroll')">
                                        <div class="report-icon">
                                            <i data-lucide="credit-card"></i>
                                        </div>
                                        <div class="report-info">
                                            <h3>Análisis Salarial</h3>
                                            <p>Distribución y tendencias salariales</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Informes recientes -->
                                <div class="recent-reports">
                                    <h3>Informes Generados Recientemente</h3>
                                    <table class="data-table">
                                        <thead>
                                            <tr>
                                                <th>Nombre del Informe</th>
                                                <th>Tipo</th>
                                                <th>Período</th>
                                                <th>Generado</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>Informe Mensual de Plantilla - Mayo 2025</td>
                                                <td>Plantilla</td>
                                                <td>Mayo 2025</td>
                                                <td>30/05/2025</td>
                                                <td><span class="badge badge-success">Completado</span></td>
                                                <td>
                                                    <button class="btn-icon" title="Descargar">
                                                        <i data-lucide="download"></i>
                                                    </button>
                                                    <button class="btn-icon" title="Ver">
                                                        <i data-lucide="eye"></i>
                                                    </button>
                                                    <button class="btn-icon" title="Compartir">
                                                        <i data-lucide="share"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>Análisis de Rotación Q1 2025</td>
                                                <td>Rotación</td>
                                                <td>Q1 2025</td>
                                                <td>28/05/2025</td>
                                                <td><span class="badge badge-success">Completado</span></td>
                                                <td>
                                                    <button class="btn-icon" title="Descargar">
                                                        <i data-lucide="download"></i>
                                                    </button>
                                                    <button class="btn-icon" title="Ver">
                                                        <i data-lucide="eye"></i>
                                                    </button>
                                                    <button class="btn-icon" title="Compartir">
                                                        <i data-lucide="share"></i>
                                                    </button>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>

                                <!-- Métricas clave -->
                                <div class="key-metrics">
                                    <h3>Métricas Clave del Período</h3>
                                    <div class="metrics-grid">
                                        <div class="metric-item">
                                            <div class="metric-icon">
                                                <i data-lucide="users"></i>
                                            </div>
                                            <div class="metric-data">
                                                <div class="metric-value">124</div>
                                                <div class="metric-label">Empleados Totales</div>
                                                <div class="metric-change positive">+6.4%</div>
                                            </div>
                                        </div>
                                        <div class="metric-item">
                                            <div class="metric-icon">
                                                <i data-lucide="user-plus"></i>
                                            </div>
                                            <div class="metric-data">
                                                <div class="metric-value">8</div>
                                                <div class="metric-label">Nuevas Contrataciones</div>
                                                <div class="metric-change positive">+60%</div>
                                            </div>
                                        </div>
                                        <div class="metric-item">
                                            <div class="metric-icon">
                                                <i data-lucide="user-minus"></i>
                                            </div>
                                            <div class="metric-data">
                                                <div class="metric-value">2</div>
                                                <div class="metric-label">Salidas</div>
                                                <div class="metric-change negative">-33%</div>
                                            </div>
                                        </div>
                                        <div class="metric-item">
                                            <div class="metric-icon">
                                                <i data-lucide="percent"></i>
                                            </div>
                                            <div class="metric-data">
                                                <div class="metric-value">94.2%</div>
                                                <div class="metric-label">Tasa de Retención</div>
                                                <div class="metric-change positive">+2.1%</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            container.innerHTML = rrhhHTML;
            this.isInitialized = true;

        } catch (error) {
            console.error('❌ Error renderizando módulo RRHH:', error);
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">
                        <i data-lucide="alert-triangle"></i>
                    </div>
                    <h3>Error al cargar RRHH</h3>
                    <p>No se pudo cargar el módulo de Recursos Humanos. Inténtalo de nuevo.</p>
                    <button class="btn btn-primary" onclick="window.app.loadModule('rrhh')">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    async afterRender() {
        try {
            console.log('🔧 Configurando módulo RRHH...');
            
            // Setup tab navigation
            this.setupTabNavigation();
            
            // Setup search and filters
            this.setupSearchAndFilters();
            
            // Load initial data
            await this.loadData();
            
            console.log('✅ Módulo RRHH configurado correctamente');
            
        } catch (error) {
            console.error('❌ Error en afterRender del módulo RRHH:', error);
        }
    }

    setupTabNavigation() {
        const tabButtons = document.querySelectorAll('.rrhh-module .tab-btn');
        const tabPanels = document.querySelectorAll('.rrhh-module .tab-panel');

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
                console.log(`📂 Cambiando a pestaña RRHH: ${targetTab}`);
                
                // Load tab-specific data
                this.loadTabData(targetTab);
            });
        });
    }

    setupSearchAndFilters() {
        // Employee search
        const employeeSearch = document.getElementById('employee-search');
        if (employeeSearch) {
            employeeSearch.addEventListener('input', (e) => {
                this.filterEmployees(e.target.value);
            });
        }

        // Department filter
        const departmentFilter = document.getElementById('department-filter');
        if (departmentFilter) {
            departmentFilter.addEventListener('change', (e) => {
                this.filterByDepartment(e.target.value);
            });
        }

        // Status filter
        const statusFilter = document.getElementById('status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.filterByStatus(e.target.value);
            });
        }
    }

    async loadData() {
        try {
            // Simulate loading data - replace with actual API calls
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.data = {
                dashboard: {
                    stats: {
                        totalEmployees: 124,
                        newHires: 8,
                        openPositions: 12,
                        retentionRate: 94.2
                    },
                    departments: [
                        { name: 'Desarrollo', count: 45, color: '#10B981' },
                        { name: 'Marketing', count: 28, color: '#3B82F6' },
                        { name: 'Ventas', count: 22, color: '#F59E0B' },
                        { name: 'Administración', count: 18, color: '#8B5CF6' },
                        { name: 'Otros', count: 11, color: '#EF4444' }
                    ]
                },
                employees: [
                    {
                        id: 'EMP-001',
                        name: 'Ana García López',
                        email: 'ana.garcia@mepprojects.com',
                        department: 'Desarrollo',
                        position: 'Senior Frontend Developer',
                        hireDate: '2023-01-15',
                        status: 'activo',
                        salary: 4200
                    },
                    {
                        id: 'EMP-002',
                        name: 'Andrea Vaquero',
                        email: 'andrea.vaquero@mepprojects.com',
                        department: 'Marketing',
                        position: 'Marketing Manager',
                        hireDate: '2022-03-03',
                        status: 'vacaciones',
                        salary: 3800
                    },
                    {
                        id: 'EMP-003',
                        name: 'Laura Rodríguez',
                        email: 'laura.rodriguez@mepprojects.com',
                        department: 'Ventas',
                        position: 'Sales Representative',
                        hireDate: '2023-07-12',
                        status: 'activo',
                        salary: 3200
                    }
                ],
                recruitment: {
                    pipeline: {
                        applications: 23,
                        technical: 8,
                        final: 3,
                        offer: 1
                    },
                    openPositions: [
                        {
                            title: 'Senior Frontend Developer',
                            department: 'Desarrollo',
                            salary: '€45,000 - €55,000',
                            applications: 15,
                            inProcess: 3,
                            status: 'active'
                        },
                        {
                            title: 'UX/UI Designer',
                            department: 'Diseño',
                            salary: '€40,000 - €50,000',
                            applications: 8,
                            inProcess: 1,
                            status: 'urgent'
                        }
                    ]
                },
                payroll: {
                    current: {
                        month: 'Junio 2025',
                        totalEmployees: 124,
                        totalGross: 456800,
                        totalDeductions: 91360,
                        totalNet: 365440,
                        status: 'processing'
                    }
                },
                performance: {
                    averageScore: 4.2,
                    completedEvaluations: 89,
                    goalsAchieved: 76,
                    promotions: 15
                },
                attendance: {
                    today: {
                        present: 98,
                        late: 5,
                        absent: 3,
                        remote: 23,
                        total: 124
                    }
                }
            };
            
            console.log('📊 Datos RRHH cargados:', this.data);
            
        } catch (error) {
            console.error('❌ Error cargando datos RRHH:', error);
            if (window.app) {
                window.app.showNotification('Error al cargar datos de RRHH', 'error');
            }
        }
    }

    async loadTabData(tabName) {
        try {
            console.log(`📈 Cargando datos para pestaña RRHH: ${tabName}`);
            
            switch (tabName) {
                case 'dashboard':
                    this.updateDashboardCharts();
                    break;
                case 'employees':
                    this.updateEmployeesList();
                    break;
                case 'recruitment':
                    this.updateRecruitmentPipeline();
                    break;
                case 'payroll':
                    this.updatePayrollData();
                    break;
                case 'performance':
                    this.updatePerformanceCharts();
                    break;
                case 'attendance':
                    this.updateAttendanceData();
                    break;
                case 'reports':
                    this.updateReportsData();
                    break;
            }
            
        } catch (error) {
            console.error(`❌ Error cargando datos para ${tabName}:`, error);
        }
    }

    updateDashboardCharts() {
        // Update department distribution chart
        console.log('📊 Actualizando gráficos del dashboard RRHH...');
        
        const chartPlaceholder = document.querySelector('.department-chart .chart-placeholder');
        if (chartPlaceholder) {
            chartPlaceholder.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <i data-lucide="pie-chart" style="width: 48px; height: 48px; margin-bottom: 16px;"></i>
                    <p>Gráfico de distribución por departamentos</p>
                    <small>Integración con Chart.js pendiente</small>
                </div>
            `;
            
            // Re-initialize icons
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    updateEmployeesList() {
        console.log('👥 Actualizando lista de empleados...');
        // Update employees table with current data
    }

    updateRecruitmentPipeline() {
        console.log('🎯 Actualizando pipeline de reclutamiento...');
        // Update recruitment pipeline
    }

    updatePayrollData() {
        console.log('💰 Actualizando datos de nómina...');
        // Update payroll information
    }

    updatePerformanceCharts() {
        console.log('📈 Actualizando gráficos de rendimiento...');
        // Update performance charts
    }

    updateAttendanceData() {
        console.log('⏰ Actualizando datos de asistencia...');
        // Update attendance data
    }

    updateReportsData() {
        console.log('📊 Actualizando datos de informes...');
        // Update reports data
    }

    // Filter functions
    filterEmployees(searchTerm) {
        console.log(`🔍 Filtrando empleados: ${searchTerm}`);
        // Implement employee filtering logic
    }

    filterByDepartment(department) {
        console.log(`🏢 Filtrando por departamento: ${department}`);
        // Implement department filtering logic
    }

    filterByStatus(status) {
        console.log(`📊 Filtrando por estado: ${status}`);
        // Implement status filtering logic
    }

    applyFilters() {
        console.log('🔧 Aplicando filtros...');
        const searchTerm = document.getElementById('employee-search')?.value || '';
        const department = document.getElementById('department-filter')?.value || '';
        const status = document.getElementById('status-filter')?.value || '';
        
        // Apply combined filters
        this.filterEmployees(searchTerm);
        this.filterByDepartment(department);
        this.filterByStatus(status);
        
        if (window.app) {
            window.app.showNotification('Filtros aplicados correctamente', 'success');
        }
    }

    async refreshData() {
        try {
            console.log('🔄 Refrescando datos del módulo RRHH...');
            
            if (window.app) {
                window.app.showNotification('Actualizando datos de RRHH...', 'info');
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
                window.app.showNotification('Datos de RRHH actualizados', 'success');
            }
            
        } catch (error) {
            console.error('❌ Error refrescando datos RRHH:', error);
            if (window.app) {
                window.app.showNotification('Error al actualizar datos de RRHH', 'error');
            }
        }
    }

    // Employee management functions
    addEmployee() {
        console.log('➕ Añadiendo nuevo empleado...');
        if (window.app) {
            window.app.showNotification('Función de añadir empleado en desarrollo', 'info');
        }
        // TODO: Implement add employee modal/form
    }

    viewEmployee(employeeId) {
        console.log(`👁️ Viendo perfil del empleado: ${employeeId}`);
        if (window.app) {
            window.app.showNotification(`Viendo perfil de ${employeeId}`, 'info');
        }
        // TODO: Implement employee profile view
    }

    editEmployee(employeeId) {
        console.log(`✏️ Editando empleado: ${employeeId}`);
        if (window.app) {
            window.app.showNotification(`Editando ${employeeId}`, 'info');
        }
        // TODO: Implement employee edit modal/form
    }

    employeeDocuments(employeeId) {
        console.log(`📄 Viendo documentos del empleado: ${employeeId}`);
        if (window.app) {
            window.app.showNotification(`Documentos de ${employeeId}`, 'info');
        }
        // TODO: Implement employee documents view
    }

    exportEmployees() {
        console.log('📥 Exportando datos de empleados...');
        if (window.app) {
            window.app.showNotification('Función de exportar empleados en desarrollo', 'info');
        }
        // TODO: Implement employee data export
    }

    // Recruitment functions
    createJobPost() {
        console.log('📝 Creando nueva oferta de trabajo...');
        if (window.app) {
            window.app.showNotification('Función de crear oferta en desarrollo', 'info');
        }
        // TODO: Implement job posting creation
    }

    // Payroll functions
    processPayroll() {
        console.log('💰 Procesando nómina...');
        if (window.app) {
            window.app.showNotification('Función de procesar nómina en desarrollo', 'info');
        }
        // TODO: Implement payroll processing
    }

    // Performance functions
    createEvaluation() {
        console.log('📊 Creando nueva evaluación...');
        if (window.app) {
            window.app.showNotification('Función de crear evaluación en desarrollo', 'info');
        }
        // TODO: Implement evaluation creation
    }

    // Reports functions
    generateReport() {
        console.log('📈 Generando informe...');
        if (window.app) {
            window.app.showNotification('Función de generar informe en desarrollo', 'info');
        }
        // TODO: Implement report generation
    }

    generateSpecificReport(reportType) {
        console.log(`📊 Generando informe específico: ${reportType}`);
        if (window.app) {
            window.app.showNotification(`Generando informe de ${reportType}`, 'info');
        }
        // TODO: Implement specific report generation
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

    getEmployees() {
        return this.data.employees || [];
    }

    getDepartments() {
        return this.data.dashboard?.departments || [];
    }

    getEmployeeById(employeeId) {
        return this.data.employees?.find(emp => emp.id === employeeId);
    }

    // Utility functions
    formatSalary(amount) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getStatusLabel(status) {
        const statusLabels = {
            'activo': 'Activo',
            'inactivo': 'Inactivo',
            'vacaciones': 'En vacaciones',
            'baja': 'Baja temporal'
        };
        return statusLabels[status] || status;
    }

    getStatusBadgeClass(status) {
        const statusClasses = {
            'activo': 'badge-success',
            'inactivo': 'badge-error',
            'vacaciones': 'badge-info',
            'baja': 'badge-warning'
        };
        return statusClasses[status] || 'badge-secondary';
    }
}