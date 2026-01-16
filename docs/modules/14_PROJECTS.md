# GESTIÓN — Proyectos (Módulo Central del Sistema)

## Objetivo
Hub central de gestión de proyectos que integra miembros, tareas, documentos, horas, gastos y facturación en una sola vista organizada por tabs.

## Permisos (RBAC implementado)
- **WORKER**: Solo proyectos donde es miembro (ProjectMember o createdBy)
- **MANAGER**: Proyectos de su companyId + puede crear/editar
- **ADMIN/SUPERADMIN**: Acceso total
- **GUEST**: Sin acceso (403)

## Navegación
### Rutas existentes
- `/projects` - Lista de proyectos
- `/projects/[id]` - Detalle del proyecto (hub con tabs)
- `/projects/[id]/tasks` - Tab de tareas del proyecto
- `/projects/[id]/documents` - Tab de documentos
- `/projects/[id]/events` - Tab de eventos/calendario

## Flujos exactos implementados

### 1. Listar proyectos
**Server action:** `getProjects()`
- WORKER: solo ve proyectos donde es miembro
- MANAGER+: ve todos de su companyId
- Incluye: code, name, client, status
- Ordenado por: year DESC, code ASC

### 2. Crear proyecto
**Server action:** `createProject(data)`
```typescript
{
  code: string          // Único, ej: "2024-001"
  name: string
  year: number
  department: Department
  clientId?: string
  isActive?: boolean
}
```

**Flujo:**
1. Valida código único
2. Crea Project con companyId del usuario
3. Automáticamente:
   - Crea carpeta en Documentos (`/Documents/${projectCode}`)
   - Crea Chat de proyecto (type: PROJECT)
   - Añade creador como primer miembro
4. Audita: `PROJECT_CREATED`
5. Notifica: miembros iniciales (si se especifican)

### 3. Obtener detalle
**Server action:** `getProjectDetails(projectId)`
- Verifica RBAC (miembro o MANAGER+)
- Retorna: proyecto + client + members + stats básicas
- **No audita** (lectura frecuente)

### 4. Obtener equipo
**Server action:** `getProjectTeam(projectId)`
- Retorna lista de usuarios vinculados (query heurística)
- Basada en: timeEntries, tasks asignadas, documentos subidos
- **Nota:** No existe tabla ProjectMember, se infiere de actividad

### 5. Actualizar proyecto
**Server action:** `updateProject(projectId, data)`
```typescript
{
  name?: string
  clientId?: string
  department?: Department
  isActive?: boolean
}
```
- Solo MANAGER+ o creador
- Si cambia isActive a false → proyecto archivado
- Audita: `PROJECT_UPDATED`

### 6. Eliminar proyecto
**Server action:** `deleteProject(projectId)`
- Solo ADMIN+
- Verifica que no tenga:
  - Facturas emitidas (ISSUED/PAID)
  - Time entries aprobadas
- Si tiene datos: ERROR "No se puede eliminar"
- Si es seguro: Hard delete → CASCADE elimina tasks, chat, etc.
- Audita: `PROJECT_DELETED` (CRITICAL)

### 7. Estadísticas proyecto
**Server action:** `getProjectStats(projectId)`
```typescript
{
  totalTasks: number
  completedTasks: number
  totalHours: number
  totalExpenses: Decimal
  teamSize: number
  documentsCount: number
}
```

### 8. Estadísticas globales
**Server action:** `getProjectStats()` (sin id)
Retorna agregados de todos los proyectos accesibles

## Reglas de negocio

### Código de proyecto
- Formato común: `YEAR-SEQUENCE` (ej: "2024-001", "2024-002")
- Único a nivel companyId
- No se puede cambiar después de creado

### Departamentos
Usa enum Department:
```prisma
CIVIL_DESIGN, ELECTRICAL, INSTRUMENTATION,
ADMINISTRATION, IT, ECONOMIC, MARKETING, OTHER
```

### Integración automática al crear
1. **Carpeta de documentos**
   - Nombre: código del proyecto
   - parentId: null (raíz)
   - projectId: vinculado

2. **Chat de proyecto**
   - type: PROJECT
   - name: nombre del proyecto
   - miembros: creador inicial

3. **Team** (opcional)
   - Si se crea desde Team → vincula teamId

### Restricciones de eliminación
**NO se puede eliminar si:**
- Tiene facturas emitidas (status != DRAFT)
- Tiene horas aprobadas
- Tiene presupuestos aprobados

**Alternativa:** Marcar `isActive: false` (archivo)

## Datos (schema completo)

