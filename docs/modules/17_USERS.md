# ADMINISTRACIÓN — Usuarios (Gestión Completa de Usuarios)

## Objetivo
CRUD completo de usuarios con protección especial para cuenta GUEST, gestión de roles, permisos granulares y sistema de invitación.

## Permisos (RBAC implementado)
- **ADMIN/SUPERADMIN**: CRUD completo + cambiar roles
- **MANAGER**: Solo lectura (puede ver usuarios de su equipo)
- **WORKER**: Sin acceso
- **GUEST**: Sin acceso

## Navegación
### Rutas existentes
- `/admin/users` - Lista de usuarios
- Probable: `/admin/users/[id]`, `/admin/users/invite`

## Flujos exactos implementados

### 1. Listar usuarios
**Server action:** `getUsers(params?)`
```typescript
{
  role?: Role
  department?: Department
  isActive?: boolean
  search?: string  // Busca en name/email
}
```

**Filtrado:**
- Automático por companyId (excepto SUPERADMIN)
- Paginación server-side
- Ordenado por: name ASC

### 2. Obtener usuario por ID
**Server action:** `getUserById(id)`
- ADMIN+ puede ver cualquier usuario de su company
- Incluye: permisos, registros de actividad recientes
- **No audita** (lectura)

### 3. Invitar usuario
**Server action:** `inviteUser(data)`
```typescript
{
  email: string
  name: string
  role: Role
  department?: Department
  dailyWorkHours?: number
}
```

**Flujo:**
1. Valida que email no exista
2. Genera password temporal o token de invitación
3. Crea User con isActive: true
4. Envía email invitación (si SMTP configurado)
5. Audita: `USER_CREATED` (CRITICAL)
6. Retorna: userId + password temporal

**Protección GUEST:**
- Si email es del usuario GUEST → ERROR
- Usuario GUEST nunca se puede duplicar

### 4. Actualizar usuario
**Server action:** `updateUser(id, data)`
```typescript
{
  name?: string
  email?: string
  role?: Role
  department?: Department
  dailyWorkHours?: number
  isActive?: boolean
  image?: string
}
```

**Validaciones críticas:**
- **NO** permitir cambiar role del GUEST
- **NO** permitir cambiar email a duplicado
- Si cambiaRole → audita `ROLE_CHANGE` (CRITICAL)
- Si is Active → false: audita `USER_DEACTIVATED` (CRITICAL)
- Solo ADMIN+ puede cambiar roles

### 5. Cambiar contraseña
**Server action:** `changeUserPassword(id, newPassword)`
- Solo ADMIN+ puede cambiar password de otro usuario
- Usuario puede cambiar su propia password (ruta diferente: `/settings`)
- Hash con bcrypt
- Audita: `PASSWORD_CHANGED` (CRITICAL)

### 6. Eliminar usuario
**Server action:** `deleteUser(id)`

**Protección especial:** **NUNCA** eliminar usuario GUEST

**Validaciones:**
1. Verifica que no sea GUEST (email hardcoded o flag)
2. Verifica que no tenga:
   - Time entries aprobadas
   - Facturas emitidas
   - Proyectos donde es único miembro
3. Si tiene datos: Soft delete (`isActive: false`) recomendado
4. Si es seguro: Hard delete
5. Audita: `USER_DELETED` (CRITICAL)

### 7. Obtener permisos de usuario
**Server action:** `getUserPermissions(userId)`
- Retorna Permission[] del usuario
- Usado para UI de gestión de permisos granulares

### 8. Actualizar permisos
**Server action:** `updateUserPermissions(userId, permissions)`
```typescript
{
  resource: string   // "tasks", "expenses", etc.
  action: string     // "create", "update", "approve"
  granted: boolean
}[]
```
- Crea/actualiza Permission records
- Audita: `USER_PERMISSIONS_CHANGED` (WARNING)

## Reglas de negocio

### Usuario GUEST (sistema)
**Características especiales:**
```typescript
{
  email: "invitado@sistema.local" | configurable
  role: GUEST
  isActive: true (siempre)
  isSystemUser: true (flag recomendado)
}
```

**Protecciones:**
- ❌ NO se puede eliminar
- ❌ NO se puede cambiar role
- ❌ NO se puede cambiar email
- ✅ Se puede desactivar (bloquea modo demo)
- Badge especial en UI: "Usuario del Sistema"

### Roles (enum Role)
```prisma
SUPERADMIN  // Multi-company
ADMIN       // Company owner
MANAGER     // Team lead
WORKER      // Standard user
GUEST       // Demo/readonly
```

### Departamentos (enum Department)
```prisma
CIVIL_DESIGN, ELECTRICAL, INSTRUMENTATION,
ADMINISTRATION, IT, ECONOMIC, MARKETING, OTHER
```

