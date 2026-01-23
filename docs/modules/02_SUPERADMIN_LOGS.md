# SUPERADMIN — Logs Globales

## Objetivo
Permitir al SUPERADMIN auditar cualquier actividad del sistema con filtros avanzados y export seguro.

## Usuarios y permisos
- Solo SUPERADMIN.

## Navegación
- `/superadmin/logs`
- `/superadmin/logs/:id`

## Flujos exactos
1. Entrar a Logs.
2. Filtrar por fecha/actor/entidad/acción/severidad.
3. Abrir detalle.
4. Exportar CSV (si procede).

## Reglas
- Paginación server-side obligatoria.
- No mostrar secretos (tokens/passwords).

## Datos
- Fuente: tabla de auditoría existente (AuditLog).
- Campos: actorId, actionType, entityType, entityId, before/after, severity, metadata, createdAt.

## Notificaciones
- Ninguna.

## Auditoría
- `SUPERADMIN_VIEW_LOGS`
- `EXPORT_AUDIT_LOGS` (CRITICAL)

## Aceptación
- Filtros combinables.
- Detalle muestra diff legible.
- Export genera log CRITICAL.

## Tests
- superadmin_only_access
- export_creates_audit_event