### Project
```prisma
model Project {
  id          String      @id @default(cuid())
  code        String      @unique
  name        String
  year        Int
  department  Department  @default(OTHER)
  isActive    Boolean     @default(true)
  companyId   String?
  clientId    String?
  
  // Relations
  company     Company?
  client      Client?
  timeEntries TimeEntry[]
  tasks       Task[]
  documents   Document[]
  folders     Folder[]
  events      Event[]
  Chat        Chat[]
  expenses    Expense[]
  invoices    Invoice[]
  teams       Team[] ("TeamProject")
}
```

**Nota importante:** NO existe ProjectMember table
- Membresía se infiere de:
  - TimeEntry.userId (ha registrado horas)
  - Task.assignedToId (tiene tareas)
  - Document.uploadedById (ha subido docs)
- Para membresía explícita futura: añadir tabla ProjectMember

## Tabs del proyecto (UI)

### Tab "Resumen" (`/projects/[id]`)
- Datos del proyecto
- Cliente vinculado
- Estadísticas rápidas
- Equipo (inferido)
- Acceso rápido a crear tarea/documento

### Tab "Tareas" (`/projects/[id]/tasks`)
- Lista de Task filtradas por projectId
- Botón "Nueva tarea" pre-vinculada
- Vista Kanban opcional

### Tab "Documentos" (`/projects/[id]/documents`)
- Carpeta del proyecto
- Upload rápido
- Versiones

### Tab "Eventos" (`/projects/[id]/events`)
- Calendario del proyecto
- Eventos vinculados a projectId

### Tabs pendientes (recomendadas)
- **Horas**: TimeEntry filtradas
- **Gastos**: Expense filtradas
- **Facturación**: Invoices + Quotes vinculadas

## Notificaciones
- `PROJECT_ASSIGNED` - Añadido a proyecto (si se implementa ProjectMember)
- `PROJECT_UPDATED` - Cambios importantes
- `PROJECT_ARCHIVED` - Proyecto desactivado

## Auditoría
- `PROJECT_CREATED` (INFO)
- `PROJECT_UPDATED` (INFO)
- `PROJECT_DELETED` (CRITICAL)
- `PROJECT_ARCHIVED` (WARNING - isActive → false)
- `PROJECT_RESTORED` (INFO - isActive → true)

## Criterios de aceptación
- Given WORKER, When accede a proyecto donde no es miembro, Then 403
- Given proyecto nuevo, When se crea, Then carpeta y chat se crean automáticamente
- Given proyecto con facturas, When se intenta eliminar, Then ERROR
- Given MANAGER, When cambia department, Then auditoría registra cambio
- Given proyecto archivado, When se reactiva, Then vuelve a lista activa

## Edge cases
- Proyecto sin cliente: permitido (interno)
- Código duplicado: validar antes de crear (unique constraint)
- Cliente eliminado: clientId → null (SET NULL)
- Chat eliminado manualmente: proyecto sigue funcionando
- Carpeta eliminada: proyecto funciona pero tab documentos vacío

## Tests mínimos
```typescript
// RBAC
- worker_cannot_access_non_member_project
- manager_can_access_all_company_projects

// Creación
- create_project_creates_folder_and_chat
- duplicate_code_rejected

// Eliminación
- cannot_delete_project_with_invoices
- can_delete_empty_project

// Integración
- tasks_filtered_by_project_correctly
- documents_in_project_folder_shown
- timeentries_aggregated_correctly
```

## Integraciones con otros módulos
- **Chat** (`07_CHAT`): Auto-created, type PROJECT
- **Documents** (`09_DOCUMENTS`): Carpeta auto-created
- **Tasks** (`08_TASKS`): Filtradas por projectId en tab
- **Clientes** (`13_CLIENTS`): Vinculados por clientId
- **Facturas** (`16_INVOICES`): Vinculadas a proyecto
- **Horas** (`20_TIMESHEETS`): TimeEntry.projectId requerido
- **Teams** (`19_TEAMS`): Team puede tener projectId
- **Gastos** (Expenses): Vinculados a proyecto

## Mejoras pendientes (Roadmap)
- **ProjectMember table** - Membresía explícita con roles (PM, MEMBER, VIEWER)
- **Project status** - PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELED
- **Budget tracking** - Presupuesto vs real
- **Milestones** - Hitos del proyecto
- **Gantt chart** - Vista temporal
- **Templates** - Crear proyecto desde plantilla
- **Archivos compartidos** - Carpeta compartida con cliente
- **Dashboard** - Métricas y KPIs del proyecto
