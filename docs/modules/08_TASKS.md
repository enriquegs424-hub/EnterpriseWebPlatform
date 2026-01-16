# PRINCIPAL — Mis Tareas (Sistema Completo Implementado)

## Objetivo
Gestión completa de tareas con asignación, estados, prioridades, vencimientos, comentarios y vínculos a proyectos. Sistema Kanban y calendario incluidos.

## Permisos (RBAC implementado)
- **WORKER**: CRUD en tareas donde es assignee O createdBy
- **MANAGER**: todas las tareas de su equipo + reasignar + cambiar prioridad
- **ADMIN/SUPERADMIN**: acceso total
- **GUEST**: sin acceso (403)

## Navegación
### Rutas existentes
- `/tasks` - Lista principal (tabla)
- `/tasks/kanban` - Vista Kanban
- `/tasks/calendar` - Vista calendario

### Rutas adicionales (probables)
- `/tasks/new` - Crear tarea
- `/tasks/:id` - Detalle de tarea

## Flujos exactos implementados

### 1. Listar tareas
**Server actions:**
- `getAllTasks(filters?)` - Todas las tareas (con RBAC)
- `getMyTasks()` - Solo asignadas al usuario actual

**Filtros disponibles:**
```typescript
{
  status?: TaskStatus
  priority?: TaskPriority
  assignedToId?: string
  projectId?: string
  dueDate?: { from?: Date, to?: Date }
}
```

**RBAC:**
- WORKER: ve solo sus tareas (assignedTo O createdBy)
- MANAGER+: ve tareas del equipo/proyecto
- Filtrado automático por companyId (multi-tenancy)

### 2. Crear tarea
**Server action:** `createTask(data)`
```typescript
{
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  type?: TaskType
  dueDate?: Date
  projectId?: string
  assignedToId?: string
}
```

**Flujo:**
1. Valida permisos (WORKER+ puede crear)
2. Si projectId, verifica que usuario es miembro
3. Crea Task con createdById = currentUser
4. Si assignedToId y es diferente del creador:
   - Crea notificación `TASK_ASSIGNED`
5. Audita: `TASK_CREATED`

### 3. Actualizar tarea
**Server action:** `updateTask(taskId, data)`
```typescript
{
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: Date
  assignedToId?: string
}
```

**Validaciones:**
- Solo assignee, creador o MANAGER+ puede editar
- Si cambia assignedTo: notifica `TASK_REASSIGNED`
- Si cambia a COMPLETED: marca `completedAt`
- Si cambia status: notifica `TASK_STATUS_CHANGED`
- Audita: `TASK_UPDATED`

### 4. Eliminar tarea
**Server action:** `deleteTask(taskId)`
- Solo creador o ADMIN+
- Hard delete (borra comentarios en CASCADE)
- Audita: `TASK_DELETED` (WARNING)

### 5. Añadir comentario
**Server action:** `addTaskComment(taskId, content)`
1. Verifica que usuario puede ver la tarea
2. Crea TaskComment
3. Si content contiene @username:
   - Notifica `TASK_COMMENT_MENTION`
4. Notifica a assignee (si no es el comentarista): `TASK_COMMENT`
5. **No audita** (volumen alto)

### 6. Estadísticas
**Server action:** `getTaskStats(projectId?)`
Retorna:
```typescript
{
  total: number
  byStatus: { [status]: count }
  byPriority: { [priority]: count }
  overdue: number
  completedThisWeek: number
}
```

### 7. Obtener usuarios para asignación
**Server action:** `getUsersForAssignment()`
- Retorna usuarios activos de la companyId
- Filtrado por permisos (WORKER ve solo su equipo)

## Reglas de negocio

### Estados (enum TaskStatus)
```prisma
PENDING       // Nueva, sin iniciar
IN_PROGRESS   // En curso
COMPLETED     // Terminada
CANCELLED     // Cancelada
```

### Prioridades (enum TaskPriority)
```prisma
LOW
MEDIUM
HIGH
URGENT
```

### Tipos (enum TaskType)
```prisma
GENERAL       // Tarea genérica
PROJECT       // Vinculada a proyecto
MEETING       // Reunión
REVIEW        // Revisión
MAINTENANCE   // Mantenimiento
```

### Reglas automáticas
- **Due soon**: Si `dueDate` en próximas 24h y no COMPLETED → notificación `TASK_DUE_SOON`
- **Overdue**: Si `dueDate < today` y no COMPLETED → marcar visualmente
- **Completar**: Al cambiar a COMPLETED → `completedAt = now()`
- **Reabrir**: Si COMPLETED y se cambia status → `completedAt = null`

### Alertas automáticas (job recomendado)
```typescript
// Ejecutar diariamente
- Tareas URGENT + BLOCKED > 48h → notificar MANAGER
- Tareas con dueDate mañana → notificar assignee
```

