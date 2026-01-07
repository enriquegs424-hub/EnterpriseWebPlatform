


// ===== TASKS MODULE =====

class TasksModule {
    constructor() {
        this.tasks = [];
        this.currentView = 'list';
        this.filters = {
            status: 'all',
            priority: 'all',
            assignee: 'all',
            search: ''
        };
    }

    async render(container) {
        const tasksHTML = `
            <div class="module-content" id="tasks-module">
                <div class="space-y-6">
                    <!-- Header -->
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 style="font-size: var(--font-size-3xl); font-weight: 800; color: var(--text-primary); margin-bottom: var(--space-xs);">
                                Gestión de Tareas
                            </h2>
                            <p style="color: var(--text-secondary); font-size: var(--font-size-lg); font-weight: 500;">
                                Organiza y prioriza todas tus tareas pendientes
                            </p>
                        </div>
                        <div style="display: flex; gap: var(--space-md);">
                            <button class="btn btn-secondary" onclick="tasksModule.showFilters()">
                                <i data-lucide="filter"></i>
                                Filtros
                            </button>
                            <button class="btn btn-primary" onclick="tasksModule.showNewTaskModal()">
                                <i data-lucide="plus"></i>
                                Nueva Tarea
                            </button>
                        </div>
                    </div>

                    <!-- Stats Overview -->
                    <div class="grid grid-cols-4">
                        ${this.renderTaskStats()}
                    </div>

                    <!-- Filters & View Toggle -->
                    <div class="card" style="padding: var(--space-lg);">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--space-lg);">
                            <div style="display: flex; gap: var(--space-md); flex: 1;">
                                <select class="form-select" id="task-status-filter" onchange="tasksModule.applyFilters()">
                                    <option value="all">Todos los estados</option>
                                    <option value="todo">Por hacer</option>
                                    <option value="in_progress">En progreso</option>
                                    <option value="review">En revisión</option>
                                    <option value="completed">Completadas</option>
                                </select>
                                <select class="form-select" id="task-priority-filter" onchange="tasksModule.applyFilters()">
                                    <option value="all">Todas las prioridades</option>
                                    <option value="urgent">Urgente</option>
                                    <option value="high">Alta</option>
                                    <option value="medium">Media</option>
                                    <option value="low">Baja</option>
                                </select>
                                <div style="position: relative; flex: 1;">
                                    <input type="text" class="form-input" placeholder="Buscar tareas..." 
                                           id="task-search" onkeyup="tasksModule.searchTasks()"
                                           style="padding-left: 40px;">
                                    <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; 
                                       transform: translateY(-50%); width: 18px; height: 18px; color: var(--text-tertiary);"></i>
                                </div>
                            </div>
                            <div style="display: flex; gap: var(--space-sm);">
                                <button class="btn btn-ghost ${this.currentView === 'list' ? 'active' : ''}" 
                                        onclick="tasksModule.switchView('list')">
                                    <i data-lucide="list"></i>
                                </button>
                                <button class="btn btn-ghost ${this.currentView === 'kanban' ? 'active' : ''}" 
                                        onclick="tasksModule.switchView('kanban')">
                                    <i data-lucide="columns"></i>
                                </button>
                                <button class="btn btn-ghost ${this.currentView === 'calendar' ? 'active' : ''}" 
                                        onclick="tasksModule.switchView('calendar')">
                                    <i data-lucide="calendar"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Tasks Container -->
                    <div id="tasks-container">
                        ${this.renderTasksView()}
                    </div>
                </div>
            </div>

            <!-- New Task Modal -->
            ${this.renderNewTaskModal()}
        `;

        container.innerHTML = tasksHTML;
        window.tasksModule = this;
    }

