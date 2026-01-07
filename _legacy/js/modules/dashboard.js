// ===== DASHBOARD MODULE =====

class DashboardModule {
    constructor() {
        this.title = "Inicio";
        this.data = {
            stats: {},
            projects: [],
            tasks: [],
            activities: []
        };
    }

    async render(container) {
        const dashboardHTML = `
            <div class="module-content" id="dashboard-module">
                <div class="space-y-6">
                    <!-- Welcome Section -->
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 style="font-size: var(--font-size-3xl); font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-xs);">
                                Buenos días, Enrique
                            </h2>
                            <p style="color: var(--text-secondary); font-size: var(--font-size-lg); font-weight: 500;">
                                Aquí está el resumen de tu actividad empresarial
                            </p>
                        </div>
                        <div style="display: flex; gap: var(--space-md);">
                            <button class="btn btn-secondary" onclick="generateReport()">
                                <i data-lucide="download"></i>
                                Generar Reporte
                            </button>
                            <button class="btn btn-primary" onclick="showModule('projects')">
                                <i data-lucide="plus"></i>
                                Nuevo Proyecto
                            </button>
                        </div>
                    </div>

                    <!-- Stats Grid -->
                    <div class="grid grid-cols-4" id="dashboard-stats">
                        ${this.renderStats()}
                    </div>

                    <!-- Main Content Grid -->
                    <div class="grid" style="grid-template-columns: 2fr 1fr; gap: var(--space-2xl);">
                        <!-- Projects Section -->
                        <div class="card">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-2xl);">
                                <h3 style="font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary);">
                                    Proyectos Activos
                                </h3>
                                <button class="btn btn-ghost" onclick="showModule('projects')">
                                    Ver todos
                                    <i data-lucide="arrow-right"></i>
                                </button>
                            </div>
                            <div class="space-y-6" id="dashboard-projects">
                                ${this.renderProjects()}
                            </div>
                        </div>

                        <!-- Right Sidebar -->
                        <div class="space-y-6">
                            <!-- Quick Actions -->
                            <div class="card">
                                <h3 style="font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-xl);">
                                    Acciones Rápidas
                                </h3>
                                ${this.renderQuickActions()}
                            </div>

                            <!-- Recent Activities -->
                            <div class="card">
                                <h3 style="font-size: var(--font-size-xl); font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-xl);">
                                    Actividad Reciente
                                </h3>
                                <div class="space-y-4" id="dashboard-activities">
                                    ${this.renderRecentActivities()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = dashboardHTML;
    }

    renderStats() {
        const stats = [
            {
                title: 'Revenue Total',
                value: '€847,250',
                trend: '+23.5%',
                trendType: 'positive',
                icon: 'euro',
                color: 'primary'
            },
            {
                title: 'Proyectos Activos',
                value: '24',
                trend: '+3 este mes',
                trendType: 'positive',
                icon: 'briefcase',
                color: 'info'
            },
            {
                title: 'Tareas Completadas',
                value: '142/189',
                trend: '75.1%',
                trendType: 'neutral',
                icon: 'check-square',
                color: 'warning'
            },
            {
                title: 'Satisfacción Cliente',
                value: '4.8/5.0',
                trend: '+0.3',
                trendType: 'positive',
                icon: 'star',
                color: 'success'
            }
        ];

        return stats.map(stat => `
            <div class="stat-card animate-fade-in">
                <div class="stat-header">
                    <div class="stat-content">
                        <h3>${stat.title}</h3>
                        <p>${stat.value}</p>
                        <div class="stat-trend stat-trend-${stat.trendType}">
                            <i data-lucide="trending-up" style="width: 16px; height: 16px;"></i>
                            <span>${stat.trend}</span>
                        </div>
                    </div>
                    <div class="stat-icon" style="background: var(--bg-sidebar-active);">
                        <i data-lucide="${stat.icon}" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderProjects() {
        const projects = [
            {
                id: 'mep-2025',
                title: 'Sistema ERP Integrado',
                client: 'TechSolutions Inc.',
                progress: 78,
                status: 'En Progreso',
                deadline: '28 Jun 2025'
            },
            {
                id: 'crm-360',
                title: 'CRM 360° Enterprise',
                client: 'Global Ventures',
                progress: 45,
                status: 'Desarrollo',
                deadline: '30 Jul 2025'
            },
            {
                id: 'inv-track',
                title: 'Inventory Tracking System',
                client: 'Logistics Pro',
                progress: 92,
                status: 'Testing',
                deadline: '05 Jun 2025'
            }
        ];

        return projects.map(project => `
            <div class="project-card animate-fade-in">
                <div class="project-avatar">${this.getInitials(project.title)}</div>
                <div class="project-content">
                    <div class="project-header">
                        <div class="project-title">${project.title}</div>
                        <span class="badge badge-primary">${project.status}</span>
                    </div>
                    <div class="project-progress-section">
                        <div class="project-progress-container">
                            <div class="project-progress-header">
                                <span class="project-progress-text">Progreso</span>
                                <span class="project-progress-percentage">${project.progress}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${project.progress}%"></div>
                            </div>
                        </div>
                        <div class="project-status">
                            <div class="project-status-label">${project.deadline}</div>
                            <div class="project-status-subtitle">Fecha Límite</div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderQuickActions() {
        const actions = [
            { icon: 'file-plus', title: 'Nueva Factura', subtitle: 'Crear factura rápida', color: '#10B981' },
            { icon: 'user-plus', title: 'Nuevo Cliente', subtitle: 'Añadir al CRM', color: '#3B82F6' },
            { icon: 'calendar-plus', title: 'Programar Reunión', subtitle: 'Agendar evento', color: '#F59E0B' },
            { icon: 'package-plus', title: 'Nuevo Producto', subtitle: 'Añadir inventario', color: '#8B5CF6' }
        ];

        return actions.map(action => `
            <div class="quick-action animate-fade-in">
                <div class="quick-action-icon" style="background: ${action.color};">
                    <i data-lucide="${action.icon}" style="width: 24px; height: 24px;"></i>
                </div>
                <div class="quick-action-content">
                    <div class="quick-action-title">${action.title}</div>
                    <div class="quick-action-subtitle">${action.subtitle}</div>
                </div>
            </div>
        `).join('');
    }

    renderRecentActivities() {
        const activities = [
            {
                type: 'project',
                icon: 'briefcase',
                title: 'Nuevo proyecto creado',
                description: 'CRM 360° Enterprise',
                time: 'hace 2 horas',
                color: 'var(--mep-info)'
            },
            {
                type: 'task',
                icon: 'check-circle',
                title: 'Tarea completada',
                description: 'Diseño de mockups finalizado',
                time: 'hace 5 horas',
                color: 'var(--mep-success)'
            },
            {
                type: 'client',
                icon: 'user-plus',
                title: 'Nuevo cliente',
                description: 'Digital Innovations S.L.',
                time: 'ayer',
                color: 'var(--mep-primary-500)'
            }
        ];

        return activities.map(activity => `
            <div class="activity-item animate-fade-in">
                <div style="width: 40px; height: 40px; background: ${activity.color}; 
                           border-radius: var(--radius-full); display: flex; 
                           align-items: center; justify-content: center; color: white;">
                    <i data-lucide="${activity.icon}" style="width: 20px; height: 20px;"></i>
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 2px;">
                        ${activity.title}
                    </div>
                    <div style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                        ${activity.description}
                    </div>
                    <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-top: 4px;">
                        ${activity.time}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getInitials(text) {
        return text.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    }

    async afterRender() {

            const titleElement = document.getElementById('pageTitle');
    if (titleElement) {
        titleElement.textContent = "Inicio";
    }
    document.title = `Inicio - ${MEP_CONFIG.APP_NAME}`;
        // Initialize any dashboard-specific functionality
        this.initCharts();
        this.startRealtimeUpdates();
    }

    initCharts() {
        

        // Initialize charts if needed
        console.log('Initializing dashboard charts...');
    }

    startRealtimeUpdates() {
        // Start real-time updates
        setInterval(() => {
            this.updateStats();
        }, 30000); // Update every 30 seconds
    }

    updateStats() {
        // Update dashboard statistics
        console.log('Updating dashboard stats...');
    }
}

// Export module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardModule;
}