## Datos (schema completo)

### Task
```prisma
model Task {
  id           String       @id @default(cuid())
  title        String
  description  String?
  status       TaskStatus   @default(PENDING)
  priority     TaskPriority @default(MEDIUM)
  type         TaskType     @default(GENERAL)
  dueDate      DateTime?
  projectId    String?
  assignedToId String?
  createdById  String
  
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  completedAt  DateTime?
  
  // Relations
  project    Project?
  assignedTo User? ("AssignedTasks")
  assignees  User[] ("TaskAssignees") // Multi-assign
  createdBy  User ("CreatedTasks")
  comments   TaskComment[]
}
```

### TaskComment
```prisma
model TaskComment {
  id        String   @id @default(cuid())
  content   String
  taskId    String
  userId    String
  createdAt DateTime @default(now())
  
  task Task @relation(onDelete: Cascade)
  user User
}
```

## Notificaciones

### Tipos implementados
- `TASK_ASSIGNED` - Tarea asignada
- `TASK_REASSIGNED` - Reasignada a otro usuario
- `TASK_STATUS_CHANGED` - Cambio de estado
- `TASK_DUE_SOON` - Vence en 24h
- `TASK_COMMENT` - Nuevo comentario
- `TASK_COMMENT_MENTION` - Mencionado en comentario
- `TASK_COMPLETED` - Tarea marcada como completada

### Destinatarios
- Assigned: assignee
- Comment: assignee + mencionados
- Status change: assignee + creador (si diferente)

## Auditoría
### Eventos registrados
- `TASK_CREATED` (INFO)
- `TASK_UPDATED` (INFO)
- `TASK_DELETED` (WARNING)
- `TASK_STATUS_CHANGED` (INFO - incluye diff)
- `TASK_REASSIGNED` (INFO - incluye before/after assignee)

## Criterios de aceptación
- Given WORKER, When crea tarea sin asignar, Then puede editarla (es creador)
- Given WORKER, When intenta editar tarea no asignada a él, Then 403
- Given tarea con dueDate mañana, When job diario ejecuta, Then assignee recibe notificación
- Given tarea COMPLETED, When se cambia a IN_PROGRESS, Then completedAt se elimina
- Given comentario con @usuario, When se publica, Then usuario recibe notificación prioritaria
- Given MANAGER, When reasigna tarea, Then ambos usuarios (viejo y nuevo) reciben notificación

## Edge cases
- Tarea sin assignee: permitido, se asigna después
- Tarea con proyecto eliminado: projectId → null (SET NULL)
- Múltiples asignados (assignees array): implementado para futura fase multi-assign
- DueDate en el pasado al crear: permitido, marca overdue inmediato
- Cambiar assignee a usuario inactivo: validar isActive = true

## Tests mínimos
```typescript
// RBAC
- worker_cannot_edit_unrelated_task
- manager_can_reassign_team_tasks
- admin_can_see_all_tasks

// Funcionalidad
- create_task_sends_notification_if_assigned
- update_status_to_completed_sets_completedat
- change_assignee_notifies_both_users
- add_comment_with_mention_notifies_user
- delete_task_cascades_comments

// Filtros y búsqueda
- filter_by_status_works
- filter_by_project_shows_only_project_tasks
- my_tasks_shows_only_assigned

// Integración
- project_tasks_only_visible_to_members
- task_created_from_crm_lead_links_correctly
```

## Integraciones con otros módulos
- **Proyectos** (`14_PROJECTS`): Tareas filtradas por proyecto en tab
- **CRM** (`12_CRM`): Crear tarea de seguimiento desde lead
- **Calendario** (`06_CALENDAR`): Vista de tareas por fecha
- **Notificaciones** (`11_NOTIFICATIONS`): Todos los eventos de tareas
- **Dashboard** (`05_HOME_DASHBOARD`): Widget "Tareas de hoy"

## Vistas implementadas

### 1. Vista Lista (`/tasks`)
- Tabla con filtros
- Ordenación por fecha, prioridad, estado
- Acciones rápidas: cambiar estado, asignar

### 2. Vista Kanban (`/tasks/kanban`)
- Columnas por estado
- Drag & drop para cambiar estado
- Filtro por proyecto/assignee

### 3. Vista Calendario (`/tasks/calendar`)
- Tareas en su dueDate
- Color por prioridad
- Click para abrir detalle

## Mejoras pendientes (Roadmap)
- Multi-asignación (assignees array ya existe en schema)
- Subtareas (parent-child relationship)
- Plantillas de tareas
- Etiquetas/tags
- Time tracking integrado
- Checklist dentro de tarea
- Automatizaciones (si X entonces Y)
