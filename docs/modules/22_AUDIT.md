# ADMINISTRACIÓN — Auditoría (Activity Logs)

## Objetivo
Permitir a ADMIN revisar toda la actividad del sistema con filtros y exportación segura.

## Permisos
- **ADMIN/SUPERADMIN**: Acceso completo
- **MANAGER**: Acceso limitado (solo su equipo/departamento)
- **WORKER/GUEST**: Sin acceso

## Navegación
### Rutas existentes
- `/admin/logs` - TBD (implementación recomendada)
- Actualmente implementado en SUPERADMIN (`/superadmin/logs`)

## Datos (schema)

### ActivityLog
```prisma
model ActivityLog {
  id         String   @id @default(cuid())
  userId     String
  user       User
  companyId  String?
  company    Company?
 action     String   // "CREATE", "UPDATE", "DELETE", etc.
  entityType String?  // "task", "invoice", "user", etc.
  entityId   String?
  details    String?  @db.Text  // JSON con before/after
  ipAddress  String?
  userAgent  String?
  createdAt  DateTime @default(now())
  
  @@index([userId])
  @@index([companyId])
  @@index([createdAt])
  @@index([action])
}
```

## Filtros principales
- Rango de fechas
- Actor (userId)
- Entidad (entityType)
- Acción (action)
- Severidad (calculada desde action)

## Niveles de severidad (lógica)
```typescript
CRITICAL: DELETE, ROLE_CHANGE, PASSWORD_CHANGED, *_DELETED
WARNING: STATUS_CHANGE, PERMISSION_CHANGE, EXPORT_*
INFO: CREATE, UPDATE, VIEW_*
```

## Funciones
1. **Listado paginado** - Filtros combinables
2. **Detalle** - Mostrar diff (before/after)
3. **Exportación** - Solo ADMIN+, audita EXPORT_AUDIT_LOGS
4. **Búsqueda** - Por usuario, entidad, fecha

## Eventos críticos (siempre auditar)
- Cambios de usuarios (CREATE/DELETE/ROLE_CHANGE)
- Cambios de permisos
- Eliminaciones importantes
- Exportaciones de datos
- Acceso a información sensible

## Auditoría de la auditoría
- `EXPORT_AUDIT_LOGS` (CRITICAL)
- `VIEW_AUDIT_LOGS` (INFO - opcional)

## Retención
- Recomendado: 2 años mínimo
- Backup periódico de logs
- Archivado de logs antiguos

## Integración
Todos los módulos deben loggear con `logActivity()`

## Tests
- admin_only_export
- filters_work_correctly
- sensitive_data_not_logged (passwords, tokens)
