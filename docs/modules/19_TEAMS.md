# ADMINISTRACIÓN — Equipos (Gestión de Equipos Transversales)

## Objetivo
Organizar usuarios en equipos transversales para proyectos, áreas funcionales y facilitar asignación rápida/colaboración en tareas y chats.

## Permisos (RBAC implementado)
- **ADMIN/SUPERADMIN**: CRUD completo
- **MANAGER**: Gestiona equipos donde es líder (managerId)
- **WORKER**: Lectura de equipos donde es miembro
- **GUEST**: Sin acceso

## Navegación
### Rutas existentes
- `/admin/teams` - Lista de equipos
- `/admin/teams/[id]` - Detalle del equipo

## Flujos exactos implementados

### 1. Listar equipos
**Server action:** `getTeams()`
- Filtrado automático por companyId
- Incluye: manager info + count de miembros
- Ordenado por nombre ASC

### 2. Obtener equipo por ID
**Server action:** `getTeamById(id)`
- Incluye: manager, members array, project vinculado
- Verifica companyId para seguridad

### 3. Crear equipo
**Server action:** `createTeam(data)`
```typescript
{
  name: string
  description?: string
  managerId?: string  // Líder del equipo
}
```

**Flujo:**
1. Valida permisos ("teams", "create")  
2. Crea Team con companyId del usuario
3. Opcionalmente crea chat de grupo para el equipo
4. Audita: `TEAM_CREATED`
5. Revalida `/admin/teams`

### 4. Actualizar equipo
**Server action:** `updateTeam(id, data)`
```typescript
{
  name?: string
  description?: string
  managerId?: string | null
  projectId?: string | null  // Vincular a proyecto
}
```

- Verifica que team pertenezca a companyId
- Audita: `TEAM_UPDATED`
- Revalida rutas

### 5. Eliminar equipo
**Server action:** `deleteTeam(id)`
- Solo ADMIN+ o manager del equipo
- Verifica que no tenga:
  -Proyecto activo vinculado
  - Tareas asignadas al equipo (si existe task.teamId)
- Hard delete por defecto
- Audita: `TEAM_DELETED` (WARNING)

### 6. Añadir miembro
**Server action:** `addTeamMember(teamId, userId)`
- Verifica que usuario esté en misma companyId
- Crea relación User.memberOfTeams
- Notifica: `TEAM_MEMBER_ADDED` al usuario
- Audita: `MEMBER_ADD`

### 7. Quitar miembro
**Server action:** `removeTeamMember(teamId, userId)`
- Elimina relación memberOfTeams
- Notifica: `TEAM_MEMBER_REMOVED`
- Audita: `MEMBER_REMOVE`

### 8. Obtener miembros disponibles
**Server action:** `getAvailableUsers(teamId)`
- Retorna usuarios de la company que NO están en el equipo
- Para dropdown de añadir miembros

## Reglas de negocio

### Relación con proyectos
- Un Team puede tener `projectId` (equipo dedicado a proyecto)
- Un Project puede tener múltiples Team[] vinculados
- Si team tiene proyecto → miembros deberían tener acceso a ese proyecto

### Chat de equipo
- Al crear team, opcionalmente crear Chat GROUP
- Campo `chatId` en Team para referencia
- Chat se sincroniza con miembros del team

### Manager (líder)
- `managerId` es opcional
- Manager puede gestionar su propio equipo (añadir/quitar miembros)
- No tiene permisos especiales fuera de su equipo

## Datos (schema completo)

### Team
```prisma
model Team {
  id          String   @id @default(cuid())
  name        String
  description String?
  companyId   String
  company     Company  @relation(...)
  
  managerId   String?
  manager     User? ("TeamManager")
  
  members     User[] ("TeamMembers")
  
  // Opcional project link
  projectId   String?
  project     Project? ("TeamProject")
  
  // Associated group chat
  chatId      String?
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Relaciones importantes:**
- `User.managedTeams` - Equipos donde es manager
- `User.memberOfTeams` - Equipos donde es miembro
- Many-to-many con User vía relation "TeamMembers"

## Notificaciones
- `TEAM_MEMBER_ADDED` - Añadido a equipo
- `TEAM_MEMBER_REMOVED` - Removido de equipo
- `TEAM_CREATED` - Nuevo equipo creado (a todos los miembros iniciales)

## Auditoría
- `TEAM_CREATED` (INFO)
- `TEAM_UPDATED` (INFO)
- `TEAM_DELETED` (WARNING)
- `MEMBER_ADD` (INFO)
- `MEMBER_REMOVE` (INFO)

## Criterios de aceptación
- Given MANAGER, When gestiona su equipo, Then puede añadir/quitar miembros
- Given MANAGER, When intenta gestionar equipo de otro, Then 403
- Given equipo con proyecto, When se añade miembro, Then miembro debería ver el proyecto
- Given team con chat, When se añade miembro, Then se añade a chat también

## Edge cases
- Team sin manager: permitido
- Team sin miembros: permitido (equipo vacío)
- Eliminar team con proyecto: validar o permitir (proyecto queda sin team)
- Manager eliminado: managerId → null (SET NULL)

## Tests mínimos
```typescript
- admin_can_create_teams
- manager_can_manage_own_team
- add_member_sends_notification
- remove_member_syncs_with_chat
- delete_team_with_project_handled
```

## Integraciones
- **Proyectos** (`14_PROJECTS`): Team.projectId
- **Chat** (`07_CHAT`): Team.chatId (grupo vinculado)
- **Tasks** (`08_TASKS`): Asignar tarea a equipo completo (futuro: task.teamId)
- **Usuarios** (`17_USERS`): Relación many-to-many

## Mejoras pendientes
- **task.teamId** - Asignar tarea a equipo completo
- **Team roles** - Miembro, Lead, Admin dentro del equipo
- **Team chat auto-sync** - Sincronizar automáticamente miembros con chat
- **Team permissions** - Permisos específicos por equipo
- **Team dashboard** - Métricas del equipo