    renderTaskStats() {
        const stats = [
            {
                title: 'Total Tareas',
                value: '189',
                icon: 'check-square',
                color: 'var(--mep-primary-500)',
                subtitle: 'Todas las tareas activas'
            },
            {
                title: 'Completadas Hoy',
                value: '12',
                icon: 'check-circle',
                color: 'var(--mep-success)',
                subtitle: '+5 vs ayer'
            },
            {
                title: 'En Progreso',
                value: '34',
                icon: 'clock',
                color: 'var(--mep-warning)',
                subtitle: '18% del total'
            },
            {
                title: 'Urgentes',
                value: '7',
                icon: 'alert-triangle',
                color: 'var(--mep-error)',
                subtitle: 'Requieren atención'
            }
        ];

        return stats.map(stat => `
            <div class="stat-card">
                <div class="stat-header">
                    <div class="stat-content">
                        <h3>${stat.title}</h3>
                        <p>${stat.value}</p>
                        <div style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-top: var(--space-xs);">
                            ${stat.subtitle}
                        </div>
                    </div>
                    <div class="stat-icon" style="background: ${stat.color};">
                        <i data-lucide="${stat.icon}" style="width: 28px; height: 28px;"></i>
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderTasksView() {
        switch (this.currentView) {
            case 'list':
                return this.renderListView();
            case 'kanban':
                return this.renderKanbanView();
            case 'calendar':
                return this.renderCalendarView();
            default:
                return this.renderListView();
        }
    }

    renderListView() {
        const tasks = this.getFilteredTasks();
        const groupedTasks = this.groupTasksByDate(tasks);
        
        return `
            <div class="space-y-6">
                ${Object.entries(groupedTasks).map(([date, dateTasks]) => `
                    <div class="card">
                        <h4 style="font-weight: 700; color: var(--text-primary); margin-bottom: var(--space-lg); 
                                   display: flex; align-items: center; gap: var(--space-md);">
                            <i data-lucide="calendar" style="width: 20px; height: 20px; color: var(--text-secondary);"></i>
                            ${this.formatDateHeader(date)}
                            <span class="badge badge-primary">${dateTasks.length}</span>
                        </h4>
                        
                        <div class="space-y-3">
                            ${dateTasks.map(task => `
                                <div class="task-item" style="display: flex; align-items: center; gap: var(--space-md); 
                                            padding: var(--space-lg); background: var(--bg-tertiary); 
                                            border-radius: var(--radius-lg); border: 1px solid var(--border-primary);">
                                    
                                    <input type="checkbox" class="task-checkbox" 
                                           ${task.status === 'completed' ? 'checked' : ''}
                                           onchange="tasksModule.toggleTask('${task.id}')"
                                           style="width: 20px; height: 20px; cursor: pointer;">
                                    
                                    <div style="flex: 1;">
                                        <div style="display: flex; align-items: center; gap: var(--space-md); margin-bottom: var(--space-sm);">
                                            <h5 style="font-weight: 600; color: var(--text-primary); 
                                                      ${task.status === 'completed' ? 'text-decoration: line-through; opacity: 0.7;' : ''}">
                                                ${task.title}
                                            </h5>
                                            ${this.renderPriorityBadge(task.priority)}
                                            ${task.labels.map(label => `
                                                <span class="badge" style="background: ${label.color}; color: white; font-size: var(--font-size-xs);">
                                                    ${label.name}
                                                </span>
                                            `).join('')}
                                        </div>
                                        
                                        <div style="display: flex; align-items: center; gap: var(--space-xl); 
                                                   font-size: var(--font-size-sm); color: var(--text-secondary);">
                                            <div style="display: flex; align-items: center; gap: var(--space-sm);">
                                                <i data-lucide="briefcase" style="width: 14px; height: 14px;"></i>
                                                ${task.project}
                                            </div>
                                            
                                            <div style="display: flex; align-items: center; gap: var(--space-sm);">
                                                <i data-lucide="user" style="width: 14px; height: 14px;"></i>
                                                ${task.assignee}
                                            </div>
                                            
                                            <div style="display: flex; align-items: center; gap: var(--space-sm);">
                                                <i data-lucide="clock" style="width: 14px; height: 14px;"></i>
                                                ${this.formatTime(task.estimatedTime)}
                                            </div>
                                            
                                            ${task.attachments > 0 ? `
                                                <div style="display: flex; align-items: center; gap: var(--space-sm);">
                                                    <i data-lucide="paperclip" style="width: 14px; height: 14px;"></i>
                                                    ${task.attachments}
                                                </div>
                                            ` : ''}
                                            
                                            ${task.comments > 0 ? `
                                                <div style="display: flex; align-items: center; gap: var(--space-sm);">
                                                    <i data-lucide="message-circle" style="width: 14px; height: 14px;"></i>
                                                    ${task.comments}
                                                </div>
                                            ` : ''}
                                        </div>
                                    </div>
                                    
                                    <div style="display: flex; gap: var(--space-xs);">
                                        <button class="btn btn-ghost" onclick="tasksModule.editTask('${task.id}')"
                                                style="padding: var(--space-sm);">
                                            <i data-lucide="edit-3" style="width: 16px; height: 16px;"></i>
                                        </button>
                                        <button class="btn btn-ghost" onclick="tasksModule.deleteTask('${task.id}')"
                                                style="padding: var(--space-sm);">
                                            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderKanbanView() {
        const columns = [
            { id: 'todo', title: 'Por Hacer', color: 'var(--mep-info)' },
            { id: 'in_progress', title: 'En Progreso', color: 'var(--mep-warning)' },
            { id: 'review', title: 'En Revisión', color: 'var(--mep-primary-500)' },
            { id: 'completed', title: 'Completadas', color: 'var(--mep-success)' }
        ];
        
        return `
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--space-lg); overflow-x: auto;">
                ${columns.map(column => {
                    const columnTasks = this.getTasksByStatus(column.id);
                    return `
                        <div class="kanban-column" style="background: var(--bg-tertiary); 
                                                         border-radius: var(--radius-xl); padding: var(--space-lg);">
                            <div style="display: flex; justify-content: space-between; align-items: center; 
                                       margin-bottom: var(--space-lg);">
                                <h4 style="font-weight: 700; color: var(--text-primary); 
                                          display: flex; align-items: center; gap: var(--space-sm);">
                                    <div style="width: 8px; height: 8px; background: ${column.color}; 
                                               border-radius: var(--radius-full);"></div>
                                    ${column.title}
                                </h4>
                                <span class="badge" style="background: ${column.color}; color: white;">
                                    ${columnTasks.length}
                                </span>
                            </div>
                            
                            <div class="space-y-3" ondrop="tasksModule.handleDrop(event, '${column.id}')" 
                                 ondragover="tasksModule.handleDragOver(event)"
                                 style="min-height: 400px;">
                                ${columnTasks.map(task => `
                                    <div class="kanban-task" draggable="true" 
                                         ondragstart="tasksModule.handleDragStart(event, '${task.id}')"
                                         style="background: var(--bg-surface); padding: var(--space-md); 
                                                border-radius: var(--radius-lg); border: 1px solid var(--border-primary);">
                                        
                                        <div style="display: flex; justify-content: space-between; align-items: start; 
                                                   margin-bottom: var(--space-sm);">
                                            <h5 style="font-weight: 600; color: var(--text-primary); 
                                                      font-size: var(--font-size-sm); flex: 1;">
                                                ${task.title}
                                            </h5>
                                            ${this.renderPriorityIndicator(task.priority)}
                                        </div>
                                        
                                        <p style="font-size: var(--font-size-xs); color: var(--text-secondary); 
                                                 margin-bottom: var(--space-md); line-height: 1.4;">
                                            ${task.description || 'Sin descripción'}
                                        </p>
                                        
                                        <div style="display: flex; justify-content: space-between; align-items: center;">
                                            <div style="display: flex; align-items: center; gap: var(--space-xs);">
                                                <div class="user-avatar" style="width: 24px; height: 24px; 
                                                     font-size: var(--font-size-xs);">
                                                    ${this.getInitials(task.assignee)}
                                                </div>
                                                <span style="font-size: var(--font-size-xs); color: var(--text-secondary);">
                                                    ${task.assignee.split(' ')[0]}
                                                </span>
                                            </div>
                                            
                                            <div style="display: flex; align-items: center; gap: var(--space-sm); 
                                                       font-size: var(--font-size-xs); color: var(--text-tertiary);">
                                                ${task.attachments > 0 ? `
                                                    <div style="display: flex; align-items: center; gap: 2px;">
                                                        <i data-lucide="paperclip" style="width: 12px; height: 12px;"></i>
                                                        ${task.attachments}
                                                    </div>
                                                ` : ''}
                                                ${task.comments > 0 ? `
                                                    <div style="display: flex; align-items: center; gap: 2px;">
                                                        <i data-lucide="message-circle" style="width: 12px; height: 12px;"></i>
                                                        ${task.comments}
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                        
                                        ${task.dueDate ? `
                                            <div style="margin-top: var(--space-sm); padding-top: var(--space-sm); 
                                                       border-top: 1px solid var(--border-primary);">
                                                <div style="display: flex; align-items: center; gap: var(--space-xs); 
                                                           font-size: var(--font-size-xs); color: ${this.getDueDateColor(task.dueDate)};">
                                                    <i data-lucide="calendar" style="width: 12px; height: 12px;"></i>
                                                    ${this.formatDate(task.dueDate)}
                                                </div>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                                
                                <!-- Add task button -->
                                <button class="btn btn-ghost" onclick="tasksModule.quickAddTask('${column.id}')"
                                        style="width: 100%; padding: var(--space-sm); border: 2px dashed var(--border-primary); 
                                               border-radius: var(--radius-lg); margin-top: var(--space-md);">
                                    <i data-lucide="plus" style="width: 16px; height: 16px;"></i>
                                    Añadir tarea
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    renderCalendarView() {
        // Simplified calendar view
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        return `
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-xl);">
                    <h3 style="font-size: var(--font-size-xl); font-weight: 700; color: var(--text-primary);">
                        ${monthNames[currentMonth]} ${currentYear}
                    </h3>
                    <div style="display: flex; gap: var(--space-sm);">
                        <button class="btn btn-ghost" onclick="tasksModule.previousMonth()">
                            <i data-lucide="chevron-left"></i>
                        </button>
                        <button class="btn btn-ghost" onclick="tasksModule.nextMonth()">
                            <i data-lucide="chevron-right"></i>
                        </button>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 1px; 
                           background: var(--border-primary); border: 1px solid var(--border-primary); 
                           border-radius: var(--radius-lg); overflow: hidden;">
                    
                    <!-- Days of week -->
                    ${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => `
                        <div style="background: var(--bg-tertiary); padding: var(--space-md); 
                                   text-align: center; font-weight: 700; font-size: var(--font-size-sm); 
                                   color: var(--text-secondary);">
                            ${day}
                        </div>
                    `).join('')}
                    
                    <!-- Calendar days -->
                    ${this.renderCalendarDays(firstDayOfMonth, daysInMonth, currentMonth, currentYear)}
                </div>
            </div>
        `;
    }

    renderCalendarDays(firstDay, daysInMonth, month, year) {
        let days = [];
        
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            days.push(`<div style="background: var(--bg-surface); padding: var(--space-md); min-height: 100px;"></div>`);
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const tasks = this.getTasksByDate(date);
            const isToday = this.isToday(date);
            
            days.push(`
                <div style="background: var(--bg-surface); padding: var(--space-md); min-height: 100px; 
                           ${isToday ? 'border: 2px solid var(--mep-primary-500);' : ''}
                           cursor: pointer;" 
                     onclick="tasksModule.showDayTasks('${date.toISOString()}')">
                    <div style="font-weight: ${isToday ? '700' : '500'}; 
                               color: ${isToday ? 'var(--mep-primary-600)' : 'var(--text-primary)'}; 
                               margin-bottom: var(--space-sm);">
                        ${day}
                    </div>
                    ${tasks.slice(0, 3).map(task => `
                        <div style="font-size: var(--font-size-xs); padding: 2px 4px; 
                                   background: ${this.getPriorityColor(task.priority)}; 
                                   color: white; border-radius: var(--radius-sm); 
                                   margin-bottom: 2px; white-space: nowrap; 
                                   overflow: hidden; text-overflow: ellipsis;">
                            ${task.title}
                        </div>
                    `).join('')}
                    ${tasks.length > 3 ? `
                        <div style="font-size: var(--font-size-xs); color: var(--text-tertiary); 
                                   text-align: center; margin-top: var(--space-xs);">
                            +${tasks.length - 3} más
                        </div>
                    ` : ''}
                </div>
            `);
        }
        
        return days.join('');
    }

    renderNewTaskModal() {
        return `
            <div id="new-task-modal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">Nueva Tarea</h2>
                        <button class="modal-close" onclick="tasksModule.hideNewTaskModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    
                    <form onsubmit="tasksModule.createTask(event)">
                        <div class="form-group">
                            <label class="form-label">Título de la Tarea</label>
                            <input type="text" class="form-input" id="task-title" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Descripción</label>
                            <textarea class="form-textarea" id="task-description" rows="3"></textarea>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg);">
                            <div class="form-group">
                                <label class="form-label">Proyecto</label>
                                <select class="form-select" id="task-project" required>
                                    <option value="">Seleccionar proyecto...</option>
                                    <option value="erp-system">Sistema ERP Integrado</option>
                                    <option value="crm-360">CRM 360° Enterprise</option>
                                    <option value="inventory">Inventory Tracking System</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Asignar a</label>
                                <select class="form-select" id="task-assignee" required>
                                    <option value="">Seleccionar responsable...</option>
                                    <option value="Beatriz Tudela">Beatriz Tudela</option>
                                    <option value="Francisco Gallego">Francisco Gallego</option>
                                    <option value="Mari Carmen Lay">Mari Carmen Lay</option>
                                    <option value="Pedro Sánchez">Pedro Sánchez</option>
                                </select>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-lg);">
                            <div class="form-group">
                                <label class="form-label">Prioridad</label>
                                <select class="form-select" id="task-priority" required>
                                    <option value="low">Baja</option>
                                    <option value="medium" selected>Media</option>
                                    <option value="high">Alta</option>
                                    <option value="urgent">Urgente</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Fecha límite</label>
                                <input type="date" class="form-input" id="task-due-date">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Tiempo estimado (horas)</label>
                            <input type="number" class="form-input" id="task-estimated-time" 
                                   placeholder="0" min="0" step="0.5">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Etiquetas</label>
                            <input type="text" class="form-input" id="task-labels" 
                                   placeholder="Separadas por comas (ej: frontend, diseño, urgente)">
                        </div>
                        
                        <div style="display: flex; gap: var(--space-md); justify-content: flex-end; margin-top: var(--space-xl);">
                            <button type="button" class="btn btn-secondary" onclick="tasksModule.hideNewTaskModal()">
                                Cancelar
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Crear Tarea
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    // Methods
    getFilteredTasks() {
        // Mock tasks data
        this.tasks = [
            {
                id: 'TSK-001',
                title: 'Implementar autenticación OAuth2',
                description: 'Integrar sistema de autenticación con Google y Microsoft',
                project: 'Sistema ERP Integrado',
                assignee: 'Beatriz Tudela',
                status: 'in_progress',
                priority: 'high',
                dueDate: new Date('2025-06-05'),
                estimatedTime: 8,
                labels: [
                    { name: 'Backend', color: '#3B82F6' },
                    { name: 'Seguridad', color: '#EF4444' }
                ],
                attachments: 2,
                comments: 5
            },
            {
                id: 'TSK-002',
                title: 'Diseñar mockups del dashboard',
                description: 'Crear diseños en Figma para el nuevo dashboard',
                project: 'CRM 360° Enterprise',
                assignee: 'Mari Carmen Lay',
                status: 'review',
                priority: 'medium',
                dueDate: new Date('2025-06-03'),
                estimatedTime: 12,
                labels: [
                    { name: 'Diseño', color: '#8B5CF6' },
                    { name: 'UI/UX', color: '#F59E0B' }
                ],
                attachments: 5,
                comments: 8
            },
            {
                id: 'TSK-003',
                title: 'Optimizar consultas SQL',
                description: 'Mejorar rendimiento de las consultas principales',
                project: 'Sistema ERP Integrado',
                assignee: 'Francisco Gallego',
                status: 'todo',
                priority: 'urgent',
                dueDate: new Date('2025-06-01'),
                estimatedTime: 6,
                labels: [
                    { name: 'Backend', color: '#3B82F6' },
                    { name: 'Performance', color: '#10B981' }
                ],
                attachments: 0,
                comments: 3
            }
        ];

        let filtered = [...this.tasks];

        // Apply filters
        if (this.filters.status !== 'all') {
            filtered = filtered.filter(t => t.status === this.filters.status);
        }

        if (this.filters.priority !== 'all') {
            filtered = filtered.filter(t => t.priority === this.filters.priority);
        }

        if (this.filters.assignee !== 'all') {
            filtered = filtered.filter(t => t.assignee === this.filters.assignee);
        }

        if (this.filters.search) {const search = this.filters.search.toLowerCase();
           filtered = filtered.filter(t => 
               t.title.toLowerCase().includes(search) ||
               t.description.toLowerCase().includes(search) ||
               t.project.toLowerCase().includes(search)
           );
       }

       return filtered;
   }

   getTasksByStatus(status) {
       return this.getFilteredTasks().filter(t => t.status === status);
   }

   getTasksByDate(date) {
       return this.getFilteredTasks().filter(t => 
           t.dueDate && this.isSameDay(t.dueDate, date)
       );
   }

   groupTasksByDate(tasks) {
       const groups = {};
       
       tasks.forEach(task => {
           const dateKey = task.dueDate ? this.formatDateKey(task.dueDate) : 'Sin fecha';
           if (!groups[dateKey]) {
               groups[dateKey] = [];
           }
           groups[dateKey].push(task);
       });
       
       // Sort groups by date
       const sortedGroups = {};
       Object.keys(groups).sort((a, b) => {
           if (a === 'Sin fecha') return 1;
           if (b === 'Sin fecha') return -1;
           return new Date(a) - new Date(b);
       }).forEach(key => {
           sortedGroups[key] = groups[key];
       });
       
       return sortedGroups;
   }

   renderPriorityBadge(priority) {
       const config = MEP_CONFIG.TASK_PRIORITY[priority.toUpperCase()] || {};
       const colors = {
           urgent: 'danger',
           high: 'warning',
           medium: 'info',
           low: 'secondary'
       };
       
       return `
           <span class="badge badge-${colors[priority]}" style="display: flex; align-items: center; gap: 4px;">
               <i data-lucide="${config.icon || 'flag'}" style="width: 12px; height: 12px;"></i>
               ${config.label || priority}
           </span>
       `;
   }

   renderPriorityIndicator(priority) {
       const colors = {
           urgent: 'var(--mep-error)',
           high: 'var(--mep-warning)',
           medium: 'var(--mep-info)',
           low: 'var(--text-tertiary)'
       };
       
       return `
           <div style="width: 8px; height: 8px; background: ${colors[priority]}; 
                      border-radius: var(--radius-full); flex-shrink: 0;"></div>
       `;
   }

   getPriorityColor(priority) {
       const colors = {
           urgent: 'var(--mep-error)',
           high: 'var(--mep-warning)',
           medium: 'var(--mep-info)',
           low: 'var(--mep-gray-500)'
       };
       return colors[priority] || colors.medium;
   }

   getDueDateColor(dueDate) {
       const today = new Date();
       const date = new Date(dueDate);
       const diffDays = Math.ceil((date - today) / (1000 * 60 * 60 * 24));
       
       if (diffDays < 0) return 'var(--mep-error)';
       if (diffDays <= 2) return 'var(--mep-warning)';
       if (diffDays <= 7) return 'var(--mep-info)';
       return 'var(--text-secondary)';
   }

   formatDate(date) {
       return MEP_Utils.formatDate(date, 'DD/MM/YYYY');
   }

   formatDateKey(date) {
       return date.toISOString().split('T')[0];
   }

   formatDateHeader(dateKey) {
       if (dateKey === 'Sin fecha') return dateKey;
       
       const date = new Date(dateKey);
       const today = new Date();
       const tomorrow = new Date(today);
       tomorrow.setDate(tomorrow.getDate() + 1);
       
       if (this.isSameDay(date, today)) return 'Hoy';
       if (this.isSameDay(date, tomorrow)) return 'Mañana';
       
       const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
       return date.toLocaleDateString('es-ES', options);
   }

   formatTime(hours) {
       if (hours < 1) return `${hours * 60}min`;
       return `${hours}h`;
   }

   isSameDay(date1, date2) {
       return date1.getFullYear() === date2.getFullYear() &&
              date1.getMonth() === date2.getMonth() &&
              date1.getDate() === date2.getDate();
   }

   isToday(date) {
       return this.isSameDay(date, new Date());
   }

   getInitials(name) {
       return name.split(' ').map(n => n[0]).join('').toUpperCase();
   }

   // Event handlers
   switchView(view) {
       this.currentView = view;
       this.refreshTasks();
   }

   applyFilters() {
       this.filters.status = MEP_Utils.$('#task-status-filter').value;
       this.filters.priority = MEP_Utils.$('#task-priority-filter').value;
       this.refreshTasks();
   }

   searchTasks() {
       this.filters.search = MEP_Utils.$('#task-search').value;
       this.refreshTasks();
   }

   refreshTasks() {
       const container = MEP_Utils.$('#tasks-container');
       container.innerHTML = this.renderTasksView();
       window.app.initIcons();
   }

   showNewTaskModal() {
       const modal = MEP_Utils.$('#new-task-modal');
       modal.classList.add('show');
   }

   hideNewTaskModal() {
       const modal = MEP_Utils.$('#new-task-modal');
       modal.classList.remove('show');
       
       // Reset form
       MEP_Utils.$('#new-task-modal form').reset();
   }

   createTask(event) {
       event.preventDefault();
       
       const taskData = {
           title: MEP_Utils.$('#task-title').value,
           description: MEP_Utils.$('#task-description').value,
           project: MEP_Utils.$('#task-project').value,
           assignee: MEP_Utils.$('#task-assignee').value,
           priority: MEP_Utils.$('#task-priority').value,
           dueDate: MEP_Utils.$('#task-due-date').value,
           estimatedTime: MEP_Utils.$('#task-estimated-time').value,
           labels: MEP_Utils.$('#task-labels').value.split(',').map(l => l.trim()).filter(l => l)
       };
       
       console.log('Creating task:', taskData);
       
       // Add task to list
       const newTask = {
           id: `TSK-${Date.now()}`,
           ...taskData,
           status: 'todo',
           labels: taskData.labels.map(name => ({
               name,
               color: this.getRandomColor()
           })),
           attachments: 0,
           comments: 0,
           dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null
       };
       
       this.tasks.push(newTask);
       
       showNotification('Tarea Creada', `${taskData.title} ha sido creada exitosamente`, 'success');
       
       this.hideNewTaskModal();
       this.refreshTasks();
   }

   quickAddTask(status) {
       // Quick add task for kanban columns
       const title = prompt('Título de la tarea:');
       if (title) {
           const newTask = {
               id: `TSK-${Date.now()}`,
               title,
               description: '',
               project: 'Sin proyecto',
               assignee: 'Sin asignar',
               status,
               priority: 'medium',
               dueDate: null,
               estimatedTime: 0,
               labels: [],
               attachments: 0,
               comments: 0
           };
           
           this.tasks.push(newTask);
           showNotification('Tarea Creada', `${title} añadida a ${status}`, 'success');
           this.refreshTasks();
       }
   }

   toggleTask(taskId) {
       const task = this.tasks.find(t => t.id === taskId);
       if (task) {
           task.status = task.status === 'completed' ? 'todo' : 'completed';
           this.refreshTasks();
           
           const action = task.status === 'completed' ? 'completada' : 'reabierta';
           showNotification('Tarea Actualizada', `${task.title} ha sido ${action}`, 'success');
       }
   }

   editTask(taskId) {
       console.log('Editing task:', taskId);
       // Implement edit functionality
   }

   deleteTask(taskId) {
       if (confirm('¿Estás seguro de eliminar esta tarea?')) {
           this.tasks = this.tasks.filter(t => t.id !== taskId);
           showNotification('Tarea Eliminada', 'La tarea ha sido eliminada', 'success');
           this.refreshTasks();
       }
   }

   // Drag and Drop
   handleDragStart(event, taskId) {
       event.dataTransfer.setData('taskId', taskId);
       event.target.style.opacity = '0.5';
   }

   handleDragOver(event) {
       event.preventDefault();
   }

   handleDrop(event, newStatus) {
       event.preventDefault();
       const taskId = event.dataTransfer.getData('taskId');
       
       const task = this.tasks.find(t => t.id === taskId);
       if (task) {
           task.status = newStatus;
           this.refreshTasks();
           showNotification('Tarea Movida', `${task.title} movida a ${newStatus}`, 'success');
       }
   }

   // Calendar navigation
   previousMonth() {
       console.log('Previous month');
       // Implement calendar navigation
   }

   nextMonth() {
       console.log('Next month');
       // Implement calendar navigation
   }

   showDayTasks(dateString) {
       const date = new Date(dateString);
       const tasks = this.getTasksByDate(date);
       
       console.log(`Tasks for ${date.toLocaleDateString()}:`, tasks);
       // Show tasks in a modal or sidebar
   }

   showFilters() {
       console.log('Show advanced filters');
       // Implement advanced filters modal
   }

   getRandomColor() {
       const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
       return colors[Math.floor(Math.random() * colors.length)];
   }

   async afterRender() {
       // Initialize task-specific functionality
       console.log('Tasks module initialized');
       
       // Add keyboard shortcuts
       document.addEventListener('keydown', (e) => {
           if (e.ctrlKey && e.key === 't') {
               e.preventDefault();
               this.showNewTaskModal();
           }
       });
   }
}

// Export module
if (typeof module !== 'undefined' && module.exports) {
   module.exports = TasksModule;
}