### Estado y desactivación
- `isActive: false` → usuario no puede hacer login
- Mantiene datos históricos (horas, tareas, etc.)
- Puede reactivarse (isActive: true)

## Datos (schema completo)

### User
```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  image         String?
  passwordHash  String
  role          Role     @default(WORKER)
  department    Department @default(OTHER)
  companyId     String?
  dailyWorkHours Float   @default(8.0)
  isActive      Boolean  @default(true)
  
  // Presence (Teams-style)
  presenceStatus    PresenceStatus @default(OFFLINE)
  presenceManual    Boolean        @default(false)
  lastActiveAt      DateTime?
  presenceExpiresAt DateTime?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  preferences Json?
  
  // Múltiples relations con otros módulos...
}
```

### Permission (permisos granulares)
```prisma
model Permission {
  id        String   @id
  userId    String
 user      User     @relation(onDelete: Cascade)
  resource  String   // "tasks", "expenses", "documents"
  action    String   // "create", "read", "update", "delete", "approve"
  granted   Boolean  @default(true)
  
  @@unique([userId, resource, action])
}
```

### DepartmentPermission (permisos por departamento)
```prisma
model DepartmentPermission {
  id         String     @id
  department Department
  resource   String
  action     String
  granted    Boolean    @default(true)
  scope      String?    // "all" | "own" | "department"
  
  @@unique([department, resource, action])
}
```

## Detalle de usuario (pantalla)

### Información básica
- Nombre, email, avatar
- Rol, departamento
- Horas diarias configuradas
- Estado activo/inactivo
- Fecha de creación

### Tabs
1. **Actividad** - Últimos 50 logs del usuario
2. **Permisos** - Permission overrides
3. **Proyectos** - Donde participa (inferido de timeEntries/tasks)
4. **Estadísticas** - Horas registradas, tareas completadas

### Badge especial
Si es GUEST → mostrar badge "Sistema" no removible

## Notificaciones
- `USER_INVITED` - Usuario invitado (email)
- `ROLE_CHANGED` - Rol modificado (notifica al usuario)
- `ACCOUNT_DEACTIVATED` - Cuenta desactivada
- `PASSWORD_RESET` - Contraseña cambiada

## Auditoría
### Eventos CRITICAL
- `USER_CREATED`
- `USER_DELETED`
- `ROLE_CHANGE` (incluye before/after)
- `PASSWORD_CHANGED`
- `USER_DEACTIVATED`
- `USER_REACTIVATED`

### Eventos WARNING
- `USER_UPDATED` (cambios generales)
- `USER_PERMISSIONS_CHANGED`

## Criterios de aceptación
- Given usuario GUEST, When ADMIN intenta eliminar, Then ERROR "Usuario del sistema protegido"
- Given usuario GUEST, When se intenta cambiar role, Then ERROR
- Given usuario con horas aprobadas, When se intenta eliminar, Then ERROR o soft delete
- Given MANAGER, When intenta cambiar role de usuario, Then 403
- Given ADMIN, When cambia role, Then auditoría registra before/after
- Given usuario invitado, When recibe email, Then contiene link de activación

## Edge cases
- Email duplicado: validar antes de crear/actualizar
- Usuario sin companyId: solo válido para SUPERADMIN
- Cambiar a rol inferior: permitido pero auditar
- Desactivar único ADMIN: advertir pero permitir
- Usuario con mismo email en otra company: permitido (multi-tenancy)

## Tests mínimos
```typescript
// Protección GUEST
- cannot_delete_guest_user
- cannot_change_guest_role
- guest_user_always_in_seed

// RBAC
- manager_cannot_change_roles
- admin_can_crud_users_in_company
- worker_cannot_access_user_management

// Funcionalidad
- invite_user_creates_and_notifies
- deactivate_user_blocks_login
- role_change_creates_critical_audit
- duplicate_email_rejected

// Permisos granulares
- permission_override_applied_correctly
- department_permissions_inherited
```

## Integraciones con otros módulos
- **Auth**: Login/logout vinculado a isActive
- **Presence**: presenceStatus gestionado en User
- **Teams** (`19_TEAMS`): User.memberOfTeams
- **Projects** (`14_PROJECTS`): Inferido de actividad
- **Tasks** (`08_TASKS`): assignedTo, createdBy
- **Timesheets** (`20_TIMESHEETS`): TimeEntry.userId
- **Todos los módulos**: Filtrado por companyId automático

## Mejoras pendientes (Roadmap)
- **Two-Factor Auth** (2FA)
- **SSO** (SAML, OAuth)
- **Invitación bulk** (CSV upload)
- **Grupos de usuarios** para permisos
- **Firma digital** del usuario
- **Foto/avatar** upload
- **Última conexión** tracking
- **Failed login attempts** counter
- **Auto-deactivate** usuarios inactivos X días
