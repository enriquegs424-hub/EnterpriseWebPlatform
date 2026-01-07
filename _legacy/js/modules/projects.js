


// ===== PROJECTS MODULE =====

class ProjectsModule {
    constructor() {
        this.projects = [];
        this.currentView = 'grid';
        this.filters = {
            status: 'all',
            search: '',
            sortBy: 'date'
        };
    }

    async render(container) {
        const projectsHTML = `
            <div class="module-content" id="projects-module">
                <div class="space-y-6">
                    <!-- Header -->
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 style="font-size: var(--font-size-3xl); font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-xs);">
                                Gestión de Proyectos
                            </h2>
                            <p style="color: var(--text-secondary); font-size: var(--font-size-lg); font-weight: 500;">
                                Administra y supervisa todos tus proyectos activos
                            </p>
                        </div>
                        <div style="display: flex; gap: var(--space-md);">
                            <button class="btn btn-secondary" onclick="projectsModule.exportProjects()">
                                <i data-lucide="download"></i>
                                Exportar
                            </button>
                            <button class="btn btn-primary" onclick="projectsModule.showNewProjectModal()">
                                <i data-lucide="plus"></i>
                                Nuevo Proyecto
                            </button>
                        </div>
                    </div>

                    <!-- Filters & View Toggle -->
                    <div class="card" style="padding: var(--space-lg);">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-lg);">
                            <div style="display: flex; gap: var(--space-md); flex: 1;">
                                <select class="form-select" id="project-status-filter" onchange="projectsModule.filterProjects()">
                                    <option value="all">Todos los estados</option>
                                    <option value="planning">Planificación</option>
                                    <option value="in_progress">En Progreso</option>
                                    <option value="review">Revisión</option>
                                    <option value="completed">Completado</option>
                                    <option value="on_hold">En Pausa</option>
                                </select>
                                <div style="position: relative; flex: 1;">
                                    <input type="text" class="form-input" placeholder="Buscar proyectos..." 
                                           id="project-search" onkeyup="projectsModule.searchProjects()"
                                           style="padding-left: 40px;">
                                    <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; 
                                       transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-tertiary);"></i>
                                </div>
                            </div>
                            <div style="display: flex; gap: var(--space-sm);">
                                <button class="btn btn-ghost ${this.currentView === 'grid' ? 'active' : ''}" 
                                        onclick="projectsModule.switchView('grid')">
                                    <i data-lucide="grid-3x3"></i>
                                </button>
                                <button class="btn btn-ghost ${this.currentView === 'list' ? 'active' : ''}" 
                                        onclick="projectsModule.switchView('list')">
                                    <i data-lucide="list"></i>
                                </button>
                                <button class="btn btn-ghost ${this.currentView === 'kanban' ? 'active' : ''}" 
                                        onclick="projectsModule.switchView('kanban')">
                                    <i data-lucide="columns"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Projects Container -->
                    <div id="projects-container">
                        ${this.renderProjectsView()}
                    </div>
                </div>
            </div>

            <!-- New Project Modal -->
            ${this.renderNewProjectModal()}
        `;

        container.innerHTML = projectsHTML;
        window.projectsModule = this;
    }

    renderProjectsView() {
        switch (this.currentView) {
            case 'grid':
                return this.renderGridView();
            case 'list':
                return this.renderListView();
            case 'kanban':
                return this.renderKanbanView();
            default:
                return this.renderGridView();
        }
    }

    renderGridView() {
        const projects = this.getFilteredProjects();
        
        return `
            <div class="grid grid-cols-3" style="gap: var(--space-xl);">
                ${projects.map(project => `
                    <div class="card project-grid-card" onclick="projectsModule.viewProject('${project.id}')"
                         style="cursor: pointer; transition: all var(--transition-fast);">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-lg);">
                            <div style="width: 56px; height: 56px; background: ${project.color}; 
                                       border-radius: var(--radius-xl); display: flex; align-items: center; 
                                       justify-content: center; color: white; font-weight: 800; font-size: var(--font-size-lg);">
                                ${this.getInitials(project.title)}
                            </div>
                            ${this.renderStatusBadge(project.status)}
                        </div>
                        
