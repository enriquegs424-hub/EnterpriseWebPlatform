# ADMINISTRACIÓN — Control de Horas (Timesheets Implementado)

## Objetivo
Registrar y aprobar horas trabajadas por usuario con filtros avanzados, estadísticas y exportación para MANAGER+.

## Permisos (RBAC implementado)
- **WORKER**: Registra sus propias horas (ruta `/hours`)
- **MANAGER**: Ve horas de equipo + aprueba (ruta `/admin/hours`)
- **ADMIN/SUPERADMIN**: Ve todas las horas + exporta
- **GUEST**: Sin acceso

## Navegación
### Rutas existentes
- `/hours` - Registro personal (WORKER)
- `/hours/daily` - Vista diaria
- `/hours/summary` - Resumen personal
- `/hours/approvals` - Pendientes de aprobación (MANAGER+)
- `/admin/hours` - Vista global con filtros avanzados (MANAGER+)

## Flujos exactos implementados

### 1. Listar horas (con filtros)
**Server action:** `getAllUsersHours(filters?)`
```typescript
{
  userId?: string
  projectId?: string
  department?: Department
  startDate?: Date
  endDate?: Date
}
```

**RBAC:**
- WORKER: solo sus horas (automático)
- MANAGER: horas de su departamento
- ADMIN+: todas

**Características:**
- Filtrado por múltiples criterios
- Paginación server-side
- Agregados: total horas por usuario/proyecto

### 2. Registrar horas (WORKER)
Implementado en `/hours` pero acción no documentada en admin/hours/actions.ts
Probable: `createTimeEntry(data)`

```typescript
{
  projectId: string
  date: Date
  hours: number
  notes?: string
}
```

### 3. Obtener estadísticas de equipo
**Server action:** `getTeamStats(period)`
```typescript
period: 'week' | 'month' | 'year'
```

**Retorna:**
- Total horas por periodo
- Horas por usuario
- Horas por proyecto
- Comparativa con periodo anterior

### 4. Obtener usuarios para filtrado
**Server action:** `getAllUsers()`
- Retorna usuarios activos de la companyId
- Usado en dropdown de filtro "Usuario"

### 5. Obtener proyectos para filtrado
**Server action:** `getProjects()`
- Retorna proyectos activos
- Usado en dropdown de filtro "Proyecto"

### 6. Obtener departamentos para filtrado
**Server action:** `getDepartments()`
- Retorna lista de departamentos únicos con usuarios
- Para dropdown de filtro "Departamento"

## Workflow de aprobación (pendiente spec)

Basado en schema TimeEntry (simple):
```prisma
model TimeEntry {
  id        String   @id
  userId    String
  projectId String
  date      DateTime
  hours     Float
  notes     String?
  createdAt DateTime
  
  user    User
  project Project
}
```

**Nota:** NO hay campo `status` o `approvedById` en schema actual
- Sistema actual: registro simple sin aprobación
- Para workflow futuro añadir:
  - status: DRAFT | SUBMITTED | APPROVED | REJECTED
  - approvedById, approvedAt
  - rejectionReason

## Reglas de negocio actuales

### Validaciones
- projectId requerido
- hours > 0
- date no puede ser futuro
- No duplicar: mismo userId + projectId + date (validar)

### Filtros implementados
Vista `/admin/hours` tiene filtros por:
- Usuario
- Proyecto
- Departamento
- Rango de fechas (desde/hasta)
- Botón "Limpiar filtros"

### Agregaciones
- Total horas por usuario
- Total horas por proyecto
- Total horas en rango de fechas

## Datos (schema actual)

### TimeEntry
```prisma
model TimeEntry {
  id        String   @id @default(cuid())
  userId    String
  projectId String
  date      DateTime
  hours     Float
  notes     String?
  createdAt DateTime @default(now())
  
  user    User     @relation(...)
  project Project  @relation(...)
  
  @@index([userId, date])
  @@index([projectId])
}
```

**Campos faltantes para workflow completo:**
- status (enum)
- approvedById
- approvedAt
- rejectionReason
- submittedAt

## Notificaciones (recomendadas)
- `TIMESHEET_SUBMITTED` - Horas enviadas a aprobación
- `TIMESHEET_APPROVED` - Horas aprobadas
- `TIMESHEET_REJECTED` - Horas rechazadas

## Auditoría
- `TIMEENTRY_CREATE` (INFO)
- `TIMEENTRY_UPDATE` (INFO)
- `TIMEENTRY_DELETE` (WARNING)
- `TIMESHEET_APPROVE` (INFO - si se implementa)
- `EXPORT_TIMESHEETS` (WARNING)

## Criterios de aceptación
- Given WORKER, When registra horas, Then solo puede registrar en proyectos donde es miembro
- Given MANAGER, When filtra horas, Then ve solo su departamento/companyId
- Given entrada duplicada, When se intenta crear, Then ERROR
- Given filtros aplicados, When se exporta, Then CSV contiene solo datos filtrados

## Edge cases
- Horas muy altas (>24): validar o advertir
- Proyecto eliminado: timeEntries mantienen projectId (no cascade)
- Fechas futuras: rechazar
- Editar horas antiguas: permitir con límite configurable

## Tests mínimos
```typescript
- worker_can_only_register_own_hours
- manager_sees_only_department_hours
- duplicate_entry_rejected
- filters_apply_correctly
- export_respects_filters
```

## Integraciones
- **Proyectos** (`14_PROJECTS`): TimeEntry.projectId requerido
- **Analytics** (`21_ANALYTICS`): Gráficos de horas
- **Usuarios** (`17_USERS`): TimeEntry.userId
- **Invoices** (futuro): Facturación basada en horas

## Vista `/admin/hours` (implementada)

### Filtros
- Usuario (dropdown)
- Proyecto (dropdown)
- Departamento (dropdown)
- Fecha desde
- Fecha hasta
- Botón "Limpiar filtros"

### Tabla
Columnas:
- Usuario
- Proyecto
- Fecha
- Horas
- Notas
- Acciones

### Estadísticas en top
- Total horas en periodo
- Por usuario
- Por proyecto

## Mejoras pendientes (Roadmap)
- **Workflow de aprobación** (critical)
  - Estados: DRAFT, SUBMITTED, APPROVED, REJECTED
  - Aprobación por MANAGER
  - Notificaciones en cada cambio
  - Bloqueo de edición tras aprobación
  
- **Bulk operations**
  - Aprobar múltiples entries
  - Registrar semana completa
  
- **Templates**
  - Repetir semana anterior
  - Horas fijas por proyecto
  
- **Integración exportación**
  - Excel avanzado
  - PDF reportes
  
- **Time tracking real**
  - Timer integrado
  - Iniciar/pausar/completar
  
- **Validaciones avanzadas**
  - Límite daily hours (ej: no más de dailyWorkHours del usuario)
  - Bloqueo edición tras N días
  
- **Dashboard**
  - Vista semanal tipo calendar
  - Gráficos de tendencias