                        <h3 style="font-weight: 700; color: var(--text-primary); font-size: var(--font-size-lg); 
                                   margin-bottom: var(--space-sm);">${project.title}</h3>
                        <p style="color: var(--text-secondary); font-size: var(--font-size-sm); 
                                  margin-bottom: var(--space-lg);">${project.client}</p>
                        
                        <div style="margin-bottom: var(--space-lg);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-sm);">
                                <span style="font-size: var(--font-size-sm); color: var(--text-secondary);">Progreso</span>
                                <span style="font-size: var(--font-size-sm); font-weight: 700; color: var(--text-primary);">
                                    ${project.progress}%
                                </span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${project.progress}%;"></div>
                            </div>
                        </div>
                        
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div style="display: flex; align-items: center; gap: var(--space-sm);">
                                <i data-lucide="calendar" style="width: 16px; height: 16px; color: var(--text-tertiary);"></i>
                                <span style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                                    ${this.formatDate(project.deadline)}
                                </span>
                            </div>
                            <div style="display: flex; align-items: center; gap: var(--space-sm);">
                                <i data-lucide="users" style="width: 16px; height: 16px; color: var(--text-tertiary);"></i>
                                <span style="font-size: var(--font-size-sm); color: var(--text-secondary);">
                                    ${project.team.length}
                                </span>
                            </div>
                        </div>
                    </div>
                `).join('')}
                
                <!-- Add New Project Card -->
                <div class="card" onclick="projectsModule.showNewProjectModal()"
                     style="cursor: pointer; border: 2px dashed var(--border-primary); 
                            display: flex; align-items: center; justify-content: center; 
                            min-height: 300px; transition: all var(--transition-fast);"
                     onmouseover="this.style.borderColor='var(--mep-primary-500)'"
                     onmouseout="this.style.borderColor='var(--border-primary)'">
                    <div style="text-align: center;">
                        <div style="width: 64px; height: 64px; background: var(--bg-tertiary); 
                                   border-radius: var(--radius-full); display: flex; align-items: center; 
                                   justify-content: center; margin: 0 auto var(--space-md);">
                            <i data-lucide="plus" style="width: 32px; height: 32px; color: var(--text-secondary);"></i>
                        </div>
                        <p style="font-weight: 600; color: var(--text-primary);">Crear Nuevo Proyecto</p>
                        <p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: var(--space-xs);">
                            Haz clic para empezar
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    renderListView() {
        const projects = this.getFilteredProjects();
        
        return `
            <div class="card">
                <div style="overflow-x: auto;">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Proyecto</th>
                                <th>Cliente</th>
                                <th>Estado</th>
                                <th>Progreso</th>
                                <th>Equipo</th>
                                <th>Fecha Límite</th>
                                <th style="text-align: center;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${projects.map(project => `
                                <tr>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: var(--space-md);">
                                            <div style="width: 40px; height: 40px; background: ${project.color}; 
                                                       border-radius: var(--radius-lg); display: flex; align-items: center; 
                                                       justify-content: center; color: white; font-weight: 700;">
                                                ${this.getInitials(project.title)}
                                            </div>
                                            <div>
                                                <div style="font-weight: 600; color: var(--text-primary);">
                                                    ${project.title}
                                                </div>
                                                <div style="font-size: var(--font-size-xs); color: var(--text-secondary);">
                                                    ${project.id}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>${project.client}</td>
                                    <td>${this.renderStatusBadge(project.status)}</td>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: var(--space-sm);">
                                            <div class="progress-bar" style="width: 100px; height: 6px;">
                                                <div class="progress-fill" style="width: ${project.progress}%;"></div>
                                            </div>
                                            <span style="font-weight: 600; font-size: var(--font-size-sm);">
                                                ${project.progress}%
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style="display: flex; align-items: center;">
                                            ${project.team.slice(0, 3).map((member, index) => `
                                                <div class="user-avatar" style="width: 32px; height: 32px; 
                                                     margin-left: ${index > 0 ? '-8px' : '0'}; 
                                                     border: 2px solid var(--bg-surface); z-index: ${3 - index};">
                                                    ${member.initials}
                                                </div>
                                            `).join('')}
                                            ${project.team.length > 3 ? `
                                                <span style="margin-left: var(--space-sm); font-size: var(--font-size-sm); 
                                                             color: var(--text-secondary);">
                                                    +${project.team.length - 3}
                                                </span>
                                            ` : ''}
                                        </div>
                                    </td>
                                    <td>${this.formatDate(project.deadline)}</td>
                                    <td>
                                        <div style="display: flex; gap: var(--space-xs); justify-content: center;">
                                            <button class="btn btn-ghost" onclick="projectsModule.viewProject('${project.id}')"
                                                    style="padding: var(--space-sm);">
                                                <i data-lucide="eye" style="width: 16px; height: 16px;"></i>
                                            </button>
                                            <button class="btn btn-ghost" onclick="projectsModule.editProject('${project.id}')"
                                                    style="padding: var(--space-sm);">
                                                <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                                            </button>
                                            <button class="btn btn-ghost" onclick="projectsModule.deleteProject('${project.id}')"
                                                    style="padding: var(--space-sm);">
                                                <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderKanbanView() {
        const statuses = ['planning', 'in_progress', 'review', 'completed'];
        const statusLabels = {
            planning: 'Planificación',
            in_progress: 'En Progreso',
            review: 'Revisión',
            completed: 'Completado'
        };
        
        return `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-lg); overflow-x: auto;">
                ${statuses.map(status => {
                    const statusProjects = this.getProjectsByStatus(status);
                    return `
                        <div class="kanban-column">
                            <div style="padding: var(--space-lg); background: var(--bg-tertiary); 
                                       border-radius: var(--radius-xl); margin-bottom: var(--space-md);">
                                <h4 style="font-weight: 700; color: var(--text-primary); 
                                          display: flex; justify-content: space-between; align-items: center;">
                                    ${statusLabels[status]}
                                    <span class="badge badge-primary">${statusProjects.length}</span>
                                </h4>
                            </div>
                            <div class="space-y-4" ondrop="projectsModule.handleDrop(event, '${status}')" 
                                 ondragover="projectsModule.handleDragOver(event)">
                                ${statusProjects.map(project => `
                                    <div class="kanban-task" draggable="true" 
                                         ondragstart="projectsModule.handleDragStart(event, '${project.id}')"
                                         style="background: var(--bg-surface); padding: var(--space-lg); 
                                                border-radius: var(--radius-lg); border: 1px solid var(--border-primary); 
                                                cursor: grab;">
                                        <div style="display: flex; justify-content: space-between; align-items: start; 
                                                   margin-bottom: var(--space-md);">
                                            <h5 style="font-weight: 600; color: var(--text-primary); flex: 1;">
                                                ${project.title}
                                            </h5>
                                            <button class="btn btn-ghost" style="padding: 4px;">
                                                <i data-lucide="more-horizontal" style="width: 16px; height: 16px;"></i>
                                            </button>
                                        </div>
                                        <p style="font-size: var(--font-size-sm); color: var(--text-secondary); 
                                                 margin-bottom: var(--space-md);">${project.client}</p>
                                        
                                        <div style="display: flex; justify-content: space-between; align-items: center; 
                                                   margin-bottom: var(--space-md);">
                                            <div class="progress-bar" style="flex: 1; height: 4px;">
                                                <div class="progress-fill" style="width: ${project.progress}%;"></div>
                                            </div>
                                            <span style="font-size: var(--font-size-xs); font-weight: 700; 
                                                        color: var(--text-primary); margin-left: var(--space-sm);">
                                                ${project.progress}%
                                            </span>
                                        </div>
                                        
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <div style="display: flex; align-items: center;">
                                                ${project.team.slice(0, 2).map((member, index) => `
                                                    <div class="user-avatar" style="width: 24px; height: 24px; 
                                                         font-size: var(--font-size-xs);
                                                         margin-left: ${index > 0 ? '-6px' : '0'};">
                                                        ${member.initials}
                                                    </div>
                                                `).join('')}
                                            </div>
                                            <span style="font-size: var(--font-size-xs); color: var(--text-tertiary);">
                                                ${this.formatDate(project.deadline)}
                                            </span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderNewProjectModal() {
        return `
            <div id="new-project-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Nuevo Proyecto</h2>
                        <button class="modal-close" onclick="projectsModule.hideNewProjectModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    
                    <form onsubmit="projectsModule.createProject(event)">
                        <div class="form-group">
                            <label class="form-label">Nombre del Proyecto</label>
                            <input type="text" class="form-input" id="project-name" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Cliente</label>
                            <input type="text" class="form-input" id="project-client" required>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg);">
                            <div class="form-group">
                                <label class="form-label">Fecha de Inicio</label>
                                <input type="date" class="form-input" id="project-start-date" required>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Fecha Límite</label>
                                <input type="date" class="form-input" id="project-deadline" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Descripción</label>
                            <textarea class="form-textarea" id="project-description" rows="4"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Presupuesto</label>
                            <input type="number" class="form-input" id="project-budget" placeholder="0.00" step="0.01">
                        </div>
                        
                        <div style="display: flex; gap: var(--space-md); justify-content: flex-end; margin-top: var(--space-xl);">
                            <button type="button" class="btn btn-secondary" onclick="projectsModule.hideNewProjectModal()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Crear Proyecto
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // Methods
    getFilteredProjects() {
        // Simulación de proyectos
        this.projects = [
            {
                id: 'PRJ-001',
                title: 'Sistema ERP Integrado',
                client: 'TechSolutions Inc.',
                status: 'in_progress',
                progress: 78,
                deadline: new Date('2025-06-15'),
                team: [
                    { id: 1, name: 'Beatriz Tudela', initials: 'BT' },
                    { id: 2, name: 'Francisco Gallego', initials: 'FG' },
                    { id: 3, name: 'Mari Carmen Lay', initials: 'MC' },
                    { id: 4, name: 'Pedro Sánchez', initials: 'PS' }
                ],
                color: 'linear-gradient(135deg, var(--mep-primary-500), var(--mep-primary-600))'
            },
            {
                id: 'PRJ-002',
                title: 'CRM 360° Enterprise',
                client: 'Global Ventures',
                status: 'planning',
                progress: 25,
                deadline: new Date('2025-07-30'),
                team: [
                    { id: 2, name: 'Francisco Gallego', initials: 'FG' },
                    { id: 5, name: 'Laura Martín', initials: 'LM' }
                ],
                color: 'linear-gradient(135deg, var(--mep-info), #1D4ED8)'
            },
            {
                id: 'PRJ-003',
                title: 'Inventory Tracking System',
                client: 'Logistics Pro',
                status: 'review',
                progress: 92,
                deadline: new Date('2025-06-05'),
                team: [
                    { id: 1, name: 'Beatriz Tudela', initials: 'BT' },
                    { id: 3, name: 'Mari Carmen Lay', initials: 'MC' },
                    { id: 6, name: 'Jorge Fernández', initials: 'JF' }
                ],
                color: 'linear-gradient(135deg, var(--mep-warning), #EA580C)'
            }
        ];

        let filtered = [...this.projects];

        // Filter by status
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(p => p.status === this.filters.status);
        }

        // Filter by search
        if (this.filters.search) {
            const search = this.filters.search.toLowerCase();
            filtered = filtered.filter(p => 
                p.title.toLowerCase().includes(search) ||
                p.client.toLowerCase().includes(search)
            );
        }

        return filtered;
    }

    getProjectsByStatus(status) {
        return this.getFilteredProjects().filter(p => p.status === status);
    }

    renderStatusBadge(status) {
        const statusConfig = MEP_CONFIG.PROJECT_STATUS[status.toUpperCase()] || {};
        const colors = {
            planning: 'info',
            in_progress: 'warning',
            review: 'primary',
            completed: 'success',
            on_hold: 'secondary',
            cancelled: 'danger'
        };
        
        return `<span class="badge badge-${colors[status]}">${statusConfig.label || status}</span>`;
    }

    getInitials(text) {
        return text.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
    }

    formatDate(date) {
        return MEP_Utils.formatDate(date, 'DD/MM/YYYY');
    }

    switchView(view) {
        this.currentView = view;
        this.refreshProjects();
    }

    filterProjects() {
        const statusFilter = MEP_Utils.$('#project-status-filter');
        this.filters.status = statusFilter.value;
        this.refreshProjects();
    }

    searchProjects() {
        const searchInput = MEP_Utils.$('#project-search');
        this.filters.search = searchInput.value;
        this.refreshProjects();
    }

    refreshProjects() {
        const container = MEP_Utils.$('#projects-container');
        container.innerHTML = this.renderProjectsView();
        window.app.initIcons();
    }

    showNewProjectModal() {
        const modal = MEP_Utils.$('#new-project-modal');
        modal.classList.add('show');
    }

    hideNewProjectModal() {
        const modal = MEP_Utils.$('#new-project-modal');
        modal.classList.remove('show');
    }

    createProject(event) {
        event.preventDefault();
        
        const projectData = {
            name: MEP_Utils.$('#project-name').value,
            client: MEP_Utils.$('#project-client').value,
            startDate: MEP_Utils.$('#project-start-date').value,
            deadline: MEP_Utils.$('#project-deadline').value,
            description: MEP_Utils.$('#project-description').value,
            budget: MEP_Utils.$('#project-budget').value
        };
        
        console.log('Creating project:', projectData);
        
        // Aquí iría la lógica para crear el proyecto
        showNotification('Proyecto Creado', `${projectData.name} ha sido creado exitosamente`, 'success');
        
        this.hideNewProjectModal();
        this.refreshProjects();
    }

    viewProject(projectId) {
        console.log('Viewing project:', projectId);
        // Aquí iría la lógica para ver el proyecto
    }

    editProject(projectId) {
        console.log('Editing project:', projectId);
        // Aquí iría la lógica para editar el proyecto
    }

    deleteProject(projectId) {
        if (confirm('¿Estás seguro de que deseas eliminar este proyecto?')) {
            console.log('Deleting project:', projectId);
            showNotification('Proyecto Eliminado', 'El proyecto ha sido eliminado', 'success');
            this.refreshProjects();
        }
    }

    exportProjects() {
        console.log('Exporting projects...');
        showNotification('Exportando', 'Preparando archivo de exportación...', 'info');
    }

    // Drag and Drop for Kanban
    handleDragStart(event, projectId) {
        event.dataTransfer.setData('projectId', projectId);
    }

    handleDragOver(event) {
        event.preventDefault();
    }

    handleDrop(event, newStatus) {
        event.preventDefault();
        const projectId = event.dataTransfer.getData('projectId');
        
        // Update project status
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            project.status = newStatus;
            this.refreshProjects();
            showNotification('Estado Actualizado', `${project.title} movido a ${newStatus}`, 'success');
        }
    }

    async afterRender() {
        // Initialize any project-specific functionality
        console.log('Projects module initialized');
    }
}